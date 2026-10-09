"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useState, useSyncExternalStore } from "react";
import { submitAnswerAction, type AnswerState } from "@/app/actions/moment";
import { VesselArt } from "@/components/art/vessel-art";
import { Button, ButtonLink, Card, FormError, Textarea, cx } from "@/components/ui";
import { AnswerBody, MatchLine } from "@/components/answers";
import { MAX_ANSWER_LENGTH, type Answer } from "@/lib/game/answers";
import type { Prompt } from "@/lib/game/prompts";
import type { RoundView } from "@/lib/game/rounds";
import { SCENE_FRAME, SHARDS_PER_VESSEL, VESSEL_NAMES, type VesselShape } from "@/lib/game/vessel-shapes";

type Names = { me: string; partner: string; daughter: string | null };
type VesselInfo = { id: string; shape: VesselShape; mended: number; position: number };

const SEEN_PREFIX = "mended:seen:";
const noopSubscribe = () => () => {};

function readSeen(roundId: string): boolean {
  try {
    return localStorage.getItem(SEEN_PREFIX + roundId) === "1";
  } catch {
    return true;
  }
}

function markSeen(roundId: string) {
  try {
    localStorage.setItem(SEEN_PREFIX + roundId, "1");
  } catch {
    // Storage unavailable; the animation simply plays again next time.
  }
}

export function MomentView({
  view,
  promptText,
  names,
  vessel,
}: {
  view: RoundView;
  promptText: string;
  names: Names;
  vessel: VesselInfo;
}) {
  const [editing, setEditing] = useState(false);
  const answered = view.myAnswer !== null;
  const showForm = !view.completed && (!answered || editing);

  return (
    <div className="space-y-5">
      <h1 className="font-serif text-[28px] leading-[1.2] font-medium text-balance text-ink" data-testid="prompt">
        {promptText}
      </h1>

      {view.completed ? (
        <Reveal view={view} names={names} vessel={vessel} />
      ) : showForm ? (
        <>
          {view.partnerAnswered && !answered ? (
            <p className="rounded-2xl bg-gold-soft px-4 py-3 text-[15px] text-ink">
              {names.partner} already answered. You&apos;ll see each other&apos;s once yours is in.
            </p>
          ) : null}
          <AnswerForm
            key={editing ? "edit" : "new"}
            view={view}
            names={names}
            initial={view.myAnswer}
            onSaved={() => setEditing(false)}
            onCancel={answered ? () => setEditing(false) : undefined}
          />
          <VesselProgress vessel={vessel} />
        </>
      ) : (
        <Waiting view={view} names={names} vessel={vessel} onEdit={() => setEditing(true)} />
      )}
    </div>
  );
}

