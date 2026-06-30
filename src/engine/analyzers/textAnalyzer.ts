export interface TextAnalysis {
  length: {
    minLength: number;
    maxLength: number;
    meanLength: number;
    medianLength: number;
    stdLength: number;
    lengthHistogram: Array<{ bin: string; count: number }>;
  };
  wordCount: {
    minWords: number;
    maxWords: number;
    meanWords: number;
    medianWords: number;
    totalWords: number;
    uniqueWords: number;
    vocabularyRichness: number;
  };
  characterDistribution: {
    uppercaseCount: number;
    lowercaseCount: number;
    digitCount: number;
    spaceCount: number;
    specialCharCount: number;
    alphaRatio: number;
    digitRatio: number;
  };
  content: {
    topWords: Array<{ word: string; count: number; percentage: number }>;
    topBigrams: Array<{ bigram: string; count: number }>;
    languageIndicators: string;
  };
  duplicates: {
    exactDuplicateCount: number;
    exactDuplicatePercentage: number;
    nearDuplicateCount: number;
    uniqueTextCount: number;
  };
  quality: {
    nullCount: number;
    nullPercentage: number;
    emptyStringCount: number;
    emptyStringPercentage: number;
    whitespaceOnlyCount: number;
    leadingTrailingSpaces: number;
    containsHtmlCount: number;
    containsUrlCount: number;
    containsEmailCount: number;
    maxLengthExceeded: boolean;
  };
  preprocessingSuggestions: string[];
}

const STOP_WORDS = new Set([
  "the",
  "a",
  "an",
  "and",
  "or",
  "but",
  "in",
  "on",
  "at",
  "to",
  "for",
  "of",
  "with",
  "by",
  "is",
  "was",
  "are",
  "were",
  "be",
  "been",
  "being",
  "have",
  "has",
  "had",
  "do",
  "does",
  "did",
  "will",
  "would",
  "could",
  "should",
  "may",
  "might",
  "shall",
  "can",
  "this",
  "that",
  "these",
  "those",
  "i",
  "you",
  "he",
  "she",
  "it",
  "we",
  "they",
  "me",
  "him",
  "her",
  "us",
  "them",
  "my",
  "your",
  "his",
  "its",
  "our",
  "their",
  "what",
  "which",
  "who",
  "whom",
  "where",
  "when",
  "why",
  "how",
  "not",
  "no",
  "nor",
  "as",
  "if",
  "then",
  "than",
  "too",
  "very",
  "just",
  "about",
  "above",
  "after",
  "again",
  "all",
  "also",
  "am",
  "any",
  "because",
  "before",
  "between",
  "both",
  "each",
  "from",
  "further",
  "here",
  "into",
  "more",
  "most",
  "other",
  "out",
  "over",
  "own",
  "same",
  "so",
  "some",
  "such",
  "only",
  "once",
  "during",
  "up",
  "down",
  "off",
  "under",
  "until",
]);

const HTML_PATTERN = /<\/?[a-z][\s\S]*>/i;
const URL_PATTERN = /https?:\/\/[^\s]+/;
const EMAIL_PATTERN = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;

