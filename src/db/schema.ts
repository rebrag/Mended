import { sql } from "drizzle-orm";
import { date, index, integer, jsonb, pgTable, primaryKey, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";

const id = () =>
  text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID());

const createdAt = () => timestamp("created_at", { withTimezone: true }).notNull().defaultNow();

export const users = pgTable("users", {
  id: id(),
  email: text("email").notNull().unique(),
  displayName: text("display_name"),
  createdAt: createdAt(),
});

export const sessions = pgTable(
  "sessions",
  {
    tokenHash: text("token_hash").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: createdAt(),
  },
  (t) => [index("sessions_user_idx").on(t.userId)],
);

export const loginTokens = pgTable("login_tokens", {
  tokenHash: text("token_hash").primaryKey(),
  email: text("email").notNull(),
  next: text("next"),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  usedAt: timestamp("used_at", { withTimezone: true }),
  createdAt: createdAt(),
});

export const homes = pgTable("homes", {
  id: id(),
  name: text("name").notNull(),
  timezone: text("timezone").notNull(),
  daughterName: text("daughter_name"),
  daughterBirthdate: date("daughter_birthdate"),
  createdAt: createdAt(),
});

export const memberships = pgTable(
  "memberships",
  {
    homeId: text("home_id")
      .notNull()
      .references(() => homes.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: createdAt(),
  },
  (t) => [
    primaryKey({ columns: [t.homeId, t.userId] }),
    // A person belongs to exactly one home.
    uniqueIndex("memberships_user_unique").on(t.userId),
  ],
);

export const invites = pgTable("invites", {
  token: text("token").primaryKey(),
  homeId: text("home_id")
    .notNull()
    .references(() => homes.id, { onDelete: "cascade" }),
  createdBy: text("created_by")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  usedAt: timestamp("used_at", { withTimezone: true }),
  createdAt: createdAt(),
});

export const photos = pgTable(
  "photos",
  {
    id: id(),
    homeId: text("home_id")
      .notNull()
      .references(() => homes.id, { onDelete: "cascade" }),
    uploaderId: text("uploader_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    storageKey: text("storage_key").notNull(),
    thumbKey: text("thumb_key").notNull(),
    width: integer("width").notNull(),
    height: integer("height").notNull(),
    caption: text("caption"),
    createdAt: createdAt(),
  },
  (t) => [index("photos_home_idx").on(t.homeId, t.createdAt)],
);

export const vessels = pgTable(
  "vessels",
  {
    id: id(),
    homeId: text("home_id")
      .notNull()
      .references(() => homes.id, { onDelete: "cascade" }),
    /** 0-based position in this home's sequence of vessels. */
    position: integer("position").notNull(),
    shape: text("shape").notNull(),
    photoId: text("photo_id").references(() => photos.id, { onDelete: "set null" }),
    startedAt: createdAt(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
  },
  (t) => [uniqueIndex("vessels_home_position_unique").on(t.homeId, t.position)],
);

export const rounds = pgTable(
  "rounds",
  {
    id: id(),
    homeId: text("home_id")
      .notNull()
      .references(() => homes.id, { onDelete: "cascade" }),
    /** 0-based position in this home's sequence of rounds. */
    position: integer("position").notNull(),
    /** Calendar date in the home's timezone on which the round was opened. */
    localDate: date("local_date").notNull(),
    promptId: text("prompt_id").notNull(),
    vesselId: text("vessel_id")
      .notNull()
      .references(() => vessels.id, { onDelete: "cascade" }),
    /** Set when both answers are in; the shard this round mended. */
    shardIndex: integer("shard_index"),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    createdAt: createdAt(),
  },
  (t) => [
    uniqueIndex("rounds_home_position_unique").on(t.homeId, t.position),
    uniqueIndex("rounds_home_date_unique").on(t.homeId, t.localDate),
    uniqueIndex("rounds_vessel_shard_unique")
      .on(t.vesselId, t.shardIndex)
      .where(sql`${t.shardIndex} is not null`),
  ],
);

export const answers = pgTable(
  "answers",
  {
    roundId: text("round_id")
      .notNull()
      .references(() => rounds.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    body: jsonb("body").notNull(),
    createdAt: createdAt(),
  },
  (t) => [primaryKey({ columns: [t.roundId, t.userId] })],
);

export const milestones = pgTable(
  "milestones",
  {
    id: id(),
    homeId: text("home_id")
      .notNull()
      .references(() => homes.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    happenedOn: date("happened_on").notNull(),
    photoId: text("photo_id").references(() => photos.id, { onDelete: "set null" }),
    createdBy: text("created_by")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: createdAt(),
  },
  (t) => [index("milestones_home_idx").on(t.homeId, t.happenedOn)],
);

export const pushSubscriptions = pgTable("push_subscriptions", {
  endpoint: text("endpoint").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  p256dh: text("p256dh").notNull(),
  auth: text("auth").notNull(),
  createdAt: createdAt(),
});

/** Emails captured instead of sent when MAIL_TRANSPORT=outbox (local dev and tests). */
export const outbox = pgTable("outbox", {
  id: id(),
  to: text("to").notNull(),
  subject: text("subject").notNull(),
  text: text("text").notNull(),
  createdAt: createdAt(),
});
