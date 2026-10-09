import type { PromptKind } from "./prompts";

export function kindLabel(kind: PromptKind, names: { partner: string; daughter: string | null }): string {
  switch (kind) {
    case "question":
      return "Just wondering";
    case "memory":
      return "Remember when";
    case "dream":
      return "Someday";
    case "about_her":
      return names.daughter ? `About ${names.daughter}` : "About the little one";
    case "gratitude":
      return "As the week winds down";
    case "this_or_that":
      return "This or that";
    case "guess_partner":
      return `How well do you know ${names.partner}?`;
    case "split_clue":
      return "A riddle for two";
  }
}

export function formatRoundDate(localDate: string): string {
  return new Date(`${localDate}T12:00:00Z`).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}
