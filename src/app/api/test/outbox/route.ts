import { desc, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { isTestMode } from "@/lib/clock";

/** Test-only: the latest email captured for an address, plus the first link in it. */
export async function GET(request: Request) {
  if (!isTestMode()) return new Response("Not found", { status: 404 });
  const to = new URL(request.url).searchParams.get("to")?.toLowerCase();
  if (!to) return Response.json({ error: "missing to" }, { status: 400 });
  const [mail] = await db
    .select()
    .from(schema.outbox)
    .where(eq(schema.outbox.to, to))
    .orderBy(desc(schema.outbox.createdAt))
    .limit(1);
  if (!mail) return Response.json({ error: "no mail" }, { status: 404 });
  const link = mail.text.match(/https?:\/\/\S+/)?.[0] ?? null;
  return Response.json({ subject: mail.subject, text: mail.text, link });
}
