import Papa from "papaparse";
import * as XLSX from "xlsx";
import {
  detectColumnType,
  isConstant,
  isHighCardinality,
  isNullValue,
  detectDelimiter,
  detectEncoding,
} from "./typeDetection";
import {
  computeNumericStats,
  computeHistogram,
  detectOutliers,
  computeStringStats,
  computeTopValues,
  computeValueDistribution,
} from "./statistics";
import { computeComprehensiveQualityScore } from "./quality";
import { analyzeCorrelations } from "./correlation";
import {
  analyzeNumeric,
  analyzeCategorical,
  analyzeDatetime,
  analyzeBoolean,
  analyzeText,
} from "./analyzers";
import type { ColumnProfileData, DatasetProfileData } from "@/types";

function parseCSV(
  content: string,
  delimiter?: string
): { rows: string[][]; detectedDelimiter: string } {
  const detectedDelimiter = delimiter || detectDelimiter(content);
  const result = Papa.parse<string[]>(content, {
    header: false,
    skipEmptyLines: false,
    dynamicTyping: false,
    delimiter: detectedDelimiter,
  });
  return { rows: result.data as string[][], detectedDelimiter };
}

function parseExcel(buffer: Buffer): {
  rows: string[][];
  sheetNames: string[];
} {
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const sheetNames = workbook.SheetNames;
  const sheet = workbook.Sheets[sheetNames[0]];
  const data = XLSX.utils.sheet_to_csv(sheet);
  const { rows } = parseCSV(data, ",");
  return { rows, sheetNames };
}

