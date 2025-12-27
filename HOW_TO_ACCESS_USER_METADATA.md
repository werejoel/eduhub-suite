# 📝 How to Access User Metadata in Supabase

## Step-by-Step Guide

### Method 1: When Creating a New User

1. **Go to Supabase Dashboard**
   - Navigate to your project
   - Click **Authentication** in the left sidebar
   - Click **Users** tab

2. **Click "Add User"**
   - You'll see a button in the top right: **"Add User"**
   - Click it and select **"Create new user"**

3. **Fill in Basic Information**
   - **Email**: Enter `admin@kabaleparents.com`
   - **Password**: Enter `admin123` (or your password)
   - **Auto Confirm User**: ✅ Check this box

4. **Find User Metadata Section**
   - Scroll down in the form
   - Look for a section labeled **"User Metadata"** or **"Raw User Meta Data"**
   - It might be collapsed by default - click to expand it

5. **Add Metadata**
   - You'll see a text field or JSON editor
   - If it's a text field, paste this JSON:
     ```json
     {"first_name":"Admin","last_name":"User","role":"admin"}
     ```
   - If it's a JSON editor, you can format it nicely:
     ```json
     {
       "first_name": "Admin",
       "last_name": "User",
       "role": "admin"
     }
     ```

6. **Create the User**
   - Click **"Create User"** button at the bottom

### Method 2: If User Metadata Field is Not Visible

Sometimes the User Metadata field might be hidden or in a different location:

1. **Look for "Raw App Meta Data" or "Raw User Meta Data"**
   - These are alternative names for the same field

2. **Check Advanced Options**
   - Some Supabase versions have an "Advanced" or "More Options" section
   - Click to expand it

3. **Alternative: Use the API**
   - If the UI doesn't show it, you can use the Supabase Management API
   - Or create the user first, then edit the metadata

### Method 3: Edit Metadata After User Creation

If you already created the user without metadata:

1. **Go to Users List**
   - Authentication → Users
   - Find the user `admin@kabaleparents.com`
   - Click on the user to open details

2. **Edit User**
   - Look for **"Edit User"** or **"Update User"** button
   - Or click the three dots (⋯) menu next to the user

3. **Add Metadata**
   - Find the **"User Metadata"** or **"Raw User Meta Data"** field
   - Add the JSON:
     ```json
     {
       "first_name": "Admin",
       "last_name": "User",
       "role": "admin"
     }
     ```

4. **Save Changes**
   - Click **"Update"** or **"Save"**

## Visual Guide

### The Form Should Look Like This:

```
┌─────────────────────────────────────────┐
│ Create new user                         │
├─────────────────────────────────────────┤
│ Email *                                  │
│ [admin@kabaleparents.com        ]       │
│                                         │
│ Password *                               │
│ [admin123                      ]        │
│                                         │
│ ☑ Auto Confirm User                     │
│                                         │
│ ▼ User Metadata (click to expand)      │
│ ┌─────────────────────────────────────┐ │
│ │ {                                   │ │
│ │   "first_name": "Admin",            │ │
│ │   "last_name": "User",              │ │
│ │   "role": "admin"                   │ │
│ │ }                                   │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ [Cancel]  [Create User]                 │
└─────────────────────────────────────────┘
```

## Troubleshooting

### Can't Find User Metadata Field

**Solution 1**: Try scrolling down - it might be below the fold

**Solution 2**: Look for these alternative names:
- "Raw User Meta Data"
- "Raw App Meta Data"
- "Metadata"
- "Custom Claims"

**Solution 3**: Check if you're using the correct Supabase version
- Some older versions might have it in a different location
- Try updating your Supabase project

**Solution 4**: Use the Supabase CLI or API
```bash
# Using Supabase CLI
supabase auth admin create-user \
  --email admin@kabaleparents.com \
  --password admin123 \
  --user-metadata '{"first_name":"Admin","last_name":"User","role":"admin"}'
```

### Metadata Field is Read-Only

**Solution**: You might need to use the Management API or edit the user after creation

### JSON Format Error

**Solution**: Make sure your JSON is valid:
- Use double quotes `"` not single quotes `'`
- No trailing commas
- Properly formatted

Valid JSON:
```json
{"first_name":"Admin","last_name":"User","role":"admin"}
```

Invalid JSON:
```json
{'first_name':'Admin','last_name':'User','role':'admin'}  // Wrong quotes
{"first_name":"Admin","last_name":"User","role":"admin",}  // Trailing comma
```

## Quick Copy-Paste JSON

Copy this exactly (no spaces needed):

```json
{"first_name":"Admin","last_name":"User","role":"admin"}
```

Or formatted version:

```json
{
  "first_name": "Admin",
  "last_name": "User",
  "role": "admin"
}
```

## Verify Metadata Was Added

After creating the user, verify the metadata:

1. Go to **Authentication → Users**
2. Click on the user `admin@kabaleparents.com`
3. Look at the user details
4. You should see the metadata in the **"User Metadata"** section

Or run this SQL query:

```sql
SELECT 
  id,
  email,
  raw_user_meta_data
FROM auth.users
WHERE email = 'admin@kabaleparents.com';
```

You should see:
```json
{
  "first_name": "Admin",
  "last_name": "User",
  "role": "admin"
}
```

---

**Still having trouble?** The metadata field is sometimes in different locations depending on your Supabase version. If you can't find it, you can create the user without metadata and the SQL script will still work - it will just use default values.

