import { describe, it, expect } from "vitest";
import { AppError, ErrorCode, isAppError, createErrorResponse } from "../errors";
import { escapeHtml, sanitizeString, sanitizeFilename, stripHtml, isValidEmail, isValidUuid } from "../sanitize";
import { generateCsrfToken, validateCsrfToken } from "../csrf";

describe("AppError", () => {
  it("creates error with correct properties", () => {
    const error = new AppError(ErrorCode.DATASET_NOT_FOUND);
    expect(error.code).toBe("DATASET_NOT_FOUND");
    expect(error.statusCode).toBe(404);
    expect(error.userMessage).toBe("Dataset not found.");
    expect(error.isOperational).toBe(true);
    expect(error.timestamp).toBeDefined();
  });

  it("serializes to JSON", () => {
    const error = new AppError(ErrorCode.VALIDATION_ERROR, "Custom message");
    const json = error.toJSON();
    expect(json.error).toBeDefined();
    expect((json.error as Record<string, unknown>).code).toBe("VALIDATION_ERROR");
  });

  it("is identified by isAppError", () => {
    const error = new AppError(ErrorCode.INTERNAL_ERROR);
    expect(isAppError(error)).toBe(true);
    expect(isAppError(new Error("test"))).toBe(false);
  });

  it("creates error response", () => {
    const error = new AppError(ErrorCode.AUTH_REQUIRED);
    const { body, status } = createErrorResponse(error);
    expect(status).toBe(401);
    expect(body.error).toBeDefined();
  });

  it("handles unknown errors", () => {
    const { body, status } = createErrorResponse(new Error("unknown"));
    expect(status).toBe(500);
    expect(body.error).toBeDefined();
  });
});

describe("sanitize", () => {
  it("escapes HTML entities", () => {
    expect(escapeHtml('<script>alert("xss")</script>')).toBe(
      "&lt;script&gt;alert(&quot;xss&quot;)&lt;&#x2F;script&gt;"
    );
  });

  it("sanitizes strings", () => {
    expect(sanitizeString("  hello  ")).toBe("hello");
    expect(sanitizeString("test\x00null")).toBe("testnull");
  });

  it("sanitizes filenames", () => {
    expect(sanitizeFilename("my file (1).csv")).toBe("my_file_1_.csv");
    expect(sanitizeFilename("../../../etc/passwd")).toBe("etc_passwd");
  });

  it("strips HTML tags", () => {
    expect(stripHtml("<p>Hello <b>world</b></p>")).toBe("Hello world");
  });

  it("validates email", () => {
    expect(isValidEmail("test@example.com")).toBe(true);
    expect(isValidEmail("invalid")).toBe(false);
    expect(isValidEmail("a@b.c")).toBe(true);
  });

  it("validates UUID", () => {
    expect(isValidUuid("550e8400-e29b-41d4-a716-446655440000")).toBe(true);
    expect(isValidUuid("not-a-uuid")).toBe(false);
  });
});

describe("CSRF", () => {
  it("generates and validates tokens", () => {
    const sessionId = "test-session-123";
    const token = generateCsrfToken(sessionId);
    expect(validateCsrfToken(token, sessionId)).toBe(true);
  });

  it("rejects invalid tokens", () => {
    expect(validateCsrfToken("invalid", "session")).toBe(false);
    expect(validateCsrfToken("", "session")).toBe(false);
  });

  it("rejects tokens for different sessions", () => {
    const token = generateCsrfToken("session-a");
    expect(validateCsrfToken(token, "session-b")).toBe(false);
  });
});
