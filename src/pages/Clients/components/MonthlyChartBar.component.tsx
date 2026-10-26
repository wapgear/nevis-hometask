import styles from "../Clients.module.scss";
import type { MonthlyChartBarProps } from "./MonthlyChartBar.types";

export function MonthlyChartBar({
  row,
  maximum,
  scope,
  onActivate,
  onDeactivate,
}: MonthlyChartBarProps) {
  const visibleSeries = row.series.filter((series) => series.visible);

  return (
    <div className={styles["bar-column"]}>
      <button
        type="button"
        className={styles.bar}
        data-chart-bar
        style={{ height: `${(row.plotted / maximum) * 100}%` }}
        aria-label={`${row.month}, ${scope}: ${row.total} reported clients. ${visibleSeries.length ? visibleSeries.map((series) => `${series.label}: ${series.value}`).join(". ") : "No channels shown."}${row.excess ? `. Channel values exceed reported total by ${row.excess}` : ""}`}
        onFocus={onActivate}
        onBlur={onDeactivate}
        onMouseEnter={onActivate}
        onMouseLeave={(event) => {
          if (document.activeElement !== event.currentTarget) onDeactivate();
        }}
        onClick={onActivate}
      >
        {row.series.map((series, index) => (
          <span
            key={series.label}
            data-series={series.label}
            data-value={series.visible ? series.value : 0}
            className={`${styles.segment} ${styles[`series-${index}`]}`}
            style={{ height: `${row.plotted && series.visible ? (series.value / row.plotted) * 100 : 0}%` }}
          />
        ))}
      </button>
      <span className={styles.month}>{row.month}</span>
    </div>
  );
}
