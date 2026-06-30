export interface DuplicateRow {
  rowIndex: number;
  duplicateOf: number;
  matchPercentage: number;
}

export interface DuplicateColumn {
  columnA: string;
  columnB: string;
  similarity: number;
  isExact: boolean;
  matchingRows: number;
  totalRows: number;
}

export interface DuplicateGroup {
  representativeIndex: number;
  duplicateIndices: number[];
  size: number;
  columnValues: Record<string, string>;
}

export interface DuplicateDatasetMatch {
  datasetId: string;
  datasetName: string;
  similarity: number;
  matchingColumns: string[];
  matchingRows: number;
}

export interface DuplicateAnalysisResult {
  summary: {
    totalRows: number;
    duplicateRows: number;
    duplicatePercentage: number;
    duplicateGroups: number;
    largestDuplicateGroup: number;
    totalColumns: number;
    duplicateColumnPairs: number;
    nearDuplicateRows: number;
    nearDuplicatePercentage: number;
  };
  rowDuplicates: {
    exact: DuplicateGroup[];
    near: DuplicateRow[];
  };
  columnDuplicates: DuplicateColumn[];
  recommendations: string[];
  warnings: string[];
}

export function analyzeDuplicates(
  dataRows: string[][],
  columnNames: string[],
  totalRows: number,
  totalColumns: number
): DuplicateAnalysisResult {
  const exactGroups = findExactDuplicateGroups(dataRows, totalColumns);
  const totalExactDupes = exactGroups.reduce(
    (sum, g) => sum + g.duplicateIndices.length,
    0
  );

  const nearDuplicates = findNearDuplicateRows(
    dataRows,
    totalColumns,
    Math.min(totalRows, 10000)
  );

  const columnDupes = findDuplicateColumns(dataRows, columnNames, totalColumns);

  const warnings = generateDuplicateWarnings(
    totalExactDupes,
    totalRows,
    nearDuplicates.length,
    columnDupes
  );

  const recommendations = generateDuplicateRecommendations(
    totalExactDupes,
    totalRows,
    nearDuplicates.length,
    columnDupes,
    exactGroups
  );

  return {
    summary: {
      totalRows,
      duplicateRows: totalExactDupes,
      duplicatePercentage:
        totalRows > 0
          ? Math.round((totalExactDupes / totalRows) * 10000) / 100
          : 0,
      duplicateGroups: exactGroups.length,
      largestDuplicateGroup:
        exactGroups.length > 0
          ? Math.max(...exactGroups.map((g) => g.size))
          : 0,
      totalColumns,
      duplicateColumnPairs: columnDupes.filter((d) => d.isExact).length,
      nearDuplicateRows: nearDuplicates.length,
      nearDuplicatePercentage:
        totalRows > 0
          ? Math.round((nearDuplicates.length / totalRows) * 10000) / 100
          : 0,
    },
    rowDuplicates: {
      exact: exactGroups.slice(0, 50),
      near: nearDuplicates.slice(0, 50),
    },
    columnDuplicates: columnDupes
      .filter((d) => d.similarity > 0.8)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 20),
    recommendations,
    warnings,
  };
}

function findExactDuplicateGroups(
  dataRows: string[][],
  totalColumns: number
): DuplicateGroup[] {
  const rowMap = new Map<string, number[]>();

  for (let i = 0; i < dataRows.length; i++) {
    const key = dataRows[i].join("|||");
    const existing = rowMap.get(key);
    if (existing) {
      existing.push(i);
    } else {
      rowMap.set(key, [i]);
    }
  }

  const groups: DuplicateGroup[] = [];
  for (const [key, indices] of rowMap) {
    if (indices.length > 1) {
      const values: Record<string, string> = {};
      const parts = key.split("|||");
      for (let c = 0; c < Math.min(parts.length, totalColumns); c++) {
        values[`col_${c}`] = parts[c];
      }
      groups.push({
        representativeIndex: indices[0],
        duplicateIndices: indices.slice(1),
        size: indices.length,
        columnValues: values,
      });
    }
  }

  return groups.sort((a, b) => b.size - a.size);
}

function findNearDuplicateRows(
  dataRows: string[][],
  totalColumns: number,
  sampleSize: number
): DuplicateRow[] {
  const nearDupes: DuplicateRow[] = [];
  const threshold = 0.9;

  const step = dataRows.length > sampleSize
    ? Math.ceil(dataRows.length / sampleSize)
    : 1;
  const sampledIndices: number[] = [];
  for (let i = 0; i < dataRows.length; i += step) {
    sampledIndices.push(i);
  }

  for (let i = 0; i < sampledIndices.length; i++) {
    for (let j = i + 1; j < sampledIndices.length; j++) {
      const idxA = sampledIndices[i];
      const idxB = sampledIndices[j];
      const rowA = dataRows[idxA];
      const rowB = dataRows[idxB];

      if (!rowA || !rowB) continue;

      let matches = 0;
      const cols = Math.min(rowA.length, rowB.length, totalColumns);
      for (let c = 0; c < cols; c++) {
        if ((rowA[c] ?? "") === (rowB[c] ?? "")) {
          matches++;
        }
      }

      const similarity = cols > 0 ? matches / cols : 0;
      if (similarity >= threshold && similarity < 1) {
        nearDupes.push({
          rowIndex: idxB,
          duplicateOf: idxA,
          matchPercentage: Math.round(similarity * 10000) / 100,
        });
      }
    }
  }

  return nearDupes;
}

