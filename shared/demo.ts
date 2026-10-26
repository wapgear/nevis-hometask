export const demoScenarios = {
  normal: { label: "Healthy", description: "Returns the original client data." },
  slow: { label: "Slow (3 seconds)", description: "Delays the response to show the loading state." },
  dead: { label: "Unavailable (503)", description: "Returns a server error, including on retry." },
  empty: { label: "Empty data", description: "Returns no clients to show the empty state." },
  malformed: { label: "Malformed data", description: "Returns invalid data to show response validation." },
} as const;

export type DemoScenario = keyof typeof demoScenarios;

export function parseDemoScenario(value: unknown): DemoScenario {
  return typeof value === "string" && Object.hasOwn(demoScenarios, value)
    ? value as DemoScenario
    : "normal";
}
