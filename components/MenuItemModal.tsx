'use client'

import { X, Plus, Minus } from 'lucide-react'
import { MenuItem } from '@/lib/types'
import { addToCart, getCart, replaceCartItem, updateCartItemQuantity } from '@/lib/cart'
import { useEffect, useState } from 'react'
import Image from 'next/image'

interface MenuItemModalProps {
  item: MenuItem | null
  isOpen: boolean
  onClose: () => void
  mode?: 'add' | 'edit'
  initialQuantity?: number
  initialSelectedOptions?: string[]
  initialSelectedAddons?: Array<{ name: string; price: number }>
  originalCartItemId?: string
}

interface AddonOption {
  id: string
  label: string
  price: number
}

interface FreeOption {
  id: string
  label: string
}

const EMPTY_STRING_ARRAY: string[] = []
const EMPTY_ADDON_ARRAY: Array<{ name: string; price: number }> = []

// Paid add-ons are intentionally limited to things that make sense for the current menu.
// (No chips, no sodas, no generic add-ons that don't apply to the item.)
const paidAddons: AddonOption[] = [
  { id: 'extra-rice', label: 'XTRA RICE', price: 1 },
  { id: 'extra-gyros', label: 'XTRA GYROS', price: 1 },
  { id: 'extra-chicken-shawarma', label: 'XTRA CHICKEN SHAWARMA', price: 1 },
  { id: 'extra-chicken-kabob', label: 'XTRA CHICKEN KABOB', price: 1 },
  { id: 'extra-kobideh', label: 'XTRA KOBIDEH KABOB (BEEF)', price: 1 },
  { id: 'extra-falafel', label: 'XTRA 3 PCS FALAFEL', price: 1 },
  { id: 'extra-lamb-kabob', label: 'XTRA LAMB KABOB', price: 1 },
]

const freeOptions: FreeOption[] = [
  { id: 'no-salad', label: 'NO SALAD' },
  { id: 'no-lettuce', label: 'NO LETTUCE' },
  { id: 'no-sauce', label: 'NO SAUCE' },
  { id: 'add-hot-sauce', label: 'ADD HOT SAUCE' },
  { id: 'extra-white-sauce', label: 'XTRA WHITE SAUCE' },
  { id: 'no-fries', label: 'No fries' },
]

const getPaidAddonsForItem = (item: MenuItem): AddonOption[] => {
  // Rice dishes can add extra rice, and only the matching protein add-on (when applicable).
  if (item.category === 'Rice Dishes') {
    const base: AddonOption[] = [paidAddons.find((a) => a.id === 'extra-rice')!]
    switch (item.id) {
      case 'gyro-rice':
        return [...base, paidAddons.find((a) => a.id === 'extra-gyros')!]
      case 'shawarma-rice':
        return [...base, paidAddons.find((a) => a.id === 'extra-chicken-shawarma')!]
      case 'chicken-kabob-rice':
        return [...base, paidAddons.find((a) => a.id === 'extra-chicken-kabob')!]
      case 'kobidah-kabob-rice':
        return [...base, paidAddons.find((a) => a.id === 'extra-kobideh')!]
      case 'lamb-kabob-rice':
        return [...base, paidAddons.find((a) => a.id === 'extra-lamb-kabob')!]
      // Lamb items: extra rice only (no generic "extra gyro/chicken" nonsense)
      case 'lamb-shank-rice':
      default:
        return base
    }
  }

  // Sandwiches: no extra meat options (per requirements).
  if (item.category === 'Sandwiches') return []

  // Appetizers: only falafel can add extra falafel. Wings/sambosa should not have unrelated extras.
  if (item.category === 'Appetizers') {
    if (item.id === 'falafel') return [paidAddons.find((a) => a.id === 'extra-falafel')!]
    return []
  }

  return []
}

const getFreeOptionsForItem = (item: MenuItem): FreeOption[] => {
  // Keep free options sensible per item type.
  if (item.category === 'Rice Dishes') {
    return freeOptions.filter((o) =>
      ['no-salad', 'no-sauce', 'add-hot-sauce', 'extra-white-sauce'].includes(o.id)
    )
  }
  if (item.category === 'Sandwiches') {
    return freeOptions.filter((o) =>
      ['no-lettuce', 'no-sauce', 'add-hot-sauce', 'extra-white-sauce'].includes(o.id)
    )
  }
  return []
}

