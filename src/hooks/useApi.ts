"use client";

import { useState, useCallback } from "react";

interface ApiOptions {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
}

export function useApi() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const request = useCallback(
    async <T>(url: string, options: ApiOptions = {}): Promise<T> => {
      setLoading(true);
      setError(null);
      try {
        const fetchOptions: RequestInit = {
          method: options.method || "GET",
          headers: {
            ...options.headers,
          },
        };

        if (options.body !== undefined) {
          if (options.body instanceof FormData) {
            fetchOptions.body = options.body;
          } else {
            (fetchOptions.headers as Record<string, string>)["Content-Type"] =
              "application/json";
            fetchOptions.body = JSON.stringify(options.body);
          }
        }

        const res = await fetch(url, fetchOptions);
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || `Request failed with status ${res.status}`);
        }

        return data as T;
      } catch (err) {
        const message = err instanceof Error ? err.message : "An error occurred";
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return { request, loading, error };
}
