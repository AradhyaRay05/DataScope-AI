# DataScope AI

Dataset Intelligence Platform — Upload, profile, analyze, and visualize datasets.

## Quick Start

```bash
npm install
npm run db:generate
npm run db:migrate
npm run dev
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run start` | Production server |
| `npm run lint` | ESLint check |
| `npm run test` | Run tests |
| `npm run test:watch` | Watch mode tests |
| `npm run test:coverage` | Coverage report |
| `npm run db:migrate` | Run database migrations |
| `npm run db:generate` | Regenerate Prisma client |
| `npm run db:studio` | Prisma Studio GUI |

## Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

Required variables:
- `DATABASE_URL` — SQLite file path or PostgreSQL connection string
- `JWT_SECRET` — Secret key for JWT signing (min 32 chars)
- `CSRF_SECRET` — Secret key for CSRF tokens

## Architecture

- **Frontend**: Next.js 16 App Router, React 19, Tailwind CSS v4
- **Backend**: Next.js API Routes, Prisma ORM
- **Engine**: Custom TypeScript profiling engines
- **Auth**: JWT with HttpOnly cookies

## Testing

```bash
npm run test            # Run all tests
npm run test:coverage   # With coverage report
```

## Deployment

See `DEPLOYMENT.md` for production deployment instructions.
