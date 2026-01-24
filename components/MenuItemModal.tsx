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

const paidAddons: AddonOption[] = [
  { id: 'extra-gyros', label: 'XTRA GYROS', price: 1 },
  { id: 'extra-chicken-shawarma', label: 'XTRA CHICKEN SHAWARMA', price: 1 },
  { id: 'extra-rice', label: 'XTRA RICE', price: 1 },
  { id: 'extra-falafel', label: 'XTRA 3 PCS FLAFEL', price: 1 },
  { id: 'extra-fries', label: 'XTRA FRIES', price: 1 },
  { id: 'extra-fish', label: 'XTRA FISH(1 PCS)', price: 1 },
  { id: 'extra-kobideh', label: 'XTRA KOBIDEH KABOB(BEEF)', price: 1 },
  { id: 'extra-chicken-kabob', label: 'XTRA CHICKEN KABOB', price: 1 },
  { id: 'can-soda', label: 'add can soda', price: 1 },
  { id: 'chips', label: 'add frito lays chips', price: 1 },
  { id: 'water', label: 'add water', price: 1 },
  { id: 'bottle-soda', label: 'add bottle soda', price: 1 },
]

const freeOptions: FreeOption[] = [
  { id: 'no-salad', label: 'NO SALAD' },
  { id: 'no-lettuce', label: 'NO LETTUCE' },
  { id: 'no-sauce', label: 'NO SAUCE' },
  { id: 'add-hot-sauce', label: 'ADD HOT SAUCE' },
  { id: 'extra-white-sauce', label: 'XTRA WHITE SAUCE' },
  { id: 'no-rice-extra-salad', label: 'No rice xtra salad' },
  { id: 'no-fries', label: 'No fries' },
  { id: 'no-cucumber', label: 'No cucumber' },
]

const drinkOptions: AddonOption[] = [
  { id: 'drink-can-soda', label: 'Can soda', price: 1 },
  { id: 'drink-water', label: 'Water', price: 1 },
  { id: 'drink-sunny-d', label: 'Sunny d drink', price: 1 },
  { id: 'drink-bottle-soda', label: 'Bottle soda', price: 1 },
]

