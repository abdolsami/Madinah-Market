import { CartItem } from './types'

// Tax rate for calculations
export const TAX_RATE = 0.08

// Time slot configuration for scheduling
export const TIME_SLOT_CONFIG = {
  intervalMinutes: 15,
  slotsCount: 12,
} as const

/**
 * Calculate cart subtotal (items + addons)
 */
export const calculateSubtotal = (cart: CartItem[]): number => {
  return cart.reduce((total, item) => {
    let itemTotal = item.price
    if (item.selectedAddons && item.selectedAddons.length > 0) {
      itemTotal += item.selectedAddons.reduce((sum, addon) => sum + addon.price, 0)
    }
    return total + itemTotal * item.quantity
  }, 0)
}

/**
 * Calculate tax amount
 */
export const calculateTax = (subtotal: number): number => {
  return Number((subtotal * TAX_RATE).toFixed(2))
}

/**
 * Calculate tip amount from percentage
 */
export const calculateTipAmount = (subtotal: number, tipPercent: number): number => {
  return Number((subtotal * (tipPercent / 100)).toFixed(2))
}

/**
 * Calculate final total (subtotal + tax + tip)
 */
export const calculateTotal = (subtotal: number, tax: number, tip: number): number => {
  return Number((subtotal + tax + tip).toFixed(2))
}

/**
 * Generate available time slots for scheduling
 */
export const generateTimeSlots = (): Array<{ label: string; value: string }> => {
  const slots: Array<{ label: string; value: string }> = []
  const now = new Date()
  const { intervalMinutes, slotsCount } = TIME_SLOT_CONFIG

  const rounded = new Date(now)
  const minutes = rounded.getMinutes()
  rounded.setMinutes(
    minutes + ((intervalMinutes - (minutes % intervalMinutes)) % intervalMinutes),
    0,
    0
  )

  for (let i = 0; i < slotsCount; i += 1) {
    const slotTime = new Date(rounded.getTime() + i * intervalMinutes * 60 * 1000)
    slots.push({
      label: slotTime.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
      value: slotTime.toISOString(),
    })
  }

  return slots
}
