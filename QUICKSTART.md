# Quick Start Guide

Get the Golfin Garage training system running in 5 minutes.

## Prerequisites Check

Before starting, ensure you have:
- ✅ Node.js 18+ installed (`node --version`)
- ✅ npm 8+ installed (`npm --version`)

## Installation Steps

### 1. Navigate to project directory
```bash
cd /path/to/gg-ojt
```

### 2. Install all dependencies
```bash
npm install
cd client && npm install && cd ..
cd server && npm install && cd ..
```

### 3. Start the application
```bash
./start.sh
```

Or manually:
```bash
# Terminal 1 - Server
cd server && npm run dev

# Terminal 2 - Client
cd client && npm run dev
```

### 4. Access the application
Open your browser to: **http://localhost:3000**

## First Login

1. Enter any employee ID (e.g., "EMP001")
2. First time users will create a profile
3. Start training!

## Test Credentials

Use these for testing:
- Employee ID: `TEST001`
- Name: `John Doe`
- Cart Type: `Electric Standard` (auto-selected)

## Quick Tour

### Trainee Experience
1. **Home Page** - See all training modules
2. **Module Overview** - View module details and steps
3. **Step Page** - Watch videos, read instructions, complete steps
4. **Quiz** - Answer knowledge check questions
5. **Progress Page** - Track your completion status

### Admin Access
- Navigate to: http://localhost:3000/admin
- View all trainee progress
- Reset progress if needed

## Troubleshooting

### Port Already in Use
```bash
# Find and kill process on port 3001
lsof -ti:3001 | xargs kill -9

# Find and kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Then restart
./start.sh
```

### "Module not found"
- Ensure `data/modules/*.json` files exist
- Check server console for JSON syntax errors

### Videos not playing
- Placeholder videos use external URLs (requires internet)
- For offline use, see docs/VIDEO_GUIDE.md

## Next Steps

- 📖 Read [README.md](README.md) for full documentation
- 🎬 See [docs/VIDEO_GUIDE.md](docs/VIDEO_GUIDE.md) to add real training videos
- ✏️ See [docs/CONTENT_GUIDE.md](docs/CONTENT_GUIDE.md) to update training content
- 📋 See [docs/SCHEMA.md](docs/SCHEMA.md) for data format reference

## Getting Help

- Server not starting? Check `server/server.js` logs
- Frontend errors? Open browser DevTools (F12) and check console
- JSON errors? Validate at https://jsonlint.com

## Production Deployment

When ready to deploy on workshop network:
1. Set static IP on server machine
2. Update `.env` with production values
3. Build client: `cd client && npm run build`
4. Use PM2 for process management: `pm2 start server/server.js`
5. Access from any device: `http://<server-ip>:3001`

See README.md for detailed deployment instructions.

---

**Welcome to the Golfin Garage Training System!** 🏌️⚙️