function VesselProgress({ vessel }: { vessel: VesselInfo }) {
  return (
    <div className="flex items-center gap-4 rounded-3xl border border-line bg-surface px-4 py-3">
      <VesselArt shape={vessel.shape} seed={vessel.id} mended={vessel.mended} className="size-16 shrink-0" compact />
      <p className="text-[15px] text-ink-soft">
        When you both answer, piece {Math.min(vessel.mended + 1, SHARDS_PER_VESSEL)} of {SHARDS_PER_VESSEL} of your{" "}
        {VESSEL_NAMES[vessel.shape].toLowerCase()} is mended.
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Answer forms                                                        */
/* ------------------------------------------------------------------ */

function AnswerForm({
  view,
  names,
  initial,
  onSaved,
  onCancel,
}: {
  view: RoundView;
  names: Names;
  initial: Answer | null;
  onSaved: () => void;
  onCancel?: () => void;
}) {
  const [state, action, pending] = useActionState<AnswerState, FormData>(
    async (prev, formData) => {
      const result = await submitAnswerAction(prev, formData);
      if (result.status === "saved") onSaved();
      return result;
    },
    { status: "idle" },
  );

  const prompt = view.prompt;
  return (
    <form action={action} className="space-y-4" data-testid="answer-form">
      <input type="hidden" name="roundId" value={view.roundId} />
      {prompt.kind === "this_or_that" ? (
        <ThisOrThatFields prompt={prompt} initial={initial} />
      ) : prompt.kind === "guess_partner" ? (
        <GuessFields prompt={prompt} initial={initial} partner={names.partner} />
      ) : prompt.kind === "split_clue" ? (
        <ClueFields prompt={prompt} seat={view.seat} partner={names.partner} initial={initial} />
      ) : (
        <TextField initial={initial} />
      )}
      <FormError message={state.status === "error" ? state.message : null} />
      <div className="flex gap-3">
        {onCancel ? (
          <Button type="button" variant="secondary" onClick={onCancel} className="flex-1">
            Keep the old one
          </Button>
        ) : null}
        <Button type="submit" disabled={pending} className="flex-1">
          {pending ? "Saving…" : onCancel ? "Save" : "Share my answer"}
        </Button>
      </div>
    </form>
  );
}

function TextField({
  initial,
  placeholder = "Write as much or as little as you like…",
}: {
  initial: Answer | null;
  placeholder?: string;
}) {
  const [value, setValue] = useState(initial && "text" in initial ? initial.text : "");
  return (
    <div>
      <Textarea
        name="text"
        aria-label="Your answer"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        maxLength={MAX_ANSWER_LENGTH}
        placeholder={placeholder}
        required
        rows={4}
      />
      {value.length > MAX_ANSWER_LENGTH - 100 ? (
        <p className="mt-1 text-right text-[13px] text-ink-faint">{MAX_ANSWER_LENGTH - value.length} left</p>
      ) : null}
    </div>
  );
}

function OptionCard({
  name,
  value,
  label,
  defaultChecked,
  large = false,
}: {
  name: string;
  value: number;
  label: string;
  defaultChecked: boolean;
  large?: boolean;
}) {
  return (
    <label
      className={cx(
        "flex cursor-pointer items-center justify-center rounded-2xl border-2 border-line bg-surface px-4 text-center font-semibold text-ink transition-colors",
        "has-checked:border-gold has-checked:bg-gold-soft has-focus-visible:ring-2 has-focus-visible:ring-gold/40",
        large ? "min-h-24 text-[19px] font-serif font-medium" : "min-h-14 text-[16px]",
      )}
    >
      <input type="radio" name={name} value={value} defaultChecked={defaultChecked} required className="sr-only" />
      {label}
    </label>
  );
}

function ThisOrThatFields({
  prompt,
  initial,
}: {
  prompt: Extract<Prompt, { kind: "this_or_that" }>;
  initial: Answer | null;
}) {
  const choice = initial && "choice" in initial ? initial.choice : null;
  const note = initial && "note" in initial ? (initial.note ?? "") : "";
  return (
    <>
      <fieldset>
        <legend className="sr-only">{prompt.text}</legend>
        <div className="grid grid-cols-2 gap-3">
          {prompt.options.map((option, i) => (
            <OptionCard key={option} name="choice" value={i} label={option} defaultChecked={choice === i} large />
          ))}
        </div>
      </fieldset>
      <Textarea
        name="note"
        aria-label="Why? (optional)"
        defaultValue={note}
        placeholder="Why? (optional)"
        maxLength={MAX_ANSWER_LENGTH}
        rows={2}
        className="min-h-20"
      />
    </>
  );
}

function GuessFields({
  prompt,
  initial,
  partner,
}: {
  prompt: Extract<Prompt, { kind: "guess_partner" }>;
  initial: Answer | null;
  partner: string;
}) {
  const choice = initial && "choice" in initial ? initial.choice : null;
  const guess = initial && "guess" in initial ? initial.guess : null;
  return (
    <>
      <fieldset className="space-y-2.5">
        <legend className="mb-2.5 text-[15px] font-semibold text-ink">Your own answer</legend>
        <div className="grid grid-cols-2 gap-2.5">
          {prompt.options.map((option, i) => (
            <OptionCard key={option} name="choice" value={i} label={option} defaultChecked={choice === i} />
          ))}
        </div>
      </fieldset>
      <fieldset className="space-y-2.5">
        <legend className="mb-2.5 text-[15px] font-semibold text-ink">Your guess for {partner}</legend>
        <div className="grid grid-cols-2 gap-2.5">
          {prompt.options.map((option, i) => (
            <OptionCard key={option} name="guess" value={i} label={option} defaultChecked={guess === i} />
          ))}
        </div>
      </fieldset>
    </>
  );
}

function ClueFields({
  prompt,
  seat,
  partner,
  initial,
}: {
  prompt: Extract<Prompt, { kind: "split_clue" }>;
  seat: 0 | 1;
  partner: string;
  initial: Answer | null;
}) {
  return (
    <>
      <div className="rounded-3xl border border-gold/40 bg-gold-soft p-5">
        <p className="text-[13px] font-semibold tracking-[0.12em] text-gold uppercase">Your half</p>
        <p className="mt-1.5 font-serif text-[21px] leading-snug text-ink" data-testid="my-clue">
          {prompt.clues[seat]}
        </p>
      </div>
      <p className="text-[15px] text-ink-soft">
        {partner} has the other half. Share yours however you like (a text, a call, out loud across the room), then both
        answer.
      </p>
      <TextField initial={initial} placeholder="What are we?" />
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Waiting                                                             */
/* ------------------------------------------------------------------ */

function Waiting({
  view,
  names,
  vessel,
  onEdit,
}: {
  view: RoundView;
  names: Names;
  vessel: VesselInfo;
  onEdit: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    let stopped = false;
    async function check() {
      try {
        const res = await fetch(`/api/moment/status?round=${encodeURIComponent(view.roundId)}`, { cache: "no-store" });
        if (!res.ok || stopped) return;
        const status = (await res.json()) as { completed: boolean };
        if (status.completed) router.refresh();
      } catch {
        // Offline for a moment; try again on the next tick.
      }
    }
    const interval = setInterval(check, 10_000);
    const onVisible = () => document.visibilityState === "visible" && check();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      stopped = true;
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [router, view.roundId]);

  return (
    <div className="space-y-4" data-testid="waiting">
      <Card>
        <p className="text-[13px] font-semibold tracking-[0.12em] text-ink-faint uppercase">Your answer</p>
        <div className="mt-2">
          <AnswerBody answer={view.myAnswer!} prompt={view.prompt} self names={names} />
        </div>
        <button
          type="button"
          onClick={onEdit}
          className="mt-3 -ml-1 rounded-full px-1 font-semibold text-primary underline-offset-4 hover:underline"
        >
          Change it
        </button>
      </Card>
      <div className="flex items-center gap-4 rounded-3xl border border-dashed border-line-strong px-4 py-4">
        <VesselArt shape={vessel.shape} seed={vessel.id} mended={vessel.mended} className="size-16 shrink-0" compact />
        <div>
          <p className="font-semibold text-ink">Tucked away until {names.partner} answers</p>
          <p className="text-[15px] text-ink-soft">No rush. It&apos;ll be right here whenever they get to it.</p>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Reveal                                                              */
/* ------------------------------------------------------------------ */

function Reveal({ view, names, vessel }: { view: RoundView; names: Names; vessel: VesselInfo }) {
  // Animate the newly mended piece only the first time this person sees the reveal on this device.
  // The server can't know, so the vessel renders once the browser has checked.
  const seenNow = useSyncExternalStore(
    noopSubscribe,
    () => readSeen(view.roundId),
    () => null,
  );
  const [seen, setSeen] = useState<boolean | null>(null);
  if (seen === null && seenNow !== null) setSeen(seenNow);
  useEffect(() => {
    if (seen !== null) markSeen(view.roundId);
  }, [seen, view.roundId]);
  const justMended = seen === false ? view.shardIndex : null;

  // The vessel as it was right after this round (later rounds of a finished vessel never exist).
  const mendedAfter = view.shardIndex !== null ? view.shardIndex + 1 : vessel.mended;
  const whole = mendedAfter >= SHARDS_PER_VESSEL;

  return (
    <div className="space-y-5" data-testid="reveal">
      <div
        className="relative mx-auto w-[min(66vw,240px)]"
        style={{ aspectRatio: `${SCENE_FRAME.width} / ${SCENE_FRAME.height}` }}
      >
        {seen !== null ? (
          <VesselArt
            shape={vessel.shape}
            seed={vessel.id}
            mended={mendedAfter}
            justMended={justMended}
            frame="scene"
            className="h-full w-full"
          />
        ) : null}
      </div>
      <p className="-mt-2 text-center text-[15px] font-semibold text-gold" data-testid="mended-count">
        {whole
          ? `The ${VESSEL_NAMES[vessel.shape].toLowerCase()} is whole`
          : `Piece ${mendedAfter} of ${SHARDS_PER_VESSEL} mended`}
      </p>

      <MatchLine prompt={view.prompt} mine={view.myAnswer} theirs={view.partnerAnswer} names={names} />

      <div className="space-y-3">
        <AnswerCard who={names.me} answer={view.myAnswer} prompt={view.prompt} names={names} self />
        <AnswerCard who={names.partner} answer={view.partnerAnswer} prompt={view.prompt} names={names} self={false} />
      </div>

      {whole ? (
        <Card className="border-gold/40 text-center">
          <p className="font-serif text-[22px] text-ink">Eighteen moments, held together with gold.</p>
          <p className="mt-1.5 text-ink-soft">Choose a photo to keep inside it on your shelf.</p>
          <ButtonLink href={`/shelf/${vessel.id}`} className="mt-4 w-full">
            Place it on the shelf
          </ButtonLink>
        </Card>
      ) : (
        <p className="text-center text-[15px] text-ink-faint">A new moment opens tomorrow.</p>
      )}
      <p className="text-center">
        <Link
          href={`/shelf/${vessel.id}`}
          className="text-[15px] font-semibold text-primary underline-offset-4 hover:underline"
        >
          Look back at this {VESSEL_NAMES[vessel.shape].toLowerCase()}&apos;s moments
        </Link>
      </p>
    </div>
  );
}

function AnswerCard({
  who,
  answer,
  prompt,
  names,
  self,
}: {
  who: string;
  answer: Answer | null;
  prompt: Prompt;
  names: Names;
  self: boolean;
}) {
  return (
    <Card className={cx("rise-in", !self && "[animation-delay:200ms]")}>
      <p className="text-[13px] font-semibold tracking-[0.12em] text-ink-faint uppercase">{who}</p>
      <div className="mt-2">
        {answer ? <AnswerBody answer={answer} prompt={prompt} self={self} names={names} /> : null}
      </div>
    </Card>
  );
}
