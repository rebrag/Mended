"use server";

import { and, eq, isNotNull } from "drizzle-orm";
import { refresh } from "next/cache";
import { z } from "zod";
import { db, schema } from "@/db";
import { getNow } from "@/lib/clock";
import { requireHome } from "@/lib/dal";
import { deleteObject, putObject } from "@/lib/storage";
import { localDate } from "@/lib/time";

const MAX_BYTES = 3_500_000;

export type PhotoState =
  { status: "idle" } | { status: "error"; message: string } | { status: "saved"; photoId: string };

async function readJpeg(value: FormDataEntryValue | null): Promise<Uint8Array | null> {
  if (!(value instanceof File) || value.size === 0 || value.size > MAX_BYTES) return null;
  const bytes = new Uint8Array(await value.arrayBuffer());
  // JPEG magic number: the client always re-encodes to JPEG before upload.
  if (bytes[0] !== 0xff || bytes[1] !== 0xd8 || bytes[2] !== 0xff) return null;
  return bytes;
}

/** Stores a photo the browser has already resized, returning its id. */
async function storePhoto(formData: FormData, homeId: string, userId: string): Promise<string | null> {
  const full = await readJpeg(formData.get("photo"));
  const thumb = await readJpeg(formData.get("thumb"));
  const width = Number(formData.get("width"));
  const height = Number(formData.get("height"));
  if (!full || !thumb || !Number.isInteger(width) || !Number.isInteger(height) || width <= 0 || height <= 0) {
    return null;
  }
  const caption =
    String(formData.get("caption") ?? "")
      .trim()
      .slice(0, 140) || null;
  const id = crypto.randomUUID();
  const storageKey = `homes/${homeId}/${id}.jpg`;
  const thumbKey = `homes/${homeId}/${id}_thumb.jpg`;
  await putObject(storageKey, full, "image/jpeg");
  await putObject(thumbKey, thumb, "image/jpeg");
  await db
    .insert(schema.photos)
    .values({ id, homeId, uploaderId: userId, storageKey, thumbKey, width, height, caption });
  return id;
}

export async function uploadPhotoAction(_prev: PhotoState, formData: FormData): Promise<PhotoState> {
  const viewer = await requireHome("/album");
  const photoId = await storePhoto(formData, viewer.home.id, viewer.user.id);
  if (!photoId) return { status: "error", message: "That photo couldn't be added. Try another one." };

  const vesselId = String(formData.get("vesselId") ?? "");
  if (vesselId) await placePhotoInVessel(viewer.home.id, vesselId, photoId);
  refresh();
  return { status: "saved", photoId };
}

async function placePhotoInVessel(homeId: string, vesselId: string, photoId: string) {
  await db
    .update(schema.vessels)
    .set({ photoId })
    .where(
      and(eq(schema.vessels.id, vesselId), eq(schema.vessels.homeId, homeId), isNotNull(schema.vessels.completedAt)),
    );
}

export async function setVesselPhotoAction(vesselId: string, photoId: string): Promise<void> {
  const viewer = await requireHome("/shelf");
  const [photo] = await db
    .select({ id: schema.photos.id })
    .from(schema.photos)
    .where(and(eq(schema.photos.id, photoId), eq(schema.photos.homeId, viewer.home.id)));
  if (!photo) return;
  await placePhotoInVessel(viewer.home.id, vesselId, photoId);
  refresh();
}

export async function deletePhotoAction(photoId: string): Promise<void> {
  const viewer = await requireHome("/album");
  const [photo] = await db
    .delete(schema.photos)
    .where(and(eq(schema.photos.id, photoId), eq(schema.photos.homeId, viewer.home.id)))
    .returning();
  if (photo) {
    await Promise.all([deleteObject(photo.storageKey), deleteObject(photo.thumbKey)]);
  }
  refresh();
}

const milestoneSchema = z.object({
  title: z.string().trim().min(1, "What happened?").max(80, "Keep it short and sweet"),
  happenedOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Pick a date"),
});

export type MilestoneState = { status: "idle" } | { status: "error"; message: string } | { status: "saved" };

export async function addMilestoneAction(_prev: MilestoneState, formData: FormData): Promise<MilestoneState> {
  const viewer = await requireHome("/tree");
  const parsed = milestoneSchema.safeParse({ title: formData.get("title"), happenedOn: formData.get("happenedOn") });
  if (!parsed.success) return { status: "error", message: parsed.error.issues[0].message };
  if (parsed.data.happenedOn > localDate(await getNow(), viewer.home.timezone)) {
    return { status: "error", message: "That date hasn't happened yet" };
  }

  let photoId: string | null = null;
  if (formData.get("photo") instanceof File && (formData.get("photo") as File).size > 0) {
    photoId = await storePhoto(formData, viewer.home.id, viewer.user.id);
    if (!photoId) return { status: "error", message: "That photo couldn't be added. Try another one." };
  }

  await db.insert(schema.milestones).values({
    homeId: viewer.home.id,
    title: parsed.data.title,
    happenedOn: parsed.data.happenedOn,
    photoId,
    createdBy: viewer.user.id,
  });
  refresh();
  return { status: "saved" };
}

export async function deleteMilestoneAction(milestoneId: string): Promise<void> {
  const viewer = await requireHome("/tree");
  await db
    .delete(schema.milestones)
    .where(and(eq(schema.milestones.id, milestoneId), eq(schema.milestones.homeId, viewer.home.id)));
  refresh();
}
