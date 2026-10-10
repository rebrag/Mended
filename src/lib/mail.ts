import "server-only";
import nodemailer from "nodemailer";
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

  if (transport === "gmail") {
    await sendWithGmail(mail);
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

/**
 * Sends through a Gmail account using a Google app password (no domain needed).
 * https://myaccount.google.com/apppasswords
 */
async function sendWithGmail(mail: Mail): Promise<void> {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD?.replace(/\s+/g, "");
  if (!user || !pass) throw new Error("GMAIL_USER and GMAIL_APP_PASSWORD must be set");
  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: { user, pass },
  });
  await transporter.sendMail({
    from: process.env.MAIL_FROM || `Mended <${user}>`,
    to: mail.to,
    subject: mail.subject,
    text: mail.text,
    html: mail.html,
  });
}

/** Absolute URL for links in emails and invites. On Vercel this defaults to the project's production domain. */
export function appUrl(path: string): string {
  const base =
    process.env.APP_URL ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : null) ||
    "http://localhost:3000";
  return new URL(path, base).toString();
}
