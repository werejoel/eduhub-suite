# 🔐 Authentication Setup Guide

This guide will help you set up authentication with role-based access control for the EduHub Suite.

## Overview

The authentication system uses:
- **Supabase Auth** for user authentication
- **Role-based access control** with 4 roles: Admin, Teacher, Headteacher, Burser
- **Protected routes** that redirect based on user role
- **Automatic profile creation** when users sign up

---

## Step 1: Enable Supabase Authentication

1. Go to your Supabase project dashboard
2. Navigate to **Authentication** → **Providers**
3. Enable **Email** provider (or any other provider you prefer)
4. Configure email settings if needed

---

## Step 2: Create Database Schema

Run the SQL script in your Supabase SQL Editor:

```bash
# Copy and paste the contents of SUPABASE_AUTH_SCHEMA.sql
# This creates:
# - users table for profiles
# - RLS policies for security
# - Trigger to auto-create profiles on signup
```

**File**: `SUPABASE_AUTH_SCHEMA.sql`

---

## Step 3: Create Default Admin Account

**⚠️ IMPORTANT**: The system requires a default administrator account to be created manually. Admin accounts cannot be created through public registration.

See **`DEFAULT_ADMIN_ACCOUNT.md`** for detailed instructions on creating the default admin account.

**Quick Setup:**
1. Go to Supabase Dashboard → **Authentication** → **Users** → **Add User**
2. Email: `admin@kabaleparents.com`
3. Password: `admin123` (change immediately after first login!)
4. User Metadata:
   ```json
   {
     "first_name": "Admin",
     "last_name": "User",
     "role": "admin"
   }
   ```

**Default Credentials:**
- Email: `admin@kabaleparents.com`
- Password: `admin123`
- **⚠️ Change this password immediately after first login!**

---

## Step 4: User Registration

### Self-Registration (For Teachers, Head Teachers, and Bursers)

Users can register their own accounts for the following roles:

1. Navigate to `/signup` or click "Get Started" on the homepage
2. Fill in the registration form:
   - First Name
   - Last Name
   - Role (Teacher, Head Teacher, or Burser)
   - Email
   - Password (minimum 6 characters)
   - Confirm Password
3. Click "Create Account"
4. The system will automatically:
   - Create the auth user
   - Create the user profile in the `users` table
   - Redirect to login page

**Note**: Administrator accounts cannot be created through public registration. They must be created manually by existing administrators or through Supabase Dashboard.

### Manual User Creation (For Testing or Additional Admins)

#### Using Supabase Dashboard

1. Go to **Authentication** → **Users**
2. Click **Add User** → **Create new user**
3. Enter email and password
4. In **User Metadata**, add:
   ```json
   {
     "first_name": "Admin",
     "last_name": "User",
     "role": "admin"
   }
   ```
5. The trigger will automatically create the user profile

#### Using SQL (After creating auth user)

```sql
-- First, create the auth user through Supabase Dashboard
-- Then get their ID and insert profile:

INSERT INTO users (id, email, first_name, last_name, role)
VALUES 
   ('<auth-user-id>', 'admin@kabaleparents.com', 'Admin', 'User', 'admin');
```

### Recommended Test Users

| Email | Password | Role | First Name | Last Name |
|-------|----------|------|-------------|-----------|
| admin@kabaleparents.com | admin123 | admin | Admin | User |
| teacher@school.com | teacher123 | teacher | John | Teacher |
| headteacher@school.com | head123 | headteacher | Jane | Principal |
| burser@school.com | burser123 | burser | Bob | Burser |

---

## Step 4: Verify Setup

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Navigate to `http://localhost:8080`

3. Click **Get Started** or go to `/login`

4. Try logging in with one of your test users

5. You should be redirected to the appropriate dashboard based on role:
   - Admin → `/admin`
   - Teacher → `/teacher`
   - Headteacher → `/headteacher`
   - Burser → `/burser`

---

## How It Works

### Authentication Flow

#### Registration Flow
1. **User signs up** via `/signup` page
2. **Supabase Auth** creates auth user with metadata
3. **Database trigger** automatically creates user profile
4. **User is redirected** to login page
5. **User logs in** to access their dashboard

#### Login Flow
1. **User logs in** via `/login` page
2. **Supabase Auth** authenticates credentials
3. **AuthContext** fetches user profile from `users` table
4. **ProtectedRoute** checks if user has required role
5. **User is redirected** to their dashboard

### Role-Based Access

- **Admin**: Full access to `/admin/*` routes
- **Teacher**: Access to `/teacher/*` routes
- **Headteacher**: Access to `/headteacher/*` routes
- **Burser**: Access to `/burser` route

### Protected Routes

All dashboard routes are wrapped with `<ProtectedRoute>`:
- Checks if user is authenticated
- Verifies user has required role
- Redirects to login if not authenticated
- Redirects to appropriate dashboard if wrong role

---

## File Structure

```
src/
├── contexts/
│   └── AuthContext.tsx          # Auth state management
├── components/
│   ├── auth/
│   │   └── ProtectedRoute.tsx   # Route protection component
│   └── layout/
│       └── DashboardLayout.tsx   # Updated to use auth
├── pages/
│   ├── Login.tsx                # Login page
│   ├── SignUp.tsx               # Registration page
│   └── Index.tsx                # Landing page (redirects if logged in)
└── lib/
    └── types.ts                 # User and UserRole types
```

---

## API Reference

### useAuth Hook

```typescript
const { 
  user,           // User profile (from users table)
  supabaseUser,   // Supabase auth user
  session,        // Current session
  loading,        // Loading state
  signIn,         // Sign in function
  signUp,         // Sign up function (email, password, firstName, lastName, role)
  signOut,        // Sign out function
  refreshUser     // Refresh user data
} = useAuth();
```

### ProtectedRoute Component

```typescript
<ProtectedRoute allowedRoles={['admin', 'teacher']}>
  <YourComponent />
</ProtectedRoute>
```

---

## Troubleshooting

### Issue: "Users can view own profile" policy error

**Solution**: Make sure you've run the RLS policies from `SUPABASE_AUTH_SCHEMA.sql`

### Issue: User profile not created on signup

**Solution**: 
1. Check if the trigger `on_auth_user_created` exists
2. Verify the function `handle_new_user()` is created
3. Check Supabase logs for errors

### Issue: Redirect loop

**Solution**: 
1. Clear browser cache and cookies
2. Check if user role matches allowed roles
3. Verify user profile exists in `users` table

### Issue: "Missing Supabase environment variables"

**Solution**: 
1. Create `.env.local` file in project root
2. Add:
   ```
   VITE_SUPABASE_URL=your_project_url
   VITE_SUPABASE_ANON_KEY=your_anon_key
   ```
3. Restart dev server

---

## Security Notes

1. **Row Level Security (RLS)** is enabled on the `users` table
2. Users can only view/update their own profiles
3. Service role has full access (for admin operations)
4. All routes are protected by role-based access control
5. Passwords are never stored in plain text (handled by Supabase)

---

## Next Steps

1. ✅ Set up authentication
2. ✅ Create test users
3. ⚠️ Customize user roles and permissions
4. ⚠️ Add password reset functionality
5. ⚠️ Implement email verification
6. ⚠️ Add user management for admins

---

## Support

For issues or questions:
- Check Supabase Auth documentation: https://supabase.com/docs/guides/auth
- Review the code in `src/contexts/AuthContext.tsx`
- Check Supabase logs in your project dashboard

