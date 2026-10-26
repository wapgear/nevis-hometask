import type { Ref } from "react";

import type { chartData } from "../Clients.utils";

export interface MonthlyChartTooltipProps {
  row: ReturnType<typeof chartData>[number];
  scope: string;
  ref?: Ref<HTMLDivElement>;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}
