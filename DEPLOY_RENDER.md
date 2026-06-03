# Deploy FoodFlow on Render

Two services: **foodflow-api** (Node) + **foodflow-web** (static React).

## Prerequisites

1. Push this repo to GitHub/GitLab.
2. [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) cluster with a database user.
3. Atlas **Network Access** → allow `0.0.0.0/0` (required for Render’s dynamic IPs).

## Option A — Blueprint (recommended)

1. [Render Dashboard](https://dashboard.render.com/) → **New** → **Blueprint**.
2. Connect the repository and apply `render.yaml`.
3. When prompted, set **`MONGODB_URI_STANDARD`** on `foodflow-api`:
   - Atlas → **Connect** → **Drivers** → copy the **standard** connection string (not `mongodb+srv` if you had DNS issues locally).
   - Replace `<password>` and set the database name to `foodflow`, e.g.  
     `mongodb://user:pass@host1:27017,host2:27017,host3:27017/foodflow?ssl=true&authSource=admin`
4. Deploy. Render wires `CLIENT_URL` and `VITE_API_URL` between services automatically.
5. After the API is live, run seed once (optional):
   - Render → `foodflow-api` → **Shell** → `npm run seed`

## Option B — Manual services

### Backend (`foodflow-api`)

| Setting | Value |
|--------|--------|
| Root Directory | `backend` |
| Build Command | `npm install` |
| Start Command | `npm start` |
| Health Check | `/api/health` |

**Environment variables:**

| Key | Value |
|-----|--------|
| `NODE_ENV` | `production` |
| `JWT_SECRET` | long random string |
| `MONGODB_URI_STANDARD` | Atlas standard URI |
| `MONGODB_DB` | `foodflow` |
| `CLIENT_URL` | `https://<your-frontend>.onrender.com` |

### Frontend (`foodflow-web`)

| Setting | Value |
|--------|--------|
| Root Directory | `frontend` |
| Build Command | `npm install && npm run build` |
| Publish Directory | `dist` |

**Environment variables:**

| Key | Value |
|-----|--------|
| `VITE_API_URL` | `https://<your-api>.onrender.com` |

Add a **Rewrite** rule: `/*` → `/index.html` (SPA routing).

## URLs

- App: `https://foodflow-web.onrender.com`
- API: `https://foodflow-api.onrender.com/api`

## Notes

- Free tier services **spin down** after inactivity; first load may take ~1 minute.
- Socket.IO works on a single API instance (free tier = one instance).
- Never commit `.env` or Atlas credentials to git.
