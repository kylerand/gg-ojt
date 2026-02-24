# Deployment Guide

This guide covers deploying the Golfin Garage OJT system to the cloud. We recommend using **Railway** for the backend and **Vercel** for the frontend.

## Cost Estimate
- **Supabase**: Free tier (up to 500 MB database, 1 GB file storage)
- **Railway**: Free tier includes $5/month credit (usually enough for small apps)
- **Vercel**: Free for personal/hobby projects
- **Total**: $0/month for small-scale deployments

---

## Prerequisites

1. GitHub account
2. [Supabase](https://supabase.com) project (free)
3. [Railway](https://railway.app) account
4. [Vercel](https://vercel.com) account
5. Your code pushed to a GitHub repository

---

## Part 1: Set Up Supabase (Database + Auth)

Supabase is **required** — it handles authentication, module storage, and trainee progress.

### Step 1: Create a Supabase Project

1. Go to [Supabase](https://supabase.com) and sign in
2. Click **"New Project"**, choose a name and region
3. Set a strong **database password** (this secures Supabase's internal PostgreSQL database — you won't use it in the app directly, but store it safely)
4. Wait for the project to provision (~1 minute)

### Step 2: Run the Schema

1. In your Supabase dashboard go to **SQL Editor**
2. Click **"New query"**
3. Paste the contents of `supabase/schema.sql` from this repository
4. Click **"Run"** — this creates all required tables and policies

### Step 3: Copy Your API Keys

Go to **Settings → API**:

| Setting | Where to find it |
|---------|-----------------|
| `SUPABASE_URL` | **Project URL** |
| `SUPABASE_SERVICE_KEY` | **Project API keys → service_role (secret)** |

> ⚠️ Use the **service_role** key (not the `anon` key) for the backend — it bypasses Row Level Security for server-side operations.

---

## Part 2: Deploy Backend to Railway

### Step 1: Create Railway Project

1. Go to [Railway](https://railway.app) and sign in with GitHub
2. Click **"New Project"** → **"Deploy from GitHub repo"**
3. Choose your repository
4. Set **Root Directory** to `server`

### Step 2: Configure Environment Variables

In Railway, go to your project's **Variables** tab and add:

```
PORT=3001
NODE_ENV=production
ADMIN_ID=admin
ADMIN_PASSWORD=<choose-a-secure-password>
ADMIN_EMAIL=admin@yourcompany.com
CLIENT_URL=https://your-app.vercel.app
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=<your-service-role-key>
```

### Step 3: Configure Build Settings

In Railway's **Settings** tab:

- **Root Directory**: `server`
- **Build Command**: `npm install`
- **Start Command**: `node server.js`

### Step 4: Deploy

Railway will automatically deploy. Note your deployment URL (e.g., `https://your-app.up.railway.app`).

On first start the server will automatically:
- Create the default admin user
- Seed Supabase with all training modules and learning paths from the JSON files

---

## Part 3: Deploy Frontend to Vercel

### Step 1: Import Project

1. Go to [Vercel](https://vercel.com) and sign in with GitHub
2. Click **"Add New Project"** and import your GitHub repository

### Step 2: Configure Project

- **Root Directory**: `client`
- **Framework Preset**: Vite
- **Build Command**: `npm run build`
- **Output Directory**: `dist`

### Step 3: Add Environment Variables

```
VITE_API_URL=https://your-railway-app.up.railway.app
```

### Step 4: Deploy

Click **Deploy**. Vercel will build and deploy your frontend.

---

## Part 4: Update CORS Settings

After both are deployed, update Railway's `CLIENT_URL` environment variable with your Vercel URL:

```
CLIENT_URL=https://your-app.vercel.app
```

Redeploy the Railway app for changes to take effect.

---

## Environment Variables Reference

### Server (Railway/Backend)

| Variable | Required | Description |
|----------|----------|-------------|
| `SUPABASE_URL` | **Yes** | Your Supabase project URL |
| `SUPABASE_SERVICE_KEY` | **Yes** | Supabase service role key (secret) |
| `PORT` | Yes | Server port (Railway sets this automatically) |
| `NODE_ENV` | Yes | Set to `production` |
| `ADMIN_ID` | No | Default admin username (default: `admin`) |
| `ADMIN_PASSWORD` | No | Default admin password (default: `admin123`) — **change this!** |
| `ADMIN_EMAIL` | No | Admin email for Supabase Auth (default: `admin@gg-ojt.local`) |
| `CLIENT_URL` | Yes | Frontend URL for CORS (comma-separated for multiple) |
| `OPENAI_API_KEY` | No | For AI thumbnail generation in the admin panel |

### Client (Vercel/Frontend)

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_API_URL` | Yes | Backend API URL |

---

## Local Development Setup

### 1. Clone and install dependencies

```bash
git clone <your-repo>
cd gg-ojt
npm run install:all
```

### 2. Configure environment

Copy the example and fill in your Supabase credentials:

```bash
cp .env.example .env
# Edit .env with your SUPABASE_URL and SUPABASE_SERVICE_KEY
```

### 3. Start development servers

```bash
npm run dev
```

This starts both the backend (port 3001) and frontend (port 5173) concurrently.

On first start, the server automatically seeds all modules and learning paths from the `data/` directory into Supabase.

---

## Adding New Content

Modules and learning paths are defined as JSON files in:
- `data/modules/` — training modules
- `data/learning-paths/` — learning path groupings

After editing or adding JSON files, the server will pick up the changes on next restart (new files are synced; existing ones are skipped to preserve any edits made via the Admin panel).

To force-overwrite Supabase with the local JSON files:

```bash
# Via the Admin panel: Admin → Settings → "Force sync modules"
# Or via the API (get a token by logging in first):
#   1. POST /api/auth/login  { "employeeId": "admin", "password": "..." }
#   2. Copy the "token" from the response
curl -X POST http://localhost:3001/api/admin/modules/sync \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token-from-login>" \
  -d '{"force": true}'
```

---

## Troubleshooting

### "FATAL: Supabase credentials are required"
- Ensure `SUPABASE_URL` and `SUPABASE_SERVICE_KEY` are set in your `.env` file
- Use the **service_role** key, not the `anon` key

### "relation does not exist" errors
- Run `supabase/schema.sql` in your Supabase SQL Editor
- The schema must be run once before the server can start normally

### CORS Errors
- Verify `CLIENT_URL` in Railway matches your Vercel URL exactly
- No trailing slashes

### Admin Login Fails
- Check `ADMIN_ID`, `ADMIN_PASSWORD`, and `ADMIN_EMAIL` are set
- The admin user is created automatically on first server start
- If the Supabase Auth user is missing, restart the server — it will re-run `ensureAdminExists()`

### Build Failures
- Check build logs in Railway/Vercel
- Ensure all dependencies are in `package.json`
- Verify Node.js 18+ is being used

---

## Docker Deployment

A `Dockerfile` is included in `server/`:

```bash
docker build -t gg-ojt-server ./server

docker run -p 3001:3001 \
  -e SUPABASE_URL=https://your-project.supabase.co \
  -e SUPABASE_SERVICE_KEY=your-service-role-key \
  -e ADMIN_PASSWORD=your-password \
  -e CLIENT_URL=https://your-app.vercel.app \
  gg-ojt-server
```

---

## Monitoring & Logs

### Railway
- View logs in the **Deployments** tab
- Set up alerts in **Settings → Observability**

### Vercel
- View function logs in the **Logs** tab
