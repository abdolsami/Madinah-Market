# Supabase Direct Integration for Android App

## Yes, we are using Supabase as the backend!

The Next.js API routes (`/api/orders`) are just wrappers around Supabase calls. You can bypass them and connect directly to Supabase for **faster, real-time updates** using Supabase Realtime subscriptions.

## Supabase Configuration

### Environment Variables Needed
```typescript
NEXT_PUBLIC_SUPABASE_URL=your-project-url.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

**Note**: Use the **anon key** (not service role) for the Android app. The RLS policies need to be updated to allow anon access.

## Database Schema

### Table: `orders`
```sql
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number INTEGER,  -- Numeric order number (1000, 1001, etc.)
  customer_name TEXT NOT NULL,
  customer_first_name TEXT,
  customer_last_name TEXT,
  customer_phone TEXT NOT NULL,
  customer_email TEXT,
  order_type TEXT CHECK (order_type IN ('pickup', 'delivery')),
  time_choice TEXT CHECK (time_choice IN ('asap', 'scheduled')),
  scheduled_time TIMESTAMP WITH TIME ZONE,
  payment_method TEXT,
  tip_percent DECIMAL(5, 2),
  tip_amount DECIMAL(10, 2),
  comments TEXT,
  total_amount DECIMAL(10, 2) NOT NULL,
  tax_amount DECIMAL(10, 2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'preparing', 'ready', 'completed')),
  stripe_session_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Important Fields:**
- `id`: UUID primary key
- `order_number`: INTEGER - Numeric order number (1000, 1001, etc.) - **REQUIRED for display**
- `status`: One of: 'pending', 'preparing', 'ready', 'completed'
- `created_at`: Timestamp for ordering

### Table: `order_items`
```sql
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  menu_item_id TEXT NOT NULL,
  menu_item_name TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Row Level Security (RLS) Policies

### Current Policies (Service Role - for server-side)
The current policies use "service role" which won't work for client-side. You need to update them for **anon key** access:

### Required RLS Policies for Android App (Anon Key)

```sql
-- Drop existing service role policies if they exist
DROP POLICY IF EXISTS "orders are readable by service role" ON orders;
DROP POLICY IF EXISTS "orders are insertable by service role" ON orders;
DROP POLICY IF EXISTS "orders are updatable by service role" ON orders;
DROP POLICY IF EXISTS "order_items are readable by service role" ON order_items;
DROP POLICY IF EXISTS "order_items are insertable by service role" ON order_items;

-- Allow anon key to read all orders (for admin dashboard)
CREATE POLICY "orders are readable by anon" ON orders
  FOR SELECT
  USING (true);

-- Allow anon key to update order status (for admin dashboard)
CREATE POLICY "orders are updatable by anon" ON orders
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Allow anon key to read order_items
CREATE POLICY "order_items are readable by anon" ON order_items
  FOR SELECT
  USING (true);

-- Note: INSERT should remain restricted (only server-side creates orders)
-- The Android app only needs SELECT and UPDATE permissions
```

## Operations

### 1. Fetch All Orders (with order_items)
```typescript
const { data: orders, error } = await supabase
  .from('orders')
  .select(`
    *,
    order_items (*)
  `)
  .order('created_at', { ascending: false })
```

### 2. Update Order Status
```typescript
// Direct UPDATE on orders table
const { data, error } = await supabase
  .from('orders')
  .update({ 
    status: 'preparing',  // or 'ready', 'completed'
    updated_at: new Date().toISOString()
  })
  .eq('id', orderId)
  .select()
  .single()
