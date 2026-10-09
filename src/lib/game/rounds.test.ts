import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { schema, type Db } from "@/db";
import { testDb } from "@/test/db";
import { getOrOpenRound, getRoundView, submitAnswer, type HomeRow } from "./rounds";
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

async function answerBoth(now: Date) {
  const round = await getOrOpenRound(db, home, now);
  const body = answerFor(round.promptId);
  await submitAnswer(db, { homeId: home.id, roundId: round.id, userId: a, answer: body, now });
  return submitAnswer(db, { homeId: home.id, roundId: round.id, userId: b, answer: body, now });
}

function answerFor(promptId: string) {
  if (promptId.startsWith("t-")) return { choice: 0 };
  if (promptId.startsWith("p-")) return { choice: 0, guess: 1 };
  return { text: "hello" };
}

describe("rounds", () => {
  it("opens one round per day and returns the same round on repeat visits", async () => {
    const r1 = await getOrOpenRound(db, home, MONDAY);
    const r2 = await getOrOpenRound(db, home, MONDAY);
    expect(r1.id).toBe(r2.id);
    expect(r1.localDate).toBe("2026-10-05");
  });

  it("keeps an unfinished round open across days instead of skipping it", async () => {
    const r1 = await getOrOpenRound(db, home, MONDAY);
    await submitAnswer(db, { homeId: home.id, roundId: r1.id, userId: a, answer: answerFor(r1.promptId), now: MONDAY });
    const later = await getOrOpenRound(db, home, day(3));
    expect(later.id).toBe(r1.id);
  });

  it("hides the partner's answer until both have answered", async () => {
    const round = await getOrOpenRound(db, home, MONDAY);
    await submitAnswer(db, { homeId: home.id, roundId: round.id, userId: a, answer: { text: "secret" }, now: MONDAY });
    const bView = await getRoundView(db, await getOrOpenRound(db, home, MONDAY), b, [a, b]);
    expect(bView.partnerAnswered).toBe(true);
    expect(bView.partnerAnswer).toBeNull();
    expect(bView.seat).toBe(1);

    await submitAnswer(db, { homeId: home.id, roundId: round.id, userId: b, answer: { text: "mine" }, now: MONDAY });
    const done = await getOrOpenRound(db, home, MONDAY);
    const aView = await getRoundView(db, done, a, [a, b]);
    expect(aView.completed).toBe(true);
    expect(aView.partnerAnswer).toEqual({ text: "mine" });
    expect(aView.shardIndex).toBe(0);
  });

  it("lets a player change their answer while waiting, but not after the round closes", async () => {
    const round = await getOrOpenRound(db, home, MONDAY);
    await submitAnswer(db, { homeId: home.id, roundId: round.id, userId: a, answer: { text: "one" }, now: MONDAY });
    await submitAnswer(db, { homeId: home.id, roundId: round.id, userId: a, answer: { text: "two" }, now: MONDAY });
    const view = await getRoundView(db, round, a, [a, b]);
    expect(view.myAnswer).toEqual({ text: "two" });

    await submitAnswer(db, { homeId: home.id, roundId: round.id, userId: b, answer: { text: "x" }, now: MONDAY });
    const late = await submitAnswer(db, {
      homeId: home.id,
      roundId: round.id,
      userId: a,
      answer: { text: "three" },
      now: MONDAY,
    });
    expect(late.status).toBe("closed");
  });

  it("does not open the next round until the day turns", async () => {
    await answerBoth(MONDAY);
    const same = await getOrOpenRound(db, home, MONDAY);
    expect(same.completedAt).not.toBeNull();
    const next = await getOrOpenRound(db, home, day(1));
    expect(next.position).toBe(1);
    expect(next.promptId).not.toBe(same.promptId);
  });

  it("mends 18 shards, completes the vessel, then starts a new vessel", async () => {
    let last;
    for (let i = 0; i < SHARDS_PER_VESSEL; i++) last = await answerBoth(day(i));
    expect(last).toEqual({ status: "completed", shardIndex: 17, vesselCompleted: true });

    const vessels = await db.select().from(schema.vessels).where(eq(schema.vessels.homeId, home.id));
    expect(vessels).toHaveLength(1);
    expect(vessels[0].completedAt).not.toBeNull();

    const next = await getOrOpenRound(db, home, day(SHARDS_PER_VESSEL));
    const [vessel] = await db.select().from(schema.vessels).where(eq(schema.vessels.id, next.vesselId));
    expect(vessel.position).toBe(1);
    expect(vessel.shape).not.toBe(vessels[0].shape);
    const first = await answerBoth(day(SHARDS_PER_VESSEL));
    expect(first).toMatchObject({ status: "completed", shardIndex: 0 });
  });

  it("serves a gratitude prompt on Fridays", async () => {
    const friday = new Date("2026-10-09T14:00:00Z");
    const round = await getOrOpenRound(db, home, friday);
    expect(round.promptId.startsWith("g-")).toBe(true);
  });
});
