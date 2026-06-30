# Agents.md — re-calculator

## Stack

- React 19 + Vite 6 + Tailwind CSS v4 (`@tailwindcss/vite` plugin)
- TypeScript with `moduleResolution: "bundler"`, `paths: {"@/*": ["./*"]}` — import from root as `@/src/...`
- Devbox (Node.js 22.22.2) — run `devbox shell` first if not already in it

## Commands

| Command | What it does |
|---|---|
| `npm run dev` | Dev server on `0.0.0.0:3000` |
| `npm run build` | Vite production build |
| `npm run lint` | **Type-check only** (`tsc --noEmit`) — no ESLint, no Prettier |
| `npm run clean` | `rm -rf dist server.js` |

No test framework or test files exist.

## Architecture

Single-page React app in `src/`:
- `src/main.tsx` — mount point (renders `<App />` into `#root`)
- `src/App.tsx` — all UI state, presets, rendering, CSV export
- `src/financialEngine.ts` — pure calculation functions (`runFinancialModel`, `calculateMonthlyIRR`, `formatINR`)
- `src/types.ts` — `CalculatorInputs`, `CalculatorOutputs`, `AmortizationMonth`, `YearlySummary`

Key conventions:
- All monetary values in raw `number` (no currency class). INR formatting via `Intl.NumberFormat('en-IN')` — use `formatINR()` / `formatLargeINR()` helpers from `financialEngine.ts`
- IRR solver: binary search with bracket expansion in `calculateMonthlyIRR`; annual IRR derived as `(1 + monthly)^12 - 1`
- Two disbursal types: `'upfront'` (full loan at start) and `'clp'` (tranched disbursement with pre-EMI during construction)
- No routing, no state management library — plain React `useState` + `useMemo`

## Other entrypoints (for cross-reference)

- `calculator.html` — older standalone Vanilla JS version (CDN Tailwind, three disbursal modes: `upfront`, `clp-preemi`, `clp-fullemi`). Keep in sync with React version's financial logic.
- `compute_irr.py` — Python reference IRR solver (Newton-Raphson). Use for sanity-checking results.

## Env

Copy `.env.example` → `.env.local`. Required: `GEMINI_API_KEY`, `APP_URL` (auto-injected by AI Studio at runtime). `.env*` files are gitignored (except `.env.example`).

## Vite quirks

- HMR disabled via `DISABLE_HMR=true` env var (for AI Studio). File watching also disabled when this is set.
- Path alias `@/` → project root (configured in both `vite.config.ts` and `tsconfig.json`).
