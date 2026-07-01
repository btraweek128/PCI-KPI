# PCI KPI Management

Variable Pay Workflow — standalone app integrated with the PCI Intranet Hub portal.

**Repo:** [github.com/btraweek128/PCI-KPI](https://github.com/btraweek128/PCI-KPI)  
**Stack:** Express API + React/Vite client, PostgreSQL (Railway), Firebase Hosting, GitHub Actions.

## Production URLs

| Service | URL |
|---------|-----|
| Portal | https://pci-portal.web.app |
| Portal API | https://pci-intranet-api-production.up.railway.app |
| **KPI client** | **https://pci-kpi.web.app** |
| **KPI API** | **https://pci-kpi-production.up.railway.app** |

## Status

- **Phase 1:** Portal auth, session cookie, deploy scaffolding — complete
- **Phase 2 POC:** Schema v2, pilot seed data, cycle dashboard API, KPI library, worksheet viewer — in progress

## Quick start (local)

```bash
cp .env.example .env
npm install
npm ci --prefix api
npm ci --prefix client

# Load schema + pilot data (requires DATABASE_URL)
node scripts/init-db.js

# Terminal 1 — API on :3000
npm run dev:api

# Terminal 2 — client on :5173 (dev auth token)
echo "VITE_DEV_AUTH_TOKEN=local-dev-token" > client/.env
npm run dev:client
```

## Portal integration

Set on the **portal Railway API**:

```
KPI_APP_URL=https://pci-kpi.web.app
```

Handoff tokens must have `aud: "kpi"`. See Intranet Hub `AUTH.md`.

## Docs

- [Railway deploy](docs/RAILWAY_DEPLOY.md)
- [Firebase deploy](docs/FIREBASE_DEPLOY.md)
- [Phase 2 requirements](docs/PHASE2_REQUIREMENTS.md)

## Phase 2

KPI worksheets, manager review, department roll-up, executive approval, KPI library, notifications, and HR export — see `docs/PHASE2_REQUIREMENTS.md`.
