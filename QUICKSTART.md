# Quick Start Guide

Get the Golfin Garage training system running in 10 minutes.

## Prerequisites

- ✅ Node.js 18+ (`node --version`)
- ✅ npm 8+ (`npm --version`)
- ✅ A free [Supabase](https://supabase.com) project

---

## Step 1: Set Up Supabase

1. Create a free project at [https://supabase.com](https://supabase.com)
   - Choose a name, region, and strong database password (for Supabase's own database — you won't need this in the app)
2. Go to **SQL Editor → New query**
3. Paste the contents of `supabase/schema.sql` and click **Run**
   - You should see "Success. No rows returned" — that means all tables were created
4. Go to **Settings → API** and copy:
   - **Project URL** → `SUPABASE_URL`
   - **service_role** key (secret) → `SUPABASE_SERVICE_KEY`

---

## Step 2: Configure Environment

```bash
cp .env.example .env
```

Open `.env` and fill in your Supabase credentials:

```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key
```

---

## Step 3: Install Dependencies

```bash
npm run install:all
```

---

## Step 4: Start the Application

```bash
npm run dev
```

Or manually:
```bash
# Terminal 1 - Server
cd server && npm run dev

# Terminal 2 - Client
cd client && npm run dev
```

On first start the server will:
- ✅ Create the default admin user in Supabase Auth
- ✅ Seed all training modules and learning paths into Supabase

---

## Step 5: Access the Application

Open your browser to: **http://localhost:5173**

### Default Admin Credentials
- **Employee ID**: `admin`
- **Password**: `admin123`

> ⚠️ Change the admin password in your `.env` file before deploying to production!

---

## Quick Tour

### Trainee Experience
1. **Home Page** — See learning paths and training modules
2. **Learning Path** — View grouped modules and unlock the final test
3. **Module Overview** — View module details and steps
4. **Step Page** — Watch videos, read instructions, complete steps
5. **Quiz** — Answer knowledge check questions
6. **Progress Page** — Track your completion status

### Admin Access
- Navigate to: **http://localhost:5173/admin**
- Or log in as admin and click the Admin button in the header
- Manage trainees, modules, learning paths, and Q&A

---

## Troubleshooting

### Server fails with "FATAL: Supabase credentials are required"
- Make sure `.env` exists with `SUPABASE_URL` and `SUPABASE_SERVICE_KEY` set

### "relation does not exist" errors
- Run `supabase/schema.sql` in Supabase SQL Editor first

### Port Already in Use
```bash
# Find the process using port 3001 (server) and stop it
npx kill-port 3001
# Find the process using port 5173 (frontend) and stop it
npx kill-port 5173
```

### Videos not playing
- Placeholder videos use external URLs (requires internet)
- See `docs/VIDEO_GUIDE.md` for adding real training videos

---

## Next Steps

- 📖 See [DEPLOYMENT.md](DEPLOYMENT.md) for production deployment
- 🎬 See [docs/VIDEO_GUIDE.md](docs/VIDEO_GUIDE.md) to add real training videos
- ✏️ See [docs/CONTENT_GUIDE.md](docs/CONTENT_GUIDE.md) to update training content

---

**Welcome to the Golfin Garage Training System!** 🏌️⚙️
