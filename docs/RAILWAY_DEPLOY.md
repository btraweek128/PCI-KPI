# Railway — Express API + PostgreSQL

**API URL:** `https://pci-kpi-production.up.railway.app`  
**Client URL:** `https://pci-kpi.web.app` (Firebase)

---

## Quick setup checklist

1. Railway → New Project → Deploy from GitHub → `btraweek128/PCI-KPI` (branch `main`)
2. Add **PostgreSQL** plugin; reference `DATABASE_URL` on the API service
3. Set required env vars (below)
4. Generate public domain on the API service
5. Set `KPI_APP_URL=https://pci-kpi.web.app` on the **Intranet Hub API** service

---

## Required variables (PCI-KPI API service)

| Variable | Value |
|----------|-------|
| `DATABASE_URL` | Reference from Postgres service |
| `NODE_ENV` | `production` |
| `CLIENT_ORIGIN` | `https://pci-kpi.web.app` |
| `PORTAL_ISSUER` | `https://pci-intranet-api-production.up.railway.app` |
| `PORTAL_JWT_PUBLIC_KEY_PEM` | Portal RSA public key (Intranet Hub `public.pem`) |
| `PORTAL_APP_ID` | `kpi` |
| `SESSION_JWT_SECRET` | Long random string — `openssl rand -base64 32` |
| `DEV_BYPASS_AUTH` | `false` |

Remove `DEV_AUTH_TOKEN` and other dev-auth vars in production.

Optional: `KPI_ADMIN_EMAILS` — comma-separated emails for HR admin access.

---

## Portal handoff flow

1. User signs in at https://pci-portal.web.app
2. Clicks **KPI Management** → redirect to `/auth/callback?token=...`
3. KPI client redeems token via `POST /api/auth/callback`
4. API sets session cookie + returns `sessionToken` (Bearer, for mobile)
5. User lands on KPI home

See Intranet Hub `AUTH.md` for the JWT contract (RS256, `aud: kpi`, `typ: handoff`).

---

## Portal env var

On the **Intranet Hub Railway API** service:

```
KPI_APP_URL=https://pci-kpi.web.app
```

---

## Deploy

Push to `main` — Railway auto-deploys the API; Firebase Action (or `firebase deploy`) ships the client.

---

## Verify

```bash
curl https://pci-kpi-production.up.railway.app/health
curl https://pci-kpi-production.up.railway.app/health/config
curl https://pci-kpi-production.up.railway.app/health/db
```

- `/health/config` → `portalAuthConfigured: true`, `hasSessionJwtSecret: true`
- Launch KPI from portal tile — sign-in succeeds on desktop and mobile
- https://pci-kpi.web.app loads (redirects to portal if not signed in)
