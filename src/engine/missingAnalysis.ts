export interface MissingColumnReport {
  columnName: string;
  columnIndex: number;
  nullCount: number;
  nullPercentage: number;
  severity: "none" | "low" | "moderate" | "high" | "critical";
  recommendation: string;
  suggestedAction: "keep" | "impute_mean" | "impute_median" | "impute_mode" | "impute_forward" | "drop_column" | "drop_rows" | "investigate";
}

export interface MissingPattern {
  pattern: string;
  columns: string[];
  rowCount: number;
  percentage: number;
}

export interface MissingCorrelation {
  columnA: string;
  columnB: string;
  correlation: number;
  interpretation: "independent" | "weakly_correlated" | "moderately_correlated" | "strongly_correlated";
}

export interface MissingHeatmapCell {
  rowIndex: number;
  columnName: string;
  isMissing: boolean;
}

export interface MissingAnalysisResult {
  summary: {
    totalCells: number;
    missingCells: number;
    missingPercentage: number;
    completeRows: number;
    completeRowPercentage: number;
    columnsWithMissing: number;
    columnsFullyMissing: number;
    worstColumn: string | null;
    worstColumnPercentage: number;
  };
  columnReports: MissingColumnReport[];
  patterns: MissingPattern[];
  correlations: MissingCorrelation[];
  heatmap: {
    rowBins: number;
    columnNames: string[];
    data: number[][];
  };
  warnings: string[];
  recommendations: string[];
  overallSeverity: "none" | "low" | "moderate" | "high" | "critical";
}

const SEVERITY_THRESHOLDS = {
  low: 5,
  moderate: 20,
  high: 50,
  critical: 80,
};

const MISSING_STRINGS = new Set([
  "",
  "null",
  "na",
  "n/a",
  "none",
  "nan",
  "undefined",
  "-",
  "--",
  "missing",
  "unknown",
  "?",
  "nil",
]);

function isMissing(value: string | undefined | null): boolean {
  if (value === null || value === undefined) return true;
  return MISSING_STRINGS.has(String(value).trim().toLowerCase());
}

function classifySeverity(pct: number): MissingColumnReport["severity"] {
  if (pct === 0) return "none";
  if (pct <= SEVERITY_THRESHOLDS.low) return "low";
  if (pct <= SEVERITY_THRESHOLDS.moderate) return "moderate";
  if (pct <= SEVERITY_THRESHOLDS.high) return "high";
  return "critical";
}

function suggestAction(
  pct: number,
  detectedType: string,
  _totalRows: number,
  _uniqueCount: number
): MissingColumnReport["suggestedAction"] {
  if (pct === 0) return "keep";
  if (pct >= 80) return "drop_column";
  if (pct >= 50) return "investigate";
  if (pct <= 5) return "drop_rows";

  if (detectedType === "numeric") {
    return "impute_median";
  }
  if (detectedType === "categorical" || detectedType === "boolean") {
    return "impute_mode";
  }
  if (detectedType === "datetime") {
    return "impute_forward";
  }
  return "impute_mode";
}

function generateRecommendation(
  pct: number,
  suggestedAction: MissingColumnReport["suggestedAction"],
  columnName: string
): string {
  const actions: Record<string, string> = {
    keep: `Column "${columnName}" has no missing values.`,
    impute_mean: `Column "${columnName}" has ${pct.toFixed(1)}% missing. Consider imputing with the mean for numeric data.`,
    impute_median: `Column "${columnName}" has ${pct.toFixed(1)}% missing. Median imputation is recommended for numeric columns to handle outliers.`,
    impute_mode: `Column "${columnName}" has ${pct.toFixed(1)}% missing. Mode imputation is suitable for categorical/text columns.`,
    impute_forward: `Column "${columnName}" has ${pct.toFixed(1)}% missing. Forward-fill is recommended for time-series or sequential data.`,
    drop_column: `Column "${columnName}" has ${pct.toFixed(1)}% missing (>50%). Consider dropping this column as it provides limited analytical value.`,
    drop_rows: `Column "${columnName}" has ${pct.toFixed(1)}% missing (<5%). Consider dropping the ${Math.ceil(pct)}% of rows with missing values.`,
    investigate: `Column "${columnName}" has ${pct.toFixed(1)}% missing. Investigate the root cause — it may indicate a systematic data collection issue.`,
  };
  return actions[suggestedAction] || "";
}

