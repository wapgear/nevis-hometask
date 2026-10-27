import { DataState } from "../../../components/DataState/DataState.component";

export function ClientDataEmpty() {
  return (
    <DataState
      title="No client data"
      description="There are no clients to display yet."
      icon={
        <svg viewBox="0 0 24 24" focusable="false">
          <circle cx="9" cy="8" r="3" />
          <path d="M3 20v-2a6 6 0 0 1 12 0v2M16 5a3 3 0 0 1 0 6M21 20v-2a6 6 0 0 0-3-5.2" />
        </svg>
      }
    />
  );
}
