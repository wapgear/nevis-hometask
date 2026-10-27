import { useRef } from "react";

import { ClientDataEmpty } from "./components/ClientDataEmpty.component";
import { ClientDataError } from "./components/ClientDataError.component";
import { ClientDataLoading } from "./components/ClientDataLoading.component";
import { DemoControls } from "./components/DemoControls.component";
import { HierarchyTable } from "./components/HierarchyTable.component";
import { MonthlyChart } from "./components/MonthlyChart.component";
import { useClientChart } from "./hooks/useClientChart";
import { useClients } from "./hooks/useClients";
import { useDemoScenario } from "./hooks/useDemoScenario";
import styles from "./Clients.module.scss";
import { childrenOf, formatMonth, reportingRange, scopeLabel } from "./Clients.utils";

export function ClientsPage() {
  const headingRef = useRef<HTMLHeadingElement>(null);
  const { scenario, selectScenario } = useDemoScenario();
  const { state, retry } = useClients(scenario);
  const data = state.status === "ready" ? state.data : null;
  const months = state.status === "ready" ? state.months : [];
  const { selected, hiddenSeries, customized, selectScope, toggleSeries, resetChart } = useClientChart(data);

  const discrepancies = selected?.reportedChildTotals?.flatMap((total, index) =>
    total === selected.values[index] ? [] : [{ month: months[index]!, total, reported: selected.values[index]! }],
  ) ?? [];
  const excessMonths = selected?.chart.flatMap((row, index) => row.excess > 0 ? [formatMonth(months[index]!)] : []) ?? [];
  const lowerLevelMismatch = selected ? childrenOf(selected).some((child) => child.hasReportedMismatch) : false;
  const detailLabel = selected?.kind === "company" ? "Branch" : selected?.kind === "branch" ? "Advisor" : "Channel";

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
      {state.status === "loading" && <ClientDataLoading />}
      {state.status === "error" && (
        <ClientDataError
          message={state.message}
          onRetry={() => {
            retry();
            headingRef.current?.focus();
          }}
        />
      )}
      {state.status === "ready" && !data && <ClientDataEmpty />}
      {data && selected && (
        <>
          <MonthlyChart node={selected} months={months} hiddenSeries={hiddenSeries} onToggleSeries={toggleSeries} />
          <p className={styles["data-note"]}>
            {selected.name} · {reportingRange(months)}. Hatched gray includes missing channel
            breakdowns and unreconciled differences.
          </p>
          <HierarchyTable
            root={data}
            months={months}
            selectedId={selected.id}
            onSelectChart={selectScope}
          />
          {(selected.hasReportedMismatch || excessMonths.length > 0) && (
            <details key={selected.id} className={styles["data-discrepancies"]}>
              <summary>Data discrepancies for {selected.name}</summary>
              <div role="region" aria-label="Data discrepancy details">
                <p>Reported totals and supplied detail do not always agree. Original figures are preserved.</p>
                {discrepancies.length > 0 && (
                  <ul>
                    {discrepancies.map(({ month, total, reported }) => (
                      <li key={month}>{formatMonth(month)}: reported total {reported}; {detailLabel.toLowerCase()} total {total}.</li>
                    ))}
                  </ul>
                )}
                {excessMonths.length > 0 && (
                  <p>Channel figures exceed the reported total in {excessMonths.join(", ")}. The chart preserves the channel figures.</p>
                )}
                {lowerLevelMismatch && (
                  <p>There are also discrepancies at lower levels. Select a branch or advisor chart to inspect its totals.</p>
                )}
              </div>
            </details>
          )}
        </>
      )}
    </main>
  );
}
