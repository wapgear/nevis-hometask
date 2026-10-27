import { Avatar } from "../../../components/Avatar/Avatar.component";
import styles from "../Clients.module.scss";
import type { HierarchyNameProps } from "./HierarchyName.types";

export function HierarchyName({ avatarUrl, name, isEmployee }: HierarchyNameProps) {
  return (
    <>
      {isEmployee && <Avatar src={avatarUrl} name={name} />}
      <span className={styles["hierarchy-name"]}>{name}</span>
    </>
  );
}
