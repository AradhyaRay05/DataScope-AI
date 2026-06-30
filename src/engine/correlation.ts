export interface CorrelationPair {
  columnA: string;
  columnB: string;
  pearson: number;
  spearman: number;
  kendall: number;
  strength: "very_strong" | "strong" | "moderate" | "weak" | "very_weak" | "none";
  direction: "positive" | "negative" | "none";
  interpretation: string;
}

export interface MulticollinearityGroup {
  columns: string[];
  maxCorrelation: number;
  averageCorrelation: number;
  recommendation: string;
}

export interface FeatureRedundancy {
  columnA: string;
  columnB: string;
  similarity: number;
  redundant: boolean;
  recommendation: string;
}

export interface CorrelationResult {
  matrix: {
    pearson: Record<string, Record<string, number>>;
    spearman: Record<string, Record<string, number>>;
    kendall: Record<string, Record<string, number>>;
  };
  pairs: CorrelationPair[];
  strongPositive: CorrelationPair[];
  strongNegative: CorrelationPair[];
  weak: CorrelationPair[];
  multicollinearity: {
    detected: boolean;
    groups: MulticollinearityGroup[];
    vif: Record<string, number>;
    affectedColumns: string[];
  };
  featureRedundancy: FeatureRedundancy[];
  heatmap: {
    columns: string[];
    data: number[][];
    method: string;
  };
  summary: {
    totalPairs: number;
    strongPairs: number;
    moderatePairs: number;
    weakPairs: number;
    multicollinearColumns: number;
    redundantFeatures: number;
  };
  recommendations: string[];
}

export function analyzeCorrelations(
  columns: Record<string, number[]>,
  threshold = 0.05
): CorrelationResult {
  const names = Object.keys(columns);
  if (names.length < 2) {
    return emptyCorrelationResult(names);
  }

  const pearsonMatrix: Record<string, Record<string, number>> = {};
  const spearmanMatrix: Record<string, Record<string, number>> = {};
  const kendallMatrix: Record<string, Record<string, number>> = {};

  for (const a of names) {
    pearsonMatrix[a] = {};
    spearmanMatrix[a] = {};
    kendallMatrix[a] = {};
  }

  const pairs: CorrelationPair[] = [];

  for (let i = 0; i < names.length; i++) {
    for (let j = i; j < names.length; j++) {
      const a = names[i];
      const b = names[j];

      if (i === j) {
        pearsonMatrix[a][b] = 1;
        spearmanMatrix[a][b] = 1;
        kendallMatrix[a][b] = 1;
        continue;
      }

      const x = columns[a];
      const y = columns[b];
      const n = Math.min(x.length, y.length);

      const p = pearsonCorrelation(x, y);
      const s = spearmanCorrelation(x, y);
      const k = kendallCorrelation(x, y);

      pearsonMatrix[a][b] = round(p);
      pearsonMatrix[b][a] = round(p);
      spearmanMatrix[a][b] = round(s);
      spearmanMatrix[b][a] = round(s);
      kendallMatrix[a][b] = round(k);
      kendallMatrix[b][a] = round(k);

      const absMax = Math.max(Math.abs(p), Math.abs(s), Math.abs(k));
      const primary = Math.abs(p) >= Math.abs(s) ? p : s;

      const pair: CorrelationPair = {
        columnA: a,
        columnB: b,
        pearson: round(p),
        spearman: round(s),
        kendall: round(k),
        strength: classifyStrength(absMax),
        direction: primary > 0.05 ? "positive" : primary < -0.05 ? "negative" : "none",
        interpretation: interpretCorrelation(absMax, primary > 0),
      };

      pairs.push(pair);
    }
  }

  const strongPositive = pairs.filter(
    (p) => p.strength === "strong" || p.strength === "very_strong"
  ).filter((p) => p.direction === "positive");

  const strongNegative = pairs.filter(
    (p) => p.strength === "strong" || p.strength === "very_strong"
  ).filter((p) => p.direction === "negative");

  const weak = pairs.filter(
    (p) => p.strength === "weak" || p.strength === "very_weak"
  );

  const multicollinearity = detectMulticollinearity(names, pearsonMatrix);
  const featureRedundancy = detectFeatureRedundancy(names, pearsonMatrix, columns);

  const recommendations = generateCorrelationRecommendations(
    pairs,
    multicollinearity,
    featureRedundancy
  );

  const strongCount = pairs.filter(
    (p) => p.strength === "strong" || p.strength === "very_strong"
  ).length;
  const moderateCount = pairs.filter(
    (p) => p.strength === "moderate"
  ).length;
  const weakCount = pairs.filter(
    (p) => p.strength === "weak" || p.strength === "very_weak"
  ).length;

  return {
    matrix: {
      pearson: pearsonMatrix,
      spearman: spearmanMatrix,
      kendall: kendallMatrix,
    },
    pairs: pairs.sort((a, b) => Math.abs(b.pearson) - Math.abs(a.pearson)),
    strongPositive,
    strongNegative,
    weak,
    multicollinearity,
    featureRedundancy,
    heatmap: {
      columns: names,
      data: names.map((a) => names.map((b) => pearsonMatrix[a][b] ?? 0)),
      method: "pearson",
    },
    summary: {
      totalPairs: pairs.length,
      strongPairs: strongCount,
      moderatePairs: moderateCount,
      weakPairs: weakCount,
      multicollinearColumns: multicollinearity.affectedColumns.length,
      redundantFeatures: featureRedundancy.filter((r) => r.redundant).length,
    },
    recommendations,
  };
}

