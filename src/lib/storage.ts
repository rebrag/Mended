import "server-only";
import { del, get, put } from "@vercel/blob";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";

/**
 * Private object storage for photos.
 * Uses private Vercel Blob when BLOB_READ_WRITE_TOKEN is set, otherwise local disk (development and tests).
 * Objects are only ever served through the authenticated /api/photos route.
 */
const LOCAL_ROOT = path.join(process.cwd(), ".data", "uploads");

function blobConfigured(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

function localPath(key: string): string {
  const resolved = path.resolve(LOCAL_ROOT, key);
  if (!resolved.startsWith(LOCAL_ROOT + path.sep)) throw new Error("Invalid storage key");
  return resolved;
}

export async function putObject(key: string, bytes: Uint8Array, contentType: string): Promise<void> {
  if (blobConfigured()) {
    await put(key, Buffer.from(bytes), { access: "private", contentType, addRandomSuffix: false });
    return;
  }
  const file = localPath(key);
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, bytes);
}

export async function getObject(key: string): Promise<ReadableStream<Uint8Array> | Uint8Array | null> {
  if (blobConfigured()) {
    const result = await get(key, { access: "private" });
    return result && result.statusCode === 200 ? result.stream : null;
  }
  try {
    return new Uint8Array(await readFile(localPath(key)));
  } catch {
    return null;
  }
}

export async function deleteObject(key: string): Promise<void> {
  if (blobConfigured()) {
    await del(key);
    return;
  }
  await rm(localPath(key), { force: true });
}
