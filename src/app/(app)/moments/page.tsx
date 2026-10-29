import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHeader, SettingsLink } from "@/components/page-header";
import { ButtonLink } from "@/components/ui";
import { db } from "@/db";
import { requireHome } from "@/lib/dal";
import { getAllMoments } from "@/lib/game/history";
import { MomentsJournal } from "./moments-journal";

export const metadata: Metadata = { title: "Moments" };

export default function MomentsPage() {
  return (
    <div>
      <PageHeader eyebrow="Everything you've both said" title="Moments" action={<SettingsLink />} />
      <Suspense fallback={<JournalSkeleton />}>
        <JournalContent />
      </Suspense>
    </div>
  );
}

function JournalSkeleton() {
  return (
    <div aria-busy="true">
      <div className="skeleton h-12 w-full rounded-full" />
      <div className="mt-3 flex gap-2">
        <div className="skeleton h-9 w-16 rounded-full" />
        <div className="skeleton h-9 w-20 rounded-full" />
        <div className="skeleton h-9 w-24 rounded-full" />
      </div>
      <div className="skeleton mt-5 h-[200px] w-full rounded-3xl" />
      <div className="skeleton mt-3 h-[200px] w-full rounded-3xl" />
    </div>
  );
}

async function JournalContent() {
  const viewer = await requireHome("/moments");
  const moments = await getAllMoments(db, viewer.home.id);

  if (moments.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-line-strong px-6 py-12 text-center">
        <p className="font-serif text-[22px] text-ink">Nothing to look back on yet</p>
        <p className="mx-auto mt-1.5 max-w-[17rem] text-ink-soft">
          Every moment you both answer lands here, so you can always find what you said.
        </p>
        {viewer.partner ? (
          <ButtonLink href="/moment" className="mt-5">
            Today&apos;s moment
          </ButtonLink>
        ) : null}
      </div>
    );
  }

  return (
    <MomentsJournal
      moments={moments}
      names={{
        me: viewer.user.displayName ?? "You",
        partner: viewer.partner?.displayName ?? "Your person",
        daughter: viewer.home.daughterName,
      }}
      viewerId={viewer.user.id}
      partnerId={viewer.partner?.id ?? null}
    />
  );
}
