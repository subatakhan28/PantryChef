# PantryChef

> Cook with what you already have.

A pantry-aware, AI-assisted recipe recommendation web app. Users add the ingredients they have at home, and PantryChef ranks recipes by how close they are to cooking each one — with substitution and simplification powered by an LLM.

**Cuisine focus:** Pakistani, Indo-Chinese, Chinese, Japanese, Italian, Western comfort food.

---

## Tech stack

| Layer            | Choice                                              |
| ---------------- | --------------------------------------------------- |
| Framework        | Next.js 15 (App Router, React 19, Turbopack)        |
| Language         | TypeScript (strict)                                 |
| Styling          | Tailwind CSS v4 (CSS-based theming) + shadcn/ui     |
| Animations       | Framer Motion                                       |
| Auth             | Supabase Auth (email/password + Google OAuth)       |
| Database         | Supabase Postgres + Prisma ORM                      |
| Storage          | Supabase Storage                                    |
| State            | Zustand (client) + Server Components (server)       |
| Forms            | React Hook Form + Zod                               |
| AI               | OpenAI SDK (provider-agnostic abstraction)          |
| Hosting          | Vercel                                              |

---

## Prerequisites

- **Node.js 20.x or 22.x LTS** — `node -v` must work in your shell.
- **A Supabase project** (free tier is fine).
- **An OpenAI API key** (only needed for AI-enhancement features).

---

## First-time setup

### 1. Install dependencies

```powershell
npm install
```

This will also run `prisma generate` automatically (configured in `postinstall`).

### 2. Create a Supabase project

1. Go to https://supabase.com/dashboard and create a new project.
2. Pick a strong database password — you'll need it for the connection strings.
3. Wait for the project to provision (~1 min).

### 3. Configure environment variables

```powershell
Copy-Item .env.example .env.local
```

Open `.env.local` and fill in the following from the **Supabase Dashboard**:

| Variable | Where to find it |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Project Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Project Settings → API → anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Project Settings → API → service_role key (server only) |
| `DATABASE_URL` | Project Settings → Database → Connection string → **Transaction** mode (port 6543). Append `?pgbouncer=true&connection_limit=1` |
| `DIRECT_URL` | Project Settings → Database → Connection string → **Session** mode (port 5432) |
| `OPENAI_API_KEY` | https://platform.openai.com/api-keys |

> **DATABASE_URL vs DIRECT_URL** — Supabase requires the pooled connection (PgBouncer) for serverless runtime, but Prisma migrations need a direct connection. We pass both; Prisma uses `directUrl` automatically for migrations.

### 4. Apply the database schema

```powershell
npm run prisma:migrate -- --name init
```

This creates all tables defined in `prisma/schema.prisma`.

### 5. Apply Supabase-specific SQL (RLS, triggers, storage buckets)

In the **Supabase Dashboard → SQL Editor**, open `supabase/migrations/0001_init.sql` from this repo and run it. This sets up:

- Row Level Security policies for every user-owned table
- A trigger that creates a `public.users` row when a user signs up via Supabase Auth
- The `recipe-images` and `avatars` storage buckets with read/write policies

### 6. Configure authentication providers

In **Supabase Dashboard → Authentication → Providers**:

- **Email** — Enabled by default. Set "Confirm email" to ON for production.
- **Google** —
  1. Toggle on Google provider.
  2. Create OAuth credentials at https://console.cloud.google.com/apis/credentials.
  3. Set the authorized redirect URI to: `https://YOUR-PROJECT-REF.supabase.co/auth/v1/callback`
  4. Paste the Client ID and Client Secret into Supabase.

In **Authentication → URL Configuration**:

- Site URL: `http://localhost:3000` (dev) / your prod URL.
- Redirect URLs: add `http://localhost:3000/auth/callback` and your prod equivalent.

### 7. Seed ingredient aliases

```powershell
npm run db:seed:aliases
```

(Recipe seed lands in Phase 3.)

### 8. Run the dev server

```powershell
npm run dev
```

Open http://localhost:3000.

---

