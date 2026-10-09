import { createDb } from "@/db";
import { runMigrations } from "@/db/migrate";

/** A fresh, migrated in-memory database for a test. */
export async function testDb() {
  const handle = createDb("pglite:memory");
  await runMigrations(handle.db, "pglite:memory");
  return handle;
}
