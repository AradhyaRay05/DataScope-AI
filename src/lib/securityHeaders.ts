import { NextResponse } from "next/server";

export interface SecurityHeaders {
  [key: string]: string;
}

export function getSecurityHeaders(): SecurityHeaders {
  return {
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "X-XSS-Protection": "1; mode=block",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
    "X-DNS-Prefetch-Control": "on",
    "Strict-Transport-Security":
      "max-age=63072000; includeSubDomains; preload",
    "Content-Security-Policy": [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: blob: https://images.unsplash.com https://stream.mux.com",
      "media-src 'self' https://stream.mux.com",
      "connect-src 'self' https://stream.mux.com",
      "frame-ancestors 'none'",
    ].join("; "),
  };
}

export function applySecurityHeaders(response: NextResponse): NextResponse {
  const headers = getSecurityHeaders();
  for (const [key, value] of Object.entries(headers)) {
    response.headers.set(key, value);
  }
  return response;
}