export function analyzeText(
  values: string[],
  totalRows: number
): TextAnalysis {
  const lengths = values.map((v) => v.length);
  const wordCounts = values.map((v) =>
    v
      .trim()
      .split(/\s+/)
      .filter((w) => w.length > 0).length
  );

  const sortedLengths = [...lengths].sort((a, b) => a - b);
  const sortedWordCounts = [...wordCounts].sort((a, b) => a - b);

  const wordFreq = new Map<string, number>();
  const bigramFreq = new Map<string, number>();
  let uppercaseTotal = 0;
  let lowercaseTotal = 0;
  let digitTotal = 0;
  let spaceTotal = 0;
  let specialTotal = 0;
  let totalChars = 0;
  let emptyStringCount = 0;
  let whitespaceOnlyCount = 0;
  let leadingTrailingSpaces = 0;
  let containsHtmlCount = 0;
  let containsUrlCount = 0;
  let containsEmailCount = 0;

  for (const v of values) {
    if (v.trim() === "" && v.length === 0) {
      emptyStringCount++;
      continue;
    }
    if (v.trim() === "" && v.length > 0) {
      whitespaceOnlyCount++;
      continue;
    }
    if (v !== v.trim()) leadingTrailingSpaces++;
    if (HTML_PATTERN.test(v)) containsHtmlCount++;
    if (URL_PATTERN.test(v)) containsUrlCount++;
    if (EMAIL_PATTERN.test(v)) containsEmailCount++;

    for (const ch of v) {
      totalChars++;
      if (ch >= "A" && ch <= "Z") uppercaseTotal++;
      else if (ch >= "a" && ch <= "z") lowercaseTotal++;
      else if (ch >= "0" && ch <= "9") digitTotal++;
      else if (ch === " " || ch === "\t") spaceTotal++;
      else specialTotal++;
    }

    const words = v
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, "")
      .split(/\s+/)
      .filter((w) => w.length > 2);

    for (const word of words) {
      if (!STOP_WORDS.has(word)) {
        wordFreq.set(word, (wordFreq.get(word) || 0) + 1);
      }
    }

    for (let i = 0; i < words.length - 1; i++) {
      const bigram = `${words[i]} ${words[i + 1]}`;
      if (!STOP_WORDS.has(words[i]) && !STOP_WORDS.has(words[i + 1])) {
        bigramFreq.set(bigram, (bigramFreq.get(bigram) || 0) + 1);
      }
    }
  }

  const allWords = [...wordFreq.entries()].sort((a, b) => b[1] - a[1]);
  const totalWordCount = allWords.reduce((sum, [, c]) => sum + c, 0);
  const topWords = allWords.slice(0, 20).map(([word, count]) => ({
    word,
    count,
    percentage: round((count / totalWordCount) * 100),
  }));

  const topBigrams = [...bigramFreq.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .map(([bigram, count]) => ({ bigram, count }));

  const sortedValues = [...values].sort();
  let exactDuplicateCount = 0;
  for (let i = 1; i < sortedValues.length; i++) {
    if (sortedValues[i] === sortedValues[i - 1]) exactDuplicateCount++;
  }

  const nearDuplicateCount = findNearDuplicates(values);

  const lengthHistogram = computeLengthHistogram(sortedLengths);

  const nullCount = totalRows - values.length;
  const nullPercentage = totalRows > 0 ? (nullCount / totalRows) * 100 : 0;

  const suggestions: string[] = [];
  if (leadingTrailingSpaces > 0) {
    suggestions.push(
      `${leadingTrailingSpaces} text(s) have leading/trailing whitespace. Trim before analysis.`
    );
  }
  if (containsHtmlCount > 0) {
    suggestions.push(
      `${containsHtmlCount} text(s) contain HTML tags. Strip HTML before NLP analysis.`
    );
  }
  if (containsUrlCount > 0) {
    suggestions.push(
      `${containsUrlCount} text(s) contain URLs. Consider extracting or removing URLs based on analysis goals.`
    );
  }
  if (containsEmailCount > 0) {
    suggestions.push(
      `${containsEmailCount} text(s) contain email addresses. PII detected — consider redaction.`
    );
  }
  if (exactDuplicateCount > values.length * 0.1) {
    suggestions.push(
      `${exactDuplicateCount} exact duplicate texts (${((exactDuplicateCount / values.length) * 100).toFixed(1)}%). Consider deduplication.`
    );
  }
  if (values.length > 0) {
    const avgLen = lengths.reduce((a, b) => a + b, 0) / lengths.length;
    if (avgLen > 500) {
      suggestions.push(
        `Average text length is ${Math.round(avgLen)} characters. Consider truncation or summarization for NLP tasks.`
      );
    }
  }

  const uniqueWordCount = wordFreq.size;
  const vocabularyRichness =
    totalWordCount > 0 ? uniqueWordCount / totalWordCount : 0;

  return {
    length: {
      minLength: lengths.length > 0 ? Math.min(...lengths) : 0,
      maxLength: lengths.length > 0 ? Math.max(...lengths) : 0,
      meanLength: round(lengths.length > 0 ? lengths.reduce((a, b) => a + b, 0) / lengths.length : 0),
      medianLength: round(computeMedian(sortedLengths)),
      stdLength: round(computeStd(lengths)),
      lengthHistogram,
    },
    wordCount: {
      minWords: wordCounts.length > 0 ? Math.min(...wordCounts) : 0,
      maxWords: wordCounts.length > 0 ? Math.max(...wordCounts) : 0,
      meanWords: round(wordCounts.length > 0 ? wordCounts.reduce((a, b) => a + b, 0) / wordCounts.length : 0),
      medianWords: round(computeMedian(sortedWordCounts)),
      totalWords: totalWordCount,
      uniqueWords: uniqueWordCount,
      vocabularyRichness: round(vocabularyRichness),
    },
    characterDistribution: {
      uppercaseCount: uppercaseTotal,
      lowercaseCount: lowercaseTotal,
      digitCount: digitTotal,
      spaceCount: spaceTotal,
      specialCharCount: specialTotal,
      alphaRatio: round(
        totalChars > 0
          ? (uppercaseTotal + lowercaseTotal) / totalChars
          : 0
      ),
      digitRatio: round(totalChars > 0 ? digitTotal / totalChars : 0),
    },
    content: {
      topWords,
      topBigrams,
      languageIndicators: detectLanguageHints(values),
    },
    duplicates: {
      exactDuplicateCount,
      exactDuplicatePercentage: round(
        values.length > 0
          ? (exactDuplicateCount / values.length) * 100
          : 0
      ),
      nearDuplicateCount,
      uniqueTextCount: new Set(values).size,
    },
    quality: {
      nullCount,
      nullPercentage: round(nullPercentage),
      emptyStringCount,
      emptyStringPercentage: round(
        values.length > 0 ? (emptyStringCount / values.length) * 100 : 0
      ),
      whitespaceOnlyCount,
      leadingTrailingSpaces,
      containsHtmlCount,
      containsUrlCount,
      containsEmailCount,
      maxLengthExceeded: false,
    },
    preprocessingSuggestions: suggestions,
  };
}

