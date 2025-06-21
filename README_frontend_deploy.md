# 🚀 Frontend Deployment Guide – Next.js 14 on Vercel

This document focuses **only** on deploying the `frontend/` portion of the stack to **Vercel**.  
_Backend (FastAPI on Railway) lives in a separate repo/folder and is outside the scope of this guide._

---
## Why Vercel for the Frontend?

| Vercel super‑power | Benefit to this project |
|--------------------|-------------------------|
| **Native Next.js builds** | Zero config: detects `next.config.js`, runs `next build`, handles ISR/SSR automatically. |
| **Instant Preview Deployments** | Every pull‑request gets its own URL (`https://pr‑###.yourapp.vercel.app`). |
| **Edge Network & CDN** | Static assets and incremental static pages cached at 35 + POPs. |
| **Env‑var UI & secret storage** | Paste Supabase keys once per env (dev / preview / prod). |
| **Free tier generous enough** | Perfect for MVPs (<100 GB‑hours/mo). |

Back‑end on **Railway** because we ship a **Docker container** with custom Python deps & long‑lived processes—that’s Railway’s sweet spot. Vercel’s 100 MB limit and 90 s execution cap don’t fit heavier FastAPI images.

---
## 1 · Repo Layout

```
monorepo/
└── frontend/
    ├── next.config.js
    ├── app/
    ├── lib/
    └── .env.local.example
```

---
## 2 · Required Environment Variables

| Name | Source | Example |
|------|--------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project settings | `https://xyz.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Project settings | `eyJhbGciOiJI...` |
| `NEXT_PUBLIC_API_URL` | Railway deploy URL of backend | `https://api.myapp.dev` |

> **Note**: Prefix `NEXT_PUBLIC_` is mandatory for variables exposed to the browser.

---
## 3 · One‑time Vercel Setup

1. **Login** → <https://vercel.com/new>  
2. Click **Import Git Repository** → pick the `frontend/` repo (or monorepo root).  
3. **Framework preset** auto‑detects **Next.js**.  
4. _If monorepo_: set **Root Directory** = `frontend`.  
5. Add **Environment Variables** (see table). **Save**.  
6. Click **Deploy**. 🎉 Your production URL is `https://yourapp.vercel.app`.

Vercel automatically sets up a **GitHub App** that:
* Builds a **preview** for each PR/branch.  
* Promotes `main` (or whatever branch you choose) to **Production**.

---
## 4 · Branch / Preview Workflow

| Action | Result |
|--------|--------|
| Push to feature branch | `https://<branch>--yourapp.vercel.app` |
| Open PR → commit changes | Preview URL updates every push (use it for QA). |
| Merge to `main` | Vercel triggers production build → `https://yourapp.vercel.app`. |

Supabase/Backend URLs for previews:
* If backend has its own preview URL (e.g., Railway’s `pr‑123.myapi.run`), override `NEXT_PUBLIC_API_URL` in the **Preview** env scope.

---
## 5 · Local Development

```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://xyz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
NEXT_PUBLIC_API_URL=http://localhost:8000

npm run dev    # http://localhost:3000
```

`next.config.js` already rewrites `/api/*` → `localhost:8000` in dev to avoid CORS.

---
## 6 · Supabase Auth Callback

If you enable OAuth providers, add the Vercel domain + preview wildcard to **Auth → URL Configuration**:

```
https://yourapp.vercel.app
https://*.yourapp.vercel.app            # PR previews
http://localhost:3000                   # local dev
```

---
## 7 · Custom Domains (optional)

1. In Vercel project → **Settings → Domains** → add `app.example.com`.  
2. Update DNS CNAME → `cname.vercel-dns.com`.  
3. Vercel issues TLS cert automatically.  
4. Supabase **Auth Redirects**: add the new domain above.

---
## 8 · Incremental Static Regeneration (ISR)

Next.js 14 + Vercel = ISR out of the box. Example:

```ts
export const revalidate = 60;          // revalidate page every 60 s
```

Pages built on demand are cached globally.

---
## 9 · Troubleshooting

| Symptom | Fix |
|---------|-----|
| `POST https://api.myapp.dev` fails | Make sure `NEXT_PUBLIC_API_URL` points to Railway prod URL (`https`, not `http`). |
| 401 from Supabase in production | Check that **anon key** in Vercel **Production** env matches Supabase keys page. |
| Big npm dependency blows 100 MB limit | Use `vercel .` with Serverless Functions or `next.dynamic()` import; but usually frontend stays small. |

---
## 10 · Quick Checklist

- [ ] GitHub repo connected to Vercel  
- [ ] Root Directory set to `frontend/` (if monorepo)  
- [ ] Env vars added in **Production** and **Preview** scopes  
- [ ] Supabase Auth redirect URLs include Vercel prod + preview domains  
- [ ] Custom domain DNS configured (optional)  

Happy frontend shipping 🚀
