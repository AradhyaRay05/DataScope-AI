# Production Deployment Guide

## Frontend: Vercel

1. Connect GitHub repository to Vercel
2. Set environment variables in Vercel dashboard:
   - `DATABASE_URL` — PostgreSQL connection string
   - `JWT_SECRET` — Random 32+ char secret
   - `CSRF_SECRET` — Random 32+ char secret
   - `NODE_ENV=production`
3. Build command: `npm run build`
4. Output: `.next`

## Database: PostgreSQL

### Migration from SQLite to PostgreSQL

1. Update `prisma/schema.prisma`:
   ```
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```

2. Remove `@prisma/adapter-libsql` and `@libsql/client` dependencies

3. Update `src/lib/db.ts`:
   ```typescript
   import { PrismaClient } from "@/generated/prisma/client";
   const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };
   export const prisma = globalForPrisma.prisma ?? new PrismaClient();
   if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
   ```

4. Run migration:
   ```bash
   npx prisma migrate dev --name init
   npx prisma migrate deploy
   ```

### Recommended Providers
- **Neon** — Serverless PostgreSQL (free tier available)
- **Supabase** — PostgreSQL with dashboard
- **Railway** — Simple PostgreSQL hosting

## CI/CD: GitHub Actions

Create `.github/workflows/ci.yml` (see template in repo).

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `JWT_SECRET` | Yes | JWT signing secret (32+ chars) |
| `CSRF_SECRET` | Yes | CSRF token secret |
| `NODE_ENV` | Yes | `production` |
| `ALLOWED_ORIGINS` | No | Comma-separated CORS origins |

## Backup Strategy

- PostgreSQL: Enable automated daily backups via provider
- File uploads: Sync `data/uploads/` to S3/R2
- Reports: Generated on-demand, no backup needed

## Performance Checklist

- [ ] Enable Next.js ISR for static pages
- [ ] Configure CDN for static assets
- [ ] Enable database connection pooling
- [ ] Set up Redis for rate limiting (replace in-memory)
- [ ] Configure file upload to S3/R2 instead of local disk
- [ ] Enable gzip/brotli compression
