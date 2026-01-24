'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { getCart, updateCartItemQuantity, removeFromCart } from '@/lib/cart'
import { 
  calculateSubtotal, 
  calculateTax, 
  calculateTipAmount, 
  calculateTotal,
  generateTimeSlots 
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
    orderType: 'pickup' as 'pickup' | 'delivery',
    timeChoice: 'asap' as 'asap' | 'scheduled',
    scheduledTime: '',
    paymentMethod: 'online' as 'online',
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
      if (e.key === 'madinah-market-cart') {
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

  const availableTimes = useMemo(() => generateTimeSlots(), [])

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

    // Validate order type
    if (!customerInfo.orderType) {
      setCheckoutError('Please select an order type')
      return
    }

    // Validate time choice
    if (customerInfo.timeChoice === 'scheduled' && !customerInfo.scheduledTime) {
      setCheckoutError('Please select an available time')
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
      orderType: customerInfo.orderType,
      timeChoice: customerInfo.timeChoice,
      scheduledTime: customerInfo.timeChoice === 'scheduled' ? customerInfo.scheduledTime : '',
      paymentMethod: customerInfo.paymentMethod,
      tipPercent: customerInfo.tipPercent,
      tipAmount,
      comments: customerInfo.comments.trim() || '',
    }

    // Save customer info to localStorage for order creation fallback
    try {
      localStorage.setItem('madinah-market-cart', JSON.stringify(cart))
      localStorage.setItem('madinah-market-customer-info', JSON.stringify(customerPayload))
      localStorage.setItem('madinah-market-order-details', JSON.stringify(orderDetails))
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
      <div className="min-h-screen bg-white py-12">
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {cart.map((item) => (
              <div
                key={item.id}
                className="bg-white border border-gray-200 rounded-lg p-6 flex flex-col sm:flex-row gap-4 cursor-pointer hover:border-black transition-colors"
                onClick={() => handleEditItem(item)}
              >
                {item.image_url && (
                  <div className="relative w-full sm:w-24 h-24 flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden">
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
          <div className="lg:col-span-1">
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 sticky top-24">
              <h2 className="font-display text-2xl font-bold text-gray-900 mb-6">
                Order Summary
              </h2>

              {/* Customer Info Form */}
              <div className="space-y-4 mb-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      First Name *
                    </label>
                    <input
                      type="text"
                      value={customerInfo.firstName}
                      onChange={(e) =>
                        setCustomerInfo({ ...customerInfo, firstName: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black bg-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Last Name *
                    </label>
                    <input
                      type="text"
                      value={customerInfo.lastName}
                      onChange={(e) =>
                        setCustomerInfo({ ...customerInfo, lastName: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black bg-white"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Phone *
                  </label>
                  <input
                    type="tel"
                    value={customerInfo.phone}
                    onChange={(e) =>
                      setCustomerInfo({ ...customerInfo, phone: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black bg-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Email (optional)
                  </label>
                  <input
                    type="email"
                    value={customerInfo.email}
                    onChange={(e) =>
                      setCustomerInfo({ ...customerInfo, email: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black bg-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Select order type *
                  </label>
                  <select
                    value={customerInfo.orderType}
                    onChange={(e) =>
                      setCustomerInfo({ ...customerInfo, orderType: e.target.value as 'pickup' | 'delivery' })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black bg-white"
                  >
                    <option value="pickup">Pickup</option>
                    <option value="delivery">Delivery</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Available time choice *
                  </label>
                  <div className="flex flex-col gap-2">
                    <label className="flex items-center gap-2 text-sm text-gray-700">
                      <input
                        type="radio"
                        name="timeChoice"
                        value="asap"
                        checked={customerInfo.timeChoice === 'asap'}
                        onChange={() =>
                          setCustomerInfo({ ...customerInfo, timeChoice: 'asap', scheduledTime: '' })
                        }
                      />
                      As soon as possible
                    </label>
                    <label className="flex items-center gap-2 text-sm text-gray-700">
                      <input
                        type="radio"
                        name="timeChoice"
                        value="scheduled"
                        checked={customerInfo.timeChoice === 'scheduled'}
                        onChange={() =>
                          setCustomerInfo({
                            ...customerInfo,
                            timeChoice: 'scheduled',
                            scheduledTime: availableTimes[0]?.value || '',
                          })
                        }
                      />
                      Schedule for later
                    </label>
                    {customerInfo.timeChoice === 'scheduled' && (
                      <select
                        value={customerInfo.scheduledTime}
                        onChange={(e) =>
                          setCustomerInfo({ ...customerInfo, scheduledTime: e.target.value })
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black bg-white"
                      >
                        {availableTimes.map((slot) => (
                          <option key={slot.value} value={slot.value}>
                            {slot.label}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Payment method
                  </label>
                  <select
                    value={customerInfo.paymentMethod}
                    onChange={(e) =>
                      setCustomerInfo({ ...customerInfo, paymentMethod: e.target.value as 'online' })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black bg-white"
                  >
                    <option value="online">Pay online</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Tips?
                  </label>
                  <select
                    value={customerInfo.tipPercent}
                    onChange={(e) =>
                      setCustomerInfo({ ...customerInfo, tipPercent: Number(e.target.value) })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black bg-white"
                  >
                    <option value={0}>0% (${tipAmountForPercent(0)})</option>
                    <option value={10}>10% (${tipAmountForPercent(10)})</option>
                    <option value={15}>15% (${tipAmountForPercent(15)})</option>
                    <option value={20}>20% (${tipAmountForPercent(20)})</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Comments (optional)
                  </label>
                  <textarea
                    rows={3}
                    value={customerInfo.comments}
                    onChange={(e) =>
                      setCustomerInfo({ ...customerInfo, comments: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black bg-white"
                    placeholder="Add notes for the kitchen"
                  />
                </div>
              </div>

              {/* Totals */}
              <div className="border-t border-gray-300 pt-4 space-y-2 mb-6">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Tax (8%)</span>
                  <span>${tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Tip</span>
                  <span>${tipAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-xl text-gray-900 pt-2 border-t border-gray-300">
                  <span>Total</span>
                  <span>${total.toFixed(2)}</span>
                </div>
              </div>

              {checkoutError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {checkoutError}
                </div>
              )}
              <button
                onClick={handleCheckout}
                disabled={isProcessing}
                className="w-full bg-black text-white py-4 rounded-lg font-semibold text-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
