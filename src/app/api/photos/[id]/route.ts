import { and, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { getViewer } from "@/lib/dal";
import { getObject } from "@/lib/storage";

/** Serves a photo to members of its home only. ?size=thumb returns the small version. */
export async function GET(request: Request, { params }: RouteContext<"/api/photos/[id]">) {
  const viewer = await getViewer();
  if (!viewer?.home) return new Response("Unauthorized", { status: 401 });
  const { id } = await params;

  const [photo] = await db
    .select()
    .from(schema.photos)
    .where(and(eq(schema.photos.id, id), eq(schema.photos.homeId, viewer.home.id)));
  if (!photo) return new Response("Not found", { status: 404 });

  const thumb = new URL(request.url).searchParams.get("size") === "thumb";
  const body = await getObject(thumb ? photo.thumbKey : photo.storageKey);
  if (!body) return new Response("Not found", { status: 404 });

  return new Response(body as BodyInit, {
    headers: {
      "Content-Type": "image/jpeg",
      // Photo ids never change content, so browsers may keep them; "private" keeps shared caches out.
      "Cache-Control": "private, max-age=31536000, immutable",
    },
  });
}
