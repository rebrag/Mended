import type { Metadata } from "next";
import { Suspense } from "react";
import { Mark } from "@/components/art/mark";
import { CenteredPage } from "@/components/ui";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Come in" };

export default function LoginPage() {
  return (
    <CenteredPage>
      <div className="mb-10 flex flex-col items-center text-center">
        <Mark size={76} />
        <h1 className="mt-5 font-serif text-[42px] leading-none font-medium text-ink">Mended</h1>
        <p className="mt-3 max-w-[18rem] text-ink-soft">
          A small daily ritual for two. One moment a day, one piece at a time.
        </p>
      </div>
      <Suspense fallback={<div className="skeleton h-[136px]" />}>
        <LoginForm />
      </Suspense>
    </CenteredPage>
  );
}
