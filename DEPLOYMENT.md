# LandDelay AI — Production Deployment Guide
**Predictive Analytics & Decision Support System for Early Detection of Land Acquisition Delays**

---

## 1. Architecture & Deployment Targets

LandDelay AI is architected as a decoupled, production-grade cloud solution:

```
                      ┌──────────────────────────────────────────┐
                      │              Web Clients                 │
                      │         (Desktop & Mobile Web)           │
                      └────────────────────┬─────────────────────┘
                                           │
                                           │ HTTPS (SPA Routing)
                                           ▼
                      ┌──────────────────────────────────────────┐
                      │            Frontend (Vercel)             │
                      │  - React 19 + TypeScript + Vite         │
                      │  - Tailwind CSS + Lucide + Recharts      │
                      │  - Leaflet GIS Maps                      │
                      │  - SPA Fallback via vercel.json          │
                      └────────────────────┬─────────────────────┘
                                           │
                                           │ HTTPS API Requests (CORS Guarded)
                                           ▼
                      ┌──────────────────────────────────────────┐
                      │          Backend API (Render)            │
                      │  - FastAPI (Python 3.11/3.12)            │
                      │  - Scikit-Learn Predictive Model         │
                      │  - Deterministic Delay Risk Engine       │
                      │  - Uvicorn on 0.0.0.0:$PORT              │
                      │  - Timing-Safe Admin Verification        │
                      └────────────────────┬─────────────────────┘
                                           │
                                           │ SQLAlchemy 2.0 Connection Pool
                                           ▼
                      ┌──────────────────────────────────────────┐
                      │            Database Tier                 │
                      │  Option A (Recommended): Render Postgres │
                      │  Option B (Demo/Disk): SQLite on /var/data│
                      └──────────────────────────────────────────┘
```

| Component | Target Platform | Technology Stack | Key Responsibilities |
| :--- | :--- | :--- | :--- |
| **Frontend** | **Vercel** | React 19, Vite, TypeScript, Tailwind | Interactive KPI dashboard, parcel GIS maps, risk audits, CSV ingestion UI. |
| **Backend API** | **Render** (Web Service) | FastAPI, Uvicorn, Scikit-learn, SQLAlchemy | REST API, ML inference, heuristic delay scoring, atomic CSV validation. |
| **Database** | **Render PostgreSQL** (or Persistent SQLite) | PostgreSQL 16+ or SQLite on `/var/data` disk | ACID relational storage, audit log records, statutory milestone records. |

---

## 2. Environment Variables Reference

### Backend Environment Variables (Configured on Render)

| Variable | Type | Default (Local) | Production Example | Description |
| :--- | :--- | :--- | :--- | :--- |
| `ENVIRONMENT` | String | `development` | `production` | Dictates error verbosity and reload flags. |
| `PORT` | Integer | `8000` | Auto-assigned by Render (`10000`) | Network port bound by Uvicorn. |
| `HOST` | String | `0.0.0.0` | `0.0.0.0` | Network binding interface. |
| `DATABASE_URL` | String | `sqlite:///./landdelay.db` | `postgresql://user:pass@host.render.com:5432/landdelay` | Database connection URI. Render `postgres://` is automatically converted to `postgresql://`. |
| `CORS_ORIGINS` | Comma-separated | `http://localhost:5173` | `https://landdelay-ai.vercel.app` | Whitelist of permitted frontend domains. Never use `*` in production. |
| `ADMIN_RESET_KEY` | Secret String | `landdelay-admin-secret-2026` | High-entropy random secret (32+ chars) | Required in `X-Admin-Key` header for destructive `/api/demo/reset` and `/api/demo/seed` operations. |
| `AUTO_SEED_DEMO_DATA` | Boolean | `true` | `true` | If `true`, seeds 250 deterministic cases **only if the database is completely empty**. Preserves data across restarts. |

### Frontend Environment Variables (Configured on Vercel)

