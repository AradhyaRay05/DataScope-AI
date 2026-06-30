# DataScope AI — Agent Instructions

## Project Overview

DataScope AI is a production-ready Dataset Intelligence Platform built with Next.js 16, TypeScript, Prisma ORM, SQLite, and Tailwind CSS v4. It provides automated dataset profiling, statistical analysis, quality scoring, correlation analysis, interactive visualizations, report generation, and dataset comparison.

## Architecture

### Stack
- **Frontend**: Next.js 16 App Router, React 19, TypeScript, Tailwind CSS v4, Recharts, Motion
- **Backend**: Next.js API Routes (REST), Prisma ORM, SQLite
- **Auth**: JWT (jose) with HttpOnly cookies, bcryptjs password hashing
- **Profiling Engine**: Custom TypeScript engines (no Python dependencies)
- **File Processing**: PapaParse (CSV), SheetJS/xlsx (Excel)

### Directory Structure
```
src/
├── app/                    # Next.js App Router
│   ├── api/               # REST API routes
│   │   ├── auth/          # Authentication endpoints
│   │   ├── datasets/      # Dataset CRUD, upload, compare, report
│   │   ├── dashboard/     # Dashboard statistics
│   │   ├── notifications/ # User notifications
│   │   ├── reports/       # Report download/delete
│   │   ├── search/        # Search + saved searches
│   │   └── user/          # User settings
│   ├── auth/              # Auth pages (login, register, forgot-password)
│   ├── dashboard/         # Dashboard + dataset detail pages
│   └── layout.tsx         # Root layout with providers
├── components/
│   ├── ui/                # Reusable UI primitives (Button, Input, Card, Modal, Badge, Select, etc.)
│   ├── charts/            # Visualization components
│   ├── auth/              # Auth-related components
│   └── dashboard/         # Dashboard-specific components
├── engine/                # Data processing engines (NO dependencies on React/Next.js)
│   ├── analyzers/         # Per-type analyzers (numeric, categorical, datetime, boolean, text)
│   ├── profiler.ts        # Main profiling orchestrator
│   ├── statistics.ts      # Statistical computation functions
│   ├── typeDetection.ts   # Column type detection with heuristics
│   ├── quality.ts         # Data quality scoring (10 factors)
│   ├── correlation.ts     # Pearson/Spearman/Kendall + multicollinearity
│   ├── missingAnalysis.ts # Missing value patterns, heatmap, recommendations
│   ├── duplicateDetection.ts # Row/column duplicate detection
│   └── comparison.ts      # Dataset comparison engine
├── hooks/                 # Custom React hooks (useAuth, useApi)
├── lib/                   # Shared utilities
│   ├── db.ts              # Prisma client singleton
│   ├── auth.ts            # JWT sign/verify, session management
│   ├── validation.ts      # Zod schemas for all API inputs
│   ├── activity.ts        # Activity logging utility
│   ├── sanitize.ts        # Input sanitization (HTML escape, filename sanitize)
│   ├── rateLimit.ts       # In-memory rate limiter
│   ├── csrf.ts            # CSRF token generation/validation
│   ├── cors.ts            # CORS configuration
│   ├── securityHeaders.ts # Security headers (CSP, HSTS, X-Frame-Options)
│   ├── rbac.ts            # Role-based access control
│   └── utils.ts           # General utilities (formatBytes, formatDate, cn)
├── middleware.ts           # Next.js middleware (rate limiting, security headers, CORS, CSRF)
└── types/                 # TypeScript type definitions
```

## Coding Standards

### General Rules
1. **No comments** unless explicitly requested
2. **TypeScript strict mode** — no `any` types, explicit return types on exported functions
3. **Zod validation** on every API request body and query parameter
4. **Error handling** — every API route has try/catch with specific error messages
5. **Authentication** — every protected route calls `getSession()` first
6. **No `console.log` in production** — use `console.error` for error logging only

### File Naming
- Components: PascalCase (`Button.tsx`, `ErrorBoundary.tsx`)
- Utilities/lib: camelCase (`rateLimit.ts`, `sanitize.ts`)
- API routes: `route.ts` (Next.js convention)
- Types: `index.ts` in `types/` directory

### Component Patterns
- Use `"use client"` directive only for client components
- Use `forwardRef` for form primitives (Button, Input, Select)
- Export components from barrel files (`components/ui/index.ts`)
- Use `font-[family-name:var(--font-instrument-sans)]` for typography
- Dark theme only: bg `#000000`, text `white`, borders `white/[0.06]`

### API Route Pattern
```typescript
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
    }

    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    // Business logic

    return NextResponse.json({ data });
  } catch (error) {
    console.error("Route error:", error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
```

### Engine Pattern
- Engines are pure TypeScript functions with no React/Next.js imports
- Every engine exports a main analysis function and its result type
- Input validation happens in the API route, not the engine
- Engines return structured objects with summary, details, and recommendations

### Database
- Prisma ORM with SQLite (swap to PostgreSQL by changing `datasource.db`)
- All relations use `onDelete: Cascade`
- Index on every foreign key and frequently queried column
- JSON fields for complex nested data (tags, analysisData, correlationMatrix)
- Migrations via `npx prisma migrate dev`

### Security
- JWT tokens in HttpOnly, Secure, SameSite=Lax cookies
- Passwords hashed with bcryptjs (12 rounds)
- All user inputs sanitized via `sanitizeString()`
- Zod schemas for server-side validation
- Rate limiting via Next.js middleware (IP-based)
- Security headers: CSP, HSTS, X-Frame-Options, X-Content-Type-Options
- RBAC via `hasPermission()` checks

## Build Commands

```bash
npm run dev          # Development server
npm run build        # Production build
npm run lint         # ESLint check
npx prisma generate  # Regenerate Prisma client
npx prisma migrate dev --name <name>  # Create migration
```

## Adding a New Feature

1. **Schema**: Update `prisma/schema.prisma` if new models/fields needed
2. **Migration**: Run `npx prisma migrate dev --name <name>`
3. **Engine**: Implement pure logic in `src/engine/` if data processing needed
4. **Types**: Add interfaces to `src/types/index.ts`
5. **Validation**: Add Zod schema to `src/lib/validation.ts`
6. **API Route**: Create `route.ts` in appropriate `src/app/api/` directory
7. **Frontend**: Create page/component with proper loading states and error handling
8. **Build**: Run `npm run build` to verify zero errors

## Testing Approach

- Verify with `npm run build` (TypeScript type checking)
- Verify with `npm run lint` (ESLint)
- Manual testing via `npm run dev`
- No test framework configured yet — prefer build-time verification
