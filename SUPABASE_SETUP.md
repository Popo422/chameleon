# Supabase Setup Guide

This guide walks you through setting up Supabase for the Chameleon game.

## 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in (or create an account)
2. Click **New Project**
3. Fill in:
   - **Name**: `chameleon-game` (or any name you like)
   - **Database Password**: Generate or create a strong password (save this somewhere safe)
   - **Region**: Choose the closest to your users
4. Click **Create new project**
5. Wait for the project to finish setting up (takes about 2 minutes)

## 2. Enable Anonymous Authentication

This allows players to join games without creating accounts.

1. In your Supabase dashboard, go to **Authentication** (left sidebar)
2. Click **Providers** tab
3. Find **Anonymous** in the list
4. Toggle it **ON**
5. Click **Save**

## 3. Set Up the Database

1. Go to **SQL Editor** (left sidebar)
2. Click **New query**
3. Copy and paste the entire contents of `supabase-schema.sql` from your project
4. Click **Run** (or press Ctrl/Cmd + Enter)
5. You should see "Success. No rows returned" - this means it worked

### What the schema creates:
- `rooms` table - stores game rooms
- `players` table - stores players in each room
- Row Level Security policies - controls who can read/write data
- Realtime subscriptions - enables live updates

## 4. Get Your API Keys

1. Go to **Project Settings** (gear icon at bottom of left sidebar)
2. Click **API** in the settings menu
3. You'll see two important values:
   - **Project URL** - looks like `https://xxxxx.supabase.co`
   - **anon public** key - a long string starting with `eyJ...`

## 5. Configure Your App

1. Create a `.env` file in your project root (same folder as `package.json`):

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

2. Replace the values with your actual Project URL and anon key from step 4

3. **Important**: Make sure `.env` is in your `.gitignore` file (it should be by default)

## 6. Restart Your Dev Server

```bash
# Stop the current server (Ctrl+C) then:
npm run dev
```

## 7. Verify It's Working

1. Open your app in the browser
2. Create a room and join with another browser/tab
3. Both players should see each other in the lobby
4. Open browser DevTools (F12) → Console tab - no red errors about Supabase credentials

## Troubleshooting

### "Supabase credentials not found" error
- Make sure your `.env` file is in the project root
- Make sure the variable names are exactly `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
- Restart your dev server after creating/editing `.env`

### "Anonymous sign-ins are disabled" error
- Go back to Authentication → Providers and make sure Anonymous is enabled

### "permission denied for table" error
- Re-run the SQL schema to ensure RLS policies are created
- Make sure you ran the entire schema file, not just parts of it

### Players can't see each other / realtime not working
- Go to **Database** → **Replication** in Supabase dashboard
- Make sure `rooms` and `players` tables are listed under "Tables in publication"
- If not, run this SQL:
  ```sql
  ALTER PUBLICATION supabase_realtime ADD TABLE rooms;
  ALTER PUBLICATION supabase_realtime ADD TABLE players;
  ```

## Migration: Existing Databases Only

If you set up your database before this update, run this SQL to apply important fixes:

```sql
-- Fix 1: Security - Only host can update rooms (also allows initial setup when host_id is NULL)
DROP POLICY IF EXISTS "Authenticated users can update rooms" ON rooms;
DROP POLICY IF EXISTS "Host can update rooms" ON rooms;

CREATE POLICY "Host can update rooms"
  ON rooms FOR UPDATE
  TO authenticated
  USING (
    host_id IS NULL
    OR host_id IN (
      SELECT id FROM players WHERE auth_user_id = auth.uid()
    )
  );

-- Fix 2: Enable REPLICA IDENTITY FULL so player leave/kick events work properly
ALTER TABLE players REPLICA IDENTITY FULL;
```

## Optional: View Your Data

To see what's in your database:

1. Go to **Table Editor** (left sidebar)
2. Click on `rooms` or `players` to see the data
3. You can also delete test data from here

## Optional: Set Up Automatic Cleanup

Old rooms can pile up. To auto-delete rooms older than 24 hours:

1. Go to **SQL Editor**
2. Run:
   ```sql
   -- Delete rooms older than 24 hours (run manually or set up a cron)
   SELECT cleanup_old_rooms();
   ```

For automatic cleanup, you can set up a [Supabase Edge Function](https://supabase.com/docs/guides/functions) with a cron trigger, or use an external service to call this periodically.

---

## Quick Reference

| What | Where |
|------|-------|
| Project URL | Project Settings → API |
| Anon Key | Project Settings → API |
| Enable Anonymous Auth | Authentication → Providers → Anonymous |
| Run SQL | SQL Editor → New query |
| View Data | Table Editor |
| Check Realtime | Database → Replication |

---

You're all set! The game should now work with online multiplayer.
