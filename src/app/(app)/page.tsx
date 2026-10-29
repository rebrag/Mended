import Link from "next/link";
import { Suspense } from "react";
import { Courtyard } from "@/components/courtyard";
import { SettingsLink } from "@/components/page-header";
import { PieceTracker } from "@/components/piece-tracker";
import { ButtonLink, Card, Eyebrow } from "@/components/ui";
import { db } from "@/db";
import { getNow } from "@/lib/clock";
import { isPaired, memberIds, requireHome, type HomeViewer } from "@/lib/dal";
import { getLastMendedMoment, type LastMended } from "@/lib/game/history";
import { loadHomeState, type HomeState } from "@/lib/game/home-state";
import { formatRoundDate } from "@/lib/game/labels";
import { renderPromptText } from "@/lib/game/prompts";
import { SHARDS_PER_VESSEL, VESSEL_NAMES } from "@/lib/game/vessel-shapes";
import { localParts } from "@/lib/time";

export default function CourtyardPage() {
  return (
    <Suspense fallback={<CourtyardSkeleton />}>
      <CourtyardContent />
    </Suspense>
  );
}

function CourtyardSkeleton() {
  return (
    <div aria-busy="true">
      <div className="mb-4 flex h-[72px] items-center">
        <div className="skeleton h-9 w-56" />
      </div>
      <div className="skeleton aspect-[9/10] w-full rounded-[28px]" />
      <div className="skeleton mt-4 h-[148px] w-full rounded-3xl" />
    </div>
  );
}

function greeting(viewer: HomeViewer, now: Date, restWindow: boolean): string {
  const name = viewer.user.displayName ?? "";
  if (restWindow) return `Shalom, ${name}`;
  const { hour } = localParts(now, viewer.home.timezone);
  const part = hour < 5 ? "Good night" : hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  return `${part}, ${name}`;
}

async function CourtyardContent() {
  const viewer = await requireHome("/");
  const now = await getNow();
  const paired = isPaired(viewer);
  const state = await loadHomeState(db, {
    home: viewer.home,
    viewerId: viewer.user.id,
    memberIds: paired ? memberIds(viewer) : null,
    now,
  });
  const lastMended = paired ? await getLastMendedMoment(db, viewer.home.id, state.round?.roundId ?? null) : null;

  return (
    <div className="rise-in">
      <header className="mb-4 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-[14px] font-semibold text-ink-faint">{viewer.home.name}</p>
          <h1 className="truncate font-serif text-[28px] leading-tight font-medium text-ink">
            {greeting(viewer, now, state.restWindow)}
          </h1>
        </div>
        <SettingsLink />
      </header>

      <Courtyard
        period={state.period}
        vessel={state.vessel}
        shelf={state.shelf}
        shelfCount={state.shelfCount}
        tree={state.tree}
        candlesLit={state.candlesLit}
        attention={state.status === "your-turn" || state.status === "partner-answered"}
        mendedRoundId={state.status === "mended" && state.round ? state.round.roundId : null}
      />

      <div className="mt-4">
        <MomentCard viewer={viewer} state={state} />
      </div>

      {lastMended && isPaired(viewer) ? (
        <LastMendedStrip
          moment={lastMended}
          names={{ partner: viewer.partner.displayName, daughter: viewer.home.daughterName }}
        />
      ) : null}

      {state.vessel ? (
        <PieceTracker
          mended={state.vessel.mended}
          label={`${VESSEL_NAMES[state.vessel.shape]} ${state.vessel.position + 1} · ${state.vessel.mended} of ${SHARDS_PER_VESSEL} pieces mended`}
          className="mt-5"
        />
      ) : null}
    </div>
  );
}

function MomentCard({ viewer, state }: { viewer: HomeViewer; state: HomeState }) {
  if (!isPaired(viewer) || !state.round || !state.status) {
    return (
      <Card>
        <Eyebrow>Almost ready</Eyebrow>
        <p className="mt-2 font-serif text-[22px] leading-snug text-ink">The second seat is waiting</p>
        <p className="mt-1.5 text-ink-soft">Moments begin once your person joins you here.</p>
        <ButtonLink href="/invite" className="mt-4 w-full">
          Share the invite
        </ButtonLink>
      </Card>
    );
  }

  const partner = viewer.partner.displayName;
  const prompt = renderPromptText(state.round.prompt.text, {
    partner,
    daughter: viewer.home.daughterName,
  });

  switch (state.status) {
    case "your-turn":
      return (
        <Card>
          <Eyebrow>Today&apos;s moment</Eyebrow>
          <p className="mt-2 font-serif text-[22px] leading-snug text-balance text-ink">{prompt}</p>
          <ButtonLink href="/moment" className="mt-4 w-full">
            Answer
          </ButtonLink>
        </Card>
      );
    case "partner-answered":
      return (
        <Card>
          <Eyebrow>{partner} left something for you</Eyebrow>
          <p className="mt-2 font-serif text-[22px] leading-snug text-balance text-ink">{prompt}</p>
          <p className="mt-1.5 text-ink-soft">Their answer stays tucked away until you&apos;ve shared yours.</p>
          <ButtonLink href="/moment" className="mt-4 w-full">
            Answer
          </ButtonLink>
        </Card>
      );
    case "waiting":
      return (
        <Card>
          <Eyebrow>Your answer is in</Eyebrow>
          <p className="mt-2 font-serif text-[22px] leading-snug text-balance text-ink">{prompt}</p>
          <p className="mt-1.5 text-ink-soft">
            When {partner} answers too, you&apos;ll see each other&apos;s, and a piece is mended.
          </p>
          <Link
            href="/moment"
            className="mt-3 inline-block font-semibold text-primary underline-offset-4 hover:underline"
          >
            View or change your answer
          </Link>
        </Card>
      );
    case "mended":
      return (
        <Card className="border-gold/40">
          <Eyebrow>Mended today</Eyebrow>
          <p className="mt-2 font-serif text-[22px] leading-snug text-balance text-ink">{prompt}</p>
          <p className="mt-1.5 text-ink-soft">Tomorrow brings a new moment.</p>
          <ButtonLink href="/moment" variant="secondary" className="mt-4 w-full">
            See what you both said
          </ButtonLink>
          <Link
            href="/moments"
            className="mt-3 inline-block font-semibold text-primary underline-offset-4 hover:underline"
          >
            Look back at every moment
          </Link>
        </Card>
      );
  }
}

/** A quiet pointer to the last thing you both said, so yesterday is never more than a tap away. */
function LastMendedStrip({
  moment,
  names,
}: {
  moment: LastMended;
  names: { partner: string; daughter: string | null };
}) {
  return (
    <Link
      href={`/moments#round-${moment.roundId}`}
      className="rise-in mt-3 flex items-center gap-3 rounded-3xl border border-line bg-surface/70 px-4 py-3 transition-colors [animation-delay:150ms] hover:bg-surface"
      data-testid="last-mended"
    >
      <span className="grid size-9 shrink-0 place-items-center rounded-full bg-gold-soft text-gold" aria-hidden="true">
        <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M12 7v5l3 2" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="12" cy="12" r="8.5" />
        </svg>
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[12px] font-semibold tracking-[0.12em] text-ink-faint uppercase">
          Last mended · {formatRoundDate(moment.localDate).replace(/^(\w+), /, "$1 ")}
        </span>
        <span className="block truncate text-[15px] text-ink">{renderPromptText(moment.prompt.text, names)}</span>
      </span>
      <span className="shrink-0 text-[14px] font-semibold text-primary">Look back</span>
    </Link>
  );
}
