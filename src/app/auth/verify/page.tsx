import type { Metadata } from "next";
import { Suspense } from "react";
import { Mark } from "@/components/art/mark";
import { CenteredPage } from "@/components/ui";
import { VerifyForm } from "./verify-form";

export const metadata: Metadata = { title: "Come in" };

/**
 * The emailed link lands here and the visitor confirms with a tap.
 * Consuming the token on a button press (not on page load) keeps email link scanners from using it up.
 */
export default function VerifyPage() {
  return (
    <CenteredPage>
      <div className="mb-8 flex flex-col items-center text-center">
        <Mark size={68} />
        <h1 className="mt-5 font-serif text-[34px] leading-tight font-medium text-ink">Welcome in</h1>
      </div>
      <Suspense fallback={<div className="skeleton h-12" />}>
        <VerifyForm />
      </Suspense>
    </CenteredPage>
  );
}
