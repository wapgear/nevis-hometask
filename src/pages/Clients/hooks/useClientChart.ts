import { useMemo, useState } from "react";

import type { ClientNode } from "../Clients.types";
import { flatten } from "../Clients.utils";

export function useClientChart(data: ClientNode | null) {
  const [selectedId, setSelectedId] = useState("");
  const [hiddenSeries, setHiddenSeries] = useState<Set<string>>(() => new Set());

  const scopes = useMemo(() => (data ? flatten(data) : []), [data]);

  const selected = scopes.find((node) => node.id === selectedId) ?? data;

  return {
    selected,
    hiddenSeries,
    customized: selected?.id !== data?.id || hiddenSeries.size > 0,
    selectScope: setSelectedId,
    toggleSeries(label: string) {
      setHiddenSeries((hidden) => {
        const next = new Set(hidden);
        if (next.has(label)) next.delete(label);
        else next.add(label);
        return next;
      });
    },
    resetChart() {
      setSelectedId("");
      setHiddenSeries(new Set());
    },
  };
}
