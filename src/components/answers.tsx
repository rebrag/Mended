import { guessedRight, solvedClue, type Answer } from "@/lib/game/answers";
import type { Prompt } from "@/lib/game/prompts";

type Names = { me: string; partner: string };

export function MatchLine({
  prompt,
  mine,
  theirs,
  names,
}: {
  prompt: Prompt;
  mine: Answer | null;
  theirs: Answer | null;
  names: Names;
}) {
  if (!mine || !theirs) return null;
  let line: string | null = null;
  if (prompt.kind === "this_or_that" && "choice" in mine && "choice" in theirs && mine.choice === theirs.choice) {
    line = `You both picked ${prompt.options[mine.choice]}.`;
  } else if (prompt.kind === "guess_partner") {
    const iKnew = guessedRight(mine, theirs);
    const theyKnew = guessedRight(theirs, mine);
    line =
      iKnew && theyKnew
        ? "You read each other perfectly."
        : iKnew
          ? `You knew ${names.partner}'s answer.`
          : theyKnew
            ? `${names.partner} knew yours.`
            : "Something new learned about each other.";
  } else if (prompt.kind === "split_clue") {
    const solved = solvedClue(prompt, mine) || solvedClue(prompt, theirs);
    line = solved ? `Solved together: ${prompt.solution}.` : `The answer was ${prompt.solution}.`;
  }
  if (!line) return null;
  return (
    <p className="rounded-2xl bg-gold-soft px-4 py-3 text-center font-semibold text-ink" data-testid="match-line">
      {line}
    </p>
  );
}

export function AnswerBody({
  answer,
  prompt,
  self,
  names,
}: {
  answer: Answer;
  prompt: Prompt;
  self: boolean;
  names: Names;
}) {
  if (prompt.kind === "this_or_that" && "choice" in answer) {
    return (
      <div>
        <p className="font-serif text-[22px] text-ink">{prompt.options[answer.choice]}</p>
        {"note" in answer && answer.note ? (
          <p className="mt-1 whitespace-pre-wrap text-ink-soft">{answer.note}</p>
        ) : null}
      </div>
    );
  }
  if (prompt.kind === "guess_partner" && "guess" in answer) {
    const other = self ? names.partner : names.me;
    return (
      <div className="space-y-1">
        <p className="font-serif text-[22px] text-ink">{prompt.options[answer.choice]}</p>
        <p className="text-[15px] text-ink-soft">
          Guessed {other} would say <span className="font-semibold text-ink">{prompt.options[answer.guess]}</span>
        </p>
      </div>
    );
  }
  if ("text" in answer) {
    return <p className="font-serif text-[20px] leading-relaxed whitespace-pre-wrap text-ink">{answer.text}</p>;
  }
  return null;
}
