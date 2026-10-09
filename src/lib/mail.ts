import "server-only";
import { db, schema } from "@/db";

export type Mail = { to: string; subject: string; text: string; html: string };

export async function sendMail(mail: Mail): Promise<void> {
  const transport = process.env.MAIL_TRANSPORT ?? "resend";
  if (transport === "outbox") {
    if (process.env.VERCEL_ENV === "production") {
      throw new Error("MAIL_TRANSPORT=outbox is not allowed in production");
    }
    await db.insert(schema.outbox).values({ to: mail.to, subject: mail.subject, text: mail.text });
    console.log(`[outbox] to=${mail.to} subject="${mail.subject}"\n${mail.text}`);
    return;
  }

  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.MAIL_FROM;
  if (!apiKey || !from) throw new Error("RESEND_API_KEY and MAIL_FROM must be set");

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from, to: mail.to, subject: mail.subject, text: mail.text, html: mail.html }),
  });
  if (!res.ok) {
    throw new Error(`Email send failed (${res.status}): ${await res.text()}`);
  }
}

export function appUrl(path: string): string {
  const base = process.env.APP_URL ?? "http://localhost:3000";
  return new URL(path, base).toString();
}
