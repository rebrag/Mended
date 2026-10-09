"use client";

import { useActionState } from "react";
import { updateSettingsAction, type FormState } from "@/app/actions/home";
import { Button, Field, FormError, Input, inputClass } from "@/components/ui";

export type SettingsValues = {
  displayName: string;
  homeName: string;
  daughterName: string;
  daughterBirthdate: string;
  timezone: string;
};

export function SettingsForm({ values, timezones }: { values: SettingsValues; timezones: string[] }) {
  const [state, action, pending] = useActionState<FormState, FormData>(updateSettingsAction, { status: "idle" });
  return (
    <form action={action} className="space-y-4">
      <Field label="Your name">
        <Input name="displayName" required maxLength={40} defaultValue={values.displayName} autoComplete="given-name" />
      </Field>
      <Field label="Your home">
        <Input name="homeName" required maxLength={40} defaultValue={values.homeName} />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Her name">
          <Input name="daughterName" maxLength={40} defaultValue={values.daughterName} />
        </Field>
        <Field label="Her birthday">
          <Input name="daughterBirthdate" type="date" defaultValue={values.daughterBirthdate} />
        </Field>
      </div>
      <Field label="Timezone" hint="A new moment opens after midnight here.">
        <select name="timezone" defaultValue={values.timezone} className={inputClass}>
          {timezones.map((tz) => (
            <option key={tz} value={tz}>
              {tz.replaceAll("_", " ")}
            </option>
          ))}
        </select>
      </Field>
      <FormError message={state.status === "error" ? state.message : null} />
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Saving…" : state.status === "saved" ? "Saved" : "Save"}
      </Button>
    </form>
  );
}
