import { AppError, ErrorCode } from "@/lib/errors";
import { logger } from "@/lib/logger";

export function handleDbError(error: unknown, operation: string): never {
  if (error instanceof AppError) throw error;

  if (error instanceof Error) {
    const name = error.name;

    if (name === "PrismaClientKnownRequestError") {
      const prismaError = error as Error & { code?: string; meta?: Record<string, unknown> };

      if (prismaError.code === "P2002") {
        logger.db("constraint_violation", {
          table: String(prismaError.meta?.modelName || "unknown"),
          error,
        });
        throw new AppError(ErrorCode.DB_CONSTRAINT_VIOLATION, undefined, {
          cause: error,
          details: { operation, constraint: prismaError.meta?.target },
        });
      }

      if (prismaError.code === "P2025") {
        throw new AppError(ErrorCode.NOT_FOUND, "Record not found.", {
          cause: error,
        });
      }

      if (prismaError.code === "P2003") {
        throw new AppError(ErrorCode.DB_CONSTRAINT_VIOLATION, "Foreign key constraint failed.", {
          cause: error,
        });
      }

      logger.db("known_error", { error, table: String(prismaError.meta?.modelName || "unknown") });
      throw new AppError(ErrorCode.DB_ERROR, undefined, { cause: error });
    }

    if (name === "PrismaClientValidationError") {
      logger.db("validation_error", { error, table: operation });
      throw new AppError(ErrorCode.VALIDATION_ERROR, "Invalid data for database operation.", {
        cause: error,
      });
    }

    if (name === "PrismaClientInitializationError") {
      logger.db("connection_error", { error, table: operation });
      throw new AppError(ErrorCode.DB_CONNECTION_ERROR, undefined, { cause: error });
    }

    if (name === "PrismaClientRustPanicError") {
      logger.fatal("Prisma engine crashed", { context: "DATABASE", error });
      throw new AppError(ErrorCode.DB_ERROR, "Database engine error.", { cause: error });
    }
  }

  logger.db("unexpected_error", {
    error: error instanceof Error ? error : new Error(String(error)),
    table: operation,
  });
  throw new AppError(ErrorCode.DB_ERROR, undefined, {
    cause: error instanceof Error ? error : undefined,
  });
}
