export type UserRole =
  | "student"
  | "ml_engineer"
  | "data_scientist"
  | "researcher"
  | "analyst"
  | "educator";

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  emailVerified: boolean;
  createdAt: string;
}

export interface DashboardStats {
  totalDatasets: number;
  totalSize: number;
  avgQuality: number;
  totalRows: number;
  totalColumns: number;
  qualityDistribution: {
    excellent: number;
    good: number;
    fair: number;
    poor: number;
  };
  typeDistribution: Record<string, number>;
  recentUploads: number;
  datasetsByMonth: Array<{ month: string; count: number }>;
}

export interface ActivityItem {
  id: string;
  action: string;
  entity: string;
  entityId: string | null;
  details: string | null;
  createdAt: string;
}

export type ColumnType =
  | "numeric"
  | "categorical"
  | "boolean"
  | "datetime"
  | "text"
  | "mixed"
  | "empty"
  | "identifier";

export interface ColumnProfileData {
  columnName: string;
  columnIndex: number;
  detectedType: ColumnType;
  nonNullCount: number;
  nullCount: number;
  nullPercentage: number;
  uniqueCount: number;
  isConstant: boolean;
  isHighCardinality: boolean;
  isIdentifier: boolean;
  cardinalityRatio?: number;

  mean?: number;
  median?: number;
  mode?: string;
  std?: number;
  variance?: number;
  min?: string;
  max?: string;
  range?: number;
  q25?: number;
  q50?: number;
  q75?: number;
  iqr?: number;
  skewness?: number;
  kurtosis?: number;
  sum?: number;
  zeroCount?: number;
  negativeCount?: number;
  positiveCount?: number;
  coefficientOfVariation?: number;

  minLength?: number;
  maxLength?: number;
  avgLength?: number;
  emptyCount?: number;
  whitespaceCount?: number;
  patternSummary?: string;

  dateMin?: string;
  dateMax?: string;
  dateRangeDays?: number;

  topValues?: Array<{ value: string; count: number; percentage: number }>;
  histogram?: Array<{ bin: string; count: number }>;
  outliers?: number[];
  valueDistribution?: Record<string, number>;

  numericAnalysis?: import("@/engine/analyzers").NumericAnalysis;
  categoricalAnalysis?: import("@/engine/analyzers").CategoricalAnalysis;
  datetimeAnalysis?: import("@/engine/analyzers").DatetimeAnalysis;
  booleanAnalysis?: import("@/engine/analyzers").BooleanAnalysis;
  textAnalysis?: import("@/engine/analyzers").TextAnalysis;
}

export interface DatasetProfileData {
  totalRows: number;
  totalColumns: number;
  totalMissingCells: number;
  missingPercentage: number;
  duplicateRows: number;
  duplicatePercentage: number;
  memoryUsageBytes: number;
  typeBreakdown: Record<string, number>;
  qualityScore: number;
  qualityBreakdown: QualityBreakdown;
  correlationMatrix?: Record<string, Record<string, number>>;
  columns: ColumnProfileData[];
  sheetNames?: string[];
  delimiter?: string;
  encoding?: string;
}

export interface QualityBreakdown {
  completeness: { score: number; weight: number; description: string };
  uniqueness: { score: number; weight: number; description: string };
  consistency: { score: number; weight: number; description: string };
  structure: { score: number; weight: number; description: string };
}

export interface DatasetListItem {
  id: string;
  name: string;
  description: string | null;
  tags: string[];
  category: string | null;
  fileName: string;
  fileSize: number;
  rowCount: number;
  columnCount: number;
  status: string;
  qualityScore: number | null;
  isFavorite: boolean;
  isArchived: boolean;
  targetColumn: string | null;
  source: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CompareResult {
  schemaDiff: {
    onlyInA: string[];
    onlyInB: string[];
    typeMismatches: Array<{
      column: string;
      typeA: string;
      typeB: string;
    }>;
  };
  structuralDiff: {
    rowDiff: number;
    columnDiff: number;
    missingDiffA: number;
    missingDiffB: number;
  };
  statisticalDiff: Array<{
    column: string;
    stat: string;
    valueA: number;
    valueB: number;
    difference: number;
    percentChange: number;
  }>;
}

export type SortOption =
  | "newest"
  | "oldest"
  | "name_asc"
  | "name_desc"
  | "quality_high"
  | "quality_low"
  | "size_high"
  | "size_low"
  | "rows_high"
  | "rows_low";

export type ViewMode = "grid" | "list";

export interface BulkAction {
  action: "delete" | "archive" | "unarchive" | "favorite" | "unfavorite" | "tag";
  datasetIds: string[];
  tag?: string;
}
