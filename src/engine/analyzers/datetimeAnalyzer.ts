export interface DatetimeAnalysis {
  range: {
    earliest: string;
    latest: string;
    spanDays: number;
    spanMonths: number;
    spanYears: number;
  };
  counts: {
    total: number;
    validDates: number;
    invalidDates: number;
    invalidPercentage: number;
    duplicateTimestamps: number;
    uniqueDates: number;
    missingDates: number;
  };
  intervals: {
    medianIntervalDays: number;
    meanIntervalDays: number;
    minIntervalDays: number;
    maxIntervalDays: number;
    isRegularInterval: boolean;
    intervalConsistency: number;
    detectedFrequency: string;
  };
  seasonality: {
    dayOfWeekDistribution: Record<string, number>;
    monthDistribution: Record<string, number>;
    hourDistribution: Record<string, number>;
    quarterDistribution: Record<string, number>;
    busiestDay: string;
    busiestMonth: string;
    hasSeasonalPattern: boolean;
    seasonalIndicators: string[];
  };
  quality: {
    invalidDateExamples: string[];
    gapDays: number[];
    futureDates: number;
    veryOldDates: number;
    yearRange: { min: number; max: number };
  };
  preprocessingSuggestions: string[];
}

const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];
const MONTH_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

export function analyzeDatetime(
  rawValues: string[],
  totalRows: number
): DatetimeAnalysis {
  const validDates: Date[] = [];
  const invalidExamples: string[] = [];
  let invalidCount = 0;

  for (const v of rawValues) {
    const trimmed = v.trim();
    if (!trimmed) continue;

    const parsed = new Date(trimmed);
    if (isNaN(parsed.getTime()) || parsed.getFullYear() < 1000 || parsed.getFullYear() > 2200) {
      invalidCount++;
      if (invalidExamples.length < 10) invalidExamples.push(trimmed);
    } else {
      validDates.push(parsed);
    }
  }

  validDates.sort((a, b) => a.getTime() - b.getTime());

  const uniqueTimestamps = new Set(validDates.map((d) => d.getTime()));
  const duplicateTimestamps = validDates.length - uniqueTimestamps.size;

  const now = new Date();
  const futureDates = validDates.filter((d) => d > now).length;
  const veryOldDates = validDates.filter(
    (d) => d.getFullYear() < 1900
  ).length;

  const years = validDates.map((d) => d.getFullYear());
  const yearMin = years.length > 0 ? Math.min(...years) : 0;
  const yearMax = years.length > 0 ? Math.max(...years) : 0;

  const earliest =
    validDates.length > 0 ? validDates[0].toISOString() : null;
  const latest =
    validDates.length > 0
      ? validDates[validDates.length - 1].toISOString()
      : null;

  const spanMs =
    validDates.length >= 2
      ? validDates[validDates.length - 1].getTime() -
        validDates[0].getTime()
      : 0;
  const spanDays = Math.ceil(spanMs / (1000 * 60 * 60 * 24));
  const spanMonths = Math.round(spanDays / 30.44);
  const spanYears = Math.round(spanDays / 365.25);

  const intervals = analyzeIntervals(validDates);

  const seasonality = analyzeSeasonality(validDates);

  const gapDays = findGaps(validDates);

  const missingCount = totalRows - rawValues.length;

  return {
    range: {
      earliest: earliest || "",
      latest: latest || "",
      spanDays,
      spanMonths,
      spanYears,
    },
    counts: {
      total: rawValues.length,
      validDates: validDates.length,
      invalidDates: invalidCount,
      invalidPercentage: round(
        rawValues.length > 0 ? (invalidCount / rawValues.length) * 100 : 0
      ),
      duplicateTimestamps,
      uniqueDates: uniqueTimestamps.size,
      missingDates: missingCount,
    },
    intervals,
    seasonality,
    quality: {
      invalidDateExamples: invalidExamples,
      gapDays: gapDays.slice(0, 20),
      futureDates,
      veryOldDates,
      yearRange: { min: yearMin, max: yearMax },
    },
    preprocessingSuggestions: generateDatetimeSuggestions({
      invalidCount,
      duplicateTimestamps,
      futureDates,
      veryOldDates,
      spanDays,
      intervals,
      total: rawValues.length,
    }),
  };
}

