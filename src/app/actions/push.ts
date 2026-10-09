"use server";

import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "@/db";
import { requireViewer } from "@/lib/dal";

const subscriptionSchema = z.object({
  endpoint: z.url(),
  keys: z.object({ p256dh: z.string().min(1), auth: z.string().min(1) }),
});

export async function savePushSubscriptionAction(subscription: unknown): Promise<{ ok: boolean }> {
  const viewer = await requireViewer("/settings");
  const parsed = subscriptionSchema.safeParse(subscription);
  if (!parsed.success) return { ok: false };
  const { endpoint, keys } = parsed.data;
  await db
    .insert(schema.pushSubscriptions)
    .values({ endpoint, userId: viewer.user.id, p256dh: keys.p256dh, auth: keys.auth })
    .onConflictDoUpdate({
      target: schema.pushSubscriptions.endpoint,
      set: { userId: viewer.user.id, p256dh: keys.p256dh, auth: keys.auth },
    });
  return { ok: true };
}

export async function removePushSubscriptionAction(endpoint: string): Promise<void> {
  const viewer = await requireViewer("/settings");
  await db
    .delete(schema.pushSubscriptions)
    .where(and(eq(schema.pushSubscriptions.endpoint, endpoint), eq(schema.pushSubscriptions.userId, viewer.user.id)));
}
