import { daysBetween } from "./time";

export type TreeGrowth = {
  /** 0..1, how grown the tree is drawn. */
  growth: number;
  /** Human age label, e.g. "5 months, 1 week". */
  ageLabel: string | null;
  weeks: number | null;
};

const FULL_GROWN_WEEKS = 52 * 3;

function plural(n: number, word: string) {
  return `${n} ${word}${n === 1 ? "" : "s"}`;
}

export function ageLabel(birthdate: string, today: string): string {
  const days = Math.max(0, daysBetween(birthdate, today));
  if (days < 14) return days === 0 ? "Born today" : plural(days, "day");
  const [by, bm, bd] = birthdate.split("-").map(Number);
  const [ty, tm, td] = today.split("-").map(Number);
  let months = (ty - by) * 12 + (tm - bm) - (td < bd ? 1 : 0);
  if (months < 1) return plural(Math.floor(days / 7), "week");
  const years = Math.floor(months / 12);
  months %= 12;
  if (years === 0) {
    // Weeks since the last month-day anniversary.
    const anniversary = new Date(Date.UTC(ty, tm - 1 - (td < bd ? 1 : 0), bd)).toISOString().slice(0, 10);
    const weeks = Math.floor(daysBetween(anniversary, today) / 7);
    return weeks > 0 ? `${plural(months, "month")}, ${plural(weeks, "week")}` : plural(months, "month");
  }
  return months > 0 ? `${plural(years, "year")}, ${plural(months, "month")}` : plural(years, "year");
}

export function treeGrowth(birthdate: string | null, today: string): TreeGrowth {
  if (!birthdate) return { growth: 0.35, ageLabel: null, weeks: null };
  const weeks = Math.max(0, Math.floor(daysBetween(birthdate, today) / 7));
  const growth = Math.min(1, 0.12 + (0.88 * Math.log1p(weeks)) / Math.log1p(FULL_GROWN_WEEKS));
  return { growth, ageLabel: ageLabel(birthdate, today), weeks };
}
