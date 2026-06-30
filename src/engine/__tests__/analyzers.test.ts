import { describe, it, expect } from "vitest";
import { analyzeNumeric } from "../analyzers/numericAnalyzer";
import { analyzeCategorical } from "../analyzers/categoricalAnalyzer";
import { analyzeBoolean } from "../analyzers/booleanAnalyzer";
import { analyzeText } from "../analyzers/textAnalyzer";

describe("analyzeNumeric", () => {
  it("computes full analysis for normal data", () => {
    const values = Array.from({ length: 100 }, (_, i) => i + 1);
    const result = analyzeNumeric(values);

    expect(result.centralTendency.mean).toBeCloseTo(50.5, 0);
    expect(result.centralTendency.median).toBeCloseTo(50.5, 0);
    expect(result.dispersion.range).toBe(99);
    expect(result.position.min).toBe(1);
    expect(result.position.max).toBe(100);
    expect(result.counts.total).toBe(100);
    expect(result.percentiles.p50).toBeCloseTo(50.5, 0);
    expect(result.distribution.histogram.length).toBeGreaterThan(0);
    expect(result.preprocessingSuggestions.length).toBeGreaterThanOrEqual(0);
  });

  it("detects right skewness", () => {
    const values = [1, 1, 1, 2, 2, 3, 4, 5, 10, 50];
    const result = analyzeNumeric(values);
    expect(result.shape.skewness).toBeGreaterThan(0);
    expect(result.shape.skewnessInterpretation).toContain("skewed");
  });

  it("detects outliers", () => {
    const values = [10, 12, 14, 15, 16, 18, 20, 100, 200];
    const result = analyzeNumeric(values);
    expect(result.outliers.iqrCount).toBeGreaterThan(0);
  });

  it("handles constant values", () => {
    const values = [5, 5, 5, 5, 5];
    const result = analyzeNumeric(values);
    expect(result.dispersion.std).toBe(0);
    expect(result.dispersion.range).toBe(0);
  });
});

describe("analyzeCategorical", () => {
  it("analyzes categorical distribution", () => {
    const values = ["red", "blue", "red", "green", "red", "blue"];
    const result = analyzeCategorical(values, 6);

    expect(result.summary.uniqueCount).toBe(3);
    expect(result.summary.mostCommon.value).toBe("red");
    expect(result.summary.mostCommon.count).toBe(3);
    expect(result.distribution.topValues.length).toBe(3);
  });

  it("detects imbalance", () => {
    const values = ["a", "a", "a", "a", "a", "a", "a", "a", "b", "c"];
    const result = analyzeCategorical(values, 10);

    expect(result.imbalance.isBalanced).toBe(false);
    expect(result.imbalance.dominantClass).toBe("a");
  });

  it("detects case inconsistencies", () => {
    const values = ["Yes", "yes", "YES", "No", "no"];
    const result = analyzeCategorical(values, 5);
    expect(result.quality.caseInconsistencies).toBeGreaterThan(0);
  });
});

describe("analyzeBoolean", () => {
  it("analyzes true/false distribution", () => {
    const values = ["true", "false", "true", "true", "false"];
    const result = analyzeBoolean(values, 5);

    expect(result.distribution.trueCount).toBe(3);
    expect(result.distribution.falseCount).toBe(2);
    expect(result.distribution.truePercentage).toBe(60);
  });

  it("detects imbalance", () => {
    const values = ["true", "true", "true", "true", "false"];
    const result = analyzeBoolean(values, 5);
    expect(result.imbalance.isBalanced).toBe(false);
  });

  it("handles 1/0 values", () => {
    const values = ["1", "0", "1", "1"];
    const result = analyzeBoolean(values, 4);
    expect(result.distribution.trueCount).toBe(3);
    expect(result.distribution.falseCount).toBe(1);
  });
});

describe("analyzeText", () => {
  it("analyzes text statistics", () => {
    const values = [
      "Hello world",
      "This is a test",
      "Another text here",
    ];
    const result = analyzeText(values, 3);

    expect(result.length.minLength).toBeGreaterThan(0);
    expect(result.length.maxLength).toBeGreaterThanOrEqual(result.length.minLength);
    expect(result.wordCount.totalWords).toBeGreaterThan(0);
    expect(result.content.topWords.length).toBeGreaterThanOrEqual(0);
  });

  it("detects duplicates", () => {
    const values = ["hello", "world", "hello", "foo"];
    const result = analyzeText(values, 4);
    expect(result.duplicates.exactDuplicateCount).toBe(1);
  });

  it("detects empty strings", () => {
    const values = ["hello", "", "world", ""];
    const result = analyzeText(values, 4);
    expect(result.quality.emptyStringCount).toBe(2);
  });
});
