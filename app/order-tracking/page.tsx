'use client'

import { useState } from 'react'
import { Search, Phone, Hash, Clock, ChefHat, Package, CheckCircle, Loader2 } from 'lucide-react'
import { Order } from '@/lib/types'
import Link from 'next/link'

const statusConfig = {
  pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  preparing: { label: 'Preparing', color: 'bg-blue-100 text-blue-800', icon: ChefHat },
  ready: { label: 'Ready', color: 'bg-green-100 text-green-800', icon: Package },
  completed: { label: 'Completed', color: 'bg-gray-100 text-gray-800', icon: CheckCircle },
}

const formatCustomerName = (order: Order) => {
  const first = order.customer_first_name?.trim()
  const last = order.customer_last_name?.trim()
  if (first || last) return `${first || ''} ${last || ''}`.trim()
  return order.customer_name
}

const formatRequestedTime = (order: Order) => {
  if (order.time_choice === 'scheduled' && order.scheduled_time) {
    const parsed = new Date(order.scheduled_time)
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
    }
  }
  return 'As soon as possible'
}

export default function OrderTrackingPage() {
  const [searchType, setSearchType] = useState<'phone' | 'orderId'>('phone')
  const [searchValue, setSearchValue] = useState('')
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasSearched, setHasSearched] = useState(false)

  const handleSearch = async () => {
    if (!searchValue.trim()) {
      setError('Please enter a phone number or order ID')
      return
    }

    // Validate phone number format
    if (searchType === 'phone') {
      const phoneDigits = searchValue.replace(/\D/g, '')
      if (phoneDigits.length < 10) {
        setError('Please enter a valid phone number (at least 10 digits)')
        return
      }
    }

    setLoading(true)
    setError(null)
    setHasSearched(true)

    try {
      const param = searchType === 'phone' ? 'phone' : 'orderId'
      const response = await fetch(`/api/orders/lookup?${param}=${encodeURIComponent(searchValue)}`)
      
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to search for orders')
      }

      const data = await response.json()
      setOrders(data.orders || [])
      
      if (data.orders.length === 0) {
        setError('No orders found. Please check your phone number or order ID.')
      }
    } catch (err: any) {
      setError(err.message || 'Failed to search for orders')
      setOrders([])
    } finally {
      setLoading(false)
    }
  }

  const formatPhone = (phone: string) => {
    const cleaned = phone.replace(/\D/g, '')
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`
    }
    return phone
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="font-display text-4xl font-bold text-gray-900 mb-4">
            Track Your Order
          </h1>
          <p className="text-lg text-gray-600">
            Enter your phone number or order ID to view your order status
          </p>
        </div>

        {/* Search Form */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setSearchType('phone')
                  setSearchValue('')
                  setOrders([])
                  setError(null)
                  setHasSearched(false)
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                  searchType === 'phone'
                    ? 'bg-black text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Phone size={18} />
                Phone
              </button>
              <button
                onClick={() => {
                  setSearchType('orderId')
                  setSearchValue('')
                  setOrders([])
                  setError(null)
                  setHasSearched(false)
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                  searchType === 'orderId'
                    ? 'bg-black text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Hash size={18} />
                Order ID
              </button>
            </div>
          </div>

          <div className="flex gap-3">
            <input
              type={searchType === 'phone' ? 'tel' : 'text'}
              value={searchValue}
              onChange={(e) => {
                setSearchValue(e.target.value)
                setError(null)
              }}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              placeholder={
                searchType === 'phone'
                  ? 'Enter your phone number'
                  : 'Enter your order ID'
              }
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black bg-white"
            />
            <button
              onClick={handleSearch}
              disabled={loading}
              className="px-6 py-3 bg-black text-white rounded-lg font-semibold hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={18} />
                  <span>Searching...</span>
                </>
              ) : (
                <>
                  <Search size={18} />
                  <span>Search</span>
                </>
              )}
            </button>
          </div>

          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}
        </div>

        {/* Results */}
        {hasSearched && !loading && (
          <>
            {orders.length > 0 ? (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  {orders.length === 1 ? 'Your Order' : `Your Orders (${orders.length})`}
                </h2>
                {orders.map((order) => {
                  const StatusIcon = statusConfig[order.status].icon
                  return (
                    <div
                      key={order.id}
                      className="bg-white rounded-xl shadow-lg p-6 border border-gray-200"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
                        <div>
                          <h3 className="text-xl font-bold text-gray-900 mb-1">
                            Order #{(order as any).order_number || order.id.substring(0, 8)}
                          </h3>
                          <p className="text-sm text-gray-600">
                            Placed on {formatDate(order.created_at)}
                          </p>
                        </div>
                        <div className="mt-2 sm:mt-0">
                          <div
                            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg ${statusConfig[order.status].color}`}
                          >
                            <StatusIcon size={18} />
                            <span className="font-semibold">
                              {statusConfig[order.status].label}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="border-t border-gray-200 pt-4 mt-4">
                        <h4 className="font-semibold text-gray-900 mb-3">Order Items</h4>
                        <div className="space-y-2 mb-4">
                          {order.order_items?.map((item, idx) => (
                            <div
                              key={idx}
                              className="flex justify-between text-sm text-gray-700"
                            >
                              <span>
                                {item.quantity}x {item.menu_item_name}
                              </span>
                              <span className="font-semibold">
                                ${(item.price * item.quantity).toFixed(2)}
                              </span>
                            </div>
                          ))}
                        </div>
                        <div className="border-t border-gray-200 pt-3 space-y-1">
                          {(() => {
                            const tipAmount = typeof order.tip_amount === 'number' ? order.tip_amount : 0
                            const subtotal = order.total_amount - order.tax_amount - tipAmount
                            return (
                              <>
                                <div className="flex justify-between text-sm text-gray-600">
                                  <span>Subtotal</span>
                                  <span>${subtotal.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-sm text-gray-600">
                                  <span>Tax</span>
                                  <span>${order.tax_amount.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-sm text-gray-600">
                                  <span>Tip</span>
                                  <span>${tipAmount.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between font-bold text-lg text-gray-900 pt-2 border-t border-gray-200">
                                  <span>Total</span>
                                  <span>${order.total_amount.toFixed(2)}</span>
                                </div>
                              </>
                            )
                          })()}
                        </div>
                      </div>

                      <div className="border-t border-gray-200 pt-4 mt-4">
                        <p className="text-sm text-gray-600">
                          <strong>Customer:</strong> {formatCustomerName(order)}
                        </p>
                        <p className="text-sm text-gray-600">
                          <strong>Phone:</strong> {formatPhone(order.customer_phone)}
                        </p>
                        {order.customer_email && (
                          <p className="text-sm text-gray-600">
                            <strong>Email:</strong> {order.customer_email}
                          </p>
                        )}
                        <p className="text-sm text-gray-600">
                          <strong>Order type:</strong> {order.order_type || 'pickup'}
                        </p>
                        <p className="text-sm text-gray-600">
                          <strong>Requested time:</strong> {formatRequestedTime(order)}
                        </p>
                        <p className="text-sm text-gray-600">
                          <strong>Payment:</strong>{' '}
                          {order.payment_method === 'online' ? 'Pay online' : (order.payment_method || 'Pay online')}
                        </p>
                        {order.comments && (
                          <p className="text-sm text-gray-600">
                            <strong>Comments:</strong> {order.comments}
                          </p>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-lg p-8 text-center">
                <p className="text-lg text-gray-600">
                  No orders found. Please check your information and try again.
                </p>
              </div>
            )}
          </>
        )}

        {/* Help Section */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-semibold text-blue-900 mb-2">Need Help?</h3>
          <p className="text-sm text-blue-800 mb-4">
            If you're having trouble finding your order, please contact us directly.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <a
              href="tel:+17207630786"
              className="inline-flex items-center justify-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              <Phone size={18} />
              Call (720) 763-0786
            </a>
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 border-2 border-blue-600 text-blue-900 px-6 py-3 rounded-lg font-semibold hover:bg-blue-100 transition-colors"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
