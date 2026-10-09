import { describe, expect, it } from "vitest";
import { daysBetween, isFriday, isRestWindow, localDate, localParts } from "./time";

describe("time", () => {
  it("computes the calendar date in the home's timezone, not UTC", () => {
    const now = new Date("2026-10-09T03:30:00Z"); // Thursday evening in New York
    expect(localDate(now, "America/New_York")).toBe("2026-10-08");
    expect(localDate(now, "Asia/Jerusalem")).toBe("2026-10-09");
  });

  it("reports weekday and hour in the local zone", () => {
    const parts = localParts(new Date("2026-10-09T22:15:00Z"), "America/Los_Angeles");
    expect(parts).toEqual({ date: "2026-10-09", weekday: 5, hour: 15, minute: 15 });
  });

  it("detects Fridays across zones", () => {
    const now = new Date("2026-10-10T02:00:00Z"); // Friday 10pm New York, Saturday in Jerusalem
    expect(isFriday(now, "America/New_York")).toBe(true);
    expect(isFriday(now, "Asia/Jerusalem")).toBe(false);
  });

  it("opens the rest window Friday afternoon and closes it Saturday evening", () => {
    const tz = "America/New_York";
    expect(isRestWindow(new Date("2026-10-09T19:00:00Z"), tz)).toBe(false); // Fri 3pm
    expect(isRestWindow(new Date("2026-10-09T20:30:00Z"), tz)).toBe(true); // Fri 4:30pm
    expect(isRestWindow(new Date("2026-10-10T23:00:00Z"), tz)).toBe(true); // Sat 7pm
    expect(isRestWindow(new Date("2026-10-11T00:30:00Z"), tz)).toBe(false); // Sat 8:30pm
  });

  it("counts days between dates", () => {
    expect(daysBetween("2026-05-01", "2026-10-09")).toBe(161);
    expect(daysBetween("2026-03-07", "2026-03-09")).toBe(2); // across a DST change
  });
});
