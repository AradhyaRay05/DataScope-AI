import { describe, it, expect } from "vitest";
import { computeNumericStats, computeHistogram, detectOutliers, computeTopValues, computeValueDistribution } from "../statistics";

describe("computeNumericStats", () => {
  it("computes basic statistics for a simple dataset", () => {
    const stats = computeNumericStats([1, 2, 3, 4, 5]);
    expect(stats.mean).toBe(3);
    expect(stats.median).toBe(3);
    expect(stats.min).toBe(1);
    expect(stats.max).toBe(5);
    expect(stats.range).toBe(4);
    expect(stats.sum).toBe(15);
    expect(stats.zeroCount).toBe(0);
    expect(stats.negativeCount).toBe(0);
    expect(stats.positiveCount).toBe(5);
  });

  it("handles single value", () => {
    const stats = computeNumericStats([42]);
    expect(stats.mean).toBe(42);
    expect(stats.median).toBe(42);
    expect(stats.std).toBe(0);
    expect(stats.variance).toBe(0);
  });

  it("handles negative values", () => {
    const stats = computeNumericStats([-5, -2, 0, 3, 8]);
    expect(stats.negativeCount).toBe(2);
    expect(stats.zeroCount).toBe(1);
    expect(stats.positiveCount).toBe(2);
    expect(stats.min).toBe(-5);
    expect(stats.max).toBe(8);
  });

  it("computes quartiles correctly", () => {
    const stats = computeNumericStats([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    expect(stats.q25).toBeCloseTo(3.25, 0);
    expect(stats.q50).toBeCloseTo(5.5, 0);
    expect(stats.q75).toBeCloseTo(7.75, 0);
  });

  it("detects zero standard deviation for constant values", () => {
    const stats = computeNumericStats([5, 5, 5, 5]);
    expect(stats.std).toBe(0);
    expect(stats.skewness).toBe(0);
    expect(stats.kurtosis).toBe(0);
  });

  it("computes skewness for right-skewed data", () => {
    const stats = computeNumericStats([1, 1, 1, 2, 2, 3, 4, 5, 10, 20]);
    expect(stats.skewness).toBeGreaterThan(0);
  });

  it("computes coefficient of variation", () => {
    const stats = computeNumericStats([10, 20, 30, 40, 50]);
    expect(stats.coefficientOfVariation).toBeGreaterThan(0);
  });
});

describe("computeHistogram", () => {
  it("creates bins for uniform data", () => {
    const values = Array.from({ length: 100 }, (_, i) => i);
    const histogram = computeHistogram(values, 10);
    expect(histogram.length).toBeGreaterThan(0);
    expect(histogram.length).toBeLessThanOrEqual(10);
    const total = histogram.reduce((sum, bin) => sum + bin.count, 0);
    expect(total).toBe(100);
  });

  it("handles single value", () => {
    const histogram = computeHistogram([5, 5, 5]);
    expect(histogram.length).toBe(1);
    expect(histogram[0].count).toBe(3);
  });

  it("returns empty for empty input", () => {
    expect(computeHistogram([])).toEqual([]);
  });
});

describe("detectOutliers", () => {
  it("detects outliers using IQR method", () => {
    const values = [10, 12, 14, 15, 16, 18, 20, 100];
    const outliers = detectOutliers(values);
    expect(outliers).toContain(100);
  });

  it("returns empty for no outliers", () => {
    const values = [10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20];
    const outliers = detectOutliers(values);
    expect(outliers.length).toBe(0);
  });
});

describe("computeTopValues", () => {
  it("returns top values sorted by frequency", () => {
    const values = ["a", "b", "a", "c", "a", "b"];
    const top = computeTopValues(values, 2);
    expect(top.length).toBe(2);
    expect(top[0].value).toBe("a");
    expect(top[0].count).toBe(3);
    expect(top[1].value).toBe("b");
    expect(top[1].count).toBe(2);
  });

  it("handles empty strings", () => {
    const values = ["", "a", "", "b"];
    const top = computeTopValues(values);
    const emptyEntry = top.find((t) => t.value === "(empty)");
    expect(emptyEntry).toBeDefined();
    expect(emptyEntry!.count).toBe(2);
  });
});

describe("computeValueDistribution", () => {
  it("returns distribution map", () => {
    const values = ["x", "y", "x", "z", "x"];
    const dist = computeValueDistribution(values);
    expect(dist["x"]).toBe(3);
    expect(dist["y"]).toBe(1);
    expect(dist["z"]).toBe(1);
  });
});
