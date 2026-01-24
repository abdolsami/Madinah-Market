'use client'

import { MapPin } from 'lucide-react'

export default function Map() {
  const address = '3126 S Parker Rd, Aurora, CO 80014'
  const encodedAddress = encodeURIComponent(address)
  // Using Google Maps embed URL - works without API key
  const googleMapsUrl = `https://maps.google.com/maps?q=${encodedAddress}&t=&z=15&ie=UTF8&iwloc=&output=embed`

  return (
    <div className="w-full">
      <div className="relative w-full h-[400px] sm:h-[500px] rounded-xl overflow-hidden border border-gray-200">
        <iframe
          src={googleMapsUrl}
          width="100%"
          height="100%"
          style={{ border: 0 }}
          allowFullScreen
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          className="w-full h-full"
          title="Madinah Market Location"
        />
      </div>
      <div className="mt-4 sm:mt-6 flex items-center justify-center">
        <div className="flex items-center space-x-2 text-gray-900">
          <MapPin className="text-gray-600 flex-shrink-0" size={20} />
          <span className="font-semibold text-base sm:text-lg text-center">{address}</span>
        </div>
      </div>
    </div>
  )
}
