import { describe, expect, it } from "vitest";
import { SHARDS_PER_VESSEL, VESSEL_SHAPES, vesselShards } from "./vessel-shapes";

describe("vesselShards", () => {
  it.each(VESSEL_SHAPES)("breaks a %s into exactly 18 shards for many seeds", (shape) => {
    for (let i = 0; i < 40; i++) {
      const shards = vesselShards(shape, `seed-${i}`);
      expect(shards).toHaveLength(SHARDS_PER_VESSEL);
      for (const s of shards) expect(s.points.length).toBeGreaterThanOrEqual(3);
    }
  });

  it("is deterministic and orders shards from the foot upward", () => {
    const a = vesselShards("amphora", "abc");
    const b = vesselShards("amphora", "abc");
    expect(a).toEqual(b);
    for (let i = 1; i < a.length; i++) {
      expect(a[i].centroid[1]).toBeLessThanOrEqual(a[i - 1].centroid[1]);
    }
  });
});
