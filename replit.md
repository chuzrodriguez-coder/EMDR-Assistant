# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Structure

```text
artifacts-monorepo/
├── artifacts/              # Deployable applications
│   ├── api-server/         # Express API server
│   ├── emdr-app/           # React + Vite web app (therapist & patient views)
│   └── emdr-mobile/        # Expo React Native mobile app (iOS + Android via Expo Go)
├── lib/                    # Shared libraries
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks + setBaseUrl for Expo
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   └── db/                 # Drizzle ORM schema + DB connection
├── scripts/                # Utility scripts (single workspace package)
│   └── src/                # Individual .ts scripts, run via `pnpm --filter @workspace/scripts run <script>`
├── pnpm-workspace.yaml     # pnpm workspace (artifacts/*, lib/*, lib/integrations/*, scripts)
├── tsconfig.base.json      # Shared TS options (composite, bundler resolution, es2022)
├── tsconfig.json           # Root TS project references
└── package.json            # Root package with hoisted devDeps
```

## EMDR Mobile App (artifacts/emdr-mobile)

Expo Router file-based navigation. Screens:
- `app/index.tsx` — Landing: role selection (Therapist / Patient)
- `app/therapist/login.tsx` — Therapist login
- `app/therapist/register.tsx` — Therapist registration
- `app/therapist/dashboard.tsx` — Dashboard: create sessions, copy codes
- `app/therapist/session/[code].tsx` — Session control: play/pause, speed, color presets
- `app/patient/index.tsx` — Patient: OTP-style 6-digit code entry
- `app/patient/session/[code].tsx` — Full-screen animated bilateral stimulation dot

Key implementation notes:
- `setBaseUrl(https://${EXPO_PUBLIC_DOMAIN})` called in `_layout.tsx` before any component
- Cookie-based auth works via React Native's native cookie jar
- Patient view polls `/api/sessions/:code/state` every 750ms via React Query `refetchInterval`
- Dot animation uses `react-native-reanimated` `withRepeat + withTiming + reverse: true`; duration = `speedSeconds * 1000ms` per direction (matching web CSS `animation-direction: alternate`)
- No EventSource/SSE on mobile — polling used instead
- Theme: deep navy `#060C18` background, orchid `#DA70D6` primary accent

## TypeScript & Composite Projects

Every package extends `tsconfig.base.json` which sets `composite: true`. The root `tsconfig.json` lists all packages as project references. This means:

- **Always typecheck from the root** — run `pnpm run typecheck` (which runs `tsc --build --emitDeclarationOnly`). This builds the full dependency graph so that cross-package imports resolve correctly. Running `tsc` inside a single package will fail if its dependencies haven't been built yet.
- **`emitDeclarationOnly`** — we only emit `.d.ts` files during typecheck; actual JS bundling is handled by esbuild/tsx/vite...etc, not `tsc`.
- **Project references** — when package A depends on package B, A's `tsconfig.json` must list B in its `references` array. `tsc --build` uses this to determine build order and skip up-to-date packages.

## Root Scripts

- `pnpm run build` — runs `typecheck` first, then recursively runs `build` in all packages that define it
- `pnpm run typecheck` — runs `tsc --build --emitDeclarationOnly` using project references

## Auth: Clerk (migrated from custom cookie auth)

- **Authentication**: Clerk handles all auth (email/password + Google OAuth + Apple Sign In)
- **Web sign-in**: `/sign-in` and `/sign-up` routes use Clerk's built-in `<SignIn>` and `<SignUp>` components
- **Mobile sign-in**: `useSignIn`, `useSignUp`, `useSSO` from `@clerk/expo`; token cache via `expo-secure-store`
- **Backend sync**: On first login, web `ProtectedRoute` and mobile `AuthProvider` call `POST /api/auth/sync` with name+email. This is idempotent — creates DB record if missing.
- **Pending accounts**: After sign-up, account starts as `status=pending`. Admin must activate via Admin Panel (`/?admin=admin`) before therapist can create sessions.
- **Admin Panel**: Accessible at `/?admin=admin`. Uses Clerk auth to check `isSignedIn` + `isAdmin`. Access denied shown for non-admin users.
- **Admin account setup**: After DB wipe, admin user must sign up via Clerk, then manually set `status='active', is_admin=true` in DB.
- **Clerk proxy path**: `CLERK_PROXY_PATH=/api/__clerk` (production only; dev uses Clerk CDN directly)
- **Clerk env vars**: `CLERK_SECRET_KEY`, `CLERK_PUBLISHABLE_KEY` (server), `VITE_CLERK_PUBLISHABLE_KEY` (web), `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` (mobile, injected at startup)
- **Email**: Resend integration sends patient invite email. No admin notification on registration (handled by Clerk email verification).
- **Saved themes**: Therapists can save up to 6 color themes. Stored in `saved_themes` table.
- **Session codes**: Unique 6-digit codes, expire after 24hrs, blocked for 30 days in `used_session_codes` table.
- **SSE**: Real-time sync via Server-Sent Events in-memory map.
- **Default colors**: Navy #000080 bg, Orchid #DA70D6 dot.
- **APP_URL env var**: Set to the Replit dev domain.

