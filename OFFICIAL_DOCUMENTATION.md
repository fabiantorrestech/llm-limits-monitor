# LLM Limits Monitor — Official Documentation

A single, cross-device **Progressive Web App (PWA)** for monitoring your LLM usage limits
across Claude, ChatGPT, Gemini, OpenRouter, and more — installable on phone, tablet, and
desktop from one codebase, hosted **free** on GitHub Pages + Cloudflare Workers.

This document is the single source of truth for how the project works and why it's built
this way. For quick-start commands see [`README.md`](./README.md).

---

## 1. Why a PWA, and not a "webview wrapper"

The original idea was to embed each provider's logged-in page (claude.ai, chatgpt.com, …)
in tabs and scrape the usage number. **A pure web app cannot do this**, for two hard
browser-security reasons:

1. **Embedding is blocked.** Those sites send `X-Frame-Options` / CSP `frame-ancestors 'none'`,
   so browsers refuse to render them inside an `<iframe>`. This is anti-clickjacking
   protection — a web page cannot bypass it.
2. **Reading is blocked.** The same-origin policy stops your JavaScript from reading the DOM
   of a cross-origin frame, so "auto-refresh the tab and read the number" is impossible from
   a web page.

Scraping a logged-in page only works inside a **native container** (Tauri/Electron/Capacitor)
or a **browser extension**, because those run code in the page's own context. Since the goal
is one app on every device with free hosting, we use a **PWA driven by official APIs** and
handle the no-API cases with manual entry + deep-links.

---

## 2. How each provider is handled

| Provider | Source of truth | Behavior |
|---|---|---|
| **OpenRouter** | `GET /api/v1/key` + `/api/v1/credits` | **Auto-polled**, live credits/limits |
| **Anthropic API** | Admin cost report | **Auto-polled** monthly spend (no fixed cap) |
| **OpenAI API** | Org Costs API | **Auto-polled** monthly spend (no fixed cap) |
| **Google AI API** | — | Not available via a simple API; shows a clear notice (seam to extend) |
| **Claude Pro/Max, ChatGPT Plus, Gemini Advanced** | **No API exists** | **Manual card + deep-link** to the real usage page; you log the reading |

> **Key limitation:** consumer subscription limits (the 5-hour/weekly caps on Claude Pro/Max,
> ChatGPT Plus message windows, etc.) have no official API. They are tracked manually. See
> §7 for the optional browser-extension upgrade that can automate them.

---

## 3. Architecture

```
┌─────────────────────────────┐        ┌──────────────────────────────┐
│  PWA (GitHub Pages, static) │  HTTPS │  Cloudflare Worker (proxy)   │
│  Vite + React + TS          │ ─────▶ │  - holds provider API keys   │
│  - installable everywhere   │ bearer │  - normalizes responses      │
│  - auto-refresh + manual btn│ token  │  - CORS locked to Pages origin│
│  - manual entry for consumer│ ◀───── │  - Cron snapshots → KV history│
└─────────────────────────────┘  JSON  └──────────────┬───────────────┘
                                                       │ secrets / KV
                                                       ▼
                                  OpenRouter / Anthropic / OpenAI / Google APIs
```

**Why a proxy instead of pure static hosting:** it keeps API keys off the client, avoids
CORS issues calling provider APIs from the browser, and a Cron Trigger can snapshot usage on
a schedule so history accrues even when the app is closed.

### Repository layout (pnpm monorepo)

```
/shared   Shared TS types (UsageSnapshot, windows, history) — imported by both sides
/worker   Cloudflare Worker proxy (adapters, auth/keys seams, router, cron)
/web      Vite + React PWA → GitHub Pages
```

### Data flow

1. PWA calls `GET {workerUrl}/api/usage` with `Authorization: Bearer <token>`.
2. Worker authenticates, resolves provider keys, runs every configured adapter in parallel.
3. Each adapter normalizes its provider's response into a `UsageSnapshot` (never throws —
   failures become an `error` field so one bad provider can't break the dashboard).
4. PWA renders cards; TanStack Query handles auto-refresh (`refetchInterval`) and the manual
   refresh button (`refetch`). Consumer-plan cards read/write manual readings in localStorage.
5. The Worker's cron trigger periodically records snapshots to KV; `GET /api/history`
   returns them for the chart.

### Key files

