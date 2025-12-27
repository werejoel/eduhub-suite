-- ============================================================================
-- ADD EMAIL_CONFIRMED COLUMN TO USERS TABLE
-- ============================================================================
-- Run this SQL if you already have a users table and need to add the email_confirmed column
-- This is a migration script for existing databases

-- Add email_confirmed column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'users' 
    AND column_name = 'email_confirmed'
  ) THEN
    ALTER TABLE public.users 
    ADD COLUMN email_confirmed BOOLEAN DEFAULT FALSE;
    
    -- Set existing users to confirmed (optional - you may want to review this)
    -- UPDATE public.users SET email_confirmed = TRUE WHERE role = 'admin';
    
    RAISE NOTICE 'Column email_confirmed added successfully';
  ELSE
    RAISE NOTICE 'Column email_confirmed already exists';
  END IF;
END $$;

-- Verify the column was added
SELECT 
  column_name,
  data_type,
  column_default,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'users'
  AND column_name = 'email_confirmed';

-- Update the trigger function to include email_confirmed
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
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
    RAISE WARNING 'Error creating user profile: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

