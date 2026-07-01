# Railway — Express API + PostgreSQL

**API URL:** `https://pci-kpi-production.up.railway.app`  
**Client URL:** `https://pci-kpi.web.app` (Firebase)

---

## Setup

1. Create a new Railway project (or add services to an existing project).
2. Add a **PostgreSQL** plugin and note the `DATABASE_URL`.
3. Add a **Web Service** connected to this GitHub repo (`btraweek128/PCI-KPI`).
4. Railway reads `railway.toml` for build/deploy commands.

---

## Required variables (PCI-KPI API service)

| Variable | Value |
|----------|-------|
| `DATABASE_URL` | Reference from Postgres service |
| `NODE_ENV` | `production` |
| `CLIENT_ORIGIN` | `https://pci-kpi.web.app` |
| `PORTAL_ISSUER` | `https://pci-intranet-api-production.up.railway.app` |
| `PORTAL_JWT_PUBLIC_KEY_PEM` | Portal RSA public key (same as Intranet Hub `public.pem`) |
| `PORTAL_APP_ID` | `kpi` |
| `DEV_BYPASS_AUTH` | `false` |

Remove `DEV_AUTH_TOKEN` and other dev-auth vars in production.

Optional: `KPI_ADMIN_EMAILS` — comma-separated emails that receive `isAdmin: true` from `/api/me`.

---

## Portal handoff flow

1. User signs in at https://pci-portal.web.app
2. Clicks **KPI Management** tile → redirect to `/auth/callback?token=...`
3. KPI client redeems token via `POST /api/auth/callback`
4. API sets `pci_app_session` cookie; user lands on KPI home

See Intranet Hub `AUTH.md` for the full JWT contract (RS256, `aud: kpi`, `typ: handoff`).

---

## Portal env var (set after Firebase deploy)

On the **Intranet Hub Railway API** service, set:

```
KPI_APP_URL=https://pci-kpi.web.app
```

---

## Deploy

Push to `main` on GitHub — Railway auto-deploys the API; Firebase Action deploys the client.

---

## Verify

- `GET /health` → `{ status: "ok", service: "pci-kpi-api" }`
- `GET /health/db` → connected
- `GET /health/config` → `portalAuthConfigured: true`, `portalAppId: "kpi"`
- Launch KPI from portal tile — sign-in succeeds
- Direct visit to client URL without session redirects to portal login