export function analyzeMissingValues(
  columns: Array<{
    columnName: string;
    columnIndex: number;
    nullCount: number;
    nullPercentage: number;
    detectedType: string;
    uniqueCount: number;
  }>,
  dataRows: string[][],
  totalRows: number,
  totalColumns: number
): MissingAnalysisResult {
  const totalCells = totalRows * totalColumns;
  const totalMissing = columns.reduce((sum, c) => sum + c.nullCount, 0);
  const missingPercentage = totalCells > 0 ? (totalMissing / totalCells) * 100 : 0;

  const completeRows = dataRows.filter(
    (row) => !row.some((cell) => isMissing(cell))
  ).length;
  const completeRowPercentage =
    totalRows > 0 ? (completeRows / totalRows) * 100 : 0;

  const columnsWithMissing = columns.filter((c) => c.nullCount > 0).length;
  const columnsFullyMissing = columns.filter(
    (c) => c.nullPercentage === 100
  ).length;

  const sortedByMissing = [...columns].sort(
    (a, b) => b.nullPercentage - a.nullPercentage
  );
  const worstColumn = sortedByMissing[0]?.columnName ?? null;
  const worstColumnPercentage = sortedByMissing[0]?.nullPercentage ?? 0;

  const columnReports: MissingColumnReport[] = columns.map((col) => {
    const severity = classifySeverity(col.nullPercentage);
    const suggestedAction = suggestAction(
      col.nullPercentage,
      col.detectedType,
      totalRows,
      col.uniqueCount
    );
    const recommendation = generateRecommendation(
      col.nullPercentage,
      suggestedAction,
      col.columnName
    );

    return {
      columnName: col.columnName,
      columnIndex: col.columnIndex,
      nullCount: col.nullCount,
      nullPercentage: Math.round(col.nullPercentage * 100) / 100,
      severity,
      recommendation,
      suggestedAction,
    };
  });

  const patterns = detectMissingPatterns(dataRows, columns);

  const correlations = computeMissingCorrelations(dataRows, columns);

  const heatmap = generateMissingHeatmap(dataRows, columns, totalRows);

  const warnings = generateWarnings(columnReports, completeRowPercentage, totalRows);

  const recommendations = generateGlobalRecommendations(
    columnReports,
    missingPercentage,
    completeRowPercentage,
    totalRows
  );

  const overallSeverity = classifyOverallSeverity(
    missingPercentage,
    columnReports
  );

  return {
    summary: {
      totalCells,
      missingCells: totalMissing,
      missingPercentage: Math.round(missingPercentage * 100) / 100,
      completeRows,
      completeRowPercentage: Math.round(completeRowPercentage * 100) / 100,
      columnsWithMissing,
      columnsFullyMissing,
      worstColumn,
      worstColumnPercentage: Math.round(worstColumnPercentage * 100) / 100,
    },
    columnReports: columnReports.sort(
      (a, b) => b.nullPercentage - a.nullPercentage
    ),
    patterns: patterns.slice(0, 20),
    correlations: correlations
      .filter((c) => Math.abs(c.correlation) > 0.3)
      .sort((a, b) => Math.abs(b.correlation) - Math.abs(a.correlation))
      .slice(0, 20),
    heatmap,
    warnings,
    recommendations,
    overallSeverity,
  };
}

function detectMissingPatterns(
  dataRows: string[][],
  columns: Array<{ columnName: string; columnIndex: number }>
): MissingPattern[] {
  const patternMap = new Map<string, { count: number; columns: Set<string> }>();

  const sampleRows = dataRows.length > 5000
    ? dataRows.filter((_, i) => i % Math.ceil(dataRows.length / 5000) === 0)
    : dataRows;

  for (const row of sampleRows) {
    const missingCols: string[] = [];
    for (const col of columns) {
      if (isMissing(row[col.columnIndex])) {
        missingCols.push(col.columnName);
      }
    }
    if (missingCols.length === 0) continue;

    const key = missingCols.join("|");
    const existing = patternMap.get(key);
    if (existing) {
      existing.count++;
    } else {
      patternMap.set(key, { count: 1, columns: new Set(missingCols) });
    }
  }

  return Array.from(patternMap.entries())
    .map(([pattern, { count, columns: cols }]) => ({
      pattern,
      columns: [...cols],
      rowCount: count,
      percentage: (count / sampleRows.length) * 100,
    }))
    .sort((a, b) => b.rowCount - a.rowCount);
}

function computeMissingCorrelations(
  dataRows: string[][],
  columns: Array<{ columnName: string; columnIndex: number }>
): MissingCorrelation[] {
  const correlations: MissingCorrelation[] = [];
  const colNames = columns.map((c) => c.columnName);

  const missingIndicators: Record<string, number[]> = {};
  for (const col of columns) {
    missingIndicators[col.columnName] = dataRows.map((row) =>
      isMissing(row[col.columnIndex]) ? 1 : 0
    );
  }

  for (let i = 0; i < columns.length; i++) {
    for (let j = i + 1; j < columns.length; j++) {
      const a = colNames[i];
      const b = colNames[j];
      const corr = pointBiserial(
        missingIndicators[a],
        missingIndicators[b]
      );

      let interpretation: MissingCorrelation["interpretation"] = "independent";
      const abs = Math.abs(corr);
      if (abs > 0.7) interpretation = "strongly_correlated";
      else if (abs > 0.4) interpretation = "moderately_correlated";
      else if (abs > 0.2) interpretation = "weakly_correlated";

      correlations.push({
        columnA: a,
        columnB: b,
        correlation: Math.round(corr * 1000) / 1000,
        interpretation,
      });
    }
  }

  return correlations;
}

