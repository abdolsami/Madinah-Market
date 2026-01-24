export interface MenuItem {
  id: string
  name: string
  description: string
  price: number
  category: 'Kabobs' | 'Rice Dishes' | 'Appetizers' | 'Drinks' | 'Desserts' | 'Sandwiches' | 'Combo Plates'
  image_url?: string
  created_at?: string
}

export interface CartItem {
  id: string
  base_item_id?: string
  name: string
  price: number
  quantity: number
  image_url?: string
  selectedOptions?: string[]
  selectedAddons?: Array<{ name: string; price: number }>
}

export interface Order {
  id: string
  order_number?: number
  customer_name: string
  customer_first_name?: string
  customer_last_name?: string
  customer_phone: string
  customer_email?: string
  order_type?: 'pickup' | 'delivery'
  time_choice?: 'asap' | 'scheduled'
  scheduled_time?: string | null
  payment_method?: string
  tip_percent?: number | null
  tip_amount?: number | null
  comments?: string | null
  total_amount: number
  tax_amount: number
  status: 'pending' | 'preparing' | 'ready' | 'completed'
  created_at: string
  order_items: OrderItem[]
}

export interface OrderItem {
  id: string
  order_id: string
  menu_item_id: string
  menu_item_name: string
  quantity: number
  price: number
}

export interface OrderFormData {
  firstName: string
  lastName: string
  phone: string
  email?: string
  orderType: 'pickup' | 'delivery'
  timeChoice: 'asap' | 'scheduled'
  scheduledTime?: string | null
  paymentMethod: 'online'
  tipPercent: number
  comments?: string
}
