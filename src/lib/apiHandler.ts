import { NextRequest, NextResponse } from "next/server";
import { getSession, type JWTPayload } from "@/lib/auth";
import { AppError, ErrorCode, createErrorResponse } from "@/lib/errors";
import { logger } from "@/lib/logger";

type RouteHandler = (
  request: NextRequest,
  session: JWTPayload,
  context?: Record<string, unknown>
) => Promise<NextResponse>;

type PublicRouteHandler = (
  request: NextRequest,
  context?: Record<string, unknown>
) => Promise<NextResponse>;

interface RouteOptions {
  requireAuth?: boolean;
  context?: string;
}

export function createApiHandler(
  handler: RouteHandler,
  options: RouteOptions = {}
) {
  const { requireAuth = true, context = "API" } = options;

  return async (
    request: NextRequest,
    routeContext?: { params: Promise<Record<string, string>> }
  ): Promise<NextResponse> => {
    const requestId =
      request.headers.get("x-request-id") || crypto.randomUUID();
    const start = performance.now();
    const method = request.method;
    const path = request.nextUrl.pathname;
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "unknown";

    try {
      let session: JWTPayload | null = null;

      if (requireAuth) {
        session = await getSession();
        if (!session) {
          logger.auth("unauthorized_access", {
            ip,
            success: false,
          });
          throw new AppError(ErrorCode.AUTH_REQUIRED, undefined, {
            requestId,
          });
        }
      }

      const params = routeContext?.params
        ? await routeContext.params
        : undefined;
      const ctx: Record<string, unknown> = { requestId, params };

      const response = await handler(
        request,
        session!,
        ctx
      );

      const duration = Math.round(performance.now() - start);
      logger.request(method, path, response.status, duration, {
        requestId,
        userId: session?.userId,
        ip,
      });

      response.headers.set("X-Request-Id", requestId);
      return response;
    } catch (error) {
      const duration = Math.round(performance.now() - start);
      const { body, status } = createErrorResponse(error, requestId);

      logger.request(method, path, status, duration, {
        requestId,
        ip,
      });

      if (!(error instanceof AppError)) {
        logger.error(`Unhandled error in ${method} ${path}`, {
          context,
          requestId,
          error: error instanceof Error ? error : new Error(String(error)),
        });
      }

      const response = NextResponse.json(body, { status });
      response.headers.set("X-Request-Id", requestId);
      return response;
    }
  };
}

export function createPublicHandler(
  handler: PublicRouteHandler,
  options: { context?: string } = {}
) {
  return createApiHandler(
    async (request, _session, ctx) => handler(request, ctx),
    { requireAuth: false, context: options.context }
  );
}
