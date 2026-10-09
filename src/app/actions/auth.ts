"use server";

import { and, count, eq, gt } from "drizzle-orm";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db, schema } from "@/db";
import { consumeLoginToken, normalizeEmail, requestLoginLink, safeNext } from "@/lib/auth/login";
import { createSession, destroySession } from "@/lib/auth/session";

export type LoginState = { status: "idle" } | { status: "sent"; email: string } | { status: "error"; message: string };

const emailSchema = z.email("That email doesn't look quite right");

export async function requestLoginAction(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const parsed = emailSchema.safeParse(String(formData.get("email") ?? "").trim());
  if (!parsed.success) return { status: "error", message: parsed.error.issues[0].message };
  const email = normalizeEmail(parsed.data);

  const [{ recent }] = await db
    .select({ recent: count() })
    .from(schema.loginTokens)
    .where(
      and(eq(schema.loginTokens.email, email), gt(schema.loginTokens.createdAt, new Date(Date.now() - 15 * 60_000))),
    );
  if (recent >= 5) {
    return { status: "error", message: "That's a lot of links. Give it a few minutes and try again." };
  }

  try {
    await requestLoginLink(email, safeNext(String(formData.get("next") ?? "/")));
  } catch (err) {
    console.error(err);
    return { status: "error", message: "We couldn't send the email just now. Please try again." };
  }
  return { status: "sent", email };
}

export type VerifyState = { status: "idle" } | { status: "error"; message: string };

export async function verifyLoginAction(_prev: VerifyState, formData: FormData): Promise<VerifyState> {
  const token = String(formData.get("token") ?? "");
  const result = token ? await consumeLoginToken(token) : null;
  if (!result) {
    return { status: "error", message: "This link has expired or was already used. Ask for a fresh one." };
  }
  await createSession(result.userId);
  redirect(result.next);
}

export async function signOutAction(): Promise<void> {
  await destroySession();
  redirect("/login");
}
