# Madinah Market - Afghan Restaurant Website

A fully functional, production-ready restaurant website built with Next.js, Tailwind CSS, Supabase, and Stripe.

## Features

- 🏠 **Beautiful Home Page** - Hero section, featured dishes, and restaurant story
- 📋 **Interactive Menu** - Categorized menu items with images and descriptions
- 🛒 **Shopping Cart** - Persistent cart with localStorage
- 💳 **Stripe Checkout** - Secure payment processing
- 📦 **Order Management** - Real-time admin dashboard for order tracking
- 📱 **Fully Responsive** - Mobile-first design that works on all devices
- 🎨 **Afghan-Themed Design** - Beautiful color scheme with warm earth tones

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Payments**: Stripe
- **Icons**: Lucide React
- **Animations**: Framer Motion

## Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn
- A Supabase account (free tier works)
- A Stripe account (test mode is fine for development)

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd madinah-market
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Set up Supabase**

   a. Create a new project at [supabase.com](https://supabase.com)
   
   b. Go to SQL Editor and run the SQL from `supabase-schema.sql`
   
   c. Get your project URL and anon key from Settings > API
   
   d. (Optional) Get your service role key from Settings > API (keep this secret!)

4. **Set up Stripe**

   a. Create an account at [stripe.com](https://stripe.com)
   
   b. Get your API keys from Dashboard > Developers > API keys
   
   c. Set up a webhook endpoint:
      - Go to Developers > Webhooks
      - Add endpoint: `https://your-domain.com/api/webhook`
      - Select event: `checkout.session.completed`
      - Copy the webhook signing secret

5. **Configure environment variables**

   Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

   Fill in your values:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
   STRIPE_SECRET_KEY=sk_test_...
   STRIPE_WEBHOOK_SECRET=whsec_...
   
   NEXT_PUBLIC_ADMIN_PASSWORD=admin123
   ```

6. **Run the development server**
   ```bash
   npm run dev
   # or
   yarn dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
madinah-market/
├── app/                    # Next.js App Router pages
│   ├── api/               # API routes
│   │   ├── create-checkout-session/
│   │   ├── webhook/
│   │   └── orders/
│   ├── admin/             # Admin dashboard
│   ├── cart/              # Shopping cart page
│   ├── menu/              # Menu page
│   ├── order-confirmation/ # Order confirmation page
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Home page
│   └── globals.css        # Global styles
├── components/            # React components
│   ├── Navbar.tsx
│   └── Footer.tsx
├── lib/                   # Utility functions
│   ├── supabase.ts       # Supabase client
│   ├── stripe.ts         # Stripe client
│   ├── cart.ts           # Cart utilities
│   ├── types.ts          # TypeScript types
│   └── menu-data.ts      # Menu items data
├── supabase-schema.sql   # Database schema
└── README.md             # This file
```

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import your repository in [Vercel](https://vercel.com)
3. Add your environment variables in Vercel dashboard
4. Deploy!

### Stripe Webhook Setup for Production

1. In Stripe Dashboard, add a webhook endpoint pointing to:
   ```
   https://your-domain.com/api/webhook
   ```
2. Select the `checkout.session.completed` event
3. Copy the webhook signing secret to your environment variables

### Supabase RLS Policies

The included SQL schema sets up Row Level Security policies. For production:
- Review and adjust RLS policies based on your security needs
- Consider using the service role key only server-side
- Set up proper authentication if needed

## Customization

### Update Restaurant Information

- **Name**: Update in `app/layout.tsx` and `components/Footer.tsx`
- **Contact Info**: Update in `components/Footer.tsx`
- **Menu Items**: Edit `lib/menu-data.ts` or update via Supabase dashboard

### Change Colors

Edit `tailwind.config.ts` to modify the Afghan-themed color palette.

### Modify Tax Rate

Update the tax rate in `app/api/create-checkout-session/route.ts` (currently 8%).

## Admin Dashboard

Access the admin dashboard at `/admin`. Default password is `admin123` (or set via `NEXT_PUBLIC_ADMIN_PASSWORD`).

The dashboard allows you to:
- View all orders in real-time
- Update order status (Pending → Preparing → Ready → Completed)
- See customer information and order details

## Features in Detail

### Shopping Cart
- Persistent cart using localStorage
- Quantity controls
- Remove items
- Real-time total calculation

### Checkout Flow
1. Customer fills in name and phone (email optional)
2. Redirects to Stripe Checkout
3. After payment, webhook creates order in Supabase
4. Customer sees confirmation page

### Order Management
- Orders automatically appear in admin dashboard
- Status updates in real-time (refreshes every 5 seconds)
- Order history with full details

## Support

For issues or questions, please open an issue on GitHub.

## License

This project is open source and available under the MIT License.
