import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

import { CHANNEL_NAMES, childrenOf, parseClients, type ClientNode, type ClientsDataset } from "../shared/clients.js";
import { parseClientSource, type SourceClientNode } from "./client-source.js";

export function createClientsDataset(source: unknown): ClientsDataset {
  const { months, data } = parseClientSource(source);

  function enrich(node: SourceClientNode): ClientNode {
    const children = childrenOf(node).map(enrich);
    const known = CHANNEL_NAMES.map(() => Array<number>(months.length).fill(0));
    if (node.kind === "channel") {
      const index = (CHANNEL_NAMES as readonly string[]).indexOf(node.name);
      known[index] = [...node.values];
    } else {
      for (const child of children) {
        child.chart.forEach((row, month) => {
          row.known.forEach((value, index) => { known[index]![month]! += value; });
        });
      }
    }
    const chart = node.values.map((total, month) => {
      const values = known.map((series) => series[month]!);
      const sum = values.reduce((a, b) => a + b, 0);
      return { known: values, missing: Math.max(0, total - sum), excess: Math.max(0, sum - total) };
    });
    const hasReportedMismatch = children.some((child) => child.hasReportedMismatch) ||
      (children.length > 0 && node.values.some((total, month) =>
        children.reduce((sum, child) => sum + child.values[month]!, 0) !== total));
    const unavailableChannels = node.kind === "employee" && children.length === 0
      ? CHANNEL_NAMES.map((name) => ({
        id: `${node.id}:channel:${name}`,
        name,
        kind: "channel" as const,
        values: months.map(() => null),
        avatarUrl: null,
      }))
      : [];
    return {
      id: node.id,
      name: node.name,
      values: node.values,
      kind: node.kind,
      avatarUrl: node.avatarUrl,
      ...(node.branches ? { branches: children } : {}),
      ...(node.employees ? { employees: children } : {}),
      ...(node.channels ? { channels: children } : {}),
      chart,
      hasReportedMismatch,
      unavailableChannels,
    };
  }

  return parseClients({ months, data: data ? enrich(data) : null });
}

const sourcePath = fileURLToPath(new URL("./clients.json", import.meta.url));
export async function loadClients(): Promise<Buffer> {
  const raw = await readFile(sourcePath, "utf8");
  return Buffer.from(JSON.stringify(createClientsDataset(JSON.parse(raw))));
}
