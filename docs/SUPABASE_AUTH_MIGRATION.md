# Migrating to Supabase Auth

This document describes how to migrate existing users from the old bcrypt-based authentication to Supabase Auth.

## Prerequisites

1. Run the database migration in Supabase SQL Editor:
   - Open `docs/migrations/001_add_auth_id.sql`
   - Copy the SQL and run it in Supabase Dashboard > SQL Editor

2. Ensure you have the `SUPABASE_SERVICE_KEY` configured (not just the anon key)
   - This is required for admin operations like creating users

## Migration Steps

### Step 1: Run the SQL Migration

```sql
-- Add auth_id column to link users to Supabase Auth
ALTER TABLE users ADD COLUMN IF NOT EXISTS auth_id UUID UNIQUE;
CREATE INDEX IF NOT EXISTS idx_users_auth_id ON users(auth_id);
ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;
```

### Step 2: Deploy the Updated Code

Push the updated code to your server:
```bash
git add .
git commit -m "Migrate to Supabase Auth"
git push
```

### Step 3: Migrate Existing Users

Existing users will need to:
1. Use the "Forgot Password" flow (if you implement it), OR
2. Have an admin reset their password

Since passwords are hashed with bcrypt and Supabase Auth uses a different hashing algorithm, existing password hashes cannot be migrated. Users will need to set new passwords.

**Option A: Self-service password reset**
1. User clicks "Forgot Password"
2. Supabase sends a password reset email
3. User sets a new password

**Option B: Admin resets passwords**
1. Admin uses the admin panel to reset each user's password
2. Communicate the new temporary password to users
3. Users can change their password after logging in

### Step 4: Create Admin User in Supabase Auth

The first time the server starts, it will attempt to create an admin user in Supabase Auth. Make sure these environment variables are set:

```
ADMIN_ID=admin
ADMIN_PASSWORD=your-secure-password
ADMIN_EMAIL=admin@yourcompany.com
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `SUPABASE_URL` | Your Supabase project URL |
| `SUPABASE_SERVICE_KEY` | Service role key (required for admin operations) |
| `ADMIN_ID` | Admin user's employee ID |
| `ADMIN_PASSWORD` | Admin user's password |
| `ADMIN_EMAIL` | Admin user's email (optional, defaults to `{ADMIN_ID}@gg-ojt.local`) |

## Token Refresh

The frontend now automatically handles token refresh:
- Access tokens expire after 1 hour (Supabase default)
- When a token expires, the frontend attempts to refresh using the refresh token
- If refresh fails, the user is logged out

## Rollback

If you need to rollback:
1. Revert the code changes
2. Reinstall bcryptjs and jsonwebtoken: `npm install bcryptjs jsonwebtoken`
3. The `password_hash` column is still in the database, but new passwords won't work

**Note**: Any users created after the migration will only exist in Supabase Auth and cannot be rolled back easily.
