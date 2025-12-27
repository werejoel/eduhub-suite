-- ============================================================================
-- CREATE DEFAULT ADMIN ACCOUNT
-- ============================================================================
-- This script creates the default administrator account for EduHub Suite
-- 
-- IMPORTANT: 
-- 1. You must FIRST create the auth user in Supabase Dashboard
-- 2. Then run this script to create the user profile
-- 3. Change the default password immediately after first login!
--
-- Default Credentials:
--   Email: admin@kabaleparents.com
--   Password: admin123 (CHANGE THIS IMMEDIATELY!)
--   Role: admin
--
-- ============================================================================

-- ============================================================================
-- STEP 1: Create Auth User (MUST DO THIS FIRST!)
-- ============================================================================
-- ⚠️ IMPORTANT: You MUST create the auth user BEFORE running this script!
--
-- Instructions:
-- 1. Go to Supabase Dashboard → Authentication → Users
-- 2. Click "Add User" → "Create new user"
-- 3. Fill in the form:
--    - Email: admin@kabaleparents.com
--    - Password: admin123 (or your preferred secure password)
--    - Auto Confirm User: ✅ (checked - IMPORTANT!)
-- 4. In "User Metadata" field, paste this JSON:
--    {
--      "first_name": "Admin",
--      "last_name": "User",
--      "role": "admin"
--    }
-- 5. Click "Create User"
-- 6. Wait a few seconds for the user to be created
-- 7. Then run this SQL script (it will find the user automatically)
--
-- ============================================================================

-- ============================================================================
-- STEP 2: Create User Profile (Run this SQL script)
-- ============================================================================

-- Option A: If you know the auth user ID
-- Replace '<USER_ID_HERE>' with the actual UUID from auth.users table
-- You can find it in: Authentication → Users → Click on the user → Copy the ID

-- Check if auth user exists first
DO $$
DECLARE
  admin_user_id UUID;
  user_exists BOOLEAN;
BEGIN
  -- Check if auth user exists
  SELECT id INTO admin_user_id
  FROM auth.users
  WHERE email = 'admin@kabaleparents.com'
  LIMIT 1;

  user_exists := (admin_user_id IS NOT NULL);

  -- If user exists, create or update the profile
  IF user_exists THEN
    INSERT INTO public.users (id, email, first_name, last_name, role)
    VALUES (
      admin_user_id,
      'admin@kabaleparents.com',
      'Admin',
      'User',
      'admin'
    )
    ON CONFLICT (id) DO UPDATE
    SET
      email = EXCLUDED.email,
      first_name = EXCLUDED.first_name,
      last_name = EXCLUDED.last_name,
      role = EXCLUDED.role,
      updated_at = CURRENT_TIMESTAMP;
    
    RAISE NOTICE '✅ SUCCESS: Admin profile created/updated successfully!';
    RAISE NOTICE 'User ID: %', admin_user_id;
    RAISE NOTICE 'Email: admin@kabaleparents.com';
    RAISE NOTICE 'Role: admin';
  ELSE
    RAISE WARNING '⚠️  Auth user not found!';
    RAISE NOTICE '';
    RAISE NOTICE '═══════════════════════════════════════════════════════════════';
    RAISE NOTICE 'ACTION REQUIRED: Create the auth user first';
    RAISE NOTICE '═══════════════════════════════════════════════════════════════';
    RAISE NOTICE '';
    RAISE NOTICE 'Follow these steps:';
    RAISE NOTICE '1. Go to Supabase Dashboard → Authentication → Users';
    RAISE NOTICE '2. Click "Add User" → "Create new user"';
    RAISE NOTICE '3. Enter:';
    RAISE NOTICE '   - Email: admin@kabaleparents.com';
    RAISE NOTICE '   - Password: admin123 (or your preferred password)';
    RAISE NOTICE '   - Auto Confirm User: ✅ (checked)';
    RAISE NOTICE '4. In User Metadata (JSON), add:';
    RAISE NOTICE '   {"first_name": "Admin", "last_name": "User", "role": "admin"}';
    RAISE NOTICE '5. Click "Create User"';
    RAISE NOTICE '6. Run this script again';
    RAISE NOTICE '';
    RAISE NOTICE '═══════════════════════════════════════════════════════════════';
  END IF;
END $$;

-- ============================================================================
-- STEP 3: Verify Admin Account
-- ============================================================================

-- Check if admin profile exists
SELECT 
  u.id,
  u.email,
  u.first_name,
  u.last_name,
  u.role,
  u.created_at,
  u.updated_at,
  CASE 
    WHEN au.id IS NOT NULL THEN 'Auth user exists ✅'
    ELSE 'Auth user NOT found ❌'
  END as auth_status
FROM public.users u
LEFT JOIN auth.users au ON u.id = au.id
WHERE u.email = 'admin@kabaleparents.com' AND u.role = 'admin';

-- ============================================================================
-- ALTERNATIVE: Manual Insert (if the above doesn't work)
-- ============================================================================
-- If the DO block doesn't work, use this instead:
-- Replace '<USER_ID_HERE>' with the actual UUID from auth.users

/*
INSERT INTO public.users (id, email, first_name, last_name, role)
SELECT 
  au.id,
  'admin@kabaleparents.com',
  'Admin',
  'User',
  'admin'
FROM auth.users au
WHERE au.email = 'admin@kabaleparents.com'
  AND NOT EXISTS (
    SELECT 1 FROM public.users u WHERE u.id = au.id
  )
ON CONFLICT (id) DO UPDATE
SET
  email = EXCLUDED.email,
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name,
  role = EXCLUDED.role,
  updated_at = CURRENT_TIMESTAMP;
*/

-- ============================================================================
-- TROUBLESHOOTING
-- ============================================================================

-- Check if auth user exists
SELECT 
  id,
  email,
  created_at,
  raw_user_meta_data
FROM auth.users
WHERE email = 'admin@kabaleparents.com';

-- Check if user profile exists
SELECT * FROM public.users
WHERE email = 'admin@kabaleparents.com';

-- Check RLS policies (should allow service role to insert)
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'users';

-- ============================================================================
-- UPDATE ADMIN PASSWORD (if needed)
-- ============================================================================
-- Note: Password updates should be done through Supabase Dashboard:
-- 1. Go to Authentication → Users
-- 2. Find admin@school.com
-- 3. Click "Reset Password" or use the "Update User" option
--
-- Or use Supabase Management API (requires service role key)

-- ============================================================================
-- SECURITY REMINDER
-- ============================================================================
-- ⚠️ CRITICAL: Change the default password immediately after first login!
--
-- Recommended password requirements:
--   - Minimum 12 characters
--   - Mix of uppercase, lowercase, numbers, and symbols
--   - Not based on dictionary words
--   - Unique to this system
--
-- Default credentials (CHANGE THESE):
--   Email: admin@kabaleparents.com
--   Password: admin123
--
-- ============================================================================
-- COMPLETE SETUP CHECKLIST
-- ============================================================================
-- [ ] Auth user created in Supabase Dashboard
-- [ ] User profile created in users table (this script)
-- [ ] Verified admin can login
-- [ ] Changed default password
-- [ ] Tested admin dashboard access
-- [ ] Verified admin has full system access
--
-- ============================================================================
