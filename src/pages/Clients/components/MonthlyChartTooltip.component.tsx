import styles from "../Clients.module.scss";
import type { MonthlyChartTooltipProps } from "./MonthlyChartTooltip.types";

export function MonthlyChartTooltip({ row, scope, ref, onMouseEnter, onMouseLeave }: MonthlyChartTooltipProps) {
  return (
    <div
      ref={ref}
      className={styles["chart-tooltip"]}
      role="status"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <strong>
        {row.month} · {scope}
      </strong>
      <span>Reported total: {row.total}</span>
      {row.series.map((series, index) => series.visible && (
        <span key={series.label} className={styles["tooltip-series"]}>
          <span className={`${styles.swatch} ${styles[`series-${index}`]}`} aria-hidden="true" />
          <span>{series.label}: {series.value}</span>
        </span>
      ))}
      {row.excess > 0 && (
        <strong>Channel sum exceeds reported total by {row.excess}.</strong>
      )}
    </div>
  );
}
