import { useEffect, useId, useRef, useState } from "react";
import type { SyntheticEvent } from "react";
import { createPortal } from "react-dom";

import styles from "../Clients.module.scss";

export function ChartFilterAction({ name, selected, onSelect }: {
  name: string;
  selected: boolean;
  onSelect: () => void;
}) {
  const tooltipId = useId();
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
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") dismiss();
    };
    window.addEventListener("scroll", dismiss, true);
    window.addEventListener("resize", dismiss);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      cancelDismiss();
      window.removeEventListener("scroll", dismiss, true);
      window.removeEventListener("resize", dismiss);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [anchor]);

  return (
    <>
      <button
        type="button"
        className={styles["row-chart-action"]}
        aria-label={`Show chart for ${name}`}
        aria-pressed={selected}
        aria-describedby={anchor ? tooltipId : undefined}
        onMouseEnter={showTooltip}
        onMouseLeave={scheduleDismiss}
        onFocus={showTooltip}
        onBlur={() => setAnchor(null)}
        onClick={() => {
          setAnchor(null);
          onSelect();
        }}
      >
        <svg viewBox="0 0 20 20" aria-hidden="true">
          <path d="M3.25 4h13.5L11.5 10v5l-3 1v-6L3.25 4Z" />
        </svg>
      </button>
      {anchor && createPortal(
        <div
          id={tooltipId}
          role="tooltip"
          className={styles["row-chart-tooltip"]}
          style={{ top: anchor.top, left: anchor.left }}
          onMouseEnter={cancelDismiss}
          onMouseLeave={scheduleDismiss}
        >
          <strong>Filter chart</strong>
          <span>Show monthly clients for {name}.</span>
        </div>,
        document.body,
      )}
    </>
  );
}