## DB Schema

- `therapists`: id, name, email, clerk_user_id (NOT NULL UNIQUE), status (pending/active), is_admin, created_at, updated_at
- `therapist_sessions`: session code, therapist_id, expires_at, is_playing, speed_seconds, dot_color, background_color
- `used_session_codes`: code, used_at
- `saved_themes`: id, therapist_id, dot_color, background_color, created_at
- (Note: `auth_sessions` table and `password_hash`/`activation_token` columns were dropped in Clerk migration)

## Packages

### `artifacts/api-server` (`@workspace/api-server`)

Express 5 API server. Routes live in `src/routes/` and use `@workspace/api-zod` for request and response validation and `@workspace/db` for persistence.

- Entry: `src/index.ts` — reads `PORT`, starts Express
- App setup: `src/app.ts` — mounts CORS, JSON/urlencoded parsing, routes at `/api`
- Routes: `src/routes/index.ts` mounts sub-routers; `src/routes/health.ts` exposes `GET /health` (full path: `/api/health`)
- Depends on: `@workspace/db`, `@workspace/api-zod`
- `pnpm --filter @workspace/api-server run dev` — run the dev server
- `pnpm --filter @workspace/api-server run build` — production esbuild bundle (`dist/index.cjs`)
- Build bundles an allowlist of deps (express, cors, pg, drizzle-orm, zod, etc.) and externalizes the rest

### `lib/db` (`@workspace/db`)

Database layer using Drizzle ORM with PostgreSQL. Exports a Drizzle client instance and schema models.

- `src/index.ts` — creates a `Pool` + Drizzle instance, exports schema
- `src/schema/index.ts` — barrel re-export of all models
- `src/schema/<modelname>.ts` — table definitions with `drizzle-zod` insert schemas (no models definitions exist right now)
- `drizzle.config.ts` — Drizzle Kit config (requires `DATABASE_URL`, automatically provided by Replit)
- Exports: `.` (pool, db, schema), `./schema` (schema only)

Production migrations are handled by Replit when publishing. In development, we just use `pnpm --filter @workspace/db run push`, and we fallback to `pnpm --filter @workspace/db run push-force`.

### `lib/api-spec` (`@workspace/api-spec`)

Owns the OpenAPI 3.1 spec (`openapi.yaml`) and the Orval config (`orval.config.ts`). Running codegen produces output into two sibling packages:

1. `lib/api-client-react/src/generated/` — React Query hooks + fetch client
2. `lib/api-zod/src/generated/` — Zod schemas

Run codegen: `pnpm --filter @workspace/api-spec run codegen`

### `lib/api-zod` (`@workspace/api-zod`)

Generated Zod schemas from the OpenAPI spec (e.g. `HealthCheckResponse`). Used by `api-server` for response validation.

### `lib/api-client-react` (`@workspace/api-client-react`)

Generated React Query hooks and fetch client from the OpenAPI spec (e.g. `useHealthCheck`, `healthCheck`).

### `scripts` (`@workspace/scripts`)

Utility scripts package. Each script is a `.ts` file in `src/` with a corresponding npm script in `package.json`. Run scripts via `pnpm --filter @workspace/scripts run <script>`. Scripts can import any workspace package (e.g., `@workspace/db`) by adding it as a dependency in `scripts/package.json`.
