"use client";

import { useSyncExternalStore } from "react";

const subscribe = () => () => {};
const detect = () => Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";

/** Hidden field carrying the browser's timezone, so days turn over at local midnight. */
export function TimezoneInput({ name = "timezone" }: { name?: string }) {
  const timezone = useSyncExternalStore(subscribe, detect, () => "UTC");
  return <input type="hidden" name={name} value={timezone} />;
}
