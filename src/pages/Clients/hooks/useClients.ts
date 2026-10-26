import { useCallback, useEffect, useState } from "react";

import type { DemoScenario } from "../../../../shared/demo";
import type { LoadState } from "../Clients.types";
import { parseClients } from "../Clients.utils";

export function useClients(scenario: DemoScenario | null = null) {
  const [state, setState] = useState<LoadState>({ status: "loading" });
  const [attempt, setAttempt] = useState(0);

  const retry = useCallback(() => {
    setState({ status: "loading" });
    setAttempt((value) => value + 1);
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      setState({ status: "loading" });
      try {
        const url = scenario ? `/api/clients?demo=${scenario}` : "/api/clients";
        const response = await fetch(url, { signal: controller.signal });
        if (!response.ok) throw new Error(`Could not load clients (${response.status}).`);
        const payload: unknown = await response.json();
        if (controller.signal.aborted) return;
        setState({ status: "ready", ...parseClients(payload) });
      } catch (error: unknown) {
        if (controller.signal.aborted) return;
        const message = error instanceof Error ? error.message : "Could not load clients.";
        setState({ status: "error", message });
      }
    }

    const timeout = window.setTimeout(() => void load(), 0);
    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [attempt, scenario]);

  return { state, retry };
}