function classifyStrength(
  absValue: number
): CorrelationPair["strength"] {
  if (absValue >= 0.9) return "very_strong";
  if (absValue >= 0.7) return "strong";
  if (absValue >= 0.5) return "moderate";
  if (absValue >= 0.3) return "weak";
  if (absValue >= 0.1) return "very_weak";
  return "none";
}

function interpretCorrelation(absValue: number, isPositive: boolean): string {
  const dir = isPositive ? "positive" : "negative";
  if (absValue >= 0.9) return `Very strong ${dir} correlation — these variables move almost perfectly together.`;
  if (absValue >= 0.7) return `Strong ${dir} correlation — one variable reliably predicts the other.`;
  if (absValue >= 0.5) return `Moderate ${dir} correlation — a meaningful relationship exists.`;
  if (absValue >= 0.3) return `Weak ${dir} correlation — a slight relationship may exist.`;
  if (absValue >= 0.1) return `Very weak ${dir} correlation — likely not meaningful.`;
  return "No meaningful linear relationship detected.";
}

function pearsonCorrelation(x: number[], y: number[]): number {
  const n = Math.min(x.length, y.length);
  if (n < 3) return 0;

  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0, sumY2 = 0;
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

  if (validN < 3) return 0;
  const num = validN * sumXY - sumX * sumY;
  const den = Math.sqrt(
    (validN * sumX2 - sumX * sumX) * (validN * sumY2 - sumY * sumY)
  );
  return den === 0 ? 0 : num / den;
}

function spearmanCorrelation(x: number[], y: number[]): number {
  const n = Math.min(x.length, y.length);
  if (n < 3) return 0;

  const xRanked = rankArray(x);
  const yRanked = rankArray(y);

  return pearsonCorrelation(xRanked, yRanked);
}

function kendallCorrelation(x: number[], y: number[]): number {
  const n = Math.min(x.length, y.length);
  if (n < 3) return 0;

  let concordant = 0;
  let discordant = 0;
  let ties = 0;

  for (let i = 0; i < n - 1; i++) {
    for (let j = i + 1; j < n; j++) {
      const dx = x[i] - x[j];
      const dy = y[i] - y[j];

      if (dx === 0 && dy === 0) {
        ties++;
      } else if ((dx > 0 && dy > 0) || (dx < 0 && dy < 0)) {
        concordant++;
      } else if ((dx > 0 && dy < 0) || (dx < 0 && dy > 0)) {
        discordant++;
      } else {
        ties++;
      }
    }
  }

  const total = concordant + discordant + ties;
  if (total === 0) return 0;

  const denom = Math.sqrt(
    (concordant + discordant + ties - (n * (n - 1)) / 2 + concordant + discordant) *
    (concordant + discordant + ties - (n * (n - 1)) / 2 + concordant + discordant)
  );

  return denom === 0 ? 0 : (concordant - discordant) / ((n * (n - 1)) / 2);
}

