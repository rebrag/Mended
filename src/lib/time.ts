/** Pure, timezone-aware calendar helpers. All functions take "now" explicitly. */

export type LocalParts = {
  /** YYYY-MM-DD in the given timezone. */
  date: string;
  /** 0 = Sunday ... 6 = Saturday. */
  weekday: number;
  hour: number;
  minute: number;
};

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function isValidTimezone(tz: string): boolean {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

export function localParts(now: Date, timeZone: string): LocalParts {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);
  const get = (type: Intl.DateTimeFormatPartTypes) => parts.find((p) => p.type === type)?.value ?? "";
  return {
    date: `${get("year")}-${get("month")}-${get("day")}`,
    weekday: WEEKDAYS.indexOf(get("weekday")),
    hour: Number(get("hour")),
    minute: Number(get("minute")),
  };
}

export function localDate(now: Date, timeZone: string): string {
  return localParts(now, timeZone).date;
}

/**
 * The quiet weekly window: Friday from late afternoon until Saturday evening.
 * Used for the two candles and the evening greeting.
 */
export function isRestWindow(now: Date, timeZone: string): boolean {
  const { weekday, hour } = localParts(now, timeZone);
  return (weekday === 5 && hour >= 16) || (weekday === 6 && hour < 20);
}

export function isFriday(now: Date, timeZone: string): boolean {
  return localParts(now, timeZone).weekday === 5;
}

export type DayPeriod = "dawn" | "day" | "dusk" | "night";

export function dayPeriod(now: Date, timeZone: string): DayPeriod {
  const { hour } = localParts(now, timeZone);
  if (hour >= 5 && hour < 8) return "dawn";
  if (hour >= 8 && hour < 17) return "day";
  if (hour >= 17 && hour < 20) return "dusk";
  return "night";
}

/** Whole days between two YYYY-MM-DD dates (b - a). */
export function daysBetween(a: string, b: string): number {
  const ms = Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`);
  return Math.round(ms / 86_400_000);
}

export function formatLongDate(isoDate: string): string {
  return new Date(`${isoDate}T12:00:00Z`).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}
