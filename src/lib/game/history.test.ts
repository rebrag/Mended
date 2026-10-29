import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { schema, type Db } from "@/db";
import { testDb } from "@/test/db";
import { getAllMoments, getLastMendedMoment, getVessels } from "./history";
import { getOrOpenRound, submitAnswer, type HomeRow } from "./rounds";
import { SHARDS_PER_VESSEL } from "./vessel-shapes";

let db: Db;
let close: () => Promise<void>;
let home: HomeRow;
let a: string;
let b: string;

// Monday 9am in New York.
const MONDAY = new Date("2026-10-05T13:00:00Z");
const day = (n: number) => new Date(MONDAY.getTime() + n * 86_400_000);

beforeEach(async () => {
  ({ db, close } = await testDb());
  [home] = await db
    .insert(schema.homes)
    .values({ name: "Our place", timezone: "America/New_York", daughterName: "Noa" })
    .returning();
  const users = await db
    .insert(schema.users)
    .values([{ email: "a@example.com" }, { email: "b@example.com" }])
    .returning();
  [a, b] = users.map((u) => u.id);
  await db.insert(schema.memberships).values([
    { homeId: home.id, userId: a },
    { homeId: home.id, userId: b },
  ]);
});

afterEach(async () => {
  await close();
});

function answerFor(promptId: string) {
  if (promptId.startsWith("t-")) return { choice: 0 };
  if (promptId.startsWith("p-")) return { choice: 0, guess: 1 };
  return { text: "hello" };
}

async function playDays(count: number) {
  for (let i = 0; i < count; i++) {
    const now = day(i);
    const round = await getOrOpenRound(db, home, now);
    const body = answerFor(round.promptId);
    await submitAnswer(db, { homeId: home.id, roundId: round.id, userId: a, answer: body, now });
    await submitAnswer(db, { homeId: home.id, roundId: round.id, userId: b, answer: body, now });
  }
}

describe("history", () => {
  it("lists every completed moment newest first, across vessels, with both answers", async () => {
    await playDays(SHARDS_PER_VESSEL + 2);
    // Today's round is open but unanswered, so it must not show up.
    await getOrOpenRound(db, home, day(SHARDS_PER_VESSEL + 2));

    const moments = await getAllMoments(db, home.id);
    expect(moments).toHaveLength(SHARDS_PER_VESSEL + 2);
    expect(moments[0].localDate > moments.at(-1)!.localDate).toBe(true);
    expect(new Set(moments.map((m) => m.vessel.id)).size).toBe(2);
    expect(moments[0].vessel.position).toBe(1);
    expect(moments.at(-1)!.vessel.position).toBe(0);
    for (const m of moments) {
      expect(Object.keys(m.answers).sort()).toEqual([a, b].sort());
    }
  });

  it("finds the last mended moment other than today's", async () => {
    expect(await getLastMendedMoment(db, home.id, null)).toBeNull();
    await playDays(2);
    const today = await getOrOpenRound(db, home, day(2));
    const last = await getLastMendedMoment(db, home.id, today.id);
    expect(last?.localDate).toBe("2026-10-06");
    expect(await getLastMendedMoment(db, home.id, last!.roundId)).toMatchObject({ localDate: "2026-10-05" });
  });

  it("counts mended pieces per vessel in one query", async () => {
    await playDays(SHARDS_PER_VESSEL + 3);
    const vessels = await getVessels(db, home.id);
    expect(vessels.map((v) => v.mended)).toEqual([3, SHARDS_PER_VESSEL]);
    expect(vessels[1].vessel.completedAt).not.toBeNull();
  });
});
