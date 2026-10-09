import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { schema, type Db } from "@/db";
import { testDb } from "@/test/db";
import { acceptInvite, createHome, getInviteInfo, getMembers, getOrCreateInvite } from "./home";

let db: Db;
let close: () => Promise<void>;
const now = new Date("2026-10-05T13:00:00Z");

async function user(email: string) {
  const [u] = await db.insert(schema.users).values({ email }).returning();
  return u.id;
}

beforeEach(async () => {
  ({ db, close } = await testDb());
});
afterEach(async () => {
  await close();
});

describe("homes and invites", () => {
  it("pairs exactly two people through an invite", async () => {
    const josh = await user("j@example.com");
    const partner = await user("p@example.com");
    const stranger = await user("s@example.com");
    const home = await createHome(db, josh, {
      displayName: "Josh",
      homeName: "Our place",
      timezone: "America/New_York",
      daughterName: "Noa",
      daughterBirthdate: "2026-05-01",
    });
    const invite = await getOrCreateInvite(db, home.id, josh, now);
    expect((await getOrCreateInvite(db, home.id, josh, now)).token).toBe(invite.token);
    expect(await getInviteInfo(db, invite.token, now)).toMatchObject({ status: "ok", inviterName: "Josh" });

    expect(await acceptInvite(db, { token: invite.token, userId: partner, displayName: "Maya", now })).toBe("joined");
    expect(await acceptInvite(db, { token: invite.token, userId: partner, displayName: "Maya", now })).toBe(
      "already-member",
    );
    expect(await acceptInvite(db, { token: invite.token, userId: stranger, displayName: "X", now })).toBe("invalid");

    const fresh = await getOrCreateInvite(db, home.id, josh, now);
    expect(await acceptInvite(db, { token: fresh.token, userId: stranger, displayName: "X", now })).toBe("full");

    const members = await getMembers(db, home.id);
    expect(members.map((m) => m.displayName)).toEqual(["Josh", "Maya"]);
  });

  it("rejects expired invites", async () => {
    const josh = await user("j@example.com");
    const partner = await user("p@example.com");
    const home = await createHome(db, josh, {
      displayName: "Josh",
      homeName: "Home",
      timezone: "UTC",
      daughterName: null,
      daughterBirthdate: null,
    });
    const invite = await getOrCreateInvite(db, home.id, josh, now);
    const later = new Date(now.getTime() + 15 * 86_400_000);
    expect(await acceptInvite(db, { token: invite.token, userId: partner, displayName: "M", now: later })).toBe(
      "invalid",
    );
  });
});
