import { useEffect, useId, useRef, useState } from "react";
import type { SyntheticEvent } from "react";
import { createPortal } from "react-dom";

import styles from "./TooltipButton.module.scss";
import type { TooltipButtonProps } from "./TooltipButton.types";

export function TooltipButton({
  tooltip,
  children,
  type = "button",
  onClick,
  onMouseEnter,
  onMouseLeave,
  onFocus,
  onBlur,
  ...buttonProps
}: TooltipButtonProps) {
  const tooltipId = useId();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [anchor, setAnchor] = useState<{ top: number; left: number } | null>(null);
  const dismissTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  function cancelDismiss() {
    clearTimeout(dismissTimer.current);
  }

  function showTooltip(event: SyntheticEvent<HTMLButtonElement>) {
    cancelDismiss();
    const bounds = event.currentTarget.getBoundingClientRect();
    setAnchor({ top: bounds.top - 8, left: Math.max(12, Math.min(bounds.left, window.innerWidth - 252)) });
  }

  function scheduleDismiss() {
    cancelDismiss();
    dismissTimer.current = setTimeout(() => setAnchor(null), 120);
  }

  useEffect(() => {
    if (!anchor) return;
    const dismiss = () => setAnchor(null);
    const handleScroll = () => {
      const button = buttonRef.current;
      if (!button || document.activeElement !== button) {
        dismiss();
        return;
      }
      const bounds = button.getBoundingClientRect();
      setAnchor({ top: bounds.top - 8, left: Math.max(12, Math.min(bounds.left, window.innerWidth - 252)) });
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") dismiss();
    };
    window.addEventListener("scroll", handleScroll, true);
    window.addEventListener("resize", dismiss);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      cancelDismiss();
      window.removeEventListener("scroll", handleScroll, true);
      window.removeEventListener("resize", dismiss);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [anchor]);

  return (
    <>
      <button
        {...buttonProps}
        ref={buttonRef}
        type={type}
        aria-describedby={
          [buttonProps["aria-describedby"], anchor ? tooltipId : undefined].filter(Boolean).join(" ") || undefined
        }
        onMouseEnter={(event) => {
          showTooltip(event);
          onMouseEnter?.(event);
        }}
        onMouseLeave={(event) => {
          scheduleDismiss();
          onMouseLeave?.(event);
        }}
        onFocus={(event) => {
          showTooltip(event);
          onFocus?.(event);
        }}
        onBlur={(event) => {
          setAnchor(null);
          onBlur?.(event);
        }}
        onClick={(event) => {
          setAnchor(null);
          onClick?.(event);
        }}
      >
        {children}
      </button>
      {anchor && createPortal(
        <div
          id={tooltipId}
          role="tooltip"
          className={styles.tooltip}
          style={{ top: anchor.top, left: anchor.left }}
          onMouseEnter={cancelDismiss}
          onMouseLeave={scheduleDismiss}
        >
          {tooltip}
        </div>,
        document.body,
      )}
    </>
  );
}