function findDuplicateColumns(
  dataRows: string[][],
  columnNames: string[],
  totalColumns: number
): DuplicateColumn[] {
  const results: DuplicateColumn[] = [];
  const colCount = Math.min(totalColumns, columnNames.length, 100);

  const columnSamples: string[][] = [];
  for (let c = 0; c < colCount; c++) {
    const sample = dataRows.slice(0, 5000).map((row) => row[c] ?? "");
    columnSamples.push(sample);
  }

  for (let i = 0; i < colCount; i++) {
    for (let j = i + 1; j < colCount; j++) {
      const colA = columnNames[i];
      const colB = columnNames[j];
      const sampleA = columnSamples[i];
      const sampleB = columnSamples[j];
      const n = Math.min(sampleA.length, sampleB.length);

      if (n === 0) continue;

      let exactMatches = 0;
      let matches = 0;

      for (let r = 0; r < n; r++) {
        const a = sampleA[r].trim().toLowerCase();
        const b = sampleB[r].trim().toLowerCase();
        if (a === b) {
          exactMatches++;
          matches++;
        } else if (a === "" && b === "") {
          matches++;
        }
      }

      const similarity = matches / n;
      const isExact = exactMatches === n;

      if (similarity > 0.8) {
        results.push({
          columnA: colA,
          columnB: colB,
          similarity: Math.round(similarity * 10000) / 100,
          isExact,
          matchingRows: exactMatches,
          totalRows: n,
        });
      }
    }
  }

  return results.sort((a, b) => b.similarity - a.similarity);
}

function generateDuplicateWarnings(
  exactDupes: number,
  totalRows: number,
  nearDupes: number,
  columnDupes: DuplicateColumn[]
): string[] {
  const warnings: string[] = [];
  const pct = totalRows > 0 ? (exactDupes / totalRows) * 100 : 0;

  if (pct > 20) {
    warnings.push(
      `${exactDupes} exact duplicate rows detected (${pct.toFixed(1)}%). This is a significant level of duplication.`
    );
  } else if (pct > 5) {
    warnings.push(
      `${exactDupes} exact duplicate rows detected (${pct.toFixed(1)}%). Consider deduplication.`
    );
  }

  if (nearDupes > 0) {
    warnings.push(
      `${nearDupes} near-duplicate rows found (>90% column match). These may indicate data entry errors or fuzzy duplicates.`
    );
  }

  const exactColDupes = columnDupes.filter((d) => d.isExact);
  if (exactColDupes.length > 0) {
    warnings.push(
      `${exactColDupes.length} column pair(s) are identical: ${exactColDupes.map((d) => `${d.columnA} = ${d.columnB}`).join("; ")}. One of each pair can be removed.`
    );
  }

  return warnings;
}

function generateDuplicateRecommendations(
  exactDupes: number,
  totalRows: number,
  nearDupes: number,
  columnDupes: DuplicateColumn[],
  groups: DuplicateGroup[]
): string[] {
  const recs: string[] = [];

  if (exactDupes === 0 && nearDupes === 0) {
    recs.push("No duplicate rows detected. The dataset contains all unique records.");
  }

  if (exactDupes > 0) {
    recs.push(
      `Remove ${exactDupes} exact duplicate rows to reduce dataset size from ${totalRows} to ${totalRows - exactDupes} rows.`
    );
  }

  if (groups.length > 0 && groups[0].size > 5) {
    recs.push(
      `The largest duplicate group has ${groups[0].size} identical rows. Investigate whether this is intentional (e.g., repeated measurements) or a data pipeline error.`
    );
  }

  if (nearDupes > exactDupes * 2) {
    recs.push(
      "Many near-duplicates found. Consider fuzzy deduplication or standardizing values before exact deduplication."
    );
  }

  const exactColDupes = columnDupes.filter((d) => d.isExact);
  if (exactColDupes.length > 0) {
    recs.push(
      `Drop duplicate columns to reduce dimensionality: ${exactColDupes.map((d) => d.columnB).join(", ")}.`
    );
  }

  const highSimCols = columnDupes.filter(
    (d) => !d.isExact && d.similarity > 95
  );
  if (highSimCols.length > 0) {
    recs.push(
      `Column pairs with >95% similarity may represent the same feature encoded differently: ${highSimCols.map((d) => `${d.columnA}~${d.columnB}`).join(", ")}.`
    );
  }

  return recs;
}
