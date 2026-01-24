'use client'

import { useState } from 'react'
import { menuItems } from '@/lib/menu-data'
import { MenuItem } from '@/lib/types'
import MenuItemModal from '@/components/MenuItemModal'
import Image from 'next/image'

const categories = [
  'All',
  'Sandwiches',
  'Kabobs',
  'Rice Dishes',
  'Combo Plates',
  'Appetizers',
] as const

export default function MenuPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>('All')
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const filteredItems =
    selectedCategory === 'All'
      ? menuItems
      : menuItems.filter((item) => item.category === selectedCategory)

  const handleItemClick = (item: MenuItem) => {
    setSelectedItem(item)
    setIsModalOpen(true)
  }

  return (
    <>
      <div className="min-h-screen bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-16">
            <h1 className="font-display text-5xl md:text-6xl font-bold text-gray-900 mb-4">
              Our Menu
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Explore our authentic Afghan dishes, each prepared with care and traditional flavors
            </p>
          </div>

          {/* Category Filter */}
          <div className="flex flex-wrap justify-center gap-3 mb-16">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-6 py-2.5 rounded-lg font-medium transition-all ${
                  selectedCategory === category
                    ? 'bg-black text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {category}
              </button>
            ))}
          </div>

          {/* Menu Items Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleItemClick(item)}
                className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:border-black transition-all text-left group cursor-pointer flex flex-col h-full"
              >
                <div className="relative h-64 sm:h-72 w-full bg-gray-100 overflow-hidden flex items-center justify-center p-4">
                  {item.image_url && (
                    <Image
                      src={item.image_url}
                      alt={item.name}
                      fill
                      className="object-contain group-hover:scale-105 transition-transform duration-300"
                    />
                  )}
                </div>
                <div className="p-6 flex-1 flex flex-col">
                  <h3 className="font-display text-xl font-semibold mb-2 text-gray-900">
                    {item.name}
                  </h3>
                  <p className="text-gray-600 mb-4 text-sm line-clamp-2 flex-1">
                    {item.description}
                  </p>
                  <div className="flex items-center justify-between mt-auto">
                    <span className="text-gray-900 font-bold text-xl">
                      ${item.price.toFixed(2)}
                    </span>
                    <span className="text-gray-400 group-hover:text-black transition-colors text-sm">
                      View Options →
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {filteredItems.length === 0 && (
            <div className="text-center py-12">
              <p className="text-lg text-gray-600">
                No items found in this category.
              </p>
            </div>
          )}
        </div>
      </div>

      <MenuItemModal
        item={selectedItem}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setSelectedItem(null)
        }}
      />
    </>
  )
}
