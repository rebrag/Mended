"use client";

import { useActionState } from "react";
import { acceptInviteAction, type FormState } from "@/app/actions/home";
import { Button, Field, FormError, Input } from "@/components/ui";

export function JoinForm({ token, defaultName }: { token: string; defaultName: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(acceptInviteAction, { status: "idle" });

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="token" value={token} />
      <Field label="What should we call you?">
        <Input
          name="displayName"
          autoComplete="given-name"
          required
          maxLength={40}
          defaultValue={defaultName}
          placeholder="Your first name"
        />
      </Field>
      <FormError message={state.status === "error" ? state.message : null} />
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Opening the door…" : "Come in"}
      </Button>
    </form>
  );
}
