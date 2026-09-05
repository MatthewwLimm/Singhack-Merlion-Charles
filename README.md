# Continuum

An AI-assisted relationship-manager workbench for private banking, built for SingHacks 2026 on the synthetic Julius Baer dataset. Next.js 16 (App Router) frontend, Supabase (Postgres) backend.

The product follows one loop: **Understand → Decide → Personalise → Follow through.**

- **Morning Cockpit** (`/`) — which clients need attention today, and why, ranked by a deterministic rules engine (not an LLM).
- **Clients** (`/clients`) and **Client 360** (`/clients/[id]`) — full profile: portfolios, holdings, credit, cash needs, RM notes, insights, recommendation history.
- **Action Queue** (`/actions`) — review/approve/defer/reject recommendations before anything reaches a client.
- **Advice Ledger** (`/ledger`) — persistent, auditable history of every recommendation.

## Stack

- Next.js 16 (App Router, Server Components + Server Actions), React 19, Tailwind 4, shadcn/base-ui.
- Supabase (Postgres + RLS). No auth yet — see [Security notes](#security-notes).
- `pnpm` as the package manager (see `pnpm-workspace.yaml`).

## Getting started

```bash
pnpm install
cp .env.example .env.local   # fill in the three values below
pnpm db:setup                # migrate + seed + validate + generate insights/recommendations
pnpm dev
```

### Environment variables (`.env.local`)

| Variable | Where to find it | Used by |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase dashboard → Project Settings → API | the app (browser + server) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | same page, "anon / public" key | the app (browser + server) |
| `DATABASE_URL` | Project Settings → Database → Connection string. If your network can't reach the IPv6-only direct host, use the **Session pooler** URI instead (IPv4). | `scripts/*` only (migrations, seeding) — never used by the app itself |

Never commit `.env.local`. `.gitignore` already excludes `.env*.local`; `.env.example` holds variable names only.

## Repository layout

```
app/                  Next.js routes (Server Components) + co-located Server Actions
  clients/[id]/        Client 360 page, notes-actions.ts, recommendation-actions.ts
  actions/              Action Queue page + actions.ts
  ledger/                Advice Ledger page + client-side table
components/
  ui/                  shadcn/base-ui primitives
  continuum/           feature components (cards, panels, tabs, badges)
  shell/               application shell / navigation
lib/
  supabase/            Supabase client factory + hand-written row/Database types
  *-display.ts, *.ts   pure display/formatting adapters (no DB access)
services/              the data-access layer — every Supabase query lives here,
                        never inline in a component. One file per entity group,
                        plus client360.ts (aggregator) and cockpit.ts (rules engine)
data/                  the official source dataset (CSV + rm_notes.json) — read-only
scripts/               migrate / seed / validate / generate-insights / generate-recommendations
supabase/migrations/   the schema, as plain reproducible SQL
```

**Data access rule:** components never call Supabase directly. Server Components call `services/*` functions; Client Components trigger mutations via `'use server'` Server Actions (in `app/**/actions.ts` / `*-actions.ts`), which call the same `services/*` functions.

## Database

`supabase/migrations/` (applied in order):

1. `20260101000001_source_schema.sql` — mirrors the official dataset: `clients`, `portfolios`, `holdings`, `instruments`, `transactions`, `credit_facilities`, `commitments`, `planned_cash_needs`, `market_context`, `event_log`, `rm_notes`, plus `mandates`/`mandate_allocations` and the `*_snapshots`/`*_prices` tables normalised out of the source CSVs' wide per-date columns.
2. `20260101000002_app_schema.sql` — product-generated tables: `insights` + `insight_evidence` (every generated insight must trace to source rows), `recommendations` + `recommendation_events` (the advice lifecycle/audit trail).
3. `20260101000003_rls_policies.sql` — Row Level Security on every table.
4. `20260101000004_grants.sql` — the matching Postgres `GRANT`s (RLS alone doesn't grant table access).

Business keys from the source files (`CL-0001`, `PF-0001`, ...) are kept as primary keys rather than replaced with UUIDs. Application tables (`insights`, `recommendations`, ...) use `uuid` since they have no natural key.

### Seeding

```bash
pnpm db:migrate          # apply any pending migration (idempotent, tracked in _migrations)
pnpm db:seed             # import /data/*.csv + rm_notes.json (idempotent upserts)
pnpm db:validate         # row counts vs source files + FK/orphan checks
pnpm db:insights         # deterministic rules engine → insights + insight_evidence
pnpm db:recommendations  # one draft recommendation per open Critical/High insight
pnpm db:setup            # all of the above, in order
```

All scripts connect via `DATABASE_URL` directly (not through the Supabase API), so they work the same whether that's a local Postgres, a Docker-based local Supabase, or a hosted Supabase project.

### Insights & recommendations are rules-based, not AI

`services/insight-rules.ts` and `services/cockpit.ts` are a small set of documented, deterministic thresholds (e.g. "credit facility within 5pp of its margin-call LTV") — explicitly not an LLM. Every insight carries `insight_evidence` rows tracing back to the exact source records that triggered it. This is the intended seam for a future AI layer to plug into, without changing the schema or the UI that reads it.

## Security notes

No authentication exists yet — this is a single-RM prototype (the dataset itself has exactly one RM). RLS is enabled on every table:

- Source tables (the official dataset) are **read-only** from the app.
- Application tables (`rm_notes`, `insights`, `recommendations`, `recommendation_events`, plus `UPDATE`/`INSERT` on `clients`) have **open** dev policies, clearly commented in the migration as temporary — replace with `auth.uid()`-scoped policies once RM login exists.
- The browser only ever holds the anon/publishable key. The service-role key is never used anywhere in this project; seeding uses a direct Postgres connection instead.

`deleteClient` is intentionally not implemented in `services/clients.ts` — a client is `ON DELETE RESTRICT`-protected by nine dependent tables, and a "safe" cascading delete isn't worth building for this prototype.
