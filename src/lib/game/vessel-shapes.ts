import { Delaunay } from "d3-delaunay";
import polygonClipping, { type Polygon as ClipPolygon } from "polygon-clipping";
import { hashString, seededRandom } from "./selection";

export const SHARDS_PER_VESSEL = 18;

export const VESSEL_SHAPES = ["juglet", "amphora", "bowl", "krater"] as const;
export type VesselShape = (typeof VESSEL_SHAPES)[number];

/** Display names. The keys are stored in the database, so they never change. */
export const VESSEL_NAMES: Record<VesselShape, string> = {
  juglet: "Jug",
  amphora: "Amphora",
  bowl: "Cup",
  krater: "Vase",
};

/** Drawing area for every vessel. The vessel's base sits on y = VIEW_H. */
export const VIEW_W = 200;
export const VIEW_H = 240;
const CX = VIEW_W / 2;

/** Room around the vessel in its drawing frame, so loose pieces never get clipped. */
export const FRAME_PAD = 38;

/** Size of the "scene" frame (same for every shape) and where the vessel's base sits in it, as a fraction of height. */
export const SCENE_FRAME = {
  width: VIEW_W + FRAME_PAD * 2,
  height: VIEW_H + FRAME_PAD * 2,
  baseline: (VIEW_H + FRAME_PAD) / (VIEW_H + FRAME_PAD * 2),
};

/**
 * Lathe profiles: [y, half-width] control points from rim to foot.
 * Each vessel is the profile mirrored around the center line.
 */
const PROFILES: Record<VesselShape, [number, number][]> = {
  juglet: [
    [14, 21],
    [22, 15],
    [52, 12],
    [78, 26],
    [108, 56],
    [146, 66],
    [184, 54],
    [214, 32],
    [232, 20],
    [240, 22],
  ],
  amphora: [
    [8, 24],
    [16, 19],
    [48, 19],
    [70, 46],
    [100, 66],
    [140, 62],
    [182, 42],
    [214, 22],
    [232, 13],
    [240, 17],
  ],
  bowl: [
    [96, 94],
    [104, 92],
    [128, 86],
    [160, 70],
    [188, 46],
    [206, 30],
    [222, 26],
    [240, 34],
  ],
  krater: [
    [40, 74],
    [48, 70],
    [70, 64],
    [112, 60],
    [150, 54],
    [184, 38],
    [204, 22],
    [222, 20],
    [234, 32],
    [240, 36],
  ],
};

export type Point = [number, number];

/** Catmull-Rom interpolation through the control points for a smooth outline. */
function smoothProfile(points: [number, number][], stepsPerSegment = 6): [number, number][] {
  const out: [number, number][] = [];
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(0, i - 1)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(points.length - 1, i + 2)];
    for (let s = 0; s < stepsPerSegment; s++) {
      const t = s / stepsPerSegment;
      const t2 = t * t;
      const t3 = t2 * t;
      const f = (a: number, b: number, c: number, d: number) =>
        0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
      out.push([f(p0[0], p1[0], p2[0], p3[0]), f(p0[1], p1[1], p2[1], p3[1])]);
    }
  }
  out.push(points[points.length - 1]);
  return out;
}

const outlineCache = new Map<VesselShape, Point[]>();

/** Closed outline polygon of the vessel, clockwise from the top-left of the rim. */
export function vesselOutline(shape: VesselShape): Point[] {
  const cached = outlineCache.get(shape);
  if (cached) return cached;
  const profile = smoothProfile(PROFILES[shape]);
  const right = profile.map(([y, hw]) => [CX + hw, y] as Point);
  const left = [...profile].reverse().map(([y, hw]) => [CX - hw, y] as Point);
  const outline = [...right, ...left];
  outlineCache.set(shape, outline);
  return outline;
}

export function vesselTop(shape: VesselShape): number {
  return PROFILES[shape][0][0];
}

export function pointsToPath(points: Point[]): string {
  return `M${points.map(([x, y]) => `${x.toFixed(2)},${y.toFixed(2)}`).join("L")}Z`;
}

function pointInPolygon([x, y]: Point, poly: Point[]): boolean {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i];
    const [xj, yj] = poly[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

function polygonArea(poly: Point[]): number {
  let a = 0;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    a += (poly[j][0] + poly[i][0]) * (poly[j][1] - poly[i][1]);
  }
  return Math.abs(a / 2);
}

