import { useEffect, useState } from "react";
import type { RefObject } from "react";

export function useTableOverflow(scrollRef: RefObject<HTMLDivElement | null>) {
  const [hasOverflow, setHasOverflow] = useState(false);

  useEffect(() => {
    const container = scrollRef.current;
    const table = container?.querySelector("table");
    if (!container || !table) return;

    function updateOverflow() {
      if (container) setHasOverflow(container.scrollWidth > container.clientWidth);
    }

    const observer = new ResizeObserver(updateOverflow);
    observer.observe(container);
    observer.observe(table);
    updateOverflow();
    return () => observer.disconnect();
  }, [scrollRef]);

  return hasOverflow;
}
