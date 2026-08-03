# Kader Panel PMII Rayon Inklusif Justicia

Secure web application for managing kader (members) of PMII Rayon Inklusif Justicia.

## Tech Stack

- **Frontend:** HTML5, CSS3, Vanilla JavaScript
- **Backend:** Node.js, Vercel Serverless Functions
- **Database:** Neon PostgreSQL
- **Hosting:** Vercel

## Setup

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Copy `.env.example` to `.env` and fill in your credentials:
   ```
   cp .env.example .env
   ```
4. Set up the database by running the SQL migration:
   ```
   psql -d your_database_url -f sql/migration.sql
   ```
5. Run locally with:
   ```
   npm run dev
   ```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | Neon PostgreSQL connection string |
| `SESSION_SECRET` | Secret key for cookie sessions |

## Project Structure

```
├── api/            # Vercel Serverless Functions
│   ├── auth/       # Authentication endpoints (login, logout, register)
│   ├── kader/      # Kader CRUD endpoints
│   └── admin/      # Admin-only endpoints
├── lib/            # Shared libraries
│   └── db.js       # PostgreSQL Pool connection
├── public/         # Static frontend files
│   ├── css/        # Stylesheets
│   ├── js/         # JavaScript files
│   └── pages/      # HTML pages
├── sql/            # Database migrations
│   └── migration.sql
├── package.json
├── vercel.json
└── .env.example
```

