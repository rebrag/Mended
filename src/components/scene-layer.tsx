import type { CSSProperties, ReactNode } from "react";
import { cx } from "@/components/ui";

/**
 * One thing in the courtyard, settling into place a beat after the one before it.
 * Plain CSS, so the scene is visible before any script runs and stays still under reduced motion.
 */
export function SceneLayer({
  delay = 0,
  className,
  style,
  children,
}: {
  /** Seconds to wait before this layer rises in. */
  delay?: number;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
}) {
  return (
    <div className={cx("rise-in", className)} style={{ ...style, animationDelay: `${delay}s` }}>
      {children}
    </div>
  );
}
