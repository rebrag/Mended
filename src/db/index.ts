import { PGlite } from "@electric-sql/pglite";
import { drizzle as drizzlePglite } from "drizzle-orm/pglite";
import { drizzle as drizzlePostgres } from "drizzle-orm/postgres-js";
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import postgres from "postgres";
import * as schema from "./schema";

export type Db = PgDatabase<PgQueryResultHKT, typeof schema>;
/** Either the database or an open transaction; domain functions accept both. */
export type Tx = Parameters<Parameters<Db["transaction"]>[0]>[0] | Db;

const PGLITE_PREFIX = "pglite:";

/**
 * Creates a database client from a connection string.
 * "pglite:<dir>" opens an embedded Postgres in that directory, "pglite:memory" an in-memory one.
 * Anything else is treated as a regular Postgres URL (Neon in production).
 */
export function createDb(url: string): { db: Db; close: () => Promise<void> } {
  if (url.startsWith(PGLITE_PREFIX)) {
    const target = url.slice(PGLITE_PREFIX.length);
    const client = target === "memory" ? new PGlite() : new PGlite(target);
    return { db: drizzlePglite(client, { schema }) as unknown as Db, close: () => client.close() };
  }
  const client = postgres(url, { prepare: false, max: 5 });
  return { db: drizzlePostgres(client, { schema }) as unknown as Db, close: () => client.end() };
}

const globalForDb = globalThis as unknown as { __mendedDb?: Db };

function getDb(): Db {
  if (!globalForDb.__mendedDb) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error("DATABASE_URL is not set");
    globalForDb.__mendedDb = createDb(url).db;
  }
  return globalForDb.__mendedDb;
}

/** Lazily-connected shared database client. */
export const db: Db = new Proxy({} as Db, {
  get(_target, prop) {
    const real = getDb();
    const value = Reflect.get(real, prop, real);
    return typeof value === "function" ? value.bind(real) : value;
  },
});

export { schema };
