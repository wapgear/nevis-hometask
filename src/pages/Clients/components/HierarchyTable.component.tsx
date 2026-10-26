import styles from "../Clients.module.scss";
import { useCallback, useEffect, useRef, useState } from "react";
import type { CSSProperties, FocusEvent } from "react";

import { formatMonth, reportingRange } from "../Clients.utils";
import { HierarchyRow } from "./HierarchyRow.component";
import type { HierarchyTableProps } from "./HierarchyTable.types";
import { useClientHierarchy } from "./hooks/useClientHierarchy";
import { hierarchyMotionDuration, useAnimatedHierarchyRows } from "./hooks/useAnimatedHierarchyRows";
import { useStickyTableHeader } from "./hooks/useStickyTableHeader";

export function HierarchyTable({ root, months, selectedId, onSelectChart }: HierarchyTableProps) {
  const { rows, toggle } = useClientHierarchy(root);
  const animatedRows = useAnimatedHierarchyRows(rows);
  const scrollRef = useRef<HTMLDivElement>(null);
  useStickyTableHeader(scrollRef);
  const [focusedRowKey, setFocusedRowKey] = useState<string | null>(null);
  const focusedAncestorsRef = useRef<string[]>([]);

  const focusAt = useCallback(
    (index: number, direction: -1 | 1) => {
      const currentRows = rows;
      let targetIndex = index;
      while (
        targetIndex >= 0 &&
        targetIndex < currentRows.length &&
        !currentRows[targetIndex]!.hasChildren
      ) {
        targetIndex += direction;
      }
      if (targetIndex < 0 || targetIndex >= currentRows.length) return;
      requestAnimationFrame(() => {
        const targetRow = currentRows[targetIndex]!;
        const rowElement = scrollRef.current?.querySelector<HTMLElement>(
          `[data-row-id="${CSS.escape(targetRow.key)}"]`,
        );
        rowElement?.querySelector<HTMLElement>("[data-hierarchy-action]")?.focus();
      });
    },
    [rows],
  );

  function handleFocusCapture(event: FocusEvent<HTMLDivElement>) {
    const row = (event.target as HTMLElement).closest<HTMLElement>("[data-row-index]");
    if (row) {
      const descriptor = rows[Number(row.dataset.rowIndex)];
      setFocusedRowKey(descriptor?.key ?? null);
      focusedAncestorsRef.current = descriptor?.ancestorIds ?? [];
    }
  }

  useEffect(() => {
    if (!focusedRowKey || rows.some((row) => row.key === focusedRowKey)) return;
    const fallbackId =
      [...focusedAncestorsRef.current].reverse().find((id) => rows.some((row) => row.key === id)) ??
      root.id;
    requestAnimationFrame(() => {
      scrollRef.current
        ?.querySelector<HTMLElement>(
          `[data-row-id="${CSS.escape(fallbackId)}"] [data-hierarchy-action]`,
        )
        ?.focus();
    });
    setFocusedRowKey(fallbackId);
  }, [focusedRowKey, rows, root.id]);

  function handleBlurCapture(event: FocusEvent<HTMLDivElement>) {
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setFocusedRowKey(null);
  }

  return (
    <section aria-label="Monthly client details">
      <div
        ref={scrollRef}
        className={[styles["table-scroll"], styles["hierarchy"]].join(" ")}
        style={{ "--hierarchy-motion-duration": `${hierarchyMotionDuration}ms` } as CSSProperties}
        data-hierarchy-scroll
        role="region"
        aria-label="Monthly client hierarchy, scroll horizontally for all months"
        tabIndex={0}
        onFocusCapture={handleFocusCapture}
        onBlurCapture={handleBlurCapture}
      >
        <table>
          <caption className={styles["sr-only"]}>
            Reported clients, {reportingRange(months)}. Company contains branches,
            branches contain employees, employees may contain acquisition channels. Expand controls
            reveal the next level. A dash means channel values were not supplied.
          </caption>
          <colgroup>
            <col className={styles["hierarchy-name-column"]} />
            {months.map((month) => (
              <col key={month} />
            ))}
          </colgroup>
          <thead>
            <tr>
              <th scope="col">
                <span className={styles["sr-only"]}>Company, branch, employee or channel</span>
              </th>
              {months.map((month) => (
                <th scope="col" key={month}>
                  {formatMonth(month)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {animatedRows.map(({ row, exiting }) => (
              <HierarchyRow
                key={row.key}
                node={row.node}
                months={months}
                depth={row.depth}
                ancestors={row.ancestors}
                hasChildren={row.hasChildren}
                expanded={row.expanded}
                exiting={exiting}
                rowIndex={rows.findIndex((visible) => visible.key === row.key)}
                rowCount={rows.length}
                chartSelected={selectedId === row.node.id}
                onSelectChart={onSelectChart}
                onToggle={toggle}
                onFocusRow={focusAt}
              />
            ))}
          </tbody>
        </table>
      </div>
      <p className={styles["scroll-hint"]}>Scroll horizontally to see all months.</p>
    </section>
  );
}
