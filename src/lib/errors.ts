export enum ErrorCode {
  AUTH_REQUIRED = "AUTH_REQUIRED",
  AUTH_INVALID_CREDENTIALS = "AUTH_INVALID_CREDENTIALS",
  AUTH_TOKEN_EXPIRED = "AUTH_TOKEN_EXPIRED",
  AUTH_INSUFFICIENT_PERMISSIONS = "AUTH_INSUFFICIENT_PERMISSIONS",
  AUTH_ACCOUNT_EXISTS = "AUTH_ACCOUNT_EXISTS",

  VALIDATION_ERROR = "VALIDATION_ERROR",
  INVALID_INPUT = "INVALID_INPUT",
  MISSING_FIELD = "MISSING_FIELD",
  INVALID_FORMAT = "INVALID_FORMAT",

  DATASET_NOT_FOUND = "DATASET_NOT_FOUND",
  DATASET_ALREADY_EXISTS = "DATASET_ALREADY_EXISTS",
  DATASET_TOO_LARGE = "DATASET_TOO_LARGE",
  DATASET_INVALID_FORMAT = "DATASET_INVALID_FORMAT",
  DATASET_EMPTY = "DATASET_EMPTY",
  DATASET_PARSE_ERROR = "DATASET_PARSE_ERROR",
  DATASET_ENCODING_ERROR = "DATASET_ENCODING_ERROR",
  DATASET_PROFILING_FAILED = "DATASET_PROFILING_FAILED",
  DATASET_NOT_PROFILED = "DATASET_NOT_PROFILED",

  FILE_READ_ERROR = "FILE_READ_ERROR",
  FILE_WRITE_ERROR = "FILE_WRITE_ERROR",
  FILE_CORRUPT = "FILE_CORRUPT",
  FILE_NOT_FOUND = "FILE_NOT_FOUND",
  STORAGE_FULL = "STORAGE_FULL",

  DB_ERROR = "DB_ERROR",
  DB_CONSTRAINT_VIOLATION = "DB_CONSTRAINT_VIOLATION",
  DB_CONNECTION_ERROR = "DB_CONNECTION_ERROR",

  REPORT_GENERATION_FAILED = "REPORT_GENERATION_FAILED",
  REPORT_NOT_FOUND = "REPORT_NOT_FOUND",

  SEARCH_ERROR = "SEARCH_ERROR",
  COMPARE_ERROR = "COMPARE_ERROR",

  RATE_LIMIT_EXCEEDED = "RATE_LIMIT_EXCEEDED",
  NETWORK_ERROR = "NETWORK_ERROR",
  INTERNAL_ERROR = "INTERNAL_ERROR",
  NOT_FOUND = "NOT_FOUND",
  CONFLICT = "CONFLICT",
}

const ERROR_STATUS_MAP: Record<ErrorCode, number> = {
  [ErrorCode.AUTH_REQUIRED]: 401,
  [ErrorCode.AUTH_INVALID_CREDENTIALS]: 401,
  [ErrorCode.AUTH_TOKEN_EXPIRED]: 401,
  [ErrorCode.AUTH_INSUFFICIENT_PERMISSIONS]: 403,
  [ErrorCode.AUTH_ACCOUNT_EXISTS]: 409,
  [ErrorCode.VALIDATION_ERROR]: 400,
  [ErrorCode.INVALID_INPUT]: 400,
  [ErrorCode.MISSING_FIELD]: 400,
  [ErrorCode.INVALID_FORMAT]: 400,
  [ErrorCode.DATASET_NOT_FOUND]: 404,
  [ErrorCode.DATASET_ALREADY_EXISTS]: 409,
  [ErrorCode.DATASET_TOO_LARGE]: 413,
  [ErrorCode.DATASET_INVALID_FORMAT]: 400,
  [ErrorCode.DATASET_EMPTY]: 400,
  [ErrorCode.DATASET_PARSE_ERROR]: 422,
  [ErrorCode.DATASET_ENCODING_ERROR]: 422,
  [ErrorCode.DATASET_PROFILING_FAILED]: 500,
  [ErrorCode.DATASET_NOT_PROFILED]: 400,
  [ErrorCode.FILE_READ_ERROR]: 500,
  [ErrorCode.FILE_WRITE_ERROR]: 500,
  [ErrorCode.FILE_CORRUPT]: 422,
  [ErrorCode.FILE_NOT_FOUND]: 404,
  [ErrorCode.STORAGE_FULL]: 507,
  [ErrorCode.DB_ERROR]: 500,
  [ErrorCode.DB_CONSTRAINT_VIOLATION]: 409,
  [ErrorCode.DB_CONNECTION_ERROR]: 503,
  [ErrorCode.REPORT_GENERATION_FAILED]: 500,
  [ErrorCode.REPORT_NOT_FOUND]: 404,
  [ErrorCode.SEARCH_ERROR]: 500,
  [ErrorCode.COMPARE_ERROR]: 500,
  [ErrorCode.RATE_LIMIT_EXCEEDED]: 429,
  [ErrorCode.NETWORK_ERROR]: 502,
  [ErrorCode.INTERNAL_ERROR]: 500,
  [ErrorCode.NOT_FOUND]: 404,
  [ErrorCode.CONFLICT]: 409,
};

