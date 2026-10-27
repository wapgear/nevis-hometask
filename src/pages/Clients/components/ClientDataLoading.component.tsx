import { DataState } from "../../../components/DataState/DataState.component";
import styles from "./ClientDataLoading.module.scss";

export function ClientDataLoading() {
  return (
    <DataState
      title="Loading client data…"
      description="Please wait while we load your clients."
      icon={
        <svg className={styles.spinner} viewBox="0 0 24 24" focusable="false">
          <circle cx="12" cy="12" r="9" opacity="0.2" />
          <path d="M12 3a9 9 0 0 1 9 9" />
        </svg>
      }
    />
  );
}
