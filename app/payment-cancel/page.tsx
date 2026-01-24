'use client'

import { X, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function PaymentCancelPage() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="max-w-md mx-auto text-center">
        <div className="mb-6">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <X className="text-red-600" size={48} />
          </div>
          <h1 className="font-display text-4xl font-bold text-gray-900 mb-4">
            Payment Canceled
          </h1>
          <p className="text-lg text-gray-600 mb-2">
            Your payment was not processed.
          </p>
          <p className="text-sm text-gray-500 mb-8">
            No charges were made to your card. Your cart has been saved and you can try again when ready.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/cart"
            className="inline-flex items-center justify-center gap-2 bg-black text-white px-8 py-3 rounded-lg font-semibold hover:bg-gray-800 transition-colors"
          >
            <ArrowLeft size={20} />
            Return to Cart
          </Link>
          <Link
            href="/menu"
            className="inline-flex items-center justify-center border-2 border-gray-300 text-gray-900 px-8 py-3 rounded-lg font-semibold hover:border-black transition-colors"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  )
}
