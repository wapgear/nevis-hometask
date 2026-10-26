import type { ClientNode } from "./Clients.types";
import type { ClientKind } from "../../../shared/clients";
import { CHART_SERIES_LABELS, childrenOf } from "../../../shared/clients";
export {
  CHART_SERIES_LABELS as chartSeriesLabels,
  childrenOf,
  parseClients,
} from "../../../shared/clients";

const monthFormatter = new Intl.DateTimeFormat("en", {
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

const scopeTypes: Record<ClientKind, string> = {
  company: "Company",
  branch: "Branch",
  employee: "Employee",
  channel: "Channel",
};

export function scopeLabel(node: ClientNode): string {
  return `${scopeTypes[node.kind]}: ${node.name}`;
}

export function formatMonth(month: string): string {
  return monthFormatter.format(new Date(`${month}-01T00:00:00Z`));
}

export function reportingRange(months: readonly string[]): string {
  if (months.length === 0) return "";
  const first = formatMonth(months[0]!);
  return months.length === 1 ? first : `${first} – ${formatMonth(months.at(-1)!)}`;
}

export function flatten(node: ClientNode): ClientNode[] {
  return [node, ...childrenOf(node).flatMap(flatten)];
}

export function chartData(
  node: ClientNode,
  months: readonly string[],
  hiddenSeries?: ReadonlySet<string>,
) {
  return months.map((month, i) => {
    const { known, missing, excess } = node.chart[i]!;
    const total = node.values[i]!;
    const values = [...known, missing];
    const series = CHART_SERIES_LABELS.map((label, index) => ({
      label,
      value: values[index]!,
      visible: !hiddenSeries?.has(label),
    }));
    return {
      month: formatMonth(month),
      total,
      known,
      missing,
      excess,
      plotted: series.reduce((visibleTotal, entry) => visibleTotal + (entry.visible ? entry.value : 0), 0),
      series,
    };
  });
}
