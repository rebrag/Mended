import { describe, expect, it } from "vitest";
import { PROMPTS, needsDaughter } from "./prompts";
import { selectPrompt } from "./selection";

const base = { homeId: "home-1", isFriday: false, hasDaughter: true, usedPromptIds: [] as string[] };

describe("prompt deck", () => {
  it("has unique ids", () => {
    expect(new Set(PROMPTS.map((p) => p.id)).size).toBe(PROMPTS.length);
  });

  it("has valid options and clues", () => {
    for (const p of PROMPTS) {
      if (p.kind === "this_or_that") expect(p.options).toHaveLength(2);
      if (p.kind === "guess_partner") expect(p.options.length).toBeGreaterThanOrEqual(2);
      if (p.kind === "split_clue") expect(p.accept.length).toBeGreaterThan(0);
    }
  });
});

describe("selectPrompt", () => {
  it("is deterministic", () => {
    const a = selectPrompt({ ...base, position: 3 });
    const b = selectPrompt({ ...base, position: 3 });
    expect(a.id).toBe(b.id);
  });

  it("serves gratitude prompts on Fridays only", () => {
    for (let position = 0; position < 30; position++) {
      expect(selectPrompt({ ...base, position, isFriday: true }).kind).toBe("gratitude");
      expect(selectPrompt({ ...base, position }).kind).not.toBe("gratitude");
    }
  });

  it("never repeats until the eligible deck is exhausted", () => {
    const used: string[] = [];
    const eligible = PROMPTS.filter((p) => p.kind !== "gratitude").length;
    for (let position = 0; position < eligible; position++) {
      used.push(selectPrompt({ ...base, position, usedPromptIds: used }).id);
    }
    expect(new Set(used).size).toBe(eligible);
    // The next cycle starts over without crashing.
    expect(selectPrompt({ ...base, position: eligible, usedPromptIds: used })).toBeTruthy();
  });

  it("skips prompts about the daughter when she isn't set up", () => {
    const used: string[] = [];
    for (let position = 0; position < 60; position++) {
      const p = selectPrompt({ ...base, position, hasDaughter: false, usedPromptIds: used });
      expect(needsDaughter(p)).toBe(false);
      used.push(p.id);
    }
  });

  it("avoids the same kind twice in a row", () => {
    const used: string[] = [];
    let previousKind: string | null = null;
    for (let position = 0; position < 50; position++) {
      const p = selectPrompt({ ...base, position, usedPromptIds: used });
      expect(p.kind).not.toBe(previousKind);
      previousKind = p.kind;
      used.push(p.id);
    }
  });
});
