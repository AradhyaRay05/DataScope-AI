# DataScope AI — Agent Instructions

## Project Overview

DataScope AI is a production-ready Dataset Intelligence Platform built with Next.js 16, TypeScript, Prisma ORM, SQLite, and Tailwind CSS v4. It provides automated dataset profiling, statistical analysis, quality scoring, correlation analysis, interactive visualizations, report generation, and dataset comparison.

## Architecture

### Stack
- **Frontend**: Next.js 16 App Router, React 19, TypeScript, Tailwind CSS v4, Recharts, Motion
- **Backend**: Next.js API Routes (REST), Prisma ORM, SQLite (PostgreSQL-ready)
- **Auth**: JWT (jose) with HttpOnly cookies, bcryptjs password hashing
- **Profiling Engine**: Custom TypeScript engines (no Python dependencies)
- **File Processing**: PapaParse (CSV), SheetJS/xlsx (Excel)
- **Testing**: Vitest
- **Deployment**: Vercel-ready, GitHub Actions CI/CD

### Directory Structure
```
src/
├── app/                    # Next.js App Router
│   ├── api/               # REST API routes
│   │   ├── auth/          # Authentication endpoints
│   │   ├── datasets/      # Dataset CRUD, upload, compare, report, analysis
│   │   ├── dashboard/     # Dashboard statistics
│   │   ├── notifications/ # User notifications
│   │   ├── reports/       # Report download/delete
│   │   ├── search/        # Global search + saved searches
│   │   └── user/          # User settings
│   ├── auth/              # Auth pages (login, register, forgot-password)
│   ├── dashboard/         # Dashboard + dataset detail pages
│   ├── providers.tsx      # Client-side providers (ErrorBoundary, Notifications)
│   └── layout.tsx         # Root layout
├── components/
│   ├── ui/                # Reusable primitives (Button, Input, Card, Modal, Badge, Select, ErrorBoundary, Skeleton, Notifications)
│   ├── charts/            # VisualizationStudio component
│   ├── auth/              # Auth-related components
│   └── dashboard/         # Dashboard-specific components
├── engine/                # Pure TypeScript data processing (NO React/Next.js imports)
│   ├── analyzers/         # Per-type analyzers (numeric, categorical, datetime, boolean, text)
│   ├── __tests__/         # Engine unit tests
│   ├── profiler.ts        # Main profiling orchestrator
│   ├── statistics.ts      # Statistical computations
│   ├── typeDetection.ts   # Column type detection
│   ├── quality.ts         # 10-factor quality scoring
│   ├── correlation.ts     # Pearson/Spearman/Kendall + multicollinearity
│   ├── missingAnalysis.ts # Missing value analysis
│   ├── duplicateDetection.ts # Row/column duplicates
│   └── comparison.ts      # Dataset comparison
├── hooks/                 # React hooks (useAuth, useApi)
├── lib/                   # Shared utilities
│   ├── __tests__/         # Lib unit tests
│   ├── db.ts              # Prisma client singleton
│   ├── auth.ts            # JWT sign/verify, session management
│   ├── errors.ts          # AppError class, 41 error codes, error responses
│   ├── logger.ts          # Structured logging (5 levels, 7 specialized methods)
│   ├── apiHandler.ts      # API route wrapper (auth, timing, error handling, logging)
│   ├── uploadHandler.ts   # Upload validation, file save, profiling error handling
│   ├── dbErrorHandler.ts  # Prisma error mapping
│   ├── notifications.ts   # In-app notification creator
│   ├── activity.ts        # Activity logging to database
│   ├── cache.ts           # In-memory LRU cache with TTL
│   ├── jobQueue.ts        # Background job processor
│   ├── queryOptimizer.ts  # Cached database queries
│   ├── validation.ts      # Zod schemas for all inputs
│   ├── sanitize.ts        # Input sanitization
│   ├── rateLimit.ts       # Rate limiting
│   ├── csrf.ts            # CSRF tokens
│   ├── cors.ts            # CORS config
│   ├── securityHeaders.ts # Security headers
│   ├── rbac.ts            # Role-based access control
│   └── utils.ts           # General utilities
├── middleware.ts           # Next.js middleware (rate limit, security, CORS, CSRF)
├── types/index.ts         # TypeScript type definitions
└── generated/prisma/      # Generated Prisma client (do not edit)
```

