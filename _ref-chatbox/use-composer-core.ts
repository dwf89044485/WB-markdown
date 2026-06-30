"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { flushSync } from "react-dom";
import { useAuiState } from "@assistant-ui/react";
import { useAppStore } from "@/stores";

const COMPOSER_TEXTAREA_MAX_HEIGHT = 200;
const KEYBOARD_POINTER_LOCK_MS = 120;

const COMPOSER_PRELOAD_ASSETS = [
  "/icons/plus-button.svg",
  "/icons/send-button.svg",
  "/icons/mic-button.svg",
  "/icons/composer-expand-v2.svg",
  "/icons/composer-collapse-v2.svg",
  "/icons/keyboard-button.svg",
  "/icons/voice-hold-delete-icon.svg",
  "/icons/voice-hold-send-icon.svg",
  "/icons/voice-hold-edit-icon.svg",
  "/voice-glow.png",
] as const;

function preloadComposerAssets() {
  COMPOSER_PRELOAD_ASSETS.forEach((asset) => {
    const image = new Image();
    image.src = asset;
    void image.decode?.().catch(() => undefined);
  });
}

export interface ComposerCoreOptions {
  /** Force states for preview/storybook mode */
  forceExpanded?: boolean;
  forceRecording?: boolean;
  forceHasKeyboard?: boolean;
  forceVoiceMode?: boolean;
  forceChip?: { id: string; label: string; suggestions: string[]; placeholder?: string } | null;
  frozen?: boolean;
  inConversation?: boolean;
  /** CSS class for textarea fallback selector (default: "chatboxgreenTextarea") */
  textareaSelector?: string;
}

/**
 * useComposerCore — 输入框核心状态机
 *
 * 管理：
 * - expanded / collapsed 状态
 * - keyboard 显示状态
 * - voiceMode 状态
 * - recording 状态
 * - fullScreen 状态
 * - chip（专家标签）系统
 * - textarea DOM 操作（focus / value / height sync）
 * - 与 composer:chip 事件的桥接
 */
