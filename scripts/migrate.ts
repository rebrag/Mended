import "dotenv/config";
import { createDb } from "../src/db";
import { runMigrations } from "../src/db/migrate";

async function main() {
  // Neon's direct (unpooled) connection is the safer choice for schema changes.
  const url = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL is not set. Locally, copy .env.example to .env.local. On Vercel, connect a Neon database under Storage.",
    );
  }
  if (url.startsWith("pglite:") && url !== "pglite:memory") {
    const { mkdirSync } = await import("node:fs");
    mkdirSync(url.slice("pglite:".length), { recursive: true });
  }
  const { db, close } = createDb(url);
  await runMigrations(db, url);
  await close();
  console.log("Migrations applied.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
