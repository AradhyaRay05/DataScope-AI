export interface NumericAnalysis {
  centralTendency: {
    mean: number;
    median: number;
    mode: number | null;
    trimmedMean: number;
  };
  dispersion: {
    std: number;
    variance: number;
    range: number;
    iqr: number;
    mad: number;
    coefficientOfVariation: number;
  };
  position: {
    min: number;
    max: number;
    q1: number;
    q2: number;
    q3: number;
    p5: number;
    p10: number;
    p90: number;
    p95: number;
    p99: number;
  };
  shape: {
    skewness: number;
    kurtosis: number;
    skewnessInterpretation: string;
    kurtosisInterpretation: string;
    distributionShape: string;
  };
  counts: {
    total: number;
    zeroCount: number;
    negativeCount: number;
    positiveCount: number;
    sum: number;
  };
  outliers: {
    iqrOutliers: number[];
    zScoreOutliers: number[];
    iqrCount: number;
    zScoreCount: number;
    iqrPercentage: number;
    zScorePercentage: number;
    lowerFence: number;
    upperFence: number;
  };
  distribution: {
    histogram: Array<{ bin: string; count: number; density: number }>;
    normalityIndicator: string;
    isLikelyNormal: boolean;
  };
  percentiles: Record<string, number>;
  preprocessingSuggestions: string[];
}

export function analyzeNumeric(values: number[]): NumericAnalysis {
  const sorted = [...values].sort((a, b) => a - b);
  const n = sorted.length;

  const sum = sorted.reduce((a, b) => a + b, 0);
  const mean = sum / n;
  const median = computePercentile(sorted, 50);

  const trimmedMean = computeTrimmedMean(sorted, 0.05);

  const variance = sorted.reduce((acc, v) => acc + (v - mean) ** 2, 0) / n;
  const std = Math.sqrt(variance);
  const mad = computeMAD(sorted, median);
  const range = sorted[n - 1] - sorted[0];
  const q1 = computePercentile(sorted, 25);
  const q3 = computePercentile(sorted, 75);
  const iqr = q3 - q1;
  const cv = mean !== 0 ? (std / Math.abs(mean)) * 100 : 0;

  const min = sorted[0];
  const max = sorted[n - 1];
  const p5 = computePercentile(sorted, 5);
  const p10 = computePercentile(sorted, 10);
  const p90 = computePercentile(sorted, 90);
  const p95 = computePercentile(sorted, 95);
  const p99 = computePercentile(sorted, 99);

  const skewness = computeSkewness(sorted, mean, std);
  const kurtosis = computeKurtosis(sorted, mean, std);

  const mode = computeMode(sorted);

  const zeroCount = values.filter((v) => v === 0).length;
  const negativeCount = values.filter((v) => v < 0).length;
  const positiveCount = values.filter((v) => v > 0).length;

  const lowerFence = q1 - 1.5 * iqr;
  const upperFence = q3 + 1.5 * iqr;
  const iqrOutliers = values.filter(
    (v) => v < lowerFence || v > upperFence
  );

  const zScoreOutliers = std > 0
    ? values.filter((v) => Math.abs((v - mean) / std) > 3)
    : [];

  const histogram = computeEnhancedHistogram(sorted);
  const { normalityIndicator, isLikelyNormal } = assessNormality(
    skewness,
    kurtosis,
    n
  );
  const distributionShape = interpretDistributionShape(skewness, kurtosis);

  const percentiles: Record<string, number> = {};
  for (const p of [1, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95, 99]) {
    percentiles[`p${p}`] = Math.round(computePercentile(sorted, p) * 1000) / 1000;
  }

  const preprocessingSuggestions = generateNumericSuggestions({
    skewness,
    kurtosis,
    iqrOutliers: iqrOutliers.length,
    zScoreOutliers: zScoreOutliers.length,
    n,
    range,
    mean,
    std,
    cv,
    zeroCount,
    negativeCount,
    positiveCount,
    missingPercentage: 0,
  });

  return {
    centralTendency: {
      mean: round(mean),
      median: round(median),
      mode: mode !== null ? round(mode) : null,
      trimmedMean: round(trimmedMean),
    },
    dispersion: {
      std: round(std),
      variance: round(variance),
      range: round(range),
      iqr: round(iqr),
      mad: round(mad),
      coefficientOfVariation: round(cv),
    },
    position: {
      min,
      max,
      q1: round(q1),
      q2: round(median),
      q3: round(q3),
      p5: round(p5),
      p10: round(p10),
      p90: round(p90),
      p95: round(p95),
      p99: round(p99),
    },
    shape: {
      skewness: round(skewness),
      kurtosis: round(kurtosis),
      skewnessInterpretation: interpretSkewness(skewness),
      kurtosisInterpretation: interpretKurtosis(kurtosis),
      distributionShape,
    },
    counts: {
      total: n,
      zeroCount,
      negativeCount,
      positiveCount,
      sum: round(sum),
    },
    outliers: {
      iqrOutliers: iqrOutliers.slice(0, 50),
      zScoreOutliers: zScoreOutliers.slice(0, 50),
      iqrCount: iqrOutliers.length,
      zScoreCount: zScoreOutliers.length,
      iqrPercentage: round((iqrOutliers.length / n) * 100),
      zScorePercentage: round((zScoreOutliers.length / n) * 100),
      lowerFence: round(lowerFence),
      upperFence: round(upperFence),
    },
    distribution: {
      histogram,
      normalityIndicator,
      isLikelyNormal,
    },
    percentiles,
    preprocessingSuggestions,
  };
}

