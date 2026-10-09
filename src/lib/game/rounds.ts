import { and, asc, count, desc, eq, isNotNull, isNull } from "drizzle-orm";
import { schema, type Tx } from "@/db";
import { isFriday, localDate } from "@/lib/time";
import type { Answer } from "./answers";
import { PROMPTS_BY_ID, type Prompt } from "./prompts";
import { selectPrompt } from "./selection";
import { SHARDS_PER_VESSEL, VESSEL_SHAPES } from "./vessel-shapes";

export type HomeRow = typeof schema.homes.$inferSelect;
export type RoundRow = typeof schema.rounds.$inferSelect;
export type VesselRow = typeof schema.vessels.$inferSelect;

export async function getVessel(tx: Tx, vesselId: string): Promise<VesselRow> {
  const [vessel] = await tx.select().from(schema.vessels).where(eq(schema.vessels.id, vesselId));
  if (!vessel) throw new Error(`Vessel ${vesselId} not found`);
  return vessel;
}

export async function getCurrentVessel(tx: Tx, homeId: string): Promise<VesselRow | null> {
  const [vessel] = await tx
    .select()
    .from(schema.vessels)
    .where(eq(schema.vessels.homeId, homeId))
    .orderBy(desc(schema.vessels.position))
    .limit(1);
  return vessel ?? null;
}

/** The vessel that new rounds should mend, creating the next one if the latest is complete. */
async function ensureOpenVessel(tx: Tx, homeId: string): Promise<VesselRow> {
  const latest = await getCurrentVessel(tx, homeId);
  if (latest && !latest.completedAt) return latest;
  const position = latest ? latest.position + 1 : 0;
  await tx
    .insert(schema.vessels)
    .values({ homeId, position, shape: VESSEL_SHAPES[position % VESSEL_SHAPES.length] })
    .onConflictDoNothing();
  const [vessel] = await tx
    .select()
    .from(schema.vessels)
    .where(and(eq(schema.vessels.homeId, homeId), eq(schema.vessels.position, position)));
  return vessel;
}

export async function getLatestRound(tx: Tx, homeId: string): Promise<RoundRow | null> {
  const [round] = await tx
    .select()
    .from(schema.rounds)
    .where(eq(schema.rounds.homeId, homeId))
    .orderBy(desc(schema.rounds.position))
    .limit(1);
  return round ?? null;
}

/**
 * Today's round for a home.
 * An unfinished round always stays open until both have answered, however many days pass.
 * A new round opens only once the previous one is complete and the home's calendar day has turned.
 */
export async function getOrOpenRound(tx: Tx, home: HomeRow, now: Date): Promise<RoundRow> {
  const today = localDate(now, home.timezone);
  const latest = await getLatestRound(tx, home.id);
  if (latest && (!latest.completedAt || latest.localDate >= today)) return latest;

  const vessel = await ensureOpenVessel(tx, home.id);
  const used = await tx
    .select({ promptId: schema.rounds.promptId })
    .from(schema.rounds)
    .where(eq(schema.rounds.homeId, home.id))
    .orderBy(asc(schema.rounds.position));
  const position = latest ? latest.position + 1 : 0;
  const prompt = selectPrompt({
    homeId: home.id,
    position,
    isFriday: isFriday(now, home.timezone),
    hasDaughter: Boolean(home.daughterName),
    usedPromptIds: used.map((r) => r.promptId),
  });

  // Both partners may open the app at the same moment; the unique position index decides the winner.
  await tx
    .insert(schema.rounds)
    .values({ homeId: home.id, position, localDate: today, promptId: prompt.id, vesselId: vessel.id })
    .onConflictDoNothing();
  const opened = await getLatestRound(tx, home.id);
  if (!opened) throw new Error("Failed to open a round");
  return opened;
}

export function promptForRound(round: Pick<RoundRow, "promptId">): Prompt {
  const prompt = PROMPTS_BY_ID.get(round.promptId);
  if (!prompt) throw new Error(`Unknown prompt ${round.promptId}`);
  return prompt;
}

