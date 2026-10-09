import { and, count, desc, eq, isNotNull } from "drizzle-orm";
import { schema, type Tx } from "@/db";
import { treeGrowth } from "@/lib/tree";
import { dayPeriod, isRestWindow, localDate, localParts, type DayPeriod } from "@/lib/time";
import { countMended, getCurrentVessel, getOrOpenRound, getRoundView, type HomeRow, type RoundView } from "./rounds";
import type { VesselShape } from "./vessel-shapes";

export type MomentStatus = "your-turn" | "partner-answered" | "waiting" | "mended";

export type HomeState = {
  period: DayPeriod;
  restWindow: boolean;
  candlesLit: boolean;
  vessel: { id: string; shape: VesselShape; mended: number; position: number } | null;
  shelf: { id: string; shape: VesselShape }[];
  shelfCount: number;
  tree: { growth: number; fruit: number; seed: string; label: string; ageLabel: string | null };
  round: RoundView | null;
  status: MomentStatus | null;
};

function shiftDate(date: string, days: number): string {
  const d = new Date(`${date}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function momentStatus(view: RoundView): MomentStatus {
  if (view.completed) return "mended";
  if (view.myAnswer) return "waiting";
  if (view.partnerAnswered) return "partner-answered";
  return "your-turn";
}

/**
 * Everything the courtyard needs.
 * When both people are in the home this also opens today's round, so the vessel is ready to mend.
 */
export async function loadHomeState(
  tx: Tx,
  input: { home: HomeRow; viewerId: string; memberIds: [string, string] | null; now: Date },
): Promise<HomeState> {
  const { home, now } = input;
  const round = input.memberIds ? await getOrOpenRound(tx, home, now) : null;
  const view = round && input.memberIds ? await getRoundView(tx, round, input.viewerId, input.memberIds) : null;

  const current = await getCurrentVessel(tx, home.id);
  const vessel = current
    ? {
        id: current.id,
        shape: current.shape as VesselShape,
        mended: await countMended(tx, current.id),
        position: current.position,
      }
    : null;

  const completed = await tx
    .select({ id: schema.vessels.id, shape: schema.vessels.shape })
    .from(schema.vessels)
    .where(and(eq(schema.vessels.homeId, home.id), isNotNull(schema.vessels.completedAt)))
    .orderBy(desc(schema.vessels.position));

  const [{ milestones }] = await tx
    .select({ milestones: count() })
    .from(schema.milestones)
    .where(eq(schema.milestones.homeId, home.id));

  const today = localDate(now, home.timezone);
  const restWindow = isRestWindow(now, home.timezone);
  let candlesLit = false;
  if (restWindow) {
    const friday = localParts(now, home.timezone).weekday === 5 ? today : shiftDate(today, -1);
    const [fridayRound] = await tx
      .select({ completedAt: schema.rounds.completedAt })
      .from(schema.rounds)
      .where(and(eq(schema.rounds.homeId, home.id), eq(schema.rounds.localDate, friday)));
    candlesLit = Boolean(fridayRound?.completedAt);
  }

  const growth = treeGrowth(home.daughterBirthdate, today);
  return {
    period: dayPeriod(now, home.timezone),
    restWindow,
    candlesLit,
    // While a finished vessel waits for the next day's round, it stays on the plinth, whole.
    vessel,
    shelf: completed
      .filter((v) => v.id !== vessel?.id)
      .slice(0, 3)
      .map((v) => ({ id: v.id, shape: v.shape as VesselShape })),
    shelfCount: completed.filter((v) => v.id !== vessel?.id).length,
    tree: {
      growth: growth.growth,
      fruit: milestones,
      seed: home.id,
      label: home.daughterName ? `${home.daughterName}'s pomegranate tree` : "A young pomegranate tree",
      ageLabel: growth.ageLabel,
    },
    round: view,
    status: view ? momentStatus(view) : null,
  };
}
