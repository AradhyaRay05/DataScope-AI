const ALLOWED_METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"];
const ALLOWED_HEADERS = [
  "Content-Type",
  "Authorization",
  "X-Requested-With",
  "X-CSRF-Token",
  "Accept",
  "Origin",
];
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",").map((o) => o.trim())
  : [];

export function getCorsHeaders(origin?: string): Record<string, string> {
  const headers: Record<string, string> = {
    "Access-Control-Allow-Methods": ALLOWED_METHODS.join(", "),
    "Access-Control-Allow-Headers": ALLOWED_HEADERS.join(", "),
    "Access-Control-Max-Age": "86400",
    "Access-Control-Allow-Credentials": "true",
  };

  if (ALLOWED_ORIGINS.length === 0) {
    if (origin) {
      headers["Access-Control-Allow-Origin"] = origin;
    }
  } else if (origin && ALLOWED_ORIGINS.includes(origin)) {
    headers["Access-Control-Allow-Origin"] = origin;
    headers.Vary = "Origin";
  }

  return headers;
}

export function handleCorsPreflightRequest(
  origin?: string
): Response | null {
  return new Response(null, {
    status: 204,
    headers: getCorsHeaders(origin),
  });
}
