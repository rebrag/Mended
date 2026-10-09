import "server-only";
import { redirect } from "next/navigation";
import { cache } from "react";
import { db } from "@/db";
import { getSessionUser, type SessionUser } from "@/lib/auth/session";
import { getMembers, getMembership, type Member } from "@/lib/home";
import type { HomeRow } from "@/lib/game/rounds";

export type Viewer = {
  user: SessionUser;
  home: HomeRow | null;
  members: Member[];
  partner: Member | null;
};

export type HomeViewer = Viewer & { home: HomeRow };
export type PairedViewer = HomeViewer & { partner: Member };

/** The signed-in person and their home, read once per request. */
export const getViewer = cache(async (): Promise<Viewer | null> => {
  const user = await getSessionUser();
  if (!user) return null;
  const home = await getMembership(db, user.id);
  const members = home ? await getMembers(db, home.id) : [];
  const partner = members.find((m) => m.id !== user.id) ?? null;
  return { user, home, members, partner };
});

export async function requireViewer(next = "/"): Promise<Viewer> {
  const viewer = await getViewer();
  if (!viewer) redirect(`/login?next=${encodeURIComponent(next)}`);
  return viewer;
}

export async function requireHome(next = "/"): Promise<HomeViewer> {
  const viewer = await requireViewer(next);
  if (!viewer.home) redirect("/welcome");
  return viewer as HomeViewer;
}

export function isPaired(viewer: HomeViewer): viewer is PairedViewer {
  return viewer.partner !== null;
}

export function memberIds(viewer: PairedViewer): [string, string] {
  return [viewer.members[0].id, viewer.members[1].id];
}

export function myName(viewer: Viewer): string {
  return viewer.user.displayName ?? "you";
}
