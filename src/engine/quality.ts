import type { QualityBreakdown } from "@/types";

export interface QualityFactor {
  name: string;
  score: number;
  weight: number;
  weightedScore: number;
  description: string;
  issues: string[];
  status: "excellent" | "good" | "fair" | "poor" | "critical";
}

export interface QualityResult {
  overallScore: number;
  category: "excellent" | "good" | "fair" | "poor" | "critical";
  categoryLabel: string;
  factors: QualityFactor[];
  breakdown: QualityBreakdown;
  issues: string[];
  recommendations: string[];
  summary: {
    totalFactors: number;
    excellentFactors: number;
    goodFactors: number;
    fairFactors: number;
    poorFactors: number;
    criticalFactors: number;
    totalIssues: number;
    criticalIssues: number;
  };
}

interface QualityInput {
  totalCells: number;
  missingCells: number;
  totalRows: number;
  duplicateRows: number;
  totalColumns: number;
  columns: Array<{
    detectedType: string;
    nullPercentage: number;
    isConstant: boolean;
    isHighCardinality: boolean;
    columnName: string;
    outlierPercentage?: number;
    uniqueCount?: number;
    variance?: number;
  }>;
  duplicateColumnPairs?: number;
  inconsistentFormatCount?: number;
}

const FACTOR_WEIGHTS = {
  completeness: 0.2,
  uniqueness: 0.15,
  consistency: 0.15,
  validity: 0.1,
  structure: 0.1,
  uniqueness_columns: 0.08,
  variance: 0.07,
  outlier: 0.05,
  format: 0.05,
  empty_columns: 0.05,
};

function classifyFactor(score: number): QualityFactor["status"] {
  if (score >= 90) return "excellent";
  if (score >= 75) return "good";
  if (score >= 50) return "fair";
  if (score >= 25) return "poor";
  return "critical";
}

function scoreToCategory(score: number): QualityResult["category"] {
  if (score >= 90) return "excellent";
  if (score >= 75) return "good";
  if (score >= 50) return "fair";
  if (score >= 25) return "poor";
  return "critical";
}

function categoryLabel(cat: QualityResult["category"]): string {
  const labels: Record<string, string> = {
    excellent: "Excellent — Dataset is well-structured and ready for analysis.",
    good: "Good — Minor quality issues that should be reviewed.",
    fair: "Fair — Several quality issues that may affect analysis results.",
    poor: "Poor — Significant quality issues requiring remediation.",
    critical: "Critical — Major quality issues. Dataset is not suitable for reliable analysis.",
  };
  return labels[cat];
}

