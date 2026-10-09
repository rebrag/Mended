import type { DayPeriod } from "@/lib/time";
import { hashString, seededRandom } from "@/lib/game/selection";

export const SCENE_W = 360;
export const SCENE_H = 400;

const SKIES: Record<DayPeriod, [string, string]> = {
  dawn: ["#f0b98f", "#fbe3c4"],
  day: ["#8fbde6", "#d9ebf7"],
  dusk: ["#5d4f8c", "#f0a57a"],
  night: ["#0d1730", "#27375f"],
};

/** Limestone blocks for the back wall, laid in staggered courses. */
function wallBlocks() {
  const random = seededRandom(hashString("courtyard-wall"));
  const blocks: { x: number; y: number; w: number; h: number; tone: number }[] = [];
  const courseH = 30;
  for (let row = 0; row * courseH < 336; row++) {
    let x = row % 2 === 0 ? -20 : -44;
    while (x < SCENE_W) {
      const w = 46 + Math.floor(random() * 34);
      blocks.push({ x, y: row * courseH, w, h: courseH, tone: random() });
      x += w;
    }
  }
  return blocks;
}

const BLOCKS = wallBlocks();

const WINDOW = { x: 128, y: 34, w: 104, h: 142 };
const DOOR = { x: 16, y: 166, w: 70, h: 170 };

function archPath(x: number, y: number, w: number, h: number): string {
  const r = w / 2;
  return `M${x},${y + h} V${y + r} A${r},${r} 0 0 1 ${x + w},${y + r} V${y + h} Z`;
}

