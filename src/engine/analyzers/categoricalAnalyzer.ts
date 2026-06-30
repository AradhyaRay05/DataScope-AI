export interface CategoricalAnalysis {
  summary: {
    uniqueCount: number;
    cardinalityRatio: number;
    cardinalityLevel: string;
    mostCommon: { value: string; count: number; percentage: number };
    leastCommon: { value: string; count: number; percentage: number };
    mode: string;
  };
  distribution: {
    topValues: Array<{ value: string; count: number; percentage: number }>;
    bottomValues: Array<{ value: string; count: number; percentage: number }>;
    valueDistribution: Record<string, number>;
  };
  imbalance: {
    isBalanced: boolean;
    imbalanceRatio: number;
    dominantClass: string;
    dominantPercentage: number;
    minorityClass: string;
    minorityPercentage: number;
    entropyScore: number;
    maxEntropy: number;
    normalizedEntropy: number;
  };
  quality: {
    nullCount: number;
    nullPercentage: number;
    emptyCount: number;
    emptyPercentage: number;
    whitespaceOnlyCount: number;
    caseInconsistencies: number;
    leadingTrailingSpaces: number;
  };
  preprocessingSuggestions: string[];
  visualizationRecommendations: string[];
}

export function analyzeCategorical(
  values: string[],
  totalRows: number
): CategoricalAnalysis {
  const freq = new Map<string, number>();
  let emptyCount = 0;
  const whitespaceOnlyCount = 0;
  let leadingTrailingSpaces = 0;

  for (const v of values) {
    const trimmed = v.trim();
    if (trimmed === "") {
      emptyCount++;
      continue;
    }
    if (v !== trimmed) leadingTrailingSpaces++;
    freq.set(trimmed, (freq.get(trimmed) || 0) + 1);
  }

  const sorted = [...freq.entries()].sort((a, b) => b[1] - a[1]);
  const uniqueCount = freq.size;
  const cardinalityRatio = values.length > 0 ? uniqueCount / values.length : 0;

  const cardinalityLevel =
    uniqueCount <= 5
      ? "very_low"
      : uniqueCount <= 20
        ? "low"
        : uniqueCount <= 100
          ? "moderate"
          : uniqueCount <= 500
            ? "high"
            : "very_high";

  const mostCommon = sorted[0]
    ? {
        value: sorted[0][0],
        count: sorted[0][1],
        percentage: round((sorted[0][1] / values.length) * 100),
      }
    : { value: "", count: 0, percentage: 0 };

  const leastCommon = sorted[sorted.length - 1]
    ? {
        value: sorted[sorted.length - 1][0],
        count: sorted[sorted.length - 1][1],
        percentage: round(
          (sorted[sorted.length - 1][1] / values.length) * 100
        ),
      }
    : { value: "", count: 0, percentage: 0 };

  const topValues = sorted.slice(0, 15).map(([value, count]) => ({
    value,
    count,
    percentage: round((count / values.length) * 100),
  }));

  const bottomValues = sorted.slice(-10).reverse().map(([value, count]) => ({
    value,
    count,
    percentage: round((count / values.length) * 100),
  }));

  const valueDistribution: Record<string, number> = {};
  for (const [val, count] of sorted.slice(0, 50)) {
    valueDistribution[val] = count;
  }

  const imbalance = analyzeImbalance(sorted, values.length);

  const lowerCaseMap = new Map<string, string[]>();
  for (const [val] of sorted) {
    const lower = val.toLowerCase();
    const existing = lowerCaseMap.get(lower);
    if (existing) existing.push(val);
    else lowerCaseMap.set(lower, [val]);
  }
  let caseInconsistencies = 0;
  for (const [, variants] of lowerCaseMap) {
    if (variants.length > 1) caseInconsistencies += variants.length - 1;
  }

  const nullCount = totalRows - values.length;
  const nullPercentage = totalRows > 0 ? (nullCount / totalRows) * 100 : 0;

  const preprocessingSuggestions = generateCategoricalSuggestions({
    uniqueCount,
    cardinalityRatio,
    imbalance,
    caseInconsistencies,
    emptyCount,
    leadingTrailingSpaces,
    totalValues: values.length,
    mostCommon,
  });

  const visualizationRecommendations = generateVisualizationRecs(
    uniqueCount,
    cardinalityLevel
  );

  return {
    summary: {
      uniqueCount,
      cardinalityRatio: round(cardinalityRatio),
      cardinalityLevel,
      mostCommon,
      leastCommon,
      mode: mostCommon.value,
    },
    distribution: {
      topValues,
      bottomValues,
      valueDistribution,
    },
    imbalance,
    quality: {
      nullCount,
      nullPercentage: round(nullPercentage),
      emptyCount,
      emptyPercentage: round((emptyCount / values.length) * 100),
      whitespaceOnlyCount,
      caseInconsistencies,
      leadingTrailingSpaces,
    },
    preprocessingSuggestions,
    visualizationRecommendations,
  };
}