export async function profileDataset(
  filePath: string,
  mimeType: string
): Promise<DatasetProfileData> {
  const fs = await import("fs");

  let rawRows: string[][];
  let sheetNames: string[] | undefined;
  let detectedDelimiter = ",";
  let encoding = "utf-8";

  const isExcel =
    mimeType ===
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
    mimeType === "application/vnd.ms-excel";

  if (isExcel) {
    const buffer = fs.readFileSync(filePath);
    const result = parseExcel(buffer);
    rawRows = result.rows;
    sheetNames = result.sheetNames;
    encoding = "utf-8";
  } else {
    const buffer = fs.readFileSync(filePath);
    encoding = detectEncoding(buffer);
    const content = buffer.toString(
      encoding === "latin-1" ? "latin1" : "utf-8"
    );
    const result = parseCSV(content);
    rawRows = result.rows;
    detectedDelimiter = result.detectedDelimiter;
  }

  if (rawRows.length === 0) {
    return emptyProfile();
  }

  const headerRow = rawRows[0];
  const dataRows = rawRows.slice(1).filter((row) =>
    row.some((cell) => !isNullValue(cell))
  );

  const columnCount = headerRow.length;
  const totalRows = dataRows.length;

  if (totalRows === 0 || columnCount === 0) {
    return emptyProfile();
  }

  const columns: string[][] = [];
  for (let col = 0; col < columnCount; col++) {
    columns.push(dataRows.map((row) => row[col] ?? ""));
  }

  const columnProfiles: ColumnProfileData[] = [];
  const numericColumns: Record<string, number[]> = {};
  let totalMissingCells = 0;

  for (let colIdx = 0; colIdx < columnCount; colIdx++) {
    const colName = headerRow[colIdx] || `Column_${colIdx + 1}`;
    const colValues = columns[colIdx];

    const nullCount = colValues.filter((v) => isNullValue(v)).length;
    const nonNullValues = colValues.filter((v) => !isNullValue(v));
    const nullPercentage = (nullCount / totalRows) * 100;
    totalMissingCells += nullCount;

    const uniqueSet = new Set(nonNullValues.map((v) => v.trim()));
    const uniqueCount = uniqueSet.size;

    const detectedType = detectColumnType(nonNullValues, colName);
    const constant = isConstant(uniqueCount);
    const highCard = isHighCardinality(uniqueCount, totalRows);
    const isId = detectedType === "identifier";

    const profile: ColumnProfileData = {
      columnName: colName,
      columnIndex: colIdx,
      detectedType: detectedType === "identifier" ? "text" : detectedType,
      nonNullCount: nonNullValues.length,
      nullCount,
      nullPercentage: Math.round(nullPercentage * 100) / 100,
      uniqueCount,
      isConstant: constant,
      isHighCardinality: highCard,
      isIdentifier: isId,
      cardinalityRatio:
        nonNullValues.length > 0
          ? Math.round((uniqueCount / nonNullValues.length) * 1000) / 1000
          : 0,
    };

    if (detectedType === "numeric" && nonNullValues.length > 0) {
      const nums = nonNullValues
        .map((v) => Number(v.replace(/,/g, "").replace(/%/g, "").trim()))
        .filter((n) => !isNaN(n));
      if (nums.length > 0) {
        const stats = computeNumericStats(nums);
        profile.mean = Math.round(stats.mean * 1000) / 1000;
        profile.median = Math.round(stats.median * 1000) / 1000;
        profile.std = Math.round(stats.std * 1000) / 1000;
        profile.variance = Math.round(stats.variance * 1000) / 1000;
        profile.min = String(stats.min);
        profile.max = String(stats.max);
        profile.range = Math.round(stats.range * 1000) / 1000;
        profile.q25 = Math.round(stats.q25 * 1000) / 1000;
        profile.q50 = Math.round(stats.q50 * 1000) / 1000;
        profile.q75 = Math.round(stats.q75 * 1000) / 1000;
        profile.iqr = Math.round(stats.iqr * 1000) / 1000;
        profile.skewness = Math.round(stats.skewness * 1000) / 1000;
        profile.kurtosis = Math.round(stats.kurtosis * 1000) / 1000;
        profile.mode = stats.mode !== null ? String(stats.mode) : undefined;
        profile.sum = Math.round(stats.sum * 1000) / 1000;
        profile.zeroCount = stats.zeroCount;
        profile.negativeCount = stats.negativeCount;
        profile.positiveCount = stats.positiveCount;
        profile.coefficientOfVariation = stats.coefficientOfVariation;
        profile.histogram = computeHistogram(nums);
        profile.outliers = detectOutliers(nums);
        numericColumns[colName] = nums;

        profile.numericAnalysis = analyzeNumeric(nums);
      }
    }

    if (
      (detectedType === "categorical" || detectedType === "boolean") &&
      nonNullValues.length > 0
    ) {
      profile.topValues = computeTopValues(nonNullValues);
      profile.valueDistribution = computeValueDistribution(nonNullValues);

      if (detectedType === "boolean") {
        profile.booleanAnalysis = analyzeBoolean(nonNullValues, totalRows);
      } else {
        profile.categoricalAnalysis = analyzeCategorical(
          nonNullValues,
          totalRows
        );
      }
    }

    if (
      (detectedType === "text" || detectedType === "identifier") &&
      nonNullValues.length > 0
    ) {
      const strStats = computeStringStats(nonNullValues);
      profile.minLength = strStats.minLength;
      profile.maxLength = strStats.maxLength;
      profile.avgLength = Math.round(strStats.avgLength * 10) / 10;
      profile.emptyCount = strStats.emptyCount;
      profile.whitespaceCount = strStats.whitespaceCount;
      profile.patternSummary = strStats.patternSummary;

      if (!isId) {
        profile.textAnalysis = analyzeText(nonNullValues, totalRows);
      }
    }

    if (detectedType === "datetime" && nonNullValues.length > 0) {
      const dates = nonNullValues
        .map((v) => new Date(v.trim()))
        .filter((d) => !isNaN(d.getTime()))
        .sort((a, b) => a.getTime() - b.getTime());
      if (dates.length > 0) {
        profile.dateMin = dates[0].toISOString();
        profile.dateMax = dates[dates.length - 1].toISOString();
        profile.dateRangeDays = Math.ceil(
          (dates[dates.length - 1].getTime() - dates[0].getTime()) /
            (1000 * 60 * 60 * 24)
        );
      }

      profile.datetimeAnalysis = analyzeDatetime(nonNullValues, totalRows);
    }

    if (detectedType === "mixed" && nonNullValues.length > 0) {
      profile.topValues = computeTopValues(nonNullValues, 5);
    }

    columnProfiles.push(profile);
  }

  const rowStrings = dataRows.map((r) => r.join("|||"));
  const uniqueRows = new Set(rowStrings);
  const duplicateRows = totalRows - uniqueRows.size;

  const totalCells = totalRows * columnCount;
  const missingPercentage =
    totalCells === 0 ? 0 : (totalMissingCells / totalCells) * 100;
  const duplicatePercentage =
    totalRows === 0 ? 0 : (duplicateRows / totalRows) * 100;

  const typeBreakdown: Record<string, number> = {};
  for (const col of columnProfiles) {
    const type = col.isIdentifier ? "identifier" : col.detectedType;
    typeBreakdown[type] = (typeBreakdown[type] || 0) + 1;
  }

  let correlationMatrix: Record<string, Record<string, number>> | undefined;
  if (Object.keys(numericColumns).length >= 2) {
    const corrResult = analyzeCorrelations(numericColumns);
    correlationMatrix = corrResult.matrix.pearson;
  }

  const qualityResult = computeComprehensiveQualityScore({
    totalCells,
    missingCells: totalMissingCells,
    totalRows,
    duplicateRows,
    totalColumns: columnCount,
    columns: columnProfiles.map((c) => ({
      detectedType: c.detectedType,
      nullPercentage: c.nullPercentage,
      isConstant: c.isConstant,
      isHighCardinality: c.isHighCardinality,
      columnName: c.columnName,
      outlierPercentage: c.outliers
        ? (c.outliers.length / c.nonNullCount) * 100
        : undefined,
      uniqueCount: c.uniqueCount,
      variance: c.variance,
    })),
  });

  const score = qualityResult.overallScore;
  const breakdown = qualityResult.breakdown;

  const memoryUsage = Buffer.byteLength(JSON.stringify(rawRows), "utf-8");

  return {
    totalRows,
    totalColumns: columnCount,
    totalMissingCells,
    missingPercentage: Math.round(missingPercentage * 100) / 100,
    duplicateRows,
    duplicatePercentage: Math.round(duplicatePercentage * 100) / 100,
    memoryUsageBytes: memoryUsage,
    typeBreakdown,
    qualityScore: score,
    qualityBreakdown: breakdown,
    correlationMatrix,
    columns: columnProfiles,
    sheetNames,
    delimiter: detectedDelimiter,
    encoding,
  };
}

function emptyProfile(): DatasetProfileData {
  return {
    totalRows: 0,
    totalColumns: 0,
    totalMissingCells: 0,
    missingPercentage: 0,
    duplicateRows: 0,
    duplicatePercentage: 0,
    memoryUsageBytes: 0,
    typeBreakdown: {},
    qualityScore: 0,
    qualityBreakdown: {
      completeness: { score: 0, weight: 0.4, description: "" },
      uniqueness: { score: 0, weight: 0.25, description: "" },
      consistency: { score: 0, weight: 0.2, description: "" },
      structure: { score: 0, weight: 0.15, description: "" },
    },
    columns: [],
  };
}
