"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useActionState } from "react";
import { verifyLoginAction, type VerifyState } from "@/app/actions/auth";
import { Button, FormError } from "@/components/ui";

export function VerifyForm() {
  const token = useSearchParams().get("token") ?? "";
  const [state, action, pending] = useActionState<VerifyState, FormData>(verifyLoginAction, {
    status: "idle",
  });

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="token" value={token} />
      <FormError message={state.status === "error" ? state.message : null} />
      {state.status === "error" ? (
        <Link href="/login" className="block text-center font-semibold text-primary underline-offset-4 hover:underline">
          Get a new link
        </Link>
      ) : (
        <Button type="submit" disabled={pending || !token} className="w-full">
          {pending ? "Opening…" : "Come in"}
        </Button>
      )}
    </form>
  );
}
