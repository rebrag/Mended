import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { VesselArt } from "@/components/art/vessel-art";
import { BackLink, PageHeader } from "@/components/page-header";
import { db } from "@/db";
import { requireHome } from "@/lib/dal";
import { getVessels } from "@/lib/game/history";
import { countMended } from "@/lib/game/rounds";
import { SHARDS_PER_VESSEL, VESSEL_NAMES, type VesselShape } from "@/lib/game/vessel-shapes";

export const metadata: Metadata = { title: "The shelf" };

export default function ShelfPage() {
  return (
    <div>
      <BackLink href="/" label="Courtyard" />
      <PageHeader eyebrow="Everything you've mended" title="The shelf" />
      <Suspense
        fallback={
          <div className="grid grid-cols-2 gap-3" aria-busy="true">
            <div className="skeleton aspect-[4/5] rounded-3xl" />
            <div className="skeleton aspect-[4/5] rounded-3xl" />
          </div>
        }
      >
        <ShelfContent />
      </Suspense>
    </div>
  );
}

async function ShelfContent() {
  const viewer = await requireHome("/shelf");
  const vessels = await getVessels(db, viewer.home.id);
  if (vessels.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-line-strong px-6 py-12 text-center">
        <p className="font-serif text-[22px] text-ink">The shelf is waiting</p>
        <p className="mx-auto mt-1.5 max-w-[17rem] text-ink-soft">
          Every vessel you mend together will rest here, with a photo tucked inside.
        </p>
      </div>
    );
  }
  const counts = await Promise.all(vessels.map(({ vessel }) => countMended(db, vessel.id)));

  return (
    <ul className="grid grid-cols-2 gap-3" data-testid="shelf">
      {vessels.map(({ vessel }, i) => {
        const shape = vessel.shape as VesselShape;
        const whole = Boolean(vessel.completedAt);
        return (
          <li key={vessel.id}>
            <Link
              href={`/shelf/${vessel.id}`}
              className="block rounded-3xl border border-line bg-surface p-3 shadow-card transition-transform active:scale-[0.98]"
            >
              <VesselArt
                shape={shape}
                seed={vessel.id}
                mended={counts[i]}
                className="mx-auto aspect-square w-full"
                compact
              />
              <p className="mt-1 text-center font-semibold text-ink">
                {VESSEL_NAMES[shape]} {vessel.position + 1}
              </p>
              <p className="text-center text-[14px] text-ink-faint">
                {whole ? "Whole" : `${counts[i]} of ${SHARDS_PER_VESSEL} mended`}
              </p>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