| Variable | Default (Local) | Production Example | Description |
| :--- | :--- | :--- | :--- |
| `VITE_API_BASE_URL` | *(empty / proxy)* | `https://landdelay-api.onrender.com/api` | Full URL to the deployed FastAPI backend. Can be with or without trailing `/api`. In local dev, leave empty to use Vite proxy. |

---

## 3. Database Strategy: PostgreSQL vs. SQLite

### Option A: Render Managed PostgreSQL (Recommended for Free Tier & Scale)
1. In Render, create a **Free PostgreSQL Database**.
2. Render assigns an Internal and External Database URL (e.g. `postgres://landdelay_user:secret@dpg-xxxx-a.oregon-postgres.render.com/landdelay`).
3. Set the backend web service's `DATABASE_URL` to this connection string.
4. **Automatic URL Normalization:** Render uses legacy `postgres://` protocol URLs. LandDelay AI automatically normalizes this to `postgresql://` required by SQLAlchemy 2.0 without manual user patching.
5. Connection pooling (`pool_pre_ping=True`, `pool_size=10`) is preconfigured in `backend/app/db/database.py`.

### Option B: SQLite with Persistent Disk (Paid Render Starter Tier)
1. If using SQLite in production, note that standard Render containers have an ephemeral filesystem (wiped on each deployment or restart).
2. To retain data using SQLite, configure a **Persistent Disk** on Render:
   - **Mount Path:** `/var/data`
   - **Disk Size:** 1 GB
   - **Environment Variable:** `DATABASE_URL=sqlite:////var/data/landdelay.db`
3. LandDelay AI automatically creates parent directories (`/var/data`) if they do not exist.

### Safe Restart & Data Preservation Guarantee
On application startup:
1. The backend inspects `AcquisitionCase.count()`.
2. If `count > 0`, it logs `Existing database contains X cases. Preserving records across restart.` and **does not overwrite** or wipe existing records.
3. Seeding only occurs when the database is freshly initialized (0 records) AND `AUTO_SEED_DEMO_DATA=true`.

---

## 4. Step-by-Step Backend Deployment to Render

### Step 4.1: Push Project to GitHub
Initialize Git and push your repository to GitHub:
```powershell
git init
git add .
git commit -m "feat: complete LandDelay AI with production deployment configs"
git branch -M main
git remote add origin https://github.com/<your-username>/landdelay-ai.git
git push -u origin main
```

