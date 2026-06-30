export interface BooleanAnalysis {
  distribution: {
    trueCount: number;
    falseCount: number;
    truePercentage: number;
    falsePercentage: number;
    nullCount: number;
    nullPercentage: number;
  };
  imbalance: {
    isBalanced: boolean;
    imbalanceRatio: number;
    dominantValue: boolean;
    dominantPercentage: number;
    minorityValue: boolean;
    minorityPercentage: number;
  };
  quality: {
    total: number;
    validCount: number;
    invalidCount: number;
    invalidExamples: string[];
  };
  preprocessingSuggestions: string[];
}

const TRUE_VALUES = new Set([
  "true",
  "1",
  "yes",
  "y",
  "t",
  "on",
  "active",
  "enabled",
  "positive",
]);
const FALSE_VALUES = new Set([
  "false",
  "0",
  "no",
  "n",
  "f",
  "off",
  "inactive",
  "disabled",
  "negative",
]);

export function analyzeBoolean(
  values: string[],
  totalRows: number
): BooleanAnalysis {
  let trueCount = 0;
  let falseCount = 0;
  let invalidCount = 0;
  const invalidExamples: string[] = [];

  for (const v of values) {
    const lower = v.trim().toLowerCase();
    if (TRUE_VALUES.has(lower)) {
      trueCount++;
    } else if (FALSE_VALUES.has(lower)) {
      falseCount++;
    } else {
      invalidCount++;
      if (invalidExamples.length < 5) invalidExamples.push(v.trim());
    }
  }

  const validCount = trueCount + falseCount;
  const nullCount = totalRows - values.length;
  const total = values.length;

  const truePercentage = validCount > 0 ? (trueCount / validCount) * 100 : 0;
  const falsePercentage = validCount > 0 ? (falseCount / validCount) * 100 : 0;
  const nullPercentage = totalRows > 0 ? (nullCount / totalRows) * 100 : 0;

  const dominantIsTrue = truePercentage >= falsePercentage;
  const dominantPercentage = Math.max(truePercentage, falsePercentage);
  const minorityPercentage = Math.min(truePercentage, falsePercentage);

  const imbalanceRatio =
    minorityPercentage > 0
      ? dominantPercentage / minorityPercentage
      : Infinity;

  const isBalanced = imbalanceRatio < 3;

  const suggestions: string[] = [];

  if (invalidCount > 0) {
    suggestions.push(
      `${invalidCount} value(s) could not be interpreted as boolean. Expected true/false, 1/0, yes/no. Invalid examples: ${invalidExamples.join(", ")}.`
    );
  }

  if (!isBalanced) {
    const majority = dominantIsTrue ? "True" : "False";
    const minority = dominantIsTrue ? "False" : "True";
    suggestions.push(
      `Imbalanced boolean: ${majority} represents ${dominantPercentage.toFixed(1)}% vs. ${minority} at ${minorityPercentage.toFixed(1)}%. This may indicate a class imbalance problem if used as a target variable.`
    );
  }

  if (dominantPercentage > 95) {
    suggestions.push(
      `Near-constant boolean: ${dominantPercentage.toFixed(1)}% of values are ${dominantIsTrue ? "True" : "False"}. This column has very low variance.`
    );
  }

  if (truePercentage === 50) {
    suggestions.push("Perfectly balanced boolean — ideal for binary classification tasks.");
  }

  return {
    distribution: {
      trueCount,
      falseCount,
      truePercentage: round(truePercentage),
      falsePercentage: round(falsePercentage),
      nullCount,
      nullPercentage: round(nullPercentage),
    },
    imbalance: {
      isBalanced,
      imbalanceRatio: round(imbalanceRatio),
      dominantValue: dominantIsTrue,
      dominantPercentage: round(dominantPercentage),
      minorityValue: !dominantIsTrue,
      minorityPercentage: round(minorityPercentage),
    },
    quality: {
      total,
      validCount,
      invalidCount,
      invalidExamples,
    },
    preprocessingSuggestions: suggestions,
  };
}

function round(v: number): number {
  return Math.round(v * 1000) / 1000;
}
