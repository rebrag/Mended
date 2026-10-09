import { desc, eq } from "drizzle-orm";
import type { Metadata } from "next";
import { Suspense } from "react";
import { PomegranateTree } from "@/components/art/pomegranate-tree";
import { PageHeader, SettingsLink } from "@/components/page-header";
import { Photo } from "@/components/photo";
import { ButtonLink, Card } from "@/components/ui";
import { db, schema } from "@/db";
import { getNow } from "@/lib/clock";
import { requireHome } from "@/lib/dal";
import { formatLongDate, localDate } from "@/lib/time";
import { treeGrowth } from "@/lib/tree";
import { MilestoneForm, MilestoneMenu } from "./milestone-form";

export const metadata: Metadata = { title: "Her tree" };

export default function TreePage() {
  return (
    <Suspense fallback={<TreeSkeleton />}>
      <TreeContent />
    </Suspense>
  );
}

function TreeSkeleton() {
  return (
    <div aria-busy="true">
      <div className="mb-5 h-[72px] space-y-2 pt-1">
        <div className="skeleton h-4 w-32" />
        <div className="skeleton h-8 w-52" />
      </div>
      <div className="skeleton h-[300px] w-full rounded-[28px]" />
    </div>
  );
}

async function TreeContent() {
  const viewer = await requireHome("/tree");
  const today = localDate(await getNow(), viewer.home.timezone);
  const name = viewer.home.daughterName;
  const growth = treeGrowth(viewer.home.daughterBirthdate, today);
  const milestones = await db
    .select({
      id: schema.milestones.id,
      title: schema.milestones.title,
      happenedOn: schema.milestones.happenedOn,
      photoId: schema.milestones.photoId,
      width: schema.photos.width,
      height: schema.photos.height,
    })
    .from(schema.milestones)
    .leftJoin(schema.photos, eq(schema.photos.id, schema.milestones.photoId))
    .where(eq(schema.milestones.homeId, viewer.home.id))
    .orderBy(desc(schema.milestones.happenedOn), desc(schema.milestones.createdAt));

  return (
    <div>
      <PageHeader
        eyebrow={growth.ageLabel ?? "A young pomegranate tree"}
        title={name ? `${name}'s tree` : "Her tree"}
        action={<SettingsLink />}
      />

      <div className="relative overflow-hidden rounded-[28px] border border-line bg-[radial-gradient(ellipse_at_50%_35%,var(--gold-soft),transparent_70%)] px-6 pt-4">
        <PomegranateTree
          growth={growth.growth}
          fruit={milestones.length}
          seed={viewer.home.id}
          label={name ? `${name}'s pomegranate tree` : undefined}
          className="mx-auto h-[300px] w-auto"
        />
      </div>
      <p className="mt-3 text-center text-[15px] text-ink-soft">
        {milestones.length === 0
          ? "Each little first you add becomes a pomegranate on her tree."
          : `${milestones.length} ${milestones.length === 1 ? "pomegranate" : "pomegranates"} so far. One for every little first.`}
      </p>

      {!viewer.home.daughterBirthdate ? (
        <Card className="mt-5">
          <p className="text-ink-soft">Add her birthday in settings and the tree will grow along with her.</p>
          <ButtonLink href="/settings" variant="secondary" className="mt-3 w-full">
            Open settings
          </ButtonLink>
        </Card>
      ) : null}

      <section className="mt-8">
        <h2 className="font-serif text-[22px] font-medium text-ink">Add a little first</h2>
        <div className="mt-3">
          <MilestoneForm today={today} />
        </div>
      </section>

      {milestones.length > 0 ? (
        <section className="mt-8">
          <h2 className="font-serif text-[22px] font-medium text-ink">Her firsts</h2>
          <ol className="mt-3 space-y-3" data-testid="milestones">
            {milestones.map((m) => (
              <li key={m.id} className="flex items-center gap-3 rounded-3xl border border-line bg-surface p-3 pr-2">
                {m.photoId && m.width && m.height ? (
                  <Photo
                    id={m.photoId}
                    width={m.width}
                    height={m.height}
                    alt={m.title}
                    thumb
                    sizes="64px"
                    className="size-16 shrink-0 rounded-2xl object-cover"
                  />
                ) : (
                  <span className="grid size-16 shrink-0 place-items-center rounded-2xl bg-bg-deep" aria-hidden="true">
                    <svg viewBox="0 0 24 24" className="size-7">
                      <circle cx="12" cy="13.5" r="7" fill="var(--pomegranate)" />
                      <path d="M9.5 7.2l1-2.4 1.5 1.6 1.5-1.6 1 2.4z" fill="var(--pomegranate)" />
                    </svg>
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-ink">{m.title}</p>
                  <p className="text-[14px] text-ink-faint">{formatLongDate(m.happenedOn)}</p>
                </div>
                <MilestoneMenu id={m.id} title={m.title} />
              </li>
            ))}
          </ol>
        </section>
      ) : null}
    </div>
  );
}
