import { useState } from "react";

import { parseDemoScenario } from "../../../../shared/demo";
import type { DemoScenario } from "../../../../shared/demo";

export function useDemoScenario() {
  const [scenario, setScenario] = useState<DemoScenario | null>(() => {
    const params = new URLSearchParams(window.location.search);
    return params.has("demo") ? parseDemoScenario(params.get("demo")) : null;
  });

  function selectScenario(value: DemoScenario | null) {
    const url = new URL(window.location.href);
    if (value) url.searchParams.set("demo", value);
    else url.searchParams.delete("demo");
    window.history.replaceState(window.history.state, "", url);
    setScenario(value);
  }

  return { scenario, selectScenario };
}
