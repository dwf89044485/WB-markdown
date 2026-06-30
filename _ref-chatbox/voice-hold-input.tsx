"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import type { SwipeDirection } from "./use-voice-hold";

const VOICE_SIDE_INSET_PX = 50;

type VoiceOverlayMode = "voice" | "edit";

// --- glass 按钮样式 helper ---
function glassButtonStyle(active: boolean, size = 70): React.CSSProperties {
  return {
    width: size,
    height: size,
    borderRadius: "50%",
    background: active ? "#ffffff" : "rgba(255,255,255,0.3)",
    backdropFilter: active ? "none" : "blur(12px)",
    WebkitBackdropFilter: active ? "none" : "blur(12px)",
    transform: active ? "scale(1.1)" : "scale(1)",
    transition: "background 0.15s ease, transform 0.15s ease",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  };
}

// --- 类型 ---
export interface VoiceHoldOverlayProps {
  /** 光晕模态是否显示；默认跟随 holding，兼容 V6 */
  open?: boolean;
  /** 底部需要为虚拟键盘让出的高度 */
  bottomInset?: number;
  /** 当前光晕模态模式 */
  mode?: VoiceOverlayMode;
  /** 是否正在按住 */
  holding: boolean;
  /** 逐字显示的转录文字 */
  holdingTranscript: string;
  /** 当前滑动方向 */
  swipeDirection: SwipeDirection;
  /** 编辑态文本 */
  editText?: string;
  /** 编辑态文本变化 */
  onEditTextChange?: (text: string) => void;
  /** 编辑态 textarea ref */
  editTextareaRef?: (node: HTMLTextAreaElement | null) => void;
  /** 编辑态左按钮 */
  onEditClear?: () => void;
  /** 编辑态中间长按 */
  onEditHoldPointerDown?: (e: React.PointerEvent<HTMLButtonElement>) => void;
  /** 编辑态右按钮 */
  onEditSubmit?: () => void;
  /** 点击编辑文字区 */
  onEditTextPointerDown?: (e: React.PointerEvent<HTMLTextAreaElement>) => void;
  /** 编辑态键盘打开时保持 textarea 焦点 */
  keepEditFocus?: boolean;
}

export interface VoiceModeToolbarProps {
  /** 绑定到"按住说话"按钮的 onPointerDown */
  onHoldPointerDown: (e: React.PointerEvent) => void;
  /** 退出语音模式（切换到键盘） */
  onExitVoiceMode: () => void;
  /** 切换到展开输入（点击 + 按钮） */
  onExpandInput: () => void;
}

/**
 * 长按语音时显示的光晕 + 转录 + 三方向控制按钮。
 * 展示组件，不包含手势判断；V7 编辑态也复用同一个光晕壳。
 */
