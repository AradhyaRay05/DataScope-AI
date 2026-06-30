import type { QualityBreakdown } from "@/types";

interface QualityInput {
  totalCells: number;
  missingCells: number;
  totalRows: number;
  duplicateRows: number;
  columns: Array<{
    detectedType: string;
    nullPercentage: number;
    isConstant: boolean;
    columnName: string;
  }>;
}

export function computeQualityScore(input: QualityInput): {
  score: number;
  breakdown: QualityBreakdown;
  issues: string[];
} {
  const issues: string[] = [];

  const completenessScore =
    input.totalCells === 0
      ? 0
      : ((input.totalCells - input.missingCells) / input.totalCells) * 100;

  const uniquenessScore =
    input.totalRows === 0
      ? 0
      : ((input.totalRows - input.duplicateRows) / input.totalRows) * 100;

  const typeConsistentColumns = input.columns.filter((c) => {
    return c.detectedType !== "mixed" && c.detectedType !== "empty";
  }).length;
  const consistencyScore =
    input.columns.length === 0
      ? 0
      : (typeConsistentColumns / input.columns.length) * 100;

  const goodNames = input.columns.filter((c) => {
    return (
      /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(c.columnName) &&
      !c.columnName.includes(" ")
    );
  }).length;
  const structureScore =
    input.columns.length === 0
      ? 0
      : (goodNames / input.columns.length) * 100;

  for (const col of input.columns) {
    if (col.nullPercentage > 50) {
      issues.push(
        `Column "${col.columnName}" has ${col.nullPercentage.toFixed(1)}% missing values — consider imputation or removal.`
      );
    }
    if (col.isConstant) {
      issues.push(
        `Column "${col.columnName}" has a constant value — it may not be useful for analysis.`
      );
    }
  }

  const duplicatePercentage =
    input.totalRows === 0
      ? 0
      : (input.duplicateRows / input.totalRows) * 100;
  if (duplicatePercentage > 5) {
    issues.push(
      `${input.duplicateRows} duplicate rows detected (${duplicatePercentage.toFixed(1)}%) — consider deduplication.`
    );
  }

  const weights = {
    completeness: 0.4,
    uniqueness: 0.25,
    consistency: 0.2,
    structure: 0.15,
  };

  const score = Math.round(
    completenessScore * weights.completeness +
      uniquenessScore * weights.uniqueness +
      consistencyScore * weights.consistency +
      structureScore * weights.structure
  );

  const breakdown: QualityBreakdown = {
    completeness: {
      score: Math.round(completenessScore),
      weight: weights.completeness,
      description: "Measures the percentage of non-missing values across all cells",
    },
    uniqueness: {
      score: Math.round(uniquenessScore),
      weight: weights.uniqueness,
      description: "Measures the percentage of unique (non-duplicate) rows",
    },
    consistency: {
      score: Math.round(consistencyScore),
      weight: weights.consistency,
      description: "Measures the percentage of columns with consistent, detectable data types",
    },
    structure: {
      score: Math.round(structureScore),
      weight: weights.structure,
      description: "Measures adherence to standard column naming conventions",
    },
  };

  return { score: Math.min(100, Math.max(0, score)), breakdown, issues };
}
