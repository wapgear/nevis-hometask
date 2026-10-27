export const CHANNEL_NAMES = ["Existing clients", "New organic", "New paid"] as const;
export const CHART_SERIES_LABELS = [...CHANNEL_NAMES, "Unknown channel"] as const;
export type ClientKind = "company" | "branch" | "employee" | "channel";

export interface ClientChartMonth {
  known: number[];
  missing: number;
  excess: number;
}

export interface UnavailableChannel {
  id: string;
  name: string;
  kind: "channel";
  values: null[];
  avatarUrl: null;
}

export interface ClientNode {
  id: string;
  name: string;
  values: number[];
  branches?: ClientNode[];
  employees?: ClientNode[];
  channels?: ClientNode[];
  kind: ClientKind;
  avatarUrl: string | null;
  chart: ClientChartMonth[];
  reportedChildTotals: number[] | null;
  hasReportedMismatch: boolean;
  unavailableChannels: UnavailableChannel[];
}

export interface ClientsDataset {
  months: string[];
  data: ClientNode | null;
}

const childKeys = ["branches", "employees", "channels"] as const;
const kinds: ClientKind[] = ["company", "branch", "employee", "channel"];
const channelNames = new Set<string>(CHANNEL_NAMES);

function invalid(): never {
  throw new Error("The API returned an invalid client dataset.");
}

function isCount(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0;
}

function isAvatarUrl(value: unknown): value is string | null {
  if (value === null) return true;
  if (typeof value !== "string" || value.trim() !== value || !value) return false;
  if (value.startsWith("/") && !value.startsWith("//") && !value.includes("\\")) return true;
  try {
    return ["http:", "https:"].includes(new URL(value).protocol);
  } catch {
    return false;
  }
}

export function childrenOf<T extends { branches?: T[]; employees?: T[]; channels?: T[] }>(node: T): T[] {
  return node.branches ?? node.employees ?? node.channels ?? [];
}

export function parseClients(value: unknown): ClientsDataset {
  if (!value || typeof value !== "object" || Array.isArray(value)) invalid();
  const dataset = value as Record<string, unknown>;
  if (
    !Array.isArray(dataset.months) ||
    !dataset.months.every(
      (month) => typeof month === "string" && /^\d{4}-(0[1-9]|1[0-2])$/.test(month),
    )
  ) invalid();
  const months = dataset.months as string[];
  if (!months.every((month, index) => index === 0 || month > months[index - 1]!)) invalid();
  if (dataset.data === null) return { months, data: null };
  if (months.length === 0) invalid();
  const ids = new Set<string>();

  function parseIdentity(candidate: unknown): Record<string, unknown> {
    if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)) invalid();
    const source = candidate as Record<string, unknown>;
    if (
      typeof source.id !== "string" || !source.id || ids.has(source.id) ||
      typeof source.name !== "string" || !source.name.trim() ||
      !Array.isArray(source.values) || source.values.length !== months.length
    ) invalid();
    ids.add(source.id);
    return source;
  }

  function parseNode(candidate: unknown, depth: number): ClientNode {
    if (depth > 3) invalid();
    const source = parseIdentity(candidate);
    if (
      source.kind !== kinds[depth] ||
      !(source.values as unknown[]).every(isCount) ||
      !isAvatarUrl(source.avatarUrl) ||
      !(source.reportedChildTotals === null ||
        (Array.isArray(source.reportedChildTotals) && source.reportedChildTotals.length === months.length &&
          source.reportedChildTotals.every(isCount))) ||
      typeof source.hasReportedMismatch !== "boolean" ||
      !Array.isArray(source.chart) || source.chart.length !== months.length ||
      !Array.isArray(source.unavailableChannels)
    ) invalid();
    if (source.kind === "channel" && !channelNames.has(source.name as string)) invalid();

    const presentKeys = childKeys.filter((key) => source[key] !== undefined);
    if (presentKeys.length > 1) invalid();
    const childrenKey = presentKeys[0];
    if (childrenKey && (depth !== childKeys.indexOf(childrenKey) || !Array.isArray(source[childrenKey]))) invalid();
    const children = childrenKey
      ? (source[childrenKey] as unknown[]).map((child) => parseNode(child, depth + 1))
      : undefined;
    const chart = (source.chart as unknown[]).map((candidate): ClientChartMonth => {
      if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)) invalid();
      const row = candidate as Record<string, unknown>;
      if (!Array.isArray(row.known) || row.known.length !== CHANNEL_NAMES.length ||
        !row.known.every(isCount) || !isCount(row.missing) || !isCount(row.excess)) invalid();
      return { known: row.known as number[], missing: row.missing, excess: row.excess };
    });
    if (source.unavailableChannels.length && (source.kind !== "employee" || children?.length)) invalid();
    const unavailableNames = new Set<string>();
    const unavailableChannels = (source.unavailableChannels as unknown[]).map((candidate): UnavailableChannel => {
      const channel = parseIdentity(candidate);
      if (channel.kind !== "channel" || channel.avatarUrl !== null ||
        !channelNames.has(channel.name as string) || unavailableNames.has(channel.name as string) ||
        !(channel.values as unknown[]).every((entry) => entry === null)) invalid();
      unavailableNames.add(channel.name as string);
      return { id: channel.id as string, name: channel.name as string, kind: "channel", values: channel.values as null[], avatarUrl: null };
    });
    return {
      id: source.id as string,
      name: source.name as string,
      values: source.values as number[],
      kind: source.kind as ClientKind,
      avatarUrl: source.avatarUrl as string | null,
      chart,
      reportedChildTotals: source.reportedChildTotals as number[] | null,
      hasReportedMismatch: source.hasReportedMismatch as boolean,
      unavailableChannels,
      ...(childrenKey === "branches" ? { branches: children } : {}),
      ...(childrenKey === "employees" ? { employees: children } : {}),
      ...(childrenKey === "channels" ? { channels: children } : {}),
    };
  }
  return { months, data: parseNode(dataset.data, 0) };
}
