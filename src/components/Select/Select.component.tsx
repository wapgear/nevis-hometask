import styles from "./Select.module.scss";
import type { SelectProps } from "./Select.types";

export function Select({ className, children, ...props }: SelectProps) {
  return (
    <span className={styles.control}>
      <select className={[styles.select, className].filter(Boolean).join(" ")} {...props}>
        {children}
      </select>
      <svg className={styles.arrow} viewBox="0 0 16 16" aria-hidden="true">
        <path d="m4 6 4 4 4-4" />
      </svg>
    </span>
  );
}
