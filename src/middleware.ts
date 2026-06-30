import { NextRequest, NextResponse } from "next/server";
import { getSecurityHeaders } from "@/lib/securityHeaders";

const PUBLIC_PATHS = [
  "/",
  "/auth/login",
  "/auth/register",
  "/auth/forgot-password",
  "/api/auth/login",
  "/api/auth/register",
  "/api/auth/reset-password",
];

const PROTECTED_PATHS = [
  "/dashboard",
  "/api/datasets",
  "/api/dashboard",
  "/api/search",
  "/api/reports",
  "/api/notifications",
  "/api/user",
];

const RATE_LIMIT_STORE = new Map<
  string,
  { count: number; resetAt: number }
>();

function getClientIp(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

function checkRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number
): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const entry = RATE_LIMIT_STORE.get(key);

  if (!entry || entry.resetAt < now) {
    RATE_LIMIT_STORE.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: maxRequests - 1 };
  }

  entry.count++;
  return {
    allowed: entry.count <= maxRequests,
    remaining: Math.max(0, maxRequests - entry.count),
  };
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const origin = request.headers.get("origin");
  const method = request.method;
  const ip = getClientIp(request);

  const response = NextResponse.next();

  const securityHeaders = getSecurityHeaders();
  for (const [key, value] of Object.entries(securityHeaders)) {
    response.headers.set(key, value);
  }

  if (origin) {
    response.headers.set("Access-Control-Allow-Origin", origin);
    response.headers.set("Access-Control-Allow-Credentials", "true");
    response.headers.set(
      "Access-Control-Allow-Methods",
      "GET, POST, PUT, PATCH, DELETE, OPTIONS"
    );
    response.headers.set(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization, X-Requested-With, X-CSRF-Token"
    );
    response.headers.set("Access-Control-Max-Age", "86400");
  }

  if (method === "OPTIONS") {
    return new NextResponse(null, { status: 204, headers: response.headers });
  }

  if (pathname.startsWith("/api/")) {
    const isAuthEndpoint = pathname.startsWith("/api/auth/");

    if (isAuthEndpoint) {
      const { allowed, remaining } = checkRateLimit(
        `auth:${ip}`,
        10,
        15 * 60 * 1000
      );
      if (!allowed) {
        return NextResponse.json(
          { error: "Too many authentication attempts. Please try again later." },
          {
            status: 429,
            headers: {
              "Retry-After": "900",
              "X-RateLimit-Remaining": "0",
            },
          }
        );
      }
      response.headers.set("X-RateLimit-Remaining", String(remaining));
    } else if (pathname.includes("/upload")) {
      const { allowed, remaining } = checkRateLimit(
        `upload:${ip}`,
        20,
        60 * 60 * 1000
      );
      if (!allowed) {
        return NextResponse.json(
          { error: "Upload rate limit exceeded." },
          { status: 429, headers: { "Retry-After": "3600" } }
        );
      }
      response.headers.set("X-RateLimit-Remaining", String(remaining));
    } else if (pathname.includes("/report")) {
      const { allowed, remaining } = checkRateLimit(
        `report:${ip}`,
        10,
        60 * 60 * 1000
      );
      if (!allowed) {
        return NextResponse.json(
          { error: "Report generation rate limit exceeded." },
          { status: 429 }
        );
      }
      response.headers.set("X-RateLimit-Remaining", String(remaining));
    } else {
      const { allowed, remaining } = checkRateLimit(`api:${ip}`, 200, 60 * 1000);
      if (!allowed) {
        return NextResponse.json(
          { error: "Rate limit exceeded." },
          { status: 429 }
        );
      }
      response.headers.set("X-RateLimit-Remaining", String(remaining));
    }

    const needsCsrf = ["POST", "PUT", "PATCH", "DELETE"].includes(method);
    const isPublicAuth = isAuthEndpoint && method === "POST";

    if (needsCsrf && !isPublicAuth) {
      const csrfToken = request.headers.get("x-csrf-token");
      const cookieToken = request.cookies.get("datascope-token")?.value;

      if (!cookieToken) {
        return NextResponse.json(
          { error: "Authentication required." },
          { status: 401 }
        );
      }
    }

    if (needsCsrf) {
      const contentType = request.headers.get("content-type");
      if (
        contentType &&
        !contentType.includes("application/json") &&
        !contentType.includes("multipart/form-data") &&
        !contentType.includes("application/x-www-form-urlencoded")
      ) {
        return NextResponse.json(
          { error: "Invalid Content-Type." },
          { status: 415 }
        );
      }
    }
  }

  const isProtected = PROTECTED_PATHS.some((p) => pathname.startsWith(p));
  const isPublic = PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );

  if (isProtected && !isPublic) {
    const token = request.cookies.get("datascope-token")?.value;
    if (!token && !pathname.startsWith("/api/")) {
      const url = request.nextUrl.clone();
      url.pathname = "/auth/login";
      url.searchParams.set("redirect", pathname);
      return NextResponse.redirect(url);
    }
  }

  response.headers.set("X-Request-Id", crypto.randomUUID());

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.svg$).*)",
  ],
};
