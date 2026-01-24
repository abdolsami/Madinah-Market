-- Create menu_items table
CREATE TABLE IF NOT EXISTS menu_items (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  category TEXT NOT NULL,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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

-- Create order_items table
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  menu_item_id TEXT NOT NULL,
  menu_item_name TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);

-- Enable Row Level Security (RLS)
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Policy: menu_items are publicly readable
CREATE POLICY "menu_items are publicly readable" ON menu_items
  FOR SELECT USING (true);

-- Policy: orders can be read by authenticated users (adjust as needed)
-- For admin dashboard, you may want to use service role key instead
CREATE POLICY "orders are readable by service role" ON orders
  FOR SELECT USING (true);

CREATE POLICY "orders are insertable by service role" ON orders
  FOR INSERT WITH CHECK (true);

CREATE POLICY "orders are updatable by service role" ON orders
  FOR UPDATE USING (true);

-- Policy: order_items can be read by authenticated users
CREATE POLICY "order_items are readable by service role" ON order_items
  FOR SELECT USING (true);

CREATE POLICY "order_items are insertable by service role" ON order_items
  FOR INSERT WITH CHECK (true);

-- Insert menu items (you can modify these or insert via Supabase dashboard)
INSERT INTO menu_items (id, name, description, price, category, image_url) VALUES
  ('1', '#1 Gyro Sandwich', 'Tender gyro meat wrapped in warm pita bread with fresh vegetables and tzatziki sauce', 8.99, 'Sandwiches', 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=800&h=600&fit=crop'),
  ('2', '#2 Chicken Shawarma', 'Marinated chicken shawarma with garlic sauce, pickles, and fresh vegetables in pita', 8.99, 'Sandwiches', 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=800&h=600&fit=crop'),
  ('3', '#3 Falafel Sandwich', 'Crispy falafel balls with tahini sauce, fresh vegetables, and pickles in pita bread', 8.99, 'Sandwiches', 'https://images.unsplash.com/photo-1596797038530-2c107229654b?w=800&h=600&fit=crop'),
  ('4', '#4 Burger & Fries', 'Classic beef burger with lettuce, tomato, onion, and special sauce, served with crispy fries', 11.75, 'Sandwiches', 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&h=600&fit=crop'),
  ('5', '#5 Combo Plate (Chicken Shawarma & Gyros)', 'A combination of our delicious chicken shawarma and gyro meat served with rice and salad', 11.75, 'Combo Plates', 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&h=600&fit=crop'),
  ('6', '#6 Chicken Shawarma Over Rice', 'Tender marinated chicken shawarma served over fragrant basmati rice with garlic sauce', 11.75, 'Rice Dishes', 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=800&h=600&fit=crop'),
  ('7', '#7 Gyros Over Rice', 'Seasoned gyro meat served over basmati rice with tzatziki sauce and fresh vegetables', 11.75, 'Rice Dishes', 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&h=600&fit=crop'),
  ('8', '#8 Chicken Biryani', 'Fragrant basmati rice cooked with tender chicken, aromatic spices, and herbs', 11.75, 'Rice Dishes', 'https://images.unsplash.com/photo-1631452180519-c014fe4bc3c5?w=800&h=600&fit=crop'),
  ('9', '#9 Kobideh Kabob', 'Traditional Afghan ground beef kabob, marinated and grilled to perfection', 8.99, 'Kabobs', 'https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?w=800&h=600&fit=crop'),
  ('10', '#10 8 PC Chicken Nugget & Fries', 'Eight crispy chicken nuggets served with golden french fries and your choice of dipping sauce', 11.75, 'Appetizers', 'https://images.unsplash.com/photo-1527477396000-e27137b9250d?w=800&h=600&fit=crop'),
  ('11', '#11 Chicken Tikka', 'Tender chicken pieces marinated in yogurt and spices, grilled to perfection', 13.75, 'Kabobs', 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=800&h=600&fit=crop'),
  ('12', '#12 Lamb Shank Over Rice', 'Slow-cooked tender lamb shank served over basmati rice with aromatic spices', 11.75, 'Rice Dishes', 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&h=600&fit=crop'),
  ('13', '#13 Sultani Kabob', 'A combination of tender filet mignon and juicy chicken breast, grilled to perfection', 11.75, 'Kabobs', 'https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?w=800&h=600&fit=crop'),
  ('14', '#14 Falafel Over Rice', 'Crispy falafel served over basmati rice with tahini sauce and fresh vegetables', 11.75, 'Rice Dishes', 'https://images.unsplash.com/photo-1596797038530-2c107229654b?w=800&h=600&fit=crop'),
  ('15', '#15 Fish Over Rice', 'Grilled fish fillet served over basmati rice with lemon and herbs', 8.99, 'Rice Dishes', 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&h=600&fit=crop'),
  ('16', '#16 Chicken Wings & Fries', 'Crispy chicken wings tossed in your choice of sauce, served with golden french fries', 11.75, 'Appetizers', 'https://images.unsplash.com/photo-1527477396000-e27137b9250d?w=800&h=600&fit=crop')
ON CONFLICT (id) DO NOTHING;
