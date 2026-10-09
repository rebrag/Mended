import { and, asc, count, eq, gt, isNull } from "drizzle-orm";
import { schema, type Tx } from "@/db";
import { randomToken } from "@/lib/crypto";

const INVITE_DAYS = 14;

export type Member = { id: string; displayName: string };

export async function getMembership(tx: Tx, userId: string) {
  const [row] = await tx
    .select({ home: schema.homes })
    .from(schema.memberships)
    .innerJoin(schema.homes, eq(schema.homes.id, schema.memberships.homeId))
    .where(eq(schema.memberships.userId, userId));
  return row?.home ?? null;
}

/** Members ordered by when they joined; the home's creator comes first. */
export async function getMembers(tx: Tx, homeId: string): Promise<Member[]> {
  const rows = await tx
    .select({ id: schema.users.id, displayName: schema.users.displayName })
    .from(schema.memberships)
    .innerJoin(schema.users, eq(schema.users.id, schema.memberships.userId))
    .where(eq(schema.memberships.homeId, homeId))
    .orderBy(asc(schema.memberships.createdAt), asc(schema.users.id));
  return rows.map((r) => ({ id: r.id, displayName: r.displayName ?? "Someone" }));
}

export async function createHome(
  db: Tx,
  userId: string,
  input: {
    displayName: string;
    homeName: string;
    timezone: string;
    daughterName: string | null;
    daughterBirthdate: string | null;
  },
) {
  return db.transaction(async (tx) => {
    await tx.update(schema.users).set({ displayName: input.displayName }).where(eq(schema.users.id, userId));
    const [home] = await tx
      .insert(schema.homes)
      .values({
        name: input.homeName,
        timezone: input.timezone,
        daughterName: input.daughterName,
        daughterBirthdate: input.daughterBirthdate,
      })
      .returning();
    await tx.insert(schema.memberships).values({ homeId: home.id, userId });
    return home;
  });
}

/** Returns the home's current open invite, creating one if needed. */
export async function getOrCreateInvite(tx: Tx, homeId: string, userId: string, now: Date) {
  const [existing] = await tx
    .select()
    .from(schema.invites)
    .where(and(eq(schema.invites.homeId, homeId), isNull(schema.invites.usedAt), gt(schema.invites.expiresAt, now)))
    .limit(1);
  if (existing) return existing;
  const [invite] = await tx
    .insert(schema.invites)
    .values({
      token: randomToken(18),
      homeId,
      createdBy: userId,
      expiresAt: new Date(now.getTime() + INVITE_DAYS * 86_400_000),
    })
    .returning();
  return invite;
}

export type InviteInfo =
  { status: "ok"; homeName: string; inviterName: string; homeId: string } | { status: "invalid" };

export async function getInviteInfo(tx: Tx, token: string, now: Date): Promise<InviteInfo> {
  const [row] = await tx
    .select({ invite: schema.invites, homeName: schema.homes.name, inviterName: schema.users.displayName })
    .from(schema.invites)
    .innerJoin(schema.homes, eq(schema.homes.id, schema.invites.homeId))
    .innerJoin(schema.users, eq(schema.users.id, schema.invites.createdBy))
    .where(eq(schema.invites.token, token));
  if (!row || row.invite.usedAt || row.invite.expiresAt <= now) return { status: "invalid" };
  return {
    status: "ok",
    homeName: row.homeName,
    inviterName: row.inviterName ?? "Someone",
    homeId: row.invite.homeId,
  };
}

export type AcceptResult = "joined" | "already-member" | "invalid" | "full" | "in-other-home";

export async function acceptInvite(
  db: Tx,
  input: { token: string; userId: string; displayName: string; now: Date },
): Promise<AcceptResult> {
  return db.transaction(async (tx) => {
    const [invite] = await tx.select().from(schema.invites).where(eq(schema.invites.token, input.token)).for("update");
    const current = await getMembership(tx, input.userId);
    if (invite && current?.id === invite.homeId) return "already-member";
    if (!invite || invite.usedAt || invite.expiresAt <= input.now) return "invalid";
    if (current) return "in-other-home";

    // Lock the home so two people can't both take the second seat.
    await tx.select({ id: schema.homes.id }).from(schema.homes).where(eq(schema.homes.id, invite.homeId)).for("update");
    const [{ members }] = await tx
      .select({ members: count() })
      .from(schema.memberships)
      .where(eq(schema.memberships.homeId, invite.homeId));
    if (members >= 2) return "full";

    await tx.update(schema.users).set({ displayName: input.displayName }).where(eq(schema.users.id, input.userId));
    await tx.insert(schema.memberships).values({ homeId: invite.homeId, userId: input.userId });
    await tx.update(schema.invites).set({ usedAt: input.now }).where(eq(schema.invites.token, input.token));
    return "joined";
  });
}
