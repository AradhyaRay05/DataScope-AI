import { describe, it, expect } from "vitest";
import { analyzeCorrelations } from "../correlation";

describe("analyzeCorrelations", () => {
  it("returns empty result for single column", () => {
    const result = analyzeCorrelations({ col1: [1, 2, 3] });
    expect(result.pairs.length).toBe(0);
    expect(result.summary.totalPairs).toBe(0);
  });

  it("computes perfect positive correlation", () => {
    const result = analyzeCorrelations({
      x: [1, 2, 3, 4, 5],
      y: [2, 4, 6, 8, 10],
    });

    expect(result.pairs.length).toBe(1);
    expect(result.pairs[0].pearson).toBeCloseTo(1, 2);
    expect(result.pairs[0].direction).toBe("positive");
    expect(result.pairs[0].strength).toBe("very_strong");
  });

  it("computes perfect negative correlation", () => {
    const result = analyzeCorrelations({
      x: [1, 2, 3, 4, 5],
      y: [10, 8, 6, 4, 2],
    });

    expect(result.pairs[0].pearson).toBeCloseTo(-1, 2);
    expect(result.pairs[0].direction).toBe("negative");
  });

  it("computes weak correlation for random data", () => {
    const result = analyzeCorrelations({
      x: [1, 5, 3, 8, 2],
      y: [7, 2, 9, 1, 6],
    });

    expect(Math.abs(result.pairs[0].pearson)).toBeLessThan(0.9);
  });

  it("detects multicollinearity", () => {
    const result = analyzeCorrelations({
      a: [1, 2, 3, 4, 5],
      b: [2, 4, 6, 8, 10],
      c: [3, 6, 9, 12, 15],
    });

    expect(result.multicollinearity.detected).toBe(true);
    expect(result.multicollinearity.groups.length).toBeGreaterThan(0);
  });

  it("generates recommendations", () => {
    const result = analyzeCorrelations({
      x: [1, 2, 3, 4, 5],
      y: [2, 4, 6, 8, 10],
    });

    expect(result.recommendations.length).toBeGreaterThan(0);
  });

  it("computes correlation matrix for multiple columns", () => {
    const result = analyzeCorrelations({
      a: [1, 2, 3, 4, 5],
      b: [5, 4, 3, 2, 1],
      c: [1, 3, 2, 4, 5],
    });

    expect(result.matrix.pearson["a"]["a"]).toBe(1);
    expect(result.matrix.pearson["b"]["b"]).toBe(1);
    expect(result.matrix.pearson["c"]["c"]).toBe(1);
    expect(result.matrix.pearson["a"]["b"]).toBeCloseTo(-1, 2);
  });

  it("generates heatmap data", () => {
    const result = analyzeCorrelations({
      a: [1, 2, 3],
      b: [4, 5, 6],
    });

    expect(result.heatmap.columns).toEqual(["a", "b"]);
    expect(result.heatmap.data.length).toBe(2);
    expect(result.heatmap.data[0].length).toBe(2);
  });
});
