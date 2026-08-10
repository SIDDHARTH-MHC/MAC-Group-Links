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
npm run db:seed          # reset DB from repo files (official catalogue; no demo groups)
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

## MAC courses (master list)

Canonical courses live in `prisma/data/courses.json` (10 programmes — **not** one course per B.A. combination).

- **B.A. Programme** uses the separate **`combination`** field on eligibility (e.g. `English + Economics`, `OMSP + Mathematics`). In the UI, OMSP combinations display as **Commerce + …** (same stream; MAC now also calls this Commerce).
- Other courses: B.Com. (Hons.), English (Hons.), Hindi (Hons.), B.B.E., Journalism (Hons.), Political Science (Hons.), B.Sc. Mathematical Sciences, B.Sc. Physical Sciences, Electronics (Hons.).

Update production DB courses without re-seeding papers:

```bash
npm run db:seed-courses
```

## Admin

- Login: `/admin/login`
- After login: dashboard, semesters, papers, contributions, suggestions, reports, audit log
- **New semester** starts with an **empty** paper catalogue; add papers manually or import JSON from **Admin → Papers**
- Group links start empty; students contribute links via the public site

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run start` | Run production server |
| `npm run lint` | ESLint |
| `npm run db:migrate:dev` | Create/apply migrations (dev) |
| `npm run db:migrate` | Apply migrations (production) |
| `npm run db:seed` | Load departments, courses, active semester, and official papers from `prisma/data/` (no sample groups) |

## Official catalogue (PDF → JSON)

Reference PDFs (do not edit):

- `prisma/data/reference/Optional Paper List Sem 1.pdf`
- `prisma/data/reference/SEM 3,5,7 (1).pdf`

Extract structured data:

```bash
npm run catalogue:extract
```

Outputs:

- `prisma/data/papers-official.json` — import source (papers + eligibility + source page; **no groups**)
- `docs/catalogue-extraction-report.md` — counts, review flags, DSE coverage notes

Admin: **Paper catalogue → Import from official PDF extract** — preview by catalogue semester (1/3/5/7), then confirm import into the selected DB semester.

Re-run `catalogue:extract` when MAC publishes new PDFs; adjust `scripts/extract_official_catalogue.py` if layout changes.

## Deploy (Vercel)

1. Create a Postgres database (Neon, Supabase, Railway, etc.)
2. Set all environment variables in the Vercel project (`DATABASE_URL`, admin auth, `SESSION_SECRET`)
3. **Build command** is defined in `vercel.json` as `npm run vercel-build` (runs `prisma migrate deploy` with a 120s advisory lock timeout, then `next build`). Do not run `db:seed` against production while a deploy is in progress — both compete for the same migration lock.
4. For Neon, prefer a **direct** (non-pooler) connection for migrations if you add `directUrl` later; the pooler URL is fine for the app at runtime.
5. `postinstall` runs `prisma generate` (see `package.json`)

If a deploy fails with **P1002 advisory lock**, wait for any local `npm run db:seed` to finish and redeploy, or run migrations once locally with `npm run db:migrate` and temporarily set Vercel build to `npm run build` only.

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
