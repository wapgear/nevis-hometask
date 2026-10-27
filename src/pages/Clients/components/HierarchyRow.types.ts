import type { HierarchyTableRow } from "./HierarchyTable.types";

export interface HierarchyRowProps {
  node: HierarchyTableRow["node"];
  months: readonly string[];
  depth: number;
  ancestors: string;
  hasChildren: boolean;
  expanded: boolean;
  rowIndex: number;
  rowCount: number;
  chartSelected: boolean;
  onSelectChart: (id: string) => void;
  onToggle: (id: string) => void;
  onFocusRow: (index: number, direction: -1 | 1) => void;
}
