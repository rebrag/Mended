import { db } from "@/db";
import { getNow, isTestMode } from "@/lib/clock";
import { isPaired, memberIds, requireHome } from "@/lib/dal";
import type { Answer } from "@/lib/game/answers";
import { getOrOpenRound, promptForRound, submitAnswer } from "@/lib/game/rounds";

function sampleAnswer(kind: string): Answer {
  if (kind === "this_or_that") return { choice: 0 };
  if (kind === "guess_partner") return { choice: 0, guess: 0 };
  return { text: "A little moment from an earlier day." };
}

/**
 * Test-only: plays `rounds` complete rounds for the signed-in home on the days before the (pinned) current date.
 * POST /api/test/fast-forward?rounds=17
 */
export async function POST(request: Request) {
  if (!isTestMode()) return new Response("Not found", { status: 404 });
  const viewer = await requireHome();
  if (!isPaired(viewer)) return Response.json({ error: "not paired" }, { status: 400 });
  const count = Number(new URL(request.url).searchParams.get("rounds") ?? "1");
  const base = await getNow();
  const ids = memberIds(viewer);

  for (let i = 0; i < count; i++) {
    const now = new Date(base.getTime() - (count - i) * 86_400_000);
    const round = await getOrOpenRound(db, viewer.home, now);
    const answer = sampleAnswer(promptForRound(round).kind);
    for (const userId of ids) {
      await submitAnswer(db, { homeId: viewer.home.id, roundId: round.id, userId, answer, now });
    }
  }
  return Response.json({ ok: true });
}