export function useComposerCore(options: ComposerCoreOptions = {}) {
  const {
    forceExpanded,
    forceRecording,
    forceHasKeyboard,
    forceVoiceMode,
    forceChip,
    frozen,
    inConversation,
    textareaSelector = "chatboxgreenTextarea",
  } = options;

  // ── Internal state ──
  const [_expanded, setExpanded] = useState(forceExpanded ?? false);
  const [_recording, setRecording] = useState(forceRecording ?? false);
  const [_voiceMode, setVoiceMode] = useState(forceVoiceMode ?? false);
  const [_hasKeyboard, setHasKeyboard] = useState(forceHasKeyboard ?? false);
  const [_chip, setChip] = useState(forceChip?.label ?? null);
  const [_chipId, setChipId] = useState<string>(forceChip?.id ?? "");
  const [_chipSuggestions, setChipSuggestions] = useState<string[]>(forceChip?.suggestions ?? []);
  const [chipPlaceholder, setChipPlaceholder] = useState(forceChip?.placeholder ?? "");
  const [lineCount, setLineCount] = useState(1);
  const [addPanelOpen, setAddPanelOpen] = useState(false);
  const [fullScreen, setFullScreen] = useState(false);

  // ── Resolved state (force props override internals) ──
  const expanded = forceExpanded ?? _expanded;
  const recording = forceRecording ?? _recording;
  const voiceMode = forceVoiceMode ?? _voiceMode;
  const hasKeyboard = forceHasKeyboard ?? _hasKeyboard;
  const chip = forceChip !== undefined ? (forceChip?.label ?? null) : _chip;
  const chipId = forceChip !== undefined ? (forceChip?.id ?? "") : _chipId;
  const chipSuggestions = forceChip !== undefined ? (forceChip?.suggestions ?? []) : _chipSuggestions;

  // ── assistant-ui state ──
  const composerText = useAuiState((s) => s.composer.text);
  const attachmentCount = useAuiState((s) => s.composer.attachments.length);
  const hasComposerContent = composerText.trim().length > 0 || attachmentCount > 0;
  const virtualKeyboardOpen = useAppStore((s) => s.virtualKeyboardOpen);

  // ── Refs ──
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const sendButtonRef = useRef<HTMLButtonElement | null>(null);
  const hiddenComposerRef = useRef<HTMLTextAreaElement | null>(null);
  const pendingFocusRef = useRef(false);
  const pendingSubmitRef = useRef(false);
  const pendingSubmitTextRef = useRef("");
  const savedTranscriptRef = useRef("");
  const suppressEmptyCollapseRef = useRef(false);
  const suppressBlurForRecordingRef = useRef(false);
  const hadKeyboardBeforeRecordingRef = useRef(false);
  const keyboardPointerLockRef = useRef(false);
  const keyboardPointerReleaseTimerRef = useRef<number | null>(null);
  const prevAttachmentCountRef = useRef(attachmentCount);

  // ── Preload frequently-used assets ──
  useEffect(() => {
    const run = () => preloadComposerAssets();
    const requestIdle = window.requestIdleCallback;

    if (typeof requestIdle === "function") {
      const idleId = requestIdle(() => run());
      return () => {
        window.cancelIdleCallback?.(idleId);
      };
    }

    const timeoutId = window.setTimeout(run, 0);
    return () => {
      window.clearTimeout(timeoutId);
    };
  }, []);

  // ── Textarea DOM helpers ──

  const getComposerTextarea = useCallback(() => {
    return (
      textareaRef.current ??
      document.querySelector<HTMLTextAreaElement>(`.${textareaSelector}`)
    );
  }, [textareaSelector]);

  const syncTextareaHeight = useCallback((textarea: HTMLTextAreaElement) => {
    if (fullScreen) {
      // In fullscreen: CSS (h-full inside flex-1) handles height; just enable scrolling
      textarea.style.height = "100%";
      textarea.style.overflowY = "auto";
      const nextLines = Math.max(4, Math.round(textarea.scrollHeight / 20));
      setLineCount(nextLines);
      return;
    }
    textarea.style.height = "auto";
    const nextHeight = Math.min(textarea.scrollHeight, COMPOSER_TEXTAREA_MAX_HEIGHT);
    textarea.style.height = `${nextHeight}px`;
    textarea.style.overflowY = textarea.scrollHeight > COMPOSER_TEXTAREA_MAX_HEIGHT ? "auto" : "hidden";
    textarea.scrollTop = textarea.scrollHeight;
    const nextLines = Math.max(1, Math.round(nextHeight / 20));
    setLineCount(nextLines);
  }, [fullScreen]);

  const focusComposerTextarea = useCallback((textarea?: HTMLTextAreaElement | null, moveCursorToEnd = true) => {
    const el = textarea ?? getComposerTextarea();
    if (!el) return false;
    textareaRef.current = el;
    el.focus({ preventScroll: true });
    if (moveCursorToEnd) {
      const cursor = el.value.length;
      el.setSelectionRange(cursor, cursor);
    }
    return document.activeElement === el;
  }, [getComposerTextarea]);

  const setComposerValue = useCallback((nextText: string, cursorPos?: number) => {
    const textarea = getComposerTextarea();
    if (!textarea) return;
    textareaRef.current = textarea;
    const nativeSetter = Object.getOwnPropertyDescriptor(
      window.HTMLTextAreaElement.prototype,
      "value",
    )?.set;
    nativeSetter?.call(textarea, nextText);
    textarea.dispatchEvent(new Event("input", { bubbles: true }));
    if (cursorPos !== undefined) {
      // 在 dispatchEvent 之后同步设置光标，防止 nativeSetter 把光标打到末尾
      textarea.setSelectionRange(cursorPos, cursorPos);
    }
    syncTextareaHeight(textarea);
  }, [getComposerTextarea, syncTextareaHeight]);

  const keepComposerFocused = useCallback(() => {
    keyboardPointerLockRef.current = true;
    if (keyboardPointerReleaseTimerRef.current !== null) {
      window.clearTimeout(keyboardPointerReleaseTimerRef.current);
    }
    keyboardPointerReleaseTimerRef.current = window.setTimeout(() => {
      keyboardPointerLockRef.current = false;
      keyboardPointerReleaseTimerRef.current = null;
    }, KEYBOARD_POINTER_LOCK_MS);
    const textarea = getComposerTextarea();
    if (!textarea || !expanded) return;
    textareaRef.current = textarea;
    // 同步 focus 保活 — 不走 rAF，避免一帧间隙导致光标消失
    focusComposerTextarea(textarea, false);
    setHasKeyboard(true);
  }, [expanded, getComposerTextarea, focusComposerTextarea]);

  const setHiddenComposerValue = useCallback((nextText: string) => {
    const textarea = hiddenComposerRef.current;
    if (!textarea) return;
    const nativeSetter = Object.getOwnPropertyDescriptor(
      window.HTMLTextAreaElement.prototype,
      "value",
    )?.set;
    nativeSetter?.call(textarea, nextText);
    textarea.dispatchEvent(new Event("input", { bubbles: true }));
  }, []);

  // ── Chip management ──

  const clearChip = useCallback(() => {
    setChip(null);
    setChipId("");
    setChipSuggestions([]);
    setChipPlaceholder("");
  }, []);

  // ── State transition actions ──

  const activateComposerInput = useCallback(() => {
    pendingFocusRef.current = true;
    flushSync(() => {
      setVoiceMode(false);
      setExpanded(true);
      // 注意：这里不设 setHasKeyboard(true)，先让 textarea 挂载并获取焦点
      setFullScreen(false);
    });
    if (focusComposerTextarea()) {
      pendingFocusRef.current = false;
    } else {
      requestAnimationFrame(() => {
        if (focusComposerTextarea()) pendingFocusRef.current = false;
      });
    }
    // 延后一帧再打开键盘面板，确保浏览器先建立光标
    requestAnimationFrame(() => {
      setHasKeyboard(true);
    });
  }, [focusComposerTextarea]);

  const enterFullScreen = useCallback(() => {
    if (!expanded || lineCount < 4 || voiceMode) return;
    setFullScreen(true);
    keepComposerFocused();
  }, [expanded, lineCount, voiceMode, keepComposerFocused]);

  const exitFullScreen = useCallback(() => {
    setFullScreen(false);
    keepComposerFocused();
  }, [keepComposerFocused]);

  const clearComposer = useCallback(() => {
    setComposerValue("");
    setLineCount(1);
    clearChip();
    requestAnimationFrame(() => keepComposerFocused());
  }, [setComposerValue, clearChip, keepComposerFocused]);

  // ── Event handlers for textarea ──

  const handleTextareaFocus = useCallback((textarea: HTMLTextAreaElement) => {
    textareaRef.current = textarea;
    setVoiceMode(false);
    // 延后一帧打开键盘面板，避免布局变动打断浏览器光标建立
    requestAnimationFrame(() => {
      setHasKeyboard(true);
    });
  }, []);

  const handleTextareaBlur = useCallback((textarea: HTMLTextAreaElement) => {
    textareaRef.current = textarea;
    if (suppressBlurForRecordingRef.current) return;
    // 虚拟键盘键位点击会短暂触发 blur，优先走焦点保活，避免光标丢失
    if (keyboardPointerLockRef.current) {
      // 同步恢复焦点，不走 rAF — 防止一帧空隙导致光标消失
      keepComposerFocused();
      return;
    }
    if (addPanelOpen) {
      setHasKeyboard(false);
      return;
    }
    if (virtualKeyboardOpen) {
      requestAnimationFrame(() => {
        const active = document.activeElement as HTMLElement | null;
        const activeInsideVirtualKeyboard = !!active?.closest(".wb-virtual-keyboard");
        if (!activeInsideVirtualKeyboard && active !== document.body) return;
        keepComposerFocused();
      });
      return;
    }
    requestAnimationFrame(() => {
      if (document.activeElement !== textareaRef.current) {
        setHasKeyboard(false);
        if (addPanelOpen) {
          return;
        }
        if (suppressEmptyCollapseRef.current) {
          suppressEmptyCollapseRef.current = false;
          return;
        }
        if (!textareaRef.current?.value && attachmentCount === 0) setExpanded(false);
      }
    });
  }, [virtualKeyboardOpen, keepComposerFocused, attachmentCount, addPanelOpen]);

  const handleTextareaInput = useCallback((textarea: HTMLTextAreaElement) => {
    textareaRef.current = textarea;
    syncTextareaHeight(textarea);
  }, [syncTextareaHeight]);

  const handleTextareaPointerDown = useCallback((textarea: HTMLTextAreaElement) => {
    textareaRef.current = textarea;
    setVoiceMode(false);
    // 延后一帧再打开键盘面板：让浏览器先完成本次点击的 focus + 光标建立，
    // 再做 DOM 布局变动（VirtualKeyboardPanel 展开）。
    // 如果同帧内就改布局，浏览器会丢弃刚建立的光标状态。
    requestAnimationFrame(() => {
      setHasKeyboard(true);
    });
  }, []);

  const handleSuggestionClick = useCallback((text: string) => {
    setExpanded(true);
    setHasKeyboard(true);
    setVoiceMode(false);
    setComposerValue(text);
    clearChip();
    requestAnimationFrame(() => keepComposerFocused());
  }, [setComposerValue, clearChip, keepComposerFocused]);

  // ── Effects ──

  // Chip command from store (replaces composer:chip event)
  const pendingChipCommand = useAppStore((s) => s.pendingChipCommand);
  useEffect(() => {
    if (!pendingChipCommand) return;
    // 外部信号 → 本地状态批量同步：不存在循环（依赖只看 pendingChipCommand）
    // 长期重构方向是把 chip 状态搬到 store，结构性改动暂缓
    /* eslint-disable react-hooks/set-state-in-effect */
    setChip(pendingChipCommand.label);
    setChipId(pendingChipCommand.id ?? "");
    setChipSuggestions(pendingChipCommand.suggestions);
    setChipPlaceholder(pendingChipCommand.placeholder ?? "");
    setVoiceMode(false);

    const textarea = textareaRef.current;
    if (textarea) {
      pendingFocusRef.current = false;
      setExpanded(true);
      setHasKeyboard(true);
      requestAnimationFrame(() => textarea.focus({ preventScroll: true }));
    } else {
      pendingFocusRef.current = true;
      setExpanded(true);
      setHasKeyboard(true);
    }
    /* eslint-enable react-hooks/set-state-in-effect */

    // Clear after processing
    useAppStore.getState().clearChipCommand();
  }, [pendingChipCommand]);

  // Pending composer text from store（"用同款" 等场景预填输入框）
  const pendingComposerText = useAppStore((s) => s.pendingComposerText);
  useEffect(() => {
    if (!pendingComposerText) return;

    // 仿 pendingChipCommand 模式：先捕获本地副本，立即清 store，避免：
    // 1. effect 依赖变动导致二次进入时重复填值
    // 2. 用户连续 setPendingComposerText 同一字符串被 Zustand "值未变"逻辑吞掉
    const textToFill = pendingComposerText;
    useAppStore.getState().clearPendingComposerText();

    /* eslint-disable react-hooks/set-state-in-effect */
    // 外部信号 → 本地状态批量同步：不存在循环（依赖只看 pendingComposerText）
    setExpanded(true);
    setHasKeyboard(true);
    setVoiceMode(false);
    /* eslint-enable react-hooks/set-state-in-effect */

    // 等下一帧让 expanded 生效，textarea 才能拿到 ref
    requestAnimationFrame(() => {
      // TODO(plan-T7): textarea 一帧内未挂载时 setComposerValue 会静默 no-op，
      // 预填文字会丢。Task 12 联调若复现，加 pendingFocusRef 风格的延后填入降级。
      setComposerValue(textToFill);
      // 不强制 focus，避免移动端被误唤起键盘——
      // expanded=true 已经把输入框展开，用户点一下就能编辑发送
    });
  }, [pendingComposerText, setComposerValue]);

  // Handle expansion + pending focus
  useEffect(() => {
    if (!expanded) return;
    const textarea = getComposerTextarea();
    if (!textarea) {
      if (pendingFocusRef.current) {
        requestAnimationFrame(() => {
          const delayedTextarea = getComposerTextarea();
          if (!delayedTextarea) return;
          textareaRef.current = delayedTextarea;
          pendingFocusRef.current = false;
          setHasKeyboard(true);
          focusComposerTextarea(delayedTextarea);
        });
      }
      return;
    }
    textareaRef.current = textarea;
    if (savedTranscriptRef.current) {
      const nativeSetter = Object.getOwnPropertyDescriptor(
        window.HTMLTextAreaElement.prototype, "value"
      )?.set;
      nativeSetter?.call(textarea, savedTranscriptRef.current);
      textarea.dispatchEvent(new Event("input", { bubbles: true }));
      savedTranscriptRef.current = "";
    }
    // DOM 测量 → 行数状态：合法模式（参考 ResizeObserver），无循环风险
    // eslint-disable-next-line react-hooks/set-state-in-effect
    syncTextareaHeight(textarea);
    if (pendingFocusRef.current) {
      pendingFocusRef.current = false;
      setHasKeyboard(true);
      requestAnimationFrame(() => focusComposerTextarea(textarea));
    }
  }, [expanded, fullScreen, getComposerTextarea, focusComposerTextarea, syncTextareaHeight]);

  // Pending submit (for voice send flow)
  useEffect(() => {
    if (!expanded || !pendingSubmitRef.current) return;
    const expectedText = pendingSubmitTextRef.current.trim();
    if (!expectedText || composerText.trim() !== expectedText) return;
    const sendButton = sendButtonRef.current;
    if (!sendButton) return;
    pendingSubmitRef.current = false;
    pendingSubmitTextRef.current = "";
    requestAnimationFrame(() => {
      sendButton.click();
      setExpanded(false);
      setHasKeyboard(false);
    });
  }, [composerText, expanded]);

  // Attachment added → expand and focus
  useEffect(() => {
    if (attachmentCount > prevAttachmentCountRef.current) {
      setVoiceMode(false);
      setExpanded(true);
      setFullScreen(false);
      setHasKeyboard(true);
      requestAnimationFrame(() => focusComposerTextarea());
    }
    prevAttachmentCountRef.current = attachmentCount;
  }, [attachmentCount, focusComposerTextarea]);

  useEffect(() => {
    return () => {
      if (keyboardPointerReleaseTimerRef.current !== null) {
        window.clearTimeout(keyboardPointerReleaseTimerRef.current);
      }
    };
  }, []);

  // ── Computed ──
  const hasRecommendations = !!chip && chipSuggestions.length > 0;
  const showExpandHandle = lineCount >= 4;
  const canEnterFullScreen = showExpandHandle && !voiceMode;

  return {
    // State
    expanded,
    recording,
    voiceMode,
    hasKeyboard,
    chip,
    chipId,
    chipSuggestions,
    chipPlaceholder,
    composerText,
    attachmentCount,
    hasComposerContent,
    virtualKeyboardOpen,
    lineCount,
    addPanelOpen,
    fullScreen,
    frozen,
    inConversation,

    // Computed
    hasRecommendations,
    showExpandHandle,
    canEnterFullScreen,

    // Refs
    textareaRef,
    sendButtonRef,
    hiddenComposerRef,
    savedTranscriptRef,
    pendingFocusRef,
    pendingSubmitRef,
    pendingSubmitTextRef,
    suppressEmptyCollapseRef,
    suppressBlurForRecordingRef,
    hadKeyboardBeforeRecordingRef,

    // Actions
    setExpanded,
    setRecording,
    setVoiceMode,
    setHasKeyboard,
    setAddPanelOpen,
    setFullScreen,
    clearChip,
    setComposerValue,
    keepComposerFocused,
    setHiddenComposerValue,
    activateComposerInput,
    enterFullScreen,
    exitFullScreen,
    clearComposer,
    focusComposerTextarea,
    syncTextareaHeight,
    handleTextareaFocus,
    handleTextareaBlur,
    handleTextareaInput,
    handleTextareaPointerDown,
    handleSuggestionClick,
  };
}

export type ComposerCore = ReturnType<typeof useComposerCore>;
