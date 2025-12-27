# ⚠️ Database Setup Required

## Error: Users Table Not Found (404)

If you're seeing errors like:
- `Failed to load resource: the server responded with a status of 404`
- `Error fetching user profile`
- `Error creating user profile`
- `Cannot read properties of undefined (reading 'payload')`

This means the `users` table hasn't been created in your Supabase database yet.

## Quick Fix

### Step 1: Run the Database Schema

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Click **New Query**
4. Copy and paste the **entire contents** of `SUPABASE_AUTH_SCHEMA.sql`
5. Click **Run** (or press Ctrl+Enter)

This will create:
- ✅ `users` table
- ✅ Required indexes
- ✅ Row Level Security (RLS) policies
- ✅ Auto-profile creation trigger

### Step 2: Verify Table Creation

1. Go to **Table Editor** in Supabase
2. You should see a `users` table listed
3. Check that it has the following columns:
   - `id` (UUID, Primary Key)
   - `email` (VARCHAR)
   - `first_name` (VARCHAR)
   - `last_name` (VARCHAR)
   - `role` (VARCHAR)
   - `created_at` (TIMESTAMP)
   - `updated_at` (TIMESTAMP)

### Step 3: Verify Policies

1. Go to **Authentication** → **Policies** (or **Table Editor** → `users` → **RLS**)
2. You should see these policies:
   - ✅ "Users can view own profile"
   - ✅ "Users can insert own profile"
   - ✅ "Users can update own profile"
   - ✅ "Service role full access"

### Step 4: Test Again

1. Refresh your application
2. Try signing up or logging in again
3. The errors should be resolved

## Still Having Issues?

### Check 1: Table Exists But Still Getting 404

**Possible causes:**
- RLS policies are too restrictive
- Table is in wrong schema (should be `public.users`)
- API key doesn't have access

**Solution:**
```sql
-- Check if table exists
SELECT * FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'users';

-- Check RLS status
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename = 'users';

-- Temporarily disable RLS for testing (NOT recommended for production)
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
```

### Check 2: Trigger Not Working

If profiles aren't being created automatically:

```sql
-- Check if trigger exists
SELECT * FROM pg_trigger 
WHERE tgname = 'on_auth_user_created';

-- Check if function exists
SELECT * FROM pg_proc 
WHERE proname = 'handle_new_user';
```

### Check 3: Environment Variables

Make sure your `.env.local` file has:
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

## Complete Setup Checklist

- [ ] Supabase project created
- [ ] Email authentication enabled
- [ ] `SUPABASE_AUTH_SCHEMA.sql` executed successfully
- [ ] `users` table visible in Table Editor
- [ ] RLS policies created and enabled
- [ ] Trigger `on_auth_user_created` exists
- [ ] Function `handle_new_user` exists
- [ ] Environment variables set in `.env.local`
- [ ] Application restarted after env changes

## Need Help?

1. Check Supabase logs: **Logs** → **Postgres Logs**
2. Check browser console for detailed error messages
3. Verify your Supabase project URL and keys are correct
4. Make sure you're using the **anon key** (not service role key) in your frontend

---

**File to run**: `SUPABASE_AUTH_SCHEMA.sql`  
**Location**: Supabase SQL Editor  
**Time**: ~30 seconds

