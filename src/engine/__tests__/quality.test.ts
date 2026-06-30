import { describe, it, expect } from "vitest";
import { computeComprehensiveQualityScore } from "../quality";

describe("computeComprehensiveQualityScore", () => {
  it("returns excellent score for perfect data", () => {
    const result = computeComprehensiveQualityScore({
      totalCells: 1000,
      missingCells: 0,
      totalRows: 100,
      duplicateRows: 0,
      totalColumns: 10,
      columns: Array.from({ length: 10 }, (_, i) => ({
        detectedType: "numeric",
        nullPercentage: 0,
        isConstant: false,
        isHighCardinality: false,
        columnName: `col_${i}`,
        outlierPercentage: 0,
        uniqueCount: 100,
        variance: 10,
      })),
    });

    expect(result.overallScore).toBeGreaterThanOrEqual(90);
    expect(result.category).toBe("excellent");
    expect(result.factors.length).toBe(10);
  });

  it("returns poor score for data with many issues", () => {
    const result = computeComprehensiveQualityScore({
      totalCells: 1000,
      missingCells: 600,
      totalRows: 100,
      duplicateRows: 30,
      totalColumns: 10,
      columns: Array.from({ length: 10 }, (_, i) => ({
        detectedType: i < 5 ? "mixed" : "empty",
        nullPercentage: i < 5 ? 60 : 100,
        isConstant: i >= 5,
        isHighCardinality: false,
        columnName: i < 5 ? `col ${i}` : `col_${i}`,
        outlierPercentage: 10,
        uniqueCount: 5,
        variance: 0,
      })),
    });

    expect(result.overallScore).toBeLessThan(60);
    expect(result.issues.length).toBeGreaterThan(0);
    expect(result.recommendations.length).toBeGreaterThan(0);
  });

  it("generates issues for high missing columns", () => {
    const result = computeComprehensiveQualityScore({
      totalCells: 100,
      missingCells: 60,
      totalRows: 10,
      duplicateRows: 0,
      totalColumns: 10,
      columns: [
        {
          detectedType: "numeric",
          nullPercentage: 80,
          isConstant: false,
          isHighCardinality: false,
          columnName: "bad_column",
        },
      ],
    });

    const completenessFactor = result.factors.find((f) => f.name === "Completeness");
    expect(completenessFactor).toBeDefined();
    expect(completenessFactor!.score).toBeLessThan(100);
  });

  it("generates issues for duplicate rows", () => {
    const result = computeComprehensiveQualityScore({
      totalCells: 100,
      missingCells: 0,
      totalRows: 100,
      duplicateRows: 20,
      totalColumns: 10,
      columns: Array.from({ length: 10 }, (_, i) => ({
        detectedType: "numeric",
        nullPercentage: 0,
        isConstant: false,
        isHighCardinality: false,
        columnName: `col_${i}`,
      })),
    });

    const uniquenessFactor = result.factors.find((f) => f.name === "Row Uniqueness");
    expect(uniquenessFactor).toBeDefined();
    expect(uniquenessFactor!.score).toBeLessThan(100);
  });

  it("returns 0 score for empty dataset", () => {
    const result = computeComprehensiveQualityScore({
      totalCells: 0,
      missingCells: 0,
      totalRows: 0,
      duplicateRows: 0,
      totalColumns: 0,
      columns: [],
    });

    expect(result.overallScore).toBeLessThanOrEqual(100);
  });
});
