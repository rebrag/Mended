import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { Mark } from "@/components/art/mark";
import { ShareLink } from "@/components/share-link";
import { ButtonLink, CenteredPage, Title } from "@/components/ui";
import { db } from "@/db";
import { getNow } from "@/lib/clock";
import { isPaired, requireHome } from "@/lib/dal";
import { getOrCreateInvite } from "@/lib/home";
import { appUrl } from "@/lib/mail";

export const metadata: Metadata = { title: "Invite" };

export default function InvitePage() {
  return (
    <CenteredPage>
      <Mark size={56} />
      <Suspense fallback={<div className="skeleton mt-6 h-[300px]" />}>
        <InviteContent />
      </Suspense>
    </CenteredPage>
  );
}

async function InviteContent() {
  const viewer = await requireHome("/invite");
  if (isPaired(viewer)) redirect("/");
  const invite = await getOrCreateInvite(db, viewer.home.id, viewer.user.id, await getNow());
  const url = appUrl(`/join/${invite.token}`);

  return (
    <div className="mt-4">
      <Title>Your home is ready</Title>
      <p className="mt-3 text-ink-soft">
        Send this link to your person, however feels right. It works once and opens a seat beside you.
      </p>
      <div className="mt-6">
        <ShareLink url={url} shareText={`I made a little place for the two of us.`} />
      </div>
      <ButtonLink href="/" variant="ghost" className="mt-6 w-full">
        Go to our courtyard
      </ButtonLink>
    </div>
  );
}
