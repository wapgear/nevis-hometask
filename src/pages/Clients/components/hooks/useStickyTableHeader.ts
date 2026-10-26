import { useEffect } from "react";
import type { RefObject } from "react";

export function useStickyTableHeader(scrollRef: RefObject<HTMLDivElement | null>) {
  useEffect(() => {
    const container = scrollRef.current;
    const header = container?.querySelector("thead");
    if (!container || !header) return;

    let frame = 0;
    function updateOffset() {
      frame = 0;
      if (!container || !header) return;
      const bounds = container.getBoundingClientRect();
      const offset = Math.max(0, Math.min(-bounds.top, container.clientHeight - header.clientHeight));
      container.style.setProperty("--hierarchy-header-offset", `${offset}px`);
    }
    function scheduleUpdate() {
      if (!frame) frame = requestAnimationFrame(updateOffset);
    }

    // Horizontal overflow contains native sticky positioning, so follow the page scroll.
    const observer = new ResizeObserver(scheduleUpdate);
    observer.observe(container);
    observer.observe(header);
    window.addEventListener("scroll", scheduleUpdate, { passive: true });
    window.addEventListener("resize", scheduleUpdate);
    updateOffset();

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("scroll", scheduleUpdate);
      window.removeEventListener("resize", scheduleUpdate);
      container.style.removeProperty("--hierarchy-header-offset");
    };
  }, [scrollRef]);
}
