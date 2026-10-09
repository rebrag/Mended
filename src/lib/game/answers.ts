import { z } from "zod";
import { normalizeGuess, type Prompt } from "./prompts";

export const MAX_ANSWER_LENGTH = 600;

const text = z.string().trim().min(1, "Write a little something first").max(MAX_ANSWER_LENGTH);
const optionalText = z.string().trim().max(MAX_ANSWER_LENGTH).optional();

export type TextAnswer = { text: string };
export type ChoiceAnswer = { choice: number; note?: string };
export type GuessAnswer = { choice: number; guess: number };
export type Answer = TextAnswer | ChoiceAnswer | GuessAnswer;

/** Validates raw form input against the shape the prompt expects. */
export function parseAnswer(
  prompt: Prompt,
  raw: Record<string, unknown>,
): { ok: true; answer: Answer } | { ok: false; error: string } {
  const schema = answerSchema(prompt);
  const result = schema.safeParse(raw);
  if (!result.success) {
    return { ok: false, error: result.error.issues[0]?.message ?? "That answer doesn't look right" };
  }
  return { ok: true, answer: result.data };
}

function choiceIndex(count: number, message: string) {
  return z.coerce
    .number({ message })
    .int(message)
    .min(0, message)
    .max(count - 1, message);
}

function answerSchema(prompt: Prompt): z.ZodType<Answer> {
  switch (prompt.kind) {
    case "this_or_that":
      return z.object({
        choice: choiceIndex(2, "Pick one"),
        note: optionalText.transform((v) => (v ? v : undefined)),
      });
    case "guess_partner":
      return z.object({
        choice: choiceIndex(prompt.options.length, "Pick your own answer"),
        guess: choiceIndex(prompt.options.length, "Take a guess for them too"),
      });
    case "split_clue":
    case "question":
    case "memory":
    case "dream":
    case "about_her":
    case "gratitude":
      return z.object({ text });
  }
}

/** For guess rounds: did this player guess their partner's own choice? */
export function guessedRight(mine: Answer, theirs: Answer): boolean {
  return "guess" in mine && "choice" in theirs && mine.guess === theirs.choice;
}

/** For split clue rounds: did this answer solve the riddle? */
export function solvedClue(prompt: Prompt, answer: Answer): boolean {
  if (prompt.kind !== "split_clue" || !("text" in answer)) return false;
  return prompt.accept.includes(normalizeGuess(answer.text));
}
