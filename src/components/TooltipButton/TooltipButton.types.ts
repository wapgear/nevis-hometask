import type { ComponentPropsWithoutRef, ReactNode } from "react";

export type TooltipButtonProps = ComponentPropsWithoutRef<"button"> & {
  tooltip: ReactNode;
};
