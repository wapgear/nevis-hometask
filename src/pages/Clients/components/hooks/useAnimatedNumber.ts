import { useLayoutEffect, useRef, useState } from "react";

export function useAnimatedNumber(target: number) {
  const [displayed, setDisplayed] = useState(target);
  const currentRef = useRef(target);

  useLayoutEffect(() => {
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const from = currentRef.current;
    const started = performance.now();
    let frame = 0;

    function update(value: number) {
      currentRef.current = value;
      setDisplayed(value);
    }

    function animate(now: number) {
      const progress = Math.min(1, (now - started) / 280);
      const eased = 1 - (1 - progress) ** 3;
      update(progress === 1 ? target : from + (target - from) * eased);
      if (progress < 1) frame = requestAnimationFrame(animate);
    }

    function handleMotionChange() {
      if (motion.matches) {
        cancelAnimationFrame(frame);
        update(target);
      }
    }

    if (motion.matches) update(target);
    else if (from !== target) frame = requestAnimationFrame(animate);
    motion.addEventListener("change", handleMotionChange);

    return () => {
      cancelAnimationFrame(frame);
      motion.removeEventListener("change", handleMotionChange);
    };
  }, [target]);

  return displayed;
}
