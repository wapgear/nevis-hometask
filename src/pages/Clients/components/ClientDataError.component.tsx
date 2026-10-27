import { DataState } from "../../../components/DataState/DataState.component";
import styles from "./ClientDataError.module.scss";

export function ClientDataError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <DataState
      role="alert"
      title="Client data unavailable"
      description={message}
      icon={
        <svg viewBox="0 0 24 24" focusable="false">
          <rect x="3" y="3" width="18" height="7" rx="2" />
          <path d="M12 21H5a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h7M7 6.5h.01M7 17.5h.01M18 14v4M18 21h.01" />
        </svg>
      }
    >
      <button className={styles.retry} type="button" onClick={onRetry}>Try again</button>
    </DataState>
  );
}