function analyzeIntervals(
  sorted: Date[]
): DatetimeAnalysis["intervals"] {
  if (sorted.length < 2) {
    return {
      medianIntervalDays: 0,
      meanIntervalDays: 0,
      minIntervalDays: 0,
      maxIntervalDays: 0,
      isRegularInterval: false,
      intervalConsistency: 0,
      detectedFrequency: "unknown",
    };
  }

  const intervals: number[] = [];
  for (let i = 1; i < sorted.length; i++) {
    intervals.push(
      (sorted[i].getTime() - sorted[i - 1].getTime()) / (1000 * 60 * 60 * 24)
    );
  }

  intervals.sort((a, b) => a - b);
  const n = intervals.length;
  const meanInterval = intervals.reduce((a, b) => a + b, 0) / n;
  const medianInterval =
    n % 2 === 0
      ? (intervals[n / 2 - 1] + intervals[n / 2]) / 2
      : intervals[Math.floor(n / 2)];
  const minInterval = intervals[0];
  const maxInterval = intervals[n - 1];

  const intervalStd = Math.sqrt(
    intervals.reduce((acc, v) => acc + (v - meanInterval) ** 2, 0) / n
  );
  const intervalCV =
    meanInterval > 0 ? intervalStd / meanInterval : 0;
  const intervalConsistency = Math.max(0, 1 - intervalCV);
  const isRegularInterval = intervalConsistency > 0.8;

  const detectedFrequency = detectFrequency(medianInterval);

  return {
    medianIntervalDays: round(medianInterval),
    meanIntervalDays: round(meanInterval),
    minIntervalDays: round(minInterval),
    maxIntervalDays: round(maxInterval),
    isRegularInterval,
    intervalConsistency: round(intervalConsistency),
    detectedFrequency,
  };
}

function detectFrequency(medianDays: number): string {
  if (medianDays < 0.001) return "sub-second";
  if (medianDays < 1 / 60) return "per-second";
  if (medianDays < 1) return "hourly";
  if (medianDays < 1.5) return "daily";
  if (medianDays < 4) return "every-few-days";
  if (medianDays < 8) return "weekly";
  if (medianDays < 16) return "biweekly";
  if (medianDays < 35) return "monthly";
  if (medianDays < 100) return "quarterly";
  if (medianDays < 400) return "yearly";
  return "irregular";
}

function analyzeSeasonality(
  sorted: Date[]
): DatetimeAnalysis["seasonality"] {
  const dayOfWeek: Record<string, number> = {};
  const month: Record<string, number> = {};
  const hour: Record<string, number> = {};
  const quarter: Record<string, number> = {};

  for (const name of DAY_NAMES) dayOfWeek[name] = 0;
  for (const name of MONTH_NAMES) month[name] = 0;
  for (let h = 0; h < 24; h++) hour[`h${String(h).padStart(2, "0")}`] = 0;
  for (let q = 1; q <= 4; q++) quarter[`Q${q}`] = 0;

  for (const d of sorted) {
    dayOfWeek[DAY_NAMES[d.getDay()]]++;
    month[MONTH_NAMES[d.getMonth()]]++;
    hour[`h${String(d.getHours()).padStart(2, "0")}`]++;
    quarter[`Q${Math.floor(d.getMonth() / 3) + 1}`]++;
  }

  const busiestDay =
    Object.entries(dayOfWeek).sort((a, b) => b[1] - a[1])[0]?.[0] || "";
  const busiestMonth =
    Object.entries(month).sort((a, b) => b[1] - a[1])[0]?.[0] || "";

  const seasonalIndicators: string[] = [];

  const dayValues = Object.values(dayOfWeek);
  const dayMax = Math.max(...dayValues);
  const dayMin = Math.min(...dayValues);
  if (dayMin > 0 && dayMax / dayMin > 2) {
    seasonalIndicators.push(
      `Strong day-of-week pattern: ${busiestDay} has ${dayMax} entries vs. minimum of ${dayMin}.`
    );
  }

  const monthValues = Object.values(month);
  const monthMax = Math.max(...monthValues);
  const monthMin = Math.min(...monthValues);
  if (monthMin > 0 && monthMax / monthMin > 3) {
    seasonalIndicators.push(
      `Strong monthly seasonality: ${busiestMonth} has ${monthMax} entries vs. minimum of ${monthMin}.`
    );
  }

  const hasSeasonalPattern = seasonalIndicators.length > 0;

  return {
    dayOfWeekDistribution: dayOfWeek,
    monthDistribution: month,
    hourDistribution: hour,
    quarterDistribution: quarter,
    busiestDay,
    busiestMonth,
    hasSeasonalPattern,
    seasonalIndicators,
  };
}