/** The fixed parts of the courtyard: wall, window to the sky, blue door, shelf, plinth and floor. */
export function CourtyardBackdrop({ period, className }: { period: DayPeriod; className?: string }) {
  const [skyTop, skyBottom] = SKIES[period];
  const night = period === "night";
  const stars = night
    ? Array.from({ length: 14 }, (_, i) => {
        const r = seededRandom(hashString(`star-${i}`));
        return { x: WINDOW.x + 8 + r() * (WINDOW.w - 16), y: WINDOW.y + 10 + r() * 90, s: 0.6 + r() * 0.9 };
      })
    : [];

  return (
    <svg
      viewBox={`0 0 ${SCENE_W} ${SCENE_H}`}
      className={className}
      aria-hidden="true"
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <linearGradient id="sky" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={skyTop} />
          <stop offset="100%" stopColor={skyBottom} />
        </linearGradient>
        <linearGradient id="wall-light" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#fff" stopOpacity="0.08" />
          <stop offset="100%" stopColor="#000" stopOpacity="0.1" />
        </linearGradient>
        <linearGradient id="floor-fade" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#000" stopOpacity="0.14" />
          <stop offset="100%" stopColor="#000" stopOpacity="0" />
        </linearGradient>
        <radialGradient id="window-spill" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={night ? "#9fb6e8" : "#fff4d6"} stopOpacity={night ? 0.1 : 0.28} />
          <stop offset="100%" stopColor={night ? "#9fb6e8" : "#fff4d6"} stopOpacity="0" />
        </radialGradient>
        <clipPath id="window-clip">
          <path d={archPath(WINDOW.x, WINDOW.y, WINDOW.w, WINDOW.h)} />
        </clipPath>
      </defs>

      {/* Wall */}
      <rect width={SCENE_W} height={SCENE_H} fill="var(--wall)" />
      {BLOCKS.map((b, i) => (
        <rect
          key={i}
          x={b.x + 1}
          y={b.y + 1}
          width={b.w - 2}
          height={b.h - 2}
          rx="2"
          fill={b.tone > 0.6 ? "var(--wall-shade)" : "var(--wall)"}
          stroke="var(--mortar)"
          strokeWidth="1.2"
        />
      ))}
      <rect width={SCENE_W} height="336" fill="url(#wall-light)" />

      {/* Window to the sky */}
      <path
        d={archPath(WINDOW.x - 9, WINDOW.y - 9, WINDOW.w + 18, WINDOW.h + 9)}
        fill="var(--wall-shade)"
        stroke="var(--mortar)"
        strokeWidth="1.2"
      />
      <g clipPath="url(#window-clip)">
        <rect x={WINDOW.x} y={WINDOW.y} width={WINDOW.w} height={WINDOW.h} fill="url(#sky)" />
        {stars.map((s, i) => (
          <circle key={i} cx={s.x} cy={s.y} r={s.s} fill="#fff" opacity="0.85" />
        ))}
        {night ? (
          <path d={`M${WINDOW.x + 74},${WINDOW.y + 26} a12,12 0 1,0 10,18 a9.5,9.5 0 1,1 -10,-18z`} fill="#f6efd8" />
        ) : period === "day" ? (
          <circle cx={WINDOW.x + 76} cy={WINDOW.y + 40} r="11" fill="#fff6d8" opacity="0.95" />
        ) : (
          <circle cx={WINDOW.x + 30} cy={WINDOW.y + WINDOW.h - 34} r="14" fill="#ffd9a0" opacity="0.9" />
        )}
        {/* Distant hills */}
        <path
          d={`M${WINDOW.x},${WINDOW.y + WINDOW.h - 26} q26,-16 52,-6 t52,-8 V${WINDOW.y + WINDOW.h} H${WINDOW.x}z`}
          fill={night ? "#1b2747" : period === "dusk" ? "#8c6a7a" : "#b9c79a"}
          opacity="0.85"
        />
        <path
          d={`M${WINDOW.x},${WINDOW.y + WINDOW.h - 12} q30,-10 60,-2 t44,-6 V${WINDOW.y + WINDOW.h} H${WINDOW.x}z`}
          fill={night ? "#141d38" : period === "dusk" ? "#6e5466" : "#94a874"}
        />
      </g>
      {/* Window sill */}
      <rect
        x={WINDOW.x - 14}
        y={WINDOW.y + WINDOW.h}
        width={WINDOW.w + 28}
        height="9"
        rx="2"
        fill="var(--wall-shade)"
        stroke="var(--mortar)"
        strokeWidth="1.2"
      />
      <ellipse cx={WINDOW.x + WINDOW.w / 2} cy={WINDOW.y + WINDOW.h + 20} rx="110" ry="96" fill="url(#window-spill)" />

      {/* Blue door with a small scroll case on its doorpost */}
      <path
        d={archPath(DOOR.x - 7, DOOR.y - 7, DOOR.w + 14, DOOR.h + 7)}
        fill="var(--wall-shade)"
        stroke="var(--mortar)"
        strokeWidth="1.2"
      />
      <path d={archPath(DOOR.x, DOOR.y, DOOR.w, DOOR.h)} fill="var(--door)" />
      {[1, 2, 3].map((i) => (
        <path
          key={i}
          d={`M${DOOR.x + (DOOR.w / 4) * i},${DOOR.y + 6} V${DOOR.y + DOOR.h}`}
          stroke="var(--door-dark)"
          strokeWidth="1.4"
        />
      ))}
      <path
        d={`M${DOOR.x + 6},${DOOR.y + 60} H${DOOR.x + DOOR.w - 6} M${DOOR.x + 6},${DOOR.y + 128} H${DOOR.x + DOOR.w - 6}`}
        stroke="var(--door-dark)"
        strokeWidth="2.4"
      />
      <circle cx={DOOR.x + DOOR.w - 13} cy={DOOR.y + 98} r="3.4" fill="#d8b56a" />
      <rect
        x={DOOR.x + DOOR.w + 1.4}
        y={DOOR.y + 50}
        width="4.4"
        height="17"
        rx="1.4"
        fill="#c9a45a"
        stroke="#8c6a2a"
        strokeWidth="0.8"
        transform={`rotate(-18 ${DOOR.x + DOOR.w + 3.6} ${DOOR.y + 58})`}
      />

      {/* Shelf */}
      <path d="M260,108 v14 l8,-8z M340,108 v14 l-8,-8z" fill="var(--wood-dark)" />
      <rect x="250" y="102" width="100" height="7" rx="1.5" fill="var(--wood)" />
      <rect x="250" y="108" width="100" height="2" fill="var(--wood-dark)" opacity="0.6" />

      {/* Floor */}
      <rect x="0" y="336" width={SCENE_W} height={SCENE_H - 336} fill="var(--floor)" />
      <rect x="0" y="336" width={SCENE_W} height="26" fill="url(#floor-fade)" />
      <path d={`M0,336 H${SCENE_W}`} stroke="var(--mortar)" strokeWidth="2" />
      <path d={`M0,364 H${SCENE_W}`} stroke="var(--floor-shade)" strokeWidth="1.2" />
      {[-60, 0, 60, 120, 180, 240, 300, 360, 420].map((x) => (
        <path
          key={x}
          d={`M${x + (x - 180) * 0.1},336 L${x + (x - 180) * 0.35},${SCENE_H}`}
          stroke="var(--floor-shade)"
          strokeWidth="1.2"
        />
      ))}

      {/* Plinth for the vessel */}
      <rect
        x="128"
        y="310"
        width="104"
        height="30"
        rx="3"
        fill="var(--wall-shade)"
        stroke="var(--mortar)"
        strokeWidth="1.2"
      />
      <rect
        x="122"
        y="304"
        width="116"
        height="9"
        rx="2.5"
        fill="var(--wall)"
        stroke="var(--mortar)"
        strokeWidth="1.2"
      />
      <ellipse cx="180" cy="342" rx="62" ry="4" fill="#000" opacity="0.12" />
    </svg>
  );
}