## Folder structure

```
app/
  (auth)/                    Public auth routes (login, signup, password reset)
    actions.ts               Server actions for sign in / sign up / sign out
  (app)/                     Authenticated app routes (dashboard, pantry, recipes)
  auth/
    callback/route.ts        OAuth + magic-link redirect handler
    confirm/route.ts         Email-confirmation handler
    sign-out/route.ts        Sign-out endpoint
  layout.tsx
  page.tsx                   Landing page
  globals.css                Tailwind v4 + theme tokens

components/
  ui/                        shadcn/ui primitives
  auth/                      Auth forms
  pantry/                    Pantry-specific UI (Phase 2)
  recipes/                   Recipe-specific UI (Phase 3)
  dashboard/                 Dashboard widgets (Phase 2)

lib/
  env.ts                     Zod-validated env vars
  prisma.ts                  Prisma singleton
  utils.ts                   `cn()` helper
  supabase/
    client.ts                Browser client
    server.ts                Server-component / server-action client
    middleware.ts            Session-refresh helper for middleware
    admin.ts                 Service-role client (NEVER import in client code)
  ingredients/
    normalize.ts             Normalization utility (used everywhere)
    aliases.ts               Seed alias data
  ai/                        OpenAI integration (Phase 4)

services/                    Business logic (recipe matching, etc.) — Phase 3+
hooks/                       Client hooks
types/                       Shared TypeScript types
prisma/
  schema.prisma              Source of truth for the schema
  seed.ts                    Recipe seed (Phase 3)
  seed-aliases.ts            Ingredient alias seed
supabase/
  migrations/                Hand-written SQL for RLS, triggers, storage
middleware.ts                Refreshes Supabase session cookies on every request
```

---

## Available commands

| Command                       | What it does                                            |
| ----------------------------- | ------------------------------------------------------- |
| `npm run dev`                 | Start dev server (Turbopack, http://localhost:3000)     |
| `npm run build`               | `prisma generate` + production build                    |
| `npm start`                   | Run the production build                                |
| `npm run lint`                | Run ESLint                                              |
| `npm run typecheck`           | Run `tsc --noEmit`                                      |
| `npm run prisma:migrate`      | Create + apply a new migration in dev                   |
| `npm run prisma:deploy`       | Apply pending migrations in prod (used by CI)           |
| `npm run prisma:studio`       | Open Prisma Studio                                      |
| `npm run db:seed`             | Run the recipe seed                                     |
| `npm run db:seed:aliases`     | Seed the ingredient alias table                         |

---

## Deployment (Vercel)

1. Push this repo to GitHub.
2. Import the project in Vercel.
3. Set every variable from `.env.example` in **Vercel → Project → Settings → Environment Variables**, scoped to **Production**, **Preview**, and **Development** as appropriate.
4. Set the Vercel build command to `npm run build` (default works — runs `prisma generate` first thanks to our script).
5. After the first deploy, run `npm run prisma:deploy` against production. The cleanest way is via Vercel's CLI: `vercel env pull .env.production.local && npx prisma migrate deploy`.
6. Update Supabase **Authentication → URL Configuration** with the production site URL and redirect URLs.

---

## Build phases

This project is being delivered in coherent phases, not all at once:

| Phase | Status | Includes |
| --- | --- | --- |
| **1. Foundation** | ✅ Done (this commit) | Project scaffold, Prisma schema, Supabase clients, auth flow (email + Google), middleware, landing-page shell, UI primitives, ingredient normalization util |
| **2. Pantry + Onboarding** | next | Pantry CRUD, ingredient autocomplete, onboarding wizard, dashboard layout |
| **3. Recipes + Matching** | next | Recipe seed (100+ recipes), match-percentage engine, recipe browse/filter UI, saved recipes |
| **4. AI features** | next | Substitution suggestions, "make this vegetarian", "what can I cook in 20 min", recipe simplification |
| **5. Polish** | next | Skeleton loaders, empty states, animations, performance, image optimization |

---

## License

Private — not yet licensed for redistribution.
