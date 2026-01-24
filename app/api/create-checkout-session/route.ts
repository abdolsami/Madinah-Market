import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { getCart } from '@/lib/cart'

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY

if (!STRIPE_SECRET_KEY) {
  console.error('STRIPE_SECRET_KEY is not set')
}

const stripe = STRIPE_SECRET_KEY
  ? new Stripe(STRIPE_SECRET_KEY, {
      apiVersion: '2024-11-20.acacia',
    })
  : null

export async function POST(request: NextRequest) {
  try {
    if (!stripe) {
      return NextResponse.json(
        { error: 'Payment service is not configured. Please contact support.' },
        { status: 500 }
      )
    }

    const { items, customerInfo, orderDetails } = await request.json()

    // Validate payload structure first
    if (!items || items.length === 0) {
      return NextResponse.json(
        { error: 'Cart is empty' },
        { status: 400 }
      )
    }

    if (!customerInfo) {
      return NextResponse.json(
        { error: 'Customer information is required' },
        { status: 400 }
      )
    }

    // Normalize and validate customer info
    const customerFirstName = (customerInfo.firstName || '').trim()
    const customerLastName = (customerInfo.lastName || '').trim()
    const customerPhone = (customerInfo.phone || '').trim()
    const customerEmail = (customerInfo.email || '').trim()
    const normalizedCustomerName = `${customerFirstName} ${customerLastName}`.trim()

    if (!customerFirstName || !customerLastName) {
      return NextResponse.json(
        { error: 'Customer first and last name are required' },
        { status: 400 }
      )
    }

    if (!customerPhone) {
      return NextResponse.json(
        { error: 'Customer phone number is required' },
        { status: 400 }
      )
    }

    const normalizedOrderType = (orderDetails?.orderType || 'pickup').toString()
    const normalizedTimeChoice = (orderDetails?.timeChoice || 'asap').toString()
    const normalizedScheduledTime = orderDetails?.scheduledTime || ''
    const normalizedPaymentMethod = (orderDetails?.paymentMethod || 'online').toString()
    const normalizedTipPercent = Number(orderDetails?.tipPercent || 0)
    const normalizedComments = (orderDetails?.comments || '').toString()

    if (normalizedTimeChoice === 'scheduled' && !normalizedScheduledTime) {
      return NextResponse.json(
        { error: 'Scheduled time is required for scheduled orders' },
        { status: 400 }
      )
    }

    // Validate item structure
    for (const item of items) {
      if (!item.id || !item.name || typeof item.price !== 'number' || !item.quantity) {
        return NextResponse.json(
          { error: 'Invalid item data' },
          { status: 400 }
        )
      }
      if (item.price < 0 || item.quantity < 1) {
        return NextResponse.json(
          { error: 'Invalid item price or quantity' },
          { status: 400 }
        )
      }
    }

    // Calculate totals including addons
    const subtotal = items.reduce((sum: number, item: any) => {
      let itemPrice = item.price
      if (item.selectedAddons && item.selectedAddons.length > 0) {
        itemPrice += item.selectedAddons.reduce((addonSum: number, addon: any) => addonSum + addon.price, 0)
      }
      return sum + itemPrice * item.quantity
    }, 0)
    const TAX_RATE = 0.08 // 8% tax
    const tax = subtotal * TAX_RATE
    const calculatedTipAmount = Number(
      (typeof orderDetails?.tipAmount === 'number'
        ? orderDetails.tipAmount
        : (subtotal * normalizedTipPercent) / 100
      ).toFixed(2)
    )
    const total = subtotal + tax + calculatedTipAmount

    // Build line items including addons
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = []
    items.forEach((item: any) => {
      // Add main item
      lineItems.push({
        price_data: {
          currency: 'usd',
          product_data: {
            name: item.name,
            description: item.selectedOptions?.length > 0 
              ? `Options: ${item.selectedOptions.join(', ')}` 
              : undefined,
          },
          unit_amount: Math.round(item.price * 100),
        },
        quantity: item.quantity,
      })

      // Add addons as separate line items
      if (item.selectedAddons && item.selectedAddons.length > 0) {
        item.selectedAddons.forEach((addon: any) => {
          lineItems.push({
            price_data: {
              currency: 'usd',
              product_data: {
                name: `+ ${addon.name}`,
              },
              unit_amount: Math.round(addon.price * 100),
            },
            quantity: item.quantity,
          })
        })
      }
    })

    if (tax > 0) {
      lineItems.push({
        price_data: {
          currency: 'usd',
          product_data: {
            name: 'Sales Tax',
          },
          unit_amount: Math.round(tax * 100),
        },
        quantity: 1,
      })
    }

    if (calculatedTipAmount > 0) {
      lineItems.push({
        price_data: {
          currency: 'usd',
          product_data: {
            name: 'Tip',
          },
          unit_amount: Math.round(calculatedTipAmount * 100),
        },
        quantity: 1,
      })
    }

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `${request.nextUrl.origin}/order-confirmation?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${request.nextUrl.origin}/payment-cancel`,
      metadata: {
        customer_name: normalizedCustomerName,
        customer_first_name: customerFirstName,
        customer_last_name: customerLastName,
        customer_phone: customerPhone,
        customer_email: customerEmail,
        order_type: normalizedOrderType,
        time_choice: normalizedTimeChoice,
        scheduled_time: normalizedScheduledTime,
        payment_method: normalizedPaymentMethod,
        tip_percent: normalizedTipPercent.toFixed(2),
        tip_amount: calculatedTipAmount.toFixed(2),
        comments: normalizedComments,
        subtotal: subtotal.toFixed(2),
        tax: tax.toFixed(2),
        total: total.toFixed(2),
        items: JSON.stringify(items), // Includes selectedOptions and selectedAddons
      },
    })

    return NextResponse.json({ sessionId: session.id })
  } catch (error: any) {
    console.error('Error creating checkout session:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}