export function computeComprehensiveQualityScore(input: QualityInput): QualityResult {
  const factors: QualityFactor[] = [];
  const allIssues: string[] = [];

  // Factor 1: Completeness
  const completenessScore =
    input.totalCells === 0
      ? 0
      : ((input.totalCells - input.missingCells) / input.totalCells) * 100;
  const completenessIssues: string[] = [];
  for (const col of input.columns) {
    if (col.nullPercentage > 50) {
      completenessIssues.push(
        `Column "${col.columnName}" has ${col.nullPercentage.toFixed(1)}% missing values.`
      );
    } else if (col.nullPercentage > 20) {
      completenessIssues.push(
        `Column "${col.columnName}" has ${col.nullPercentage.toFixed(1)}% missing values — consider imputation.`
      );
    }
  }
  factors.push({
    name: "Completeness",
    score: Math.round(completenessScore),
    weight: FACTOR_WEIGHTS.completeness,
    weightedScore: Math.round(completenessScore * FACTOR_WEIGHTS.completeness),
    description: "Percentage of non-missing values across all cells.",
    issues: completenessIssues,
    status: classifyFactor(completenessScore),
  });
  allIssues.push(...completenessIssues);

  // Factor 2: Uniqueness (rows)
  const uniquenessScore =
    input.totalRows === 0
      ? 0
      : ((input.totalRows - input.duplicateRows) / input.totalRows) * 100;
  const uniquenessIssues: string[] = [];
  if (input.duplicateRows > 0) {
    const pct = (input.duplicateRows / input.totalRows) * 100;
    uniquenessIssues.push(
      `${input.duplicateRows} duplicate rows detected (${pct.toFixed(1)}%).`
    );
  }
  factors.push({
    name: "Row Uniqueness",
    score: Math.round(uniquenessScore),
    weight: FACTOR_WEIGHTS.uniqueness,
    weightedScore: Math.round(uniquenessScore * FACTOR_WEIGHTS.uniqueness),
    description: "Percentage of unique (non-duplicate) rows.",
    issues: uniquenessIssues,
    status: classifyFactor(uniquenessScore),
  });
  allIssues.push(...uniquenessIssues);

  // Factor 3: Type Consistency
  const typeConsistent = input.columns.filter(
    (c) => c.detectedType !== "mixed" && c.detectedType !== "empty"
  ).length;
  const consistencyScore =
    input.columns.length === 0
      ? 0
      : (typeConsistent / input.columns.length) * 100;
  const consistencyIssues: string[] = [];
  for (const col of input.columns) {
    if (col.detectedType === "mixed") {
      consistencyIssues.push(
        `Column "${col.columnName}" has mixed data types — standardize before analysis.`
      );
    }
  }
  factors.push({
    name: "Type Consistency",
    score: Math.round(consistencyScore),
    weight: FACTOR_WEIGHTS.consistency,
    weightedScore: Math.round(consistencyScore * FACTOR_WEIGHTS.consistency),
    description: "Percentage of columns with consistent, detectable data types.",
    issues: consistencyIssues,
    status: classifyFactor(consistencyScore),
  });
  allIssues.push(...consistencyIssues);

  // Factor 4: Validity (outliers)
  const columnsWithOutlierData = input.columns.filter(
    (c) => c.outlierPercentage !== undefined
  );
  const avgOutlierPct =
    columnsWithOutlierData.length > 0
      ? columnsWithOutlierData.reduce(
          (sum, c) => sum + (c.outlierPercentage ?? 0),
          0
        ) / columnsWithOutlierData.length
      : 0;
  const validityScore = Math.max(0, 100 - avgOutlierPct * 5);
  const validityIssues: string[] = [];
  for (const col of input.columns) {
    if ((col.outlierPercentage ?? 0) > 5) {
      validityIssues.push(
        `Column "${col.columnName}" has ${(col.outlierPercentage ?? 0).toFixed(1)}% outliers.`
      );
    }
  }
  factors.push({
    name: "Validity",
    score: Math.round(validityScore),
    weight: FACTOR_WEIGHTS.validity,
    weightedScore: Math.round(validityScore * FACTOR_WEIGHTS.validity),
    description: "Data values fall within expected ranges (fewer outliers = higher score).",
    issues: validityIssues,
    status: classifyFactor(validityScore),
  });
  allIssues.push(...validityIssues);

  // Factor 5: Structure (naming)
  const goodNames = input.columns.filter(
    (c) =>
      /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(c.columnName) &&
      !c.columnName.includes(" ")
  ).length;
  const structureScore =
    input.columns.length === 0
      ? 0
      : (goodNames / input.columns.length) * 100;
  const structureIssues: string[] = [];
  for (const col of input.columns) {
    if (col.columnName.includes(" ")) {
      structureIssues.push(
        `Column "${col.columnName}" contains spaces — use underscores for compatibility.`
      );
    }
    if (!/^[a-zA-Z_]/.test(col.columnName)) {
      structureIssues.push(
        `Column "${col.columnName}" starts with a non-alpha character.`
      );
    }
  }
  factors.push({
    name: "Structure",
    score: Math.round(structureScore),
    weight: FACTOR_WEIGHTS.structure,
    weightedScore: Math.round(structureScore * FACTOR_WEIGHTS.structure),
    description: "Column names follow standard naming conventions.",
    issues: structureIssues,
    status: classifyFactor(structureScore),
  });
  allIssues.push(...structureIssues);

  // Factor 6: Column Uniqueness (constant/duplicate columns)
  const nonConstant = input.columns.filter((c) => !c.isConstant).length;
  const columnUniquenessScore =
    input.columns.length === 0
      ? 100
      : (nonConstant / input.columns.length) * 100;
  const columnUniquenessIssues: string[] = [];
  for (const col of input.columns) {
    if (col.isConstant) {
      columnUniquenessIssues.push(
        `Column "${col.columnName}" has a constant value — provides no analytical value.`
      );
    }
  }
  if ((input.duplicateColumnPairs ?? 0) > 0) {
    columnUniquenessIssues.push(
      `${input.duplicateColumnPairs} duplicate column pair(s) detected.`
    );
  }
  factors.push({
    name: "Column Uniqueness",
    score: Math.round(columnUniquenessScore),
    weight: FACTOR_WEIGHTS.uniqueness_columns,
    weightedScore: Math.round(
      columnUniquenessScore * FACTOR_WEIGHTS.uniqueness_columns
    ),
    description: "Columns are non-constant and non-duplicate.",
    issues: columnUniquenessIssues,
    status: classifyFactor(columnUniquenessScore),
  });
  allIssues.push(...columnUniquenessIssues);

  // Factor 7: Variance
  const numericCols = input.columns.filter(
    (c) => c.detectedType === "numeric" && c.variance !== undefined
  );
  const lowVarianceCols = numericCols.filter(
    (c) => (c.variance ?? 0) === 0 || (c.variance ?? 0) < 0.0001
  );
  const varianceScore =
    numericCols.length === 0
      ? 100
      : ((numericCols.length - lowVarianceCols.length) / numericCols.length) *
        100;
  const varianceIssues: string[] = [];
  for (const col of lowVarianceCols) {
    varianceIssues.push(
      `Column "${col.columnName}" has near-zero variance — may not be informative.`
    );
  }
  factors.push({
    name: "Variance",
    score: Math.round(varianceScore),
    weight: FACTOR_WEIGHTS.variance,
    weightedScore: Math.round(varianceScore * FACTOR_WEIGHTS.variance),
    description: "Numeric columns have sufficient variance to be useful.",
    issues: varianceIssues,
    status: classifyFactor(varianceScore),
  });
  allIssues.push(...varianceIssues);

  // Factor 8: Outlier density
  const outlierScore = Math.max(0, 100 - avgOutlierPct * 3);
  factors.push({
    name: "Outlier Density",
    score: Math.round(outlierScore),
    weight: FACTOR_WEIGHTS.outlier,
    weightedScore: Math.round(outlierScore * FACTOR_WEIGHTS.outlier),
    description: "Low percentage of statistical outliers across numeric columns.",
    issues: [],
    status: classifyFactor(outlierScore),
  });

  // Factor 9: Format Consistency
  const formatScore = input.inconsistentFormatCount
    ? Math.max(0, 100 - input.inconsistentFormatCount * 10)
    : 100;
  const formatIssues: string[] = [];
  if ((input.inconsistentFormatCount ?? 0) > 0) {
    formatIssues.push(
      `${input.inconsistentFormatCount} column(s) have inconsistent formatting patterns.`
    );
  }
  factors.push({
    name: "Format Consistency",
    score: Math.round(formatScore),
    weight: FACTOR_WEIGHTS.format,
    weightedScore: Math.round(formatScore * FACTOR_WEIGHTS.format),
    description: "Values within columns follow consistent formatting patterns.",
    issues: formatIssues,
    status: classifyFactor(formatScore),
  });
  allIssues.push(...formatIssues);

  // Factor 10: Empty columns
  const emptyCols = input.columns.filter(
    (c) => c.detectedType === "empty" || c.nullPercentage === 100
  ).length;
  const emptyScore =
    input.columns.length === 0
      ? 100
      : ((input.columns.length - emptyCols) / input.columns.length) * 100;
  const emptyIssues: string[] = [];
  if (emptyCols > 0) {
    const emptyNames = input.columns
      .filter((c) => c.detectedType === "empty" || c.nullPercentage === 100)
      .map((c) => c.columnName);
    emptyIssues.push(
      `${emptyCols} completely empty column(s): ${emptyNames.join(", ")}. Remove these.`
    );
  }
  factors.push({
    name: "Empty Columns",
    score: Math.round(emptyScore),
    weight: FACTOR_WEIGHTS.empty_columns,
    weightedScore: Math.round(emptyScore * FACTOR_WEIGHTS.empty_columns),
    description: "No columns are entirely empty.",
    issues: emptyIssues,
    status: classifyFactor(emptyScore),
  });
  allIssues.push(...emptyIssues);

  // Calculate overall score
  const overallScore = Math.min(
    100,
    Math.max(0, Math.round(factors.reduce((sum, f) => sum + f.weightedScore, 0)))
  );

  const category = scoreToCategory(overallScore);

  const recommendations = generateQualityRecommendations(factors, overallScore);

  const breakdown: QualityBreakdown = {
    completeness: {
      score: factors[0].score,
      weight: factors[0].weight,
      description: factors[0].description,
    },
    uniqueness: {
      score: factors[1].score,
      weight: factors[1].weight,
      description: factors[1].description,
    },
    consistency: {
      score: factors[2].score,
      weight: factors[2].weight,
      description: factors[2].description,
    },
    structure: {
      score: factors[4].score,
      weight: factors[4].weight,
      description: factors[4].description,
    },
  };

  return {
    overallScore,
    category,
    categoryLabel: categoryLabel(category),
    factors,
    breakdown,
    issues: allIssues,
    recommendations,
    summary: {
      totalFactors: factors.length,
      excellentFactors: factors.filter((f) => f.status === "excellent").length,
      goodFactors: factors.filter((f) => f.status === "good").length,
      fairFactors: factors.filter((f) => f.status === "fair").length,
      poorFactors: factors.filter((f) => f.status === "poor").length,
      criticalFactors: factors.filter((f) => f.status === "critical").length,
      totalIssues: allIssues.length,
      criticalIssues: factors.filter((f) => f.status === "critical").length,
    },
  };
}