function pointBiserial(x: number[], y: number[]): number {
  const n = x.length;
  if (n < 2) return 0;

  let sumX = 0,
    sumY = 0,
    sumXY = 0,
    sumX2 = 0,
    sumY2 = 0;
  for (let i = 0; i < n; i++) {
    sumX += x[i];
    sumY += y[i];
    sumXY += x[i] * y[i];
    sumX2 += x[i] * x[i];
    sumY2 += y[i] * y[i];
  }

  const num = n * sumXY - sumX * sumY;
  const den = Math.sqrt(
    (n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY)
  );
  return den === 0 ? 0 : num / den;
}

function generateMissingHeatmap(
  dataRows: string[][],
  columns: Array<{ columnName: string; columnIndex: number }>,
  totalRows: number
): MissingAnalysisResult["heatmap"] {
  const binCount = Math.min(100, Math.max(10, Math.ceil(totalRows / 100)));
  const rowsPerBin = Math.ceil(totalRows / binCount);
  const columnNames = columns.map((c) => c.columnName);

  const data: number[][] = [];
  for (let bin = 0; bin < binCount; bin++) {
    const start = bin * rowsPerBin;
    const end = Math.min(start + rowsPerBin, totalRows);
    const binRow: number[] = [];

    for (const col of columns) {
      let missing = 0;
      let total = 0;
      for (let r = start; r < end; r++) {
        if (r < dataRows.length) {
          total++;
          if (isMissing(dataRows[r][col.columnIndex])) {
            missing++;
          }
        }
      }
      binRow.push(total > 0 ? Math.round((missing / total) * 100) : 0);
    }
    data.push(binRow);
  }

  return { rowBins: binCount, columnNames, data };
}

function generateWarnings(
  reports: MissingColumnReport[],
  completeRowPct: number,
  totalRows: number
): string[] {
  const warnings: string[] = [];

  const criticalCols = reports.filter((r) => r.severity === "critical");
  if (criticalCols.length > 0) {
    warnings.push(
      `${criticalCols.length} column(s) have >80% missing values: ${criticalCols.map((c) => c.columnName).join(", ")}. These columns may be unusable.`
    );
  }

  const highCols = reports.filter((r) => r.severity === "high");
  if (highCols.length > 0) {
    warnings.push(
      `${highCols.length} column(s) have >50% missing values: ${highCols.map((c) => c.columnName).join(", ")}.`
    );
  }

  if (completeRowPct < 50) {
    warnings.push(
      `Only ${completeRowPct.toFixed(1)}% of rows are complete. Most rows have at least one missing value.`
    );
  }

  if (completeRowPct < 10 && totalRows > 100) {
    warnings.push(
      `Less than 10% of rows are complete. Consider whether this dataset is suitable for analysis without significant imputation.`
    );
  }

  const allColsMissing = reports.filter((r) => r.nullPercentage === 100);
  if (allColsMissing.length > 0) {
    warnings.push(
      `${allColsMissing.length} column(s) are entirely empty: ${allColsMissing.map((c) => c.columnName).join(", ")}. Remove these columns.`
    );
  }

  return warnings;
}

function generateGlobalRecommendations(
  reports: MissingColumnReport[],
  missingPct: number,
  completeRowPct: number,
  totalRows: number
): string[] {
  const recs: string[] = [];

  if (missingPct === 0) {
    recs.push("This dataset has no missing values — it is complete and ready for analysis.");
    return recs;
  }

  if (missingPct < 5) {
    recs.push(
      "Overall missingness is low (<5%). Simple row deletion or mean imputation should work well."
    );
  } else if (missingPct < 20) {
    recs.push(
      "Moderate missingness detected. Consider column-specific imputation strategies based on data types."
    );
  } else if (missingPct < 50) {
    recs.push(
      "Significant missingness detected. Investigate the root cause before imputing — some patterns may be systematic."
    );
  } else {
    recs.push(
      "High missingness (>50%). This dataset may not be suitable for reliable analysis without substantial data recovery."
    );
  }

  const dropCols = reports.filter((r) => r.suggestedAction === "drop_column");
  if (dropCols.length > 0) {
    recs.push(
      `Consider dropping ${dropCols.length} column(s) with >50% missing: ${dropCols.map((c) => c.columnName).join(", ")}.`
    );
  }

  const dropRows = reports.filter((r) => r.suggestedAction === "drop_rows");
  if (dropRows.length > 0 && totalRows > 100) {
    recs.push(
      `${dropRows.length} column(s) have <5% missing — dropping affected rows would retain most data.`
    );
  }

  const numericCols = reports.filter(
    (r) => r.severity !== "none" && r.severity !== "critical"
  );
  if (numericCols.length > 3) {
    recs.push(
      "Multiple columns have missing values. Consider using a systematic imputation pipeline rather than ad-hoc fixes."
    );
  }

  return recs;
}

function classifyOverallSeverity(
  missingPct: number,
  reports: MissingColumnReport[]
): MissingAnalysisResult["overallSeverity"] {
  if (missingPct === 0) return "none";
  const criticalCount = reports.filter((r) => r.severity === "critical").length;
  const highCount = reports.filter((r) => r.severity === "high").length;

  if (criticalCount > 0 || missingPct > 50) return "critical";
  if (highCount > 0 || missingPct > 20) return "high";
  if (missingPct > 5) return "moderate";
  return "low";
}
