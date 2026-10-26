import { useLayoutEffect, useRef } from "react";

import { demoScenarios, parseDemoScenario } from "../../../../shared/demo";
import type { DemoScenario } from "../../../../shared/demo";
import { Select } from "../../../components/Select/Select.component";
import styles from "./DemoControls.module.scss";

export function DemoControls({ scenario, onChange, onReload }: {
  scenario: DemoScenario;
  onChange: (scenario: DemoScenario) => void;
  onReload: () => void;
}) {
  const controlsRef = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    const controls = controlsRef.current;
    const main = controls?.closest("main");
    if (!controls || !main) return;
    const updateClearance = () => {
      main.style.setProperty("--demo-controls-height", `${controls.getBoundingClientRect().height}px`);
    };
    updateClearance();
    const observer = new ResizeObserver(updateClearance);
    observer.observe(controls);
    return () => {
      observer.disconnect();
      main.style.removeProperty("--demo-controls-height");
    };
  }, []);

  return (
    <aside ref={controlsRef} className={styles.controls} aria-label="Demo controls">
      <div className={styles.heading}>Demo mode</div>
      <div className={styles.actions}>
        <label className={styles.field}>
          <span>Server state</span>
          <Select
            value={scenario}
            aria-describedby="demo-description"
            onChange={(event) => onChange(parseDemoScenario(event.target.value))}
          >
            {Object.entries(demoScenarios).map(([value, { label }]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </Select>
        </label>
        <button type="button" className={styles.reload} onClick={onReload}>Reload data</button>
      </div>
      <p id="demo-description" className={styles.description}>
        {demoScenarios[scenario].description}
      </p>
    </aside>
  );
}

