export interface SchemaDiff {
  onlyInA: Array<{ name: string; type: string }>;
  onlyInB: Array<{ name: string; type: string }>;
  shared: Array<{ name: string; typeA: string; typeB: string; typeMatch: boolean }>;
  typeMismatches: Array<{ name: string; typeA: string; typeB: string }>;
  addedColumns: number;
  removedColumns: number;
  typeChanges: number;
}

export interface StatisticalDiff {
  column: string;
  metrics: Array<{
    metric: string;
    valueA: number;
    valueB: number;
    absoluteDiff: number;
    percentChange: number;
    significant: boolean;
  }>;
}

export interface QualityDiff {
  scoreA: number;
  scoreB: number;
  scoreDiff: number;
  factors: Array<{
    factor: string;
    scoreA: number;
    scoreB: number;
    diff: number;
  }>;
}

export interface MetadataDiff {
  rowsA: number;
  rowsB: number;
  rowDiff: number;
  columnsA: number;
  columnsB: number;
  columnDiff: number;
  missingA: number;
  missingB: number;
  missingDiff: number;
  duplicatesA: number;
  duplicatesB: number;
  duplicateDiff: number;
  fileSizeA: number;
  fileSizeB: number;
  encodingA: string;
  encodingB: string;
  delimiterA: string;
  delimiterB: string;
}

export interface FeatureSimilarity {
  columnA: string;
  columnB: string;
  correlation: number;
  distributionSimilarity: number;
  typeMatch: boolean;
  overallSimilarity: number;
}

export interface ComparisonResult {
  overview: {
    datasetA: { id: string; name: string; rows: number; columns: number; quality: number };
    datasetB: { id: string; name: string; rows: number; columns: number; quality: number };
    overallSimilarity: number;
    recommendation: string;
  };
  schema: SchemaDiff;
  statistical: StatisticalDiff[];
  quality: QualityDiff;
  metadata: MetadataDiff;
  featureSimilarity: FeatureSimilarity[];
  summary: {
    totalChanges: number;
    significantChanges: number;
    newColumns: number;
    removedColumns: number;
    qualityChange: string;
  };
  recommendations: string[];
}

interface CompareInput {
  datasetA: {
    id: string;
    name: string;
    rowCount: number;
    columnCount: number;
    fileSize: number;
    encoding: string;
    delimiter: string;
    qualityScore: number;
    missingPercentage: number;
    duplicatePercentage: number;
    columns: Array<{
      columnName: string;
      detectedType: string;
      nullPercentage: number;
      mean: number | null;
      median: number | null;
      std: number | null;
      uniqueCount: number;
    }>;
  };
  datasetB: {
    id: string;
    name: string;
    rowCount: number;
    columnCount: number;
    fileSize: number;
    encoding: string;
    delimiter: string;
    qualityScore: number;
    missingPercentage: number;
    duplicatePercentage: number;
    columns: Array<{
      columnName: string;
      detectedType: string;
      nullPercentage: number;
      mean: number | null;
      median: number | null;
      std: number | null;
      uniqueCount: number;
    }>;
  };
}

export function compareDatasets(input: CompareInput): ComparisonResult {
  const { datasetA: a, datasetB: b } = input;

  const schema = computeSchemaDiff(a.columns, b.columns);
  const statistical = computeStatisticalDiff(a.columns, b.columns);
  const quality = computeQualityDiff(a, b);
  const metadata = computeMetadataDiff(a, b);
  const featureSimilarity = computeFeatureSimilarity(a.columns, b.columns);

  const sharedCount = schema.shared.length;
  const totalCols = Math.max(a.columnCount, b.columnCount);
  const typeMatchRatio =
    sharedCount > 0
      ? schema.shared.filter((s) => s.typeMatch).length / sharedCount
      : 0;
  const sizeSimilarity =
    1 -
    Math.abs(a.rowCount - b.rowCount) /
      Math.max(a.rowCount, b.rowCount, 1);
  const qualitySimilarity =
    1 - Math.abs(a.qualityScore - b.qualityScore) / 100;

  const overallSimilarity =
    (typeMatchRatio * 0.3 +
      (sharedCount / totalCols) * 0.3 +
      sizeSimilarity * 0.2 +
      qualitySimilarity * 0.2) *
    100;

  const recommendation = generateComparisonRecommendation(
    overallSimilarity,
    schema,
    quality,
    metadata
  );

  const recommendations = generateComparisonRecommendations(
    schema,
    statistical,
    quality,
    metadata,
    featureSimilarity
  );

  const significantChanges = statistical.filter((s) =>
    s.metrics.some((m) => m.significant)
  ).length;

  return {
    overview: {
      datasetA: {
        id: a.id,
        name: a.name,
        rows: a.rowCount,
        columns: a.columnCount,
        quality: a.qualityScore,
      },
      datasetB: {
        id: b.id,
        name: b.name,
        rows: b.rowCount,
        columns: b.columnCount,
        quality: b.qualityScore,
      },
      overallSimilarity: Math.round(overallSimilarity * 10) / 10,
      recommendation,
    },
    schema,
    statistical,
    quality,
    metadata,
    featureSimilarity,
    summary: {
      totalChanges:
        schema.addedColumns +
        schema.removedColumns +
        schema.typeChanges +
        significantChanges,
      significantChanges,
      newColumns: schema.addedColumns,
      removedColumns: schema.removedColumns,
      qualityChange:
        quality.scoreDiff > 5
          ? "improved"
          : quality.scoreDiff < -5
            ? "degraded"
            : "stable",
    },
    recommendations,
  };
}

