import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db, schema } from "@/db";
import { safeNext } from "@/lib/auth/login";
import { createSession } from "@/lib/auth/session";
import { isTestMode } from "@/lib/clock";

/** Test-only: sign in as an email address without the email round trip. */
export async function GET(request: Request) {
  if (!isTestMode()) return new Response("Not found", { status: 404 });
  const params = new URL(request.url).searchParams;
  const email = params.get("email")?.trim().toLowerCase();
  if (!email) return new Response("missing email", { status: 400 });
  await db.insert(schema.users).values({ email }).onConflictDoNothing();
  const [user] = await db.select().from(schema.users).where(eq(schema.users.email, email));
  await createSession(user.id);
  redirect(safeNext(params.get("next")));
}
