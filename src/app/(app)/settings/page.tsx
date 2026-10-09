import type { Metadata } from "next";
import { Suspense, type ReactNode } from "react";
import { signOutAction } from "@/app/actions/auth";
import { BackLink, PageHeader } from "@/components/page-header";
import { ShareLink } from "@/components/share-link";
import { Button } from "@/components/ui";
import { db } from "@/db";
import { getNow } from "@/lib/clock";
import { isPaired, requireHome } from "@/lib/dal";
import { getOrCreateInvite } from "@/lib/home";
import { appUrl } from "@/lib/mail";
import { Notifications } from "./notifications";
import { SettingsForm } from "./settings-form";
import { ThemePicker } from "./theme-picker";

export const metadata: Metadata = { title: "Settings" };

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-3xl border border-line bg-surface p-5">
      <h2 className="mb-4 font-serif text-[21px] font-medium text-ink">{title}</h2>
      {children}
    </section>
  );
}

export default function SettingsPage() {
  return (
    <div>
      <BackLink href="/" label="Courtyard" />
      <PageHeader title="Settings" />
      <div className="space-y-4">
        <Suspense fallback={<div className="skeleton h-[480px] rounded-3xl" />}>
          <SettingsContent />
        </Suspense>
        <Section title="Appearance">
          <ThemePicker />
        </Section>
      </div>
    </div>
  );
}

async function SettingsContent() {
  const viewer = await requireHome("/settings");
  const { home } = viewer;
  const timezones = Intl.supportedValuesOf("timeZone");
  if (!timezones.includes(home.timezone)) timezones.unshift(home.timezone);
  const invite = isPaired(viewer) ? null : await getOrCreateInvite(db, home.id, viewer.user.id, await getNow());

  return (
    <>
      {invite ? (
        <Section title="Invite your person">
          <ShareLink url={appUrl(`/join/${invite.token}`)} shareText="I made a little place for the two of us." />
        </Section>
      ) : null}
      <Section title="The two of you">
        <SettingsForm
          values={{
            displayName: viewer.user.displayName ?? "",
            homeName: home.name,
            daughterName: home.daughterName ?? "",
            daughterBirthdate: home.daughterBirthdate ?? "",
            timezone: home.timezone,
          }}
          timezones={timezones}
        />
      </Section>
      <Section title="Notifications">
        <Notifications partner={viewer.partner?.displayName ?? "your person"} />
      </Section>
      <Section title="Account">
        <p className="mb-3 text-ink-soft">
          Signed in as <span className="font-semibold break-all text-ink">{viewer.user.email}</span>
        </p>
        <form action={signOutAction}>
          <Button type="submit" variant="secondary" className="w-full">
            Sign out
          </Button>
        </form>
      </Section>
    </>
  );
}
