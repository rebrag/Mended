"use client";

import { useRef, useState, useTransition } from "react";
import { deletePhotoAction } from "@/app/actions/photos";
import { Photo } from "@/components/photo";
import { Button } from "@/components/ui";

type AlbumPhoto = { id: string; width: number; height: number; caption: string | null; createdAt: string };

export function AlbumGrid({ photos }: { photos: AlbumPhoto[] }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [pending, startTransition] = useTransition();
  const open = photos.find((p) => p.id === openId) ?? null;

  function show(id: string) {
    setOpenId(id);
    setConfirming(false);
    dialog.current?.showModal();
  }

  function close() {
    dialog.current?.close();
  }

  return (
    <>
      <ul className="grid grid-cols-3 gap-1.5" data-testid="album-grid">
        {photos.map((photo) => (
          <li key={photo.id}>
            <button
              type="button"
              onClick={() => show(photo.id)}
              className="block aspect-square w-full overflow-hidden rounded-xl bg-bg-deep"
              aria-label="Open photo"
            >
              <Photo
                id={photo.id}
                width={photo.width}
                height={photo.height}
                alt={photo.caption ?? "A shared photo"}
                thumb
                sizes="33vw"
                className="size-full object-cover transition-transform duration-300 hover:scale-[1.03]"
              />
            </button>
          </li>
        ))}
      </ul>

      <dialog
        ref={dialog}
        onClose={() => setOpenId(null)}
        onClick={(e) => e.target === dialog.current && close()}
        className="m-auto max-h-[92dvh] w-[min(92vw,34rem)] overflow-hidden rounded-3xl bg-surface p-0 text-ink shadow-lift backdrop:bg-black/70 backdrop:backdrop-blur-sm"
      >
        {open ? (
          <div>
            <Photo
              id={open.id}
              width={open.width}
              height={open.height}
              alt={open.caption ?? "A shared photo"}
              sizes="92vw"
              className="max-h-[70dvh] w-full bg-bg-deep object-contain"
              priority
            />
            <div className="flex items-center justify-between gap-3 p-4">
              {confirming ? (
                <>
                  <p className="text-[15px] text-ink-soft">Remove for both of you?</p>
                  <div className="flex gap-2">
                    <Button variant="secondary" onClick={() => setConfirming(false)} className="min-h-10 px-4">
                      Keep
                    </Button>
                    <Button
                      disabled={pending}
                      onClick={() =>
                        startTransition(async () => {
                          await deletePhotoAction(open.id);
                          close();
                        })
                      }
                      className="min-h-10 bg-danger px-4 text-white hover:bg-danger"
                    >
                      Remove
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <Button variant="ghost" onClick={() => setConfirming(true)} className="min-h-10 px-4">
                    Remove
                  </Button>
                  <Button variant="secondary" onClick={close} className="min-h-10 px-5">
                    Close
                  </Button>
                </>
              )}
            </div>
          </div>
        ) : null}
      </dialog>
    </>
  );
}
