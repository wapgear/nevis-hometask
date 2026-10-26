import { useEffect, useState } from "react";

import type { HierarchyTableRow } from "../HierarchyTable.types";

export const hierarchyMotionDuration = 300;

export function useAnimatedHierarchyRows(rows: HierarchyTableRow[]) {
  const [previousRows, setPreviousRows] = useState(rows);
  const [renderedRows, setRenderedRows] = useState(rows);
  const visibleKeys = new Set(rows.map((row) => row.key));

  if (rows !== previousRows) {
    setPreviousRows(rows);
    const nextRows = [...rows];
    let insertionIndex = 0;
    for (const row of renderedRows) {
      if (visibleKeys.has(row.key)) {
        insertionIndex = nextRows.findIndex((next) => next.key === row.key) + 1;
      } else {
        nextRows.splice(insertionIndex++, 0, row);
      }
    }
    setRenderedRows(nextRows);
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const keys = new Set(rows.map((row) => row.key));
      setRenderedRows((current) => current.filter((row) => keys.has(row.key)));
    }, hierarchyMotionDuration);
    return () => window.clearTimeout(timer);
  }, [rows]);

  return renderedRows.map((row) => ({ row, exiting: !visibleKeys.has(row.key) }));
}
