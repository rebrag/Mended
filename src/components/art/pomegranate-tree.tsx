import { hashString, seededRandom } from "@/lib/game/selection";

type Props = {
  /** 0..1: how grown the tree is. */
  growth: number;
  /** One pomegranate per milestone (drawn up to a limit). */
  fruit: number;
  seed: string;
  className?: string;
  label?: string;
};

const W = 120;
const H = 180;
const BASE_Y = 150;
const MAX_FRUIT = 21;

type Branch = { path: string; tip: [number, number]; width: number };

function buildTree(growth: number, seed: string) {
  const random = seededRandom(hashString(`tree:${seed}`));
  const height = 34 + growth * 92;
  const trunkTop: [number, number] = [W / 2 + (random() - 0.5) * 6, BASE_Y - height];
  const trunkWidth = 2.5 + growth * 5;
  const bend = (random() - 0.5) * 10;
  const trunk = `M${W / 2},${BASE_Y} C${W / 2 + bend},${BASE_Y - height * 0.4} ${trunkTop[0] - bend},${BASE_Y - height * 0.7} ${trunkTop[0]},${trunkTop[1]}`;

  const branchCount = 2 + Math.round(growth * 5);
  const branches: Branch[] = [];
  for (let i = 0; i < branchCount; i++) {
    const t = 0.42 + (i / Math.max(1, branchCount - 1)) * 0.5;
    const side = i % 2 === 0 ? -1 : 1;
    const startY = BASE_Y - height * t;
    const startX = W / 2 + (trunkTop[0] - W / 2) * t;
    const length = (14 + growth * 26) * (1 - t * 0.35) * (0.8 + random() * 0.4);
    const tip: [number, number] = [startX + side * length, startY - length * (0.45 + random() * 0.35)];
    branches.push({
      path: `M${startX},${startY} Q${startX + side * length * 0.5},${startY - length * 0.05} ${tip[0]},${tip[1]}`,
      tip,
      width: Math.max(1.2, trunkWidth * 0.45),
    });
  }

  // Leaves cluster around branch tips and the crown.
  const anchors: [number, number][] = [trunkTop, ...branches.map((b) => b.tip)];
  const leafCount = 16 + Math.round(growth * 56);
  const spread = 7 + growth * 12;
  const leaves = Array.from({ length: leafCount }, (_, i) => {
    const [ax, ay] = anchors[i % anchors.length];
    const angle = random() * Math.PI * 2;
    const r = Math.sqrt(random()) * spread;
    return {
      x: ax + Math.cos(angle) * r,
      y: ay + Math.sin(angle) * r * 0.8,
      rotate: random() * 180,
      size: 3.2 + growth * 2.2 + random() * 1.5,
      dark: random() < 0.45,
    };
  });

  const fruitSpots = Array.from({ length: MAX_FRUIT }, (_, i) => {
    const [ax, ay] = anchors[(i + 1) % anchors.length];
    const angle = random() * Math.PI * 2;
    const r = Math.sqrt(random()) * spread * 0.85;
    return { x: ax + Math.cos(angle) * r, y: ay + Math.sin(angle) * r * 0.7 + 3 };
  });

  return { trunk, trunkWidth, branches, leaves, fruitSpots };
}

/** A young pomegranate tree in a clay planter. It grows with the little one and bears fruit for her milestones. */
export function PomegranateTree({ growth, fruit, seed, className, label }: Props) {
  const tree = buildTree(Math.max(0, Math.min(1, growth)), seed);
  const fruitSize = 4.2 + growth * 2.2;
  const shown = Math.min(fruit, MAX_FRUIT);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className={className} role="img" aria-label={label ?? "A young pomegranate tree"}>
      <defs>
        <radialGradient id={`fruit-${seed}`} cx="35%" cy="35%" r="70%">
          <stop offset="0%" stopColor="var(--pomegranate-light)" />
          <stop offset="100%" stopColor="var(--pomegranate)" />
        </radialGradient>
      </defs>

      <path d={tree.trunk} stroke="var(--wood-dark)" strokeWidth={tree.trunkWidth} fill="none" strokeLinecap="round" />
      {tree.branches.map((b, i) => (
        <path key={i} d={b.path} stroke="var(--wood-dark)" strokeWidth={b.width} fill="none" strokeLinecap="round" />
      ))}
      {tree.leaves.map((leaf, i) => (
        <ellipse
          key={i}
          cx={leaf.x}
          cy={leaf.y}
          rx={leaf.size}
          ry={leaf.size * 0.45}
          transform={`rotate(${leaf.rotate} ${leaf.x} ${leaf.y})`}
          fill={leaf.dark ? "var(--olive-dark)" : "var(--olive)"}
        />
      ))}
      {tree.fruitSpots.slice(0, shown).map((f, i) => (
        <g key={i}>
          <circle cx={f.x} cy={f.y} r={fruitSize} fill={`url(#fruit-${seed})`} />
          <path
            d={`M${f.x - fruitSize * 0.35},${f.y - fruitSize * 0.85} l${fruitSize * 0.18},${-fruitSize * 0.5} l${fruitSize * 0.17},${fruitSize * 0.3} l${fruitSize * 0.17},${-fruitSize * 0.3} l${fruitSize * 0.18},${fruitSize * 0.5}z`}
            fill="var(--pomegranate)"
          />
        </g>
      ))}

      {/* Planter */}
      <path d={`M${W / 2 - 30},${BASE_Y - 2} h60 l-6,${H - BASE_Y - 2} h-48z`} fill="var(--clay)" />
      <rect x={W / 2 - 33} y={BASE_Y - 6} width="66" height="8" rx="2" fill="var(--clay-light)" />
      <path d={`M${W / 2 - 27},${BASE_Y + 8} h54`} stroke="var(--clay-dark)" strokeWidth="1.2" opacity="0.6" />
      <ellipse cx={W / 2} cy={BASE_Y - 4} rx="28" ry="2.2" fill="var(--wood-dark)" opacity="0.7" />
    </svg>
  );
}
