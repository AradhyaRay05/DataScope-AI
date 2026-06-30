export interface NumericStats {
  mean: number;
  median: number;
  std: number;
  variance: number;
  min: number;
  max: number;
  range: number;
  q25: number;
  q50: number;
  q75: number;
  iqr: number;
  skewness: number;
  kurtosis: number;
  mode: number | null;
  sum: number;
  zeroCount: number;
  negativeCount: number;
  positiveCount: number;
  coefficientOfVariation: number;
}

export function computeNumericStats(values: number[]): NumericStats {
  const sorted = [...values].sort((a, b) => a - b);
  const n = sorted.length;

  const sum = sorted.reduce((a, b) => a + b, 0);
  const mean = sum / n;

  const median =
    n % 2 === 0
      ? (sorted[n / 2 - 1] + sorted[n / 2]) / 2
      : sorted[Math.floor(n / 2)];

  const variance = sorted.reduce((acc, v) => acc + (v - mean) ** 2, 0) / n;
  const std = Math.sqrt(variance);

  const q25 = percentile(sorted, 25);
  const q50 = percentile(sorted, 50);
  const q75 = percentile(sorted, 75);

  const skewness =
    std === 0
      ? 0
      : sorted.reduce((acc, v) => acc + ((v - mean) / std) ** 3, 0) / n;

  const kurtosis =
    std === 0
      ? 0
      : sorted.reduce((acc, v) => acc + ((v - mean) / std) ** 4, 0) / n - 3;

  const freq = new Map<number, number>();
  for (const v of sorted) {
    freq.set(v, (freq.get(v) || 0) + 1);
  }
  let maxFreq = 0;
  let mode: number | null = null;
  for (const [val, count] of freq) {
    if (count > maxFreq) {
      maxFreq = count;
      mode = val;
    }
  }
  if (maxFreq === 1) mode = null;

  const zeroCount = values.filter((v) => v === 0).length;
  const negativeCount = values.filter((v) => v < 0).length;
  const positiveCount = values.filter((v) => v > 0).length;
  const range = sorted[n - 1] - sorted[0];
  const iqr = q75 - q25;
  const coefficientOfVariation = mean !== 0 ? (std / Math.abs(mean)) * 100 : 0;

  return {
    mean,
    median,
    std,
    variance,
    min: sorted[0],
    max: sorted[n - 1],
    range,
    q25,
    q50,
    q75,
    iqr,
    skewness,
    kurtosis,
    mode,
    sum,
    zeroCount,
    negativeCount,
    positiveCount,
    coefficientOfVariation: Math.round(coefficientOfVariation * 100) / 100,
  };
}

function percentile(sorted: number[], p: number): number {
  const index = (p / 100) * (sorted.length - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  if (lower === upper) return sorted[lower];
  return sorted[lower] * (upper - index) + sorted[upper] * (index - lower);
}

export function computeHistogram(
  values: number[],
  maxBins = 30
): Array<{ bin: string; count: number }> {
  if (values.length === 0) return [];

  const min = Math.min(...values);
  const max = Math.max(...values);
  if (min === max) return [{ bin: min.toFixed(2), count: values.length }];

  const binCount = Math.min(
    maxBins,
    Math.ceil(1 + 3.322 * Math.log10(values.length))
  );
  const binWidth = (max - min) / binCount;

  const bins: Array<{ bin: string; count: number }> = [];
  for (let i = 0; i < binCount; i++) {
    const low = min + i * binWidth;
    const high = low + binWidth;
    const label = `${low.toFixed(1)}-${high.toFixed(1)}`;
    const count = values.filter((v) =>
      i === binCount - 1 ? v >= low && v <= high : v >= low && v < high
    ).length;
    bins.push({ bin: label, count });
  }

  return bins;
}

export function detectOutliers(values: number[]): number[] {
  const sorted = [...values].sort((a, b) => a - b);
  const q1 = percentile(sorted, 25);
  const q3 = percentile(sorted, 75);
  const iqr = q3 - q1;
  const lowerBound = q1 - 1.5 * iqr;
  const upperBound = q3 + 1.5 * iqr;
  return values.filter((v) => v < lowerBound || v > upperBound);
}

export function computeCorrelationMatrix(
  columns: Record<string, number[]>
): Record<string, Record<string, number>> {
  const names = Object.keys(columns);
  const matrix: Record<string, Record<string, number>> = {};

  for (const a of names) {
    matrix[a] = {};
    for (const b of names) {
      if (a === b) {
        matrix[a][b] = 1;
        continue;
      }
      matrix[a][b] = pearsonCorrelation(columns[a], columns[b]);
    }
  }

  return matrix;
}

function pearsonCorrelation(x: number[], y: number[]): number {
  const n = Math.min(x.length, y.length);
  if (n < 2) return 0;

  let sumX = 0,
    sumY = 0,
    sumXY = 0,
    sumX2 = 0,
    sumY2 = 0;
  let validN = 0;

  for (let i = 0; i < n; i++) {
    if (isNaN(x[i]) || isNaN(y[i])) continue;
    sumX += x[i];
    sumY += y[i];
    sumXY += x[i] * y[i];
    sumX2 += x[i] * x[i];
    sumY2 += y[i] * y[i];
    validN++;
  }

  if (validN < 2) return 0;

  const numerator = validN * sumXY - sumX * sumY;
  const denominator = Math.sqrt(
    (validN * sumX2 - sumX * sumX) * (validN * sumY2 - sumY * sumY)
  );

  if (denominator === 0) return 0;
  return numerator / denominator;
}

export function computeStringStats(values: string[]): {
  minLength: number;
  maxLength: number;
  avgLength: number;
  emptyCount: number;
  whitespaceCount: number;
  patternSummary: string;
} {
  const lengths = values.map((v) => v.length);
  const emptyCount = values.filter((v) => v.trim() === "").length;
  const whitespaceCount = values.filter(
    (v) => v !== v.trim() && v.trim() !== ""
  ).length;

  const patterns = new Map<string, number>();
  for (const v of values.slice(0, 500)) {
    const pattern = v
      .replace(/[a-zA-Z]/g, "a")
      .replace(/[0-9]/g, "9")
      .replace(/\s/g, " ");
    const short = pattern.length > 30 ? pattern.slice(0, 30) + "..." : pattern;
    patterns.set(short, (patterns.get(short) || 0) + 1);
  }

  const topPatterns = [...patterns.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([p, c]) => `${p} (${c})`)
    .join(", ");

  return {
    minLength: Math.min(...lengths),
    maxLength: Math.max(...lengths),
    avgLength: lengths.reduce((a, b) => a + b, 0) / lengths.length,
    emptyCount,
    whitespaceCount,
    patternSummary: topPatterns,
  };
}

export function computeTopValues(
  values: string[],
  limit = 10
): Array<{ value: string; count: number; percentage: number }> {
  const freq = new Map<string, number>();
  for (const v of values) {
    const key = v.trim() || "(empty)";
    freq.set(key, (freq.get(key) || 0) + 1);
  }

  return Array.from(freq.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([value, count]) => ({
      value,
      count,
      percentage: (count / values.length) * 100,
    }));
}

export function computeValueDistribution(
  values: string[],
  limit = 20
): Record<string, number> {
  const freq = new Map<string, number>();
  for (const v of values) {
    const key = v.trim() || "(empty)";
    freq.set(key, (freq.get(key) || 0) + 1);
  }

  const sorted = [...freq.entries()].sort((a, b) => b[1] - a[1]);
  const result: Record<string, number> = {};
  for (const [val, count] of sorted.slice(0, limit)) {
    result[val] = count;
  }
  return result;
}
