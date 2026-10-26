import type { ClientNode } from "../Clients.types";

export interface HierarchyTableProps {
  root: ClientNode;
  months: readonly string[];
  selectedId: string;
  onSelectChart: (id: string) => void;
}

export interface HierarchyTableRow {
  key: string;
  node: Pick<ClientNode, "id" | "name" | "kind" | "avatarUrl"> & { values: (number | null)[] };
  depth: number;
  ancestors: string;
  ancestorIds: string[];
  hasChildren: boolean;
  expanded: boolean;
}
