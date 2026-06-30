import type { ColumnType } from "@/types";

const NUMERIC_PATTERN = /^[+-]?(\d+\.?\d*|\d*\.?\d+)([eE][+-]?\d+)?$/;
const BOOLEAN_TRUE = new Set(["true", "1", "yes", "y", "t", "on"]);
const BOOLEAN_FALSE = new Set(["false", "0", "no", "n", "f", "off"]);
const BOOLEAN_VALUES = new Set([...BOOLEAN_TRUE, ...BOOLEAN_FALSE]);

const DATE_PATTERNS = [
  /^\d{4}-\d{2}-\d{2}(T|\s)/,
  /^\d{4}\/\d{2}\/\d{2}/,
  /^\d{2}\/\d{2}\/\d{4}/,
  /^\d{2}-\d{2}-\d{4}/,
  /^\d{2}\.\d{2}\.\d{4}/,
  /^\w{3}\s+\d{1,2},?\s+\d{4}/,
  /^\d{1,2}\s+\w{3}\s+\d{4}/,
  /^\d{4}\d{2}\d{2}$/,
  /^\d{12}$/,
  /^\d{10}$/,
];

const ID_PATTERNS = [
  /^[A-Z]{1,5}[_-]?\d{3,10}$/i,
  /^ID[_-]?\d+$/i,
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
  /^usr[_-]?\d+$/i,
  /^#?\d{4,}$/i,
];

const NULL_STRINGS = new Set([
  "",
  "null",
  "na",
  "n/a",
  "none",
  "nan",
  "undefined",
  "-",
  "--",
  "---",
  "missing",
  "unknown",
  "?",
  "nil",
  "<na>",
  "n.a.",
  "not available",
  "not applicable",
]);

export function isNullValue(value: string | undefined | null): boolean {
  if (value === null || value === undefined) return true;
  return NULL_STRINGS.has(String(value).trim().toLowerCase());
}

export function detectColumnType(
  values: string[],
  columnName: string
): ColumnType {
  const nonNull = values.filter((v) => !isNullValue(v));
  if (nonNull.length === 0) return "empty";

  const sampleSize = Math.min(nonNull.length, 2000);
  const sample = nonNull.slice(0, sampleSize);
  const uniqueSet = new Set(sample.map((v) => v.trim()));
  const uniqueCount = uniqueSet.size;

  if (uniqueCount <= 1) return "empty";

  if (isLikelyIdentifier(sample, columnName, uniqueCount, sampleSize)) {
    return "identifier";
  }

  if (isLikelyNumeric(sample)) return "numeric";

  if (isLikelyBoolean(sample)) return "boolean";

  if (isLikelyDatetime(sample)) return "datetime";

  if (isLikelyCategorical(sample, uniqueCount, sampleSize)) return "categorical";

  if (isLikelyText(sample)) return "text";

  return "mixed";
}

function isLikelyNumeric(sample: string[], _threshold = 0.85): boolean {
  let numericCount = 0;

  for (const v of sample) {
    const trimmed = v.trim();
    if (trimmed === "") continue;

    const withCommas = trimmed.replace(/,/g, "");
    if (NUMERIC_PATTERN.test(withCommas) || NUMERIC_PATTERN.test(trimmed)) {
      numericCount++;
    } else if (/^[\d,]+\.?\d*$/.test(trimmed)) {
      numericCount++;
    } else if (/^\$[\d,]+\.?\d*$/.test(trimmed)) {
      numericCount++;
    } else if (/^-?[\d,]+\.?\d*%$/.test(trimmed)) {
      numericCount++;
    }
  }

  return numericCount / sample.length > _threshold;
}

function isLikelyBoolean(sample: string[]): boolean {
  const lower = sample.map((v) => v.trim().toLowerCase());
  const matchCount = lower.filter((v) => BOOLEAN_VALUES.has(v)).length;
  return matchCount / sample.length > 0.9;
}

