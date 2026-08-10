# MAC Group Links

Production-ready Next.js app for **Maharaja Agrasen College** students to find WhatsApp/Telegram group links for SEC, VAC, GE, DSE, AEC, and Core papers by active semester.

## Requirements

- **Node.js** 20+ (tested on 26.x)
- **PostgreSQL** 14+
- **npm** 10+

## Quick start

```bash
cd abvp-mac-imp
cp .env.example .env.local
# Edit .env.local with DATABASE_URL, ADMIN_USERNAME, ADMIN_PASSWORD, SESSION_SECRET (32+ chars)

npm install
npx prisma generate
npm run db:migrate:dev   # or: npm run db:migrate in production
npm run db:seed          # development sample catalogue + sample groups
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Database with Docker

```bash
docker compose up -d
```

Use `DATABASE_URL="postgresql://mac:mac@localhost:5433/mac_group_links?schema=public"` (see `.env.example`).

## Environment variables

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | PostgreSQL connection string |
| `ADMIN_USERNAME` | Admin panel username (server only) |
| `ADMIN_PASSWORD` | Admin panel password (server only) |
| `SESSION_SECRET` | Cookie encryption secret (min 32 characters) |

Never commit `.env.local` or real credentials.

## Admin

- Login: `/admin/login`
- After login: dashboard, semesters, papers, contributions, suggestions, reports, audit log
- **New semester** starts with an **empty** paper catalogue; add papers manually or import JSON from **Admin → Papers**
- Sample seed group links use `https://example.com/sample-mac-group-do-not-use-*` — not real groups

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run start` | Run production server |
| `npm run lint` | ESLint |
| `npm run db:migrate:dev` | Create/apply migrations (dev) |
| `npm run db:migrate` | Apply migrations (production) |
| `npm run db:seed` | Load dev courses, semester, papers, sample groups |

## Deploy (Vercel)

1. Create a Postgres database (Neon, Supabase, Railway, etc.)
2. Set all environment variables in the Vercel project
3. Build command: `npm run build`
4. Add a deploy step or post-deploy hook: `npx prisma migrate deploy`
5. Ensure `postinstall` runs `prisma generate` (already in `package.json`)

## Data model notes

- **Department room** on a paper = offering department room from official MAC lists
- **Actual class room** on a group = where that section meets (optional)
- Public contributions and suggestions stay **pending** until an admin approves them

## Project layout

- `app/(public)/` — student-facing routes
- `app/admin/` — login + protected admin UI
- `lib/actions/` — server actions
- `lib/db/` — Prisma client and queries
- `prisma/` — schema, migrations, seed data