const USER_MESSAGES: Record<ErrorCode, string> = {
  [ErrorCode.AUTH_REQUIRED]: "Please sign in to continue.",
  [ErrorCode.AUTH_INVALID_CREDENTIALS]: "Invalid email or password.",
  [ErrorCode.AUTH_TOKEN_EXPIRED]: "Your session has expired. Please sign in again.",
  [ErrorCode.AUTH_INSUFFICIENT_PERMISSIONS]: "You don't have permission to perform this action.",
  [ErrorCode.AUTH_ACCOUNT_EXISTS]: "An account with this email already exists.",
  [ErrorCode.VALIDATION_ERROR]: "The provided data is invalid.",
  [ErrorCode.INVALID_INPUT]: "One or more fields contain invalid values.",
  [ErrorCode.MISSING_FIELD]: "A required field is missing.",
  [ErrorCode.INVALID_FORMAT]: "The data format is not supported.",
  [ErrorCode.DATASET_NOT_FOUND]: "Dataset not found.",
  [ErrorCode.DATASET_ALREADY_EXISTS]: "A dataset with this name already exists.",
  [ErrorCode.DATASET_TOO_LARGE]: "The file exceeds the 100MB size limit.",
  [ErrorCode.DATASET_INVALID_FORMAT]: "Unsupported file format. Please upload a CSV or Excel file.",
  [ErrorCode.DATASET_EMPTY]: "The uploaded file is empty.",
  [ErrorCode.DATASET_PARSE_ERROR]: "Unable to parse the file. Ensure it is properly formatted.",
  [ErrorCode.DATASET_ENCODING_ERROR]: "Unable to read the file encoding. Try saving as UTF-8.",
  [ErrorCode.DATASET_PROFILING_FAILED]: "Dataset profiling failed. Please try again.",
  [ErrorCode.DATASET_NOT_PROFILED]: "This dataset has not been profiled yet.",
  [ErrorCode.FILE_READ_ERROR]: "Unable to read the file.",
  [ErrorCode.FILE_WRITE_ERROR]: "Unable to save the file.",
  [ErrorCode.FILE_CORRUPT]: "The file appears to be corrupt or damaged.",
  [ErrorCode.FILE_NOT_FOUND]: "The requested file was not found.",
  [ErrorCode.STORAGE_FULL]: "Storage limit reached. Please delete some datasets.",
  [ErrorCode.DB_ERROR]: "A database error occurred. Please try again.",
  [ErrorCode.DB_CONSTRAINT_VIOLATION]: "This operation conflicts with existing data.",
  [ErrorCode.DB_CONNECTION_ERROR]: "Unable to connect to the database. Please try again later.",
  [ErrorCode.REPORT_GENERATION_FAILED]: "Report generation failed. Please try again.",
  [ErrorCode.REPORT_NOT_FOUND]: "Report not found.",
  [ErrorCode.SEARCH_ERROR]: "Search encountered an error. Please try again.",
  [ErrorCode.COMPARE_ERROR]: "Dataset comparison failed. Please try again.",
  [ErrorCode.RATE_LIMIT_EXCEEDED]: "Too many requests. Please wait before trying again.",
  [ErrorCode.NETWORK_ERROR]: "A network error occurred. Please check your connection.",
  [ErrorCode.INTERNAL_ERROR]: "An unexpected error occurred. Please try again.",
  [ErrorCode.NOT_FOUND]: "The requested resource was not found.",
  [ErrorCode.CONFLICT]: "This action conflicts with the current state.",
};

export class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly statusCode: number;
  public readonly userMessage: string;
  public readonly details: Record<string, unknown> | undefined;
  public readonly isOperational: boolean;
  public readonly timestamp: string;
  public readonly requestId: string | undefined;

  constructor(
    code: ErrorCode,
    message?: string,
    options?: {
      details?: Record<string, unknown>;
      cause?: Error;
      requestId?: string;
    }
  ) {
    const userMessage = USER_MESSAGES[code] || "An error occurred.";
    super(message || userMessage);
    this.name = "AppError";
    this.code = code;
    this.statusCode = ERROR_STATUS_MAP[code] || 500;
    this.userMessage = userMessage;
    this.details = options?.details;
    this.isOperational = true;
    this.timestamp = new Date().toISOString();
    this.requestId = options?.requestId;

    if (options?.cause) {
      this.cause = options.cause;
    }

    Object.setPrototypeOf(this, AppError.prototype);
  }

  toJSON(): Record<string, unknown> {
    return {
      error: {
        code: this.code,
        message: this.userMessage,
        ...(this.details ? { details: this.details } : {}),
        ...(this.requestId ? { requestId: this.requestId } : {}),
        timestamp: this.timestamp,
      },
    };
  }
}

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

export function getErrorCode(error: unknown): ErrorCode {
  if (isAppError(error)) return error.code;
  if (error instanceof Error) {
    if (error.name === "PrismaClientKnownRequestError")
      return ErrorCode.DB_ERROR;
    if (error.name === "PrismaClientValidationError")
      return ErrorCode.VALIDATION_ERROR;
    if (error.message.includes("ECONNREFUSED"))
      return ErrorCode.DB_CONNECTION_ERROR;
    if (error.message.includes("ENOSPC")) return ErrorCode.STORAGE_FULL;
    if (error.message.includes("ENOENT")) return ErrorCode.FILE_NOT_FOUND;
    if (error.message.includes("EACCES")) return ErrorCode.FILE_READ_ERROR;
    if (error.message.includes("JSON"))
      return ErrorCode.VALIDATION_ERROR;
  }
  return ErrorCode.INTERNAL_ERROR;
}

export function createErrorResponse(
  error: unknown,
  requestId?: string
): { body: Record<string, unknown>; status: number } {
  if (isAppError(error)) {
    return { body: error.toJSON(), status: error.statusCode };
  }

  const code = getErrorCode(error);
  const appError = new AppError(code, undefined, {
    cause: error instanceof Error ? error : undefined,
    requestId,
  });

  return { body: appError.toJSON(), status: appError.statusCode };
}
