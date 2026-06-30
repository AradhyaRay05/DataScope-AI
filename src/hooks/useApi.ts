"use client";

import { useState, useCallback } from "react";
import { useNotifications } from "@/components/ui/NotificationSystem";

interface ApiError {
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
    requestId?: string;
    timestamp?: string;
  };
}

interface ApiOptions {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
  successMessage?: string;
  errorMessage?: string;
  showSuccess?: boolean;
  showError?: boolean;
}

const ERROR_USER_MESSAGES: Record<string, string> = {
  AUTH_REQUIRED: "Please sign in to continue.",
  AUTH_INVALID_CREDENTIALS: "Invalid email or password.",
  AUTH_TOKEN_EXPIRED: "Your session has expired. Please sign in again.",
  AUTH_ACCOUNT_EXISTS: "An account with this email already exists.",
  VALIDATION_ERROR: "Please check your input and try again.",
  DATASET_NOT_FOUND: "Dataset not found.",
  DATASET_TOO_LARGE: "File exceeds the 100MB limit.",
  DATASET_INVALID_FORMAT: "Please upload a CSV or Excel file.",
  DATASET_EMPTY: "The file is empty.",
  DATASET_PARSE_ERROR: "Unable to read the file. Ensure it's properly formatted.",
  DATASET_PROFILING_FAILED: "Analysis failed. Please try uploading again.",
  RATE_LIMIT_EXCEEDED: "Too many requests. Please wait a moment.",
  NETWORK_ERROR: "Connection lost. Please check your internet.",
  INTERNAL_ERROR: "Something went wrong. Please try again.",
};

function getUserMessage(code: string, fallback: string): string {
  return ERROR_USER_MESSAGES[code] || fallback;
}

export function useApi() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const notifications = useNotifications();

  const request = useCallback(
    async <T>(url: string, options: ApiOptions = {}): Promise<T> => {
      const {
        method = "GET",
        body,
        headers: extraHeaders,
        successMessage,
        errorMessage = "An error occurred.",
        showSuccess = false,
        showError = true,
      } = options;

      setLoading(true);
      setError(null);
      setErrorCode(null);

      try {
        const fetchOptions: RequestInit = {
          method,
          headers: { ...extraHeaders },
        };

        if (body !== undefined) {
          if (body instanceof FormData) {
            fetchOptions.body = body;
          } else {
            (fetchOptions.headers as Record<string, string>)["Content-Type"] =
              "application/json";
            fetchOptions.body = JSON.stringify(body);
          }
        }

        const res = await fetch(url, fetchOptions);
        const requestId = res.headers.get("X-Request-Id");

        if (!res.ok) {
          let apiError: ApiError | null = null;
          try {
            apiError = await res.json();
          } catch {
            /* response is not JSON */
          }

          const code = apiError?.error?.code || `HTTP_${res.status}`;
          const message = apiError?.error?.message || errorMessage;
          const userMsg = getUserMessage(code, message);

          setError(userMsg);
          setErrorCode(code);

          if (res.status === 401 && code === "AUTH_TOKEN_EXPIRED") {
            window.location.href = "/auth/login";
          }

          if (showError) {
            notifications.error(userMsg, requestId ? `Request ${requestId.slice(0, 8)}` : undefined);
          }

          throw new ApiRequestError(code, userMsg, res.status, requestId);
        }

        const data = await res.json();

        if (showSuccess && successMessage) {
          notifications.success(successMessage);
        }

        return data as T;
      } catch (err) {
        if (err instanceof ApiRequestError) throw err;

        if (err instanceof TypeError && err.message.includes("fetch")) {
          const networkMsg = "Connection lost. Please check your internet.";
          setError(networkMsg);
          setErrorCode("NETWORK_ERROR");
          if (showError) notifications.error(networkMsg);
          throw new ApiRequestError("NETWORK_ERROR", networkMsg, 0);
        }

        const fallbackMsg = err instanceof Error ? err.message : errorMessage;
        setError(fallbackMsg);
        setErrorCode("UNKNOWN");
        if (showError) notifications.error(fallbackMsg);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [notifications]
  );

  const clearError = useCallback(() => {
    setError(null);
    setErrorCode(null);
  }, []);

  return { request, loading, error, errorCode, clearError };
}

export class ApiRequestError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly requestId: string | null;

  constructor(
    code: string,
    message: string,
    statusCode: number,
    requestId?: string | null
  ) {
    super(message);
    this.name = "ApiRequestError";
    this.code = code;
    this.statusCode = statusCode;
    this.requestId = requestId ?? null;
  }
}