function round(v: number): number {
  return Math.round(v * 1000) / 1000;
}

function computePercentile(sorted: number[], p: number): number {
  const index = (p / 100) * (sorted.length - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  if (lower === upper) return sorted[lower];
  return sorted[lower] * (upper - index) + sorted[upper] * (index - lower);
}

function computeTrimmedMean(sorted: number[], trimPercent: number): number {
  const trimCount = Math.floor(sorted.length * trimPercent);
  if (trimCount * 2 >= sorted.length) return sorted[Math.floor(sorted.length / 2)];
  const trimmed = sorted.slice(trimCount, sorted.length - trimCount);
  return trimmed.reduce((a, b) => a + b, 0) / trimmed.length;
}

function computeMAD(sorted: number[], median: number): number {
  const deviations = sorted.map((v) => Math.abs(v - median));
  deviations.sort((a, b) => a - b);
  return computePercentile(deviations, 50);
}

function computeSkewness(sorted: number[], mean: number, std: number): number {
  if (std === 0) return 0;
  const n = sorted.length;
  const m3 =
    sorted.reduce((acc, v) => acc + ((v - mean) / std) ** 3, 0) / n;
  return m3;
}

function computeKurtosis(sorted: number[], mean: number, std: number): number {
  if (std === 0) return 0;
  const n = sorted.length;
  const m4 =
    sorted.reduce((acc, v) => acc + ((v - mean) / std) ** 4, 0) / n;
  return m4 - 3;
}

function computeMode(sorted: number[]): number | null {
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
  if (maxFreq <= 1) return null;
  return mode;
}

function interpretSkewness(s: number): string {
  if (Math.abs(s) < 0.5) return "approximately symmetric";
  if (Math.abs(s) < 1) return s > 0 ? "moderately right-skewed" : "moderately left-skewed";
  return s > 0 ? "highly right-skewed" : "highly left-skewed";
}

function interpretKurtosis(k: number): string {
  if (Math.abs(k) < 0.5) return "approximately mesokurtic (normal-like tails)";
  if (k > 0) return k > 3 ? "very leptokurtic (heavy tails, sharp peak)" : "leptokurtic (heavier tails than normal)";
  return k < -3 ? "very platykurtic (light tails, flat)" : "platykurtic (lighter tails than normal)";
}

function interpretDistributionShape(skewness: number, kurtosis: number): string {
  if (Math.abs(skewness) < 0.5 && Math.abs(kurtosis) < 1) return "approximately normal";
  if (skewness > 1) return "right-skewed (long right tail)";
  if (skewness < -1) return "left-skewed (long left tail)";
  if (kurtosis > 2) return "peaked with heavy tails";
  if (kurtosis < -1) return "flat/uniform-like";
  return "moderately non-normal";
}

function assessNormality(
  skewness: number,
  kurtosis: number,
  n: number
): { normalityIndicator: string; isLikelyNormal: boolean } {
  const skewOK = Math.abs(skewness) < 0.5;
  const kurtOK = Math.abs(kurtosis) < 1;
  const isLikelyNormal = skewOK && kurtOK && n >= 30;

  let indicator: string;
  if (isLikelyNormal) indicator = "likely_normal";
  else if (Math.abs(skewness) < 1 && Math.abs(kurtosis) < 2) indicator = "approximately_normal";
  else if (Math.abs(skewness) > 3 || Math.abs(kurtosis) > 10) indicator = "significantly_non_normal";
  else indicator = "non_normal";

  return { normalityIndicator: indicator, isLikelyNormal };
}

function computeEnhancedHistogram(
  sorted: number[],
  maxBins = 30
): Array<{ bin: string; count: number; density: number }> {
  const n = sorted.length;
  if (n === 0) return [];
  const min = sorted[0];
  const max = sorted[n - 1];
  if (min === max) return [{ bin: min.toFixed(2), count: n, density: 1 }];

  const binCount = Math.min(maxBins, Math.ceil(1 + 3.322 * Math.log10(n)));
  const binWidth = (max - min) / binCount;

  const bins: Array<{ bin: string; count: number; density: number }> = [];
  let binIdx = 0;
  let count = 0;

  for (let i = 0; i < n; i++) {
    const binEnd = min + (binIdx + 1) * binWidth;
    if (sorted[i] < binEnd || binIdx === binCount - 1) {
      count++;
    } else {
      const binStart = min + binIdx * binWidth;
      bins.push({
        bin: `${binStart.toFixed(1)}-${binEnd.toFixed(1)}`,
        count,
        density: round(count / (n * binWidth)),
      });
      binIdx++;
      count = 1;
    }
  }
  if (count > 0) {
    const binStart = min + binIdx * binWidth;
    const binEnd = min + (binIdx + 1) * binWidth;
    bins.push({
      bin: `${binStart.toFixed(1)}-${binEnd.toFixed(1)}`,
      count,
      density: round(count / (n * binWidth)),
    });
  }

  return bins;
}

function generateNumericSuggestions(stats: {
  skewness: number;
  kurtosis: number;
  iqrOutliers: number;
  zScoreOutliers: number;
  n: number;
  range: number;
  mean: number;
  std: number;
  cv: number;
  zeroCount: number;
  negativeCount: number;
  positiveCount: number;
  missingPercentage: number;
}): string[] {
  const suggestions: string[] = [];

  if (Math.abs(stats.skewness) > 1) {
    suggestions.push(
      `Distribution is ${stats.skewness > 0 ? "right" : "left"}-skewed (skewness=${stats.skewness.toFixed(2)}). Consider log or Box-Cox transformation to reduce skewness.`
    );
  }

  if (stats.iqrOutliers > stats.n * 0.05) {
    suggestions.push(
      `${stats.iqrOutliers} outlier(s) detected (${((stats.iqrOutliers / stats.n) * 100).toFixed(1)}%). Consider capping (winsorizing) at the 1st/99th percentile or removing extreme values.`
    );
  }

  if (stats.zScoreOutliers > 0) {
    suggestions.push(
      `${stats.zScoreOutliers} extreme outlier(s) detected (|z-score| > 3). Investigate these values for data entry errors.`
    );
  }

  if (stats.cv > 100) {
    suggestions.push(
      `High coefficient of variation (${stats.cv.toFixed(1)}%) indicates very high relative variability. The data is highly dispersed around the mean.`
    );
  }

  if (stats.std === 0) {
    suggestions.push("Standard deviation is 0 — all values are identical. This column has no variance and is not useful for analysis.");
  }

  if (stats.zeroCount > stats.n * 0.5) {
    suggestions.push(
      `Over 50% of values are zero (${stats.zeroCount}/${stats.n}). Consider whether zeros represent true values or missing data encoded as 0.`
    );
  }

  if (stats.negativeCount > 0 && stats.positiveCount > 0) {
    const negPct = (stats.negativeCount / stats.n) * 100;
    if (negPct > 10 && negPct < 90) {
      suggestions.push(
        `Mixed positive (${stats.positiveCount}) and negative (${stats.negativeCount}) values. Ensure this is expected for the domain.`
      );
    }
  }

  if (Math.abs(stats.kurtosis) > 5) {
    suggestions.push(
      `Extreme kurtosis (${stats.kurtosis.toFixed(2)}) indicates heavy tails. Outlier-resistant methods (median, IQR) are recommended over mean-based approaches.`
    );
  }

  return suggestions;
}
