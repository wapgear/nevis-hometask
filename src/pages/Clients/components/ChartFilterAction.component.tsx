import { TooltipButton } from "../../../components/TooltipButton/TooltipButton.component";
import styles from "../Clients.module.scss";

export function ChartFilterAction({ name, selected, onSelect }: {
  name: string;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <TooltipButton
      className={styles["row-chart-action"]}
      aria-label={`Show chart for ${name}`}
      aria-pressed={selected}
      onClick={onSelect}
      tooltip={
        <>
          <strong>Filter chart</strong>
          <span>Show monthly clients for {name}.</span>
        </>
      }
    >
      <svg viewBox="0 0 20 20" aria-hidden="true">
        <path d="M3.25 4h13.5L11.5 10v5l-3 1v-6L3.25 4Z" />
      </svg>
    </TooltipButton>
  );
}