function analyzeImbalance(
  sorted: Array<[string, number]>,
  total: number
): CategoricalAnalysis["imbalance"] {
  if (sorted.length === 0) {
    return {
      isBalanced: true,
      imbalanceRatio: 1,
      dominantClass: "",
      dominantPercentage: 0,
      minorityClass: "",
      minorityPercentage: 0,
      entropyScore: 0,
      maxEntropy: 0,
      normalizedEntropy: 0,
    };
  }

  const dominantClass = sorted[0][0];
  const dominantPercentage = (sorted[0][1] / total) * 100;
  const minorityClass = sorted[sorted.length - 1][0];
  const minorityPercentage = (sorted[sorted.length - 1][1] / total) * 100;

  const imbalanceRatio =
    minorityPercentage > 0
      ? round(dominantPercentage / minorityPercentage)
      : Infinity;

  let entropy = 0;
  for (const [, count] of sorted) {
    const p = count / total;
    if (p > 0) entropy -= p * Math.log2(p);
  }
  const maxEntropy = Math.log2(sorted.length);
  const normalizedEntropy = maxEntropy > 0 ? entropy / maxEntropy : 0;

  const isBalanced = normalizedEntropy > 0.85 && imbalanceRatio < 3;

  return {
    isBalanced,
    imbalanceRatio,
    dominantClass,
    dominantPercentage: round(dominantPercentage),
    minorityClass,
    minorityPercentage: round(minorityPercentage),
    entropyScore: round(entropy),
    maxEntropy: round(maxEntropy),
    normalizedEntropy: round(normalizedEntropy),
  };
}

function generateCategoricalSuggestions(stats: {
  uniqueCount: number;
  cardinalityRatio: number;
  imbalance: CategoricalAnalysis["imbalance"];
  caseInconsistencies: number;
  emptyCount: number;
  leadingTrailingSpaces: number;
  totalValues: number;
  mostCommon: { value: string; count: number; percentage: number };
}): string[] {
  const suggestions: string[] = [];

  if (stats.caseInconsistencies > 0) {
    suggestions.push(
      `${stats.caseInconsistencies} case inconsistency/ies found (e.g., "Yes" vs "yes"). Standardize to a single casing before analysis.`
    );
  }

  if (stats.leadingTrailingSpaces > 0) {
    suggestions.push(
      `${stats.leadingTrailingSpaces} value(s) have leading/trailing whitespace. Trim all values to prevent false-unique categories.`
    );
  }

  if (stats.emptyCount > 0) {
    suggestions.push(
      `${stats.emptyCount} empty string(s) detected. Decide whether to treat as missing or as a valid "empty" category.`
    );
  }

  if (stats.cardinalityRatio > 0.9) {
    suggestions.push(
      "Very high cardinality (near-unique values). This column may be an identifier, free-text field, or requires grouping into broader categories."
    );
  }

  if (stats.uniqueCount > 50) {
    suggestions.push(
      `${stats.uniqueCount} unique categories detected. Consider grouping rare categories into an "Other" category to reduce dimensionality.`
    );
  }

  if (!stats.imbalance.isBalanced) {
    suggestions.push(
      `Class imbalance detected: "${stats.imbalance.dominantClass}" dominates at ${stats.imbalance.dominantPercentage}% while "${stats.imbalance.minorityClass}" is only ${stats.imbalance.minorityPercentage}%. Consider oversampling (SMOTE) or undersampling techniques.`
    );
  }

  if (stats.mostCommon.percentage > 80) {
    suggestions.push(
      `"${stats.mostCommon.value}" represents ${stats.mostCommon.percentage}% of all values. This column has near-zero variance and may not be informative.`
    );
  }

  if (stats.uniqueCount === 1) {
    suggestions.push("Only one unique value exists. This column is constant and provides no analytical value.");
  }

  return suggestions;
}

function generateVisualizationRecs(
  uniqueCount: number,
  cardinalityLevel: string
): string[] {
  const recs: string[] = [];

  if (cardinalityLevel === "very_low" || cardinalityLevel === "low") {
    recs.push("Bar chart showing frequency of each category");
    recs.push("Pie chart for proportional view");
  } else if (cardinalityLevel === "moderate") {
    recs.push("Horizontal bar chart (top 15 categories)");
    recs.push("Treemap for hierarchical view of proportions");
  } else {
    recs.push("Bar chart of top 10 categories only");
    recs.push("Word cloud if values are text-like");
    recs.push("Consider grouping rare categories before visualization");
  }

  return recs;
}

function round(v: number): number {
  return Math.round(v * 1000) / 1000;
}