export default function MenuItemModal({
  item,
  isOpen,
  onClose,
  mode = 'add',
  initialQuantity = 1,
  initialSelectedOptions = [],
  initialSelectedAddons = [],
  originalCartItemId,
}: MenuItemModalProps) {
  const [quantity, setQuantity] = useState(1)
  const [selectedAddons, setSelectedAddons] = useState<Set<string>>(new Set())
  const [selectedFreeOptions, setSelectedFreeOptions] = useState<Set<string>>(new Set())
  const [selectedDrink, setSelectedDrink] = useState<string>('')
  const [isAdding, setIsAdding] = useState(false)

  const resetSelections = () => {
    setSelectedAddons(new Set())
    setSelectedFreeOptions(new Set())
    setSelectedDrink('')
  }

  // Reset state when modal closes
  const handleClose = () => {
    setQuantity(1)
    resetSelections()
    onClose()
  }

  useEffect(() => {
    if (!isOpen || !item) return
    
    setQuantity(initialQuantity || 1)
    
    const freeOptionIds = new Set<string>()
    initialSelectedOptions.forEach((label) => {
      const match = freeOptions.find((option) => option.label === label)
      if (match) freeOptionIds.add(match.id)
    })
    setSelectedFreeOptions(freeOptionIds)
    
    const addonIds = new Set<string>()
    let drinkId = ''
    initialSelectedAddons.forEach((addon) => {
      const paidMatch = paidAddons.find((paid) => paid.label === addon.name)
      if (paidMatch) addonIds.add(paidMatch.id)
      const drinkMatch = drinkOptions.find((drink) => drink.label === addon.name)
      if (drinkMatch) drinkId = drinkMatch.id
    })
    setSelectedAddons(addonIds)
    setSelectedDrink(drinkId)
  }, [isOpen, item, initialQuantity, initialSelectedOptions, initialSelectedAddons])

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
    
    if (selectedDrink) {
      const drink = drinkOptions.find((d) => d.id === selectedDrink)
      if (drink) addonTotal += drink.price
    }

    return (item.price + addonTotal) * quantity
  }

  const getSelectedAddonsList = () => {
    const addons: Array<{ name: string; price: number }> = []
    selectedAddons.forEach((id) => {
      const addon = paidAddons.find((a) => a.id === id)
      if (addon) addons.push({ name: addon.label, price: addon.price })
    })
    if (selectedDrink) {
      const drink = drinkOptions.find((d) => d.id === selectedDrink)
      if (drink) addons.push({ name: drink.label, price: drink.price })
    }
    return addons
  }

  const getSelectedOptionsList = () => {
    const options: string[] = []
    selectedFreeOptions.forEach((id) => {
      const option = freeOptions.find((o) => o.id === id)
      if (option) options.push(option.label)
    })
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
        // Add new item with quantity
        for (let i = 0; i < quantity; i++) {
          addToCart(cartItem)
        }
      }
    }
    
    setTimeout(() => {
      setIsAdding(false)
      handleClose()
    }, 300)
  }

  const finalPrice = calculateTotal()

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={handleClose}
    >
      <div
        className="bg-white rounded-2xl max-w-3xl w-full max-h-[95vh] flex flex-col shadow-2xl relative"
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
        <div className="flex-1 overflow-y-auto">
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
            <div className="mb-4">
              <h3 className="text-sm sm:text-base font-semibold mb-2 text-gray-900">OPTIONS - Optional</h3>
              <div className="space-y-1.5">
                {paidAddons.map((addon) => (
                  <label
                    key={addon.id}
                    className="flex items-center justify-between p-2 sm:p-2.5 border border-gray-200 rounded-lg hover:border-black transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <input
                        type="checkbox"
                        checked={selectedAddons.has(addon.id)}
                        onChange={() => toggleAddon(addon.id)}
                        className="w-4 h-4 border-gray-300 rounded text-black focus:ring-black"
                      />
                      <span className="text-xs sm:text-sm font-medium text-gray-900">{addon.label}</span>
                    </div>
                    <span className="text-xs sm:text-sm font-semibold text-gray-900">${addon.price.toFixed(2)}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Free Options */}
            <div className="mb-4">
              <div className="space-y-1.5">
                {freeOptions.map((option) => (
                  <label
                    key={option.id}
                    className="flex items-center p-2 sm:p-2.5 border border-gray-200 rounded-lg hover:border-black transition-colors cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedFreeOptions.has(option.id)}
                      onChange={() => toggleFreeOption(option.id)}
                      className="w-4 h-4 border-gray-300 rounded text-black focus:ring-black"
                    />
                    <span className="ml-2.5 text-xs sm:text-sm font-medium text-gray-900">{option.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Drink Options */}
            <div className="mb-4">
              <h3 className="text-sm sm:text-base font-semibold mb-2 text-gray-900">Drink option - Optional</h3>
              <div className="space-y-1.5">
                {drinkOptions.map((drink) => (
                  <label
                    key={drink.id}
                    className="flex items-center justify-between p-2 sm:p-2.5 border border-gray-200 rounded-lg hover:border-black transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <input
                        type="radio"
                        name="drink"
                        checked={selectedDrink === drink.id}
                        onChange={() => setSelectedDrink(drink.id)}
                        className="w-4 h-4 border-gray-300 text-black focus:ring-black"
                      />
                      <span className="text-xs sm:text-sm font-medium text-gray-900">{drink.label}</span>
                    </div>
                    <span className="text-xs sm:text-sm font-semibold text-gray-900">${drink.price.toFixed(2)}</span>
                  </label>
                ))}
              </div>
            </div>

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
  )
}
