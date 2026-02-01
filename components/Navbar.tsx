'use client'

import Link from 'next/link'
import { ShoppingCart, Menu, X } from 'lucide-react'
import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { getCartItemCount } from '@/lib/cart'
import Image from 'next/image'

type LogoMode = 'expanded' | 'compact' | 'hidden'

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const [cartCount, setCartCount] = useState(0)
  const [isMounted, setIsMounted] = useState(false)
  const [logoMode, setLogoMode] = useState<LogoMode>('expanded')

  useEffect(() => {
    const updateCartCount = () => {
      const { getCart } = require('@/lib/cart')
      const cart = getCart()
      setCartCount(getCartItemCount(cart))
    }

    updateCartCount()
    
    // Listen for cart updates
    const handleCartUpdate = () => {
      updateCartCount()
    }
    
    // Poll every 2 seconds as fallback
    const interval = setInterval(updateCartCount, 2000)
    
    window.addEventListener('cartUpdated', handleCartUpdate)
    window.addEventListener('storage', handleCartUpdate)
    
    return () => {
      clearInterval(interval)
      window.removeEventListener('cartUpdated', handleCartUpdate)
      window.removeEventListener('storage', handleCartUpdate)
    }
  }, [])

  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Logo behavior:
  // - Top of page: big + hangs below navbar
  // - Scrolling down (while not at top): hide
  // - Scrolling up (while down the page): show compact logo inside navbar
  useEffect(() => {
    if (typeof window === 'undefined') return

    let lastY = window.scrollY
    let ticking = false

    const onScroll = () => {
      if (ticking) return
      ticking = true

      window.requestAnimationFrame(() => {
        const y = window.scrollY
        const atTop = y <= 20

        if (atTop) {
          setLogoMode('expanded')
        } else {
          const delta = y - lastY
          if (delta > 6) {
            setLogoMode('hidden')
          } else if (delta < -6) {
            setLogoMode('compact')
          }
        }

        lastY = y
        ticking = false
      })
    }

    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    if (!isOpen) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false)
    }
    window.addEventListener('keydown', onKeyDown)
    // Prevent background scroll while drawer is open (reference-counted, safe with modals)
    const body = document.body
    const prevCount = Number(body.dataset.scrollLockCount || '0')
    const nextCount = prevCount + 1
    body.dataset.scrollLockCount = String(nextCount)
    if (prevCount === 0) {
      body.dataset.scrollLockPrevOverflow = body.style.overflow || ''
      body.style.overflow = 'hidden'
    }
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      const current = Number(body.dataset.scrollLockCount || '1')
      const updated = Math.max(0, current - 1)
      body.dataset.scrollLockCount = String(updated)
      if (updated === 0) {
        body.style.overflow = body.dataset.scrollLockPrevOverflow || ''
        delete body.dataset.scrollLockPrevOverflow
        delete body.dataset.scrollLockCount
      }
    }
  }, [isOpen])

  const drawer = (
    <div
      className={`md:hidden fixed inset-0 z-[9999] ${isOpen ? '' : 'pointer-events-none'}`}
      role="dialog"
      aria-modal="true"
      aria-label="Mobile navigation"
    >
      {/* Backdrop (dims the entire page) */}
      <div
        className={`fixed inset-0 bg-black/60 transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={() => setIsOpen(false)}
        aria-hidden="true"
      />

      {/* Drawer panel */}
      <div
        className={`fixed right-0 top-0 h-[100dvh] w-80 max-w-[85vw] bg-white shadow-2xl transform transition-transform duration-300 ease-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="h-20 px-4 flex items-center justify-between border-b border-gray-200">
          <span className="font-display text-lg font-bold text-gray-900">Menu</span>
          <button
            className="p-2 text-gray-700 hover:text-black transition-colors"
            onClick={() => setIsOpen(false)}
            aria-label="Close menu"
          >
            <X size={22} />
          </button>
        </div>

        <div className="p-4 space-y-3">
          <Link
            href="/"
            className="flex items-center justify-between rounded-xl px-4 py-3.5 bg-gray-50 border border-gray-200 text-gray-900 font-semibold hover:bg-gray-100 transition-colors"
            onClick={() => setIsOpen(false)}
          >
            <span>Home</span>
          </Link>
          <Link
            href="/menu"
            className="flex items-center justify-between rounded-xl px-4 py-3.5 bg-gray-50 border border-gray-200 text-gray-900 font-semibold hover:bg-gray-100 transition-colors"
            onClick={() => setIsOpen(false)}
          >
            <span>Menu</span>
          </Link>
          <Link
            href="/order-tracking"
            className="flex items-center justify-between rounded-xl px-4 py-3.5 bg-gray-50 border border-gray-200 text-gray-900 font-semibold hover:bg-gray-100 transition-colors"
            onClick={() => setIsOpen(false)}
          >
            <span>Track Order</span>
          </Link>

          <Link
            href="/cart"
            className="mt-2 flex items-center justify-between gap-3 bg-black text-white px-4 py-3 rounded-lg hover:bg-gray-800 transition-colors font-semibold"
            onClick={() => setIsOpen(false)}
          >
            <span className="flex items-center gap-2">
              <ShoppingCart size={18} />
              Cart
            </span>
            {cartCount > 0 && (
              <span className="bg-white/20 text-white text-xs font-bold rounded-full min-w-6 h-6 px-2 flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </Link>
        </div>
      </div>
    </div>
  )

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 backdrop-blur-sm bg-white/95">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative flex items-center h-20">
          {/* Left side: desktop nav / mobile menu button */}
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center space-x-8">
              <Link href="/" className="text-gray-700 hover:text-black transition-colors font-medium text-base relative group">
                Home
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-black group-hover:w-full transition-all duration-300"></span>
              </Link>
              <Link href="/menu" className="text-gray-700 hover:text-black transition-colors font-medium text-base relative group">
                Menu
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-black group-hover:w-full transition-all duration-300"></span>
              </Link>
              <Link href="/order-tracking" className="text-gray-700 hover:text-black transition-colors font-medium text-base relative group">
                Track Order
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-black group-hover:w-full transition-all duration-300"></span>
              </Link>
            </div>
          </div>

          {/* Center: logo */}
          <Link
            href="/"
            aria-label="Home"
            className={[
              'absolute left-1/2 -translate-x-1/2 flex items-center justify-center transition-all duration-300 ease-out',
              logoMode === 'hidden' ? 'opacity-0 -translate-y-2 pointer-events-none' : 'opacity-100',
              logoMode === 'expanded' ? 'top-1/2 -translate-y-1/2' : 'top-1/2 -translate-y-1/2',
            ].join(' ')}
          >
            <div
              className={[
                'relative transition-all duration-300 ease-out',
                // Big + hangs below navbar when at top
                logoMode === 'expanded' ? 'h-24 w-72 sm:w-[22rem] translate-y-7' : '',
                // Compact inside navbar when scrolling up
                logoMode === 'compact' ? 'h-12 w-52 sm:w-60 translate-y-0' : '',
                // Keep size consistent while hidden (avoid reflow when toggling)
                logoMode === 'hidden' ? 'h-12 w-52 sm:w-60 translate-y-0' : '',
              ].join(' ')}
            >
              <Image
                src="/images/denver-kabob-logo.webp"
                alt="Denver Kabob"
                fill
                priority
                sizes="(max-width: 640px) 288px, 352px"
                className="object-contain"
              />
            </div>
          </Link>

          {/* Right side: cart (desktop) + menu (mobile) */}
          <div className="ml-auto flex items-center gap-2">
            <button
              className="md:hidden relative p-2 text-gray-700 hover:text-black transition-colors"
              onClick={() => setIsOpen(true)}
              aria-label="Toggle menu"
            >
              <Menu size={24} />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-black text-white text-[10px] font-bold rounded-full min-w-5 h-5 px-1 flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </button>

            <Link
              href="/cart"
              className="hidden md:relative md:flex items-center space-x-2 bg-black text-white px-5 py-2.5 rounded-lg hover:bg-gray-800 transition-colors font-semibold"
            >
              <ShoppingCart size={18} />
              <span>Cart</span>
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-gray-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </Link>
          </div>
        </div>
      </div>

      {isMounted ? createPortal(drawer, document.body) : null}
    </nav>
  )
}
