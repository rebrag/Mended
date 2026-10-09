import "server-only";
import { and, eq, gt, isNull } from "drizzle-orm";
import { db, schema } from "@/db";
import { randomToken, sha256 } from "@/lib/crypto";
import { appUrl, sendMail } from "@/lib/mail";

const LOGIN_TOKEN_MINUTES = 30;

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/** Only allow same-origin relative paths as post-login destinations. */
export function safeNext(next: string | null | undefined): string {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) return "/";
  return next;
}

export async function requestLoginLink(rawEmail: string, next: string | null): Promise<void> {
  const email = normalizeEmail(rawEmail);
  const token = randomToken();
  await db.insert(schema.loginTokens).values({
    tokenHash: sha256(token),
    email,
    next: safeNext(next),
    expiresAt: new Date(Date.now() + LOGIN_TOKEN_MINUTES * 60_000),
  });
  const link = appUrl(`/auth/verify?token=${encodeURIComponent(token)}`);
  await sendMail({
    to: email,
    subject: "Your way in",
    text: `Tap to come in:\n\n${link}\n\nThis link works once and expires in ${LOGIN_TOKEN_MINUTES} minutes. If you didn't ask for it, you can ignore this email.`,
    html: `<div style="font-family:Georgia,serif;font-size:17px;color:#3b2f24;line-height:1.5">
<p>Tap to come in:</p>
<p><a href="${link}" style="display:inline-block;background:#1f3a5f;color:#fbf6ec;padding:12px 22px;border-radius:999px;text-decoration:none">Come in</a></p>
<p style="font-size:14px;color:#7a6a58">This link works once and expires in ${LOGIN_TOKEN_MINUTES} minutes. If you didn't ask for it, you can ignore this email.</p>
</div>`,
  });
}

/**
 * Consumes a login token and returns the user id and destination, or null if the token is invalid.
 * The token is marked used atomically so a link can only be used once.
 */
export async function consumeLoginToken(token: string): Promise<{ userId: string; next: string } | null> {
  const [row] = await db
    .update(schema.loginTokens)
    .set({ usedAt: new Date() })
    .where(
      and(
        eq(schema.loginTokens.tokenHash, sha256(token)),
        isNull(schema.loginTokens.usedAt),
        gt(schema.loginTokens.expiresAt, new Date()),
      ),
    )
    .returning({ email: schema.loginTokens.email, next: schema.loginTokens.next });
  if (!row) return null;

  await db.insert(schema.users).values({ email: row.email }).onConflictDoNothing();
  const [user] = await db.select({ id: schema.users.id }).from(schema.users).where(eq(schema.users.email, row.email));
  return { userId: user.id, next: safeNext(row.next) };
}
