export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  FATAL = 4,
}

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: string;
  requestId?: string;
  userId?: string;
  data?: Record<string, unknown>;
  duration?: number;
  error?: {
    name: string;
    message: string;
    stack?: string;
    code?: string;
  };
}

const LEVEL_LABELS: Record<LogLevel, string> = {
  [LogLevel.DEBUG]: "DEBUG",
  [LogLevel.INFO]: "INFO",
  [LogLevel.WARN]: "WARN",
  [LogLevel.ERROR]: "ERROR",
  [LogLevel.FATAL]: "FATAL",
};

const MIN_LEVEL =
  process.env.NODE_ENV === "production" ? LogLevel.INFO : LogLevel.DEBUG;

function formatEntry(entry: LogEntry): string {
  const parts = [
    `[${entry.timestamp}]`,
    `${LEVEL_LABELS[entry.level]}`,
  ];
  if (entry.context) parts.push(`[${entry.context}]`);
  if (entry.requestId) parts.push(`[${entry.requestId.slice(0, 8)}]`);
  if (entry.userId) parts.push(`[user:${entry.userId.slice(0, 8)}]`);
  parts.push(entry.message);
  if (entry.duration !== undefined) parts.push(`(${entry.duration}ms)`);
  return parts.join(" ");
}

function emit(entry: LogEntry): void {
  if (entry.level < MIN_LEVEL) return;

  const formatted = formatEntry(entry);

  switch (entry.level) {
    case LogLevel.DEBUG:
      console.debug(formatted);
      break;
    case LogLevel.INFO:
      console.info(formatted);
      break;
    case LogLevel.WARN:
      console.warn(formatted, entry.data || "");
      break;
    case LogLevel.ERROR:
    case LogLevel.FATAL:
      console.error(formatted, entry.error || entry.data || "");
      break;
  }
}

function createEntry(
  level: LogLevel,
  message: string,
  options?: {
    context?: string;
    requestId?: string;
    userId?: string;
    data?: Record<string, unknown>;
    duration?: number;
    error?: Error;
  }
): LogEntry {
  const entry: LogEntry = {
    level,
    message,
    timestamp: new Date().toISOString(),
    context: options?.context,
    requestId: options?.requestId,
    userId: options?.userId,
    data: options?.data,
    duration: options?.duration,
  };

  if (options?.error) {
    entry.error = {
      name: options.error.name,
      message: options.error.message,
      stack: options.error.stack,
      code: (options.error as unknown as Record<string, unknown>).code as string | undefined,
    };
  }

  return entry;
}

export const logger = {
  debug(message: string, options?: { context?: string; data?: Record<string, unknown> }) {
    emit(createEntry(LogLevel.DEBUG, message, options));
  },

  info(message: string, options?: { context?: string; requestId?: string; userId?: string; data?: Record<string, unknown> }) {
    emit(createEntry(LogLevel.INFO, message, options));
  },

  warn(message: string, options?: { context?: string; requestId?: string; data?: Record<string, unknown> }) {
    emit(createEntry(LogLevel.WARN, message, options));
  },

  error(message: string, options?: { context?: string; requestId?: string; userId?: string; error?: Error; data?: Record<string, unknown> }) {
    emit(createEntry(LogLevel.ERROR, message, options));
  },

  fatal(message: string, options?: { context?: string; requestId?: string; error?: Error; data?: Record<string, unknown> }) {
    emit(createEntry(LogLevel.FATAL, message, options));
  },

  request(
    method: string,
    path: string,
    statusCode: number,
    duration: number,
    options?: { requestId?: string; userId?: string; ip?: string }
  ) {
    const level =
      statusCode >= 500
        ? LogLevel.ERROR
        : statusCode >= 400
          ? LogLevel.WARN
          : LogLevel.INFO;
    emit(
      createEntry(level, `${method} ${path} ${statusCode}`, {
        context: "HTTP",
        requestId: options?.requestId,
        userId: options?.userId,
        duration,
        data: { ip: options?.ip },
      })
    );
  },

  auth(event: string, options?: { userId?: string; email?: string; ip?: string; success?: boolean }) {
    emit(
      createEntry(
        options?.success === false ? LogLevel.WARN : LogLevel.INFO,
        `Auth: ${event}`,
        {
          context: "AUTH",
          userId: options?.userId,
          data: {
            email: options?.email,
            ip: options?.ip,
            success: options?.success,
          },
        }
      )
    );
  },

  upload(event: string, options?: { userId?: string; datasetId?: string; fileName?: string; fileSize?: number; error?: Error }) {
    emit(
      createEntry(
        options?.error ? LogLevel.ERROR : LogLevel.INFO,
        `Upload: ${event}`,
        {
          context: "UPLOAD",
          userId: options?.userId,
          data: {
            datasetId: options?.datasetId,
            fileName: options?.fileName,
            fileSize: options?.fileSize,
          },
          error: options?.error,
        }
      )
    );
  },

  profiling(event: string, options?: { datasetId?: string; duration?: number; columns?: number; rows?: number; error?: Error }) {
    emit(
      createEntry(
        options?.error ? LogLevel.ERROR : LogLevel.INFO,
        `Profiling: ${event}`,
        {
          context: "PROFILER",
          data: {
            datasetId: options?.datasetId,
            columns: options?.columns,
            rows: options?.rows,
          },
          duration: options?.duration,
          error: options?.error,
        }
      )
    );
  },

  db(operation: string, options?: { table?: string; duration?: number; error?: Error }) {
    emit(
      createEntry(
        options?.error ? LogLevel.ERROR : LogLevel.DEBUG,
        `DB: ${operation}`,
        {
          context: "DATABASE",
          data: { table: options?.table },
          duration: options?.duration,
          error: options?.error,
        }
      )
    );
  },

  performance(operation: string, duration: number, options?: { context?: string; data?: Record<string, unknown> }) {
    const level = duration > 5000 ? LogLevel.WARN : LogLevel.DEBUG;
    emit(
      createEntry(level, `Perf: ${operation}`, {
        context: options?.context || "PERF",
        duration,
        data: options?.data,
      })
    );
  },
};

export function withTiming<T>(
  operation: string,
  fn: () => Promise<T>,
  options?: { context?: string; data?: Record<string, unknown> }
): Promise<T> {
  const start = performance.now();
  return fn().then(
    (result) => {
      const duration = Math.round(performance.now() - start);
      logger.performance(operation, duration, options);
      return result;
    },
    (error) => {
      const duration = Math.round(performance.now() - start);
      logger.error(`${operation} failed`, {
        context: options?.context,
        error: error instanceof Error ? error : new Error(String(error)),
        data: { ...options?.data, duration },
      });
      throw error;
    }
  );
}