export function VoiceHoldOverlay({
  open,
  bottomInset = 0,
  mode = "voice",
  holding,
  holdingTranscript,
  swipeDirection,
  editText = "",
  onEditTextChange,
  editTextareaRef,
  onEditClear,
  onEditHoldPointerDown,
  onEditSubmit,
  onEditTextPointerDown,
  keepEditFocus = false,
}: VoiceHoldOverlayProps) {
  const internalEditTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  const editTextBlockRef = useRef<HTMLDivElement | null>(null);
  const [editMaskHeight, setEditMaskHeight] = useState(0);
  const visible = open ?? holding;
  const isEditMode = mode === "edit";

  useEffect(() => {
    if (!visible || !isEditMode) return;
    requestAnimationFrame(() => {
      const textarea = internalEditTextareaRef.current;
      if (!textarea) return;
      textarea.focus({ preventScroll: true });
      const cursor = textarea.value.length;
      textarea.setSelectionRange(cursor, cursor);
    });
  }, [isEditMode, visible]);

  useEffect(() => {
    if (!visible || !isEditMode) return;
    const block = editTextBlockRef.current;
    const textarea = internalEditTextareaRef.current;
    if (!block) return;

    let frame = 0;
    const updateMaskHeight = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const blockRect = block.getBoundingClientRect();
        const maxTextHeight = Math.max(48, window.innerHeight - 228 - bottomInset);
        if (textarea) {
          textarea.style.height = "auto";
          const nextHeight = Math.min(textarea.scrollHeight, maxTextHeight);
          textarea.style.height = `${nextHeight}px`;
          textarea.style.overflowY = textarea.scrollHeight > maxTextHeight ? "auto" : "hidden";
        }
        const textareaRect = textarea?.getBoundingClientRect();
        const textareaHeight = textareaRect?.height ?? blockRect.height;
        const blockBottomGap = Math.max(0, blockRect.bottom - (textareaRect?.bottom ?? blockRect.bottom));
        setEditMaskHeight(Math.ceil(textareaHeight + blockBottomGap + 28));
      });
    };

    updateMaskHeight();
    const observer = new ResizeObserver(updateMaskHeight);
    observer.observe(block);

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [bottomInset, editText, isEditMode, visible]);

  const bindEditTextarea = (node: HTMLTextAreaElement | null) => {
    internalEditTextareaRef.current = node;
    editTextareaRef?.(node);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="holding-glow"
          className="absolute bottom-0 select-none z-10"
          style={{
            left: "-16px",
            right: "-16px",
            bottom: isEditMode ? `${bottomInset}px` : 0,
            height: isEditMode ? `calc(100dvh - 100px - ${bottomInset}px)` : "280px",
            WebkitUserSelect: isEditMode ? "text" : "none",
            WebkitTouchCallout: "none",
            userSelect: isEditMode ? "text" : "none",
            touchAction: "none",
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.4 } }}
          onContextMenu={(e) => e.preventDefault()}
          data-voice-glow-overlay={isEditMode ? "edit" : "voice"}
        >
          {isEditMode && editMaskHeight > 0 && (
            <div
              aria-hidden
              data-voice-edit-history-mask
              className="pointer-events-none absolute left-0 right-0"
              style={{
                bottom: "calc(18px + env(safe-area-inset-bottom, 0px) + 94px)",
                height: `${editMaskHeight}px`,
                zIndex: 0,
                background: "linear-gradient(180deg, rgba(244,247,250,0) 0%, rgba(244,247,250,0.86) 12%, #F4F7FA 22%, #F4F7FA 100%)",
              }}
            />
          )}

          {/* 绿色光晕 — 静态 PNG */}
          <motion.img
            src="/voice-glow.png"
            alt=""
            aria-hidden
            className="pointer-events-none absolute left-0 w-full"
            style={{ bottom: bottomInset > 0 ? "0px" : "-38px", zIndex: 1 }}
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
            draggable={false}
          />

          {/* 文字 + 按钮区：底部对齐整体布局 */}
          <motion.div
            className="absolute left-0 right-0 flex flex-col"
            style={{
              bottom: "calc(18px + env(safe-area-inset-bottom, 0px))",
              gap: 16,
              paddingLeft: `${VOICE_SIDE_INSET_PX}px`,
              paddingRight: `${VOICE_SIDE_INSET_PX}px`,
              zIndex: 2,
            }}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
          >
            {/* 识别文字：底部固定，内容向上增长；编辑态直接在这块文字区编辑 */}
            <div
              ref={isEditMode ? editTextBlockRef : undefined}
              style={{
                maxHeight: isEditMode ? `calc(100dvh - 228px - env(safe-area-inset-bottom, 0px) - ${bottomInset}px)` : "72px",
                overflow: "hidden",
                display: "flex",
                flexDirection: "column",
                justifyContent: "flex-end",
              }}
            >
              {isEditMode ? (
                <textarea
                  ref={bindEditTextarea}
                  value={editText}
                  onChange={(e) => onEditTextChange?.(e.currentTarget.value)}
                  onPointerDown={onEditTextPointerDown}
                  onBlur={() => {
                    if (!keepEditFocus) return;
                    const textarea = internalEditTextareaRef.current;
                    if (!textarea) return;
                    requestAnimationFrame(() => {
                      if (document.activeElement === textarea) return;
                      const start = textarea.selectionStart ?? textarea.value.length;
                      const end = textarea.selectionEnd ?? start;
                      textarea.focus({ preventScroll: true });
                      textarea.setSelectionRange(start, end);
                    });
                  }}
                  aria-label="编辑语音文字"
                  className="voice-edit-textarea w-full resize-none bg-transparent outline-none"
                  rows={2}
                  style={{
                    fontFamily: "PingFang SC, system-ui, sans-serif",
                    fontSize: "17px",
                    lineHeight: "24px",
                    color: "#000000",
                    margin: 0,
                    padding: 0,
                    border: "none",
                    caretColor: "#000000",
                    overflowY: "hidden",
                    touchAction: "pan-y",
                    WebkitOverflowScrolling: "touch",
                  }}
                  inputMode="none"
                />
              ) : (
                <p
                  style={{
                    fontFamily: "PingFang SC, system-ui, sans-serif",
                    fontSize: "17px",
                    lineHeight: "24px",
                    color: "#000000",
                    margin: 0,
                  }}
                >
                  {holdingTranscript || "正在识别..."}
                </p>
              )}
            </div>

            {isEditMode ? (
              <div className="flex items-center justify-center" style={{ gap: 40 }}>
                <div className="flex flex-col items-center">
                  <div style={{ height: 24, marginBottom: 10, overflow: "hidden", display: "flex", alignItems: "flex-end" }}>
                    <span style={{ fontSize: 10, color: "rgba(0,0,0,0.5)", display: "block" }}>
                      取消
                    </span>
                  </div>
                  <button
                    type="button"
                    tabIndex={-1}
                    aria-label="取消"
                    style={glassButtonStyle(false)}
                    onPointerDown={(e) => {
                      e.preventDefault();
                      onEditClear?.();
                    }}
                    draggable={false}
                  >
                    <img src="/icons/voice-hold-delete-icon.svg" width={70} height={70} aria-hidden alt="" draggable={false} />
                  </button>
                </div>

                <div className="flex flex-col items-center">
                  <div style={{ height: 24, marginBottom: 10, overflow: "hidden", display: "flex", alignItems: "flex-end" }}>
                    <span style={{ fontSize: 10, color: "rgba(0,0,0,0.5)", display: "block" }}>
                      长按说话
                    </span>
                  </div>
                  <button
                    type="button"
                    tabIndex={-1}
                    aria-label="长按说话"
                    style={glassButtonStyle(holding)}
                    onPointerDown={onEditHoldPointerDown}
                    onContextMenu={(e) => e.preventDefault()}
                    draggable={false}
                  >
                    <img src="/icons/mic-button.svg" width={22} height={22} aria-hidden alt="" draggable={false} />
                  </button>
                </div>

                <div className="flex flex-col items-center">
                  <div style={{ height: 24, marginBottom: 10, overflow: "hidden", display: "flex", alignItems: "flex-end" }}>
                    <span style={{ fontSize: 10, color: "rgba(0,0,0,0.5)", display: "block" }}>
                      点击发送
                    </span>
                  </div>
                  <button
                    type="button"
                    tabIndex={-1}
                    aria-label="点击发送"
                    style={glassButtonStyle(false)}
                    onPointerDown={(e) => {
                      e.preventDefault();
                      onEditSubmit?.();
                    }}
                    draggable={false}
                  >
                    <img src="/icons/voice-hold-send-icon.svg" width={70} height={70} aria-hidden alt="" draggable={false} />
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center" style={{ gap: 40 }}>
                {/* 左：取消（X）— 向左滑动触发 */}
                <div className="flex flex-col items-center">
                  <div style={{ height: 24, marginBottom: 10, overflow: "hidden", display: "flex", alignItems: "flex-end" }}>
                    <AnimatePresence mode="wait">
                      {swipeDirection === "left" && (
                        <motion.span
                          key={`left-${swipeDirection}`}
                          style={{ fontSize: 10, color: "rgba(0,0,0,0.5)", display: "block" }}
                          initial={{ y: 10, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.2, ease: "easeOut" }}
                        >
                          清空文字
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </div>
                  <div aria-label="取消语音输入" style={glassButtonStyle(swipeDirection === "left")}>
                    <img src="/icons/voice-hold-delete-icon.svg" width={70} height={70} aria-hidden alt="" draggable={false} />
                  </div>
                </div>

                {/* 中：松手编辑 */}
                <div className="flex flex-col items-center">
                  <div style={{ height: 24, marginBottom: 10, overflow: "hidden", display: "flex", alignItems: "flex-end" }}>
                    <AnimatePresence mode="wait">
                      {swipeDirection === "up" && (
                        <motion.span
                          key={`up-${swipeDirection}`}
                          style={{ fontSize: 10, color: "rgba(0,0,0,0.5)", display: "block" }}
                          initial={{ y: 10, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.2, ease: "easeOut" }}
                        >
                          松手编辑
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </div>
                  <div aria-label="松手编辑" style={glassButtonStyle(swipeDirection === "up")}>
                    <img src="/icons/voice-hold-edit-icon.svg" width={70} height={70} aria-hidden alt="" draggable={false} />
                  </div>
                </div>

                {/* 右：直接发送 — 向右滑动触发 */}
                <div className="flex flex-col items-center">
                  <div style={{ height: 24, marginBottom: 10, overflow: "hidden", display: "flex", alignItems: "flex-end" }}>
                    <AnimatePresence mode="wait">
                      {swipeDirection === "right" && (
                        <motion.span
                          key={`right-${swipeDirection}`}
                          style={{ fontSize: 10, color: "rgba(0,0,0,0.5)", display: "block" }}
                          initial={{ y: 10, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.2, ease: "easeOut" }}
                        >
                          直接发送
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </div>
                  <div aria-label="直接发送" style={glassButtonStyle(swipeDirection === "right")}>
                    <img src="/icons/voice-hold-send-icon.svg" width={70} height={70} aria-hidden alt="" draggable={false} />
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/**
 * 语音模式下的工具栏：[+] [按住说话] [键盘]
 * 纯展示组件，行为通过 props 委托给父组件。
 */
export function VoiceModeToolbar({
  onHoldPointerDown,
  onExitVoiceMode,
  onExpandInput,
}: VoiceModeToolbarProps) {
  return (
    <div className="flex h-full items-center">
      <button
        type="button"
        tabIndex={-1}
        className="flex h-12 w-12 items-center justify-center shrink-0"
        aria-label="添加"
        onPointerDown={(e) => {
          e.preventDefault();
          onExpandInput();
        }}
      >
        <img src="/icons/plus-button.svg" alt="" width={20} height={20} draggable={false} />
      </button>
      <button
        type="button"
        tabIndex={-1}
        className="flex min-w-0 flex-1 items-center justify-center select-none"
        style={{
          padding: "6px 10px",
          WebkitUserSelect: "none",
          WebkitTouchCallout: "none",
          userSelect: "none",
          touchAction: "none",
        }}
        aria-label="按住说话"
        onContextMenu={(e) => e.preventDefault()}
        onPointerDown={(e) => {
          e.preventDefault();
          onHoldPointerDown(e);
        }}
      >
        <span
          className="select-none text-center text-foreground"
          style={{ fontSize: "15px", lineHeight: "22px" }}
        >
          按住说话
        </span>
      </button>
      <button
        type="button"
        tabIndex={-1}
        className="flex items-center justify-center shrink-0"
        aria-label="切换键盘输入"
        onPointerDown={(e) => {
          e.preventDefault();
          onExitVoiceMode();
        }}
      >
        <img src="/icons/keyboard-button.svg" alt="" width={48} height={48} aria-hidden draggable={false} />
      </button>
    </div>
  );
}
