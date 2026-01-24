import Link from 'next/link'
import { ArrowRight, UtensilsCrossed, Clock, Award, Phone } from 'lucide-react'
import { menuItems } from '@/lib/menu-data'
import Image from 'next/image'
import Map from '@/components/Map'

export default function Home() {
  const featuredDishes = menuItems.slice(0, 3)

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-white overflow-hidden">
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-32 md:py-40">
          <div className="text-center animate-fade-in">
            <h1 className="font-display text-5xl sm:text-6xl md:text-8xl lg:text-9xl font-bold mb-4 sm:mb-6 tracking-tight text-gray-900">
              Madinah Market
            </h1>
            <p className="text-lg sm:text-xl md:text-2xl mb-6 sm:mb-8 text-gray-600 max-w-2xl mx-auto font-light px-4">
              Authentic Afghan Cuisine with Traditional Flavors
            </p>
            <p className="text-base sm:text-lg md:text-xl mb-8 sm:mb-12 text-gray-500 max-w-xl mx-auto leading-relaxed font-light px-4">
              Experience the rich heritage of Afghan cooking, where every dish tells a story
              of tradition, family, and the warmth of home.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center px-4">
              <Link
                href="/menu"
                className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 bg-black text-white px-6 sm:px-8 py-3 sm:py-4 rounded-lg text-base sm:text-lg font-semibold hover:bg-gray-800 transition-colors"
              >
                <span>Order Now</span>
                <ArrowRight size={20} />
              </Link>
              <a
                href="tel:+17207630786"
                className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 border-2 border-gray-300 text-gray-900 px-6 sm:px-8 py-3 sm:py-4 rounded-lg text-base sm:text-lg font-semibold hover:border-black transition-colors"
              >
                <Phone size={20} />
                <span>(720) 763-0786</span>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-12 sm:py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 sm:gap-12">
            <div className="text-center">
              <div className="bg-black rounded-2xl w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center mx-auto mb-4 sm:mb-6">
                <UtensilsCrossed className="text-white" size={28} />
              </div>
              <h3 className="font-display text-lg sm:text-xl font-semibold mb-2 sm:mb-3 text-gray-900">
                Authentic Recipes
              </h3>
              <p className="text-sm sm:text-base text-gray-600 leading-relaxed px-4">
                Traditional recipes passed down through generations
              </p>
            </div>
            <div className="text-center">
              <div className="bg-black rounded-2xl w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center mx-auto mb-4 sm:mb-6">
                <Clock className="text-white" size={28} />
              </div>
              <h3 className="font-display text-lg sm:text-xl font-semibold mb-2 sm:mb-3 text-gray-900">
                Fresh Daily
              </h3>
              <p className="text-sm sm:text-base text-gray-600 leading-relaxed px-4">
                All dishes prepared fresh daily with quality ingredients
              </p>
            </div>
            <div className="text-center">
              <div className="bg-black rounded-2xl w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center mx-auto mb-4 sm:mb-6">
                <Award className="text-white" size={28} />
              </div>
              <h3 className="font-display text-lg sm:text-xl font-semibold mb-2 sm:mb-3 text-gray-900">
                Award Winning
              </h3>
              <p className="text-sm sm:text-base text-gray-600 leading-relaxed px-4">
                Recognized for excellence in authentic Afghan cuisine
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Dishes */}
      <section className="py-12 sm:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10 sm:mb-16">
            <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-3 sm:mb-4">
              Featured Dishes
            </h2>
            <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto px-4">
              Discover our most popular dishes, each crafted with care and authentic flavors
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {featuredDishes.map((dish) => (
              <Link
                key={dish.id}
                href="/menu"
                className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:border-black transition-all group"
              >
                <div className="relative h-48 sm:h-64 w-full bg-gray-100 overflow-hidden">
                  {dish.image_url && (
                    <Image
                      src={dish.image_url}
                      alt={dish.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  )}
                </div>
                <div className="p-4 sm:p-6">
                  <h3 className="font-display text-lg sm:text-xl font-semibold mb-2 text-gray-900">
                    {dish.name}
                  </h3>
                  <p className="text-gray-600 mb-4 line-clamp-2 text-sm leading-relaxed">{dish.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-900 font-bold text-lg sm:text-xl">
                      ${dish.price.toFixed(2)}
                    </span>
                    <span className="text-gray-400 group-hover:text-black transition-colors text-xs sm:text-sm">
                      View Menu →
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Location & Map Section */}
      <section className="py-12 sm:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10 sm:mb-16">
            <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-3 sm:mb-4">
              Visit Us
            </h2>
            <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto px-4">
              Come experience authentic Afghan cuisine at our location in Aurora, Colorado
            </p>
          </div>
          <div className="max-w-5xl mx-auto">
            <Map />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 sm:py-20 bg-black text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold mb-4 sm:mb-6">
            Ready to Taste Authentic Afghan Cuisine?
          </h2>
          <p className="text-lg sm:text-xl mb-8 sm:mb-10 text-gray-300 font-light px-4">
            Browse our menu and place your order today
          </p>
          <Link
            href="/menu"
            className="inline-flex items-center space-x-2 bg-white text-black px-8 sm:px-10 py-4 sm:py-5 rounded-lg text-base sm:text-lg font-semibold hover:bg-gray-100 transition-colors"
          >
            <span>View Menu</span>
            <ArrowRight size={20} />
          </Link>
        </div>
      </section>
    </div>
  )
}
