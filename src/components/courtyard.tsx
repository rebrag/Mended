import Link from "next/link";
import { Candles } from "@/components/art/candles";
import { CourtyardBackdrop, SCENE_H, SCENE_W } from "@/components/art/courtyard-backdrop";
import { PomegranateTree } from "@/components/art/pomegranate-tree";
import { VesselArt } from "@/components/art/vessel-art";
import { SCENE_FRAME, type VesselShape } from "@/lib/game/vessel-shapes";
import type { DayPeriod } from "@/lib/time";

export type CourtyardProps = {
  period: DayPeriod;
  vessel: { id: string; shape: VesselShape; mended: number } | null;
  shelf: { id: string; shape: VesselShape }[];
  shelfCount: number;
  tree: { growth: number; fruit: number; seed: string; label: string };
  candlesLit: boolean;
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
  "absolute rounded-[28px] outline-none transition-[background-color] focus-visible:ring-2 focus-visible:ring-gold hover:bg-white/5";

export function Courtyard({ period, vessel, shelf, shelfCount, tree, candlesLit }: CourtyardProps) {
  const extra = shelfCount - shelf.length;
  return (
    <div
      className="relative w-full overflow-hidden rounded-[28px] border border-line shadow-lift"
      style={{ aspectRatio: `${SCENE_W} / ${SCENE_H}` }}
      data-testid="courtyard"
    >
      <CourtyardBackdrop period={period} className="absolute inset-0 h-full w-full" />

      <div className="pointer-events-none absolute" style={place(127, 132, 34, 46)}>
        <Candles lit={candlesLit} className="h-full w-full" />
      </div>

      {shelf.map((v, i) => (
        <div key={v.id} className="pointer-events-none absolute" style={vesselBox(250 + i * 33, 103, 38)}>
          <VesselArt shape={v.shape} seed={v.id} mended={18} compact frame="scene" className="h-full w-full" />
        </div>
      ))}
      {extra > 0 ? (
        <span
          className="pointer-events-none absolute text-[11px] font-semibold text-ink-soft"
          style={{ ...place(330, 112, 24, 12), textAlign: "right" }}
        >
          +{extra}
        </span>
      ) : null}

      <div className="pointer-events-none absolute" style={place(250, 196, 104, 156)}>
        <PomegranateTree
          growth={tree.growth}
          fruit={tree.fruit}
          seed={tree.seed}
          label={tree.label}
          className="h-full w-full"
        />
      </div>

      {vessel ? (
        <div className="pointer-events-none absolute" style={vesselBox(97, 305, 166)}>
          <VesselArt
            shape={vessel.shape}
            seed={vessel.id}
            mended={vessel.mended}
            frame="scene"
            className="h-full w-full"
          />
        </div>
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