function isLikelyDatetime(sample: string[]): boolean {
  let dateCount = 0;
  for (const v of sample) {
    const trimmed = v.trim();
    const matchesPattern = DATE_PATTERNS.some((p) => p.test(trimmed));
    if (matchesPattern) {
      const parsed = new Date(trimmed);
      if (!isNaN(parsed.getTime()) && parsed.getFullYear() > 1900 && parsed.getFullYear() < 2100) {
        dateCount++;
      }
    } else {
      const parsed = new Date(trimmed);
      if (!isNaN(parsed.getTime()) && trimmed.length >= 6 && trimmed.length <= 30) {
        dateCount++;
      }
    }
  }
  return dateCount / sample.length > 0.8;
}

function isLikelyCategorical(
  sample: string[],
  uniqueCount: number,
  sampleSize: number
): boolean {
  if (uniqueCount > 100) return false;
  const ratio = uniqueCount / sampleSize;
  return ratio < 0.15;
}

function isLikelyText(sample: string[]): boolean {
  const avgLen = sample.reduce((sum, v) => sum + v.trim().length, 0) / sample.length;
  const hasSpaces = sample.filter((v) => v.includes(" ")).length / sample.length;
  return avgLen > 15 || hasSpaces > 0.5;
}

function isLikelyIdentifier(
  sample: string[],
  columnName: string,
  uniqueCount: number,
  sampleSize: number
): boolean {
  const nameLower = columnName.toLowerCase();
  const nameMatches =
    nameLower.includes("id") ||
    nameLower.includes("key") ||
    nameLower.includes("identifier") ||
    nameLower.includes("uuid") ||
    nameLower.includes("guid") ||
    nameLower.endsWith("_id") ||
    nameLower.endsWith("id") ||
    nameLower === "pk" ||
    nameLower === "sk";

  const ratio = uniqueCount / sampleSize;
  const isNearUnique = ratio > 0.95;

  const patternMatch = sample.filter((v) =>
    ID_PATTERNS.some((p) => p.test(v.trim()))
  ).length;
  const isPatternId = patternMatch / sample.length > 0.7;

  return (nameMatches && isNearUnique) || (isNearUnique && isPatternId);
}

export function isHighCardinality(
  uniqueCount: number,
  totalCount: number
): boolean {
  return uniqueCount / totalCount > 0.9 && uniqueCount > 100;
}

export function isConstant(uniqueCount: number): boolean {
  return uniqueCount <= 1;
}

export function detectDelimiter(content: string): string {
  const firstLines = content.split("\n").slice(0, 10).join("\n");
  const delimiters = [",", "\t", ";", "|", ":"];
  let bestDelimiter = ",";
  let bestScore = 0;

  for (const d of delimiters) {
    const regex = new RegExp(d === "|" ? "\\|" : d === "\t" ? "\t" : d, "g");
    const counts = firstLines
      .split("\n")
      .map((line) => (line.match(regex) || []).length);

    if (counts.length < 2) continue;
    const first = counts[0];
    if (first === 0) continue;

    const consistent = counts.filter((c) => c === first).length;
    const score = consistent / counts.length;

    if (score > bestScore || (score === bestScore && d === ",")) {
      bestScore = score;
      bestDelimiter = d;
    }
  }

  return bestDelimiter;
}

export function detectEncoding(buffer: Buffer): string {
  const sample = buffer.slice(0, 4096);

  if (sample[0] === 0xef && sample[1] === 0xbb && sample[2] === 0xbf)
    return "utf-8-bom";
  if (sample[0] === 0xff && sample[1] === 0xfe) return "utf-16le";
  if (sample[0] === 0xfe && sample[1] === 0xff) return "utf-16be";

  let nonAscii = 0;
  let validUtf8 = true;
  for (let i = 0; i < sample.length; i++) {
    if (sample[i] > 127) {
      nonAscii++;
      if (sample[i] >= 0xc0 && sample[i] <= 0xdf) {
        if (i + 1 >= sample.length || (sample[i + 1] & 0xc0) !== 0x80)
          validUtf8 = false;
      } else if (sample[i] >= 0xe0 && sample[i] <= 0xef) {
        if (
          i + 2 >= sample.length ||
          (sample[i + 1] & 0xc0) !== 0x80 ||
          (sample[i + 2] & 0xc0) !== 0x80
        )
          validUtf8 = false;
      }
    }
  }

  if (validUtf8) return "utf-8";
  if (nonAscii > 0) return "latin-1";
  return "ascii";
}