function rankArray(arr: number[]): number[] {
  const indexed = arr.map((v, i) => ({ v, i }));
  indexed.sort((a, b) => a.v - b.v);

  const ranks = new Array(arr.length);
  let i = 0;
  while (i < indexed.length) {
    let j = i;
    while (j < indexed.length && indexed[j].v === indexed[i].v) j++;
    const avgRank = (i + j - 1) / 2 + 1;
    for (let k = i; k < j; k++) {
      ranks[indexed[k].i] = avgRank;
    }
    i = j;
  }
  return ranks;
}

function detectMulticollinearity(
  names: string[],
  matrix: Record<string, Record<string, number>>
): CorrelationResult["multicollinearity"] {
  const threshold = 0.8;
  const groups: MulticollinearityGroup[] = [];
  const affected = new Set<string>();

  const adjList = new Map<string, Set<string>>();
  for (const a of names) {
    adjList.set(a, new Set());
  }

  for (let i = 0; i < names.length; i++) {
    for (let j = i + 1; j < names.length; j++) {
      if (Math.abs(matrix[names[i]][names[j]]) >= threshold) {
        adjList.get(names[i])!.add(names[j]);
        adjList.get(names[j])!.add(names[i]);
      }
    }
  }

  const visited = new Set<string>();
  for (const node of names) {
    if (visited.has(node)) continue;
    const component: string[] = [];
    const stack = [node];
    while (stack.length > 0) {
      const curr = stack.pop()!;
      if (visited.has(curr)) continue;
      visited.add(curr);
      component.push(curr);
      for (const neighbor of adjList.get(curr) ?? []) {
        if (!visited.has(neighbor)) stack.push(neighbor);
      }
    }
    if (component.length >= 2) {
      let maxCorr = 0;
      let sumCorr = 0;
      let pairCount = 0;
      for (let i = 0; i < component.length; i++) {
        for (let j = i + 1; j < component.length; j++) {
          const corr = Math.abs(matrix[component[i]][component[j]]);
          maxCorr = Math.max(maxCorr, corr);
          sumCorr += corr;
          pairCount++;
        }
      }
      groups.push({
        columns: component,
        maxCorrelation: round(maxCorr),
        averageCorrelation: round(pairCount > 0 ? sumCorr / pairCount : 0),
        recommendation: `Consider removing one of: ${component.slice(1).join(", ")} (keep ${component[0]}). These columns are highly correlated and may cause multicollinearity in regression models.`,
      });
      for (const col of component) affected.add(col);
    }
  }

  const vif: Record<string, number> = {};
  for (const name of names) {
    const otherCorrs = names
      .filter((n) => n !== name)
      .map((n) => matrix[name][n] ** 2);
    const rSquared =
      otherCorrs.reduce((a, b) => a + b, 0) / Math.max(1, otherCorrs.length);
    vif[name] = round(1 / (1 - Math.min(rSquared, 0.999)));
  }

  return {
    detected: groups.length > 0,
    groups,
    vif,
    affectedColumns: [...affected],
  };
}

