import { useState, useEffect } from 'react';
import { contractService, Vendor, Booking, Dispute } from '@/utils/contracts';
import { ipfsService, HotelMetadata, CancellationPolicy } from '@/utils/ipfs';
import VendorList from './VendorList';
import BookingForm from './BookingForm';
import BookingHistory from './BookingHistory';
import DisputeCenter from './DisputeCenter';
import AdminDashboard from './AdminDashboard';
import CityHotelSearch from './CityHotelSearch';

export default function HotelBookingPage() {
  const [activeTab, setActiveTab] = useState<'search' | 'browse' | 'book' | 'history' | 'disputes' | 'admin'>('search');
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userAddress, setUserAddress] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      setLoading(true);
      setError(null);

      // Connect to wallet
      await contractService.connect();
      const address = await contractService.getAccount();
      setUserAddress(address);

      // Check if user is admin (you can implement this logic based on your requirements)
      setIsAdmin(false); // For now, set to false

      // Load initial data
      await loadVendors();
      await loadUserBookings();
      await loadUserDisputes();
    } catch (err) {
      console.error('Initialization error:', err);
      // Don't set error for demo mode, just show demo message
      if (contractService.isInDemoMode()) {
        console.log('Running in demo mode');
      } else {
        setError(err instanceof Error ? err.message : 'Failed to initialize app');
      }
    } finally {
      setLoading(false);
    }
  };

  const loadVendors = async () => {
    try {
      if (contractService.isInDemoMode()) {
        // Load mock vendors for demo mode
        const mockVendors: Vendor[] = [
          {
            vendorAddress: '0x1234567890123456789012345678901234567890',
            did: 'did:example:hotel1',
            metadataHash: 'QmMockHotel1Metadata',
            cancellationPolicyHash: 'QmMockPolicy1',
            isVerified: true,
            reputationScore: 95,
            registrationTime: Date.now() / 1000 - 86400 * 30, // 30 days ago
            isActive: true
          },
          {
            vendorAddress: '0x2345678901234567890123456789012345678901',
            did: 'did:example:hotel2',
            metadataHash: 'QmMockHotel2Metadata',
            cancellationPolicyHash: 'QmMockPolicy2',
            isVerified: true,
            reputationScore: 88,
            registrationTime: Date.now() / 1000 - 86400 * 15, // 15 days ago
            isActive: true
          },
          {
            vendorAddress: '0x3456789012345678901234567890123456789012',
            did: 'did:example:hotel3',
            metadataHash: 'QmMockHotel3Metadata',
            cancellationPolicyHash: 'QmMockPolicy3',
            isVerified: false,
            reputationScore: 72,
            registrationTime: Date.now() / 1000 - 86400 * 7, // 7 days ago
            isActive: true
          }
        ];
        setVendors(mockVendors);
        return;
      }

      const totalVendors = await contractService.getTotalVendors();
      const vendorPromises = [];
      
      for (let i = 1; i <= totalVendors; i++) {
        vendorPromises.push(contractService.getVendor(i));
      }
      
      const vendorList = await Promise.all(vendorPromises);
      setVendors(vendorList);
    } catch (err) {
      console.error('Failed to load vendors:', err);
    }
  };

  const loadUserBookings = async () => {
    if (!userAddress) return;
    
    try {
      if (contractService.isInDemoMode()) {
        // Load mock bookings for demo mode
        const mockBookings: Booking[] = [
          {
            bookingId: 1,
            traveler: userAddress,
            vendorId: 1,
            amount: '1000000000000000000', // 1 ETH in wei
            checkInTime: Date.now() / 1000 + 86400 * 7, // 7 days from now
            checkOutTime: Date.now() / 1000 + 86400 * 10, // 10 days from now
            bufferTime: 3600, // 1 hour
            roomDetailsHash: 'QmMockRoomDetails1',
            status: 0, // Active
            createdAt: Date.now() / 1000 - 86400, // 1 day ago
            autoReleaseEnabled: true
          }
        ];
        setBookings(mockBookings);
        return;
      }

      const bookingIds = await contractService.getTravelerBookings(userAddress);
      const bookingPromises = bookingIds.map(id => contractService.getBooking(id));
      const bookingList = await Promise.all(bookingPromises);
      setBookings(bookingList);
    } catch (err) {
      console.error('Failed to load bookings:', err);
    }
  };

  const loadUserDisputes = async () => {
    if (!userAddress) return;
    
    try {
      if (contractService.isInDemoMode()) {
        // Load mock disputes for demo mode
        const mockDisputes: Dispute[] = [
          {
            disputeId: 1,
            bookingId: 1,
            traveler: userAddress,
            vendorId: 1,
            disputeType: 0, // ServiceQuality
            description: 'Room was not as described in the listing',
            initialEvidenceHash: 'QmMockEvidence1',
            status: 0, // Open
            createdAt: Date.now() / 1000 - 3600, // 1 hour ago
            resolvedAt: 0,
            resolvedBy: '',
            favorTraveler: false,
            resolution: '',
            reputationImpact: 0
          }
        ];
        setDisputes(mockDisputes);
        return;
      }

      const disputeIds = await contractService.getTravelerDisputes(userAddress);
      const disputePromises = disputeIds.map(id => contractService.getDispute(id));
      const disputeList = await Promise.all(disputePromises);
      setDisputes(disputeList);
    } catch (err) {
      console.error('Failed to load disputes:', err);
    }
  };

  const handleBookingCreated = () => {
    loadUserBookings();
  };

  const handleDisputeCreated = () => {
    loadUserDisputes();
  };

  const handleHotelsFound = (foundVendors: Vendor[]) => {
    setVendors(foundVendors);
    setActiveTab('browse'); // Switch to browse tab to show results
  };

  const handleSearchLoadingChange = (isLoading: boolean) => {
    setLoading(isLoading);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-purple-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto mb-4"></div>
          <p className="text-white/80">Connecting to blockchain...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-purple-950 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="text-red-400 text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-white mb-2">Connection Error</h2>
          <p className="text-white/80 mb-4">{error}</p>
          <button
            onClick={initializeApp}
            className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-purple-950 text-white">
      {/* Header */}
      <div className="border-b border-white/10 bg-black/20 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                🏨 Hotel Booking Platform
              </h1>
              <p className="text-sm text-white/60">
                Blockchain-powered secure hotel bookings
              </p>
            </div>
            <div className="flex items-center space-x-4">
              {contractService.isInDemoMode() && (
                <div className="px-3 py-1 bg-yellow-500/20 border border-yellow-500/50 rounded-lg">
                  <span className="text-yellow-400 text-sm font-medium">🎭 Demo Mode</span>
                </div>
              )}
              {userAddress && (
                <div className="text-sm">
                  <span className="text-white/60">Connected:</span>
                  <span className="ml-2 font-mono text-cyan-400">
                    {userAddress.slice(0, 6)}...{userAddress.slice(-4)}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-white/10 bg-black/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {[
              { id: 'search', label: 'Search Hotels', icon: '🔍' },
              { id: 'browse', label: 'Browse Hotels', icon: '🏨' },
              { id: 'book', label: 'Make Booking', icon: '📅' },
              { id: 'history', label: 'My Bookings', icon: '📋' },
              { id: 'disputes', label: 'Disputes', icon: '⚖️' },
              ...(isAdmin ? [{ id: 'admin', label: 'Admin', icon: '👨‍💼' }] : []),
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-cyan-400 text-cyan-400'
                    : 'border-transparent text-white/60 hover:text-white/80 hover:border-white/20'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'search' && (
          <CityHotelSearch 
            onHotelsFound={handleHotelsFound}
            onLoadingChange={handleSearchLoadingChange}
          />
        )}
        
        {activeTab === 'browse' && (
          <VendorList 
            vendors={vendors} 
            onVendorSelect={(vendor) => {
              setActiveTab('book');
              // You can pass the selected vendor to the booking form
            }}
          />
        )}
        
        {activeTab === 'book' && (
          <BookingForm 
            vendors={vendors}
            onBookingCreated={handleBookingCreated}
          />
        )}
        
        {activeTab === 'history' && (
          <BookingHistory 
            bookings={bookings}
            vendors={vendors}
            onRefresh={loadUserBookings}
          />
        )}
        
        {activeTab === 'disputes' && (
          <DisputeCenter 
            disputes={disputes}
            bookings={bookings}
            vendors={vendors}
            onDisputeCreated={handleDisputeCreated}
            onRefresh={loadUserDisputes}
          />
        )}
        
        {activeTab === 'admin' && isAdmin && (
          <AdminDashboard 
            vendors={vendors}
            onVendorUpdate={loadVendors}
          />
        )}
      </div>
    </div>
  );
}
