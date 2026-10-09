"use client";

import { useTransition } from "react";
import { setVesselPhotoAction } from "@/app/actions/photos";
import { Photo } from "@/components/photo";
import { cx } from "@/components/ui";

export function PhotoPicker({
  vesselId,
  photos,
  selectedId,
}: {
  vesselId: string;
  photos: { id: string; width: number; height: number }[];
  selectedId: string | null;
}) {
  const [pending, startTransition] = useTransition();
  return (
    <div>
      <p className="mb-2 text-[15px] font-semibold text-ink">From your album</p>
      <ul className="-mx-4 flex snap-x gap-2 overflow-x-auto px-4 pb-1" aria-busy={pending}>
        {photos.map((p) => (
          <li key={p.id} className="shrink-0 snap-start">
            <button
              type="button"
              disabled={pending}
              aria-pressed={p.id === selectedId}
              aria-label={p.id === selectedId ? "Kept inside" : "Keep this photo inside"}
              onClick={() => startTransition(() => setVesselPhotoAction(vesselId, p.id))}
              className={cx(
                "block size-20 overflow-hidden rounded-2xl border-2 transition-[border-color,opacity]",
                p.id === selectedId ? "border-gold" : "border-transparent opacity-85 hover:opacity-100",
              )}
            >
              <Photo
                id={p.id}
                width={p.width}
                height={p.height}
                alt=""
                thumb
                sizes="80px"
                className="size-full object-cover"
              />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
