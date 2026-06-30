"use client";

import { useLayoutEffect, useRef, useState, useCallback, useEffect } from "react";
import { ComposerPrimitive, useAuiState } from "@assistant-ui/react";
import { ArrowUpIcon, XIcon, ZapIcon } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
  PresentationIcon, SearchIcon, ImageIcon, VideoIcon, CodeIcon, FileTextIcon, BarChart3,
  BookOpenIcon, BotIcon, WrenchIcon, GitBranchIcon, MailIcon, GlobeIcon,
  DollarSignIcon, FolderIcon, PaletteIcon, PieChartIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { AnimatePresence } from "motion/react";
import { VoiceRecorder } from "@/components/home/voice-recorder";
import { useBackdropContext } from "@/components/assistant-ui/composer-backdrop";
import { VirtualKeyboardPanel } from "@/components/home/virtual-keyboard-panel";
import { AddPanel } from "@/components/home/add-panel";
import { ModelSelector } from "@/components/home/model-selector";
import { ComposerAttachments } from "@/components/assistant-ui/attachment";
import { SlashSkillsPanel } from "@/components/home/slash-skills-panel";
import { useComposerCore, type ComposerCoreOptions } from "@/features/composer/hooks/use-composer-core";
import { useSlashTrigger } from "@/features/skills/hooks/use-slash-trigger";
import { useAppStore } from "@/stores";

const chipIconMap: Record<string, LucideIcon> = {
  ppt: PresentationIcon, research: SearchIcon, image: ImageIcon, video: VideoIcon,
  website: CodeIcon, data: BarChart3, doc: FileTextIcon, "doc-read": BookOpenIcon,
  agent: BotIcon, "skill-dev": WrenchIcon, cicd: GitBranchIcon, email: MailIcon,
  dev: CodeIcon, finance: DollarSignIcon, pm: FolderIcon, design: PaletteIcon,
  "doc-proc": FileTextIcon, viz: PieChartIcon, "website-dev": GlobeIcon,
};

export type ChatboxWaveProps = Omit<ComposerCoreOptions, "forceVoiceMode">;

