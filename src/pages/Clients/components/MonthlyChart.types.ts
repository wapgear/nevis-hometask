import type { ClientNode } from "../Clients.types";

export interface MonthlyChartProps {
  node: ClientNode;
  months: readonly string[];
  hiddenSeries: ReadonlySet<string>;
  onToggleSeries: (label: string) => void;
}
