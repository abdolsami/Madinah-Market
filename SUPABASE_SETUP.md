# Complete Supabase Setup Guide

This guide will walk you through setting up Supabase for your Denver Kabob restaurant website.

## Prerequisites

- A Supabase account (free tier works perfectly)
- Your project files ready

---

## Step 1: Create a Supabase Account & Project

### 1.1 Sign Up / Login

1. Go to [https://supabase.com](https://supabase.com)
2. Click **"Start your project"** or **"Sign In"** if you already have an account
3. Sign up with GitHub, Google, or email

### 1.2 Create New Project

1. Once logged in, click **"New Project"** button (top right)
2. Fill in the project details:
   - **Name**: `Denver Kabob` (or any name you prefer)
   - **Database Password**: 
     - ⚠️ **IMPORTANT**: Choose a strong password and **SAVE IT** somewhere safe
     - You'll need this if you ever want to connect directly to the database
     - Example: `MySecurePass123!@#`
   - **Region**: Choose the region closest to you (e.g., `US East`, `US West`, `Europe`)
   - **Pricing Plan**: Select **Free** (perfect for starting out)
3. Click **"Create new project"**
4. ⏳ Wait 1-2 minutes for your project to be provisioned

---

## Step 2: Set Up Database Schema

### 2.1 Open SQL Editor

1. In your Supabase project dashboard, look at the left sidebar
2. Click on **"SQL Editor"** (it has a `</>` icon)
3. Click **"New Query"** button

### 2.2 Run the Schema SQL

1. Open the `supabase-schema.sql` file from your project
2. **Copy ALL the contents** of that file (Ctrl+A, then Ctrl+C)
3. Paste it into the SQL Editor in Supabase
4. Click **"Run"** button (or press `Ctrl+Enter` / `Cmd+Enter`)

### 2.3 Verify Tables Were Created

1. In the left sidebar, click **"Table Editor"**
2. You should see three tables:
   - ✅ `menu_items`
   - ✅ `orders`
   - ✅ `order_items`
3. Click on `menu_items` - you should see 16 menu items already inserted!

**✅ Success!** Your database is now set up.

---

## Step 3: Get Your API Keys

### 3.1 Navigate to API Settings

1. In the left sidebar, click **"Settings"** (gear icon)
2. Click **"API"** under Project Settings

### 3.2 Copy Your Keys

You'll see several important values. Copy these:

#### Project URL
- **Label**: Project URL
- **Value**: Something like `https://xxxxxxxxxxxxx.supabase.co`
- **Copy this** → This is your `NEXT_PUBLIC_SUPABASE_URL`

#### API Keys Section

You'll see two keys:

1. **anon public** key
   - This is safe to use in client-side code
   - **Copy this** → This is your `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - Starts with `eyJhbGci...`

2. **service_role** key
   - ⚠️ **SECRET**: Never expose this in client-side code!
   - Click **"Reveal"** to see it
   - **Copy this** → This is your `SUPABASE_SERVICE_ROLE_KEY`
   - Also starts with `eyJhbGci...`

---

## Step 4: Add Keys to Your Project

### 4.1 Create Environment File

1. In your project root, create a file called `.env.local`
2. Copy the contents from `.env.example` if it exists, or create it fresh

### 4.2 Add Your Supabase Keys

Open `.env.local` and add your keys:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlvdXItcHJvamVjdC1pZCIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNjQxOTY5MjAwLCJleHAiOjE5NTc1NDU2MDB9.your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlvdXItcHJvamVjdC1pZCIsInJvbGUiOiJzZXJ2aWNlX3JvbGUiLCJpYXQiOjE2NDE5NjkyMDAsImV4cCI6MTk1NzU0NTYwMH0.your-service-role-key-here
```

**Replace the placeholder values with your actual keys!**

### 4.3 Important Notes

- ⚠️ **Never commit `.env.local` to git** (it's already in `.gitignore`)
- ✅ The `NEXT_PUBLIC_` prefix means these variables are exposed to the browser (safe for anon key)
- 🔒 The `SUPABASE_SERVICE_ROLE_KEY` should NOT have `NEXT_PUBLIC_` prefix (server-side only)

---

## Step 5: Verify Setup

### 5.1 Restart Your Dev Server

If your Next.js server is running:
1. Stop it (Ctrl+C)
2. Start it again: `npm run dev`

### 5.2 Test the Connection

1. Open your deployed site URL (e.g. `https://your-domain.com`)
2. Navigate to `/menu` - menu items should load
3. Try adding items to cart
4. Complete a test order (with Stripe test card)
5. Check `/admin` dashboard - orders should appear!

---

## Step 6: Understanding Your Database

### Tables Overview

#### `menu_items`
- Stores all your restaurant menu items
- Already populated with 16 items from your list
- You can edit these in Supabase Table Editor or via code

#### `orders`
- Stores customer orders
- Includes customer info, totals, and status
- Status can be: `pending`, `preparing`, `ready`, `completed`

#### `order_items`
- Stores individual items within each order
- Links to both `orders` and `menu_items`

### Viewing Data in Supabase

1. Go to **Table Editor** in Supabase dashboard
2. Click on any table to view/edit data
3. You can manually add/edit/delete records here

### Editing Menu Items

**Option 1: Via Supabase Dashboard**
1. Go to **Table Editor** → `menu_items`
2. Click on any row to edit
3. Click **"Save"**

**Option 2: Via Code**
- Edit `lib/menu-data.ts` and re-run the SQL insert statements

---

## Troubleshooting

### ❌ "Missing Supabase environment variables"

**Solution:**
1. Check that `.env.local` exists in your project root
2. Verify all three Supabase variables are present
3. Make sure there are no extra spaces or quotes
4. Restart your dev server after adding variables

### ❌ "Invalid API key" or "Unauthorized"

**Solution:**
1. Double-check you copied the entire key (they're very long)
2. Make sure you didn't add extra spaces
3. Verify you're using the correct key (anon vs service_role)
4. Check that `NEXT_PUBLIC_` prefix is only on URL and anon key

### ❌ "Table does not exist"

**Solution:**
1. Go back to SQL Editor
2. Re-run the `supabase-schema.sql` file
3. Check Table Editor to verify tables exist

### ❌ "Orders not saving to database"

**Solution:**
1. Check that `SUPABASE_SERVICE_ROLE_KEY` is set (without `NEXT_PUBLIC_` prefix)
2. Verify webhook is working (check Stripe logs)
3. Check Supabase logs: Go to **Logs** → **Postgres Logs** in Supabase dashboard

### ❌ "RLS Policy Error"

**Solution:**
1. The schema includes RLS policies
2. If you get permission errors, check:
   - Service role key is being used server-side
   - RLS policies are enabled (they should be from the SQL)

---

## Security Best Practices

### ✅ Do:
- Use `anon` key for client-side operations (it's safe)
- Use `service_role` key ONLY in server-side API routes
- Keep your `.env.local` file secret
- Use environment variables in production (Vercel, etc.)

### ❌ Don't:
- Commit `.env.local` to git
- Expose `service_role` key in client-side code
- Share your API keys publicly
- Use production keys in development

---

## Next Steps

Once Supabase is set up:

1. ✅ Set up Stripe (see `SETUP.md`)
2. ✅ Test the full order flow
3. ✅ Customize menu items if needed
4. ✅ Deploy to production

---

## Need Help?

- **Supabase Docs**: [https://supabase.com/docs](https://supabase.com/docs)
- **Supabase Discord**: [https://discord.supabase.com](https://discord.supabase.com)
- **Check Logs**: Supabase Dashboard → **Logs** section

---

## Quick Reference

**Where to find things in Supabase:**

- **SQL Editor**: Left sidebar → SQL Editor icon `</>`
- **Table Editor**: Left sidebar → Table Editor icon (table icon)
- **API Keys**: Settings (gear) → API
- **Database Password**: Settings → Database (if you need to reset)
- **Logs**: Left sidebar → Logs

**Your keys go here:**
- `.env.local` file in your project root
- Never commit this file to git!

---

That's it! Your Supabase setup is complete. 🎉
