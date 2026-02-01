'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { getCart, updateCartItemQuantity, removeFromCart } from '@/lib/cart'
import {
  calculateSubtotal,
  calculateTax,
  calculateTipAmount,
  calculateTotal,
} from '@/lib/cart-utils'
import { CartItem, MenuItem } from '@/lib/types'
import { Minus, Plus, Trash2, ShoppingBag } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { menuItems } from '@/lib/menu-data'
import MenuItemModal from '@/components/MenuItemModal'

export default function CartPage() {
  const router = useRouter()
  const [cart, setCart] = useState<CartItem[]>([])
  const [editingItem, setEditingItem] = useState<CartItem | null>(null)
  const [editingMenuItem, setEditingMenuItem] = useState<MenuItem | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [customerInfo, setCustomerInfo] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    tipPercent: 0,
    comments: '',
  })
  const [isProcessing, setIsProcessing] = useState(false)
  const [checkoutError, setCheckoutError] = useState<string | null>(null)

  useEffect(() => {
    const updateCart = () => {
      setCart(getCart())
    }
    
    // Initial load
    updateCart()
    
    // Listen for storage changes (when cart is updated from other tabs/pages)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'denver-kabob-cart') {
        updateCart()
      }
    }
    
    window.addEventListener('storage', handleStorageChange)
    
    // Also listen for custom cart update events
    const handleCartUpdate = () => {
      updateCart()
    }
    
    window.addEventListener('cartUpdated', handleCartUpdate)
    
    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('cartUpdated', handleCartUpdate)
    }
  }, [])

  const handleQuantityChange = (itemId: string, newQuantity: number) => {
    const updatedCart = updateCartItemQuantity(itemId, newQuantity)
    setCart(updatedCart)
  }

  const handleRemove = (itemId: string) => {
    const updatedCart = removeFromCart(itemId)
    setCart(updatedCart)
  }

  const getBaseItemId = (cartItem: CartItem) => {
    if (cartItem.base_item_id) return cartItem.base_item_id
    const [baseId] = cartItem.id.split('-')
    return baseId || cartItem.id
  }

  const handleEditItem = (cartItem: CartItem) => {
    const baseId = getBaseItemId(cartItem)
    const menuItem = menuItems.find((item) => item.id === baseId) || null
    const fallbackItem: MenuItem = {
      id: baseId,
      name: cartItem.name,
      description: '',
      price: cartItem.price,
      category: 'Sandwiches',
      image_url: cartItem.image_url,
    }
    setEditingMenuItem(menuItem || fallbackItem)
    setEditingItem(cartItem)
    setIsEditModalOpen(true)
  }

  const subtotal = calculateSubtotal(cart)
  const tax = calculateTax(subtotal)
  const tipAmount = calculateTipAmount(subtotal, customerInfo.tipPercent)
  const total = calculateTotal(subtotal, tax, tipAmount)

  const tipAmountForPercent = (percent: number) =>
    (subtotal * (percent / 100)).toFixed(2)

  const validatePhone = (phone: string): boolean => {
    const phoneDigits = phone.replace(/\D/g, '')
    return phoneDigits.length >= 10
  }

  const validateEmail = (email: string): boolean => {
    if (!email) return true // Email is optional
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const handleCheckout = async () => {
    if (cart.length === 0) {
      setCheckoutError('Your cart is empty')
      return
    }

    // Validate name
    if (!customerInfo.firstName.trim()) {
      setCheckoutError('Please enter your first name')
      return
    }
    if (!customerInfo.lastName.trim()) {
      setCheckoutError('Please enter your last name')
      return
    }

    // Validate phone
    if (!customerInfo.phone) {
      setCheckoutError('Please enter your phone number')
      return
    }

    if (!validatePhone(customerInfo.phone)) {
      setCheckoutError('Please enter a valid phone number (at least 10 digits)')
      return
    }

    // Validate email if provided
    if (customerInfo.email && !validateEmail(customerInfo.email)) {
      setCheckoutError('Please enter a valid email address')
      return
    }

    setIsProcessing(true)
    setCheckoutError(null)

    // Prepare customer payload
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

    // Save customer info to localStorage for order creation fallback
    try {
      localStorage.setItem('denver-kabob-cart', JSON.stringify(cart))
      localStorage.setItem('denver-kabob-customer-info', JSON.stringify(customerPayload))
      localStorage.setItem('denver-kabob-order-details', JSON.stringify(orderDetails))
    } catch (e) {
      console.error('Failed to save to localStorage:', e)
    }

    try {
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
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

      if (!sessionId) {
        throw new Error('No session ID received')
      }

      const { loadStripe } = await import('@stripe/stripe-js')
      const stripe = await loadStripe(
        process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
      )
      
      if (!stripe) {
        throw new Error('Failed to load Stripe')
      }

      const { error } = await stripe.redirectToCheckout({ sessionId })
      
      if (error) {
        throw new Error(error.message || 'Failed to redirect to checkout')
      }
    } catch (error: any) {
      console.error('Checkout error:', error)
      setCheckoutError(error.message || 'Failed to start checkout. Please try again.')
      setIsProcessing(false)
    }
  }

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-white pt-24 sm:pt-28 pb-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <ShoppingBag size={64} className="mx-auto text-gray-400 mb-6" />
          <h1 className="font-display text-4xl font-bold text-gray-900 mb-4">
            Your Cart is Empty
          </h1>
          <p className="text-lg text-gray-600 mb-8">
            Add some delicious items from our menu to get started!
          </p>
          <Link
            href="/menu"
            className="inline-flex items-center space-x-2 bg-black text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-800 transition-colors"
          >
            <span>Browse Menu</span>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="font-display text-4xl font-bold text-gray-900 mb-8">
          Your Cart
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-7 space-y-4 pb-24 lg:pb-0">
            {cart.map((item) => (
              <div
                key={item.id}
                className="bg-white border border-gray-200 rounded-lg p-3 sm:p-4 flex flex-col sm:flex-row gap-3 cursor-pointer hover:border-black transition-colors"
                onClick={() => handleEditItem(item)}
              >
                {item.image_url && (
                  <div className="relative w-full sm:w-36 h-36 flex-shrink-0 bg-gray-100 rounded-xl overflow-hidden">
                    <Image
                      src={item.image_url}
                      alt={item.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                )}
                <div className="flex-1">
                  <h3 className="font-display text-xl font-semibold text-gray-900 mb-2">
                    {item.name}
                  </h3>
                  
                  {/* Selected Options */}
                  {item.selectedOptions && item.selectedOptions.length > 0 && (
                    <div className="mb-2">
                      <p className="text-xs text-gray-500 mb-1">Options:</p>
                      <div className="flex flex-wrap gap-1">
                        {item.selectedOptions.map((option, idx) => (
                          <span key={idx} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                            {option}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Selected Add-ons */}
                  {item.selectedAddons && item.selectedAddons.length > 0 && (
                    <div className="mb-2">
                      <p className="text-xs text-gray-500 mb-1">Add-ons:</p>
                      <div className="space-y-1">
                        {item.selectedAddons.map((addon, idx) => (
                          <div key={idx} className="text-xs text-gray-700 flex justify-between">
                            <span>+ {addon.name}</span>
                            <span className="font-semibold">+${addon.price.toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between mt-4">
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleQuantityChange(item.id, item.quantity - 1)
                        }}
                        className="bg-gray-100 hover:bg-gray-200 text-gray-900 rounded-lg p-2 transition-colors"
                      >
                        <Minus size={18} />
                      </button>
                      <span className="font-semibold text-lg w-8 text-center">
                        {item.quantity}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleQuantityChange(item.id, item.quantity + 1)
                        }}
                        className="bg-gray-100 hover:bg-gray-200 text-gray-900 rounded-lg p-2 transition-colors"
                      >
                        <Plus size={18} />
                      </button>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleRemove(item.id)
                      }}
                      className="text-gray-600 hover:text-black transition-colors"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                  <p className="text-gray-900 font-bold text-lg mt-2">
                    ${(() => {
                      let itemTotal = item.price
                      if (item.selectedAddons && item.selectedAddons.length > 0) {
                        itemTotal += item.selectedAddons.reduce((sum, addon) => sum + addon.price, 0)
                      }
                      return (itemTotal * item.quantity).toFixed(2)
                    })()}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Order Summary */}
          <div className="hidden lg:block lg:col-span-5">
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="font-display text-2xl font-bold text-gray-900">
                      Checkout
                    </h2>
                    <p className="text-sm text-gray-600 mt-1">
                      Review totals and add your details.
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-gray-500">Total</div>
                    <div className="text-2xl font-bold text-gray-900">${total.toFixed(2)}</div>
                  </div>
                </div>
              </div>

              {/* No internal scroll; page scrolls normally */}
              <div className="p-6 pt-4 space-y-4">
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                  <h3 className="font-semibold text-gray-900 mb-3">Customer info</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        First name *
                      </label>
                      <input
                        type="text"
                        value={customerInfo.firstName}
                        onChange={(e) =>
                          setCustomerInfo({ ...customerInfo, firstName: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black bg-white"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Last name *
                      </label>
                      <input
                        type="text"
                        value={customerInfo.lastName}
                        onChange={(e) =>
                          setCustomerInfo({ ...customerInfo, lastName: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black bg-white"
                        required
                      />
                    </div>
                  </div>
                  <div className="mt-3">
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Phone *
                    </label>
                    <input
                      type="tel"
                      value={customerInfo.phone}
                      onChange={(e) =>
                        setCustomerInfo({ ...customerInfo, phone: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black bg-white"
                      required
                    />
                  </div>
                  <div className="mt-3">
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Email (optional)
                    </label>
                    <input
                      type="email"
                      value={customerInfo.email}
                      onChange={(e) =>
                        setCustomerInfo({ ...customerInfo, email: e.target.value })
                      }
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
                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                          Tip
                        </label>
                        <select
                          value={customerInfo.tipPercent}
                          onChange={(e) =>
                            setCustomerInfo({ ...customerInfo, tipPercent: Number(e.target.value) })
                          }
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
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Comments (optional)
                      </label>
                      <textarea
                        rows={3}
                        value={customerInfo.comments}
                        onChange={(e) =>
                          setCustomerInfo({ ...customerInfo, comments: e.target.value })
                        }
                        maxLength={400}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black bg-white"
                        placeholder="Notes for the kitchen"
                      />
                      <div className="mt-1 text-xs text-gray-500">
                        {customerInfo.comments.length}/400
                      </div>
                    </div>
                  </div>
                </details>
              </div>

              <div className="p-6 border-t border-gray-200 bg-white">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Subtotal</span>
                    <span>${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Tax</span>
                    <span>${tax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Tip</span>
                    <span>${tipAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg text-gray-900 pt-2 border-t border-gray-200">
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
                >
                  {isProcessing ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Processing...</span>
                    </>
                  ) : (
                    'Proceed to Checkout'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile bottom checkout bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur border-t border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div>
            <div className="text-xs text-gray-500">Total</div>
            <div className="text-lg font-bold text-gray-900">${total.toFixed(2)}</div>
          </div>
          <Link
            href="/checkout"
            className="flex-1 max-w-[260px] text-center bg-black text-white py-3 rounded-lg font-semibold hover:bg-gray-800 transition-colors"
          >
            Checkout
          </Link>
        </div>
      </div>

      <MenuItemModal
        item={editingMenuItem}
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false)
          setEditingItem(null)
          setEditingMenuItem(null)
        }}
        mode="edit"
        initialQuantity={editingItem?.quantity || 1}
        initialSelectedOptions={editingItem?.selectedOptions || []}
        initialSelectedAddons={editingItem?.selectedAddons || []}
        originalCartItemId={editingItem?.id}
      />
    </div>
  )
}
