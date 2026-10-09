"use server";

import { eq } from "drizzle-orm";
import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db, schema } from "@/db";
import { getNow } from "@/lib/clock";
import { getViewer, requireHome } from "@/lib/dal";
import { acceptInvite, createHome } from "@/lib/home";
import { isValidTimezone, localDate } from "@/lib/time";

export type FormState = { status: "idle" } | { status: "error"; message: string } | { status: "saved" };

const name = (label: string) => z.string().trim().min(1, `${label} can't be empty`).max(40, `${label} is a bit long`);

const optionalName = z
  .string()
  .trim()
  .max(40, "That name is a bit long")
  .transform((v) => (v ? v : null));

const optionalDate = z
  .string()
  .trim()
  .transform((v) => (v ? v : null))
  .refine((v) => v === null || /^\d{4}-\d{2}-\d{2}$/.test(v), "That date doesn't look right");

const timezone = z.string().refine(isValidTimezone, "Unknown timezone");

function firstError(error: z.ZodError): FormState {
  return { status: "error", message: error.issues[0]?.message ?? "Something doesn't look right" };
}

const homeSchema = z.object({
  displayName: name("Your name"),
  homeName: name("Your home's name"),
  daughterName: optionalName,
  daughterBirthdate: optionalDate,
  timezone,
});

export async function createHomeAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const viewer = await getViewer();
  if (!viewer) redirect("/login");
  if (viewer.home) redirect("/");

  const parsed = homeSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return firstError(parsed.error);
  const input = parsed.data;
  if (input.daughterBirthdate && input.daughterBirthdate > localDate(await getNow(), input.timezone)) {
    return { status: "error", message: "Her birthday can't be in the future" };
  }

  await createHome(db, viewer.user.id, input);
  redirect("/invite");
}

const joinSchema = z.object({ token: z.string().min(1), displayName: name("Your name") });

export async function acceptInviteAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const viewer = await getViewer();
  const parsed = joinSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return firstError(parsed.error);
  if (!viewer) redirect(`/join/${encodeURIComponent(parsed.data.token)}`);

  const result = await acceptInvite(db, {
    token: parsed.data.token,
    userId: viewer.user.id,
    displayName: parsed.data.displayName,
    now: await getNow(),
  });
  switch (result) {
    case "joined":
    case "already-member":
      redirect("/");
    case "full":
      return { status: "error", message: "This home already has two people in it." };
    case "in-other-home":
      return { status: "error", message: "You're already part of another home." };
    case "invalid":
      return { status: "error", message: "This invite has expired or was already used. Ask for a new one." };
  }
}

const settingsSchema = z.object({
  displayName: name("Your name"),
  homeName: name("Your home's name"),
  daughterName: optionalName,
  daughterBirthdate: optionalDate,
  timezone,
});

export async function updateSettingsAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const viewer = await requireHome("/settings");
  const parsed = settingsSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return firstError(parsed.error);
  const input = parsed.data;
  if (input.daughterBirthdate && input.daughterBirthdate > localDate(await getNow(), input.timezone)) {
    return { status: "error", message: "Her birthday can't be in the future" };
  }

  await db.transaction(async (tx) => {
    await tx.update(schema.users).set({ displayName: input.displayName }).where(eq(schema.users.id, viewer.user.id));
    await tx
      .update(schema.homes)
      .set({
        name: input.homeName,
        timezone: input.timezone,
        daughterName: input.daughterName,
        daughterBirthdate: input.daughterBirthdate,
      })
      .where(eq(schema.homes.id, viewer.home.id));
  });
  refresh();
  return { status: "saved" };
}
