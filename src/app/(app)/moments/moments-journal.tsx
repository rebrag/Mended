"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { MomentCard, type MomentNames } from "@/components/moment-card";
import { Button, cx, inputClass } from "@/components/ui";
import type { JournalMoment } from "@/lib/game/history";
import { formatRoundDate, kindLabel } from "@/lib/game/labels";
import { renderPromptText } from "@/lib/game/prompts";
import { VESSEL_NAMES } from "@/lib/game/vessel-shapes";

const PAGE = 30;

function monthOf(localDate: string): string {
  return new Date(`${localDate}T12:00:00Z`).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

function answerText(moment: JournalMoment): string {
  return Object.values(moment.answers)
    .flatMap((a) => {
      const parts: string[] = [];
      if ("text" in a) parts.push(a.text);
      if ("note" in a && a.note) parts.push(a.note);
      if ("choice" in a && moment.prompt.kind !== "split_clue" && "options" in moment.prompt) {
        parts.push(moment.prompt.options[a.choice] ?? "");
      }
      return parts;
    })
    .join(" ");
}

/** Every past moment, newest first, with a search box and one chip per vessel. */
export function MomentsJournal({
  moments,
  names,
  viewerId,
  partnerId,
}: {
  moments: JournalMoment[];
  names: MomentNames;
  viewerId: string;
  partnerId: string | null;
}) {
  const [query, setQuery] = useState("");
  const [vesselId, setVesselId] = useState<string | null>(null);
  const [shown, setShown] = useState(PAGE);

  const vessels = useMemo(() => {
    const seen = new Map<string, JournalMoment["vessel"]>();
    for (const m of moments) if (!seen.has(m.vessel.id)) seen.set(m.vessel.id, m.vessel);
    return [...seen.values()];
  }, [moments]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return moments.filter((m) => {
      if (vesselId && m.vessel.id !== vesselId) return false;
      if (!q) return true;
      const prompt = renderPromptText(m.prompt.text, { partner: names.partner, daughter: names.daughter });
      const haystack = `${prompt} ${answerText(m)} ${kindLabel(m.prompt.kind, names)} ${formatRoundDate(m.localDate)}`;
      return haystack.toLowerCase().includes(q);
    });
  }, [moments, query, vesselId, names]);

  // A deep link (/moments#round-…) must render that card even when it sits past the first page.
  const pendingHash = useRef<string | null>(null);
  useEffect(() => {
    const hash = window.location.hash;
    if (!hash.startsWith("#round-")) return;
    const index = moments.findIndex((m) => `#round-${m.roundId}` === hash);
    pendingHash.current = hash.slice(1);
    const frame = requestAnimationFrame(() => {
      setShown((n) => (index >= n ? Math.ceil((index + 1) / PAGE) * PAGE : n));
    });
    return () => cancelAnimationFrame(frame);
  }, [moments]);
  useEffect(() => {
    const target = pendingHash.current;
    if (!target) return;
    const el = document.getElementById(target);
    if (!el) return;
    pendingHash.current = null;
    el.scrollIntoView({ block: "start", behavior: "smooth" });
  }, [shown]);

  const visible = filtered.slice(0, shown);

  return (
    <div className="space-y-4" data-testid="moments-journal">
      <input
        type="search"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setShown(PAGE);
        }}
        placeholder="Find a question or an answer…"
        aria-label="Search past moments"
        className={cx(inputClass, "rounded-full")}
      />

      {vessels.length > 1 ? (
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1" role="group" aria-label="Filter by vessel">
          <Chip active={vesselId === null} onClick={() => setVesselId(null)}>
            All
          </Chip>
          {vessels.map((v) => (
            <Chip key={v.id} active={vesselId === v.id} onClick={() => setVesselId(vesselId === v.id ? null : v.id)}>
              {VESSEL_NAMES[v.shape]} {v.position + 1}
            </Chip>
          ))}
        </div>
      ) : null}

      <p className="text-[14px] text-ink-faint">
        {filtered.length === moments.length
          ? `${moments.length} ${moments.length === 1 ? "moment" : "moments"} so far`
          : `${filtered.length} of ${moments.length} moments`}
      </p>

      {visible.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-line-strong px-6 py-10 text-center">
          <p className="font-serif text-[20px] text-ink">Nothing matches that</p>
          <p className="mt-1 text-ink-soft">Try a different word, or clear the search.</p>
        </div>
      ) : (
        <ol className="space-y-3">
          {visible.map((m, i) => {
            const month = monthOf(m.localDate);
            const heading = i === 0 || monthOf(visible[i - 1].localDate) !== month ? month : null;
            return (
              <li key={m.roundId} className="space-y-3">
                {heading ? (
                  <h2 className="pt-2 text-[13px] font-semibold tracking-[0.12em] text-ink-faint uppercase">
                    {heading}
                  </h2>
                ) : null}
                <MomentCard
                  id={`round-${m.roundId}`}
                  moment={m}
                  names={names}
                  viewerId={viewerId}
                  partnerId={partnerId}
                  eyebrow={`${formatRoundDate(m.localDate)} · ${VESSEL_NAMES[m.vessel.shape]} ${m.vessel.position + 1}, piece ${m.shardIndex + 1}`}
                  className="rise-in"
                  style={{ animationDelay: `${Math.min(i % PAGE, 8) * 50}ms` }}
                />
              </li>
            );
          })}
        </ol>
      )}

      {filtered.length > shown ? (
        <Button variant="secondary" className="w-full" onClick={() => setShown((n) => n + PAGE)}>
          Show earlier moments
        </Button>
      ) : null}
    </div>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cx(
        "shrink-0 rounded-full border px-3.5 py-1.5 text-[14px] font-semibold whitespace-nowrap transition-colors",
        active
          ? "border-gold bg-gold-soft text-ink"
          : "border-line-strong bg-surface text-ink-soft hover:bg-surface-raised hover:text-ink",
      )}
    >
      {children}
    </button>
  );
}
