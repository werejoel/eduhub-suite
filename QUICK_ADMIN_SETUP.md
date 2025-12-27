# 🚀 Quick Admin Setup Guide

## Step-by-Step Instructions

### Step 1: Create Auth User in Supabase Dashboard

1. **Go to Supabase Dashboard**
   - Navigate to your project
   - Click on **Authentication** in the left sidebar
   - Click on **Users** tab

2. **Create New User**
   - Click the **"Add User"** button (top right)
   - Select **"Create new user"**

3. **Fill in User Details**
   - **Email**: `admin@kabaleparents.com`
   - **Password**: `admin123` (or your preferred secure password)
   - **Auto Confirm User**: ✅ **Check this box** (very important!)

4. **Add User Metadata**
   - Scroll down to **"User Metadata"** section
   - Click on the JSON editor
   - Paste this JSON:
     ```json
     {
       "first_name": "Admin",
       "last_name": "User",
       "role": "admin"
     }
     ```

5. **Create the User**
   - Click **"Create User"** button
   - Wait a few seconds for the user to be created

### Step 2: Run the SQL Script

1. **Go to SQL Editor**
   - Click on **SQL Editor** in the left sidebar
   - Click **"New Query"**

2. **Run the Script**
   - Open the file `CREATE_DEFAULT_ADMIN.sql`
   - Copy the entire contents
   - Paste into the SQL Editor
   - Click **"Run"** (or press `Ctrl+Enter`)

3. **Check the Results**
   - You should see: `✅ SUCCESS: Admin profile created/updated successfully!`
   - If you see a warning, follow the instructions shown

### Step 3: Verify Admin Account

Run this query to verify:

```sql
SELECT 
  u.id,
  u.email,
  u.first_name,
  u.last_name,
  u.role,
  u.created_at
FROM public.users u
WHERE u.email = 'admin@kabaleparents.com' AND u.role = 'admin';
```

You should see one row with the admin account details.

### Step 4: Test Login

1. Go to your application login page
2. Enter:
   - **Email**: `admin@kabaleparents.com`
   - **Password**: `admin123`
3. You should be redirected to the admin dashboard

## Troubleshooting

### Error: "Auth user not found"

**Solution**: Make sure you completed Step 1 and created the auth user in the Dashboard first.

### Error: "Profile already exists"

**Solution**: This is fine! The profile was already created. You can proceed to login.

### Can't find "Add User" button

**Solution**: Make sure you're in the **Authentication → Users** section, not the Auth Providers section.

### User created but script still fails

**Solution**: 
1. Wait 10-15 seconds after creating the user
2. Refresh the SQL Editor page
3. Run the script again

## Security Reminder

⚠️ **IMPORTANT**: Change the default password (`admin123`) immediately after first login!

---

**Default Credentials:**
- Email: `admin@kabaleparents.com`
- Password: `admin123` (change this!)

