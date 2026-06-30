# PCI KPI Management

Variable Pay Workflow — standalone app integrated with the PCI Intranet Hub portal.

**Stack:** Express API + React/Vite client, PostgreSQL (Railway), Firebase Hosting, GitHub Actions.

## Phase 1 (current)

- Portal JWT handoff auth (`PORTAL_APP_ID=kpi`)
- Session cookie + `/api/me`
- Minimal home page proving login
- Deploy scaffolding (Railway + Firebase)

## Quick start (local)

```bash
cp .env.example .env
npm install
npm ci --prefix api
npm ci --prefix client

# Terminal 1 — API on :3000
npm run dev:api

# Terminal 2 — client on :5173 (dev auth token)
echo "VITE_DEV_AUTH_TOKEN=local-dev-token" > client/.env
npm run dev:client
```

## Production URLs (to configure)

| Service | URL |
|---------|-----|
| Portal | https://pci-portal.web.app |
| Portal API | https://pci-intranet-api-production.up.railway.app |
| KPI client | https://pci-kpi.web.app (after Firebase setup) |
| KPI API | https://pci-kpi-production.up.railway.app (after Railway setup) |

## Portal integration

After deploying the KPI client, set on the **portal Railway API**:

```
KPI_APP_URL=https://pci-kpi.web.app
```

Handoff tokens must have `aud: "kpi"`. See Intranet Hub `AUTH.md`.

## Docs

- [Railway deploy](docs/RAILWAY_DEPLOY.md)
- [Firebase deploy](docs/FIREBASE_DEPLOY.md)
- [Phase 2 requirements (draft)](docs/PHASE2_REQUIREMENTS.md)

## Phase 2

KPI worksheets, manager review, department roll-up, and executive approval — see `docs/PHASE2_REQUIREMENTS.md`. Confirm business rules before implementation.
