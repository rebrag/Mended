import { and, asc, desc, eq, inArray, isNotNull, ne, sql } from "drizzle-orm";
import { schema, type Tx } from "@/db";
import type { Answer } from "./answers";
import { promptForRound } from "./rounds";
import type { Prompt } from "./prompts";
import type { VesselShape } from "./vessel-shapes";

export type PastMoment = {
  roundId: string;
  localDate: string;
  shardIndex: number;
  prompt: Prompt;
  answers: Record<string, Answer>;
};

export type JournalMoment = PastMoment & {
  vessel: { id: string; shape: VesselShape; position: number };
};

async function answersFor(tx: Tx, roundIds: string[]) {
  if (roundIds.length === 0) return [];
  return tx.select().from(schema.answers).where(inArray(schema.answers.roundId, roundIds));
}

function groupAnswers(rows: (typeof schema.answers.$inferSelect)[]): Map<string, Record<string, Answer>> {
  const byRound = new Map<string, Record<string, Answer>>();
  for (const a of rows) {
    const bucket = byRound.get(a.roundId) ?? {};
    bucket[a.userId] = a.body as Answer;
    byRound.set(a.roundId, bucket);
  }
  return byRound;
}

/** Completed moments for a vessel, in the order their pieces were mended. Only finished rounds are returned. */
export async function getVesselMoments(tx: Tx, homeId: string, vesselId: string): Promise<PastMoment[]> {
  const rounds = await tx
    .select()
    .from(schema.rounds)
    .where(
      and(eq(schema.rounds.homeId, homeId), eq(schema.rounds.vesselId, vesselId), isNotNull(schema.rounds.completedAt)),
    )
    .orderBy(asc(schema.rounds.shardIndex));
  if (rounds.length === 0) return [];

  const answers = groupAnswers(
    await answersFor(
      tx,
      rounds.map((r) => r.id),
    ),
  );
  return rounds.map((round) => ({
    roundId: round.id,
    localDate: round.localDate,
    shardIndex: round.shardIndex ?? 0,
    prompt: promptForRound(round),
    answers: answers.get(round.id) ?? {},
  }));
}

/** Every completed moment in the home, newest first, with the vessel each one mended. */
export async function getAllMoments(tx: Tx, homeId: string): Promise<JournalMoment[]> {
  const rows = await tx
    .select({
      round: schema.rounds,
      vessel: { id: schema.vessels.id, shape: schema.vessels.shape, position: schema.vessels.position },
    })
    .from(schema.rounds)
    .innerJoin(schema.vessels, eq(schema.vessels.id, schema.rounds.vesselId))
    .where(and(eq(schema.rounds.homeId, homeId), isNotNull(schema.rounds.completedAt)))
    .orderBy(desc(schema.rounds.position));
  if (rows.length === 0) return [];

  const answers = groupAnswers(
    await answersFor(
      tx,
      rows.map((r) => r.round.id),
    ),
  );
  return rows.map(({ round, vessel }) => ({
    roundId: round.id,
    localDate: round.localDate,
    shardIndex: round.shardIndex ?? 0,
    prompt: promptForRound(round),
    answers: answers.get(round.id) ?? {},
    vessel: { id: vessel.id, shape: vessel.shape as VesselShape, position: vessel.position },
  }));
}

export type LastMended = { roundId: string; localDate: string; prompt: Prompt };

/** The most recently completed moment other than the given round (today's), if any. */
export async function getLastMendedMoment(
  tx: Tx,
  homeId: string,
  excludeRoundId: string | null,
): Promise<LastMended | null> {
  const [round] = await tx
    .select()
    .from(schema.rounds)
    .where(
      and(
        eq(schema.rounds.homeId, homeId),
        isNotNull(schema.rounds.completedAt),
        excludeRoundId ? ne(schema.rounds.id, excludeRoundId) : undefined,
      ),
    )
    .orderBy(desc(schema.rounds.position))
    .limit(1);
  return round ? { roundId: round.id, localDate: round.localDate, prompt: promptForRound(round) } : null;
}

/** Vessels newest first, each with its kept photo and how many pieces are mended. */
export async function getVessels(tx: Tx, homeId: string) {
  const mended = sql<number>`(
    select count(*)::int from ${schema.rounds}
    where ${schema.rounds.vesselId} = ${schema.vessels.id} and ${schema.rounds.completedAt} is not null
  )`;
  return tx
    .select({
      vessel: schema.vessels,
      photo: { id: schema.photos.id, width: schema.photos.width, height: schema.photos.height },
      mended,
    })
    .from(schema.vessels)
    .leftJoin(schema.photos, eq(schema.photos.id, schema.vessels.photoId))
    .where(eq(schema.vessels.homeId, homeId))
    .orderBy(desc(schema.vessels.position));
}