### Step 4.2: Deploy via Render Blueprint (`render.yaml`)
1. Log in to your [Render Dashboard](https://dashboard.render.com/).
2. Click **New +** -> **Blueprint**.
3. Connect your `landdelay-ai` GitHub repository.
4. Render will detect `render.yaml` and configure:
   - **Service Name:** `landdelay-api`
   - **Runtime:** `Python 3`
   - **Root Directory:** `backend`
   - **Build Command:** `pip install --upgrade pip && pip install -r requirements.txt`
   - **Start Command:** `python -m uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - **Database:** Free PostgreSQL instance `landdelay-postgres`
5. Click **Apply**.

### Step 4.3: Manual Setup (Alternative to Blueprint)
If you prefer configuring via the Render Web UI:
1. Click **New +** -> **Web Service**.
2. Select your repository.
3. Configure the settings:
   - **Name:** `landdelay-api`
   - **Region:** Any (e.g. Frankfurt, Oregon, Singapore)
   - **Branch:** `main`
   - **Root Directory:** `backend`
   - **Runtime:** `Python 3`
   - **Build Command:** `pip install --upgrade pip && pip install -r requirements.txt`
   - **Start Command:** `python -m uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - **Plan:** Free
4. Under **Environment Variables**, add:
   - `ENVIRONMENT` = `production`
   - `AUTO_SEED_DEMO_DATA` = `true`
   - `ADMIN_RESET_KEY` = `<choose-a-strong-secret-key>`
   - `DATABASE_URL` = `<your-postgresql-connection-string>`
   - `CORS_ORIGINS` = `https://<your-vercel-app>.vercel.app`
5. Click **Create Web Service**.
6. Once deployed, note your service URL: `https://landdelay-api.onrender.com`.

---

## 5. Step-by-Step Frontend Deployment to Vercel

### Step 5.1: Import Project into Vercel
1. Log in to your [Vercel Dashboard](https://vercel.com/).
2. Click **Add New...** -> **Project**.
3. Import your GitHub repository `landdelay-ai`.

### Step 5.2: Configure Project Settings
1. **Framework Preset:** `Vite`
2. **Root Directory:** Click **Edit** and select `frontend` (or leave default if deploying root with included root `vercel.json`).
3. **Build Command:** `npm run build`
4. **Output Directory:** `dist`
5. **Install Command:** `npm install`

### Step 5.3: Set Environment Variables
Add the following variable under **Environment Variables**:
- **Name:** `VITE_API_BASE_URL`
- **Value:** `https://landdelay-api.onrender.com/api` (replace with your actual Render API URL)

### Step 5.4: Deploy and Verify
1. Click **Deploy**.
2. Once the build completes (typically 30–60 seconds), your app will be live at `https://landdelay-ai.vercel.app`.
3. In your Render Dashboard, update `CORS_ORIGINS` to match your exact Vercel production URL (e.g., `https://landdelay-ai.vercel.app`).

### SPA Routing Guarantee (`vercel.json`)
The included `frontend/vercel.json` and root `vercel.json` configure automatic client-side SPA rewrites:
```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```
This guarantees that direct navigation or browser refreshes on routes like `/cases`, `/map`, `/analytics`, `/model`, or `/data` load seamlessly without returning `404 Not Found`.

---

## 6. Security Architecture & Administrative Controls

### Administrative Authorization Guard (`X-Admin-Key`)
1. Destructive endpoints (`POST /api/demo/reset` and `POST /api/demo/seed`) are guarded by `verify_admin_authorization`.
2. The endpoint checks the `X-Admin-Key` header using **timing-safe comparison** (`secrets.compare_digest`) to prevent timing side-channel attacks.
3. If the header is missing or invalid, the API returns `401 Unauthorized`.
4. In production, **no administrative secrets are exposed in the frontend bundle**.
5. When an administrator clicks **Reseed Demo** in the UI, an interactive prompt requests the administrative key directly from the user rather than reading it from client assets.

### CORS Security
1. Wildcard CORS (`*`) is strictly forbidden when credentials are enabled.
2. In production, `CORS_ORIGINS` restricts access to your explicit Vercel domain.
3. Preflight `OPTIONS` requests are handled automatically by FastAPI CORS middleware.

---

## 7. Data Provenance & Statutory Compliance

LandDelay AI implements a strict dual-provenance data model:

```
                          Data Provenance Model
           ┌─────────────────────────┴─────────────────────────┐
           ▼                                                   ▼
┌─────────────────────────────┐             ┌─────────────────────────────┐
│    VERIFIED_PUBLIC_DATA     │             │     SYNTHETIC_DEMO_DATA     │
│  - Gazette Notifications    │             │  - Deterministic simulation │
│  - NHAI Land Acquisition    │             │  - PRNG Seed = 42           │
│  - Statutory Milestone Logs │             │  - Never labeled as official│
└─────────────────────────────┘             └─────────────────────────────┘
```

1. **Governance Rule:** Synthetic data is **never** presented as verified public records.
2. The UI Header and Data Management tables render prominent provenance badges:
   - Green pill: `VERIFIED PUBLIC DATA`
   - Amber pill: `SYNTHETIC DEMO MODE`
3. Atomic CSV Ingestion requires explicit classification: users must explicitly declare whether uploaded files represent verified government gazette records or synthetic test data.

---

## 8. Verification & Health Check Checklist

Execute the following checks after deploying:

### 1. API Health Check
Run in terminal:
```bash
curl -i https://landdelay-api.onrender.com/api/health
```
Expected output:
```json
{
  "status": "healthy",
  "service": "LandDelay AI",
  "version": "1.0.0",
  "environment": "production",
  "database": {
    "type": "postgresql",
    "status": "healthy"
  },
  "mode": "DECISION_SUPPORT_SYSTEM"
}
```

### 2. Frontend Health Probe
Visit `https://<your-vercel-app>.vercel.app`:
- Top navigation bar displays green indicator `API v1.0.0`.
- Dashboard renders 4 metric cards, risk distribution charts, and high-risk case roster.

### 3. Interactive Route Verification
Navigate to and reload each client route:
- `/` — Executive KPI Dashboard
- `/cases` — Parcel Case Management & Search
- `/map` — Interactive Leaflet GIS Corridors
- `/analytics` — Bottleneck & Stage Duration Analytics
- `/model` — Machine Learning Evaluation & Feature Importance
- `/data` — CSV Ingestion & Demonstration Control Panel

### 4. Admin Security Probe
Test unauthorized reset prevention:
```bash
curl -X POST https://landdelay-api.onrender.com/api/demo/reset
```
Expected output:
`HTTP/1.1 401 Unauthorized` — `{"detail": "Unauthorized: Valid administrative key required in 'X-Admin-Key' header to execute database reset."}`

Test authorized reset:
```bash
curl -X POST https://landdelay-api.onrender.com/api/demo/reset -H "X-Admin-Key: <your-admin-key>"
```
Expected output:
`HTTP/1.1 200 OK` — `{"status": "RESET_COMPLETE", "count": 250}`

---

## 9. Troubleshooting & FAQ

### Issue: Render Free Tier Cold Starts
- **Symptom:** The first API request after 15 minutes of inactivity takes 30–50 seconds to respond.
- **Cause:** Render spins down free tier web services during idle periods.
- **Resolution:** This is normal on Render free tier. Once spun up, requests respond in under 50ms. For persistent 24/7 uptime without sleep, upgrade to Render Starter plan ($7/mo) or use a free uptime monitor (e.g. UptimeRobot) pinging `/health` every 10 minutes.

### Issue: CORS Error in Browser Console
- **Symptom:** `Access to fetch at ... has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present`.
- **Cause:** `CORS_ORIGINS` on Render does not match your Vercel frontend URL.
- **Resolution:**
  1. Go to **Render Dashboard** -> `landdelay-api` -> **Environment**.
  2. Set `CORS_ORIGINS` to `https://<your-exact-app>.vercel.app` (without trailing slash).
  3. Click **Save Changes** (Render will automatically redeploy).

### Issue: Page Refresh Returns 404 on Vercel
- **Symptom:** Visiting `/cases` directly or pressing F5 returns a Vercel 404 page.
- **Cause:** Missing SPA rewrite rules.
- **Resolution:** Ensure `frontend/vercel.json` contains the SPA rewrite block `{"source": "/(.*)", "destination": "/index.html"}`. This file is included by default.

### Issue: PostgreSQL Connection Error (`no password supplied` / `protocol error`)
- **Symptom:** `OperationalError: could not translate host name...` or SQLAlchemy syntax error.
- **Cause:** Using raw `postgres://` or incorrect SSL mode.
- **Resolution:** LandDelay AI automatically normalizes `postgres://` to `postgresql://`. If manually specifying a custom URI, ensure the dialect is `postgresql+psycopg2://`.

---

## 10. Summary of Local Development Commands

To run LandDelay AI locally in development mode:

### Backend
```powershell
# Set Python path and start Uvicorn with auto-reload
$env:PYTHONPATH="backend"
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
API Documentation will be accessible at: `http://127.0.0.1:8000/docs`

### Frontend
```powershell
cd frontend
npm run dev
```
Web application will be accessible at: `http://localhost:5173`

### Run Backend Test Suite
```powershell
$env:PYTHONPATH="backend"
pytest backend/tests/test_backend.py -v
```

### Build Frontend for Production
```powershell
cd frontend
npm run build
```
Build output will be bundled in `frontend/dist/`.
