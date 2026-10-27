import { useState } from "react";

import styles from "./Avatar.module.scss";
import type { AvatarProps } from "./Avatar.types";

function initials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0] ?? "")
    .join("")
    .toUpperCase();
}

export function Avatar({ src, name }: AvatarProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);

  return src && src !== failedSrc ? (
    <img
      className={styles.avatar}
      src={src}
      alt=""
      aria-hidden="true"
      onError={() => setFailedSrc(src)}
    />
  ) : (
    <span className={[styles.avatar, styles.fallback].join(" ")} aria-hidden="true">
      {initials(name)}
    </span>
  );
}
