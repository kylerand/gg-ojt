# Deployment Guide

This guide covers deploying the Golfin Garage OJT system to the cloud. We recommend using **Railway** for the backend and **Vercel** for the frontend for an easy, low-cost deployment.

## Cost Estimate
- **Railway**: Free tier includes $5/month credit (usually enough for small apps)
- **Vercel**: Free for personal/hobby projects
- **Total**: $0/month for small scale deployments

---

## Prerequisites

1. GitHub account
2. Railway account (https://railway.app)
3. Vercel account (https://vercel.com)
4. Your code pushed to a GitHub repository

---

## Part 1: Deploy Backend to Railway

### Step 1: Prepare Your Repository

Make sure your code is pushed to GitHub:

```bash
git add .
git commit -m "Prepare for deployment"
git push origin main
```

### Step 2: Create Railway Project

1. Go to [Railway](https://railway.app) and sign in with GitHub
2. Click **"New Project"**
3. Select **"Deploy from GitHub repo"**
4. Choose your repository
5. Select the `server` folder as the root directory

### Step 3: Configure Environment Variables

In Railway, go to your project's **Variables** tab and add:

```
PORT=3001
NODE_ENV=production
JWT_SECRET=<generate-a-strong-random-string>
JWT_EXPIRES_IN=7d
ADMIN_ID=admin
ADMIN_PASSWORD=<choose-a-secure-password>
CLIENT_URL=https://your-app.vercel.app
```

**To generate a strong JWT secret:**
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### Step 4: Configure Build Settings

In Railway's **Settings** tab:

- **Root Directory**: `server`
- **Build Command**: `npm install`
- **Start Command**: `node server.js`

### Step 5: Deploy

Railway will automatically deploy. Note your deployment URL (e.g., `https://your-app.up.railway.app`).

---

## Part 2: Deploy Frontend to Vercel

### Step 1: Import Project

1. Go to [Vercel](https://vercel.com) and sign in with GitHub
2. Click **"Add New Project"**
3. Import your GitHub repository

### Step 2: Configure Project

- **Root Directory**: `client`
- **Framework Preset**: Vite
- **Build Command**: `npm run build`
- **Output Directory**: `dist`

### Step 3: Add Environment Variables

Add this environment variable:

```
VITE_API_URL=https://your-railway-app.up.railway.app
```

Replace with your actual Railway URL.

### Step 4: Deploy

Click **Deploy**. Vercel will build and deploy your frontend.

---

## Part 3: Update CORS Settings

After both are deployed, update Railway's `CLIENT_URL` environment variable with your Vercel URL:

```
CLIENT_URL=https://your-app.vercel.app
```

Redeploy the Railway app for changes to take effect.

---

## Part 4: Persistent Storage (Important!)

By default, Railway uses ephemeral storage - files are lost on redeploys. For production, you have options:

### Option A: Railway Volume (Recommended for simplicity)

1. In Railway, go to your project
2. Click **"+ New"** → **"Volume"**
3. Set mount path to `/app/data` and `/app/progress`
4. Redeploy

### Option B: Migrate to a Database

For more robust storage, migrate to a database like:
- **Railway PostgreSQL** (add from Railway dashboard)
- **MongoDB Atlas** (free tier available)
- **Supabase** (free tier available)

---

## Alternative Deployment Options

### Render.com (Free Tier Available)

1. Create account at [Render](https://render.com)
2. New Web Service → Connect GitHub
3. Configure:
   - **Root Directory**: `server`
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
4. Add environment variables
5. Deploy

### Netlify (for Frontend)

Similar to Vercel:
1. Connect GitHub repository
2. Set **Base directory**: `client`
3. Set **Build command**: `npm run build`
4. Set **Publish directory**: `client/dist`
5. Add `VITE_API_URL` environment variable

### Docker Deployment

A `Dockerfile` is included for containerized deployment:

```bash
# Build
docker build -t gg-ojt-server ./server

# Run
docker run -p 3001:3001 \
  -e JWT_SECRET=your-secret \
  -e ADMIN_PASSWORD=your-password \
  -v $(pwd)/data:/app/data \
  -v $(pwd)/progress:/app/progress \
  gg-ojt-server
```

---

## Post-Deployment Checklist

- [ ] Test login with admin credentials
- [ ] Test trainee registration
- [ ] Verify modules load correctly
- [ ] Test progress saving
- [ ] Check admin panel access
- [ ] Test on mobile devices
- [ ] Update any hardcoded localhost URLs

---

## Environment Variables Reference

### Server (Railway/Backend)

| Variable | Required | Description |
|----------|----------|-------------|
| `PORT` | Yes | Server port (Railway sets automatically) |
| `NODE_ENV` | Yes | Set to `production` |
| `JWT_SECRET` | Yes | Secret key for JWT tokens |
| `JWT_EXPIRES_IN` | No | Token expiration (default: 7d) |
| `ADMIN_ID` | No | Default admin username (default: admin) |
| `ADMIN_PASSWORD` | No | Default admin password (default: admin123) |
| `CLIENT_URL` | Yes | Frontend URL for CORS |

### Client (Vercel/Frontend)

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_API_URL` | Yes | Backend API URL |

---

## Troubleshooting

### CORS Errors
- Verify `CLIENT_URL` in Railway matches your Vercel URL exactly
- Check for trailing slashes

### Authentication Issues
- Verify `JWT_SECRET` is set in Railway
- Check browser console for specific error messages

### Files Not Persisting
- Set up Railway Volume for persistent storage
- Or migrate to a database solution

### Build Failures
- Check build logs in Railway/Vercel
- Ensure all dependencies are in `package.json`
- Verify Node.js version compatibility

---

## Monitoring & Logs

### Railway
- View logs in the **Deployments** tab
- Set up alerts in **Settings** → **Observability**

### Vercel
- View function logs in **Logs** tab
- Enable analytics in project settings

---

## Scaling

When you outgrow the free tier:

1. **Railway Pro**: ~$5-20/month for more resources
2. **Database**: Add PostgreSQL/MongoDB for better data handling
3. **CDN**: Use Cloudflare for global caching
4. **File Storage**: Use AWS S3 or Cloudflare R2 for videos/images