## Coding Standards

### Rules
1. **No comments** unless explicitly requested
2. **TypeScript strict mode** — no `any`, explicit return types on exports
3. **Zod validation** on every API request
4. **AppError** for all API error responses (never raw `NextResponse.json({ error })`)
5. **`createApiHandler()`** wrapper for all API routes
6. **`logger`** for all logging (never bare `console.log/error`)
7. **No secrets in code** — use environment variables

### Naming Conventions
| Type | Convention | Examples |
|------|-----------|----------|
| Components | PascalCase | `Button.tsx`, `ErrorBoundary.tsx` |
| Utilities/lib | camelCase | `rateLimit.ts`, `sanitize.ts` |
| API routes | `route.ts` | Next.js convention |
| Types | PascalCase interfaces | `ColumnProfileData`, `QualityBreakdown` |
| Constants | UPPER_SNAKE | `CACHE_TTL`, `RATE_LIMITS` |
| Database tables | PascalCase | `Dataset`, `ColumnProfile` |
| Database columns | camelCase | `qualityScore`, `nullPercentage` |
| CSS classes | Tailwind utilities | `bg-white/5`, `border-white/10` |

### API Route Pattern
```typescript
import { createApiHandler } from "@/lib/apiHandler";
import { AppError, ErrorCode } from "@/lib/errors";

export const POST = createApiHandler(async (request, session, ctx) => {
  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) throw new AppError(ErrorCode.VALIDATION_ERROR, parsed.error.issues[0].message);

  // Business logic
  return NextResponse.json({ data });
});
```

### Engine Pattern
- Pure TypeScript, no React/Next.js imports
- Export main function + result type
- Input validation in API route, not engine
- Return structured objects with summary, details, recommendations

### Frontend Pattern
- `"use client"` only for client components
- `forwardRef` for form primitives
- Barrel exports from `components/ui/index.ts`
- `font-[family-name:var(--font-instrument-sans)]` for typography
- Dark theme: bg `#000000`, text `white`, borders `white/[0.06]`
- Use `useApi()` hook for API calls (handles errors, loading, notifications)
- Use `useNotifications()` for toast messages

### Database
- Prisma ORM with SQLite (PostgreSQL-ready by changing `datasource.db`)
- All relations: `onDelete: Cascade`
- Index on every FK and frequently queried column
- JSON fields for complex nested data
- Migrations: `npx prisma migrate dev --name <name>`

### Security
- JWT in HttpOnly, Secure, SameSite cookies
- bcryptjs (12 rounds) for passwords
- Zod validation on all inputs
- `sanitizeString()` on user text
- Rate limiting via middleware (IP-based)
- Security headers: CSP, HSTS, X-Frame-Options
- RBAC via `hasPermission()`

## Build & Test Commands
```bash
npm run dev              # Development
npm run build            # Production build
npm run lint             # ESLint
npm run test             # Vitest
npm run test:coverage    # Coverage
npm run db:migrate       # Prisma migrate
npm run db:generate      # Prisma generate
```

## Adding a Feature
1. Schema: Update `prisma/schema.prisma` → `npm run db:migrate`
2. Types: Add to `src/types/index.ts`
3. Validation: Add Zod schema to `src/lib/validation.ts`
4. Engine: Pure logic in `src/engine/` if needed
5. API: `route.ts` with `createApiHandler()` wrapper
6. Frontend: Component with loading/error states, `useApi()` hook
7. Test: Add test in `__tests__/` directory
8. Build: `npm run build` to verify

## Performance
- In-memory cache (`src/lib/cache.ts`) with TTL and LRU eviction
- Background job queue (`src/lib/jobQueue.ts`) for profiling/reports
- Cached database queries (`src/lib/queryOptimizer.ts`)
- Chunked CSV parsing for large files
- Stratified sampling for datasets >100K rows
- DB indexes on all query columns

## Deployment
- Frontend: Vercel (auto-deploy from main branch)
- Database: PostgreSQL (Neon/Supabase/Railway)
- CI/CD: GitHub Actions (lint → test → build → deploy)
- See `DEPLOYMENT.md` for full instructions
