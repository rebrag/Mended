import { migrate as migratePglite } from "drizzle-orm/pglite/migrator";
import { migrate as migratePostgres } from "drizzle-orm/postgres-js/migrator";
import path from "node:path";
import type { Db } from "./index";

export const MIGRATIONS_FOLDER = path.join(process.cwd(), "drizzle");

export async function runMigrations(db: Db, url: string) {
  const config = { migrationsFolder: MIGRATIONS_FOLDER };
  if (url.startsWith("pglite:")) {
    await migratePglite(db as never, config);
  } else {
    await migratePostgres(db as never, config);
  }
}
