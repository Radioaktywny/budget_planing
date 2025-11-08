# Home Budget Manager - Backend

Backend API for the Home Budget Manager application.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env
```

3. Generate Prisma client:
```bash
npm run prisma:generate
```

4. Run database migrations:
```bash
npm run prisma:migrate
```

5. (Optional) Seed the database:
```bash
npm run prisma:seed
```

## Development

Start the development server:
```bash
npm run dev
```

The API will be available at `http://localhost:3001`

## Database

This project uses Prisma ORM with SQLite for development.

### Useful Commands

- `npm run prisma:generate` - Generate Prisma Client
- `npm run prisma:migrate` - Create and apply migrations
- `npm run prisma:studio` - Open Prisma Studio (database GUI)
- `npm run prisma:seed` - Seed the database with sample data

## Project Structure

```
backend/
├── prisma/
│   └── schema.prisma       # Database schema
├── src/
│   ├── routes/             # API route definitions
│   ├── controllers/        # Request handlers
│   ├── services/           # Business logic
│   ├── utils/              # Utility functions
│   └── index.ts            # Application entry point
├── uploads/                # File upload storage
└── dev.db                  # SQLite database (generated)
```

## API Endpoints

API documentation will be added as endpoints are implemented.

## Environment Variables

See `.env.example` for required environment variables.