function computeSchemaDiff(
  colsA: CompareInput["datasetA"]["columns"],
  colsB: CompareInput["datasetB"]["columns"]
): SchemaDiff {
  const mapA = new Map(colsA.map((c) => [c.columnName, c]));
  const mapB = new Map(colsB.map((c) => [c.columnName, c]));

  const onlyInA = colsA
    .filter((c) => !mapB.has(c.columnName))
    .map((c) => ({ name: c.columnName, type: c.detectedType }));

  const onlyInB = colsB
    .filter((c) => !mapA.has(c.columnName))
    .map((c) => ({ name: c.columnName, type: c.detectedType }));

  const shared = colsA
    .filter((c) => mapB.has(c.columnName))
    .map((c) => {
      const bCol = mapB.get(c.columnName)!;
      return {
        name: c.columnName,
        typeA: c.detectedType,
        typeB: bCol.detectedType,
        typeMatch: c.detectedType === bCol.detectedType,
      };
    });

  const typeMismatches = shared
    .filter((s) => !s.typeMatch)
    .map((s) => ({ name: s.name, typeA: s.typeA, typeB: s.typeB }));

  return {
    onlyInA,
    onlyInB,
    shared,
    typeMismatches,
    addedColumns: onlyInB.length,
    removedColumns: onlyInA.length,
    typeChanges: typeMismatches.length,
  };
}

function computeStatisticalDiff(
  colsA: CompareInput["datasetA"]["columns"],
  colsB: CompareInput["datasetB"]["columns"]
): StatisticalDiff[] {
  const mapA = new Map(colsA.map((c) => [c.columnName, c]));
  const results: StatisticalDiff[] = [];

  for (const colB of colsB) {
    const colA = mapA.get(colB.columnName);
    if (!colA || colA.detectedType !== "numeric" || colB.detectedType !== "numeric")
      continue;

    const metrics = [];
    for (const [metric, valA, valB] of [
      ["mean", colA.mean, colB.mean],
      ["median", colA.median, colB.median],
      ["std", colA.std, colB.std],
    ] as const) {
      if (valA !== null && valB !== null) {
        const diff = valB - valA;
        const pctChange = valA !== 0 ? Math.abs(diff / valA) * 100 : valB !== 0 ? 100 : 0;
        metrics.push({
          metric,
          valueA: Math.round(valA * 1000) / 1000,
          valueB: Math.round(valB * 1000) / 1000,
          absoluteDiff: Math.round(diff * 1000) / 1000,
          percentChange: Math.round(pctChange * 10) / 10,
          significant: pctChange > 20,
        });
      }
    }

    if (metrics.length > 0) {
      results.push({ column: colB.columnName, metrics });
    }
  }

  return results.sort((a, b) => {
    const maxA = Math.max(...a.metrics.map((m) => m.percentChange));
    const maxB = Math.max(...b.metrics.map((m) => m.percentChange));
    return maxB - maxA;
  });
}

function computeQualityDiff(
  a: CompareInput["datasetA"],
  b: CompareInput["datasetB"]
): QualityDiff {
  const scoreA = a.qualityScore;
  const scoreB = b.qualityScore;
  const scoreDiff = scoreB - scoreA;

  const completenessA = 100 - a.missingPercentage;
  const completenessB = 100 - b.missingPercentage;
  const uniquenessA = 100 - a.duplicatePercentage;
  const uniquenessB = 100 - b.duplicatePercentage;

  return {
    scoreA,
    scoreB,
    scoreDiff: Math.round(scoreDiff * 10) / 10,
    factors: [
      {
        factor: "Completeness",
        scoreA: Math.round(completenessA),
        scoreB: Math.round(completenessB),
        diff: Math.round((completenessB - completenessA) * 10) / 10,
      },
      {
        factor: "Uniqueness",
        scoreA: Math.round(uniquenessA),
        scoreB: Math.round(uniquenessB),
        diff: Math.round((uniquenessB - uniquenessA) * 10) / 10,
      },
    ],
  };
}

