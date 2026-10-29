import type { CSSProperties } from "react";
import { AnswerBody, MatchLine } from "@/components/answers";
import { Card, cx } from "@/components/ui";
import type { PastMoment } from "@/lib/game/history";
import { formatRoundDate, kindLabel } from "@/lib/game/labels";
import { renderPromptText } from "@/lib/game/prompts";

export type MomentNames = { me: string; partner: string; daughter: string | null };

/** One past moment: the prompt, how the answers lined up, and what each of you said. */
export function MomentCard({
  moment,
  names,
  viewerId,
  partnerId,
  eyebrow,
  id,
  className,
  style,
}: {
  moment: PastMoment;
  names: MomentNames;
  viewerId: string;
  partnerId: string | null;
  /** Replaces the default "Piece n · date" line. */
  eyebrow?: string;
  id?: string;
  className?: string;
  style?: CSSProperties;
}) {
  const mine = moment.answers[viewerId] ?? null;
  const theirs = partnerId ? (moment.answers[partnerId] ?? null) : null;
  return (
    <Card id={id} className={cx("scroll-mt-4 target:border-gold", className)} style={style}>
      <p className="text-[13px] font-semibold tracking-[0.12em] text-gold uppercase">
        {eyebrow ?? `Piece ${moment.shardIndex + 1} · ${formatRoundDate(moment.localDate)}`}
      </p>
      <p className="mt-0.5 text-[13px] text-ink-faint">{kindLabel(moment.prompt.kind, names)}</p>
      <p className="mt-1.5 font-serif text-[20px] leading-snug text-ink">
        {renderPromptText(moment.prompt.text, { partner: names.partner, daughter: names.daughter })}
      </p>
      <div className="mt-3 empty:hidden">
        <MatchLine prompt={moment.prompt} mine={mine} theirs={theirs} names={names} />
      </div>
      <dl className="mt-3 space-y-3 border-t border-line pt-3">
        {[
          { who: names.me, answer: mine, self: true },
          { who: names.partner, answer: theirs, self: false },
        ].map(({ who, answer, self }) => (
          <div key={self ? "me" : "partner"}>
            <dt className="text-[13px] font-semibold tracking-[0.12em] text-ink-faint uppercase">{who}</dt>
            <dd className="mt-1">
              {answer ? <AnswerBody answer={answer} prompt={moment.prompt} self={self} names={names} /> : null}
            </dd>
          </div>
        ))}
      </dl>
    </Card>
  );
}
