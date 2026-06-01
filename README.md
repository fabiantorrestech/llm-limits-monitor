# LLM Limits Monitor

One installable web app (PWA) to monitor your LLM usage limits across **Claude, ChatGPT,
Gemini, OpenRouter, and more** — on phone, tablet, and desktop, hosted free on GitHub Pages
+ Cloudflare Workers.

- **API-backed providers** (OpenRouter, Anthropic/OpenAI dev APIs) are **auto-polled** with a
  manual refresh button.
- **Consumer plans** (Claude Pro/Max, ChatGPT Plus, Gemini Advanced) have **no usage API**, so
  they're tracked via manual entry + a one-tap deep-link to the real usage page.

> Full design, architecture, security, tenancy, and deploy details:
> **[OFFICIAL_DOCUMENTATION.md](./OFFICIAL_DOCUMENTATION.md)**

## Quick start

```bash
pnpm install
cp worker/.dev.vars.example worker/.dev.vars   # set APP_SHARED_TOKEN + any provider keys
pnpm dev:worker        # Cloudflare Worker proxy → http://localhost:8787
pnpm dev:web           # PWA → http://localhost:5173
```

Then open the PWA, go to **Settings**, set the Worker URL (`http://localhost:8787`) and the
token to match `APP_SHARED_TOKEN`.

## Layout

| Path | What |
|---|---|
| `shared/` | Shared TypeScript types (the normalized data contract) |
| `worker/` | Cloudflare Worker proxy — provider adapters, auth/keys seams, cron |
| `web/`    | Vite + React PWA, deploys to GitHub Pages |

## Deploy

- **Worker:** `wrangler secret put …` then `pnpm deploy:worker` — or deploy from a phone
  with no terminal via [docs/CLOUDFLARE_PHONE_DEPLOY.md](./docs/CLOUDFLARE_PHONE_DEPLOY.md).
- **PWA:** push to the deploy branch; the GitHub Actions workflow publishes to Pages at
  `https://fabiantorrestech.github.io/llm-limits-monitor/`.

See [OFFICIAL_DOCUMENTATION.md §8](./OFFICIAL_DOCUMENTATION.md#8-setup--deploy-runbook).
