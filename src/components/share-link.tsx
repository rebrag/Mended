"use client";

import { useState, useSyncExternalStore } from "react";
import { Button } from "@/components/ui";

const subscribe = () => () => {};

export function ShareLink({ url, shareText }: { url: string; shareText: string }) {
  const [copied, setCopied] = useState(false);
  const canShare = useSyncExternalStore(
    subscribe,
    () => typeof navigator.share === "function",
    () => false,
  );

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  async function share() {
    try {
      await navigator.share({ text: shareText, url });
    } catch {
      // The person closed the share sheet.
    }
  }

  return (
    <div className="space-y-3">
      <div
        className="rounded-2xl border border-dashed border-line-strong bg-surface-raised px-4 py-3 font-mono text-[14px] break-all text-ink-soft select-all"
        data-testid="invite-link"
      >
        {url}
      </div>
      <div className="flex gap-3">
        <Button type="button" variant={canShare ? "secondary" : "primary"} onClick={copy} className="flex-1">
          {copied ? "Copied" : "Copy link"}
        </Button>
        {canShare ? (
          <Button type="button" onClick={share} className="flex-1">
            Share
          </Button>
        ) : null}
      </div>
    </div>
  );
}
