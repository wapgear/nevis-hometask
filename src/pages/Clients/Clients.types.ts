import type { ClientsDataset } from "../../../shared/clients";
export type { ClientNode } from "../../../shared/clients";

export type LoadState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | ({ status: "ready" } & ClientsDataset);
