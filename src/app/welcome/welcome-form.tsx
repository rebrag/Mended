"use client";

import { useActionState } from "react";
import { createHomeAction, type FormState } from "@/app/actions/home";
import { TimezoneInput } from "@/components/timezone-input";
import { Button, Field, FormError, Input } from "@/components/ui";

export function WelcomeForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(createHomeAction, { status: "idle" });

  return (
    <form action={action} className="space-y-5">
      <TimezoneInput />
      <Field label="What should we call you?">
        <Input name="displayName" autoComplete="given-name" required maxLength={40} placeholder="Your first name" />
      </Field>
      <Field label="Name your home" hint="Just for the two of you. You can change it later.">
        <Input name="homeName" required maxLength={40} defaultValue="Our home" />
      </Field>

      <fieldset className="space-y-4 rounded-3xl border border-line bg-surface p-5">
        <legend className="px-2 text-[15px] font-semibold text-ink">Your little one</legend>
        <p className="-mt-1 text-[15px] text-ink-soft">
          A young pomegranate tree grows in your courtyard alongside her.
        </p>
        <Field label="Her name">
          <Input name="daughterName" maxLength={40} placeholder="Optional" />
        </Field>
        <Field label="Her birthday">
          <Input name="daughterBirthdate" type="date" />
        </Field>
      </fieldset>

      <FormError message={state.status === "error" ? state.message : null} />
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Setting the table…" : "Make our home"}
      </Button>
    </form>
  );
}