```

**Status Values:**
- `'pending'` - New order
- `'preparing'` - Being prepared
- `'ready'` - Ready for pickup
- `'completed'` - Order completed

### 3. Real-Time Subscriptions (RECOMMENDED for instant updates!)

```typescript
// Subscribe to new orders
const subscription = supabase
  .channel('orders')
  .on('postgres_changes', 
    { 
      event: 'INSERT', 
      schema: 'public', 
      table: 'orders' 
    }, 
    (payload) => {
      // New order inserted!
      const newOrder = payload.new as Order
      // Show full-screen alert immediately
      setShowNewOrderAlert(true)
      setNewOrderNumber(newOrder.order_number)
      playContinuousSound()
    }
  )
  .on('postgres_changes',
    {
      event: 'UPDATE',
      schema: 'public',
      table: 'orders'
    },
    (payload) => {
      // Order status updated
      const updatedOrder = payload.new as Order
      // Refresh orders list
      fetchOrders()
    }
  )
  .subscribe()

// Cleanup
return () => {
  subscription.unsubscribe()
}
```

**This is MUCH faster than polling!** Orders appear instantly when inserted.

## TypeScript Types for Supabase

```typescript
// Supabase Database Types
export interface Database {
  public: {
    Tables: {
      orders: {
        Row: {
          id: string
          order_number: number | null
          customer_name: string
          customer_first_name: string | null
          customer_last_name: string | null
          customer_phone: string
          customer_email: string | null
          order_type: 'pickup' | 'delivery' | null
          time_choice: 'asap' | 'scheduled' | null
          scheduled_time: string | null
          payment_method: string | null
          tip_percent: number | null
          tip_amount: number | null
          comments: string | null
          total_amount: number
          tax_amount: number
          status: 'pending' | 'preparing' | 'ready' | 'completed'
          stripe_session_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          order_number?: number | null
          customer_name: string
          customer_first_name?: string | null
          customer_last_name?: string | null
          customer_phone: string
          customer_email?: string | null
          order_type?: 'pickup' | 'delivery' | null
          time_choice?: 'asap' | 'scheduled' | null
          scheduled_time?: string | null
          payment_method?: string | null
          tip_percent?: number | null
          tip_amount?: number | null
          comments?: string | null
          total_amount: number
          tax_amount: number
          status?: 'pending' | 'preparing' | 'ready' | 'completed'
          stripe_session_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          order_number?: number | null
          customer_name?: string
          customer_phone?: string
          customer_email?: string | null
          total_amount?: number
          tax_amount?: number
          status?: 'pending' | 'preparing' | 'ready' | 'completed'
          stripe_session_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      order_items: {
        Row: {
          id: string
          order_id: string
          menu_item_id: string
          menu_item_name: string
          quantity: number
          price: number
          created_at: string
        }
        Insert: {
          id?: string
          order_id: string
          menu_item_id: string
          menu_item_name: string
          quantity: number
          price: number
          created_at?: string
        }
        Update: {
          id?: string
          order_id?: string
          menu_item_id?: string
          menu_item_name?: string
          quantity?: number
          price?: number
          created_at?: string
        }
      }
    }
  }
}
```

## Implementation Steps

1. **Update RLS Policies** - Run the SQL above in Supabase SQL Editor
2. **Use Supabase Client** - Initialize with anon key (not service role)
3. **Enable Realtime** - In Supabase Dashboard → Database → Replication, enable replication for `orders` table
4. **Subscribe to Changes** - Use Supabase Realtime subscriptions instead of polling
5. **Remove API_BASE_URL** - No longer needed!

## Benefits of Direct Supabase Integration

✅ **Instant Updates** - Real-time subscriptions mean orders appear immediately (no 2-3 second delay)
✅ **Faster** - No API middleware layer
✅ **Real-time Sync** - Multiple devices see updates instantly
✅ **Simpler** - One less dependency (no API server needed)
✅ **Better Performance** - Direct database connection

## React Native Supabase Setup

```typescript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'YOUR_SUPABASE_URL'
const supabaseAnonKey = 'YOUR_SUPABASE_ANON_KEY'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
})
```

## Migration from API to Direct Supabase

1. Replace all `/api/orders` calls with direct Supabase queries
2. Replace polling with Realtime subscriptions
3. Remove `API_BASE_URL` from environment variables
4. Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` to environment
5. Update RLS policies as shown above

---

**Recommendation**: Use Supabase Realtime subscriptions for **instant order notifications** - much better than polling!