export default function MenuItemModal({
  item,
  isOpen,
  onClose,
  mode = 'add',
  initialQuantity = 1,
  initialSelectedOptions = EMPTY_STRING_ARRAY,
  initialSelectedAddons = EMPTY_ADDON_ARRAY,
  originalCartItemId,
}: MenuItemModalProps) {
  const [quantity, setQuantity] = useState(1)
  const [selectedAddons, setSelectedAddons] = useState<Set<string>>(new Set())
  const [selectedFreeOptions, setSelectedFreeOptions] = useState<Set<string>>(new Set())
  const [selectedSambosaFilling, setSelectedSambosaFilling] = useState<'potato' | 'beef' | ''>('')
  const [isAdding, setIsAdding] = useState(false)

  const resetSelections = () => {
    setSelectedAddons(new Set())
    setSelectedFreeOptions(new Set())
    setSelectedSambosaFilling('')
  }

  // Reset state when modal closes
  const handleClose = () => {
    setQuantity(1)
    resetSelections()
    onClose()
  }

  // Lock background scroll while modal is open (mobile-friendly)
  useEffect(() => {
    if (!isOpen) return
    const body = document.body
    const prevCount = Number(body.dataset.scrollLockCount || '0')
    const nextCount = prevCount + 1
    body.dataset.scrollLockCount = String(nextCount)
    if (prevCount === 0) {
      body.dataset.scrollLockPrevOverflow = body.style.overflow || ''
      body.style.overflow = 'hidden'
    }
    return () => {
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

  useEffect(() => {
    if (!isOpen || !item) return

    setQuantity(initialQuantity || 1)

    // Sambosa filling is a single-select choice (potato OR beef).
    if (item.id === 'potato-or-beef-sambosa') {
      const hasPotato = initialSelectedOptions.some((opt) => opt.toLowerCase() === 'potato')
      const hasBeef = initialSelectedOptions.some((opt) => opt.toLowerCase() === 'beef')
      if (hasBeef) setSelectedSambosaFilling('beef')
      else if (hasPotato) setSelectedSambosaFilling('potato')
      else setSelectedSambosaFilling('potato') // default
    } else {
      setSelectedSambosaFilling('')
    }

    const allowedFree = getFreeOptionsForItem(item)
    const freeOptionIds = new Set<string>()
    initialSelectedOptions.forEach((label) => {
      const match = allowedFree.find((option) => option.label === label)
      if (match) freeOptionIds.add(match.id)
    })
    setSelectedFreeOptions(freeOptionIds)

    const allowedPaid = getPaidAddonsForItem(item)
    const addonIds = new Set<string>()
    initialSelectedAddons.forEach((addon) => {
      const paidMatch = allowedPaid.find((paid) => paid.label === addon.name)
      if (paidMatch) addonIds.add(paidMatch.id)
    })
    setSelectedAddons(addonIds)
    // Re-initialize only when opening or switching items
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, item?.id, originalCartItemId, initialQuantity])

  if (!isOpen || !item) return null

  const toggleAddon = (id: string) => {
    const newSet = new Set(selectedAddons)
    if (newSet.has(id)) {
      newSet.delete(id)
    } else {
      newSet.add(id)
    }
    setSelectedAddons(newSet)
  }

  const toggleFreeOption = (id: string) => {
    const newSet = new Set(selectedFreeOptions)
    if (newSet.has(id)) {
      newSet.delete(id)
    } else {
      newSet.add(id)
    }
    setSelectedFreeOptions(newSet)
  }

  const calculateTotal = () => {
    let addonTotal = 0
    selectedAddons.forEach((id) => {
      const addon = paidAddons.find((a) => a.id === id)
      if (addon) addonTotal += addon.price
    })

    return (item.price + addonTotal) * quantity
  }

  const getSelectedAddonsList = () => {
    const addons: Array<{ name: string; price: number }> = []
    selectedAddons.forEach((id) => {
      const addon = paidAddons.find((a) => a.id === id)
      if (addon) addons.push({ name: addon.label, price: addon.price })
    })
    return addons
  }

  const getSelectedOptionsList = () => {
    const options: string[] = []
    selectedFreeOptions.forEach((id) => {
      const option = freeOptions.find((o) => o.id === id)
      if (option) options.push(option.label)
    })
    if (item.id === 'potato-or-beef-sambosa') {
      if (selectedSambosaFilling === 'potato') options.push('Potato')
      if (selectedSambosaFilling === 'beef') options.push('Beef')
    }
    return options
  }

  const handleAddToCart = () => {
    setIsAdding(true)
    const addonsList = getSelectedAddonsList()
    const optionsList = getSelectedOptionsList()
    
    // Create unique ID based on item + options + addons (same combo = same ID)
    const optionsKey = optionsList.sort().join('|')
    const addonsKey = addonsList.map(a => a.name).sort().join('|')
    const uniqueId = `${item.id}-${optionsKey}-${addonsKey}`
    
    const cartItem = {
      id: uniqueId,
      base_item_id: item.id,
      name: item.name,
      price: item.price,
      image_url: item.image_url,
      selectedOptions: optionsList,
      selectedAddons: addonsList,
    }
    
    if (mode === 'edit' && originalCartItemId) {
      replaceCartItem(originalCartItemId, cartItem, quantity)
    } else {
      // Add item with quantity (cart.ts will handle incrementing if exists)
      const cart = getCart()
      const existingItem = cart.find(cartItem => cartItem.id === uniqueId)
      
      if (existingItem) {
        // Update quantity
        updateCartItemQuantity(uniqueId, existingItem.quantity + quantity)
      } else {
        // Add once, then set the desired quantity (avoids N repeated saves/events)
        addToCart(cartItem)
        updateCartItemQuantity(uniqueId, quantity)
      }
    }
    
    setTimeout(() => {
      setIsAdding(false)
      handleClose()
    }, 300)
  }

  const finalPrice = calculateTotal()

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop: click to close, blocks background interactions */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="relative h-full w-full flex items-center justify-center p-4">
        <div
          className="bg-white rounded-2xl max-w-3xl w-full max-h-[95dvh] flex flex-col shadow-2xl relative"
          onClick={(e) => e.stopPropagation()}
        >
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-3 right-3 z-20 p-1.5 hover:bg-gray-100 rounded-full transition-colors bg-white shadow-sm"
          aria-label="Close"
        >
          <X size={20} className="text-gray-600" />
        </button>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto overscroll-contain">
          <div className="p-4 sm:p-5">
            {/* Image - Now scrollable */}
            {item.image_url && (
              <div className="relative w-full h-48 sm:h-56 bg-gray-100 rounded-lg mb-4 overflow-hidden">
                <Image
                  src={item.image_url}
                  alt={item.name}
                  fill
                  className="object-cover"
                />
              </div>
            )}

            <h2 className="text-xl sm:text-2xl font-bold mb-1.5 text-gray-900">{item.name}</h2>
            <p className="text-gray-600 mb-4 text-sm sm:text-base leading-relaxed">{item.description}</p>
            {mode === 'edit' && (
              <button
                onClick={resetSelections}
                className="mb-4 text-xs sm:text-sm font-semibold text-gray-700 underline hover:text-black"
              >
                Remove all modifications
              </button>
            )}

            {/* Optional Add-ons */}
            {(() => {
              const allowedPaid = getPaidAddonsForItem(item)
              if (allowedPaid.length === 0) return null
              return (
                <div className="mb-4">
                  <h3 className="text-sm sm:text-base font-semibold mb-2 text-gray-900">OPTIONS - Optional</h3>
                  <div className="space-y-1.5">
                    {allowedPaid.map((addon) => (
                      <label
                        key={addon.id}
                        className="flex items-center justify-between p-2 sm:p-2.5 border border-gray-200 rounded-lg hover:border-black transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-2.5">
                          <input
                            type="checkbox"
                            checked={selectedAddons.has(addon.id)}
                            onChange={() => toggleAddon(addon.id)}
                            className="w-4 h-4 border-gray-300 rounded text-black focus:ring-black cursor-pointer"
                          />
                          <span className="text-xs sm:text-sm font-medium text-gray-900">{addon.label}</span>
                        </div>
                        <span className="text-xs sm:text-sm font-semibold text-gray-900">${addon.price.toFixed(2)}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )
            })()}

            {/* Free Options */}
            {(() => {
              const allowedFree = getFreeOptionsForItem(item)
              if (allowedFree.length === 0) return null
              return (
                <div className="mb-4">
                  <div className="space-y-1.5">
                    {allowedFree.map((option) => (
                      <label
                        key={option.id}
                        className="flex items-center p-2 sm:p-2.5 border border-gray-200 rounded-lg hover:border-black transition-colors cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={selectedFreeOptions.has(option.id)}
                          onChange={() => toggleFreeOption(option.id)}
                          className="w-4 h-4 border-gray-300 rounded text-black focus:ring-black cursor-pointer"
                        />
                        <span className="ml-2.5 text-xs sm:text-sm font-medium text-gray-900">{option.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )
            })()}

            {/* Sambosa filling (single select) */}
            {item.id === 'potato-or-beef-sambosa' ? (
              <div className="mb-4">
                <h3 className="text-sm sm:text-base font-semibold mb-2 text-gray-900">Sambosa filling</h3>
                <div className="space-y-1.5">
                  <label className="flex items-center justify-between p-2 sm:p-2.5 border border-gray-200 rounded-lg hover:border-black transition-colors cursor-pointer">
                    <div className="flex items-center gap-2.5">
                      <input
                        type="radio"
                        name="sambosa-filling"
                        checked={selectedSambosaFilling === 'potato'}
                        onChange={() => setSelectedSambosaFilling('potato')}
                        className="w-4 h-4 border-gray-300 text-black focus:ring-black cursor-pointer"
                      />
                      <span className="text-xs sm:text-sm font-medium text-gray-900">Potato</span>
                    </div>
                  </label>
                  <label className="flex items-center justify-between p-2 sm:p-2.5 border border-gray-200 rounded-lg hover:border-black transition-colors cursor-pointer">
                    <div className="flex items-center gap-2.5">
                      <input
                        type="radio"
                        name="sambosa-filling"
                        checked={selectedSambosaFilling === 'beef'}
                        onChange={() => setSelectedSambosaFilling('beef')}
                        className="w-4 h-4 border-gray-300 text-black focus:ring-black cursor-pointer"
                      />
                      <span className="text-xs sm:text-sm font-medium text-gray-900">Beef</span>
                    </div>
                  </label>
                </div>
              </div>
            ) : null}

            {/* Quantity */}
            <div className="mb-4">
              <h3 className="text-sm sm:text-base font-semibold mb-3 text-gray-900">Quantity</h3>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="p-1.5 border-2 border-gray-200 rounded-lg hover:border-black transition-colors disabled:opacity-50"
                  disabled={quantity === 1}
                >
                  <Minus size={18} />
                </button>
                <span className="text-xl font-semibold w-10 text-center">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="p-1.5 border-2 border-gray-200 rounded-lg hover:border-black transition-colors"
                >
                  <Plus size={18} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Fixed Footer */}
        <div className="border-t border-gray-200 bg-white p-4 sm:p-5 flex-shrink-0">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div>
              <div className="text-xs text-gray-600">Total</div>
              <div className="text-xl sm:text-2xl font-bold text-gray-900">${finalPrice.toFixed(2)}</div>
            </div>
            <button
              onClick={handleAddToCart}
              disabled={isAdding}
              className="w-full sm:w-auto px-6 py-3 bg-black text-white rounded-lg font-semibold text-sm sm:text-base hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isAdding ? (
                <span>Adding...</span>
              ) : (
                <>
                  <Plus size={18} />
                  <span>{mode === 'edit' ? 'Save Changes' : 'Add to Cart'}</span>
                </>
              )}
            </button>
          </div>
        </div>
        </div>
      </div>
    </div>
  )
}
