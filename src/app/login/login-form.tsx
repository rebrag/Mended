"use client";

import { useSearchParams } from "next/navigation";
import { useActionState } from "react";
import { requestLoginAction, type LoginState } from "@/app/actions/auth";
import { Button, Field, FormError, Input } from "@/components/ui";

export function LoginForm({ next: nextOverride }: { next?: string }) {
  const fromQuery = useSearchParams().get("next");
  const next = nextOverride ?? fromQuery ?? "/";
  const [state, action, pending] = useActionState<LoginState, FormData>(requestLoginAction, {
    status: "idle",
  });

  if (state.status === "sent") {
    return (
      <div className="rise-in space-y-2 rounded-3xl border border-line bg-surface p-6 shadow-card" role="status">
        <p className="font-serif text-[24px] text-ink">Check your email</p>
        <p className="text-ink-soft">
          We sent a link to <span className="font-semibold break-all text-ink">{state.email}</span>. Open it on this
          device to come in.
        </p>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="next" value={next} />
      <Field label="Your email">
        <Input
          type="email"
          name="email"
          autoComplete="email"
          inputMode="email"
          required
          placeholder="you@example.com"
        />
      </Field>
      <FormError message={state.status === "error" ? state.message : null} />
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Sending…" : "Send me a link"}
      </Button>
    </form>
  );
}
