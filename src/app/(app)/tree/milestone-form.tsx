"use client";

import { useRef, useState, useTransition } from "react";
import { addMilestoneAction, deleteMilestoneAction } from "@/app/actions/photos";
import { Button, Field, FormError, Input } from "@/components/ui";
import { appendPhoto, resizePhoto } from "@/lib/image-resize";

export function MilestoneForm({ today }: { today: string }) {
  const form = useRef<HTMLFormElement>(null);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  function submit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const file = formData.get("photoFile");
      formData.delete("photoFile");
      if (file instanceof File && file.size > 0) {
        try {
          appendPhoto(formData, await resizePhoto(file));
        } catch {
          setError("That photo couldn't be read. Try a different one.");
          return;
        }
      }
      const result = await addMilestoneAction({ status: "idle" }, formData);
      if (result.status === "error") {
        setError(result.message);
        return;
      }
      form.current?.reset();
      setFileName(null);
    });
  }

  return (
    <form ref={form} action={submit} className="space-y-4 rounded-3xl border border-line bg-surface p-5">
      <Field label="What happened?">
        <Input name="title" required maxLength={80} placeholder="First laugh, first tooth, rolled over…" />
      </Field>
      <Field label="When">
        <Input name="happenedOn" type="date" required defaultValue={today} max={today} />
      </Field>
      <label className="flex min-h-12 cursor-pointer items-center gap-3 rounded-2xl border border-dashed border-line-strong px-4 text-ink-soft transition-colors hover:border-gold">
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
          aria-hidden="true"
        >
          <rect x="3.5" y="5" width="17" height="14" rx="2.5" />
          <path d="M3.5 15.5l4.5-4.5 4 4 3-3 5.5 5.5" />
        </svg>
        <span className="truncate">{fileName ?? "Add a photo (optional)"}</span>
        <input
          type="file"
          name="photoFile"
          accept="image/*"
          className="sr-only"
          onChange={(e) => setFileName(e.target.files?.[0]?.name ?? null)}
        />
      </label>
      <FormError message={error} />
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Adding…" : "Add to her tree"}
      </Button>
    </form>
  );
}

export function MilestoneMenu({ id, title }: { id: string; title: string }) {
  const [confirming, setConfirming] = useState(false);
  const [pending, startTransition] = useTransition();

  if (confirming) {
    return (
      <div className="flex shrink-0 gap-1">
        <Button variant="ghost" className="min-h-10 px-3 text-[15px]" onClick={() => setConfirming(false)}>
          Keep
        </Button>
        <Button
          variant="ghost"
          className="min-h-10 px-3 text-[15px] text-danger hover:text-danger"
          disabled={pending}
          onClick={() => startTransition(() => deleteMilestoneAction(id))}
        >
          Remove
        </Button>
      </div>
    );
  }
  return (
    <button
      type="button"
      onClick={() => setConfirming(true)}
      aria-label={`Remove “${title}”`}
      className="grid size-10 shrink-0 place-items-center rounded-full text-ink-faint transition-colors hover:bg-bg-deep hover:text-ink"
    >
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        aria-hidden="true"
      >
        <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
      </svg>
    </button>
  );
}
