import { z } from "zod";

export const USER_ROLES = [
  "student",
  "ml_engineer",
  "data_scientist",
  "researcher",
  "analyst",
  "educator",
] as const;

export type UserRole = (typeof USER_ROLES)[number];

export const ROLE_LABELS: Record<UserRole, string> = {
  student: "Student",
  ml_engineer: "ML Engineer",
  data_scientist: "Data Scientist",
  researcher: "Researcher",
  analyst: "Analyst",
  educator: "Educator",
};

export const ROLE_DESCRIPTIONS: Record<UserRole, string> = {
  student: "Learning data science, ML, or analytics in an academic setting",
  ml_engineer: "Building and deploying machine learning systems in production",
  data_scientist: "Analyzing data and building models to solve business problems",
  researcher: "Conducting academic or industrial research using datasets",
  analyst: "Analyzing business data for insights, dashboards, and reporting",
  educator: "Teaching data science, ML, or analytics courses",
};

export const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must be 100 characters or fewer"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password must be 128 characters or fewer"),
  role: z.enum(USER_ROLES).optional().default("student"),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
  rememberMe: z.boolean().optional().default(false),
});

export const resetPasswordRequestSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, "Reset token is required"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password must be 128 characters or fewer"),
});

export const datasetMetadataSchema = z.object({
  name: z
    .string()
    .min(1, "Dataset name is required")
    .max(200, "Name must be 200 characters or fewer"),
  description: z
    .string()
    .max(1000, "Description must be 1000 characters or fewer")
    .optional(),
  tags: z.string().max(500).optional(),
});

export const searchSchema = z.object({
  q: z.string().min(1).max(200).optional(),
  sort: z
    .enum([
      "newest",
      "oldest",
      "name_asc",
      "name_desc",
      "quality_high",
      "quality_low",
      "size_high",
      "size_low",
      "rows_high",
      "rows_low",
    ])
    .optional()
    .default("newest"),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(50).optional().default(12),
  tags: z.string().optional(),
  category: z.string().optional(),
  status: z.string().optional(),
  minQuality: z.coerce.number().min(0).max(100).optional(),
  maxQuality: z.coerce.number().min(0).max(100).optional(),
  favorites: z.coerce.boolean().optional(),
  archived: z.coerce.boolean().optional(),
  view: z.enum(["grid", "list"]).optional().default("grid"),
});

export const bulkActionSchema = z.object({
  action: z.enum([
    "delete",
    "archive",
    "unarchive",
    "favorite",
    "unfavorite",
    "tag",
  ]),
  datasetIds: z.array(z.string().uuid()).min(1, "Select at least one dataset."),
  tag: z.string().optional(),
});

export const updateDatasetSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).optional(),
  tags: z.union([z.array(z.string()), z.string()]).optional(),
  category: z.string().max(100).optional().nullable(),
  targetColumn: z.string().max(200).optional().nullable(),
  source: z.string().max(500).optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
  project: z.string().max(200).optional().nullable(),
});

export const compareSchema = z.object({
  datasetA: z.string().uuid(),
  datasetB: z.string().uuid(),
});

export const customMetadataSchema = z.object({
  key: z
    .string()
    .min(1, "Key is required")
    .max(50, "Key must be 50 characters or fewer")
    .regex(
      /^[a-zA-Z0-9_]+$/,
      "Key must contain only letters, numbers, and underscores"
    ),
  value: z.string().max(500, "Value must be 500 characters or fewer"),
});

export const savedSearchSchema = z.object({
  name: z.string().min(1).max(100),
  query: z.string().max(200).optional().default(""),
  filters: z.record(z.string(), z.unknown()).optional().default({}),
  sort: z.string().max(30).optional().default("newest"),
});

export const reportSchema = z.object({
  format: z.enum(["json", "csv", "xlsx", "pdf"]).default("json"),
  download: z.boolean().optional().default(false),
});

export const notificationSchema = z.object({
  id: z.string().uuid().optional(),
  markAll: z.boolean().optional().default(false),
});

export const userSettingsSchema = z.object({
  defaultView: z.enum(["grid", "list"]).optional(),
  datasetsPerPage: z.number().int().min(1).max(50).optional(),
  defaultSort: z.string().max(30).optional(),
  emailNotifications: z.boolean().optional(),
  theme: z.enum(["dark", "light"]).optional(),
});

export const advancedSearchSchema = z.object({
  q: z.string().max(200).optional(),
  sort: z
    .enum([
      "newest",
      "oldest",
      "name_asc",
      "name_desc",
      "quality_high",
      "quality_low",
      "size_high",
      "size_low",
      "rows_high",
      "rows_low",
      "columns_high",
      "columns_low",
    ])
    .optional()
    .default("newest"),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(50).optional().default(12),
  tags: z.string().optional(),
  category: z.string().optional(),
  status: z.string().optional(),
  project: z.string().optional(),
  source: z.string().optional(),
  fileType: z.string().optional(),
  minQuality: z.coerce.number().min(0).max(100).optional(),
  maxQuality: z.coerce.number().min(0).max(100).optional(),
  minRows: z.coerce.number().int().min(0).optional(),
  maxRows: z.coerce.number().int().min(0).optional(),
  minColumns: z.coerce.number().int().min(0).optional(),
  maxColumns: z.coerce.number().int().min(0).optional(),
  minSize: z.coerce.number().int().min(0).optional(),
  maxSize: z.coerce.number().int().min(0).optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  favorites: z.coerce.boolean().optional(),
  archived: z.coerce.boolean().optional(),
  columns: z.string().optional(),
});
