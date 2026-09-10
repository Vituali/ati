# ATI Monorepo — Agent Guide

## Packages

| Directory | What | Stack |
|-----------|------|-------|
| `Extension/` | Chrome Extension (Manifest V3) | React 19, Vite 6, `@crxjs/vite-plugin`, TS 5.8 |
| `Frontend/` | Web Admin Panel (gh-pages at `/ati/`) | React 19, Vite 6, TS 5.8, vanilla CSS, PWA |
| `Backend/` | Fastify API (replaces Firebase gradually) | Fastify 5, Prisma + PostgreSQL, Zod, Firebase Admin SDK |

> `.cursorrules` / `README.md` use old names (`Site/`, `Extensão/`). Actual dirs are `Frontend/`, `Extension/`, `Backend/`.

## Essential Commands (run from root)

| Command | What it does |
|---------|-------------|
| `npm run install:all` | Installs deps for Extension + Frontend only (**not** Backend) |
| `npm run dev:site` | Vite dev server for Frontend (`vite --host`) |
| `npm run dev:extension` | Build extension in watch mode (`vite build --watch` — no dev server) |
| `npm run dev:api` | `tsx watch src/index.ts` for Backend |
| `npm run build` | Builds both Extension and Frontend |
| `npm run build:site` | Cleans + builds Frontend → `Frontend/build/` (auto-copies `index.html → 404.html` for SPA) |
| `npm run build:extension` | Cleans + typechecks (`tsc`) + builds → `Extension/build/` |
| `npm run zip:extension` | Builds + zips for Chrome Web Store |
| `npm run lint` | ESLint for both Extension + Frontend |
| `npm run format` | Prettier for both Extension + Frontend |
| `npm run deploy` | `gh-pages -d build` deploys Frontend (base: `/ati/`) |

### Backend setup (manual, not covered by `install:all`)

```bash
cd Backend
docker compose up -d postgres
cp .env.example .env
npm install
npm run db:generate
npm run db:push
npm run dev
```

Available at `localhost:3000`. Health check: `GET /api/health`.  
PostgreSQL service managed via root `start`/`stop` files (service name: `postgresql-x64-18`).

## CI & Testing

- **CI** (`.github/workflows/ci.yml`): on push/PR — install deps, lint, build for Extension + Frontend. No tests, no typecheck step.
- **No test framework** exists (no jest, vitest, playwright, etc. in any package).
- **Knip** (`knip.json`) configured at root for dead-code analysis.

## Extension Critical Rules

- **Service Worker must NOT import Firebase SDK** (`@firebase/app`, etc.) — use REST `fetch` only. Importing the SDK causes infinite loops and worker crashes.
- Extension builds via `vite build` (no `vite dev`); uses `crx({ manifest })` plugin. Dev mode uses `--watch`.
- `npm run dev:extension:prod` for production-like local testing with hot-reload.
- Extension eslint is relaxed (many TS rules off). Frontend eslint is stricter (includes `react-hooks` + `react-refresh` plugins).

## Styling & UI Conventions

- **Frontend**: vanilla CSS only (no Tailwind). Global CSS variables in `index.css`, per-component CSS files.
- **No emojis in UI** — use `lucide-react` icons.
- **i18n linter workaround**: wrap literal strings as JSX expressions: `<div>{"text"}</div>`.

## Security

- No bracket notation (`obj[userInput]`) — risk of prototype pollution. Use switch statements or helpers from `permissions.ts` (`getSetorLabel`, `getRoleLabel`).
- No path traversal in switch-env scripts — use absolute `path.resolve` constants.
- No `innerHTML` in extension — use `textContent`.
- postMessage tokens use `crypto.randomUUID()`.

## TypeScript Strictness

- **Frontend** `tsconfig.json`: `noUnusedLocals: true`, `noUnusedParams: true`. Prefix unused callback params with `_` (`_index`).
- **Extension**: build runs `tsc` (typechecks). Frontend has no typecheck step in build.

## React Hooks Rule (from `docs/ERROS_COMUNS.md`)

All hooks (`useState`, `useEffect`, `useMemo`, etc.) must be declared **before any early return**. Use optional chaining (`user?.setor`) in hook deps instead of guarding with `if (!user) return null` above hooks.

## Formatting (`.prettierrc`)

`singleQuote: true`, `semi: false`, `trailingComma: "all"`, `printWidth: 1000`, `endOfLine: "lf"`.

## Env

Both Extension and Frontend use `envDir: '../'` in their Vite config, reading `.env` from the repo root. The root `.env.example` has the Firebase variable template.

## Misc

- `htmlusados/` at root is gitignored stale reference material — not part of the codebase.
- `docs/CLAUDE_SITE.md` / `docs/CLAUDE_EXTENSION.md` exist but have been superseded by this file and `.cursorrules`.
- Log resolved bugs and new conventions in `docs/ERROS_COMUNS.md`. Other reference docs: `docs/FIREBASE_SCHEMA.md`, `docs/DATABASE_SCHEMA.md`, `docs/CHANGELOG.md`.

## Language

All communication, code comments, and UI text in **pt-BR**.
