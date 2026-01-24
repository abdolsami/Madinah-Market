import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createServerClient } from '@/lib/supabase'

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

if (!STRIPE_SECRET_KEY || !webhookSecret) {
  console.error('Missing Stripe configuration: STRIPE_SECRET_KEY or STRIPE_WEBHOOK_SECRET')
}

const stripe = STRIPE_SECRET_KEY
  ? new Stripe(STRIPE_SECRET_KEY, {
      apiVersion: '2024-11-20.acacia',
    })
  : null

export async function POST(request: NextRequest) {
  if (!stripe || !webhookSecret) {
    console.error('Stripe webhook not configured')
    return NextResponse.json(
      { error: 'Webhook not configured' },
      { status: 500 }
    )
  }

  const body = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json(
      { error: 'Missing signature' },
      { status: 400 }
    )
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session

    try {
      const supabase = createServerClient()

      // Extract order data from session metadata
      const {
        customer_name,
        customer_first_name,
        customer_last_name,
        customer_phone,
        customer_email,
        order_type,
        time_choice,
        scheduled_time,
        payment_method,
        tip_percent,
        tip_amount,
        comments,
        subtotal,
        tax,
        total,
        items,
      } = session.metadata || {}

      if (!customer_name || !customer_phone || !items) {
        throw new Error('Missing required order metadata')
      }

      // Use provided names or derive from full name
      const nameParts = customer_name.split(' ').filter(Boolean)
      const derivedFirstName = customer_first_name || nameParts[0] || customer_name
      const derivedLastName = customer_last_name || nameParts.slice(1).join(' ') || null

      const orderItems = JSON.parse(items)

      const isMissingColumnError = (message?: string) => {
        if (!message) return false
        const normalized = message.toLowerCase()
        return (
          (normalized.includes('column') && normalized.includes('does not exist')) ||
          normalized.includes('could not find') ||
          normalized.includes('schema cache')
        )
      }

      // Check if order with this session ID already exists (prevent duplicates)
      let orderNumberColumnMissing = false
      let existingOrder: { id: string; order_number?: number | null } | null = null

      const existingOrderResult = await supabase
        .from('orders')
        .select('id, order_number')
        .eq('stripe_session_id', session.id)
        .single()

      if (existingOrderResult.error) {
        if (isMissingColumnError(existingOrderResult.error.message)) {
          orderNumberColumnMissing = true
          const fallbackExistingOrderResult = await supabase
            .from('orders')
            .select('id')
            .eq('stripe_session_id', session.id)
            .maybeSingle()
          existingOrder = (fallbackExistingOrderResult.data as any) || null
        } else if (existingOrderResult.error.code !== 'PGRST116') {
          console.error('Error checking existing order:', existingOrderResult.error)
        }
      } else {
        existingOrder = existingOrderResult.data as any
      }

      if (existingOrder) {
        console.log('Order already exists for session:', session.id)
        return NextResponse.json({ received: true, message: 'Order already processed' })
      }

      // Get the next order number (if column exists)
      let nextOrderNumber: number | null = null
      if (!orderNumberColumnMissing) {
        const lastOrderResult = await supabase
          .from('orders')
          .select('order_number')
          .order('order_number', { ascending: false })
          .limit(1)
          .maybeSingle()

        if (lastOrderResult.error) {
          if (isMissingColumnError(lastOrderResult.error.message)) {
            orderNumberColumnMissing = true
          } else {
            console.error('Error getting last order number:', lastOrderResult.error)
          }
        } else {
          nextOrderNumber = lastOrderResult.data?.order_number
            ? (lastOrderResult.data.order_number as number) + 1
            : 1000 // Start from 1000
        }
      }

      // Create order in Supabase
      const parsedScheduledTime = scheduled_time && !Number.isNaN(Date.parse(scheduled_time))
        ? new Date(scheduled_time).toISOString()
        : null
      const parsedTipPercent = tip_percent !== undefined && tip_percent !== null && tip_percent !== ''
        ? parseFloat(tip_percent)
        : null
      const parsedTipAmount = tip_amount !== undefined && tip_amount !== null && tip_amount !== ''
        ? parseFloat(tip_amount)
        : null

      const fullInsertPayload = {
        customer_name,
        customer_first_name: derivedFirstName,
        customer_last_name: derivedLastName,
        customer_phone,
        customer_email: customer_email || null,
        order_type: order_type || null,
        time_choice: time_choice || null,
        scheduled_time: parsedScheduledTime,
        payment_method: payment_method || null,
        tip_percent: parsedTipPercent,
        tip_amount: parsedTipAmount,
        comments: comments || null,
        total_amount: parseFloat(total || '0'),
        tax_amount: parseFloat(tax || '0'),
        status: 'pending',
        stripe_session_id: session.id,
      }

      const orderNumberPayload = orderNumberColumnMissing || !nextOrderNumber
        ? {}
        : { order_number: nextOrderNumber }

      const minimalInsertPayload = {
        customer_name,
        customer_phone,
        customer_email: customer_email || null,
        total_amount: parseFloat(total || '0'),
        tax_amount: parseFloat(tax || '0'),
        status: 'pending',
        stripe_session_id: session.id,
      }

      const insertWithNumber = !orderNumberColumnMissing && nextOrderNumber !== null

      let insertResult = await supabase
        .from('orders')
        .insert(insertWithNumber ? { ...fullInsertPayload, ...orderNumberPayload } : fullInsertPayload)
        .select()
        .single()

      if (insertResult.error && isMissingColumnError(insertResult.error.message)) {
        console.warn('Webhook order insert retrying without new columns:', insertResult.error.message)
        insertResult = await supabase
          .from('orders')
          .insert(insertWithNumber ? { ...minimalInsertPayload, ...orderNumberPayload } : minimalInsertPayload)
          .select()
          .single()
      }

      const { data: order, error: orderError } = insertResult

      if (orderError) {
        throw orderError
      }

      // Create order items with options and addons
      const orderItemsData = orderItems.flatMap((item: any) => {
        // Build item name with options
        let itemName = item.name
        if (item.selectedOptions && item.selectedOptions.length > 0) {
          itemName += ` (${item.selectedOptions.join(', ')})`
        }
        
        const items = []
        
        // Main item
        items.push({
          order_id: order.id,
          menu_item_id: item.id,
          menu_item_name: itemName,
          quantity: item.quantity,
          price: item.price,
        })
        
        // Add addons as separate line items
        if (item.selectedAddons && item.selectedAddons.length > 0) {
          item.selectedAddons.forEach((addon: any) => {
            items.push({
              order_id: order.id,
              menu_item_id: `${item.id}-addon-${addon.name}`,
              menu_item_name: `+ ${addon.name}`,
              quantity: item.quantity,
              price: addon.price,
            })
          })
        }
        
        return items
      })

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItemsData)

      if (itemsError) {
        throw itemsError
      }

      console.log('Order created successfully:', order.id)
    } catch (error: any) {
      console.error('Error processing webhook:', error)
      return NextResponse.json(
        { error: 'Failed to process order' },
        { status: 500 }
      )
    }
  }

  return NextResponse.json({ received: true })
}
