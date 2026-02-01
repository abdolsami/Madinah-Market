# Setup Instructions

## Quick Start Guide

Follow these steps to get your Denver Kabob website up and running.

## Step 1: Supabase Setup

### 1.1 Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign up/login
2. Click "New Project"
3. Fill in:
   - **Name**: Denver Kabob (or your choice)
   - **Database Password**: Choose a strong password (save it!)
   - **Region**: Choose closest to you
4. Wait for project to be created (~2 minutes)

### 1.2 Set Up Database Schema

1. In your Supabase project, go to **SQL Editor**
2. Click **New Query**
3. Copy and paste the entire contents of `supabase-schema.sql`
4. Click **Run** (or press Ctrl+Enter)
5. Verify tables were created by going to **Table Editor**

### 1.3 Get API Keys

1. Go to **Settings** → **API**
2. Copy these values:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** key → `SUPABASE_SERVICE_ROLE_KEY` (keep secret!)

## Step 2: Stripe Setup

### 2.1 Create Stripe Account

1. Go to [stripe.com](https://stripe.com) and sign up/login
2. Complete account setup (use test mode for development)

### 2.2 Get API Keys

1. In Stripe Dashboard, go to **Developers** → **API keys**
2. Copy these values:
   - **Publishable key** → `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
   - **Secret key** → `STRIPE_SECRET_KEY` (keep secret!)

### 2.3 Set Up Webhook (For Production)

**For Production:**
1. In Stripe Dashboard, go to **Developers** → **Webhooks**
2. Click **Add endpoint**
3. Enter URL: `https://your-domain.com/api/webhook`
4. Select event: `checkout.session.completed`
5. Copy the **Signing secret** → `STRIPE_WEBHOOK_SECRET`

## Step 3: Environment Variables

1. Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

2. Open `.env.local` and fill in all values:

   ```env
   # Supabase
   NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

   # Stripe
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_51xxxxx...
   STRIPE_SECRET_KEY=sk_test_51xxxxx...
   STRIPE_WEBHOOK_SECRET=whsec_xxxxx...

   # Admin (optional)
   NEXT_PUBLIC_ADMIN_PASSWORD=admin123
   ```

## Step 4: Install and Run

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Run development server:**
   ```bash
   npm run dev
   ```

3. **Open browser:**
   ```
   https://your-domain.com
   ```

## Step 5: Test the Flow

### Test Shopping Cart
1. Go to `/menu`
2. Add items to cart
3. Go to `/cart`
4. Verify items appear

### Test Checkout (Use Stripe Test Cards)
1. In `/cart`, fill in customer info
2. Click "Proceed to Checkout"
3. Use Stripe test card: `4242 4242 4242 4242`
   - Expiry: Any future date
   - CVC: Any 3 digits
   - ZIP: Any 5 digits
4. Complete payment
5. Verify order appears in `/admin` dashboard

### Test Admin Dashboard
1. Go to `/admin`
2. Enter password (default: `admin123`)
3. View orders
4. Update order status

## Troubleshooting

### "Missing Supabase environment variables"
- Check that `.env.local` exists and has all Supabase variables
- Restart your dev server after adding env variables

### "Stripe checkout not working"
- Verify Stripe keys are correct
- Check browser console for errors
- Ensure you're using test mode keys for development

### "Orders not appearing in admin"
- Check webhook is set up correctly
- Verify `SUPABASE_SERVICE_ROLE_KEY` is set
- Check Supabase logs for errors

### "Database errors"
- Verify you ran `supabase-schema.sql` completely
- Check table names match in code
- Ensure RLS policies are enabled

## Next Steps

- Customize menu items in Supabase dashboard or `lib/menu-data.ts`
- Update restaurant info in `components/Footer.tsx`
- Change colors in `tailwind.config.ts`
- Deploy to Vercel or your preferred hosting

## Production Checklist

Before going live:

- [ ] Switch Stripe to live mode
- [ ] Update Stripe webhook to production URL
- [ ] Change admin password
- [ ] Review Supabase RLS policies
- [ ] Test full order flow end-to-end
- [ ] Set up error monitoring (e.g., Sentry)
- [ ] Configure custom domain
- [ ] Set up SSL certificate
- [ ] Test on mobile devices
- [ ] Review and update contact information
