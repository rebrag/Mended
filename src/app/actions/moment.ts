"use server";

import { and, eq } from "drizzle-orm";
import { refresh } from "next/cache";
import { after } from "next/server";
import { db, schema } from "@/db";
import { getNow } from "@/lib/clock";
import { isPaired, requireHome } from "@/lib/dal";
import { parseAnswer } from "@/lib/game/answers";
import { promptForRound, submitAnswer } from "@/lib/game/rounds";
import { notifyUser } from "@/lib/push";

export type AnswerState = { status: "idle" } | { status: "error"; message: string } | { status: "saved" };

export async function submitAnswerAction(_prev: AnswerState, formData: FormData): Promise<AnswerState> {
  const viewer = await requireHome("/moment");
  if (!isPaired(viewer)) return { status: "error", message: "Moments begin once your person joins." };

  const roundId = String(formData.get("roundId") ?? "");
  const [round] = await db
    .select()
    .from(schema.rounds)
    .where(and(eq(schema.rounds.id, roundId), eq(schema.rounds.homeId, viewer.home.id)));
  if (!round) return { status: "error", message: "This moment has moved on. Refresh to see today's." };

  const prompt = promptForRound(round);
  const raw = Object.fromEntries([...formData.entries()].filter(([key]) => !key.startsWith("$")));
  const parsed = parseAnswer(prompt, raw);
  if (!parsed.ok) return { status: "error", message: parsed.error };

  const result = await submitAnswer(db, {
    homeId: viewer.home.id,
    roundId: round.id,
    userId: viewer.user.id,
    answer: parsed.answer,
    now: await getNow(),
  });
  if (result.status === "closed") {
    refresh();
    return { status: "error", message: "You've both answered this one already." };
  }

  const me = viewer.user.displayName ?? "Your person";
  const partnerId = viewer.partner.id;
  after(() =>
    notifyUser(
      partnerId,
      result.status === "completed"
        ? { title: "A piece was mended", body: `You and ${me} both answered. Come see.`, url: "/moment" }
        : { title: `${me} left something for you`, body: "Today's moment is waiting.", url: "/moment" },
    ),
  );

  refresh();
  return { status: "saved" };
}
