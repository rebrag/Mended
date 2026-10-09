import { describe, expect, it } from "vitest";
import { ageLabel, treeGrowth } from "./tree";

describe("tree", () => {
  it("labels ages in days, weeks, months and years", () => {
    expect(ageLabel("2026-10-09", "2026-10-09")).toBe("Born today");
    expect(ageLabel("2026-10-01", "2026-10-09")).toBe("8 days");
    expect(ageLabel("2026-09-15", "2026-10-09")).toBe("3 weeks");
    expect(ageLabel("2026-05-01", "2026-10-01")).toBe("5 months");
    expect(ageLabel("2026-05-01", "2026-10-09")).toBe("5 months, 1 week");
    expect(ageLabel("2026-05-20", "2026-10-09")).toBe("4 months, 2 weeks");
    expect(ageLabel("2025-05-01", "2026-07-02")).toBe("1 year, 2 months");
  });

  it("grows with age and caps at fully grown", () => {
    const young = treeGrowth("2026-09-01", "2026-10-09").growth;
    const older = treeGrowth("2026-05-01", "2026-10-09").growth;
    expect(older).toBeGreaterThan(young);
    expect(treeGrowth("2010-01-01", "2026-10-09").growth).toBe(1);
    expect(treeGrowth(null, "2026-10-09").ageLabel).toBeNull();
  });
});
