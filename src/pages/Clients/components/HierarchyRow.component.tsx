import styles from "../Clients.module.scss";
import type { CSSProperties, KeyboardEvent } from "react";

import { HierarchyName } from "./HierarchyName.component";
import { ChartFilterAction } from "./ChartFilterAction.component";
import type { HierarchyRowProps } from "./HierarchyRow.types";

export function HierarchyRow({
  node,
  months,
  depth,
  ancestors,
  hasChildren,
  expanded,
  rowIndex,
  rowCount,
  chartSelected,
  onSelectChart,
  onToggle,
  onFocusRow,
}: HierarchyRowProps) {
  const isEmployee = node.kind === "employee";

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    switch (event.key) {
      case "ArrowDown":
        onFocusRow(rowIndex + 1, 1);
        break;
      case "ArrowUp":
        onFocusRow(rowIndex - 1, -1);
        break;
      case "Home":
        onFocusRow(0, 1);
        break;
      case "End":
        onFocusRow(rowCount - 1, -1);
        break;
      default:
        return;
    }
    event.preventDefault();
  }

  return (
    <tr
      className={styles["hierarchy-row"]}
      data-node-kind={node.kind}
      data-row-index={rowIndex}
      data-row-id={node.id}
    >
      <th scope="row" className={styles["hierarchy-name-cell"]}>
        <div className={styles["hierarchy-cell-content"]}>
          <div className={styles["row-label"]} style={{ "--hierarchy-depth": depth } as CSSProperties}>
            {hasChildren ? (
              <button
                type="button"
                className={styles["hierarchy-expander"]}
                data-hierarchy-action
                aria-label={`${expanded ? "Collapse" : "Expand"} ${node.name}`}
                aria-expanded={expanded}
                onKeyDown={handleKeyDown}
                onClick={() => onToggle(node.id)}
              >
                <svg
                  viewBox="0 0 16 16"
                  aria-hidden="true"
                  className={expanded ? styles.open : undefined}
                >
                  <path d="m6 4 4 4-4 4" />
                </svg>
                <HierarchyName avatarUrl={node.avatarUrl} name={node.name} isEmployee={isEmployee} />
              </button>
            ) : (
              <span className={styles["hierarchy-leaf"]}>
                <span className={styles["disclosure-spacer"]} aria-hidden="true" />
                <HierarchyName avatarUrl={node.avatarUrl} name={node.name} isEmployee={isEmployee} />
              </span>
            )}
            {node.values.some((value) => value !== null) && (
              <ChartFilterAction
                name={node.name}
                selected={chartSelected}
                onSelect={() => onSelectChart(node.id)}
              />
            )}
            {ancestors && (
              <span className={styles["sr-only"]}>
                Level {depth + 1}, within {ancestors}.
              </span>
            )}
          </div>
        </div>
      </th>
      {node.values.map((value, index) => (
        <td
          key={months[index]}
          className={value === null ? styles["unavailable-value"] : undefined}
          aria-label={value === null ? "Channel data unavailable" : undefined}
        >
          <div className={styles["hierarchy-cell-content"]}>{value ?? "-"}</div>
        </td>
      ))}
    </tr>
  );
}
