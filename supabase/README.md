# Supabase Setup Guide

This guide walks you through setting up Supabase as the database for the GG OJT Training System.

## 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign up/login
2. Click **New Project**
3. Enter project details:
   - **Name**: `gg-ojt` (or your preferred name)
   - **Database Password**: Generate a strong password (save this!)
   - **Region**: Choose closest to your users
4. Click **Create new project** and wait for setup (~2 minutes)

## 2. Run the Database Schema

1. In your Supabase dashboard, go to **SQL Editor**
2. Click **New query**
3. Copy the contents of `supabase/schema.sql` from this repo
4. Paste into the SQL editor
5. Click **Run** (or Cmd/Ctrl + Enter)
6. You should see "Success. No rows returned" - this is correct!

## 3. Get Your API Keys

1. Go to **Settings** → **API**
2. Copy these values:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **service_role key**: (under "Project API keys")

⚠️ **Important**: Use the `service_role` key (not `anon` key) for server-side operations.

## 4. Configure Railway

Add these environment variables in Railway:

| Variable | Value |
|----------|-------|
| `SUPABASE_URL` | `https://xxxxx.supabase.co` |
| `SUPABASE_SERVICE_KEY` | Your service_role key |
| `JWT_SECRET` | A random secure string |
| `CLIENT_URL` | Your Vercel frontend URL |

## 5. Verify Setup

After redeploying, check the Railway logs. You should see:

```
🔗 AuthService using Supabase
🔗 ProgressTracker using Supabase
✅ Default admin user created (ID: admin)
```

## Database Tables

The schema creates these tables:

| Table | Purpose |
|-------|---------|
| `users` | User accounts, authentication, roles |
| `progress` | Main trainee progress tracking |
| `module_progress` | Per-module completion status |
| `step_progress` | Per-step completion tracking |
| `quiz_attempts` | Knowledge check scores |
| `notes` | Trainee notes on modules |
| `bookmarks` | Saved bookmarks |
| `questions` | Q&A questions from trainees |
| `answers` | Admin answers to questions |

## Fallback Mode

If Supabase credentials are not configured, the system automatically falls back to file-based storage. This is useful for:
- Local development
- Quick demos
- Environments without database access

## Troubleshooting

### "relation does not exist" errors
Run the schema SQL again in the Supabase SQL Editor.

### "permission denied" errors  
Make sure you're using the `service_role` key, not the `anon` key.

### Users not persisting
Check Railway logs for "🔗 AuthService using Supabase" message. If you see "📁 AuthService using file storage", the env vars are not set correctly.

### CORS errors
Make sure `CLIENT_URL` is set correctly in Railway.

## Data Migration

If you have existing file-based data to migrate:

1. Export JSON files from `progress/` and `users/` folders
2. Use Supabase's Table Editor or SQL to insert the data
3. Or create a migration script to read JSONs and insert via Supabase API

## Security Notes

1. **Never expose** `service_role` key to the frontend
2. Row Level Security (RLS) is enabled on all tables
3. The service role bypasses RLS for server operations
4. Consider adding more granular RLS policies for direct client access
