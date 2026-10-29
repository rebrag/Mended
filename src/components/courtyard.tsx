import Link from "next/link";
import { Candles } from "@/components/art/candles";
import { CourtyardBackdrop, SCENE_H, SCENE_W } from "@/components/art/courtyard-backdrop";
import { PomegranateTree } from "@/components/art/pomegranate-tree";
import { VesselArt } from "@/components/art/vessel-art";
import { CourtyardVessel } from "@/components/courtyard-vessel";
import { SceneLayer } from "@/components/scene-layer";
import { SCENE_FRAME, type VesselShape } from "@/lib/game/vessel-shapes";
import type { DayPeriod } from "@/lib/time";

export type CourtyardProps = {
  period: DayPeriod;
  vessel: { id: string; shape: VesselShape; mended: number } | null;
  shelf: { id: string; shape: VesselShape }[];
  shelfCount: number;
  tree: { growth: number; fruit: number; seed: string; label: string };
  candlesLit: boolean;
  /** Today's moment is waiting for this person: the plinth glows to say so. */
  attention?: boolean;
  /** A round completed today; its piece lands on the vessel the first time this device sees it. */
  mendedRoundId?: string | null;
};

/** Converts a rectangle in scene units to absolute-position percentages. */
function place(x: number, y: number, w: number, h: number) {
  return {
    left: `${(x / SCENE_W) * 100}%`,
    top: `${(y / SCENE_H) * 100}%`,
    width: `${(w / SCENE_W) * 100}%`,
    height: `${(h / SCENE_H) * 100}%`,
  };
}

const VESSEL_RATIO = SCENE_FRAME.height / SCENE_FRAME.width;
const VESSEL_BASE = SCENE_FRAME.baseline;

function vesselBox(x: number, baseY: number, width: number) {
  const height = width * VESSEL_RATIO;
  return place(x, baseY - height * VESSEL_BASE, width, height);
}

const hotspot =
  "absolute rounded-[28px] outline-none transition-[background-color,transform] duration-150 focus-visible:ring-2 focus-visible:ring-gold hover:bg-white/5 active:scale-[0.985] active:bg-white/10";

export function Courtyard({
  period,
  vessel,
  shelf,
  shelfCount,
  tree,
  candlesLit,
  attention = false,
  mendedRoundId = null,
}: CourtyardProps) {
  const extra = shelfCount - shelf.length;
  return (
    <div
      className="relative w-full overflow-hidden rounded-[28px] border border-line shadow-lift"
      style={{ aspectRatio: `${SCENE_W} / ${SCENE_H}` }}
      data-testid="courtyard"
    >
      <CourtyardBackdrop period={period} className="absolute inset-0 h-full w-full" />

      <SceneLayer delay={0.05} className="pointer-events-none absolute" style={place(127, 132, 34, 46)}>
        <Candles lit={candlesLit} className="h-full w-full" />
      </SceneLayer>

      {shelf.map((v, i) => (
        <SceneLayer
          key={v.id}
          delay={0.1 + i * 0.06}
          className="pointer-events-none absolute"
          style={vesselBox(250 + i * 33, 103, 38)}
        >
          <VesselArt shape={v.shape} seed={v.id} mended={18} compact frame="scene" className="h-full w-full" />
        </SceneLayer>
      ))}
      {extra > 0 ? (
        <span
          className="pointer-events-none absolute text-[11px] font-semibold text-ink-soft"
          style={{ ...place(330, 112, 24, 12), textAlign: "right" }}
        >
          +{extra}
        </span>
      ) : null}

      <SceneLayer delay={0.18} className="pointer-events-none absolute" style={place(250, 196, 104, 156)}>
        <PomegranateTree
          growth={tree.growth}
          fruit={tree.fruit}
          seed={tree.seed}
          label={tree.label}
          className="h-full w-full"
        />
      </SceneLayer>

      {attention ? (
        <div className="pointer-events-none absolute" style={place(95, 286, 170, 64)} data-testid="plinth-glow">
          <div className="plinth-glow h-full w-full rounded-[50%] bg-[radial-gradient(ellipse_at_center,var(--gold-bright)_0%,transparent_68%)]" />
        </div>
      ) : null}

      {vessel ? (
        <SceneLayer delay={0.26} className="pointer-events-none absolute" style={vesselBox(97, 305, 166)}>
          <CourtyardVessel
            shape={vessel.shape}
            seed={vessel.id}
            mended={vessel.mended}
            mendedRoundId={mendedRoundId}
            className="h-full w-full"
          />
        </SceneLayer>
      ) : null}

      <Link href="/moment" aria-label="Today's moment" className={hotspot} style={place(104, 150, 152, 190)} />
      <Link href="/tree" aria-label="Her tree" className={hotspot} style={place(252, 196, 100, 156)} />
      <Link
        href="/shelf"
        aria-label="The shelf of mended vessels"
        className={hotspot}
        style={place(248, 58, 104, 58)}
      />
    </div>
  );
}
