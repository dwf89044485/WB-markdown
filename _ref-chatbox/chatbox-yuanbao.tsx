"use client";

import { useRef, useCallback, useEffect } from "react";
import { ComposerPrimitive } from "@assistant-ui/react";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "motion/react";
import { useComposerCore, type ComposerCoreOptions } from "@/features/composer/hooks/use-composer-core";
import { useBackdropContext } from "@/components/assistant-ui/composer-backdrop";
import { VoiceModeToolbar } from "@/components/home/voice-hold-input";
import { useYuanbaoVoiceHold } from "@/components/home/use-yuanbao-voice-hold";
import { useAppStore } from "@/stores";
import { AddPanel } from "@/components/home/add-panel";

export type ChatboxYuanbaoProps = ComposerCoreOptions;

export function ChatboxYuanbao(props: ChatboxYuanbaoProps = {}) {
  const core = useComposerCore(props);
  const { requestBackdrop, clearBackdrop } = useBackdropContext();

  // ── Simplified voice hold — only "send" or "cancel" ──
  const handleVoiceCommit = useCallback((transcript: string) => {
    const textarea = core.textareaRef.current;
    if (textarea) {
      const nativeSetter = Object.getOwnPropertyDescriptor(
        window.HTMLTextAreaElement.prototype, "value"
      )?.set;
      nativeSetter?.call(textarea, transcript);
      textarea.dispatchEvent(new Event("input", { bubbles: true }));
      requestAnimationFrame(() => {
        core.sendButtonRef.current?.click();
        setTimeout(() => {
          core.setExpanded(false);
          core.setHasKeyboard(false);
        }, 0);
      });
    }
    core.setVoiceMode(false);
  }, [core]);

  const handleVoiceCancel = useCallback(() => {
    core.setVoiceMode(false);
    core.setExpanded(false);
    core.setHasKeyboard(false);
    core.setFullScreen(false);
  }, [core]);

  const voice = useYuanbaoVoiceHold({
    onCommit: (transcript) => {
      core.setVoiceMode(false);
      handleVoiceCommit(transcript);
    },
    onCancel: handleVoiceCancel,
    onHoldingChange: (holding) => {
      // noop
    },
  });

  // ── Submit ──
  const submitComposer = useCallback((source: "sendButton" | "other" = "other") => {
    const text = core.composerText.trim();
    if (!text) return;
    useAppStore.getState().notifyThreadStarted(text);
    requestAnimationFrame(() => {
      if (source !== "sendButton") {
        core.sendButtonRef.current?.click();
      }
      core.setExpanded(false);
      core.setHasKeyboard(false);
      core.setFullScreen(false);
    });
  }, [core]);

  // ── Backdrop ──
  const showInputBackdrop = core.expanded && !core.addPanelOpen && (core.inConversation ? core.hasRecommendations : (core.hasKeyboard || core.hasRecommendations));
  const showHoldingBackdrop = voice.holding && !core.inConversation;

  const handleInputBackdropDismiss = useCallback((e: React.PointerEvent) => {
    if (core.hasRecommendations) {
      e.preventDefault();
      const hasInputContent = !!core.textareaRef.current?.value || core.attachmentCount > 0;
      if (hasInputContent) {
        core.clearChip();
        core.setExpanded(true);
      } else {
        core.clearChip();
        core.setExpanded(false);
      }
      core.setHasKeyboard(false);
      core.setFullScreen(false);
      return;
    }
    const hasInputContent = !!core.textareaRef.current?.value || core.attachmentCount > 0;
    if (!hasInputContent) core.setExpanded(false);
    core.setHasKeyboard(false);
    core.setFullScreen(false);
  }, [core]);

  useEffect(() => {
    if (core.frozen) { clearBackdrop("yuanbao-input"); clearBackdrop("yuanbao-holding"); return; }
    if (showInputBackdrop) {
      requestBackdrop({ id: "yuanbao-input", visible: true, onDismiss: handleInputBackdropDismiss, animationDuration: 200 });
    } else { clearBackdrop("yuanbao-input"); }
  }, [showInputBackdrop, core.frozen, requestBackdrop, clearBackdrop, handleInputBackdropDismiss]);

  // ── Render ──
  return (
    <>
    <ComposerPrimitive.Root className={cn("relative w-full px-[26px] z-50", core.frozen && "pointer-events-none")}>

      {/* Chip suggestions above input */}
      {core.expanded && core.hasRecommendations && (
        <div className="absolute inset-x-[26px] bottom-full z-50 pb-2">
          {core.chipSuggestions.map((text, i) => (
            <button
              type="button"
              key={i}
              onPointerDown={(e) => { e.preventDefault(); core.handleSuggestionClick(text); }}
              className="flex items-center gap-3 px-2 py-1.5 rounded-xl text-foreground/75 hover:text-foreground active:bg-black/5 transition-colors text-left w-full"
              style={{ animation: `suggestionSlideUp 0.25s ease both`, animationDelay: `${(core.chipSuggestions.length - 1 - i) * 35}ms` }}
            >
              <span className="text-sm">{text}</span>
            </button>
          ))}
        </div>
      )}

      {/* Yuanbao simplified voice overlay */}
      <AnimatePresence>
        {voice.holding && (
          <motion.div
            key="yuanbao-voice-overlay"
            className="absolute bottom-0 select-none z-10"
            style={{
              left: "-16px",
              right: "-16px",
              height: "280px",
              WebkitUserSelect: "none",
              userSelect: "none",
              touchAction: "none",
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.4 } }}
            onContextMenu={(e) => e.preventDefault()}
          >
            {/* Green glow */}
            <motion.img
              src="/voice-glow.png"
              alt=""
              aria-hidden
              className="pointer-events-none absolute left-0 w-full"
              style={{ bottom: "-38px", zIndex: 1 }}
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 40, opacity: 0 }}
              transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
              draggable={false}
            />

            {/* Transcript + waveform + hint text */}
            <motion.div
              className="absolute left-0 right-0 flex flex-col items-center"
              style={{
                bottom: "calc(18px + env(safe-area-inset-bottom, 0px))",
                gap: 20,
                paddingLeft: 50,
                paddingRight: 50,
                zIndex: 2,
              }}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 40, opacity: 0 }}
              transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
            >
              {/* Transcript text */}
              <div style={{ maxHeight: "72px", overflow: "hidden", display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
                <p style={{ fontFamily: "PingFang SC, system-ui, sans-serif", fontSize: "17px", lineHeight: "24px", color: "#000000", margin: 0, textAlign: "center" }}>
                  {voice.holdingTranscript || "正在识别..."}
                </p>
              </div>

              {/* Waveform icon — animated bars */}
              <div className="flex items-center justify-center" style={{ gap: 4, height: 40 }}>
                {[1, 2, 3, 4, 5, 4, 3, 2, 1].map((barHeight, i) => (
                  <motion.div
                    key={i}
                    className="rounded-full"
                    style={{
                      width: 4,
                      height: barHeight * 4,
                      background: "#34C759",
                      borderRadius: 2,
                    }}
                    animate={{
                      height: [barHeight * 4, barHeight * 6, barHeight * 4],
                    }}
                    transition={{
                      duration: 0.8,
                      repeat: Infinity,
                      delay: i * 0.08,
                      ease: "easeInOut",
                    }}
                  />
                ))}
              </div>

              {/* Hint text */}
              <div className="flex flex-col items-center" style={{ gap: 2 }}>
                <span style={{ fontSize: 12, lineHeight: "16px", color: "rgba(0,0,0,0.5)", transition: "opacity 0.2s", opacity: voice.swipingUp ? 0.3 : 1 }}>
                  松手发送
                </span>
                <span style={{ fontSize: 10, lineHeight: "14px", color: voice.swipingUp ? "#FF3B30" : "rgba(0,0,0,0.3)", transition: "color 0.15s" }}>
                  上滑取消
                </span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main composer body */}
      <motion.div
        animate={{ opacity: voice.holding ? 0 : 1 }}
        transition={{ duration: 0.25, ease: [0.32, 0.72, 0, 1] }}
        className="relative z-10 w-full overflow-hidden transition-[height,min-height,border-radius] duration-300 ease-out"
        style={{
          pointerEvents: voice.holding ? "none" : "auto",
          background: "#FFFFFF",
          borderRadius: "24px",
          boxShadow: "0 4px 10px 0 rgba(0,0,0,0.05), 0 0 0 0.5px rgba(0,0,0,0.08)",
          minHeight: "46px",
          height: core.expanded ? "72px" : "46px",
          transition: "height 320ms cubic-bezier(0.22, 1, 0.36, 1), border-radius 320ms cubic-bezier(0.22, 1, 0.36, 1)",
        }}
      >
        {core.expanded ? (
          <div className="flex w-full flex-col items-start p-[10px]">
            <div className="flex w-full flex-col px-[4px] py-px">
              <ComposerPrimitive.Input
                placeholder="安排任务，WorkBuddy 帮你完成"
                className="chatboxYuanbaoTextarea min-w-0 flex-1 resize-none bg-transparent outline-none placeholder:text-black/30 overflow-y-auto max-h-[200px]"
                style={{ fontSize: "14px", lineHeight: "20px", transform: "none" }}
                minRows={1}
                aria-label="Message input"
                inputMode="none"
                ref={core.textareaRef}
                onPointerDown={(e) => core.handleTextareaPointerDown(e.currentTarget as HTMLTextAreaElement)}
                onFocus={(e) => core.handleTextareaFocus(e.currentTarget as HTMLTextAreaElement)}
                onBlur={(e) => core.handleTextareaBlur(e.currentTarget as HTMLTextAreaElement)}
                onInput={(e) => core.handleTextareaInput(e.currentTarget as HTMLTextAreaElement)}
              />
            </div>
            {/* Toolbar */}
            <div className="flex gap-[16px] items-center w-full pt-[2px]">
              <button type="button" tabIndex={-1} className="relative flex items-center justify-center size-[26px] shrink-0 after:absolute after:inset-[-12px] after:content-['']"
                aria-label="添加附件" onClick={() => core.setAddPanelOpen(true)}>
                <img src="/icons/plus-button.svg" alt="" width={20} height={20} draggable={false} />
              </button>
              <div className="ml-auto relative h-[26px] shrink-0" style={{ width: core.hasComposerContent ? "68px" : "26px", transition: "width 220ms ease" }}>
                <button type="button" tabIndex={-1} className="absolute top-1/2 flex items-center justify-center size-[26px] shrink-0 after:absolute after:inset-[-9px] after:content-['']"
                  aria-label="语音输入"
                  style={{ right: core.hasComposerContent ? "42px" : "0px", transform: "translateY(-50%)", transition: "right 220ms ease" }}
                  onPointerDown={(e) => {
                    e.preventDefault();
                    if (core.hasComposerContent) return;
                    core.setRecording(true);
                  }}>
                  <img src="/icons/mic-button.svg" alt="" width={20} height={20} draggable={false} />
                </button>
                <ComposerPrimitive.Send
                  render={
                    <button ref={core.sendButtonRef} type="button" tabIndex={-1}
                      className="aui-composer-send absolute top-1/2 right-0 flex items-center justify-center shrink-0 after:absolute after:inset-[-9px] after:content-['']"
                      aria-label="发送"
                      style={{ width: core.hasComposerContent ? "26px" : "0px", height: "26px", opacity: core.hasComposerContent ? 1 : 0, overflow: "hidden", transform: "translateY(-50%)", transition: "width 220ms ease, opacity 220ms ease" }}
                      onClick={() => submitComposer("sendButton")}
                    />
                  }
                >
                  <img src="/icons/send-button.svg" alt="" width={26} height={26} />
                </ComposerPrimitive.Send>
              </div>
            </div>
          </div>
        ) : core.voiceMode ? (
          <VoiceModeToolbar
            onHoldPointerDown={voice.handlePointerDown}
            onExitVoiceMode={() => core.setVoiceMode(false)}
            onExpandInput={() => {
              core.pendingFocusRef.current = true;
              core.setVoiceMode(false);
              core.setExpanded(true);
              core.setHasKeyboard(true);
              core.setFullScreen(false);
            }}
          />
        ) : (
          <div className="flex h-full items-center">
            <div className="flex items-center flex-1 min-w-0" onPointerDown={core.activateComposerInput}>
              <button type="button" tabIndex={-1} className="flex h-[46px] w-12 items-center justify-center shrink-0"
                aria-label="添加"
                onPointerDown={(e) => { e.stopPropagation(); core.setAddPanelOpen(true); }}>
                <img src="/icons/plus-button.svg" alt="" width={20} height={20} />
              </button>
              <span className="flex-1 select-none truncate text-center text-black/30"
                style={{ fontSize: "14px", lineHeight: "24px", padding: "8px 12px" }}>
                安排任务，WorkBuddy 帮你完成
              </span>
            </div>
            <button type="button" tabIndex={-1} className="flex h-[46px] w-12 items-center justify-center shrink-0"
              aria-label="语音输入"
              onPointerDown={(e) => {
                e.preventDefault();
                core.hadKeyboardBeforeRecordingRef.current = false;
                core.setVoiceMode(true);
                core.setFullScreen(false);
              }}>
              <img src="/icons/mic-button.svg" alt="" width={20} height={20} />
            </button>
          </div>
        )}
      </motion.div>

      {/* Hidden composer for voice send */}
      {core.voiceMode && !core.expanded && (
        <div className="pointer-events-none absolute h-px w-px overflow-hidden opacity-0" aria-hidden>
          <ComposerPrimitive.Input
            ref={core.hiddenComposerRef}
            className="h-px w-px resize-none opacity-0"
            minRows={1}
            inputMode="none"
            tabIndex={-1}
          />
          <ComposerPrimitive.Send
            render={
              <button ref={core.sendButtonRef} type="button" tabIndex={-1} className="aui-composer-send" />
            }
          >
            <img src="/icons/send-button.svg" alt="" width={26} height={26} />
          </ComposerPrimitive.Send>
        </div>
      )}

      <AddPanel open={core.addPanelOpen} onOpenChange={core.setAddPanelOpen} />
    </ComposerPrimitive.Root>
    </>
  );
}
