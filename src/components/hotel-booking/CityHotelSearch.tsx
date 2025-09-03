import { useState, useEffect } from 'react';
import { hotelApiService, RealHotel, SearchParams } from '@/utils/hotelApi';
import { Vendor } from '@/utils/contracts';

interface CityHotelSearchProps {
  onHotelsFound: (hotels: Vendor[]) => void;
  onLoadingChange: (loading: boolean) => void;
}

export default function CityHotelSearch({ onHotelsFound, onLoadingChange }: CityHotelSearchProps) {
  const [searchParams, setSearchParams] = useState<SearchParams>({
    city: '',
    checkIn: '',
    checkOut: '',
    guests: 1,
    rooms: 1
  });
  const [realHotels, setRealHotels] = useState<RealHotel[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (field: keyof SearchParams, value: any) => {
    setSearchParams(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const convertRealHotelToVendor = (realHotel: RealHotel, index: number): Vendor => {
    // Convert room types to our format
    const roomTypes = realHotel.roomTypes.map(room => ({
      type: room.type,
      description: room.description,
      maxOccupancy: room.maxOccupancy,
      pricePerNight: (room.pricePerNight * 1e18).toString(), // Convert to wei
      amenities: room.amenities
    }));

    // Create hotel metadata
    const hotelMetadata = {
      name: realHotel.name,
      description: realHotel.description,
      location: {
        city: realHotel.location.city,
        country: realHotel.location.country,
        address: realHotel.location.address,
        coordinates: realHotel.location.coordinates
      },
      amenities: realHotel.amenities,
      roomTypes: roomTypes,
      photos: realHotel.photos,
      rating: realHotel.rating,
      contact: realHotel.contact
    };

    // Create cancellation policy
    const cancellationPolicy = {
      freeCancellation: realHotel.cancellationPolicy.freeCancellation,
      cancellationDeadline: realHotel.cancellationPolicy.cancellationDeadline,
      refundPercentage: realHotel.cancellationPolicy.refundPercentage,
      description: `Free cancellation ${realHotel.cancellationPolicy.cancellationDeadline}h before check-in`
    };

    // Generate mock hashes for IPFS (in real implementation, these would be uploaded to IPFS)
    const metadataHash = `QmMockHotel${index}Metadata`;
    const cancellationPolicyHash = `QmMockPolicy${index}`;

    return {
      vendorAddress: `0x${Math.random().toString(16).substr(2, 40)}`, // Mock address
      did: `did:hotel:${realHotel.id}`,
      metadataHash,
      cancellationPolicyHash,
      isVerified: realHotel.rating >= 4, // Auto-verify high-rated hotels
      reputationScore: Math.floor(realHotel.rating * 20), // Convert 5-star to 100-point scale
      registrationTime: Date.now() / 1000 - 86400 * 30, // 30 days ago
      isActive: true
    };
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!searchParams.city.trim()) {
      setError('Please enter a city name');
      return;
    }

    setLoading(true);
    setError(null);
    onLoadingChange(true);

    try {
      const hotels = await hotelApiService.searchHotels(searchParams);
      setRealHotels(hotels);
      
      // Convert real hotels to vendor format
      const vendors = hotels.map((hotel, index) => convertRealHotelToVendor(hotel, index));
      onHotelsFound(vendors);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to search hotels');
    } finally {
      setLoading(false);
      onLoadingChange(false);
    }
  };

  const popularCities = [
    'New York', 'London', 'Paris', 'Tokyo', 'Dubai', 'Singapore',
    'Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Kolkata', 'Hyderabad',
    'Pune', 'Ahmedabad', 'Jaipur', 'Goa', 'Kerala', 'Rajasthan'
  ];

  return (
    <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-6 mb-8">
      <h3 className="text-xl font-semibold text-white mb-4">🔍 Search Hotels by City</h3>
      
      <form onSubmit={handleSearch} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* City Input */}
          <div>
            <label className="block text-white font-medium mb-2">City</label>
            <input
              type="text"
              value={searchParams.city}
              onChange={(e) => handleInputChange('city', e.target.value)}
              placeholder="Enter city name"
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-cyan-400"
              list="cities"
            />
            <datalist id="cities">
              {popularCities.map(city => (
                <option key={city} value={city} />
              ))}
            </datalist>
          </div>

          {/* Check-in Date */}
          <div>
            <label className="block text-white font-medium mb-2">Check-in</label>
            <input
              type="date"
              value={searchParams.checkIn}
              onChange={(e) => handleInputChange('checkIn', e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
            />
          </div>

          {/* Check-out Date */}
          <div>
            <label className="block text-white font-medium mb-2">Check-out</label>
            <input
              type="date"
              value={searchParams.checkOut}
              onChange={(e) => handleInputChange('checkOut', e.target.value)}
              min={searchParams.checkIn || new Date().toISOString().split('T')[0]}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
            />
          </div>

          {/* Guests */}
          <div>
            <label className="block text-white font-medium mb-2">Guests</label>
            <input
              type="number"
              min="1"
              max="10"
              value={searchParams.guests}
              onChange={(e) => handleInputChange('guests', parseInt(e.target.value))}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
            />
          </div>

          {/* Rooms */}
          <div>
            <label className="block text-white font-medium mb-2">Rooms</label>
            <input
              type="number"
              min="1"
              max="5"
              value={searchParams.rooms}
              onChange={(e) => handleInputChange('rooms', parseInt(e.target.value))}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
            />
          </div>
        </div>

        {/* Search Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 disabled:from-gray-500 disabled:to-gray-600 text-white font-medium py-3 px-6 rounded-lg transition-all duration-300 transform hover:scale-105 disabled:transform-none disabled:cursor-not-allowed"
        >
          {loading ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
              Searching Hotels...
            </div>
          ) : (
            '🔍 Search Hotels'
          )}
        </button>
      </form>

      {/* Error Message */}
      {error && (
        <div className="mt-4 bg-red-500/20 border border-red-500/50 text-red-400 p-4 rounded-lg">
          {error}
        </div>
      )}

      {/* Popular Cities */}
      <div className="mt-6">
        <h4 className="text-white font-medium mb-3">Popular Cities:</h4>
        <div className="flex flex-wrap gap-2">
          {popularCities.map(city => (
            <button
              key={city}
              onClick={() => handleInputChange('city', city)}
              className="px-3 py-1 bg-white/10 hover:bg-white/20 border border-white/20 rounded-full text-white text-sm transition-colors"
            >
              {city}
            </button>
          ))}
        </div>
      </div>

      {/* Search Results Summary */}
      {realHotels.length > 0 && (
        <div className="mt-6 bg-green-500/20 border border-green-500/50 text-green-400 p-4 rounded-lg">
          <div className="flex items-center">
            <span className="text-2xl mr-2">✅</span>
            <div>
              <p className="font-medium">Found {realHotels.length} hotels in {searchParams.city}</p>
              <p className="text-sm text-green-300">
                Real hotel data from {searchParams.city} - ready for booking!
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
