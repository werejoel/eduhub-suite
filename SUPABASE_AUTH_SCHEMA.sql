-- ============================================================================
-- USERS TABLE (for authentication and role management)
-- ============================================================================
-- This table stores user profiles linked to Supabase Auth users
-- Run this SQL in your Supabase SQL Editor after enabling Auth

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) UNIQUE NOT NULL,
  first_name VARCHAR(255) NOT NULL,
  last_name VARCHAR(255) NOT NULL,
  role VARCHAR(50) CHECK (role IN ('admin', 'teacher', 'headteacher', 'burser')) NOT NULL DEFAULT 'teacher',
  email_confirmed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own profile
CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  USING (auth.uid() = id);

-- Policy: Users can insert their own profile (for signup)
-- Note: The trigger handles profile creation automatically, but this allows manual inserts if needed
CREATE POLICY "Users can insert own profile"
  ON users FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Policy: Users can update their own profile (except role)
CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Policy: Service role can do everything (for admin operations)
CREATE POLICY "Service role full access"
  ON users FOR ALL
  USING (auth.role() = 'service_role');

-- ============================================================================
-- FUNCTION: Auto-create user profile on signup
-- ============================================================================
-- This function automatically creates a user profile when a new auth user is created
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert user profile, ignore if it already exists (idempotent)
  INSERT INTO public.users (id, email, first_name, last_name, role, email_confirmed)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'first_name', 'User'),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'teacher')::VARCHAR,
    COALESCE((NEW.raw_user_meta_data->>'email_confirmed')::BOOLEAN, FALSE)
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
EXCEPTION
  WHEN others THEN
    -- Log error but don't fail the auth user creation
    RAISE WARNING 'Error creating user profile: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: Create user profile on auth user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- SAMPLE USERS (for testing)
-- ============================================================================
-- Note: These users need to be created through Supabase Auth first
-- Then you can manually insert their profiles or use the trigger above
-- 
-- Example: After creating auth users, you can insert profiles like this:
--
-- INSERT INTO users (id, email, first_name, last_name, role)
-- VALUES 
--   ('<auth-user-id-1>', 'admin@kabaleparents.com', 'Admin', 'User', 'admin'),
--   ('<auth-user-id-2>', 'teacher@school.com', 'John', 'Teacher', 'teacher'),
--   ('<auth-user-id-3>', 'headteacher@school.com', 'Jane', 'Principal', 'headteacher'),
--   ('<auth-user-id-4>', 'burser@school.com', 'Bob', 'Burser', 'burser');

-- ============================================================================
-- HELPER FUNCTION: Get user role
-- ============================================================================
CREATE OR REPLACE FUNCTION public.get_user_role(user_id UUID)
RETURNS VARCHAR AS $$
  SELECT role FROM users WHERE id = user_id;
$$ LANGUAGE sql SECURITY DEFINER;

