import type { chartData } from "../Clients.utils";

export interface MonthlyChartBarProps {
  row: ReturnType<typeof chartData>[number];
  maximum: number;
  scope: string;
  onActivate: () => void;
  onDeactivate: () => void;
}
