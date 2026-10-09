import { and, count, eq, isNotNull } from "drizzle-orm";
import { db, schema } from "@/db";
import { getViewer } from "@/lib/dal";

/** Lightweight poll target while waiting for the partner: how many answers are in, and whether the round is done. */
export async function GET(request: Request) {
  const viewer = await getViewer();
  if (!viewer?.home) return new Response("Unauthorized", { status: 401 });
  const roundId = new URL(request.url).searchParams.get("round") ?? "";

  const [round] = await db
    .select({ completedAt: schema.rounds.completedAt })
    .from(schema.rounds)
    .where(and(eq(schema.rounds.id, roundId), eq(schema.rounds.homeId, viewer.home.id)));
  if (!round) return new Response("Not found", { status: 404 });

  const [{ answers }] = await db
    .select({ answers: count() })
    .from(schema.answers)
    .where(and(eq(schema.answers.roundId, roundId), isNotNull(schema.answers.body)));

  return Response.json(
    { answers, completed: Boolean(round.completedAt) },
    { headers: { "Cache-Control": "no-store" } },
  );
}
