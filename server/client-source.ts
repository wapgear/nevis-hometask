import { CHANNEL_NAMES, type ClientKind } from "../shared/clients";

export interface SourceClientNode {
  id: string;
  name: string;
  values: number[];
  kind: ClientKind;
  avatarUrl: string | null;
  branches?: SourceClientNode[];
  employees?: SourceClientNode[];
  channels?: SourceClientNode[];
}

const childKeys = ["branches", "employees", "channels"] as const;
const channelNames = new Set<string>(CHANNEL_NAMES);

function invalid(): never {
  throw new Error("The API returned an invalid client dataset.");
}

export function parseClientSource(value: unknown): { months: string[]; data: SourceClientNode | null } {
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

  function parseNode(candidate: unknown, depth: number): SourceClientNode {
    if (!candidate || typeof candidate !== "object" || Array.isArray(candidate) || depth > 3) invalid();
    const source = candidate as Record<string, unknown>;
    if (
      typeof source.id !== "string" || !source.id || ids.has(source.id) ||
      typeof source.name !== "string" || !source.name.trim() ||
      !Array.isArray(source.values) || source.values.length !== months.length ||
      !source.values.every((entry) => typeof entry === "number" && Number.isSafeInteger(entry) && entry >= 0) ||
      (source.avatarUrl !== undefined && source.avatarUrl !== null && typeof source.avatarUrl !== "string")
    ) invalid();

    const presentKeys = childKeys.filter((key) => source[key] !== undefined);
    if (presentKeys.length > 1) invalid();
    const childrenKey = presentKeys[0];
    if (childrenKey && (depth !== childKeys.indexOf(childrenKey) || !Array.isArray(source[childrenKey]))) invalid();
    const kind: ClientKind = ["company", "branch", "employee", "channel"][depth] as ClientKind;
    if (kind === "channel" && !channelNames.has(source.name)) invalid();
    ids.add(source.id);
    const children = childrenKey
      ? (source[childrenKey] as unknown[]).map((child) => parseNode(child, depth + 1))
      : undefined;
    return {
      id: source.id,
      name: source.name,
      values: source.values as number[],
      kind,
      avatarUrl: (source.avatarUrl as string | null | undefined) ?? null,
      ...(childrenKey === "branches" ? { branches: children } : {}),
      ...(childrenKey === "employees" ? { employees: children } : {}),
      ...(childrenKey === "channels" ? { channels: children } : {}),
    };
  }
  return { months, data: parseNode(dataset.data, 0) };
}