function computeMetadataDiff(
  a: CompareInput["datasetA"],
  b: CompareInput["datasetB"]
): MetadataDiff {
  return {
    rowsA: a.rowCount,
    rowsB: b.rowCount,
    rowDiff: b.rowCount - a.rowCount,
    columnsA: a.columnCount,
    columnsB: b.columnCount,
    columnDiff: b.columnCount - a.columnCount,
    missingA: a.missingPercentage,
    missingB: b.missingPercentage,
    missingDiff: Math.round((b.missingPercentage - a.missingPercentage) * 100) / 100,
    duplicatesA: a.duplicatePercentage,
    duplicatesB: b.duplicatePercentage,
    duplicateDiff: Math.round((b.duplicatePercentage - a.duplicatePercentage) * 100) / 100,
    fileSizeA: a.fileSize,
    fileSizeB: b.fileSize,
    encodingA: a.encoding,
    encodingB: b.encoding,
    delimiterA: a.delimiter,
    delimiterB: b.delimiter,
  };
}

function computeFeatureSimilarity(
  colsA: CompareInput["datasetA"]["columns"],
  colsB: CompareInput["datasetB"]["columns"]
): FeatureSimilarity[] {
  const numericA = colsA.filter((c) => c.detectedType === "numeric");
  const numericB = colsB.filter((c) => c.detectedType === "numeric");

  const results: FeatureSimilarity[] = [];

  for (const a of numericA) {
    for (const b of numericB) {
      if (a.columnName === b.columnName) continue;

      const meanSim =
        a.mean !== null && b.mean !== null
          ? 1 - Math.abs(a.mean - b.mean) / (Math.abs(a.mean) + Math.abs(b.mean) + 1)
          : 0;
      const stdSim =
        a.std !== null && b.std !== null
          ? 1 - Math.abs(a.std - b.std) / (a.std + b.std + 1)
          : 0;
      const uniqueSim =
        1 -
        Math.abs(a.uniqueCount - b.uniqueCount) /
          Math.max(a.uniqueCount, b.uniqueCount, 1);

      const overall = (meanSim * 0.4 + stdSim * 0.3 + uniqueSim * 0.3) * 100;

      if (overall > 60) {
        results.push({
          columnA: a.columnName,
          columnB: b.columnName,
          correlation: 0,
          distributionSimilarity: Math.round(overall * 10) / 10,
          typeMatch: a.detectedType === b.detectedType,
          overallSimilarity: Math.round(overall * 10) / 10,
        });
      }
    }
  }

  return results.sort((a, b) => b.overallSimilarity - a.overallSimilarity).slice(0, 20);
}

function generateComparisonRecommendation(
  similarity: number,
  schema: SchemaDiff,
  quality: QualityDiff,
  metadata: MetadataDiff
): string {
  if (similarity > 85) return "These datasets are very similar — likely the same data with minor updates.";
  if (similarity > 70) return "These datasets share significant structure but have notable differences in data or quality.";
  if (similarity > 50) return "These datasets have moderate similarity — compare specific columns for deeper analysis.";
  return "These datasets are substantially different — they may represent different data sources or time periods.";
}

function generateComparisonRecommendations(
  schema: SchemaDiff,
  statistical: StatisticalDiff[],
  quality: QualityDiff,
  metadata: MetadataDiff,
  similarity: FeatureSimilarity[]
): string[] {
  const recs: string[] = [];

  if (schema.addedColumns > 0) {
    recs.push(
      `${schema.addedColumns} new column(s) added: ${schema.onlyInB.map((c) => c.name).join(", ")}.`
    );
  }
  if (schema.removedColumns > 0) {
    recs.push(
      `${schema.removedColumns} column(s) removed: ${schema.onlyInA.map((c) => c.name).join(", ")}.`
    );
  }
  if (schema.typeChanges > 0) {
    recs.push(
      `${schema.typeChanges} type change(s) detected. Verify that these are intentional.`
    );
  }

  const sigStats = statistical.filter((s) => s.metrics.some((m) => m.significant));
  if (sigStats.length > 0) {
    recs.push(
      `${sigStats.length} column(s) have significant statistical changes (>20%): ${sigStats.map((s) => s.column).join(", ")}.`
    );
  }

  if (Math.abs(quality.scoreDiff) > 10) {
    recs.push(
      `Quality ${quality.scoreDiff > 0 ? "improved" : "degraded"} by ${Math.abs(quality.scoreDiff)} points.`
    );
  }

  if (Math.abs(metadata.rowDiff) > metadata.rowsA * 0.1) {
    recs.push(
      `Row count changed significantly: ${metadata.rowsA.toLocaleString()} → ${metadata.rowsB.toLocaleString()} (${metadata.rowDiff > 0 ? "+" : ""}${metadata.rowDiff.toLocaleString()}).`
    );
  }

  if (recs.length === 0) {
    recs.push("No significant differences detected between the datasets.");
  }

  return recs;
}
