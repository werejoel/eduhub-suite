# 🔐 Default Administrator Account

## Overview

The system comes with a **default administrator account** that is pre-configured. This account has full access to all system features and cannot be created through the public registration form.

## Default Credentials

**⚠️ IMPORTANT: Change these credentials immediately after first login!**

| Field | Value |
|-------|-------|
| **Email** | `admin@kabaleparents.com` |
| **Password** | `admin123` |
| **Role** | Administrator |
| **First Name** | Admin |
| **Last Name** | User |

## Setup Instructions

### Step 1: Create the Admin User in Supabase

1. Go to your Supabase project dashboard
2. Navigate to **Authentication** → **Users**
3. Click **Add User** → **Create new user**
4. Enter the following:
   - **Email**: `admin@kabaleparents.com`
   - **Password**: `admin123` (or your preferred secure password)
   - **Auto Confirm User**: ✅ (checked)
5. In **User Metadata**, add:
   ```json
   {
     "first_name": "Admin",
     "last_name": "User",
     "role": "admin"
   }
   ```
6. Click **Create User**

### Step 2: Verify User Profile

The database trigger should automatically create the user profile. To verify:

1. Go to **Table Editor** → **users**
2. Find the user with email `admin@kabaleparents.com`
3. Verify the role is set to `admin`

If the profile wasn't created automatically, you can create it manually:

```sql
-- Get the auth user ID first
SELECT id FROM auth.users WHERE email = 'admin@kabaleparents.com';

-- Then insert the profile (replace <user-id> with the actual ID)
INSERT INTO users (id, email, first_name, last_name, role)
VALUES (
  '<user-id>',
  'admin@kabaleparents.com',
  'Admin',
  'User',
  'admin'
);
```

## Security Recommendations

### 1. Change Default Password Immediately

After first login:
1. Go to your profile settings (if implemented)
2. Or update directly in Supabase:
   - Go to **Authentication** → **Users**
   - Find the admin user
   - Click **Reset Password** or update via SQL

### 2. Use Strong Password

Recommended password requirements:
- Minimum 12 characters
- Mix of uppercase, lowercase, numbers, and symbols
- Not based on dictionary words
- Unique to this system

### 3. Enable Two-Factor Authentication (Future)

Consider implementing 2FA for admin accounts for additional security.

### 4. Limit Admin Account Access

- Only share admin credentials with trusted personnel
- Consider creating separate admin accounts for different administrators
- Regularly audit admin account activity

## Admin Account Features

The admin account has access to:

- ✅ **Full System Access**: All modules and features
- ✅ **User Management**: Create, edit, and manage all user accounts
- ✅ **Student Management**: Full CRUD operations on students
- ✅ **Teacher Management**: Full CRUD operations on teachers
- ✅ **Class Management**: Create and manage classes
- ✅ **Fee Management**: Manage fee records and payments
- ✅ **Dormitory Management**: Manage dormitory assignments
- ✅ **Store Management**: Manage inventory and store items
- ✅ **Records Management**: Access all system records
- ✅ **Settings**: System configuration and settings

## Troubleshooting

### Issue: Cannot login with default credentials

**Solutions:**
1. Verify the user exists in Supabase Auth
2. Check if the user profile exists in the `users` table
3. Verify the role is set to `admin` (not `administrator`)
4. Check Supabase logs for authentication errors

### Issue: Admin account not showing in users table

**Solution:**
1. Check if the database trigger is working
2. Manually create the profile using the SQL above
3. Verify RLS policies allow the profile creation

### Issue: Wrong role assigned

**Solution:**
```sql
-- Update the role
UPDATE users 
SET role = 'admin' 
WHERE email = 'admin@kabaleparents.com';
```

## Creating Additional Admin Accounts

To create additional admin accounts:

1. **Via Supabase Dashboard** (Recommended):
   - Go to **Authentication** → **Users** → **Add User**
   - Set role in metadata: `"role": "admin"`
   - The trigger will create the profile

2. **Via SQL** (After creating auth user):
   ```sql
   INSERT INTO users (id, email, first_name, last_name, role)
   VALUES (
     '<auth-user-id>',
     'newadmin@kabaleparents.com',
     'New',
     'Admin',
     'admin'
   );
   ```

**Note**: Admin accounts cannot be created through the public registration form (`/signup`). They must be created manually by existing administrators or through Supabase.

## Password Reset

If you need to reset the admin password:

1. **Via Supabase Dashboard**:
   - Go to **Authentication** → **Users**
   - Find the admin user
   - Click **Reset Password**
   - An email will be sent to reset the password

2. **Via SQL** (Service role only):
   ```sql
   -- This requires service role access
   UPDATE auth.users 
   SET encrypted_password = crypt('newpassword', gen_salt('bf'))
   WHERE email = 'admin@kabaleparents.com';
   ```

## Best Practices

1. ✅ **Change default password** immediately after setup
2. ✅ **Use unique email** for admin account
3. ✅ **Enable email verification** in Supabase settings
4. ✅ **Regular password updates** (every 90 days recommended)
5. ✅ **Monitor admin account activity** in Supabase logs
6. ✅ **Create backup admin accounts** for redundancy
7. ✅ **Document all admin accounts** and their purposes

---

**Last Updated**: 2024
**Default Credentials**: Change immediately after first use!

