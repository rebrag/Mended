import { PROMPTS, type Prompt, needsDaughter } from "./prompts";

/** 32-bit FNV-1a hash, used to derive deterministic seeds from strings. */
export function hashString(value: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < value.length; i++) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** Small deterministic PRNG (mulberry32). */
export function seededRandom(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export type SelectionInput = {
  homeId: string;
  /** Position of the round being opened (0-based). */
  position: number;
  isFriday: boolean;
  hasDaughter: boolean;
  /** Prompt ids already used by this home, oldest first. */
  usedPromptIds: string[];
  deck?: Prompt[];
};

/**
 * Picks the prompt for a new round.
 * Fridays draw from gratitude prompts, other days from everything else.
 * Prompts never repeat until every eligible prompt has been used, then the cycle starts over.
 * The same inputs always produce the same prompt.
 */
export function selectPrompt(input: SelectionInput): Prompt {
  const deck = input.deck ?? PROMPTS;
  const eligible = deck.filter(
    (p) =>
      (input.isFriday ? p.kind === "gratitude" : p.kind !== "gratitude") && (input.hasDaughter || !needsDaughter(p)),
  );
  if (eligible.length === 0) throw new Error("No eligible prompts");

  const eligibleIds = new Set(eligible.map((p) => p.id));
  // Count how many times each eligible prompt has been used; prefer the least-used ones.
  const uses = new Map<string, number>();
  for (const id of input.usedPromptIds) {
    if (eligibleIds.has(id)) uses.set(id, (uses.get(id) ?? 0) + 1);
  }
  const minUses = Math.min(...eligible.map((p) => uses.get(p.id) ?? 0));
  const candidates = eligible.filter((p) => (uses.get(p.id) ?? 0) === minUses);

  // Avoid serving the same kind twice in a row when there is a choice.
  const lastId = input.usedPromptIds.at(-1);
  const lastKind = deck.find((p) => p.id === lastId)?.kind;
  const varied = candidates.filter((p) => p.kind !== lastKind);
  const pool = varied.length > 0 ? varied : candidates;

  const random = seededRandom(hashString(`${input.homeId}:${input.position}`));
  return pool[Math.floor(random() * pool.length)];
}
