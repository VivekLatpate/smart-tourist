import { useState, useEffect } from 'react';
import { Vendor, BookingStatus } from '@/utils/contracts';
import { ipfsService, HotelMetadata, RoomDetails } from '@/utils/ipfs';
import { contractService, formatEther, parseEther } from '@/utils/contracts';

interface BookingFormProps {
  vendors: Vendor[];
  onBookingCreated: () => void;
}

interface BookingFormData {
  vendorId: number;
  checkInDate: string;
  checkOutDate: string;
  guestCount: number;
  roomType: string;
  specialRequests: string;
  bufferTime: number; // in hours
}

export default function BookingForm({ vendors, onBookingCreated }: BookingFormProps) {
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [vendorMetadata, setVendorMetadata] = useState<HotelMetadata | null>(null);
  const [formData, setFormData] = useState<BookingFormData>({
    vendorId: 0,
    checkInDate: '',
    checkOutDate: '',
    guestCount: 1,
    roomType: '',
    specialRequests: '',
    bufferTime: 24,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<any>(null);
  const [photos, setPhotos] = useState<File[]>([]);

  useEffect(() => {
    if (formData.vendorId > 0) {
      loadVendorMetadata();
    }
  }, [formData.vendorId]);

  const loadVendorMetadata = async () => {
    const vendor = vendors.find(v => v.vendorAddress === vendors[formData.vendorId - 1]?.vendorAddress);
    if (!vendor) return;

    setSelectedVendor(vendor);
    
    // Always create mock metadata for now since we're using real contracts but with mock data
    const mockMetadata: HotelMetadata = {
      name: `Hotel ${formData.vendorId}`,
      description: `A beautiful hotel in the heart of the city with excellent amenities and service.`,
      location: {
        city: 'Demo City',
        country: 'Demo Country',
        address: `123 Demo Street, Hotel ${formData.vendorId}`,
        coordinates: { lat: 0, lng: 0 }
      },
      amenities: ['WiFi', 'Pool', 'Restaurant', 'Gym', 'Concierge'],
      roomTypes: [
        {
          type: 'Standard Room',
          description: 'Comfortable room with modern amenities',
          maxOccupancy: 2,
          pricePerNight: 100 * 1e18, // 100 ETH in wei
          amenities: ['WiFi', 'TV', 'Air Conditioning']
        },
        {
          type: 'Deluxe Room',
          description: 'Spacious room with city views',
          maxOccupancy: 2,
          pricePerNight: 150 * 1e18, // 150 ETH in wei
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
    setVendorMetadata(mockMetadata);
  };

  const handleInputChange = (field: keyof BookingFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setPhotos(files);
  };

  const calculateTotalPrice = () => {
    if (!selectedRoom || !formData.checkInDate || !formData.checkOutDate) return 0;
    
    const checkIn = new Date(formData.checkInDate);
    const checkOut = new Date(formData.checkOutDate);
    const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
    
    return Number(selectedRoom.pricePerNight) * nights;
  };

  const validateForm = () => {
    console.log('Validating form...');
    console.log('vendorId:', formData.vendorId);
    console.log('checkInDate:', formData.checkInDate);
    console.log('checkOutDate:', formData.checkOutDate);
    console.log('selectedRoom:', selectedRoom);
    console.log('guestCount:', formData.guestCount);
    
    if (!formData.vendorId) {
      setError('Please select a hotel');
      return false;
    }
    if (!formData.checkInDate || !formData.checkOutDate) {
      setError('Please select check-in and check-out dates');
      return false;
    }
    if (new Date(formData.checkInDate) <= new Date()) {
      setError('Check-in date must be in the future');
      return false;
    }
    if (new Date(formData.checkOutDate) <= new Date(formData.checkInDate)) {
      setError('Check-out date must be after check-in date');
      return false;
    }
    if (!selectedRoom) {
      setError('Please select a room type');
      return false;
    }
    if (formData.guestCount < 1) {
      setError('Guest count must be at least 1');
      return false;
    }
    console.log('Form validation passed!');
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('Form submitted with data:', formData);
    console.log('Selected room:', selectedRoom);
    console.log('Selected vendor:', selectedVendor);
    
    if (!validateForm()) {
      console.log('Form validation failed');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // In demo mode, use mock hashes instead of IPFS uploads
      let roomDetailsHash: string;
      
      if (contractService.isInDemoMode()) {
        // Create mock room details hash for demo mode
        roomDetailsHash = `QmMockRoomDetails${Date.now()}`;
        console.log('🎭 Demo Mode: Using mock room details hash:', roomDetailsHash);
      } else {
        // Upload room details and photos to IPFS
        const roomDetails: RoomDetails = {
          roomType: selectedRoom.type,
          amenities: selectedRoom.amenities || [],
          photos: [], // Will be populated after photo upload
          specialRequests: formData.specialRequests,
          guestCount: formData.guestCount,
          pricePerNight: selectedRoom.pricePerNight,
          totalNights: Math.ceil((new Date(formData.checkOutDate).getTime() - new Date(formData.checkInDate).getTime()) / (1000 * 60 * 60 * 24))
        };

        // Upload photos first
        let photoHashes: string[] = [];
        if (photos.length > 0) {
          photoHashes = await ipfsService.uploadMultipleFiles(photos);
        }

        // Update room details with photo hashes
        roomDetails.photos = photoHashes;

        // Upload room details to IPFS
        roomDetailsHash = await ipfsService.uploadRoomDetails(roomDetails);
      }

      // Convert dates to timestamps
      const checkInTime = Math.floor(new Date(formData.checkInDate).getTime() / 1000);
      const checkOutTime = Math.floor(new Date(formData.checkOutDate).getTime() / 1000);
      const bufferTimeSeconds = formData.bufferTime * 3600; // Convert hours to seconds

      // Calculate total price
      const totalPrice = calculateTotalPrice();
      const totalPriceEth = (totalPrice / 1e18).toFixed(4); // Convert wei to ETH

      // Create booking on blockchain
      const tx = await contractService.createBooking(
        formData.vendorId,
        checkInTime,
        checkOutTime,
        roomDetailsHash,
        bufferTimeSeconds,
        totalPriceEth
      );

      // Wait for transaction confirmation
      await tx.wait();

      setSuccess('Booking created successfully! Your payment is now in escrow.');
      onBookingCreated();
      
      // Reset form
      setFormData({
        vendorId: 0,
        checkInDate: '',
        checkOutDate: '',
        guestCount: 1,
        roomType: '',
        specialRequests: '',
        bufferTime: 24,
      });
      setSelectedRoom(null);
      setPhotos([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create booking');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-8">
        <h2 className="text-2xl font-bold text-white mb-6">Create New Booking</h2>

        {error && (
          <div className="bg-red-500/20 border border-red-500/50 text-red-400 p-4 rounded-lg mb-6">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-500/20 border border-green-500/50 text-green-400 p-4 rounded-lg mb-6">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Hotel Selection */}
          <div>
            <label className="block text-white font-medium mb-2">Select Hotel</label>
            <select
              value={formData.vendorId}
              onChange={(e) => handleInputChange('vendorId', parseInt(e.target.value))}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
            >
              <option value={0}>Choose a hotel...</option>
              {vendors.map((vendor, index) => (
                <option key={vendor.vendorAddress} value={index + 1}>
                  Hotel {index + 1} (Reputation: {vendor.reputationScore}/100)
                </option>
              ))}
            </select>
          </div>

          {/* Hotel Details */}
          {selectedVendor && vendorMetadata && (
            <div className="bg-white/5 rounded-lg p-4 border border-white/10">
              <h3 className="text-lg font-semibold text-white mb-2">{vendorMetadata.name}</h3>
              <p className="text-white/70 mb-2">{vendorMetadata.description}</p>
              <div className="flex items-center text-white/60">
                <span className="mr-2">📍</span>
                <span>{vendorMetadata.location?.city || 'Demo City'}, {vendorMetadata.location?.country || 'Demo Country'}</span>
              </div>
            </div>
          )}

          {/* Room Selection */}
          {vendorMetadata && vendorMetadata.roomTypes && (
            <div>
              <label className="block text-white font-medium mb-2">Select Room Type</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {vendorMetadata.roomTypes.map((room, index) => (
                  <div
                    key={index}
                    className={`p-4 border rounded-lg cursor-pointer transition-all ${
                      selectedRoom === room
                        ? 'border-cyan-400 bg-cyan-500/10'
                        : 'border-white/20 hover:border-white/40'
                    }`}
                    onClick={() => setSelectedRoom(room)}
                  >
                    <h4 className="font-semibold text-white">{room.type}</h4>
                    <p className="text-white/70 text-sm mb-2">{room.description}</p>
                    <div className="flex justify-between items-center">
                      <span className="text-white/60 text-sm">
                        Max {room.maxOccupancy} guests
                      </span>
                      <span className="text-cyan-400 font-medium">
                        {room.pricePerNight ? `${(Number(room.pricePerNight) / 1e18).toFixed(2)} ETH/night` : 'Price on request'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Dates and Guests */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-white font-medium mb-2">Check-in Date</label>
              <input
                type="date"
                value={formData.checkInDate}
                onChange={(e) => handleInputChange('checkInDate', e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
              />
            </div>
            <div>
              <label className="block text-white font-medium mb-2">Check-out Date</label>
              <input
                type="date"
                value={formData.checkOutDate}
                onChange={(e) => handleInputChange('checkOutDate', e.target.value)}
                min={formData.checkInDate || new Date().toISOString().split('T')[0]}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
              />
            </div>
            <div>
              <label className="block text-white font-medium mb-2">Number of Guests</label>
              <input
                type="number"
                min="1"
                max={selectedRoom?.maxOccupancy || 10}
                value={formData.guestCount}
                onChange={(e) => handleInputChange('guestCount', parseInt(e.target.value))}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
              />
            </div>
          </div>

          {/* Buffer Time */}
          <div>
            <label className="block text-white font-medium mb-2">
              Auto-release Buffer Time (hours after check-in)
            </label>
            <input
              type="number"
              min="1"
              max="168"
              value={formData.bufferTime}
              onChange={(e) => handleInputChange('bufferTime', parseInt(e.target.value))}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
            />
            <p className="text-white/60 text-sm mt-1">
              Payment will be automatically released to the hotel after this time if you don't confirm check-in
            </p>
          </div>

          {/* Special Requests */}
          <div>
            <label className="block text-white font-medium mb-2">Special Requests</label>
            <textarea
              value={formData.specialRequests}
              onChange={(e) => handleInputChange('specialRequests', e.target.value)}
              rows={3}
              placeholder="Any special requests or requirements..."
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-cyan-400"
            />
          </div>

          {/* Photo Upload */}
          <div>
            <label className="block text-white font-medium mb-2">Upload Photos (Optional)</label>
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handlePhotoUpload}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
            />
            {photos.length > 0 && (
              <p className="text-white/60 text-sm mt-1">
                {photos.length} photo{photos.length !== 1 ? 's' : ''} selected
              </p>
            )}
          </div>

          {/* Price Summary */}
          {selectedRoom && formData.checkInDate && formData.checkOutDate && (
            <div className="bg-white/5 rounded-lg p-4 border border-white/10">
              <h3 className="text-lg font-semibold text-white mb-2">Booking Summary</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-white/70">Room Type:</span>
                  <span className="text-white">{selectedRoom.type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/70">Nights:</span>
                  <span className="text-white">
                    {Math.ceil((new Date(formData.checkOutDate).getTime() - new Date(formData.checkInDate).getTime()) / (1000 * 60 * 60 * 24))}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/70">Price per night:</span>
                  <span className="text-white">
                    {selectedRoom.pricePerNight ? `${(Number(selectedRoom.pricePerNight) / 1e18).toFixed(2)} ETH` : 'Price on request'}
                  </span>
                </div>
                <div className="flex justify-between text-lg font-semibold border-t border-white/20 pt-2">
                  <span className="text-white">Total:</span>
                  <span className="text-cyan-400">
                    {selectedRoom.pricePerNight ? `${(calculateTotalPrice() / 1e18).toFixed(4)} ETH` : 'Price on request'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || !selectedRoom}
            className="w-full bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 disabled:from-gray-500 disabled:to-gray-600 text-white font-medium py-4 px-6 rounded-lg transition-all duration-300 transform hover:scale-105 disabled:transform-none disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Creating Booking...
              </div>
            ) : (
              'Create Booking & Pay'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
