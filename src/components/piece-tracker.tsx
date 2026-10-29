import { cx } from "@/components/ui";
import { SHARDS_PER_VESSEL } from "@/lib/game/vessel-shapes";

/** Eighteen little diamonds, one per piece; the mended ones are gold. */
export function PieceTracker({
  mended,
  label,
  pop = false,
  className,
}: {
  mended: number;
  /** Sentence shown under the row, e.g. "Jug 1 · 3 of 18 pieces mended". */
  label?: string;
  /** Animate the newest mended piece into the row. */
  pop?: boolean;
  className?: string;
}) {
  const count = Math.max(0, Math.min(SHARDS_PER_VESSEL, mended));
  return (
    <div className={cx("flex flex-col items-center gap-2", className)}>
      <div
        className="flex flex-wrap justify-center gap-x-1.5 gap-y-2"
        role="img"
        aria-label={`${count} of ${SHARDS_PER_VESSEL} pieces mended`}
      >
        {Array.from({ length: SHARDS_PER_VESSEL }, (_, i) => {
          const done = i < count;
          const newest = pop && i === count - 1;
          return (
            <span
              key={i}
              className={cx(
                "block size-2.5 rotate-45 rounded-[2px] transition-colors",
                done ? "bg-gold shadow-[0_0_6px_var(--gold-bright)]" : "border border-line-strong bg-transparent",
                newest && "piece-pop",
              )}
              style={newest ? { animationDelay: "1.1s" } : undefined}
            />
          );
        })}
      </div>
      {label ? <p className="text-center text-[14px] text-ink-faint">{label}</p> : null}
    </div>
  );
}