function detectFeatureRedundancy(
  names: string[],
  matrix: Record<string, Record<string, number>>,
  columns: Record<string, number[]>
): FeatureRedundancy[] {
  const results: FeatureRedundancy[] = [];
  const threshold = 0.95;

  for (let i = 0; i < names.length; i++) {
    for (let j = i + 1; j < names.length; j++) {
      const a = names[i];
      const b = names[j];
      const corr = Math.abs(matrix[a][b]);

      const similarity = computeCosineSimilarity(columns[a], columns[b]);

      const redundant = corr >= threshold || similarity >= 0.99;

      results.push({
        columnA: a,
        columnB: b,
        similarity: round(similarity),
        redundant,
        recommendation: redundant
          ? `"${a}" and "${b}" are highly similar (r=${round(corr)}, cos=${round(similarity)}). Consider dropping one to reduce dimensionality.`
          : "",
      });
    }
  }

  return results
    .filter((r) => r.similarity > 0.8)
    .sort((a, b) => b.similarity - a.similarity);
}

function computeCosineSimilarity(x: number[], y: number[]): number {
  const n = Math.min(x.length, y.length);
  if (n === 0) return 0;

  let dotProduct = 0;
  let normX = 0;
  let normY = 0;

  for (let i = 0; i < n; i++) {
    dotProduct += x[i] * y[i];
    normX += x[i] * x[i];
    normY += y[i] * y[i];
  }

  const denom = Math.sqrt(normX) * Math.sqrt(normY);
  return denom === 0 ? 0 : dotProduct / denom;
}

function generateCorrelationRecommendations(
  pairs: CorrelationPair[],
  multicollinearity: CorrelationResult["multicollinearity"],
  redundancy: FeatureRedundancy[]
): string[] {
  const recs: string[] = [];

  const veryStrong = pairs.filter((p) => p.strength === "very_strong");
  if (veryStrong.length > 0) {
    recs.push(
      `${veryStrong.length} very strong correlation(s) found. These pairs may be measuring the same underlying phenomenon: ${veryStrong.map((p) => `${p.columnA}↔${p.columnB}`).join(", ")}.`
    );
  }

  if (multicollinearity.detected) {
    recs.push(
      `Multicollinearity detected in ${multicollinearity.groups.length} group(s). For regression models, remove redundant features to improve model stability and interpretability.`
    );
  }

  const highVIF = Object.entries(multicollinearity.vif)
    .filter(([, v]) => v > 5)
    .sort((a, b) => b[1] - a[1]);
  if (highVIF.length > 0) {
    recs.push(
      `High VIF (>5) detected for: ${highVIF.map(([col, v]) => `${col} (VIF=${v.toFixed(1)})`).join(", ")}. These columns may cause multicollinearity in linear models.`
    );
  }

  const redundantPairs = redundancy.filter((r) => r.redundant);
  if (redundantPairs.length > 0) {
    recs.push(
      `${redundantPairs.length} redundant feature pair(s) detected. Consider dimensionality reduction or feature selection.`
    );
  }

  const strongNeg = pairs.filter(
    (p) => p.strength === "strong" && p.direction === "negative"
  );
  if (strongNeg.length > 0) {
    recs.push(
      `Strong negative correlations found: ${strongNeg.map((p) => `${p.columnA}↔${p.columnB} (r=${p.pearson})`).join(", ")}. These move inversely — useful for understanding trade-offs.`
    );
  }

  if (recs.length === 0) {
    recs.push("No significant multicollinearity or redundancy detected. Features appear independent.");
  }

  return recs;
}

function emptyCorrelationResult(names: string[]): CorrelationResult {
  const emptyMatrix: Record<string, Record<string, number>> = {};
  for (const n of names) emptyMatrix[n] = { [n]: 1 };

  return {
    matrix: { pearson: emptyMatrix, spearman: emptyMatrix, kendall: emptyMatrix },
    pairs: [],
    strongPositive: [],
    strongNegative: [],
    weak: [],
    multicollinearity: { detected: false, groups: [], vif: {}, affectedColumns: [] },
    featureRedundancy: [],
    heatmap: { columns: names, data: names.map(() => [1]), method: "pearson" },
    summary: { totalPairs: 0, strongPairs: 0, moderatePairs: 0, weakPairs: 0, multicollinearColumns: 0, redundantFeatures: 0 },
    recommendations: ["Not enough numeric columns for correlation analysis (need at least 2)."],
  };
}

function round(v: number): number {
  return Math.round(v * 1000) / 1000;
}
