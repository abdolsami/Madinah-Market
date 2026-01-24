-- Migration: Add order detail fields to orders table
-- Run this in your Supabase SQL editor

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS customer_first_name TEXT,
  ADD COLUMN IF NOT EXISTS customer_last_name TEXT,
  ADD COLUMN IF NOT EXISTS order_type TEXT CHECK (order_type IN ('pickup', 'delivery')),
  ADD COLUMN IF NOT EXISTS time_choice TEXT CHECK (time_choice IN ('asap', 'scheduled')),
  ADD COLUMN IF NOT EXISTS scheduled_time TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS payment_method TEXT,
  ADD COLUMN IF NOT EXISTS tip_percent DECIMAL(5, 2),
  ADD COLUMN IF NOT EXISTS tip_amount DECIMAL(10, 2),
  ADD COLUMN IF NOT EXISTS comments TEXT;

CREATE INDEX IF NOT EXISTS idx_orders_order_type ON orders(order_type);
CREATE INDEX IF NOT EXISTS idx_orders_time_choice ON orders(time_choice);
