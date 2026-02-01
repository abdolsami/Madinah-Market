'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { getCart } from '@/lib/cart'
import { calculateSubtotal, calculateTax, calculateTipAmount, calculateTotal } from '@/lib/cart-utils'
import { CartItem } from '@/lib/types'

type CustomerInfo = {
  firstName: string
  lastName: string
  phone: string
  email: string
  tipPercent: number
  comments: string
}

const DEFAULT_CUSTOMER: CustomerInfo = {
  firstName: '',
  lastName: '',
  phone: '',
  email: '',
  tipPercent: 0,
  comments: '',
}

export default function CheckoutPage() {
  const router = useRouter()
  const [cart, setCart] = useState<CartItem[]>([])
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>(DEFAULT_CUSTOMER)
  const [isProcessing, setIsProcessing] = useState(false)
  const [checkoutError, setCheckoutError] = useState<string | null>(null)

  useEffect(() => {
    const update = () => setCart(getCart())
    update()
    window.addEventListener('cartUpdated', update)
    window.addEventListener('storage', update)
    return () => {
      window.removeEventListener('cartUpdated', update)
      window.removeEventListener('storage', update)
    }
  }, [])

  useEffect(() => {
    try {
      const savedCustomer = localStorage.getItem('denver-kabob-customer-info')
      const savedDetails = localStorage.getItem('denver-kabob-order-details')
      const parsedCustomer = savedCustomer ? JSON.parse(savedCustomer) : null
      const parsedDetails = savedDetails ? JSON.parse(savedDetails) : null

      setCustomerInfo((prev) => ({
        ...prev,
        firstName: parsedCustomer?.firstName ?? prev.firstName,
        lastName: parsedCustomer?.lastName ?? prev.lastName,
        phone: parsedCustomer?.phone ?? prev.phone,
        email: parsedCustomer?.email ?? prev.email,
        tipPercent: typeof parsedDetails?.tipPercent === 'number' ? parsedDetails.tipPercent : prev.tipPercent,
        comments: typeof parsedDetails?.comments === 'string' ? parsedDetails.comments : prev.comments,
      }))
    } catch {
      // ignore
    }
  }, [])

  const subtotal = useMemo(() => calculateSubtotal(cart), [cart])
  const tax = useMemo(() => calculateTax(subtotal), [subtotal])
  const tipAmount = useMemo(
    () => calculateTipAmount(subtotal, customerInfo.tipPercent),
    [subtotal, customerInfo.tipPercent]
  )
  const total = useMemo(() => calculateTotal(subtotal, tax, tipAmount), [subtotal, tax, tipAmount])

  const tipAmountForPercent = (percent: number) => (subtotal * (percent / 100)).toFixed(2)

  const validatePhone = (phone: string): boolean => {
    const phoneDigits = phone.replace(/\D/g, '')
    return phoneDigits.length >= 10
  }

  const validateEmail = (email: string): boolean => {
    if (!email) return true
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const handleCheckout = async () => {
    if (cart.length === 0) {
      setCheckoutError('Your cart is empty')
      return
    }

    if (!customerInfo.firstName.trim()) {
      setCheckoutError('Please enter your first name')
      return
    }
    if (!customerInfo.lastName.trim()) {
      setCheckoutError('Please enter your last name')
      return
    }
    if (!customerInfo.phone.trim()) {
      setCheckoutError('Please enter your phone number')
      return
    }
    if (!validatePhone(customerInfo.phone)) {
      setCheckoutError('Please enter a valid phone number (at least 10 digits)')
      return
    }
    if (customerInfo.email && !validateEmail(customerInfo.email)) {
      setCheckoutError('Please enter a valid email address')
      return
    }

    setIsProcessing(true)
    setCheckoutError(null)

    const customerPayload = {
      firstName: customerInfo.firstName.trim(),
      lastName: customerInfo.lastName.trim(),
      name: `${customerInfo.firstName.trim()} ${customerInfo.lastName.trim()}`,
      phone: customerInfo.phone.trim(),
      email: customerInfo.email.trim(),
    }

    const orderDetails = {
      tipPercent: customerInfo.tipPercent,
      comments: customerInfo.comments.trim().slice(0, 400),
    }

    try {
      localStorage.setItem('denver-kabob-cart', JSON.stringify(cart))
      localStorage.setItem('denver-kabob-customer-info', JSON.stringify(customerPayload))
      localStorage.setItem('denver-kabob-order-details', JSON.stringify(orderDetails))
    } catch {
      // ignore
    }

    try {
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cart.map((item) => {
            let itemPrice = item.price
            if (item.selectedAddons && item.selectedAddons.length > 0) {
              itemPrice += item.selectedAddons.reduce((sum, addon) => sum + addon.price, 0)
            }
            return {
              id: item.id,
              name: item.name,
              price: itemPrice,
              quantity: item.quantity,
              selectedOptions: item.selectedOptions || [],
              selectedAddons: item.selectedAddons || [],
            }
          }),
          customerInfo: customerPayload,
          orderDetails,
        }),
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session')
      }
      const { sessionId } = data
      if (!sessionId) throw new Error('No session ID received')

      const { loadStripe } = await import('@stripe/stripe-js')
      const stripe = await loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)
      if (!stripe) throw new Error('Failed to load Stripe')

      const { error } = await stripe.redirectToCheckout({ sessionId })
      if (error) throw new Error(error.message || 'Failed to redirect to checkout')
    } catch (error: any) {
      console.error('Checkout error:', error)
      setCheckoutError(error.message || 'Failed to start checkout. Please try again.')
      setIsProcessing(false)
    }
  }

  return (
    <div className="min-h-screen bg-white py-8">
      <div className="max-w-xl mx-auto px-4">
        <div className="flex items-center justify-between gap-3 mb-6">
          <h1 className="font-display text-3xl font-bold text-gray-900">Checkout</h1>
          <button
            type="button"
            onClick={() => router.push('/cart')}
            className="bg-black text-white px-4 py-2 rounded-lg font-semibold text-sm hover:bg-gray-800 transition-colors"
          >
            Back
          </button>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
          <div className="p-5 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-gray-500">Total</div>
                <div className="text-2xl font-bold text-gray-900">${total.toFixed(2)}</div>
              </div>
              <div className="text-xs font-semibold text-gray-500 text-center">
                Secure checkout
              </div>
            </div>
          </div>

          <div className="p-5 space-y-4">
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
              <h2 className="font-semibold text-gray-900 mb-3">Customer info</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">First name *</label>
                  <input
                    type="text"
                    value={customerInfo.firstName}
                    onChange={(e) => setCustomerInfo({ ...customerInfo, firstName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Last name *</label>
                  <input
                    type="text"
                    value={customerInfo.lastName}
                    onChange={(e) => setCustomerInfo({ ...customerInfo, lastName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black bg-white"
                  />
                </div>
              </div>
              <div className="mt-3">
                <label className="block text-xs font-semibold text-gray-700 mb-1">Phone *</label>
                <input
                  type="tel"
                  value={customerInfo.phone}
                  onChange={(e) => setCustomerInfo({ ...customerInfo, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black bg-white"
                />
              </div>
              <div className="mt-3">
                <label className="block text-xs font-semibold text-gray-700 mb-1">Email (optional)</label>
                <input
                  type="email"
                  value={customerInfo.email}
                  onChange={(e) => setCustomerInfo({ ...customerInfo, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black bg-white"
                />
              </div>
            </div>

            <details className="group rounded-lg border border-gray-200 bg-gray-50">
              <summary className="cursor-pointer select-none px-4 py-3 flex items-center justify-between">
                <span className="font-semibold text-gray-900">Tip & notes</span>
                <span className="text-xs text-gray-500 group-open:hidden">Optional</span>
              </summary>
              <div className="px-4 pb-4 pt-1 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Tip</label>
                    <select
                      value={customerInfo.tipPercent}
                      onChange={(e) => setCustomerInfo({ ...customerInfo, tipPercent: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black bg-white"
                    >
                      <option value={0}>0% (${tipAmountForPercent(0)})</option>
                      <option value={10}>10% (${tipAmountForPercent(10)})</option>
                      <option value={15}>15% (${tipAmountForPercent(15)})</option>
                      <option value={20}>20% (${tipAmountForPercent(20)})</option>
                    </select>
                  </div>
                  <div className="bg-white border border-gray-200 rounded-lg px-3 py-2">
                    <div className="text-xs text-gray-500">Tip amount</div>
                    <div className="text-lg font-semibold text-gray-900">${tipAmount.toFixed(2)}</div>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Comments (optional)</label>
                  <textarea
                    rows={3}
                    value={customerInfo.comments}
                    onChange={(e) => setCustomerInfo({ ...customerInfo, comments: e.target.value })}
                    maxLength={400}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black bg-white"
                    placeholder="Notes for the kitchen"
                  />
                  <div className="mt-1 text-xs text-gray-500">{customerInfo.comments.length}/400</div>
                </div>
              </div>
            </details>
          </div>

          <div className="p-5 border-t border-gray-200 bg-white">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Tax</span>
                <span>${tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Tip</span>
                <span>${tipAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold text-gray-900 pt-2 border-t border-gray-200">
                <span>Total</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </div>

            {checkoutError && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {checkoutError}
              </div>
            )}

            <button
              onClick={handleCheckout}
              disabled={isProcessing}
              className="mt-4 w-full bg-black text-white py-4 rounded-lg font-semibold text-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              type="button"
            >
              {isProcessing ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                'Proceed to Payment'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

