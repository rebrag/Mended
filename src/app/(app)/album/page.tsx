import { desc, eq } from "drizzle-orm";
import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHeader, SettingsLink } from "@/components/page-header";
import { PhotoUploader } from "@/components/photo-uploader";
import { db, schema } from "@/db";
import { requireHome } from "@/lib/dal";
import { AlbumGrid } from "./album-grid";

export const metadata: Metadata = { title: "Album" };

export default function AlbumPage() {
  return (
    <div>
      <PageHeader eyebrow="Just for the two of you" title="Album" action={<SettingsLink />} />
      <Suspense fallback={<AlbumSkeleton />}>
        <AlbumContent />
      </Suspense>
    </div>
  );
}

function AlbumSkeleton() {
  return (
    <div aria-busy="true">
      <div className="skeleton h-12 w-full rounded-full" />
      <div className="mt-5 grid grid-cols-3 gap-1.5">
        {Array.from({ length: 9 }, (_, i) => (
          <div key={i} className="skeleton aspect-square rounded-xl" />
        ))}
      </div>
    </div>
  );
}

async function AlbumContent() {
  const viewer = await requireHome("/album");
  const photos = await db
    .select({
      id: schema.photos.id,
      width: schema.photos.width,
      height: schema.photos.height,
      caption: schema.photos.caption,
      createdAt: schema.photos.createdAt,
    })
    .from(schema.photos)
    .where(eq(schema.photos.homeId, viewer.home.id))
    .orderBy(desc(schema.photos.createdAt));

  return (
    <div className="space-y-5">
      <PhotoUploader />
      {photos.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-line-strong px-6 py-12 text-center">
          <p className="font-serif text-[22px] text-ink">Nothing here yet</p>
          <p className="mx-auto mt-1.5 max-w-[16rem] text-ink-soft">
            Add a few favorites. You can tuck one inside each vessel you finish.
          </p>
        </div>
      ) : (
        <AlbumGrid photos={photos.map((p) => ({ ...p, createdAt: p.createdAt.toISOString() }))} />
      )}
    </div>
  );
}
