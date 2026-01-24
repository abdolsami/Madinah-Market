-- Migration: Add order_number column to orders table
-- Run this in your Supabase SQL editor

-- Add order_number column if it doesn't exist
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS order_number INTEGER;

-- Create index for order_number
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number DESC);

-- Set order_number for existing orders (starting from 1000)
DO $$
DECLARE
  order_rec RECORD;
  order_num INTEGER := 1000;
BEGIN
  FOR order_rec IN 
    SELECT id FROM orders ORDER BY created_at ASC
  LOOP
    UPDATE orders SET order_number = order_num WHERE id = order_rec.id;
    order_num := order_num + 1;
  END LOOP;
END $$;

-- Make order_number unique
CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_order_number_unique ON orders(order_number) 
WHERE order_number IS NOT NULL;
