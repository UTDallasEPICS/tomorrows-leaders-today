# Tomorrow's Leaders Today

A Next.js application for managing and tracking grant opportunities and funding information. Aggregates grants from multiple sources (grants.gov, mott.org, Texas state portals, and more) into a unified searchable interface with status tracking, filtering, and scheduled refresh.

## Tech Stack

- **Next.js 15** (App Router)
- **React 19**
- **TypeScript**
- **Tailwind CSS**
- **Prisma** (ORM)
- **PostgreSQL** via [Neon](https://neon.tech) (production) / SQLite (local dev optional)
- **Better Auth** with magic-link email sign-in
- **Puppeteer + Cheerio** for scraping
- **Google Cloud Run** for hosting
- **GitHub Actions** for scheduled scraping

## Features

- Aggregated grant tracking from 7+ external sources
- Keyword filtering (include / exclude / required fields), date-range filtering, server-side sorting
- Status workflow per grant with full audit log
- Stats dashboard with scrape history, source breakdown, and data quality metrics
- Automatic weekly scraping and monthly cleanup of stale grants
- Magic-link email authentication

## Getting Started (Local Development)

### Prerequisites

- [Node.js 20+](https://nodejs.org)
- [pnpm](https://pnpm.io/installation)
- A [Neon](https://neon.tech) database (free tier is fine), or local SQLite for quick experiments

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/your-username/tomorrows-leaders-today.git
   cd tomorrows-leaders-today
   ```

2. Install dependencies:

   ```bash
   pnpm install
   ```

3. Create a `.env` file at the project root:

   ```env
   DATABASE_URL=postgresql://neondb_owner:...@...neon.tech/neondb?sslmode=require
   BETTER_AUTH_URL=http://localhost:3000
   BETTER_AUTH_SECRET=your-generated-secret
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   NODEMAILER_USER=yourname@gmail.com
   NODEMAILER_PASS=your-gmail-app-password
   ```

   See **[DEPLOYMENT.md](./DEPLOYMENT.md)** for how to obtain each of these values (Neon connection string, Better Auth secret, Gmail App Password).

4. Push the Prisma schema to your database:

   ```bash
   pnpm exec prisma generate
   pnpm exec prisma db push
   ```

5. Start the dev server:

   ```bash
   pnpm dev
   ```

   The app will be available at http://localhost:3000.

## Running the Scraper Locally

To test the grant scraper against your dev database:

```bash
pnpm exec tsx src/runScrape.ts
```

To clean up expired grants:

```bash
pnpm exec tsx src/cleanup.ts            # actually deletes
pnpm exec tsx src/cleanup.ts --dry-run  # preview only, deletes nothing
```

## Deployment

For full step-by-step deployment instructions covering Google Cloud Run, Neon Postgres setup, scheduled scraping via GitHub Actions, and troubleshooting, see:

### **➡ [DEPLOYMENT.md](./DEPLOYMENT.md)**

The deployment guide is comprehensive and walks through every command and click required to go from a fresh repo to a fully running production deployment with scheduled jobs.

## Database Schema

The application schema lives in `prisma/schema.prisma`. Main entities include:

- `Grant` — core grant record (title, agency, dates, funding, application link, etc.)
- `GrantContact`, `AssistanceListing` — related metadata
- `GrantLog` — audit log of every status change with the user who made it
- `User`, `Session`, `Account`, `Verification` — Better Auth tables
- `SystemLog` — scrape and cleanup run history (capped at 20 entries per event type)

## Development Commands

| Command                          | Purpose                                 |
| -------------------------------- | --------------------------------------- |
| `pnpm dev`                       | Start dev server with hot reload        |
| `pnpm build`                     | Production build                        |
| `pnpm start`                     | Run the production build locally        |
| `pnpm exec prisma studio`        | Visual database explorer in the browser |
| `pnpm exec tsx src/runScrape.ts` | Run the scraper manually                |
| `pnpm exec tsx src/cleanup.ts`   | Run the stale-grant cleanup manually    |

## License

This project is licensed under the MIT License — see the LICENSE file for details.