- `shared/src/index.ts` — the normalized data contract (`UsageSnapshot`, `UsageWindow`, …).
- `worker/src/index.ts` — router + CORS + `scheduled` cron handler.
- `worker/src/auth.ts` — `authenticate()` seam (see §5).
- `worker/src/keys.ts` — `getKeys()` seam (see §5).
- `worker/src/providers/*` — one adapter per provider; `openrouter.ts` is the reference.
- `web/src/hooks/useUsage.ts` — auto + manual refresh.
- `web/src/data/manualProviders.ts` — consumer-plan definitions (deep-link URLs).

---

## 4. Hosting & cost (free indefinitely)

- **Frontend — GitHub Pages.** Static files, free for public repos, no expiry. Deployed by a
  GitHub Actions workflow. The Vite `base` is `/llm-limits-monitor/` to match the project
  Pages path.
- **Backend — Cloudflare Workers.** Free plan: ~100,000 requests/day, no credit card,
  always-free (not a trial). Deployed once to a `*.workers.dev` URL.
- **History — Cloudflare KV** (optional). Free tier covers single-user history easily.

At single-user scale this stays comfortably within free tiers. **No self-hosting required.**

---

## 5. Tenancy model — single-tenant now, multi-tenant-ready

**v1 is single-tenant:** you deploy one Worker with *your* API keys as Worker secrets, and a
single shared bearer token gates access so the proxy isn't an open relay that burns your keys.

Two seams keep multi-tenant a later add-on rather than a rewrite:

- **`authenticate(request, env) → userId`** (`worker/src/auth.ts`). v1 validates the shared
  token and returns `"default"`. Multi-tenant: verify a real session/OAuth and return the
  user's id.
- **`getKeys(userId, env) → ProviderKeys`** (`worker/src/keys.ts`). v1 returns keys from env
  secrets. Multi-tenant: look up that user's **encrypted** keys from KV/D1.

Going multi-tenant means implementing those two functions (plus a signup/login UI and
encrypted per-user key storage) — the adapters, router, and frontend are unaffected.
Becoming custodian of other users' API keys is a real security responsibility and is **out of
scope for v1**.

---

## 6. Security model

- **Access gate:** every endpoint except `/api/health` requires the shared bearer token,
  compared in constant time. With no token configured the Worker refuses all data requests.
- **CORS:** responses only allow the configured `ALLOWED_ORIGIN` (your Pages site).
- **Where keys live:** provider keys are Cloudflare Worker **secrets**, never in the repo and
  never sent to the browser. The browser only holds the shared token + your manual readings
  in localStorage.
- **`.dev.vars`** (local secrets) and `.env*` are git-ignored.

---

## 7. Upgrade paths

- **Automate consumer limits:** add an optional **desktop browser extension** whose content
  script reads the usage DOM on claude.ai/chatgpt.com and `POST`s readings to a new Worker
  endpoint. The dashboard already renders those providers, so no frontend rewrite is needed.
- **Multi-tenant:** implement the two seams in §5.
- **More providers:** add an adapter under `worker/src/providers/` and register it in
  `worker/src/providers/index.ts`; or add a consumer plan to `web/src/data/manualProviders.ts`.

---

## 8. Setup & deploy runbook

### Local development
```bash
pnpm install
cp worker/.dev.vars.example worker/.dev.vars   # fill in APP_SHARED_TOKEN + any keys
pnpm dev:worker        # wrangler dev (http://localhost:8787)
pnpm dev:web           # vite (http://localhost:5173)
```
In the PWA's **Settings**, set Worker URL to `http://localhost:8787` and the token to match
`APP_SHARED_TOKEN`.

### Deploy the Worker
```bash
wrangler kv namespace create HISTORY        # optional; paste id into wrangler.toml
wrangler secret put APP_SHARED_TOKEN
wrangler secret put OPENROUTER_API_KEY       # + any other provider keys
pnpm deploy:worker
```
Set `ALLOWED_ORIGIN` (in `wrangler.toml` `[env.production]`) to your Pages origin.

### Deploy the PWA
Push to the default branch — the GitHub Actions workflow builds `/web` and publishes to
Pages. Enable **Settings → Pages → Source: GitHub Actions** in the repo once.

---

## 9. Verification

1. `wrangler dev` + `vite dev`; point Settings at the local Worker.
2. Add a real OpenRouter key; confirm its card shows live credits and the refresh button updates.
3. Log a Claude Pro reading; confirm it persists across reloads and the deep-link opens
   claude.ai's usage page.
4. Run a Lighthouse PWA audit; install on a phone and confirm full-screen launch.
5. Trigger the cron (or wait) and confirm history points appear in the chart.
