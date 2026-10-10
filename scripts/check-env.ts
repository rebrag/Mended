/**
 * Runs before every Vercel build and explains, in plain terms, any setting that is still missing.
 * Locally it does nothing, because development uses the embedded database and the email outbox.
 */
type Check = { ok: boolean; problem: string; fix: string };

function main() {
  if (!process.env.VERCEL) return;

  const env = process.env;
  const transport = env.MAIL_TRANSPORT || "resend";
  const checks: Check[] = [
    {
      ok: Boolean(env.DATABASE_URL),
      problem: "No database is connected (DATABASE_URL).",
      fix: "Vercel project > Storage > Create Database > Neon, then connect it to this project.",
    },
    {
      ok: Boolean(env.BLOB_READ_WRITE_TOKEN || env.BLOB_STORE_ID),
      problem: "No photo storage is connected (BLOB_STORE_ID or BLOB_READ_WRITE_TOKEN).",
      fix: "Vercel project > Storage > Create > Blob, then connect it to this project.",
    },
    {
      ok: transport === "gmail" || transport === "resend",
      problem: `MAIL_TRANSPORT is "${transport}", which can't send real email.`,
      fix: 'Set MAIL_TRANSPORT to "gmail" in Settings > Environment Variables.',
    },
    {
      ok: transport !== "gmail" || Boolean(env.GMAIL_USER && env.GMAIL_APP_PASSWORD),
      problem: "Gmail sending is on, but GMAIL_USER or GMAIL_APP_PASSWORD is missing.",
      fix: "Add both in Settings > Environment Variables (create the app password at https://myaccount.google.com/apppasswords).",
    },
    {
      ok: transport !== "resend" || Boolean(env.RESEND_API_KEY && env.MAIL_FROM),
      problem: "Resend sending is on, but RESEND_API_KEY or MAIL_FROM is missing.",
      fix: 'To send from Gmail instead, set MAIL_TRANSPORT to "gmail" plus GMAIL_USER and GMAIL_APP_PASSWORD.',
    },
    {
      ok: env.TEST_MODE !== "1",
      problem: "TEST_MODE is on, which enables test-only shortcuts.",
      fix: "Remove TEST_MODE from Settings > Environment Variables.",
    },
  ];

  const failing = checks.filter((c) => !c.ok);
  if (failing.length === 0) {
    console.log("Environment looks good.");
    return;
  }
  console.error("\nMended isn't fully set up on Vercel yet:\n");
  for (const c of failing) console.error(`  - ${c.problem}\n    Fix: ${c.fix}\n`);
  console.error("After changing settings, redeploy (Deployments > ... > Redeploy).\n");
  process.exit(1);
}

main();
