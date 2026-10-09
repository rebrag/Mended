"use client";

import { motion, useReducedMotion } from "motion/react";
import { useId, useMemo } from "react";
import {
  FRAME_PAD as PAD,
  SHARDS_PER_VESSEL,
  VIEW_H,
  VIEW_W,
  pointsToPath,
  vesselOutline,
  vesselShards,
  vesselTop,
  type VesselShape,
} from "@/lib/game/vessel-shapes";

type Props = {
  shape: VesselShape;
  /** Seed for the crack pattern; the vessel's id. */
  seed: string;
  /** Number of shards mended so far (0..18). */
  mended: number;
  /** Index of a shard to animate into place (the one this round just mended). */
  justMended?: number | null;
  className?: string;
  /** Hide the dashed outline of the missing shape (used for small shelf vessels). */
  compact?: boolean;
  /** "tight" crops to this shape; "scene" uses the same frame for every shape so bases line up. */
  frame?: "tight" | "scene";
};

/**
 * A clay vessel broken into 18 pieces. Mended pieces sit in place with gold in their cracks
 * and let more of the light inside shine out; the rest drift loosely around the vessel.
 */
export function VesselArt({
  shape,
  seed,
  mended,
  justMended = null,
  className,
  compact = false,
  frame = "tight",
}: Props) {
  const uid = useId().replace(/:/g, "");
  const reduceMotion = useReducedMotion();
  const shards = useMemo(() => vesselShards(shape, seed), [shape, seed]);
  const outlinePath = useMemo(() => pointsToPath(vesselOutline(shape)), [shape]);
  const top = vesselTop(shape);
  const frameTop = frame === "scene" ? 0 : top;
  const viewBox = `${-PAD} ${frameTop - PAD} ${VIEW_W + PAD * 2} ${VIEW_H - frameTop + PAD * 2}`;
  const whole = mended >= SHARDS_PER_VESSEL;
  const glowFrom = (Math.max(0, mended - 1) / SHARDS_PER_VESSEL) * 0.9 + 0.1;
  const glowTo = (mended / SHARDS_PER_VESSEL) * 0.9 + 0.1;
  const animating = justMended !== null && !reduceMotion;

  const id = (name: string) => `${name}-${uid}`;

  return (
    <svg
      viewBox={viewBox}
      className={className}
      role="img"
      aria-label={
        whole ? "A whole vessel, mended with gold" : `A vessel, ${mended} of ${SHARDS_PER_VESSEL} pieces mended`
      }
    >
      <defs>
        <radialGradient id={id("light")} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="var(--gold-bright)" stopOpacity="0.85" />
          <stop offset="40%" stopColor="var(--gold-bright)" stopOpacity="0.35" />
          <stop offset="75%" stopColor="var(--gold-bright)" stopOpacity="0.08" />
          <stop offset="100%" stopColor="var(--gold-bright)" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={id("clay")} gradientUnits="userSpaceOnUse" x1="40" y1={top} x2="170" y2={VIEW_H}>
          <stop offset="0%" stopColor="var(--clay-light)" />
          <stop offset="55%" stopColor="var(--clay)" />
          <stop offset="100%" stopColor="var(--clay-dark)" />
        </linearGradient>
        <linearGradient id={id("shade")} gradientUnits="userSpaceOnUse" x1="20" y1="0" x2="180" y2="0">
          <stop offset="0%" stopColor="#000" stopOpacity="0.18" />
          <stop offset="28%" stopColor="#fff" stopOpacity="0.16" />
          <stop offset="55%" stopColor="#fff" stopOpacity="0" />
          <stop offset="100%" stopColor="#000" stopOpacity="0.3" />
        </linearGradient>
        <pattern id={id("bands")} patternUnits="userSpaceOnUse" width={VIEW_W} height={VIEW_H}>
          <rect
            x="0"
            y={top + (VIEW_H - top) * 0.3}
            width={VIEW_W}
            height="2.2"
            fill="var(--clay-dark)"
            opacity="0.55"
          />
          <rect
            x="0"
            y={top + (VIEW_H - top) * 0.3 + 5}
            width={VIEW_W}
            height="1.2"
            fill="var(--clay-dark)"
            opacity="0.45"
          />
          <rect
            x="0"
            y={top + (VIEW_H - top) * 0.72}
            width={VIEW_W}
            height="1.6"
            fill="var(--clay-dark)"
            opacity="0.4"
          />
        </pattern>
        <filter id={id("seam-glow")} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="2.4" />
        </filter>
        <filter id={id("grain")} x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="7" result="noise" />
          <feColorMatrix in="noise" type="saturate" values="0" result="mono" />
          <feComponentTransfer in="mono" result="soft">
            <feFuncA type="linear" slope="0.12" />
          </feComponentTransfer>
          <feComposite in="soft" in2="SourceGraphic" operator="in" result="grain" />
          <feMerge>
            <feMergeNode in="SourceGraphic" />
            <feMergeNode in="grain" />
          </feMerge>
        </filter>
      </defs>

      {/* The light inside, brighter with every mended piece. */}
      <motion.ellipse
        cx={VIEW_W / 2}
        cy={top + (VIEW_H - top) * 0.58}
        rx={VIEW_W * 0.62}
        ry={(VIEW_H - top) * 0.62}
        fill={`url(#${id("light")})`}
        className="glow-breathe"
        initial={{ opacity: animating ? glowFrom : glowTo }}
        animate={{ opacity: glowTo }}
        transition={{ duration: 1.2, delay: animating ? 0.9 : 0 }}
      />

      {!compact && !whole ? (
        <path
          d={outlinePath}
          fill="none"
          stroke="var(--line-strong)"
          strokeWidth="1"
          strokeDasharray="3 4"
          opacity="0.7"
        />
      ) : null}

      <g filter={`url(#${id("grain")})`}>
        {shards.map((shard, i) => {
          const isMended = i < mended;
          const drift = 13 + (i % 4) * 4;
          const loose = {
            x: shard.drift[0] * drift,
            y: shard.drift[1] * drift + 4,
            rotate: shard.tilt,
          };
          const rest = { x: 0, y: 0, rotate: 0 };
          const path = pointsToPath(shard.points);
          const isAnimating = animating && i === justMended;
          return (
            <motion.g
              key={i}
              style={{ transformBox: "fill-box", transformOrigin: "center" }}
              initial={isAnimating ? loose : isMended ? rest : loose}
              animate={isMended ? rest : loose}
              transition={isAnimating ? { type: "spring", stiffness: 70, damping: 14, delay: 0.25 } : { duration: 0 }}
              opacity={isMended ? 1 : 0.82}
            >
              <path d={path} fill={`url(#${id("clay")})`} />
              <path d={path} fill={`url(#${id("bands")})`} />
              <path d={path} fill={`url(#${id("shade")})`} />
              <path d={path} fill="none" stroke="var(--clay-dark)" strokeWidth="0.7" strokeLinejoin="round" />
            </motion.g>
          );
        })}
      </g>

      {/* Gold in the cracks of mended pieces. */}
      <g fill="none" strokeLinecap="round" strokeLinejoin="round">
        {shards.slice(0, mended).map((shard, i) =>
          shard.cracks ? (
            <g key={i}>
              <motion.path
                d={shard.cracks}
                stroke="var(--gold-bright)"
                strokeWidth="5"
                filter={`url(#${id("seam-glow")})`}
                initial={animating && i === justMended ? { pathLength: 0, opacity: 0 } : false}
                animate={{ pathLength: 1, opacity: 0.55 }}
                transition={{ duration: 1.1, delay: 1.0, ease: "easeInOut" }}
              />
              <motion.path
                d={shard.cracks}
                stroke="var(--gold)"
                strokeWidth="2.2"
                initial={animating && i === justMended ? { pathLength: 0 } : false}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1.1, delay: 1.0, ease: "easeInOut" }}
              />
              <motion.path
                d={shard.cracks}
                stroke="var(--gold-bright)"
                strokeWidth="0.9"
                opacity="0.9"
                initial={animating && i === justMended ? { pathLength: 0 } : false}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1.1, delay: 1.0, ease: "easeInOut" }}
              />
            </g>
          ) : null,
        )}
      </g>
    </svg>
  );
}