function findGaps(sorted: Date[]): number[] {
  if (sorted.length < 2) return [];

  const intervals: number[] = [];
  for (let i = 1; i < sorted.length; i++) {
    intervals.push(
      Math.round(
        (sorted[i].getTime() - sorted[i - 1].getTime()) / (1000 * 60 * 60 * 24)
      )
    );
  }

  if (intervals.length === 0) return [];

  const sortedIntervals = [...intervals].sort((a, b) => a - b);
  const medianInterval = sortedIntervals[Math.floor(sortedIntervals.length / 2)];
  const gapThreshold = medianInterval * 3;

  const gaps: number[] = [];
  for (let i = 0; i < intervals.length; i++) {
    if (intervals[i] > gapThreshold && intervals[i] > 7) {
      gaps.push(intervals[i]);
    }
  }

  return gaps.sort((a, b) => b - a);
}

function generateDatetimeSuggestions(stats: {
  invalidCount: number;
  duplicateTimestamps: number;
  futureDates: number;
  veryOldDates: number;
  spanDays: number;
  intervals: DatetimeAnalysis["intervals"];
  total: number;
}): string[] {
  const suggestions: string[] = [];

  if (stats.invalidCount > 0) {
    suggestions.push(
      `${stats.invalidCount} invalid date(s) detected. These may be malformed strings, placeholder text, or mixed formats. Clean or remove them before time-series analysis.`
    );
  }

  if (stats.duplicateTimestamps > 0) {
    suggestions.push(
      `${stats.duplicateTimestamps} duplicate timestamp(s) found. If this is a time-series, consider aggregation. If not, investigate data collection issues.`
    );
  }

  if (stats.futureDates > 0) {
    suggestions.push(
      `${stats.futureDates} date(s) are in the future. Verify whether these are expected (e.g., scheduled events) or data errors.`
    );
  }

  if (stats.veryOldDates > 0) {
    suggestions.push(
      `${stats.veryOldDates} date(s) are before 1900. These may be default/placeholder dates or data errors.`
    );
  }

  if (stats.intervals.isRegularInterval) {
    suggestions.push(
      `Regular ${stats.intervals.detectedFrequency} interval detected. The data is suitable for time-series decomposition and forecasting.`
    );
  } else if (stats.spanDays > 365) {
    suggestions.push(
      "Irregular time intervals detected. Consider resampling to a regular frequency before time-series analysis."
    );
  }

  if (stats.intervals.maxIntervalDays > stats.intervals.medianIntervalDays * 10) {
    suggestions.push(
      "Large gaps detected in the time series. Consider whether to interpolate, forward-fill, or treat gaps as missing data."
    );
  }

  return suggestions;
}

function round(v: number): number {
  return Math.round(v * 1000) / 1000;
}
