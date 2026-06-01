# Deploy the Worker backend from your phone (Cloudflare dashboard)

The frontend (PWA) is hosted on GitHub Pages. The **backend Worker** — which does the live
API polling for OpenRouter and the developer APIs — runs on Cloudflare Workers. You can
deploy it entirely from a phone browser using **Workers Builds (Connect to Git)**, so you
never need a terminal or `wrangler login`.

> Without this backend the app still works for the **manual / consumer-plan cards**
> (Claude Pro/Max, ChatGPT Plus, Gemini). This guide is only needed for the auto-polled
> API cards.

---

## 1. Create a free Cloudflare account
1. In your phone browser go to **https://dash.cloudflare.com/sign-up**.
2. Verify your email. No credit card needed — the Workers free plan is permanent.

## 2. Connect the repo as a Worker
1. In the dashboard, open **Compute (Workers)** → **Workers & Pages**.
2. Tap **Create** → **Workers** → **Import a repository** (a.k.a. *Connect to Git*).
3. Authorize **GitHub**, then pick **`fabiantorrestech/llm-limits-monitor`**.
4. Choose the branch you're deploying (currently **`claude/vigilant-davinci-i4ETE`**, or
   `main` once merged).

## 3. Build settings
Set these (the names match what's in the repo):

| Field | Value |
|---|---|
| **Project / Worker name** | `llm-limits-monitor` (becomes your URL subdomain) |
| **Root directory** | `/` (repo root — needed so the shared workspace package resolves) |
| **Build command** | leave blank / default (`pnpm install` is auto-detected) |
| **Deploy command** | `npx wrangler deploy --config worker/wrangler.toml` |

Tap **Save and Deploy** and wait for the build to go green.

Your Worker URL will be:
```
https://llm-limits-monitor.<your-subdomain>.workers.dev
```
(Find it on the Worker's page under its name.)

## 4. Add your secrets
On the Worker's page: **Settings** → **Variables and Secrets** → **Add**. Add each as a
**Secret** (encrypted), type the value, **Deploy**:

| Name | Required? | Value |
|---|---|---|
| `APP_SHARED_TOKEN` | ✅ yes | any long random string you'll paste into the app |
| `OPENROUTER_API_KEY` | optional | your OpenRouter key (enables the OpenRouter card) |
| `ANTHROPIC_ADMIN_KEY` | optional | Anthropic **Admin** API key (org spend) |
| `OPENAI_ADMIN_KEY` | optional | OpenAI admin/org key (org spend) |

> Secrets set in the dashboard **persist across future Git deploys** — Wrangler only
> overwrites plaintext vars (like `ALLOWED_ORIGIN`), never secrets. So you set them once.

`ALLOWED_ORIGIN` is already baked into `worker/wrangler.toml` as
`https://fabiantorrestech.github.io`, so the deployed Worker accepts requests from your
Pages site automatically. (If your Pages URL ever changes, edit that value in the repo.)

## 5. (Optional) History storage
The usage-history chart needs a KV namespace. This step edits a repo file, so it's easier
from a laptop — skip it for now if you're phone-only; everything else works without it.
When ready: create a KV namespace named `HISTORY`, then uncomment the `[[kv_namespaces]]`
block in `worker/wrangler.toml` and paste the namespace id.

## 6. Point the app at your Worker
1. Open the PWA on your phone: **https://fabiantorrestech.github.io/llm-limits-monitor/**
2. Tap **⚙ Settings**.
3. **Worker URL** = your `…workers.dev` URL from step 3.
4. **Shared token** = the exact `APP_SHARED_TOKEN` value from step 4.
5. **Save**. The API-backed cards now poll live, and **↻ Refresh** forces an update.

---

## How updates work
Every push to the connected branch triggers Cloudflare to rebuild and redeploy the Worker
automatically (just like GitHub Pages does for the frontend). No manual redeploys needed.

## Troubleshooting
- **API cards show "Unauthorized"** → the token in app Settings doesn't match
  `APP_SHARED_TOKEN`. Re-enter it.
- **CORS errors in the browser** → your Pages origin doesn't match `ALLOWED_ORIGIN` in
  `worker/wrangler.toml`. Update it and let it redeploy.
- **Build fails resolving `@llm-limits/shared`** → make sure **Root directory** is `/`
  (repo root), not `worker/`, so the workspace install links the shared package.
- **OpenRouter card shows an error code** → the key is wrong or lacks permission; the app
  surfaces the HTTP status so you can tell.