function generateQualityRecommendations(
  factors: QualityFactor[],
  overallScore: number
): string[] {
  const recs: string[] = [];

  const poorFactors = factors.filter(
    (f) => f.status === "poor" || f.status === "critical"
  );
  if (poorFactors.length > 0) {
    recs.push(
      `Priority: Address ${poorFactors.length} poor/critical factor(s): ${poorFactors.map((f) => f.name).join(", ")}.`
    );
  }

  const completenessFactor = factors.find((f) => f.name === "Completeness");
  if (completenessFactor && completenessFactor.score < 80) {
    recs.push(
      "Missing data is a significant issue. Investigate the root cause (MCAR, MAR, MNAR) and apply appropriate imputation strategies."
    );
  }

  const uniquenessFactor = factors.find((f) => f.name === "Row Uniqueness");
  if (uniquenessFactor && uniquenessFactor.score < 95) {
    recs.push(
      "Remove duplicate rows to ensure each observation is unique. Use `df.drop_duplicates()` or equivalent."
    );
  }

  const structureFactor = factors.find((f) => f.name === "Structure");
  if (structureFactor && structureFactor.score < 80) {
    recs.push(
      "Standardize column names: replace spaces with underscores, use lowercase, remove special characters."
    );
  }

  if (overallScore >= 90) {
    recs.push("Dataset quality is excellent. Proceed with confidence to analysis and modeling.");
  } else if (overallScore >= 75) {
    recs.push("Dataset quality is good. Review and address the identified issues before analysis.");
  } else if (overallScore >= 50) {
    recs.push("Dataset quality is fair. Significant cleaning is recommended before reliable analysis.");
  } else {
    recs.push("Dataset quality is poor/critical. Extensive data cleaning and validation are required.");
  }

  return recs;
}
