import { and, desc, eq } from "drizzle-orm";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { AnswerBody, MatchLine } from "@/components/answers";
import { VesselArt } from "@/components/art/vessel-art";
import { BackLink } from "@/components/page-header";
import { Photo } from "@/components/photo";
import { PhotoUploader } from "@/components/photo-uploader";
import { Card } from "@/components/ui";
import { db, schema } from "@/db";
import { requireHome } from "@/lib/dal";
import { getVesselMoments } from "@/lib/game/history";
import { formatRoundDate } from "@/lib/game/labels";
import { renderPromptText } from "@/lib/game/prompts";
import { SCENE_FRAME, SHARDS_PER_VESSEL, VESSEL_NAMES, type VesselShape } from "@/lib/game/vessel-shapes";
import { PhotoPicker } from "./photo-picker";

export const metadata: Metadata = { title: "A vessel" };

export default function VesselPage({ params }: PageProps<"/shelf/[vesselId]">) {
  return (
    <div>
      <BackLink href="/shelf" label="The shelf" />
      <Suspense
        fallback={
          <div aria-busy="true">
            <div className="skeleton mx-auto mt-4 h-[260px] w-[220px] rounded-[28px]" />
            <div className="skeleton mt-6 h-[140px] w-full rounded-3xl" />
          </div>
        }
      >
        <VesselContent params={params} />
      </Suspense>
    </div>
  );
}

async function VesselContent({ params }: { params: PageProps<"/shelf/[vesselId]">["params"] }) {
  const { vesselId } = await params;
  const viewer = await requireHome(`/shelf/${vesselId}`);
  const [row] = await db
    .select({
      vessel: schema.vessels,
      photo: { id: schema.photos.id, width: schema.photos.width, height: schema.photos.height },
    })
    .from(schema.vessels)
    .leftJoin(schema.photos, eq(schema.photos.id, schema.vessels.photoId))
    .where(and(eq(schema.vessels.id, vesselId), eq(schema.vessels.homeId, viewer.home.id)));
  if (!row) notFound();

  const { vessel, photo } = row;
  const shape = vessel.shape as VesselShape;
  const moments = await getVesselMoments(db, viewer.home.id, vessel.id);
  const whole = Boolean(vessel.completedAt);
  const partner = viewer.partner;
  const names = { me: viewer.user.displayName ?? "You", partner: partner?.displayName ?? "Your person" };

  const albumPhotos = whole
    ? await db
        .select({ id: schema.photos.id, width: schema.photos.width, height: schema.photos.height })
        .from(schema.photos)
        .where(eq(schema.photos.homeId, viewer.home.id))
        .orderBy(desc(schema.photos.createdAt))
        .limit(30)
    : [];

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div
          className="relative mx-auto w-[min(60vw,220px)]"
          style={{ aspectRatio: `${SCENE_FRAME.width} / ${SCENE_FRAME.height}` }}
        >
          <VesselArt shape={shape} seed={vessel.id} mended={moments.length} frame="scene" className="h-full w-full" />
        </div>
        <h1 className="mt-1 font-serif text-[30px] leading-tight font-medium text-ink">
          {VESSEL_NAMES[shape]} {vessel.position + 1}
        </h1>
        <p className="mt-1 text-[15px] text-ink-faint">
          {whole ? "Whole" : `${moments.length} of ${SHARDS_PER_VESSEL} pieces mended`}
          {moments.length > 0 ? ` · since ${formatRoundDate(moments[0].localDate).replace(/^\w+, /, "")}` : null}
        </p>
      </div>

      {whole ? (
        <section className="space-y-3">
          {photo?.id ? (
            <figure className="overflow-hidden rounded-3xl border border-gold/40 bg-surface shadow-card">
              <Photo
                id={photo.id}
                width={photo.width!}
                height={photo.height!}
                alt="The photo kept inside this vessel"
                sizes="(max-width: 512px) 100vw, 512px"
                className="max-h-[420px] w-full object-cover"
              />
              <figcaption className="px-4 py-3 text-center text-[14px] text-ink-faint">Kept inside</figcaption>
            </figure>
          ) : (
            <Card className="border-gold/40">
              <p className="font-serif text-[22px] text-ink">Keep a photo inside</p>
              <p className="mt-1 text-ink-soft">Choose one that feels like these eighteen moments.</p>
            </Card>
          )}
          {albumPhotos.length > 0 ? (
            <PhotoPicker vesselId={vessel.id} photos={albumPhotos} selectedId={photo?.id ?? null} />
          ) : null}
          <PhotoUploader vesselId={vessel.id} label="Upload a new photo" multiple={false} variant="secondary" />
        </section>
      ) : null}

      <section>
        <h2 className="font-serif text-[22px] font-medium text-ink">
          {moments.length === 0 ? "No moments yet" : "The moments inside"}
        </h2>
        {moments.length === 0 ? (
          <p className="mt-1.5 text-ink-soft">Each moment you both answer mends a piece and lands here.</p>
        ) : (
          <ol className="mt-3 space-y-3" data-testid="vessel-moments">
            {moments.map((m) => {
              const mine = m.answers[viewer.user.id] ?? null;
              const theirs = partner ? (m.answers[partner.id] ?? null) : null;
              return (
                <li key={m.roundId}>
                  <Card>
                    <p className="text-[13px] font-semibold tracking-[0.12em] text-gold uppercase">
                      Piece {m.shardIndex + 1} · {formatRoundDate(m.localDate)}
                    </p>
                    <p className="mt-1.5 font-serif text-[20px] leading-snug text-ink">
                      {renderPromptText(m.prompt.text, {
                        partner: names.partner,
                        daughter: viewer.home.daughterName,
                      })}
                    </p>
                    <div className="mt-3">
                      <MatchLine prompt={m.prompt} mine={mine} theirs={theirs} names={names} />
                    </div>
                    <dl className="mt-3 space-y-3 border-t border-line pt-3">
                      {[
                        { who: names.me, answer: mine, self: true },
                        { who: names.partner, answer: theirs, self: false },
                      ].map(({ who, answer, self }) => (
                        <div key={who + String(self)}>
                          <dt className="text-[13px] font-semibold tracking-[0.12em] text-ink-faint uppercase">
                            {who}
                          </dt>
                          <dd className="mt-1">
                            {answer ? <AnswerBody answer={answer} prompt={m.prompt} self={self} names={names} /> : null}
                          </dd>
                        </div>
                      ))}
                    </dl>
                  </Card>
                </li>
              );
            })}
          </ol>
        )}
      </section>
    </div>
  );
}
