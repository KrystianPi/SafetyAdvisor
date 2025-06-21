# ⚡️ Fast MVP Stack – Next.js 14 + FastAPI + Supabase  (2025 Edition)

A bullet‑proof boilerplate that lets you ship a feature‑complete web app **in hours, not weeks**, yet leaves a clean upgrade path to “real” infra.

---
## 📑 Table of Contents

1. [Architecture Overview](#architecture-overview)  
2. [1 · Bootstrap Supabase](#1-bootstrap-supabase)  
3. [2 · Frontend — Next.js 14](#2-frontend—nextjs14)  
4. [3 · Backend — FastAPI Docker](#3-backend—fastapi-docker)  
5. [4 · Lightning‑Fast Local Dev](#4-lightning-fast-local-dev)  
6. [5 · Testing Strategies](#5-testing-strategies)  
7. [6 · Type‑Safety Stack](#6-type-safety-stack)  
8. [7 · CI / CD Snippets](#7-ci--cd-snippets)  
9. [8 · AI‑assisted DB Ops (MCP + Cursor AI)](#8-ai-assisted-db-ops-mcp--cursor-ai)  
10. [9 · Growth Paths](#9-growth-paths)  
11. [10 · FAQ](#10-faq)

---
## Architecture Overview

```
monorepo/
├── frontend/        # Next.js 14 + Tailwind (deployed on Vercel)
└── backend/         # FastAPI 0.111 in multi‑stage Docker image (Railway)
```

* **Auth + DB** · Supabase Cloud (Postgres + Row‑Level Security)  
* **Local Dev** · Hot‑reload for both stacks, still hitting Supabase cloud  
* **Tests** · Ephemeral Postgres via Docker Compose *or* Testcontainers  
* **AI helpers** · Supabase MCP server hooked to Cursor AI  
* **Type checks** · Pyright (editor) + Mypy strict (CI) + beartype (runtime)

---
## 1 · Bootstrap Supabase

1. Sign up at <https://supabase.com> and create a project.  
2. **Auth → Settings** → enable **Email + Password**.  
3. Copy keys:

| Env var | Description | Used in |
|---------|-------------|---------|
| `SUPABASE_URL` | Project API endpoint | Everywhere |
| `SUPABASE_ANON_KEY` | Browser‑safe key | Frontend |
| `SUPABASE_SERVICE_ROLE` | Admin key | Backend & tests |

> **Tip** : Turn on Row‑Level Security after creating tables.

---
## 2 · Frontend — Next.js 14

```bash
npx create-next-app@latest frontend --ts --tailwind
cd frontend
npm i @supabase/supabase-js @supabase/auth-ui-react
```

`lib/supabaseClient.ts`:

```ts
import { createBrowserSupabaseClient } from "@supabase/auth-helpers-nextjs";
export const supabase = createBrowserSupabaseClient();
```

Minimal login page (`app/login/page.tsx`):

```tsx
'use client';
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { supabase } from "@/lib/supabaseClient";

export default function Login() {
  return <Auth supabaseClient={supabase} appearance={{ theme: ThemeSupa }} />;
}
```

**Local proxy** so browser calls `/api/**` without CORS:

`next.config.js`:

```js
module.exports = {
  async rewrites() {
    return [{ source: "/api/:path*", destination: "http://localhost:8000/:path*" }];
  },
};
```

Run locally:

```bash
npm run dev            # Port 3000
```

---
## 3 · Backend — FastAPI Docker

### Multi‑stage `Dockerfile`

```dockerfile
FROM python:3.12-slim AS base
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt

# ---- dev stage (auto‑reload, watchfiles) ----
FROM base AS dev
RUN pip install watchfiles
COPY . .

# ---- production stage ----
FROM base AS prod
COPY . .
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

`requirements.txt`:

```
fastapi
uvicorn[standard]
supabase-py==2.*
python-dotenv
```

`main.py` (JWT passthrough):

```py
from fastapi import FastAPI, Depends, HTTPException, Header
from supabase import create_client
import os, jwt

app = FastAPI()
supabase = create_client(os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_SERVICE_ROLE"))

def verify_user(auth: str = Header(..., alias="Authorization")):
    token = auth.removeprefix("Bearer ").strip()
    try:
        jwt.decode(token, options={"verify_signature": False})
    except Exception:
        raise HTTPException(status_code=401)

@app.get("/hello")
def hello(_: str = Depends(verify_user)):
    return {"msg": "Hello from FastAPI + Supabase!"}
```

---
## 4 · Lightning‑Fast Local Dev

`compose.dev.yml`:

```yaml
version: "3.9"
services:
  api:
    build:
      context: ./backend
      target: dev
    command: uvicorn main:app --reload --host 0.0.0.0 --port 8000
    volumes:
      - ./backend:/app
    environment:
      - SUPABASE_URL
      - SUPABASE_SERVICE_ROLE
    ports:
      - "8000:8000"

  # Optional dockerised frontend
  web:
    profiles: ["docker-frontend"]
    build: ./frontend
    command: npm run dev
    volumes:
      - ./frontend:/app
    ports: ["3000:3000"]
    environment:
      - NEXT_PUBLIC_SUPABASE_URL
      - NEXT_PUBLIC_SUPABASE_ANON_KEY
```

```bash
cp .env.example .env     # fill Supabase vars once
docker compose -f compose.dev.yml up --build api
# separate terminal
cd frontend && npm run dev
```

| Action          | Reload time |
|-----------------|-------------|
| Edit `.tsx/.ts` | ~150 ms |
| Edit Python     | 0.3–0.6 s (uvicorn) |

---
## 5 · Testing Strategies

### 5.1 Docker‑Compose test stack

`compose.test.yml`:

```yaml
version: "3.9"
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: testuser
      POSTGRES_PASSWORD: testpass
      POSTGRES_DB: testdb
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U testuser -d testdb"]
      interval: 3s
      retries: 5

  api:
    build:
      context: ./backend
      target: dev
    command: >
      sh -c "bash .docker/wait-for postgres:5432 &&
             pytest -q -x"
    volumes:
      - ./backend:/app
    depends_on:
      postgres:
        condition: service_healthy
    environment:
      SUPABASE_URL: postgresql://testuser:testpass@postgres:5432/testdb
```

Run: `docker compose -f compose.test.yml up --abort-on-container-exit`

### 5.2 Testcontainers + SQLAlchemy

```py
# tests/conftest.py
import pytest, sqlalchemy as sa
from sqlalchemy.orm import sessionmaker, declarative_base
from testcontainers.postgres import PostgresContainer

Base = declarative_base()

class User(Base):
    __tablename__ = "users"
    id = sa.Column(sa.Integer, primary_key=True)
    name = sa.Column(sa.String, nullable=False)

@pytest.fixture(scope="session")
def engine():
    with PostgresContainer("postgres:16-alpine") as pg:
        eng = sa.create_engine(pg.get_connection_url(), future=True)
        Base.metadata.create_all(eng)
        yield eng

@pytest.fixture
def db(engine):
    conn = engine.connect()
    trx = conn.begin()
    Session = sessionmaker(bind=conn, expire_on_commit=False, future=True)
    session = Session()
    try:
        yield session
    finally:
        session.close()
        trx.rollback()
        conn.close()
```

---
## 6 · Type‑Safety Stack

| Layer        | Tool & Mode               | Purpose |
|--------------|---------------------------|---------|
| **Editor**   | Pyright strict            | Instant feedback |
| **CI**       | Mypy `--strict` + Ruff    | Deep checks & lint |
| **Runtime**  | beartype 0.21             | Guard critical funcs |
| **Test run** | typeguard 4               | Fail if wrong types |
| **Models**   | Pydantic v2               | FastAPI schemas |

`pyproject.toml`:

```toml
[tool.mypy]
strict = true

[tool.pyright]
typeCheckingMode = "strict"

[tool.ruff]
line-length = 120
```

---
## 7 · CI / CD Snippets

_Backend → Railway_

```yaml
name: Deploy FastAPI to Railway
on:
  push:
    paths: ['backend/**']
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: docker build -t ghcr.io/$GITHUB_REPOSITORY/app:$GITHUB_SHA backend
      - run: echo $CR_PAT | docker login ghcr.io -u $GITHUB_ACTOR --password-stdin
      - run: docker push ghcr.io/$GITHUB_REPOSITORY/app:$GITHUB_SHA
      - uses: railwayapp/railway-up@v1
        with:
          service: fastapi
          image: ghcr.io/$GITHUB_REPOSITORY/app:$GITHUB_SHA
        env:
          RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}
```

Frontend auto‑deploys via Vercel GitHub app.

---
## 8 · AI‑assisted DB Ops (MCP + Cursor AI)

Supabase’s **MCP server** lets Cursor AI introspect schema, run queries, and generate migrations.

1. Cursor → _Add MCP tool_ → choose **Supabase**.  
2. Provide `SUPABASE_URL` + service‑role key.  
3. Prompt Cursor, e.g.:

```
Create `todos` table (id UUID PK, text TEXT, completed BOOLEAN default false)
and show a TypeScript example using supabase-js v2.
```

Security tips: dedicate a service‑role key, enable RLS, optionally self‑host MCP.

---
## 9 · Growth Paths

| Need                    | Swap‑in |
|-------------------------|---------|
| Cheaper idle time       | Fly.io Machines (`auto_suspend`) |
| Branch‑per‑PR databases | Neon serverless Postgres |
| Edge‑distributed reads  | Turso (SQLite at the edge) |
| Full infra control      | Migrate containers to AWS ECS/EKS; keep Supabase |

---
## 10 · FAQ

| Question | Answer |
|----------|--------|
| Single‑repo setup? | Move backend into `api/` and deploy via Vercel Python Runtime (limit ≈100 MB). |
| CORS headaches? | Browser hits `/api/**`, Next.js rewrites to local 8000; same‑origin wins. |
| Offline dev? | `npm i -g supabase && supabase start` (local Postgres+Auth on 54322). |
| Why both Pyright & Mypy? | Pyright = lightning editor DX; Mypy strict catches edge cases in CI. |
| Compose vs Testcontainers? | Testcontainers start in 2–3 s, pure Python, isolation per session. |

---

Happy coding & quick shipping! 🚀