export type SubmitResult =
  { status: "waiting" } | { status: "completed"; shardIndex: number; vesselCompleted: boolean };

/**
 * Saves (or replaces) a player's answer.
 * Answers can be changed until the partner has answered too; then the round completes and mends a shard.
 */
export async function submitAnswer(
  db: Tx,
  input: { homeId: string; roundId: string; userId: string; answer: Answer; now: Date },
): Promise<SubmitResult | { status: "closed" }> {
  return db.transaction(async (tx) => {
    const [round] = await tx
      .select()
      .from(schema.rounds)
      .where(and(eq(schema.rounds.id, input.roundId), eq(schema.rounds.homeId, input.homeId)))
      .for("update");
    if (!round) throw new Error("Round not found");
    if (round.completedAt) return { status: "closed" as const };

    await tx
      .insert(schema.answers)
      .values({ roundId: round.id, userId: input.userId, body: input.answer })
      .onConflictDoUpdate({
        target: [schema.answers.roundId, schema.answers.userId],
        set: { body: input.answer, createdAt: input.now },
      });

    const [{ answered }] = await tx
      .select({ answered: count() })
      .from(schema.answers)
      .where(eq(schema.answers.roundId, round.id));
    if (answered < 2) return { status: "waiting" as const };

    const [{ mended }] = await tx
      .select({ mended: count() })
      .from(schema.rounds)
      .where(and(eq(schema.rounds.vesselId, round.vesselId), isNotNull(schema.rounds.completedAt)));
    const shardIndex = mended;
    await tx
      .update(schema.rounds)
      .set({ completedAt: input.now, shardIndex })
      .where(and(eq(schema.rounds.id, round.id), isNull(schema.rounds.completedAt)));

    const vesselCompleted = shardIndex + 1 >= SHARDS_PER_VESSEL;
    if (vesselCompleted) {
      await tx
        .update(schema.vessels)
        .set({ completedAt: input.now })
        .where(and(eq(schema.vessels.id, round.vesselId), isNull(schema.vessels.completedAt)));
    }
    return { status: "completed" as const, shardIndex, vesselCompleted };
  });
}

export type RoundView = {
  roundId: string;
  position: number;
  localDate: string;
  prompt: Prompt;
  completed: boolean;
  shardIndex: number | null;
  vesselId: string;
  myAnswer: Answer | null;
  partnerAnswered: boolean;
  /** Only present once both have answered. */
  partnerAnswer: Answer | null;
  /** 0 for the home's first member, 1 for the second (decides which split clue you see). */
  seat: 0 | 1;
};

/** A round as one player may see it: the partner's answer stays hidden until both have answered. */
export async function getRoundView(
  tx: Tx,
  round: RoundRow,
  viewerId: string,
  memberIds: [string, string],
): Promise<RoundView> {
  const rows = await tx
    .select({ userId: schema.answers.userId, body: schema.answers.body })
    .from(schema.answers)
    .where(eq(schema.answers.roundId, round.id));
  const mine = rows.find((r) => r.userId === viewerId);
  const theirs = rows.find((r) => r.userId !== viewerId);
  const completed = Boolean(round.completedAt);
  return {
    roundId: round.id,
    position: round.position,
    localDate: round.localDate,
    prompt: promptForRound(round),
    completed,
    shardIndex: round.shardIndex,
    vesselId: round.vesselId,
    myAnswer: (mine?.body as Answer | undefined) ?? null,
    partnerAnswered: Boolean(theirs),
    partnerAnswer: completed ? ((theirs?.body as Answer | undefined) ?? null) : null,
    seat: memberIds[0] === viewerId ? 0 : 1,
  };
}

export async function countMended(tx: Tx, vesselId: string): Promise<number> {
  const [{ mended }] = await tx
    .select({ mended: count() })
    .from(schema.rounds)
    .where(and(eq(schema.rounds.vesselId, vesselId), isNotNull(schema.rounds.completedAt)));
  return mended;
}
