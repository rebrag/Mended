"use client";

import { useRef, useState, useTransition } from "react";
import { uploadPhotoAction } from "@/app/actions/photos";
import { Button, FormError } from "@/components/ui";
import { appendPhoto, resizePhoto } from "@/lib/image-resize";

/** Picks photos from the device, shrinks them in the browser, and uploads them one by one. */
export function PhotoUploader({
  vesselId,
  label = "Add photos",
  multiple = true,
  variant = "primary",
}: {
  vesselId?: string;
  label?: string;
  multiple?: boolean;
  variant?: "primary" | "secondary";
}) {
  const input = useRef<HTMLInputElement>(null);
  const [pending, startTransition] = useTransition();
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  function onFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    const list = Array.from(files);
    setError(null);
    startTransition(async () => {
      setProgress({ done: 0, total: list.length });
      for (const [i, file] of list.entries()) {
        try {
          const photo = await resizePhoto(file);
          const formData = new FormData();
          appendPhoto(formData, photo);
          if (vesselId) formData.set("vesselId", vesselId);
          const result = await uploadPhotoAction({ status: "idle" }, formData);
          if (result.status === "error") setError(result.message);
        } catch {
          setError("One of those photos couldn't be read. Try a different one.");
        }
        setProgress({ done: i + 1, total: list.length });
      }
      setProgress(null);
      if (input.current) input.current.value = "";
    });
  }

  return (
    <div className="space-y-2">
      <input
        ref={input}
        type="file"
        accept="image/*"
        multiple={multiple}
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
        data-testid="photo-input"
        onChange={(e) => onFiles(e.target.files)}
      />
      <Button
        type="button"
        variant={variant}
        disabled={pending}
        onClick={() => input.current?.click()}
        className="w-full"
      >
        {pending && progress
          ? progress.total > 1
            ? `Adding ${Math.min(progress.done + 1, progress.total)} of ${progress.total}…`
            : "Adding…"
          : label}
      </Button>
      <FormError message={error} />
    </div>
  );
}
