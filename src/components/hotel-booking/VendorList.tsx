import { useState, useEffect } from 'react';
import { Vendor } from '@/utils/contracts';
import { ipfsService, HotelMetadata, CancellationPolicy } from '@/utils/ipfs';

interface VendorListProps {
  vendors: Vendor[];
  onVendorSelect: (vendor: Vendor) => void;
}

interface VendorWithMetadata extends Vendor {
  metadata?: HotelMetadata;
  cancellationPolicy?: CancellationPolicy;
}

export default function VendorList({ vendors, onVendorSelect }: VendorListProps) {
  const [vendorsWithMetadata, setVendorsWithMetadata] = useState<VendorWithMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterVerified, setFilterVerified] = useState(false);
  const [sortBy, setSortBy] = useState<'reputation' | 'name' | 'registration'>('reputation');

  useEffect(() => {
    loadVendorMetadata();
  }, [vendors]);

  const loadVendorMetadata = async () => {
    setLoading(true);
    setError(null);

    try {
      const vendorsWithMeta = await Promise.all(
        vendors.map(async (vendor, index) => {
          try {
            // In demo mode, create mock metadata
            if (vendor.metadataHash.startsWith('QmMock')) {
              const mockMetadata: HotelMetadata = {
                name: `Hotel ${index + 1}`,
                description: `A beautiful hotel in the heart of the city with excellent amenities and service.`,
                location: {
                  city: 'Demo City',
                  country: 'Demo Country',
                  address: `123 Demo Street, Hotel ${index + 1}`,
                  coordinates: { lat: 0, lng: 0 }
                },
                amenities: ['WiFi', 'Pool', 'Restaurant', 'Gym', 'Concierge'],
                roomTypes: [
                  {
                    type: 'Standard Room',
                    description: 'Comfortable room with modern amenities',
                    maxOccupancy: 2,
                    pricePerNight: 100 * 1e18,
                    amenities: ['WiFi', 'TV', 'Air Conditioning']
                  },
                  {
                    type: 'Deluxe Room',
                    description: 'Spacious room with city views',
                    maxOccupancy: 2,
                    pricePerNight: 150 * 1e18,
                    amenities: ['WiFi', 'TV', 'Air Conditioning', 'City View', 'Mini-bar']
                  }
                ],
                photos: ['https://via.placeholder.com/800x600/4F46E5/FFFFFF?text=Hotel+Image'],
                rating: 4,
                contact: {
                  phone: '+1-555-0123',
                  email: 'info@hotel.com',
                  website: 'https://hotel.com'
                }
              };

              const mockCancellationPolicy: CancellationPolicy = {
                freeCancellation: true,
                cancellationDeadline: 24,
                refundPercentage: 100,
                description: 'Free cancellation 24h before check-in'
              };

              return {
                ...vendor,
                metadata: mockMetadata,
                cancellationPolicy: mockCancellationPolicy,
              };
            }

            // Real IPFS data
            const [metadata, cancellationPolicy] = await Promise.all([
              ipfsService.getJSON(vendor.metadataHash),
              ipfsService.getJSON(vendor.cancellationPolicyHash),
            ]);

            return {
              ...vendor,
              metadata,
              cancellationPolicy,
            };
          } catch (err) {
            console.error(`Failed to load metadata for vendor ${vendor.vendorAddress}:`, err);
            return vendor;
          }
        })
      );

      setVendorsWithMetadata(vendorsWithMeta);
    } catch (err) {
      setError('Failed to load vendor metadata');
    } finally {
      setLoading(false);
    }
  };

  const filteredAndSortedVendors = vendorsWithMetadata
    .filter((vendor) => {
      const matchesSearch = !searchTerm || 
        vendor.metadata?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vendor.metadata?.location?.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vendor.metadata?.location?.country?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesVerified = !filterVerified || vendor.isVerified;
      
      return matchesSearch && matchesVerified;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'reputation':
          return b.reputationScore - a.reputationScore;
        case 'name':
          return (a.metadata?.name || '').localeCompare(b.metadata?.name || '');
        case 'registration':
          return b.registrationTime - a.registrationTime;
        default:
          return 0;
      }
    });

  const getReputationColor = (score: number) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    if (score >= 40) return 'text-orange-400';
    return 'text-red-400';
  };

  const getReputationText = (score: number) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    return 'Poor';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400 mx-auto mb-4"></div>
          <p className="text-white/80">Loading hotels...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-400 text-4xl mb-4">⚠️</div>
        <p className="text-white/80">{error}</p>
        <button
          onClick={loadVendorMetadata}
          className="mt-4 px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search hotels by name, city, or country..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-cyan-400"
            />
          </div>
          <div className="flex gap-4">
            <label className="flex items-center space-x-2 text-white/80">
              <input
                type="checkbox"
                checked={filterVerified}
                onChange={(e) => setFilterVerified(e.target.checked)}
                className="rounded border-white/20 bg-white/10 text-cyan-400 focus:ring-cyan-400"
              />
              <span>Verified only</span>
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
            >
              <option value="reputation">Sort by Reputation</option>
              <option value="name">Sort by Name</option>
              <option value="registration">Sort by Registration</option>
            </select>
          </div>
        </div>
      </div>

      {/* Results Count */}
      <div className="text-white/60">
        {filteredAndSortedVendors.length} hotel{filteredAndSortedVendors.length !== 1 ? 's' : ''} found
      </div>

      {/* Vendor Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredAndSortedVendors.map((vendor) => (
          <div
            key={vendor.vendorAddress}
            className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 overflow-hidden hover:border-cyan-400/50 transition-all duration-300 group"
          >
            {/* Hotel Image */}
            <div className="h-48 bg-gradient-to-br from-cyan-500/20 to-purple-500/20 flex items-center justify-center">
              {vendor.metadata?.photos && vendor.metadata.photos.length > 0 ? (
                <img
                  src={vendor.metadata.photos[0]}
                  alt={vendor.metadata.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-6xl opacity-50">🏨</div>
              )}
            </div>

            {/* Hotel Info */}
            <div className="p-6">
              <div className="flex items-start justify-between mb-3">
                <h3 className="text-xl font-semibold text-white group-hover:text-cyan-400 transition-colors">
                  {vendor.metadata?.name || 'Unnamed Hotel'}
                </h3>
                {vendor.isVerified && (
                  <span className="bg-green-500/20 text-green-400 px-2 py-1 rounded-full text-xs font-medium">
                    ✓ Verified
                  </span>
                )}
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center text-white/60">
                  <span className="mr-2">📍</span>
                  <span>
                    {vendor.metadata?.location?.city || 'Demo City'}, {vendor.metadata?.location?.country || 'Demo Country'}
                  </span>
                </div>
                
                <div className="flex items-center text-white/60">
                  <span className="mr-2">⭐</span>
                  <span className={`font-medium ${getReputationColor(vendor.reputationScore)}`}>
                    {getReputationText(vendor.reputationScore)} ({vendor.reputationScore}/100)
                  </span>
                </div>

                {vendor.metadata?.amenities && vendor.metadata.amenities.length > 0 && (
                  <div className="flex items-center text-white/60">
                    <span className="mr-2">🏷️</span>
                    <span className="text-sm">
                      {vendor.metadata.amenities.slice(0, 3).join(', ')}
                      {vendor.metadata.amenities.length > 3 && '...'}
                    </span>
                  </div>
                )}
              </div>

              {vendor.metadata?.description && (
                <p className="text-white/70 text-sm mb-4 line-clamp-2">
                  {vendor.metadata.description}
                </p>
              )}

              {/* Room Types Preview */}
              {vendor.metadata?.roomTypes && vendor.metadata.roomTypes.length > 0 && (
                <div className="mb-4">
                  <div className="text-white/60 text-sm mb-2">Available Rooms:</div>
                  <div className="space-y-1">
                    {vendor.metadata.roomTypes.slice(0, 2).map((room, index) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span className="text-white/80">{room.type}</span>
                        <span className="text-cyan-400">
                          {room.pricePerNight ? `${(Number(room.pricePerNight) / 1e18).toFixed(2)} ETH/night` : 'Price on request'}
                        </span>
                      </div>
                    ))}
                    {vendor.metadata.roomTypes.length > 2 && (
                      <div className="text-white/60 text-sm">
                        +{vendor.metadata.roomTypes.length - 2} more room types
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Action Button */}
              <button
                onClick={() => onVendorSelect(vendor)}
                className="w-full bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 text-white font-medium py-3 px-4 rounded-lg transition-all duration-300 transform hover:scale-105"
              >
                Book Now
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredAndSortedVendors.length === 0 && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4 opacity-50">🔍</div>
          <h3 className="text-xl font-semibold text-white mb-2">No hotels found</h3>
          <p className="text-white/60">
            Try adjusting your search criteria or filters
          </p>
        </div>
      )}
    </div>
  );
}