function computeMedian(sorted: number[]): number {
  if (sorted.length === 0) return 0;
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
}

function computeStd(values: number[]): number {
  if (values.length === 0) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance =
    values.reduce((acc, v) => acc + (v - mean) ** 2, 0) / values.length;
  return Math.sqrt(variance);
}

function computeLengthHistogram(
  sorted: number[],
  maxBins = 20
): Array<{ bin: string; count: number }> {
  if (sorted.length === 0) return [];
  const min = sorted[0];
  const max = sorted[sorted.length - 1];
  if (min === max) return [{ bin: `${min}`, count: sorted.length }];

  const binCount = Math.min(maxBins, Math.ceil(1 + 3.322 * Math.log10(sorted.length)));
  const binWidth = (max - min) / binCount;

  const bins: Array<{ bin: string; count: number }> = [];
  let binIdx = 0;
  let count = 0;

  for (let i = 0; i < sorted.length; i++) {
    const binEnd = min + (binIdx + 1) * binWidth;
    if (sorted[i] < binEnd || binIdx === binCount - 1) {
      count++;
    } else {
      const binStart = min + binIdx * binWidth;
      bins.push({ bin: `${Math.round(binStart)}-${Math.round(binEnd)}`, count });
      binIdx++;
      count = 1;
    }
  }
  if (count > 0) {
    const binStart = min + binIdx * binWidth;
    const binEnd = min + (binIdx + 1) * binWidth;
    bins.push({ bin: `${Math.round(binStart)}-${Math.round(binEnd)}`, count });
  }

  return bins;
}

function findNearDuplicates(values: string[]): number {
  if (values.length < 2) return 0;

  const normalized = values.map((v) =>
    v
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, "")
      .replace(/\s+/g, " ")
      .trim()
  );

  const freq = new Map<string, number>();
  for (const v of normalized) {
    freq.set(v, (freq.get(v) || 0) + 1);
  }

  let nearDupes = 0;
  const entries = [...freq.entries()];
  for (let i = 0; i < entries.length; i++) {
    for (let j = i + 1; j < entries.length; j++) {
      if (entries[i][0].length > 10 && entries[j][0].length > 10) {
        const sim = computeSimilarity(entries[i][0], entries[j][0]);
        if (sim > 0.9 && sim < 1) {
          nearDupes += Math.min(entries[i][1], entries[j][1]);
        }
      }
    }
  }

  return nearDupes;
}

function computeSimilarity(a: string, b: string): number {
  if (a === b) return 1;
  const longer = a.length > b.length ? a : b;
  const shorter = a.length > b.length ? b : a;
  if (longer.length === 0) return 1;

  let matches = 0;
  for (let i = 0; i < shorter.length; i++) {
    if (longer.includes(shorter[i])) matches++;
  }
  return matches / longer.length;
}

function detectLanguageHints(values: string[]): string {
  const sample = values.slice(0, 100).join(" ").toLowerCase();
  const englishWords = [
    "the",
    "is",
    "and",
    "of",
    "to",
    "in",
    "that",
    "it",
    "with",
    "for",
  ];
  let englishHits = 0;
  for (const word of englishWords) {
    if (sample.includes(` ${word} `)) englishHits++;
  }

  if (englishHits >= 5) return "likely_english";
  if (englishHits >= 2) return "possibly_english";
  return "unknown";
}

function round(v: number): number {
  return Math.round(v * 1000) / 1000;
}
