import { and, asc, desc, eq, inArray, isNotNull } from "drizzle-orm";
import { schema, type Tx } from "@/db";
import type { Answer } from "./answers";
import { promptForRound } from "./rounds";
import type { Prompt } from "./prompts";

export type PastMoment = {
  roundId: string;
  localDate: string;
  shardIndex: number;
  prompt: Prompt;
  answers: Record<string, Answer>;
};

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

  const answers = await tx
    .select()
    .from(schema.answers)
    .where(
      inArray(
        schema.answers.roundId,
        rounds.map((r) => r.id),
      ),
    );

  return rounds.map((round) => ({
    roundId: round.id,
    localDate: round.localDate,
    shardIndex: round.shardIndex ?? 0,
    prompt: promptForRound(round),
    answers: Object.fromEntries(answers.filter((a) => a.roundId === round.id).map((a) => [a.userId, a.body as Answer])),
  }));
}

export async function getVessels(tx: Tx, homeId: string) {
  return tx
    .select({
      vessel: schema.vessels,
      photo: { id: schema.photos.id, width: schema.photos.width, height: schema.photos.height },
    })
    .from(schema.vessels)
    .leftJoin(schema.photos, eq(schema.photos.id, schema.vessels.photoId))
    .where(eq(schema.vessels.homeId, homeId))
    .orderBy(desc(schema.vessels.position));
}
