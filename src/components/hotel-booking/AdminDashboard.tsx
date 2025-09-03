import { useState, useEffect } from 'react';
import { Vendor, Booking, Dispute, BookingStatus, DisputeStatus, getBookingStatusText, getDisputeStatusText, formatEther, formatDateTime } from '@/utils/contracts';
import { ipfsService, HotelMetadata } from '@/utils/ipfs';
import { contractService } from '@/utils/contracts';

interface AdminDashboardProps {
  vendors: Vendor[];
  onVendorUpdate: () => void;
}

export default function AdminDashboard({ vendors, onVendorUpdate }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<'vendors' | 'bookings' | 'disputes'>('vendors');
  const [allBookings, setAllBookings] = useState<Booking[]>([]);
  const [allDisputes, setAllDisputes] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Load all bookings and disputes
      const totalBookings = await contractService.getTotalBookings();
      const totalDisputes = await contractService.getTotalDisputes();

      const bookingPromises = [];
      const disputePromises = [];

      for (let i = 1; i <= totalBookings; i++) {
        bookingPromises.push(contractService.getBooking(i));
      }

      for (let i = 1; i <= totalDisputes; i++) {
        disputePromises.push(contractService.getDispute(i));
      }

      const [bookings, disputes] = await Promise.all([
        Promise.all(bookingPromises),
        Promise.all(disputePromises)
      ]);

      setAllBookings(bookings);
      setAllDisputes(disputes);
    } catch (err) {
      setError('Failed to load admin data');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyVendor = async (vendorId: number, verified: boolean) => {
    setActionLoading(vendorId);
    try {
      // Note: This would require admin contract functions
      // For now, we'll just show a message
      alert(`Vendor ${vendorId} verification status would be updated to: ${verified}`);
      onVendorUpdate();
    } catch (err) {
      console.error('Failed to verify vendor:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleUpdateReputation = async (vendorId: number, newScore: number) => {
    setActionLoading(vendorId);
    try {
      // Note: This would require admin contract functions
      // For now, we'll just show a message
      alert(`Vendor ${vendorId} reputation would be updated to: ${newScore}`);
      onVendorUpdate();
    } catch (err) {
      console.error('Failed to update reputation:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleResolveDispute = async (disputeId: number, favorTraveler: boolean, resolution: string, reputationImpact: number) => {
    setActionLoading(disputeId);
    try {
      // Note: This would require admin contract functions
      // For now, we'll just show a message
      alert(`Dispute ${disputeId} would be resolved with outcome: ${favorTraveler ? 'Favor Traveler' : 'Favor Vendor'}`);
      loadAllData();
    } catch (err) {
      console.error('Failed to resolve dispute:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusColor = (status: BookingStatus | DisputeStatus) => {
    switch (status) {
      case BookingStatus.Active:
        return 'bg-blue-500/20 text-blue-400 border-blue-500/50';
      case BookingStatus.CheckedIn:
        return 'bg-green-500/20 text-green-400 border-green-500/50';
      case BookingStatus.Completed:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/50';
      case BookingStatus.Cancelled:
        return 'bg-red-500/20 text-red-400 border-red-500/50';
      case BookingStatus.Disputed:
        return 'bg-orange-500/20 text-orange-400 border-orange-500/50';
      case DisputeStatus.Open:
        return 'bg-blue-500/20 text-blue-400 border-blue-500/50';
      case DisputeStatus.UnderReview:
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50';
      case DisputeStatus.Resolved:
        return 'bg-green-500/20 text-green-400 border-green-500/50';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/50';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400 mx-auto mb-4"></div>
          <p className="text-white/80">Loading admin data...</p>
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
          onClick={loadAllData}
          className="mt-4 px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Admin Dashboard</h2>
        <button
          onClick={loadAllData}
          className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg transition-colors"
        >
          Refresh
        </button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-4">
          <div className="text-2xl font-bold text-cyan-400">{vendors.length}</div>
          <div className="text-white/60 text-sm">Total Vendors</div>
        </div>
        <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-4">
          <div className="text-2xl font-bold text-green-400">{allBookings.length}</div>
          <div className="text-white/60 text-sm">Total Bookings</div>
        </div>
        <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-4">
          <div className="text-2xl font-bold text-orange-400">{allDisputes.length}</div>
          <div className="text-white/60 text-sm">Total Disputes</div>
        </div>
        <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-4">
          <div className="text-2xl font-bold text-purple-400">
            {allDisputes.filter(d => d.status === DisputeStatus.Open).length}
          </div>
          <div className="text-white/60 text-sm">Open Disputes</div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-white/10">
        <nav className="flex space-x-8">
          {[
            { id: 'vendors', label: 'Vendor Management', icon: '🏨' },
            { id: 'bookings', label: 'Booking Overview', icon: '📋' },
            { id: 'disputes', label: 'Dispute Resolution', icon: '⚖️' },
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

      {/* Tab Content */}
      {activeTab === 'vendors' && (
        <VendorManagement
          vendors={vendors}
          onVerifyVendor={handleVerifyVendor}
          onUpdateReputation={handleUpdateReputation}
          actionLoading={actionLoading}
        />
      )}

      {activeTab === 'bookings' && (
        <BookingOverview bookings={allBookings} vendors={vendors} />
      )}

      {activeTab === 'disputes' && (
        <DisputeResolution
          disputes={allDisputes}
          bookings={allBookings}
          vendors={vendors}
          onResolveDispute={handleResolveDispute}
          actionLoading={actionLoading}
        />
      )}
    </div>
  );
}

// Vendor Management Component
function VendorManagement({ vendors, onVerifyVendor, onUpdateReputation, actionLoading }: {
  vendors: Vendor[];
  onVerifyVendor: (vendorId: number, verified: boolean) => void;
  onUpdateReputation: (vendorId: number, newScore: number) => void;
  actionLoading: number | null;
}) {
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [vendorMetadata, setVendorMetadata] = useState<HotelMetadata | null>(null);

  const loadVendorMetadata = async (vendor: Vendor) => {
    try {
      const metadata = await ipfsService.getJSON(vendor.metadataHash);
      setVendorMetadata(metadata);
    } catch (err) {
      console.error('Failed to load vendor metadata:', err);
    }
  };

  const handleVendorSelect = (vendor: Vendor) => {
    setSelectedVendor(vendor);
    loadVendorMetadata(vendor);
  };

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold text-white">Vendor Management</h3>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Vendor List */}
        <div className="space-y-4">
          {vendors.map((vendor, index) => (
            <div
              key={vendor.vendorAddress}
              className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-4 hover:border-white/20 transition-all cursor-pointer"
              onClick={() => handleVendorSelect(vendor)}
            >
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold text-white">Vendor #{index + 1}</h4>
                <div className="flex gap-2">
                  {vendor.isVerified && (
                    <span className="bg-green-500/20 text-green-400 px-2 py-1 rounded-full text-xs">
                      ✓ Verified
                    </span>
                  )}
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    vendor.reputationScore >= 80 ? 'bg-green-500/20 text-green-400' :
                    vendor.reputationScore >= 60 ? 'bg-yellow-500/20 text-yellow-400' :
                    'bg-red-500/20 text-red-400'
                  }`}>
                    {vendor.reputationScore}/100
                  </span>
                </div>
              </div>
              <div className="text-white/60 text-sm">
                Address: {vendor.vendorAddress.slice(0, 6)}...{vendor.vendorAddress.slice(-4)}
              </div>
              <div className="text-white/60 text-sm">
                Registered: {formatDateTime(vendor.registrationTime)}
              </div>
            </div>
          ))}
        </div>

        {/* Vendor Details */}
        {selectedVendor && (
          <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-6">
            <h4 className="text-lg font-semibold text-white mb-4">
              Vendor #{vendors.indexOf(selectedVendor) + 1} Details
            </h4>
            
            {vendorMetadata && (
              <div className="space-y-4 mb-6">
                <div>
                  <div className="text-white/60 text-sm">Hotel Name</div>
                  <div className="text-white">{vendorMetadata.name}</div>
                </div>
                <div>
                  <div className="text-white/60 text-sm">Location</div>
                  <div className="text-white">
                    {vendorMetadata.location.city}, {vendorMetadata.location.country}
                  </div>
                </div>
                <div>
                  <div className="text-white/60 text-sm">Description</div>
                  <div className="text-white text-sm">{vendorMetadata.description}</div>
                </div>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <div className="text-white/60 text-sm">Verification Status</div>
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={() => onVerifyVendor(vendors.indexOf(selectedVendor) + 1, true)}
                    disabled={actionLoading === vendors.indexOf(selectedVendor) + 1}
                    className={`px-3 py-1 rounded text-sm ${
                      selectedVendor.isVerified
                        ? 'bg-green-500/20 text-green-400 border border-green-500/50'
                        : 'bg-white/10 hover:bg-green-500/20 text-white hover:text-green-400'
                    }`}
                  >
                    Verify
                  </button>
                  <button
                    onClick={() => onVerifyVendor(vendors.indexOf(selectedVendor) + 1, false)}
                    disabled={actionLoading === vendors.indexOf(selectedVendor) + 1}
                    className={`px-3 py-1 rounded text-sm ${
                      !selectedVendor.isVerified
                        ? 'bg-red-500/20 text-red-400 border border-red-500/50'
                        : 'bg-white/10 hover:bg-red-500/20 text-white hover:text-red-400'
                    }`}
                  >
                    Unverify
                  </button>
                </div>
              </div>

              <div>
                <div className="text-white/60 text-sm">Reputation Score</div>
                <div className="flex items-center gap-2 mt-2">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    defaultValue={selectedVendor.reputationScore}
                    className="w-20 px-2 py-1 bg-white/10 border border-white/20 rounded text-white text-sm"
                  />
                  <button
                    onClick={() => {
                      const input = document.querySelector('input[type="number"]') as HTMLInputElement;
                      const newScore = parseInt(input.value);
                      if (newScore >= 0 && newScore <= 100) {
                        onUpdateReputation(vendors.indexOf(selectedVendor) + 1, newScore);
                      }
                    }}
                    disabled={actionLoading === vendors.indexOf(selectedVendor) + 1}
                    className="px-3 py-1 bg-cyan-500 hover:bg-cyan-600 disabled:bg-gray-500 text-white rounded text-sm"
                  >
                    Update
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Booking Overview Component
function BookingOverview({ bookings, vendors }: { bookings: Booking[]; vendors: Vendor[] }) {
  return (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold text-white">Booking Overview</h3>
      
      <div className="space-y-4">
        {bookings.map((booking) => (
          <div
            key={booking.bookingId}
            className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-4"
          >
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold text-white">Booking #{booking.bookingId}</h4>
              <span className={`px-3 py-1 rounded-full text-sm border ${
                booking.status === BookingStatus.Active ? 'bg-blue-500/20 text-blue-400 border-blue-500/50' :
                booking.status === BookingStatus.CheckedIn ? 'bg-green-500/20 text-green-400 border-green-500/50' :
                booking.status === BookingStatus.Completed ? 'bg-gray-500/20 text-gray-400 border-gray-500/50' :
                booking.status === BookingStatus.Cancelled ? 'bg-red-500/20 text-red-400 border-red-500/50' :
                'bg-orange-500/20 text-orange-400 border-orange-500/50'
              }`}>
                {getBookingStatusText(booking.status)}
              </span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <div className="text-white/60">Traveler</div>
                <div className="text-white font-mono">
                  {booking.traveler.slice(0, 6)}...{booking.traveler.slice(-4)}
                </div>
              </div>
              <div>
                <div className="text-white/60">Amount</div>
                <div className="text-cyan-400 font-semibold">{formatEther(booking.amount)} ETH</div>
              </div>
              <div>
                <div className="text-white/60">Check-in</div>
                <div className="text-white">{formatDateTime(booking.checkInTime)}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Dispute Resolution Component
function DisputeResolution({ disputes, bookings, vendors, onResolveDispute, actionLoading }: {
  disputes: Dispute[];
  bookings: Booking[];
  vendors: Vendor[];
  onResolveDispute: (disputeId: number, favorTraveler: boolean, resolution: string, reputationImpact: number) => void;
  actionLoading: number | null;
}) {
  const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null);
  const [resolutionForm, setResolutionForm] = useState({
    favorTraveler: true,
    resolution: '',
    reputationImpact: 0,
  });

  const handleResolve = (dispute: Dispute) => {
    if (!resolutionForm.resolution.trim()) {
      alert('Please provide a resolution description');
      return;
    }

    onResolveDispute(
      dispute.disputeId,
      resolutionForm.favorTraveler,
      resolutionForm.resolution,
      resolutionForm.reputationImpact
    );
  };

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold text-white">Dispute Resolution</h3>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Dispute List */}
        <div className="space-y-4">
          {disputes.map((dispute) => (
            <div
              key={dispute.disputeId}
              className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-4 hover:border-white/20 transition-all cursor-pointer"
              onClick={() => setSelectedDispute(dispute)}
            >
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold text-white">Dispute #{dispute.disputeId}</h4>
                <span className={`px-3 py-1 rounded-full text-sm border ${
                  dispute.status === DisputeStatus.Open ? 'bg-blue-500/20 text-blue-400 border-blue-500/50' :
                  dispute.status === DisputeStatus.UnderReview ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50' :
                  'bg-green-500/20 text-green-400 border-green-500/50'
                }`}>
                  {getDisputeStatusText(dispute.status)}
                </span>
              </div>
              
              <div className="text-white/70 text-sm mb-2">{dispute.description}</div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-white/60">Booking</div>
                  <div className="text-white">#{dispute.bookingId}</div>
                </div>
                <div>
                  <div className="text-white/60">Created</div>
                  <div className="text-white">{formatDateTime(dispute.createdAt)}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Dispute Resolution */}
        {selectedDispute && (
          <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-6">
            <h4 className="text-lg font-semibold text-white mb-4">
              Resolve Dispute #{selectedDispute.disputeId}
            </h4>
            
            <div className="space-y-4 mb-6">
              <div>
                <div className="text-white/60 text-sm">Description</div>
                <div className="text-white text-sm">{selectedDispute.description}</div>
              </div>
              
              <div>
                <div className="text-white/60 text-sm">Booking ID</div>
                <div className="text-white">#{selectedDispute.bookingId}</div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-white font-medium mb-2">Resolution</label>
                <textarea
                  value={resolutionForm.resolution}
                  onChange={(e) => setResolutionForm(prev => ({ ...prev, resolution: e.target.value }))}
                  rows={3}
                  placeholder="Describe the resolution..."
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                />
              </div>

              <div>
                <label className="block text-white font-medium mb-2">Outcome</label>
                <div className="flex gap-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      checked={resolutionForm.favorTraveler}
                      onChange={() => setResolutionForm(prev => ({ ...prev, favorTraveler: true }))}
                      className="mr-2"
                    />
                    <span className="text-white">Favor Traveler</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      checked={!resolutionForm.favorTraveler}
                      onChange={() => setResolutionForm(prev => ({ ...prev, favorTraveler: false }))}
                      className="mr-2"
                    />
                    <span className="text-white">Favor Vendor</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-white font-medium mb-2">Reputation Impact (-10 to +10)</label>
                <input
                  type="number"
                  min="-10"
                  max="10"
                  value={resolutionForm.reputationImpact}
                  onChange={(e) => setResolutionForm(prev => ({ ...prev, reputationImpact: parseInt(e.target.value) }))}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
                />
              </div>

              <button
                onClick={() => handleResolve(selectedDispute)}
                disabled={actionLoading === selectedDispute.disputeId}
                className="w-full px-4 py-3 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-500 text-white rounded-lg transition-colors"
              >
                {actionLoading === selectedDispute.disputeId ? 'Resolving...' : 'Resolve Dispute'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
