import { CartItem } from './types'

const CART_STORAGE_KEY = 'madinah-market-cart'

export const getCart = (): CartItem[] => {
  if (typeof window === 'undefined') return []
  
  try {
    const cart = localStorage.getItem(CART_STORAGE_KEY)
    return cart ? JSON.parse(cart) : []
  } catch {
    return []
  }
}

export const saveCart = (cart: CartItem[]): void => {
  if (typeof window === 'undefined') return
  
  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart))
    // Dispatch custom event for same-tab updates
    window.dispatchEvent(new Event('cartUpdated'))
  } catch (error) {
    console.error('Failed to save cart:', error)
  }
}

export const addToCart = (item: Omit<CartItem, 'quantity'>): CartItem[] => {
  const cart = getCart()
  const existingItem = cart.find(cartItem => cartItem.id === item.id)
  
  if (existingItem) {
    existingItem.quantity += 1
  } else {
    cart.push({ ...item, quantity: 1 })
  }
  
  saveCart(cart)
  return cart
}

export const removeFromCart = (itemId: string): CartItem[] => {
  const cart = getCart().filter(item => item.id !== itemId)
  saveCart(cart)
  return cart
}

export const updateCartItemQuantity = (itemId: string, quantity: number): CartItem[] => {
  const cart = getCart()
  const item = cart.find(cartItem => cartItem.id === itemId)
  
  if (item) {
    if (quantity <= 0) {
      return removeFromCart(itemId)
    }
    item.quantity = quantity
  }
  
  saveCart(cart)
  return cart
}

export const replaceCartItem = (
  originalId: string,
  newItem: Omit<CartItem, 'quantity'>,
  quantity: number
): CartItem[] => {
  const normalizedQuantity = Math.max(1, quantity)
  const cart = getCart().filter(item => item.id !== originalId)
  const existingItem = cart.find(item => item.id === newItem.id)
  
  if (existingItem) {
    existingItem.quantity += normalizedQuantity
  } else {
    cart.push({ ...newItem, quantity: normalizedQuantity })
  }
  
  saveCart(cart)
  return cart
}

export const clearCart = (): void => {
  if (typeof window === 'undefined') return
  localStorage.removeItem(CART_STORAGE_KEY)
}

export const getCartTotal = (cart: CartItem[]): number => {
  return cart.reduce((total, item) => {
    let itemTotal = item.price
    if (item.selectedAddons && item.selectedAddons.length > 0) {
      itemTotal += item.selectedAddons.reduce((sum, addon) => sum + addon.price, 0)
    }
    return total + itemTotal * item.quantity
  }, 0)
}

export const getCartItemCount = (cart: CartItem[]): number => {
  return cart.reduce((count, item) => count + item.quantity, 0)
}
