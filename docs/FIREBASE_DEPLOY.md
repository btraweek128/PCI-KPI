# Firebase Hosting — React Client

**Suggested URL:** `https://pci-kpi.web.app`

---

## Firebase project setup

1. Go to [Firebase Console](https://console.firebase.google.com/) → **Add project**.
2. Suggested project ID: **`pci-kpi`** (must match `.firebaserc`).
3. Enable **Hosting** for the project.
4. Create a **Web app** (optional — mainly for analytics if desired).
5. Generate a **service account** key:
   - Project settings → Service accounts → Generate new private key
   - Save JSON for GitHub secret (below)

Local CLI (one-time):

```bash
npm install -g firebase-tools
firebase login
firebase use pci-kpi
```

---

## GitHub secrets

| Secret | Value |
|--------|-------|
| `FIREBASE_SERVICE_ACCOUNT_PCI_KPI` | Firebase service account JSON (full file contents) |
| `VITE_API_BASE_URL` | Railway API URL (e.g. `https://pci-kpi-production.up.railway.app`) |
| `VITE_PORTAL_URL` | `https://pci-portal.web.app` |

Do **not** set `VITE_DEV_AUTH_TOKEN` in GitHub secrets for production builds.

Push to `main` triggers `.github/workflows/firebase-hosting-merge.yml`.

---

## Local dev

Create `client/.env`:

```
VITE_DEV_AUTH_TOKEN=local-dev-token
VITE_API_BASE_URL=http://localhost:3000
VITE_PORTAL_URL=https://pci-portal.web.app
```

Run API and client:

```bash
cp .env.example .env
npm install
npm ci --prefix api
npm ci --prefix client
npm run dev:api
npm run dev:client
```

Open http://localhost:5173 — dev banner appears, API calls use Bearer dev token.

---

## Manual deploy

```bash
cd client && npm run build && cd .. && firebase deploy --only hosting
```

Uses `client/.env.production` for build-time API/portal URLs.

---

## After first deploy

1. Note the Firebase Hosting URL.
2. Set `CLIENT_ORIGIN` on Railway KPI API to that URL.
3. Set `KPI_APP_URL` on the **portal** Railway API to that URL (see `docs/RAILWAY_DEPLOY.md`).

---

## Verify

- App loads at Firebase URL
- Unauthenticated users redirect to portal login
- Portal tile launch completes auth callback and shows home page with user profile