export function ChatboxWave(props: ChatboxWaveProps = {}) {
  const core = useComposerCore({ ...props, textareaSelector: "chatboxwaveTextarea" });

  // ── Slash skills panel state ──
  const [panelOpen, setPanelOpen] = useState(false);
  const isComposingRef = useRef(false);

  // ── Layout measurement ──
  const compactContentRef = useRef<HTMLDivElement | null>(null);
  const [compactHeightPx, setCompactHeightPx] = useState(72);

  useLayoutEffect(() => {
    const el = compactContentRef.current;
    if (!el || !core.expanded || core.fullScreen) return;
    const updateCompactHeight = () => setCompactHeightPx(Math.max(72, Math.ceil(el.getBoundingClientRect().height)));
    updateCompactHeight();
    const observer = new ResizeObserver(updateCompactHeight);
    observer.observe(el);
    return () => observer.disconnect();
  }, [core.expanded, core.fullScreen, core.lineCount, core.chip, core.recording, core.hasComposerContent]);

  // ── Image attachment suggestions ──
  const imageAttachmentCount = useAuiState((s) =>
    s.composer.attachments.filter((a) => a.type === "image" || a.contentType?.startsWith("image/")).length
  );
  const prevImageAttachCountRef = useRef(0);
  const [showImageSuggestions, setShowImageSuggestions] = useState(false);

  useEffect(() => {
    if (imageAttachmentCount > prevImageAttachCountRef.current) {
      core.clearChip();
      setShowImageSuggestions(true);
    }
    if (imageAttachmentCount === 0) {
      setShowImageSuggestions(false);
    }
    prevImageAttachCountRef.current = imageAttachmentCount;
  }, [imageAttachmentCount, core.clearChip]);

  const IMAGE_SUGGESTIONS = [
    "帮我解读这份报告",
    "总结主要的健康问题",
    "根据我的情况给我健康建议",
    "上传后即时给出跟图片直接相关的推荐项",
  ] as const;

  // ── Backdrop ──
  const { requestBackdrop, clearBackdrop } = useBackdropContext();
  const hasRecommendations = core.hasRecommendations;
  const showBackdrop = core.expanded && !core.addPanelOpen && (core.inConversation ? hasRecommendations : (core.hasKeyboard || hasRecommendations || showImageSuggestions));

  const handleBackdropDismiss = useCallback((e: React.PointerEvent) => {
    if (hasRecommendations) {
      e.preventDefault();
      const hasInput = !!core.textareaRef.current?.value || core.attachmentCount > 0;
      if (hasInput) { core.clearChip(); core.setExpanded(true); }
      else { core.clearChip(); core.setExpanded(false); }
      core.setHasKeyboard(false);
      core.setFullScreen(false);
      return;
    }
    // 阻止点击穿透到 textarea 重新拉起键盘，避免 backdrop 闪一下又恢复
    e.preventDefault();
    setShowImageSuggestions(false);
    const hasInput = !!core.textareaRef.current?.value || core.attachmentCount > 0;
    if (!hasInput) core.setExpanded(false);
    core.setHasKeyboard(false);
    core.setFullScreen(false);
  }, [core, hasRecommendations]);

  useEffect(() => {
    if (core.frozen) { clearBackdrop("v5-input"); return; }
    if (showBackdrop) { requestBackdrop({ id: "v5-input", visible: true, onDismiss: handleBackdropDismiss, animationDuration: 200 }); }
    else { clearBackdrop("v5-input"); }
  }, [showBackdrop, core.frozen, requestBackdrop, clearBackdrop, handleBackdropDismiss]);

  useEffect(() => () => { clearBackdrop("v5-input"); clearBackdrop("slash-skills"); }, [clearBackdrop]);

  // ── Slash skills panel logic ──
  useEffect(() => {
    if (core.frozen) { clearBackdrop("slash-skills"); return; }
    if (panelOpen) {
      requestBackdrop({ id: "slash-skills", visible: true, onDismiss: () => setPanelOpen(false), animationDuration: 200 });
    } else {
      clearBackdrop("slash-skills");
    }
  }, [panelOpen, core.frozen, requestBackdrop, clearBackdrop]);

  useEffect(() => {
    if (!panelOpen) return;
    if (core.recording || core.fullScreen) {
      setPanelOpen(false);
    }
  }, [panelOpen, core.recording, core.fullScreen]);

  useSlashTrigger({
    composerText: core.composerText,
    isComposing: isComposingRef.current,
    panelOpen,
    onTrigger: () => {
      setPanelOpen(true);
      clearBackdrop("v5-input");
      setShowImageSuggestions(false);
    },
    onSlashCleared: () => {
      setPanelOpen(false);
    },
  });

  // ── Submit ──
  // source='sendButton' 表示由可见发送按钮本身触发：避免再次 click sendButtonRef 导致递归
  const submitComposer = useCallback((source: "sendButton" | "other" = "other") => {
    const text = core.composerText.trim();
    if (!text) return;
    // 通知 store：首次发消息时创建新会话条目
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

  // ── Derived ──
  const ChipIcon = chipIconMap[core.chipId] ?? null;
  const hasComposerContent = core.hasComposerContent;

  return (
    <>
    <ComposerPrimitive.Root className={cn("relative z-50 w-full px-[26px]", core.frozen && "pointer-events-none")}>

      <div className="pointer-events-none fixed inset-x-0 top-0 z-0 bg-black transition-opacity duration-300 ease-out"
        style={{ height: "500px", opacity: core.fullScreen ? 0.3 : 0 }} />

      {/* Chip suggestions */}
      {core.expanded && hasRecommendations && (
        <div className="absolute inset-x-[26px] bottom-full z-50 pb-2">
          {core.chipSuggestions.map((text, i) => (
            <button type="button" key={i}
              onPointerDown={(e) => { e.preventDefault(); core.handleSuggestionClick(text); }}
              className="flex items-center gap-3 px-2 py-1.5 rounded-xl text-foreground/75 hover:text-foreground active:bg-black/5 transition-colors text-left w-full"
              style={{ animation: `suggestionSlideUp 0.25s ease both`, animationDelay: `${(core.chipSuggestions.length - 1 - i) * 35}ms` }}>
              <ArrowUpIcon className="w-3.5 h-3.5 text-muted-foreground shrink-0 rotate-45 opacity-60" />
              <span className="text-sm">{text}</span>
            </button>
          ))}
        </div>
      )}

      {/* Image attachment suggestions */}
      {core.expanded && showImageSuggestions && !hasRecommendations && (
        <div className="absolute inset-x-[26px] bottom-full z-50 pb-2">
          {IMAGE_SUGGESTIONS.map((text, i) => (
            <button type="button" key={i}
              onPointerDown={(e) => {
                e.preventDefault();
                core.handleSuggestionClick(text);
                setShowImageSuggestions(false);
              }}
              className="flex items-center gap-3 px-2 py-1.5 rounded-xl text-foreground/75 hover:text-foreground active:bg-black/5 transition-colors text-left w-full"
              style={{ animation: `suggestionSlideUp 0.25s ease both`, animationDelay: `${(IMAGE_SUGGESTIONS.length - 1 - i) * 35}ms` }}>
              <ArrowUpIcon className="w-3.5 h-3.5 text-muted-foreground shrink-0 rotate-45 opacity-60" />
              <span className="text-sm">{text}</span>
            </button>
          ))}
        </div>
      )}

      {/* Main pill */}
      <div className="relative z-10 w-full overflow-hidden transition-[height,min-height,border-radius] duration-300 ease-out"
        style={{
          background: "#FFFFFF",
          borderRadius: core.fullScreen ? "24px 24px 0 0" : "24px",
          boxShadow: "0 4px 10px 0 rgba(0,0,0,0.05), 0 0 0 0.5px rgba(0,0,0,0.08)",
          minHeight: "46px",
          height: core.fullScreen
            ? "calc(100dvh - var(--virtual-keyboard-panel-height, 0px) - env(safe-area-inset-top))"
            : (core.expanded ? `${compactHeightPx}px` : "46px"),
          width: core.fullScreen ? "calc(100% + 52px)" : "100%",
          marginInline: core.fullScreen ? "-26px" : "0px",
          transition: core.recording
            ? "width 320ms cubic-bezier(0.22, 1, 0.36, 1), margin 320ms cubic-bezier(0.22, 1, 0.36, 1), border-radius 320ms cubic-bezier(0.22, 1, 0.36, 1)"
            : "height 320ms cubic-bezier(0.22, 1, 0.36, 1), width 320ms cubic-bezier(0.22, 1, 0.36, 1), margin 320ms cubic-bezier(0.22, 1, 0.36, 1), border-radius 320ms cubic-bezier(0.22, 1, 0.36, 1)",
        }}>
        {core.expanded ? (
          core.fullScreen ? (
            <WaveFullScreen core={core} hasComposerContent={hasComposerContent} isComposingRef={isComposingRef} submitComposer={submitComposer} />
          ) : (
            <WaveCompactExpanded
              core={core}
              compactContentRef={compactContentRef}
              ChipIcon={ChipIcon}
              hasComposerContent={hasComposerContent}
              isComposingRef={isComposingRef}
              submitComposer={submitComposer}
              onZapClick={() => {
                if (panelOpen) { setPanelOpen(false); return; }
                setPanelOpen(true);
                clearBackdrop("v5-input");
                setShowImageSuggestions(false);
              }}
            />
          )
        ) : (
          <WaveCollapsed core={core} />
        )}
      </div>

      <VirtualKeyboardPanel
        open={core.expanded && core.hasKeyboard}
        value={core.composerText}
        onChange={core.setComposerValue}
        onPanelPointerDown={core.keepComposerFocused}
        topGap={core.fullScreen ? 0 : 20}
        onSubmit={submitComposer}
        onClose={() => {
          core.setHasKeyboard(false);
          core.setFullScreen(false);
          if (!core.textareaRef.current?.value && core.attachmentCount === 0) core.setExpanded(false);
        }}
      />
      <SlashSkillsPanel
        open={panelOpen}
        onClose={() => setPanelOpen(false)}
        onSelect={(skill) => {
          if (core.composerText === "/") {
            core.setComposerValue("");
          }
          useAppStore.getState().sendChipCommand({
            id: skill.id,
            label: skill.name,
            suggestions: [],
            placeholder: skill.description,
          });
        }}
      />
      <AddPanel open={core.addPanelOpen} onOpenChange={core.setAddPanelOpen} />
    </ComposerPrimitive.Root>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────
// Wave sub-components
// ─────────────────────────────────────────────────────────────────

function WaveFullScreen({ core, hasComposerContent, isComposingRef, submitComposer }: { core: ReturnType<typeof useComposerCore>; hasComposerContent: boolean; isComposingRef: React.RefObject<boolean>; submitComposer: (source?: "sendButton" | "other") => void }) {
  return (
    <div className="relative flex h-full w-full flex-col px-[20px] pt-[10px] pb-[20px]">
      <div className="flex w-full items-center justify-between pb-[4px]">
        <button type="button" tabIndex={-1} className="text-[14px] leading-[24px] text-black/40"
          onPointerDown={(e) => { e.preventDefault(); core.clearComposer(); }}>清空</button>
        <button type="button" tabIndex={-1} aria-label="缩小输入框"
          className="relative flex size-[26px] items-center justify-center after:absolute after:inset-[-9px] after:content-['']"
          onPointerDown={(e) => { e.preventDefault(); core.exitFullScreen(); }}>
          <img src="/icons/composer-collapse-v2.svg" alt="" width={26} height={26} />
        </button>
      </div>
      <div className="flex-1 overflow-hidden pt-[4px]">
        <ComposerPrimitive.Input
          placeholder={core.chipPlaceholder || "安排任务，WorkBuddy 帮你完成"}
          className="chatboxwaveTextarea h-full w-full resize-none bg-transparent outline-none placeholder:text-black/30 overflow-y-auto"
          style={{ fontSize: "14px", lineHeight: "24px", transform: "none", paddingInline: 0 }}
          minRows={1} aria-label="Message input"
          inputMode="none"
          ref={core.textareaRef}
          onPointerDown={(e) => core.handleTextareaPointerDown(e.currentTarget as HTMLTextAreaElement)}
          onFocus={(e) => core.handleTextareaFocus(e.currentTarget as HTMLTextAreaElement)}
          onBlur={(e) => core.handleTextareaBlur(e.currentTarget as HTMLTextAreaElement)}
          onInput={(e) => core.handleTextareaInput(e.currentTarget as HTMLTextAreaElement)}
          onCompositionStart={() => { isComposingRef.current = true; }}
          onCompositionEnd={() => { isComposingRef.current = false; }}
        />
      </div>
      <div className="mt-[10px]">
        <AnimatePresence mode="wait">
          {core.recording ? (
            <div key="full-recorder" className="w-full">
              <VoiceRecorder onStop={(transcript) => {
                core.savedTranscriptRef.current = transcript;
                if (core.hadKeyboardBeforeRecordingRef.current) { core.suppressBlurForRecordingRef.current = false; core.setHasKeyboard(true); }
                core.setRecording(false);
              }} />
            </div>
          ) : (
            <div key="full-toolbar" className="flex w-full justify-end">
              <div className="relative h-[26px] shrink-0" style={{ width: hasComposerContent ? "68px" : "26px", transition: "width 220ms ease" }}>
                <button type="button" tabIndex={-1} aria-label="语音输入"
                  className="absolute top-1/2 flex items-center justify-center size-[26px] shrink-0 after:absolute after:inset-[-9px] after:content-['']"
                  style={{ right: hasComposerContent ? "42px" : "0px", transform: "translateY(-50%)", transition: "right 220ms ease" }}
                  onPointerDown={(e) => {
                    e.preventDefault();
                    core.hadKeyboardBeforeRecordingRef.current = core.hasKeyboard;
                    core.suppressBlurForRecordingRef.current = true;
                    core.setRecording(true);
                  }}>
                  <img src="/icons/mic-button.svg" alt="" width={20} height={20} draggable={false} />
                </button>
                <WaveSendButton buttonRef={core.sendButtonRef} hasContent={hasComposerContent} onSubmit={() => submitComposer("sendButton")} />
              </div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function WaveCompactExpanded({ core, compactContentRef, ChipIcon, hasComposerContent, isComposingRef, onZapClick, submitComposer }: {
  core: ReturnType<typeof useComposerCore>;
  compactContentRef: React.RefObject<HTMLDivElement | null>;
  ChipIcon: LucideIcon | null;
  hasComposerContent: boolean;
  isComposingRef: React.RefObject<boolean>;
  onZapClick: () => void;
  submitComposer: (source?: "sendButton" | "other") => void;
}) {
  return (
    <div ref={compactContentRef} className="flex w-full flex-col items-start p-[10px]">
      <div className="flex w-full flex-col px-[4px] py-px">
        <ComposerAttachments />
        {core.chip && (
          <button type="button" tabIndex={-1}
            onPointerDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
            onClick={(e) => { e.stopPropagation(); core.suppressEmptyCollapseRef.current = true; core.clearChip(); }}
            className="inline-flex items-center self-start mb-[4px]"
            style={{ background: "#E7EFF4", borderRadius: "100px", padding: "6px 10px 6px 8px", gap: "6px" }}
            aria-label="移除标签">
            <div className="flex items-center" style={{ gap: "3px" }}>
              {ChipIcon && <ChipIcon style={{ width: 15, height: 15, color: "#030303" }} strokeWidth={1.5} />}
              <span style={{ fontSize: "12px", lineHeight: "16px", color: "#030303" }}>{core.chip}</span>
            </div>
            <XIcon className="shrink-0 opacity-40" style={{ width: "10px", height: "10px" }} />
          </button>
        )}
        <div className="flex w-full items-start gap-[4px]">
          <ComposerPrimitive.Input
            placeholder={core.chipPlaceholder || "安排任务，WorkBuddy 帮你完成"}
            className={cn("chatboxwaveTextarea min-w-0 flex-1 resize-none bg-transparent outline-none placeholder:text-black/30 overflow-y-auto", core.fullScreen ? "max-h-none min-h-[120px]" : "max-h-[200px]")}
            style={{ fontSize: "14px", lineHeight: "20px", transform: "none" }}
            minRows={1} aria-label="Message input"
            inputMode="none"
            ref={core.textareaRef}
            onPointerDown={(e) => core.handleTextareaPointerDown(e.currentTarget as HTMLTextAreaElement)}
            onFocus={(e) => core.handleTextareaFocus(e.currentTarget as HTMLTextAreaElement)}
            onBlur={(e) => core.handleTextareaBlur(e.currentTarget as HTMLTextAreaElement)}
            onInput={(e) => core.handleTextareaInput(e.currentTarget as HTMLTextAreaElement)}
            onCompositionStart={() => { isComposingRef.current = true; }}
            onCompositionEnd={() => { isComposingRef.current = false; }}
          />
          <button type="button" tabIndex={-1} aria-label="展开更多"
            className="relative flex items-center justify-center size-[26px] shrink-0 after:absolute after:inset-[-9px] after:content-['']"
            style={{ opacity: core.showExpandHandle ? 1 : 0, pointerEvents: core.showExpandHandle ? "auto" : "none" }}
            onPointerDown={(e) => { e.preventDefault(); core.enterFullScreen(); }}>
            <img src="/icons/composer-expand-v2.svg" alt="" width={26} height={26} />
          </button>
        </div>
      </div>
      {/* Toolbar */}
      <AnimatePresence mode="wait">
        {core.recording ? (
          <div key="recorder" className="w-full">
            <VoiceRecorder onStop={(transcript) => {
              core.savedTranscriptRef.current = transcript;
              if (core.hadKeyboardBeforeRecordingRef.current) { core.suppressBlurForRecordingRef.current = false; core.setHasKeyboard(true); }
              core.setRecording(false);
            }} />
          </div>
        ) : (
          <div key="toolbar" className="flex gap-[16px] items-center w-full">
            <button type="button" tabIndex={-1} aria-label="添加附件"
              className="relative flex items-center justify-center size-[26px] shrink-0 after:absolute after:inset-[-12px] after:content-['']"
              onClick={() => core.setAddPanelOpen(true)}>
              <img src="/icons/plus-button.svg" alt="" width={20} height={20} draggable={false} />
            </button>
            <ModelSelector />
            <button
              type="button"
              tabIndex={-1}
              aria-label="选择技能"
              className="relative flex items-center justify-center size-[26px] shrink-0 after:absolute after:inset-[-9px] after:content-['']"
              onClick={(e) => {
                e.preventDefault();
                onZapClick();
              }}
            >
              <ZapIcon className="size-[20px]" strokeWidth={1.5} />
            </button>
            <div className="ml-auto relative h-[26px] shrink-0" style={{ width: hasComposerContent ? "68px" : "26px", transition: "width 220ms ease" }}>
              <button type="button" tabIndex={-1} aria-label="语音输入"
                className="absolute top-1/2 flex items-center justify-center size-[26px] shrink-0 after:absolute after:inset-[-9px] after:content-['']"
                style={{ right: hasComposerContent ? "42px" : "0px", transform: "translateY(-50%)", transition: "right 220ms ease" }}
                onPointerDown={(e) => {
                  e.preventDefault();
                  core.hadKeyboardBeforeRecordingRef.current = core.hasKeyboard;
                  core.suppressBlurForRecordingRef.current = true;
                  core.setRecording(true);
                }}>
                <img src="/icons/mic-button.svg" alt="" width={20} height={20} draggable={false} />
              </button>
              <WaveSendButton buttonRef={core.sendButtonRef} hasContent={hasComposerContent} onSubmit={() => submitComposer("sendButton")} />
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function WaveCollapsed({ core }: { core: ReturnType<typeof useComposerCore> }) {
  return (
    <div className="flex h-full items-center">
      <div className="flex items-center flex-1 min-w-0" onPointerDown={core.activateComposerInput}>
        <button type="button" tabIndex={-1} className="flex h-[46px] w-12 items-center justify-center shrink-0"
          aria-label="添加" onPointerDown={(e) => { e.stopPropagation(); core.setAddPanelOpen(true); }}>
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
          core.suppressBlurForRecordingRef.current = true;
          core.setRecording(true);
          core.setExpanded(true);
        }}>
        <img src="/icons/mic-button.svg" alt="" width={20} height={20} />
      </button>
    </div>
  );
}

function WaveSendButton({ buttonRef, hasContent, onSubmit }: { buttonRef: React.RefObject<HTMLButtonElement | null>; hasContent: boolean; onSubmit?: () => void }) {
  return (
    <ComposerPrimitive.Send
      render={
        <button ref={buttonRef} type="button" tabIndex={-1}
          className="aui-composer-send absolute top-1/2 right-0 flex items-center justify-center shrink-0 after:absolute after:inset-[-9px] after:content-['']"
          aria-label="发送"
          style={{ width: hasContent ? "26px" : "0px", height: "26px", opacity: hasContent ? 1 : 0, overflow: "hidden", transform: "translateY(-50%)", transition: "width 220ms ease, opacity 220ms ease" }}
          onClick={() => onSubmit?.()}
        />
      }
    >
      <img src="/icons/send-button.svg" alt="" width={26} height={26} />
    </ComposerPrimitive.Send>
  );
}
