"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { VesselArt } from "@/components/art/vessel-art";
import type { VesselShape } from "@/lib/game/vessel-shapes";
import { markSeen, readSeen } from "@/lib/seen";

const noopSubscribe = () => () => {};

/**
 * The vessel on the plinth. When a piece was mended today and this device hasn't seen it land yet,
 * the piece flies into place once, the same way it does on the reveal screen.
 */
export function CourtyardVessel({
  shape,
  seed,
  mended,
  mendedRoundId,
  className,
}: {
  shape: VesselShape;
  seed: string;
  mended: number;
  /** Id of a round completed today, if any; the replay is remembered per round. */
  mendedRoundId: string | null;
  className?: string;
}) {
  const key = mendedRoundId ? `home:${mendedRoundId}` : null;
  const seenNow = useSyncExternalStore(
    noopSubscribe,
    () => (key ? readSeen(key) : true),
    () => null,
  );
  const [seen, setSeen] = useState<boolean | null>(null);
  if (seen === null && seenNow !== null) setSeen(seenNow);
  useEffect(() => {
    if (seen === false && key) markSeen(key);
  }, [seen, key]);

  const replay = key !== null && mended > 0;
  // Until the browser has checked, show the vessel as it was before today's piece, so the piece
  // can land without first flashing into place.
  const shown = replay && seen !== true ? mended - 1 : mended;
  const justMended = replay && seen === false ? mended - 1 : null;

  return (
    <VesselArt
      key={justMended === null ? "still" : `replay-${justMended}`}
      shape={shape}
      seed={seed}
      mended={justMended === null ? shown : mended}
      justMended={justMended}
      frame="scene"
      className={className}
    />
  );
}
