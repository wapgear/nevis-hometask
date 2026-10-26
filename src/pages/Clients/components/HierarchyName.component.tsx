import { useState } from "react";

import styles from "../Clients.module.scss";
import type { HierarchyNameProps } from "./HierarchyName.types";

function initials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0] ?? "")
    .join("")
    .toUpperCase();
}

export function HierarchyName({ avatarUrl, name, isEmployee }: HierarchyNameProps) {
  const [failedAvatarUrl, setFailedAvatarUrl] = useState<string | null>(null);

  return (
    <>
      {isEmployee &&
        (avatarUrl && avatarUrl !== failedAvatarUrl ? (
          <img
            className={styles["employee-avatar"]}
            src={avatarUrl}
            alt=""
            aria-hidden="true"
            onError={() => setFailedAvatarUrl(avatarUrl)}
          />
        ) : (
          <span
            className={[styles["employee-avatar"], styles["employee-avatar-fallback"]].join(" ")}
            aria-hidden="true"
          >
            {initials(name)}
          </span>
        ))}
      <span className={styles["hierarchy-name"]}>{name}</span>
    </>
  );
}
