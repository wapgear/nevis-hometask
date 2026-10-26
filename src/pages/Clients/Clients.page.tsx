import { useEffect, useRef, useState } from "react";

import { DemoControls } from "./components/DemoControls.component";
import { HierarchyTable } from "./components/HierarchyTable.component";
import { MonthlyChart } from "./components/MonthlyChart.component";
import { useClientChart } from "./hooks/useClientChart";
import { useClients } from "./hooks/useClients";
import { useDemoScenario } from "./hooks/useDemoScenario";
import styles from "./Clients.module.scss";
import { chartData, reportingRange, scopeLabel } from "./Clients.utils";

export function ClientsPage() {
  const headingRef = useRef<HTMLHeadingElement>(null);
  const [noticeDismissed, setNoticeDismissed] = useState(false);
  const { scenario, selectScenario } = useDemoScenario();
  const { state, retry } = useClients(scenario);
  const data = state.status === "ready" ? state.data : null;
  const months = state.status === "ready" ? state.months : [];
  const { selected, hiddenSeries, customized, selectScope, toggleSeries, resetChart } = useClientChart(data);

  const excessMonths = selected ? chartData(selected, months).filter((row) => row.excess > 0) : [];
  const showNotice = excessMonths.length > 0 && !noticeDismissed;

  useEffect(() => {
    if (!showNotice) return;
    const dismissOnEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (document.activeElement?.closest('[data-data-notice]')) headingRef.current?.focus();
      setNoticeDismissed(true);
    };
    window.addEventListener("keydown", dismissOnEscape);
    return () => window.removeEventListener("keydown", dismissOnEscape);
  }, [showNotice]);

  return (
    <main className={styles.page} data-demo-mode={scenario ? true : undefined}>
      {scenario && (
        <DemoControls scenario={scenario} onChange={selectScenario} onReload={retry} />
      )}
      <p className={styles["sr-only"]} aria-live="polite">
        Chart scope: {selected ? scopeLabel(selected) : "No data"}
      </p>
      <header className={styles["page-heading"]}>
        <h1 ref={headingRef} tabIndex={-1}>Clients</h1>
        <div className={styles["heading-actions"]}>
          <button
            type="button"
            className={styles["heading-action"]}
            aria-pressed={scenario !== null}
            onClick={() => selectScenario(scenario ? null : "normal")}
          >
            Demo mode
          </button>
          {data && selected && customized && (
            <button
              type="button"
              className={styles["heading-action"]}
              onClick={() => {
                resetChart();
                setNoticeDismissed(false);
                headingRef.current?.focus();
              }}
            >
              <svg viewBox="0 0 16 16" aria-hidden="true">
                <path d="M3 6a5 5 0 1 1 0 4M3 2v4h4" />
              </svg>
              Reset chart
            </button>
          )}
        </div>
      </header>
      {state.status === "loading" && (
        <section className={styles.state} role="status">
          <span className={styles.spinner} aria-hidden="true" />
          Loading client data…
        </section>
      )}
      {state.status === "error" && (
        <section className={styles.state} role="alert">
          <h2>Client data unavailable</h2>
          <p>{state.message}</p>
          <button type="button" onClick={() => {
            retry();
            headingRef.current?.focus();
          }}>
            Try again
          </button>
        </section>
      )}
      {state.status === "ready" && !data && (
        <section className={styles.state} role="status">
          <h2>No client data</h2>
          <p>The API has no clients to display.</p>
        </section>
      )}
      {data && selected && (
        <>
          <MonthlyChart node={selected} months={months} hiddenSeries={hiddenSeries} onToggleSeries={toggleSeries} />
          <p className={styles["data-note"]}>
            {selected.name} · {reportingRange(months)}. Hatched gray shows clients without a supplied
            channel breakdown.
          </p>
          {showNotice && (
            <div className={styles["chart-warning"]} data-data-notice>
              <p role="region" aria-label="Data discrepancy details" tabIndex={0}>
                {excessMonths
                  .map(
                    (row) =>
                      `${row.month}: channel figures total ${row.plotted}, while the reported total is ${row.total}`,
                  )
                  .join("; ")}
                . The chart preserves the channel figures.
              </p>
              <button
                type="button"
                className={styles["notice-close"]}
                aria-label="Dismiss data notice"
                onClick={() => {
                  setNoticeDismissed(true);
                  headingRef.current?.focus();
                }}
              >
                <svg viewBox="0 0 16 16" aria-hidden="true">
                  <path d="m4 4 8 8M12 4l-8 8" />
                </svg>
              </button>
            </div>
          )}
          <HierarchyTable
            root={data}
            months={months}
            selectedId={selected.id}
            onSelectChart={(id) => {
              selectScope(id);
              setNoticeDismissed(false);
            }}
          />
        </>
      )}
    </main>
  );
}
