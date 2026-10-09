import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { LoginForm } from "@/app/login/login-form";
import { Mark } from "@/components/art/mark";
import { ButtonLink, CenteredPage, Title } from "@/components/ui";
import { db } from "@/db";
import { getNow } from "@/lib/clock";
import { getViewer } from "@/lib/dal";
import { getInviteInfo } from "@/lib/home";
import { JoinForm } from "./join-form";

export const metadata: Metadata = { title: "You're invited" };

export default function JoinPage({ params }: PageProps<"/join/[token]">) {
  return (
    <CenteredPage>
      <Mark size={64} />
      <Suspense fallback={<div className="skeleton mt-6 h-[320px]" />}>
        <JoinContent params={params} />
      </Suspense>
    </CenteredPage>
  );
}

async function JoinContent({ params }: { params: PageProps<"/join/[token]">["params"] }) {
  const { token } = await params;
  const [info, viewer] = await Promise.all([getInviteInfo(db, token, await getNow()), getViewer()]);

  if (viewer?.home && info.status === "ok" && viewer.home.id === info.homeId) redirect("/");

  if (info.status === "invalid") {
    return (
      <div className="mt-4">
        <Title>This invite has closed</Title>
        <p className="mt-3 text-ink-soft">
          It may have expired or already been used. Ask for a fresh link and come right back.
        </p>
        {viewer?.home ? (
          <ButtonLink href="/" className="mt-6 w-full">
            Go to your courtyard
          </ButtonLink>
        ) : null}
      </div>
    );
  }

  const intro = (
    <>
      <Title className="mt-4">{info.inviterName} made a little place for the two of you</Title>
      <p className="mt-3 text-ink-soft">
        One small moment a day. Answer it together, and piece by piece a little clay vessel is mended with gold.
      </p>
    </>
  );

  if (!viewer) {
    return (
      <div>
        {intro}
        <div className="mt-8">
          <LoginForm next={`/join/${token}`} />
        </div>
      </div>
    );
  }

  if (viewer.home) {
    return (
      <div>
        {intro}
        <p className="mt-6 rounded-2xl bg-bg-deep p-4 text-ink-soft">
          You&apos;re already part of another home, so this invite can&apos;t be used from this account.
        </p>
      </div>
    );
  }

  return (
    <div>
      {intro}
      <div className="mt-8">
        <JoinForm token={token} defaultName={viewer.user.displayName ?? ""} />
      </div>
    </div>
  );
}
