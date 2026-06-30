import fs from "fs";
import path from "path";
import { AppError, ErrorCode } from "@/lib/errors";
import { logger } from "@/lib/logger";
import { sanitizeFilename } from "@/lib/sanitize";

const MAX_FILE_SIZE = 100 * 1024 * 1024;
const ALLOWED_EXTENSIONS = new Set([".csv", ".xlsx", ".xls"]);
const MIN_ROWS = 1;
const MAX_COLUMNS = 10000;

interface UploadValidationResult {
  valid: boolean;
  filePath: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  extension: string;
}

export function validateUploadFile(file: File): void {
  if (!file || file.size === 0) {
    throw new AppError(ErrorCode.DATASET_EMPTY, "No file provided or file is empty.");
  }

  if (file.size > MAX_FILE_SIZE) {
    const sizeMB = (file.size / 1024 / 1024).toFixed(1);
    throw new AppError(ErrorCode.DATASET_TOO_LARGE, `File size ${sizeMB}MB exceeds 100MB limit.`, {
      details: { fileSize: file.size, maxSize: MAX_FILE_SIZE },
    });
  }

  const ext = path.extname(file.name).toLowerCase();
  if (!ALLOWED_EXTENSIONS.has(ext)) {
    throw new AppError(
      ErrorCode.DATASET_INVALID_FORMAT,
      `Unsupported file format "${ext}". Allowed: ${[...ALLOWED_EXTENSIONS].join(", ")}.`,
      { details: { extension: ext, allowed: [...ALLOWED_EXTENSIONS] } }
    );
  }
}

export function validateDatasetName(name: string): string {
  const trimmed = name?.trim();
  if (!trimmed) {
    throw new AppError(ErrorCode.MISSING_FIELD, "Dataset name is required.");
  }
  if (trimmed.length > 200) {
    throw new AppError(
      ErrorCode.INVALID_INPUT,
      "Dataset name must be 200 characters or fewer."
    );
  }
  return trimmed;
}

export function saveUploadedFile(
  file: Buffer,
  originalName: string,
  userId: string,
  datasetId: string
): { filePath: string; fileName: string } {
  const sanitizedName = sanitizeFilename(originalName);
  const uploadDir = path.join(
    process.cwd(),
    "data",
    "uploads",
    userId,
    datasetId
  );

  try {
    fs.mkdirSync(uploadDir, { recursive: true });
  } catch (error) {
    logger.error("Failed to create upload directory", {
      context: "UPLOAD",
      error: error instanceof Error ? error : new Error(String(error)),
      data: { uploadDir },
    });
    throw new AppError(ErrorCode.FILE_WRITE_ERROR, "Unable to save uploaded file.");
  }

  const filePath = path.join(uploadDir, sanitizedName);

  try {
    fs.writeFileSync(filePath, file);
  } catch (error) {
    const nodeError = error as NodeJS.ErrnoException;
    if (nodeError.code === "ENOSPC") {
      throw new AppError(ErrorCode.STORAGE_FULL);
    }
    logger.error("Failed to write uploaded file", {
      context: "UPLOAD",
      error: nodeError,
      data: { filePath, fileSize: file.length },
    });
    throw new AppError(ErrorCode.FILE_WRITE_ERROR);
  }

  return { filePath, fileName: sanitizedName };
}

export function cleanupUploadFile(filePath: string): void {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch {
    logger.warn("Failed to cleanup upload file", {
      context: "UPLOAD",
      data: { filePath },
    });
  }
}

export function validateProfileResult(profile: {
  totalRows: number;
  totalColumns: number;
}): void {
  if (profile.totalRows < MIN_ROWS) {
    throw new AppError(
      ErrorCode.DATASET_EMPTY,
      "Dataset contains no data rows."
    );
  }
  if (profile.totalColumns > MAX_COLUMNS) {
    throw new AppError(
      ErrorCode.DATASET_TOO_LARGE,
      `Dataset has ${profile.totalColumns} columns (max: ${MAX_COLUMNS}).`
    );
  }
}

export function handleProfilingError(
  error: unknown,
  datasetId: string
): never {
  if (error instanceof AppError) throw error;

  if (error instanceof Error) {
    if (
      error.message.includes("parse") ||
      error.message.includes("delimiter")
    ) {
      logger.profiling("parse_failed", {
        datasetId,
        error,
      });
      throw new AppError(ErrorCode.DATASET_PARSE_ERROR, undefined, {
        cause: error,
      });
    }

    if (
      error.message.includes("encoding") ||
      error.message.includes("decode")
    ) {
      logger.profiling("encoding_failed", {
        datasetId,
        error,
      });
      throw new AppError(ErrorCode.DATASET_ENCODING_ERROR, undefined, {
        cause: error,
      });
    }

    if (error.message.includes("corrupt") || error.message.includes("invalid")) {
      logger.profiling("corrupt_file", { datasetId, error });
      throw new AppError(ErrorCode.FILE_CORRUPT, undefined, { cause: error });
    }

    if (error.message.includes("memory") || error.message.includes("heap")) {
      logger.profiling("out_of_memory", { datasetId, error });
      throw new AppError(
        ErrorCode.DATASET_TOO_LARGE,
        "Dataset is too large to process. Try a smaller file.",
        { cause: error }
      );
    }
  }

  logger.profiling("unexpected_failure", {
    datasetId,
    error: error instanceof Error ? error : new Error(String(error)),
  });
  throw new AppError(ErrorCode.DATASET_PROFILING_FAILED, undefined, {
    cause: error instanceof Error ? error : undefined,
  });
}
