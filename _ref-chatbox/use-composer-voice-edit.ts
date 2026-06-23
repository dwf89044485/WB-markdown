"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useVoiceHold } from "@/components/home/use-voice-hold";
import { useAppStore } from "@/stores";
import type { ComposerCore } from "./use-composer-core";

/**
 * useComposerVoiceEdit — 语音编辑状态机
 *
 * 管理：
 * - 语音长按交互（hold → transcript → commit/cancel）
 * - 语音编辑模式（text editing via voice transcription）
 * - Voice overlay 显示/隐藏
 * - 与 core state machine 的协调（expanded, voiceMode, keyboard）
 */
export function useComposerVoiceEdit(core: ComposerCore) {
  const {
    setExpanded,
    setRecording,
    setVoiceMode,
    setHasKeyboard,
    setFullScreen,
    textareaRef,
    sendButtonRef,
    savedTranscriptRef,
    pendingFocusRef,
    pendingSubmitRef,
    pendingSubmitTextRef,
    setHiddenComposerValue,
  } = core;

  // ── Voice edit state ──
  const [voiceOverlayOpen, setVoiceOverlayOpen] = useState(false);
  const [voiceEditMode, setVoiceEditMode] = useState(false);
  const [voiceEditText, setVoiceEditText] = useState("");
  const [voiceEditKeyboardOpen, setVoiceEditKeyboardOpen] = useState(false);
  const [voiceEditKeyboardHeight, setVoiceEditKeyboardHeight] = useState(0);

  const voiceEditTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  const voiceEditLiveRef = useRef({ active: false, baseText: "", selectionStart: 0, selectionEnd: 0 });

  // ── Voice edit transcript helpers ──

  const writeVoiceEditTranscript = useCallback((transcript: string) => {
    const textarea = voiceEditTextareaRef.current;
    const { baseText, selectionStart, selectionEnd } = voiceEditLiveRef.current;
    const nextText = `${baseText.slice(0, selectionStart)}${transcript}${baseText.slice(selectionEnd)}`;
    const nextCursor = selectionStart + transcript.length;
    setVoiceEditText(nextText);
    requestAnimationFrame(() => {
      if (!textarea) return;
      textarea.focus({ preventScroll: true });
      textarea.setSelectionRange(nextCursor, nextCursor);
    });
  }, []);

  const insertTranscriptAtSelection = useCallback((transcript: string) => {
    const textarea = voiceEditTextareaRef.current;
    if (!textarea) {
      setVoiceEditText((current) => `${current}${transcript}`);
      return;
    }
    voiceEditLiveRef.current = {
      active: true,
      baseText: textarea.value,
      selectionStart: textarea.selectionStart ?? textarea.value.length,
      selectionEnd: textarea.selectionEnd ?? textarea.selectionStart ?? textarea.value.length,
    };
    writeVoiceEditTranscript(transcript);
    voiceEditLiveRef.current.active = false;
  }, [writeVoiceEditTranscript]);

  const replaceVoiceEditSelection = useCallback((insertText: string) => {
    const textarea = voiceEditTextareaRef.current;
    if (!textarea) {
      setVoiceEditText((current) => `${current}${insertText}`);
      return;
    }
    const current = textarea.value;
    const start = textarea.selectionStart ?? current.length;
    const end = textarea.selectionEnd ?? start;
    const nextText = `${current.slice(0, start)}${insertText}${current.slice(end)}`;
    const nextCursor = start + insertText.length;
    setVoiceEditText(nextText);
    requestAnimationFrame(() => {
      textarea.focus({ preventScroll: true });
      textarea.setSelectionRange(nextCursor, nextCursor);
    });
  }, []);

  const deleteVoiceEditSelection = useCallback(() => {
    const textarea = voiceEditTextareaRef.current;
    if (!textarea) {
      setVoiceEditText((current) => current.slice(0, -1));
      return;
    }
    const current = textarea.value;
    const start = textarea.selectionStart ?? current.length;
    const end = textarea.selectionEnd ?? start;
    if (start === 0 && end === 0) return;
    const deleteStart = start === end ? Math.max(0, start - 1) : start;
    const nextText = `${current.slice(0, deleteStart)}${current.slice(end)}`;
    setVoiceEditText(nextText);
    requestAnimationFrame(() => {
      textarea.focus({ preventScroll: true });
      textarea.setSelectionRange(deleteStart, deleteStart);
    });
  }, []);

  const handleVoiceEditKeyboardChange = useCallback((nextValue: string) => {
    if (nextValue.length > voiceEditText.length) {
      replaceVoiceEditSelection(nextValue.slice(voiceEditText.length));
      return;
    }
    if (nextValue.length < voiceEditText.length) {
      deleteVoiceEditSelection();
      return;
    }
    setVoiceEditText(nextValue);
  }, [deleteVoiceEditSelection, replaceVoiceEditSelection, voiceEditText]);

  // ── Voice commit / cancel ──

  const handleVoiceCommit = useCallback((transcript: string, mode: "send" | "edit") => {
    setRecording(false);

    if (voiceEditMode) {
      if (voiceEditLiveRef.current.active) {
        writeVoiceEditTranscript(transcript);
        voiceEditLiveRef.current.active = false;
      } else {
        insertTranscriptAtSelection(transcript);
      }
      setVoiceOverlayOpen(true);
      setVoiceMode(true);
      setExpanded(false);
      setFullScreen(false);
      return;
    }

    if (mode === "send") {
      setVoiceMode(false);
      setVoiceOverlayOpen(false);
      savedTranscriptRef.current = transcript;
      pendingSubmitRef.current = false;
      pendingSubmitTextRef.current = "";
      pendingFocusRef.current = false;
      setVoiceEditMode(false);
      setExpanded(true);
      setHasKeyboard(false);
      requestAnimationFrame(() => {
        setTimeout(() => {
          const textarea = textareaRef.current;
          if (textarea) {
            const nativeSetter = Object.getOwnPropertyDescriptor(
              window.HTMLTextAreaElement.prototype, "value"
            )?.set;
            nativeSetter?.call(textarea, transcript);
            textarea.dispatchEvent(new Event("input", { bubbles: true }));
            requestAnimationFrame(() => {
              sendButtonRef.current?.click();
              setTimeout(() => {
                setExpanded(false);
                setHasKeyboard(false);
              }, 0);
            });
          }
        }, 50);
      });
    } else {
      savedTranscriptRef.current = "";
      pendingSubmitRef.current = false;
      pendingSubmitTextRef.current = "";
      pendingFocusRef.current = false;
      setVoiceEditText(transcript);
      setVoiceOverlayOpen(true);
      setVoiceEditMode(true);
      setVoiceMode(true);
      setExpanded(false);
      setHasKeyboard(false);
      setFullScreen(false);
    }
  }, [insertTranscriptAtSelection, voiceEditMode, writeVoiceEditTranscript, setRecording, setVoiceMode, setExpanded, setFullScreen, setHasKeyboard, textareaRef, sendButtonRef, savedTranscriptRef, pendingSubmitRef, pendingSubmitTextRef, pendingFocusRef]);

  const handleVoiceCancel = useCallback(() => {
    if (voiceEditMode) {
      const textarea = voiceEditTextareaRef.current;
      if (textarea && voiceEditLiveRef.current.active) {
        const { baseText, selectionStart, selectionEnd } = voiceEditLiveRef.current;
        setVoiceEditText(baseText);
        requestAnimationFrame(() => {
          textarea.focus({ preventScroll: true });
          textarea.setSelectionRange(selectionStart, selectionEnd);
        });
      }
      voiceEditLiveRef.current.active = false;
      setVoiceOverlayOpen(true);
      setExpanded(false);
      setHasKeyboard(false);
      setVoiceMode(true);
      return;
    }
    setVoiceOverlayOpen(false);
    setVoiceMode(false);
    setExpanded(false);
    setHasKeyboard(false);
    setFullScreen(false);
  }, [voiceEditMode, setExpanded, setHasKeyboard, setVoiceMode, setFullScreen]);

  // ── Voice hold integration ──

  const setVoiceHoldActive = useAppStore((s) => s.setVoiceHoldActive);
  const acquirePageGestureLock = useAppStore((s) => s.acquirePageGestureLock);
  const releasePageGestureLock = useAppStore((s) => s.releasePageGestureLock);
  const clearPageGestureLocksByOwner = useAppStore((s) => s.clearPageGestureLocksByOwner);
  const handleHoldingChange = useCallback((nextHolding: boolean) => {
    setVoiceHoldActive(nextHolding && !voiceEditMode);
  }, [setVoiceHoldActive, voiceEditMode]);

  const {
    holding,
    holdingTranscript,
    swipeDirection,
    handlePointerDown: handleVoiceHoldStart,
  } = useVoiceHold({
    onCommit: handleVoiceCommit,
    onCancel: handleVoiceCancel,
    onHoldingChange: handleHoldingChange,
  });

  // ── Discard / Submit in voice edit ──

  const discardVoiceEdit = useCallback(() => {
    voiceEditLiveRef.current.active = false;
    setVoiceEditText("");
    setVoiceEditKeyboardOpen(false);
    setVoiceEditMode(false);
    setVoiceOverlayOpen(false);
    setVoiceMode(false);
    setExpanded(false);
    setHasKeyboard(false);
    setFullScreen(false);
  }, [setExpanded, setHasKeyboard, setVoiceMode, setFullScreen]);

  const submitVoiceEdit = useCallback(() => {
    const text = voiceEditText.trim();
    if (!text) return;
    voiceEditLiveRef.current.active = false;
    setHiddenComposerValue(text);
    requestAnimationFrame(() => {
      sendButtonRef.current?.click();
      setVoiceEditText("");
      setVoiceEditKeyboardOpen(false);
      setVoiceEditMode(false);
      setVoiceOverlayOpen(false);
      setVoiceMode(false);
      setExpanded(false);
      setHasKeyboard(false);
      setFullScreen(false);
    });
  }, [voiceEditText, setHiddenComposerValue, sendButtonRef, setExpanded, setHasKeyboard, setVoiceMode, setFullScreen]);

  // ── Effects ──

  useEffect(() => {
    if (voiceEditMode) setVoiceHoldActive(false);
  }, [setVoiceHoldActive, voiceEditMode]);

  useEffect(() => {
    const lockOwner = "composer-voice-input";
    const shouldLockSidebar = core.voiceMode || voiceOverlayOpen || voiceEditMode || holding;
    if (shouldLockSidebar) {
      acquirePageGestureLock("sidebar", lockOwner);
    } else {
      releasePageGestureLock("sidebar", lockOwner);
    }
    return () => {
      clearPageGestureLocksByOwner(lockOwner);
    };
  }, [
    acquirePageGestureLock,
    clearPageGestureLocksByOwner,
    core.voiceMode,
    holding,
    releasePageGestureLock,
    voiceEditMode,
    voiceOverlayOpen,
  ]);

  // Sync keyboard height for voice edit
  useEffect(() => {
    const syncKeyboardHeight = () => {
      if (!voiceEditKeyboardOpen) {
        setVoiceEditKeyboardHeight(0);
        return;
      }
      const value = getComputedStyle(document.documentElement)
        .getPropertyValue("--virtual-keyboard-panel-height")
        .trim();
      const nextHeight = Number.parseFloat(value);
      setVoiceEditKeyboardHeight(Number.isFinite(nextHeight) ? nextHeight : 0);
    };
    requestAnimationFrame(syncKeyboardHeight);
    const observer = new MutationObserver(syncKeyboardHeight);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["style"] });
    window.addEventListener("resize", syncKeyboardHeight);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", syncKeyboardHeight);
    };
  }, [voiceEditKeyboardOpen]);

  // Live transcript update during hold in edit mode
  useEffect(() => {
    if (!voiceEditMode || !holding || !voiceEditLiveRef.current.active) return;
    writeVoiceEditTranscript(holdingTranscript);
  }, [holding, holdingTranscript, voiceEditMode, writeVoiceEditTranscript]);

  return {
    // State
    voiceOverlayOpen,
    voiceEditMode,
    voiceEditText,
    voiceEditKeyboardOpen,
    voiceEditKeyboardHeight,
    holding,
    holdingTranscript,
    swipeDirection,

    // Refs
    voiceEditTextareaRef,
    voiceEditLiveRef,

    // Actions
    setVoiceOverlayOpen,
    setVoiceEditMode,
    setVoiceEditText,
    setVoiceEditKeyboardOpen,
    handleVoiceHoldStart,
    handleVoiceCommit,
    handleVoiceCancel,
    handleVoiceEditKeyboardChange,
    discardVoiceEdit,
    submitVoiceEdit,
  };
}

export type ComposerVoiceEdit = ReturnType<typeof useComposerVoiceEdit>;