function centroid(poly: Point[]): Point {
  let x = 0;
  let y = 0;
  let a = 0;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const f = poly[j][0] * poly[i][1] - poly[i][0] * poly[j][1];
    x += (poly[j][0] + poly[i][0]) * f;
    y += (poly[j][1] + poly[i][1]) * f;
    a += f;
  }
  if (a === 0) return poly[0];
  return [x / (3 * a), y / (3 * a)];
}

function distanceToSegment([px, py]: Point, [ax, ay]: Point, [bx, by]: Point): number {
  const dx = bx - ax;
  const dy = by - ay;
  const len2 = dx * dx + dy * dy;
  const t = len2 === 0 ? 0 : Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / len2));
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}

function onOutline(p: Point, outline: Point[]): boolean {
  for (let i = 0, j = outline.length - 1; i < outline.length; j = i++) {
    if (distanceToSegment(p, outline[j], outline[i]) < 0.35) return true;
  }
  return false;
}

/** SVG path of a shard's edges that are cracks (shared with other shards), excluding the vessel's outer wall. */
function crackPath(ring: Point[], outline: Point[]): string {
  const parts: string[] = [];
  for (let i = 0; i < ring.length; i++) {
    const a = ring[i];
    const b = ring[(i + 1) % ring.length];
    const mid: Point = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
    if (onOutline(mid, outline)) continue;
    parts.push(`M${a[0].toFixed(2)},${a[1].toFixed(2)}L${b[0].toFixed(2)},${b[1].toFixed(2)}`);
  }
  return parts.join("");
}

export type Shard = {
  points: Point[];
  /** Path of the crack edges, where gold goes once mended. */
  cracks: string;
  centroid: Point;
  /** Unit-ish direction pushing the shard away from the vessel's middle when it is broken. */
  drift: Point;
  /** Small rotation in degrees applied while broken. */
  tilt: number;
};

const shardCache = new Map<string, Shard[]>();

/**
 * Breaks a vessel into SHARDS_PER_VESSEL pieces, deterministically from the seed.
 * Shards are ordered bottom-up so mending builds the vessel from its foot to its rim.
 */
export function vesselShards(shape: VesselShape, seed: string): Shard[] {
  const key = `${shape}:${seed}`;
  const cached = shardCache.get(key);
  if (cached) return cached;

  const outline = vesselOutline(shape);
  const random = seededRandom(hashString(seed));
  const xs = outline.map((p) => p[0]);
  const ys = outline.map((p) => p[1]);
  const [minX, maxX, minY, maxY] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];

  let sites: Point[] = [];
  while (sites.length < SHARDS_PER_VESSEL) {
    const p: Point = [minX + random() * (maxX - minX), minY + random() * (maxY - minY)];
    if (pointInPolygon(p, outline)) sites.push(p);
  }

  const clipTarget: ClipPolygon = [outline.map(([x, y]) => [x, y] as [number, number])];
  const cellsFor = (pts: Point[]) => {
    const voronoi = Delaunay.from(pts).voronoi([minX - 1, minY - 1, maxX + 1, maxY + 1]);
    return pts.map((_, i) => {
      const cell = voronoi.cellPolygon(i) as Point[] | null;
      if (!cell) return [] as Point[];
      const clipped = polygonClipping.intersection([cell.map(([x, y]) => [x, y] as [number, number])], clipTarget);
      // Keep the largest piece if the clip splits a cell.
      const rings = clipped.map((poly) => poly[0] as Point[]);
      return rings.sort((a, b) => polygonArea(b) - polygonArea(a))[0] ?? [];
    });
  };

  // Lloyd relaxation evens out shard sizes while keeping an organic look.
  let cells = cellsFor(sites);
  for (let iter = 0; iter < 2; iter++) {
    sites = cells.map((c, i) => (c.length > 2 ? centroid(c) : sites[i]));
    cells = cellsFor(sites);
  }

  const center: Point = [CX, (minY + maxY) / 2];
  const shards = cells
    .filter((c) => c.length > 2)
    .map((points) => {
      // polygon-clipping closes rings by repeating the first point.
      const ring = points.slice(0, -1);
      const c = centroid(ring);
      const dx = c[0] - center[0];
      const dy = c[1] - center[1];
      const len = Math.hypot(dx, dy) || 1;
      return {
        points: ring,
        cracks: crackPath(ring, outline),
        centroid: c,
        drift: [dx / len, dy / len] as Point,
        tilt: (random() - 0.5) * 18,
      };
    })
    .sort((a, b) => b.centroid[1] - a.centroid[1] || a.centroid[0] - b.centroid[0]);

  shardCache.set(key, shards);
  return shards;
}
