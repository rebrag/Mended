import type { Metadata } from "next";
import { Suspense } from "react";
import { SettingsLink } from "@/components/page-header";
import { ButtonLink, Card, Eyebrow } from "@/components/ui";
import { db } from "@/db";
import { getNow } from "@/lib/clock";
import { isPaired, memberIds, requireHome } from "@/lib/dal";
import { formatRoundDate, kindLabel } from "@/lib/game/labels";
import { renderPromptText } from "@/lib/game/prompts";
import { countMended, getOrOpenRound, getRoundView, getVessel } from "@/lib/game/rounds";
import type { VesselShape } from "@/lib/game/vessel-shapes";
import { MomentView } from "./moment-view";

export const metadata: Metadata = { title: "Today" };

export default function MomentPage() {
  return (
    <Suspense fallback={<MomentSkeleton />}>
      <MomentContent />
    </Suspense>
  );
}

function MomentSkeleton() {
  return (
    <div aria-busy="true">
      <div className="mb-5 h-[72px] space-y-2 pt-1">
        <div className="skeleton h-4 w-40" />
        <div className="skeleton h-8 w-48" />
      </div>
      <div className="skeleton mx-auto h-[180px] w-[180px] rounded-full" />
      <div className="skeleton mt-6 h-[260px] w-full rounded-3xl" />
    </div>
  );
}

async function MomentContent() {
  const viewer = await requireHome("/moment");
  if (!isPaired(viewer)) {
    return (
      <div className="pt-2">
        <Card>
          <Eyebrow>Almost ready</Eyebrow>
          <p className="mt-2 font-serif text-[22px] leading-snug text-ink">The second seat is waiting</p>
          <p className="mt-1.5 text-ink-soft">Moments begin once your person joins you here.</p>
          <ButtonLink href="/invite" className="mt-4 w-full">
            Share the invite
          </ButtonLink>
        </Card>
      </div>
    );
  }

  const round = await getOrOpenRound(db, viewer.home, await getNow());
  const view = await getRoundView(db, round, viewer.user.id, memberIds(viewer));
  const vessel = await getVessel(db, round.vesselId);
  const mended = await countMended(db, vessel.id);
  const names = { partner: viewer.partner.displayName, daughter: viewer.home.daughterName };

  return (
    <div>
      <header className="mb-2 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[14px] font-semibold text-ink-faint">{formatRoundDate(view.localDate)}</p>
          <p className="mt-0.5 text-[13px] font-semibold tracking-[0.12em] text-gold uppercase">
            {kindLabel(view.prompt.kind, names)}
          </p>
        </div>
        <SettingsLink />
      </header>
      <MomentView
        view={view}
        promptText={renderPromptText(view.prompt.text, names)}
        names={{ me: viewer.user.displayName ?? "You", partner: names.partner, daughter: names.daughter }}
        vessel={{ id: vessel.id, shape: vessel.shape as VesselShape, mended, position: vessel.position }}
      />
    </div>
  );
}
