# Tomorrow's Leaders Today

A Next.js application for managing and tracking grant opportunities and funding information.

## Tech Stack

- **Next.js 13** (App Router)
- **React** (underlying library)
- **Tailwind CSS** (utility-first CSS framework)
- **TypeScript** (for type-safe JavaScript)
- **Prisma** (ORM for PostgreSQL database)
- **PostgreSQL** (database)

## Features

- Grant management system
- Funding opportunity tracking
- Application requirement documentation
- Timeline and deadline tracking
- Contact information management

## Getting Started

### Prerequisites

- Node.js 18.x or later
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
npm install
```

3. Set up your environment variables:
```bash
cp .env.example .env.local
```
Edit `.env.local` with your database credentials and other configuration.

4. Run database migrations:
```bash
npx prisma migrate dev
```

5. Start the development server:
```bash
npm run dev
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

- Run tests: `npm test`
- Build for production: `npm run build`
- Start production server: `npm start`

## License

This project is licensed under the MIT License - see the LICENSE file for details.

