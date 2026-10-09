import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { Mark } from "@/components/art/mark";
import { CenteredPage, Title } from "@/components/ui";
import { requireViewer } from "@/lib/dal";
import { WelcomeForm } from "./welcome-form";

export const metadata: Metadata = { title: "Welcome" };

export default function WelcomePage() {
  return (
    <CenteredPage>
      <div className="mb-8">
        <Mark size={56} />
        <Title className="mt-4">Let&apos;s make a little place for two</Title>
        <p className="mt-3 text-ink-soft">
          Each day brings one small moment to share. Answer it together and a piece of your vessel is mended with gold.
        </p>
      </div>
      <Suspense fallback={<div className="skeleton h-[520px]" />}>
        <WelcomeGate />
      </Suspense>
    </CenteredPage>
  );
}

async function WelcomeGate() {
  const viewer = await requireViewer("/welcome");
  if (viewer.home) redirect("/");
  return <WelcomeForm />;
}
