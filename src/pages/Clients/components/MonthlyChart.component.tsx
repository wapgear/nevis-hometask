import styles from "../Clients.module.scss";
import { useLayoutEffect, useRef, useState } from "react";

import { chartData, chartSeriesLabels } from "../Clients.utils";
import type { MonthlyChartProps } from "./MonthlyChart.types";
import { MonthlyChartBar } from "./MonthlyChartBar.component";
import { MonthlyChartTooltip } from "./MonthlyChartTooltip.component";
import { useAnimatedNumber } from "./hooks/useAnimatedNumber";

export function MonthlyChart({ node, months, hiddenSeries, onToggleSeries }: MonthlyChartProps) {
  const rows = chartData(node, months, hiddenSeries);
  const scope = node.name;

  const [activeBar, setActiveBar] = useState<{ scopeId: string; index: number } | null>(null);
  const active = activeBar?.scopeId === node.id ? activeBar.index : null;
  const panelRef = useRef<HTMLElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const dismissTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const largest = Math.max(...rows.map((row) => row.plotted));
  const step = largest > 100 ? 100 : largest > 20 ? 20 : largest > 4 ? 4 : 1;
  const maximum = Math.max(4, Math.ceil(largest / step) * step);
  const displayedMaximum = useAnimatedNumber(maximum);
  const current = active === null ? null : rows[active];

  function cancelDismiss() {
    clearTimeout(dismissTimer.current);
  }

  function scheduleDismiss() {
    cancelDismiss();
    dismissTimer.current = setTimeout(() => {
      if (tooltipRef.current?.matches(":hover") || panelRef.current?.querySelector("[data-chart-bar]:focus")) return;
      setActiveBar(null);
    }, 250);
  }

  function toggleSeries(label: string) {
    onToggleSeries(label);
    setActiveBar(null);
  }

  useLayoutEffect(() => {
    const panel = panelRef.current;
    const tooltip = tooltipRef.current;
    if (!panel || !tooltip || active === null) return;
    const bar = panel.querySelectorAll<HTMLButtonElement>("[data-chart-bar]")[active];
    const scroller = panel.querySelector("[data-chart-scroll]");
    if (!bar || !scroller) return;

    const positionTooltip = () => {
      const bounds = panel.getBoundingClientRect();
      const anchor = bar.getBoundingClientRect();
      const visible = scroller.getBoundingClientRect();
      const size = tooltip.getBoundingClientRect();
      tooltip.style.visibility =
        anchor.right <= visible.left || anchor.left >= visible.right ? "hidden" : "visible";
      let left = anchor.right - bounds.left + 10;
      if (left + size.width > bounds.width - 8) left = anchor.left - bounds.left - size.width - 10;
      tooltip.style.left = `${Math.max(8, Math.min(left, bounds.width - size.width - 8))}px`;
      tooltip.style.top = `${Math.max(8, Math.min(anchor.top - bounds.top, bounds.height - size.height - 8))}px`;
    };

    positionTooltip();
    const observer = new ResizeObserver(positionTooltip);
    observer.observe(panel);
    observer.observe(tooltip);
    observer.observe(bar);
    const dismissOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setActiveBar(null);
    };
    window.addEventListener("keydown", dismissOnEscape);
    window.addEventListener("resize", positionTooltip);
    window.addEventListener("scroll", positionTooltip, true);
    return () => {
      clearTimeout(dismissTimer.current);
      observer.disconnect();
      window.removeEventListener("keydown", dismissOnEscape);
      window.removeEventListener("resize", positionTooltip);
      window.removeEventListener("scroll", positionTooltip, true);
    };
  }, [active, node, months]);

  return (
    <>
      <figure
        ref={panelRef}
        className={styles["chart-panel"]}
        aria-label={`Monthly clients for ${scope}`}
      >
        <div
          className={styles["chart-scroll"]}
          data-chart-scroll
          tabIndex={0}
          role="region"
          aria-label="Monthly chart; scroll horizontally on smaller screens"
        >
          <div className={styles["plot"]}>
            <div className={styles["grid-lines"]} aria-hidden="true" data-chart-scale>
              {[4, 3, 2, 1, 0].map((tick) => (
                <div className={styles["grid-line"]} key={tick}>
                  <span>{Math.round((displayedMaximum * tick) / 4)}</span>
                </div>
              ))}
            </div>
            <div className={styles["bars"]}>
              {rows.map((row, i) => (
                <MonthlyChartBar
                  key={row.month}
                  row={row}
                  maximum={maximum}
                  scope={scope}
                  onActivate={() => {
                    cancelDismiss();
                    setActiveBar({ scopeId: node.id, index: i });
                  }}
                  onDeactivate={scheduleDismiss}
                />
              ))}
            </div>
          </div>
        </div>
        <figcaption>
          <span className={styles["sr-only"]}>Monthly clients for {scope}. </span>
          <ul className={styles["legend"]}>
            {chartSeriesLabels.map((label, i) => (
              <li key={label}>
                <button
                  type="button"
                  className={styles["legend-button"]}
                  aria-pressed={!hiddenSeries.has(label)}
                  onClick={() => toggleSeries(label)}
                >
                  <span className={`${styles.swatch} ${styles[`series-${i}`]}`} aria-hidden="true" />
                  {label}
                </button>
              </li>
            ))}
          </ul>
        </figcaption>
        {current && (
          <MonthlyChartTooltip
            ref={tooltipRef}
            row={current}
            scope={scope}
            onMouseEnter={cancelDismiss}
            onMouseLeave={scheduleDismiss}
          />
        )}
      </figure>
    </>
  );
}
