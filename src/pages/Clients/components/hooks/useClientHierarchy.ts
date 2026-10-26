import { useMemo, useState } from "react";

import type { ClientNode } from "../../Clients.types";
import { childrenOf } from "../../Clients.utils";
import type { HierarchyTableRow } from "../HierarchyTable.types";

export function useClientHierarchy(root: ClientNode) {
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set([root.id]));

  const rows = useMemo(() => {
    const visible: HierarchyTableRow[] = [];

    function appendRow(
      node: HierarchyTableRow["node"],
      depth: number,
      ancestors: ClientNode[],
      hasChildren: boolean,
    ) {
      visible.push({
        key: node.id,
        node,
        depth,
        ancestors: ancestors.map((ancestor) => ancestor.name).join(", "),
        ancestorIds: ancestors.map((ancestor) => ancestor.id),
        hasChildren,
        expanded: expanded.has(node.id),
      });
    }

    function visit(node: ClientNode, depth: number, ancestors: ClientNode[]) {
      const children = childrenOf(node);
      appendRow(node, depth, ancestors, children.length > 0 || node.unavailableChannels.length > 0);
      if (expanded.has(node.id)) {
        for (const child of children) visit(child, depth + 1, [...ancestors, node]);
        for (const channel of node.unavailableChannels) {
          appendRow(channel, depth + 1, [...ancestors, node], false);
        }
      }
    }

    visit(root, 0, []);
    return visible;
  }, [expanded, root]);

  function toggle(id: string) {
    setExpanded((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return { rows, toggle };
}
