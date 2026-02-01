import Link from 'next/link'
import { Phone, MapPin, Clock } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="bg-black text-white mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          <div>
            <h3 className="font-display text-2xl font-bold mb-4">
              Denver Kabob
            </h3>
            <p className="text-gray-400 text-base leading-relaxed">
              Authentic Afghan cuisine with traditional flavors and warm hospitality.
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-lg mb-6">Quick Links</h4>
            <ul className="space-y-3">
              <li>
                <Link href="/" className="text-gray-400 hover:text-white transition-colors text-base font-medium inline-block">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/menu" className="text-gray-400 hover:text-white transition-colors text-base font-medium inline-block">
                  Menu
                </Link>
              </li>
              <li>
                <Link href="/cart" className="text-gray-400 hover:text-white transition-colors text-base font-medium inline-block">
                  Cart
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-lg mb-6">Contact</h4>
            <ul className="space-y-4">
              <li className="flex items-center space-x-3">
                <Phone size={18} className="text-gray-400" />
                <a href="tel:+17205733605" className="text-gray-400 hover:text-white transition-colors text-base font-medium">
                  (720) 573-3605
                </a>
              </li>
              <li className="flex items-start space-x-3">
                <MapPin size={18} className="text-gray-400 mt-1" />
                <span className="text-gray-400 text-base leading-relaxed">19245 E 56th Ave, Denver, CO 80249</span>
              </li>
              <li className="flex items-center space-x-3">
                <Clock size={18} className="text-gray-400" />
                <div className="text-gray-400 text-base leading-relaxed">
                  <div>Sunday: 11:30 AM – 8 PM</div>
                  <div>Monday: 11 AM – 8 PM</div>
                  <div>Tuesday: 11 AM – 8 PM</div>
                  <div>Wednesday: 11 AM – 8 PM</div>
                  <div>Thursday: 11 AM – 8 PM</div>
                  <div>Friday: 11 AM – 9 PM</div>
                  <div>Saturday: 11 AM – 9 PM</div>
                </div>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400">
          <p className="text-sm">&copy; {new Date().getFullYear()} Denver Kabob. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
