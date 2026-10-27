import type { ReactNode } from "react";

import styles from "./DataState.module.scss";

export function DataState({ title, description, icon, role = "status", children }: {
  title: string;
  description: string;
  icon: ReactNode;
  role?: "status" | "alert";
  children?: ReactNode;
}) {
  return (
    <section className={styles.state} role={role}>
      <div className={styles.content}>
        <span className={styles.icon} aria-hidden="true">{icon}</span>
        <h2>{title}</h2>
        <p>{description}</p>
        {children}
      </div>
    </section>
  );
}
