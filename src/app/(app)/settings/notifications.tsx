"use client";

import { useEffect, useState } from "react";
import { removePushSubscriptionAction, savePushSubscriptionAction } from "@/app/actions/push";
import { Button } from "@/components/ui";

type Status = "loading" | "unsupported" | "needs-install" | "blocked" | "off" | "on";

function urlBase64ToUint8Array(base64: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const raw = atob((base64 + padding).replace(/-/g, "+").replace(/_/g, "/"));
  const out = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

function isIos() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

function isStandalone() {
  return window.matchMedia("(display-mode: standalone)").matches;
}

export function Notifications({ partner }: { partner: string }) {
  const [status, setStatus] = useState<Status>("loading");
  const [busy, setBusy] = useState(false);
  const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

  useEffect(() => {
    async function check() {
      if (!vapidKey || !("serviceWorker" in navigator) || !("PushManager" in window)) {
        // iOS only exposes push to apps added to the home screen.
        setStatus(isIos() && !isStandalone() ? "needs-install" : "unsupported");
        return;
      }
      if (Notification.permission === "denied") {
        setStatus("blocked");
        return;
      }
      const registration = await navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" });
      const subscription = await registration.pushManager.getSubscription();
      setStatus(subscription ? "on" : "off");
    }
    check().catch(() => setStatus("unsupported"));
  }, [vapidKey]);

  async function enable() {
    setBusy(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setStatus(permission === "denied" ? "blocked" : "off");
        return;
      }
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey!),
      });
      const result = await savePushSubscriptionAction(subscription.toJSON());
      setStatus(result.ok ? "on" : "off");
    } finally {
      setBusy(false);
    }
  }

  async function disable() {
    setBusy(true);
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        await removePushSubscriptionAction(subscription.endpoint);
        await subscription.unsubscribe();
      }
      setStatus("off");
    } finally {
      setBusy(false);
    }
  }

  const description: Record<Status, string> = {
    loading: "Checking this device…",
    unsupported: "This browser can't show notifications.",
    "needs-install":
      "On iPhone, add Mended to your home screen first (Share, then Add to Home Screen), then open it from there.",
    blocked: "Notifications are blocked for this site in your browser settings.",
    off: `Get a gentle nudge when ${partner} answers.`,
    on: `You'll hear when ${partner} answers.`,
  };

  return (
    <div className="space-y-3">
      <p className="text-ink-soft">{description[status]}</p>
      {status === "off" ? (
        <Button type="button" variant="secondary" onClick={enable} disabled={busy} className="w-full">
          Turn on notifications
        </Button>
      ) : status === "on" ? (
        <Button type="button" variant="ghost" onClick={disable} disabled={busy} className="w-full">
          Turn off on this device
        </Button>
      ) : null}
    </div>
  );
}
