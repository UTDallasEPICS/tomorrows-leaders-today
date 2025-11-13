# Tomorrow's Leaders Today

A Next.js application for managing and tracking grant opportunities and funding information.

## Tech Stack

- **Next.js 13** (App Router)
- **React** (underlying library)
- **Tailwind CSS** (utility-first CSS framework)
- **TypeScript** (for type-safe JavaScript)
- **Prisma** (ORM for SQLite database)
- **SQLite** (database)

## Features

- Grant management system
- Funding opportunity tracking
- Application requirement documentation
- Timeline and deadline tracking
- Contact information management

## Getting Started

### Prerequisites

- Node.js 18.x or later
- pnpm
- PostgreSQL database
- Environment variables set up (see `.env.example`)

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

3. Set up your environment variables:
```bash
cp .env.example .env
```
Edit `.env.local` with your database credentials and other configuration.

4. Generate the Prisma client
```bash
pnpm exec prisma generate
```

5. Run database migrations:
```bash
pnpm exec prisma migrate dev
```

6. Start the development server:
```bash
pnpm run dev
```

The application will be available at `http://localhost:3000`.

## Database Schema

The application uses a PostgreSQL database with the following main entities:
- Grant Categories
- Grants
- Grant Timelines
- Application Requirements
- Contacts
- Grant Stipulations
- Funding Opportunities

For detailed schema information, refer to `prisma/schema.prisma`.

## Development

- Run tests: `pnpm test`
- Build for production: `pnpm run build`
- Start production server: `pnpm start`

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Seeding mock data

For development and testing you can populate the SQLite database with hardcoded mock grants and related records using the provided script.

1. Ensure dependencies are installed and Prisma client is generated:
```bash
pnpm install
pnpm exec prisma generate
```

2. Run the mock seed script:
```bash
pnpm run seed:mock
```

This script will upsert categories, grants, timelines, requirements, contacts, stipulations, and funding opportunities. It is safe to run multiple times — existing grants (by externalId) are skipped.

## ChangeLog (status history)

We added a `ChangeLog` model to record grant status changes. When a grant's status is updated through the UI, a ChangeLog row is created with:
- reference to the Grant
- reference to the User who made the change (or a system user)
- originalStatus and newStatus
- updatedAt timestamp

To test this locally:
1. Run migrations and generate client:
```bash
pnpm exec prisma migrate dev
pnpm exec prisma generate
```
2. Seed mock data (creates grants + test user + change logs):
```bash
pnpm run seed:mock
```
3. Start the dev server and open the Grant Tracker. The status dropdown in the Grant table updates the grant and records ChangeLog entries:
```bash
pnpm run dev
```

