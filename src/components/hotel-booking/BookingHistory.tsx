import { useState, useEffect } from 'react';
import { Booking, Vendor, BookingStatus, getBookingStatusText, formatEther, formatDateTime } from '@/utils/contracts';
import { ipfsService, RoomDetails } from '@/utils/ipfs';
import { contractService } from '@/utils/contracts';

interface BookingHistoryProps {
  bookings: Booking[];
  vendors: Vendor[];
  onRefresh: () => void;
}

interface BookingWithDetails extends Booking {
  vendor?: Vendor;
  roomDetails?: RoomDetails;
}

export default function BookingHistory({ bookings, vendors, onRefresh }: BookingHistoryProps) {
  const [bookingsWithDetails, setBookingsWithDetails] = useState<BookingWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<BookingWithDetails | null>(null);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  useEffect(() => {
    loadBookingDetails();
  }, [bookings]);

  const loadBookingDetails = async () => {
    setLoading(true);
    setError(null);

    try {
      const bookingsWithMeta = await Promise.all(
        bookings.map(async (booking) => {
          try {
            const vendor = vendors.find(v => v.vendorAddress === vendors[booking.vendorId - 1]?.vendorAddress);
            
            // In demo mode, create mock room details instead of fetching from IPFS
            let roomDetails;
            if (contractService.isInDemoMode()) {
              roomDetails = {
                roomType: 'Standard Room',
                amenities: ['WiFi', 'TV', 'Air Conditioning'],
                photos: ['https://via.placeholder.com/800x600/4F46E5/FFFFFF?text=Room+Image'],
                specialRequests: 'Demo special requests',
                guestCount: 2,
                pricePerNight: 100,
                totalNights: 3
              };
            } else {
              roomDetails = await ipfsService.getJSON(booking.roomDetailsHash);
            }

            return {
              ...booking,
              vendor,
              roomDetails,
            };
          } catch (err) {
            console.error(`Failed to load details for booking ${booking.bookingId}:`, err);
            return booking;
          }
        })
      );

      setBookingsWithDetails(bookingsWithMeta);
    } catch (err) {
      setError('Failed to load booking details');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmCheckIn = async (bookingId: number) => {
    setActionLoading(bookingId);
    try {
      const tx = await contractService.confirmCheckIn(bookingId);
      await tx.wait();
      onRefresh();
    } catch (err) {
      console.error('Failed to confirm check-in:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReleasePayment = async (bookingId: number) => {
    setActionLoading(bookingId);
    try {
      const tx = await contractService.releasePayment(bookingId);
      await tx.wait();
      onRefresh();
    } catch (err) {
      console.error('Failed to release payment:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancelBooking = async (bookingId: number) => {
    const reason = prompt('Please provide a reason for cancellation:');
    if (!reason) return;

    setActionLoading(bookingId);
    try {
      const tx = await contractService.cancelBooking(bookingId, reason);
      await tx.wait();
      onRefresh();
    } catch (err) {
      console.error('Failed to cancel booking:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleRaiseDispute = async (bookingId: number) => {
    const evidence = prompt('Please describe the issue and provide evidence:');
    if (!evidence) return;

    setActionLoading(bookingId);
    try {
      // Upload evidence to IPFS
      const evidenceHash = await ipfsService.uploadJSON({
        description: evidence,
        timestamp: new Date().toISOString(),
        type: 'dispute_evidence'
      });

      const tx = await contractService.raiseDispute(bookingId, evidenceHash);
      await tx.wait();
      onRefresh();
    } catch (err) {
      console.error('Failed to raise dispute:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusColor = (status: BookingStatus) => {
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
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/50';
    }
  };

  const canConfirmCheckIn = (booking: Booking) => {
    return booking.status === BookingStatus.Active && 
           new Date(booking.checkInTime * 1000) <= new Date();
  };

  const canReleasePayment = (booking: Booking) => {
    return booking.status === BookingStatus.CheckedIn ||
           (booking.status === BookingStatus.Active && 
            new Date() >= new Date((booking.checkInTime + booking.bufferTime) * 1000));
  };

  const canCancel = (booking: Booking) => {
    return booking.status === BookingStatus.Active &&
           new Date() < new Date((booking.checkInTime - 24 * 3600) * 1000); // 24 hours before check-in
  };

  const canRaiseDispute = (booking: Booking) => {
    return booking.status === BookingStatus.Active || booking.status === BookingStatus.CheckedIn;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400 mx-auto mb-4"></div>
          <p className="text-white/80">Loading booking history...</p>
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
          onClick={loadBookingDetails}
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
        <h2 className="text-2xl font-bold text-white">My Bookings</h2>
        <button
          onClick={onRefresh}
          className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg transition-colors"
        >
          Refresh
        </button>
      </div>

      {bookingsWithDetails.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4 opacity-50">📋</div>
          <h3 className="text-xl font-semibold text-white mb-2">No bookings found</h3>
          <p className="text-white/60">
            You haven't made any bookings yet. Start by browsing available hotels!
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {bookingsWithDetails.map((booking) => (
            <div
              key={booking.bookingId}
              className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-6 hover:border-white/20 transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-white">
                    Booking #{booking.bookingId}
                  </h3>
                  <p className="text-white/60">
                    {booking.vendor?.metadataHash ? 'Hotel details available' : 'Hotel: ' + booking.vendor?.vendorAddress}
                  </p>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(booking.status)}`}>
                  {getBookingStatusText(booking.status)}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <div className="text-white/60 text-sm">Check-in</div>
                  <div className="text-white">{formatDateTime(booking.checkInTime)}</div>
                </div>
                <div>
                  <div className="text-white/60 text-sm">Check-out</div>
                  <div className="text-white">{formatDateTime(booking.checkOutTime)}</div>
                </div>
                <div>
                  <div className="text-white/60 text-sm">Total Amount</div>
                  <div className="text-cyan-400 font-semibold">{formatEther(booking.amount)} ETH</div>
                </div>
              </div>

              {booking.roomDetails && (
                <div className="mb-4">
                  <div className="text-white/60 text-sm mb-1">Room Details</div>
                  <div className="text-white">
                    {booking.roomDetails.roomType} • {booking.roomDetails.guestCount} guest{booking.roomDetails.guestCount !== 1 ? 's' : ''}
                  </div>
                  {booking.roomDetails.specialRequests && (
                    <div className="text-white/70 text-sm mt-1">
                      Special requests: {booking.roomDetails.specialRequests}
                    </div>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-2">
                {canConfirmCheckIn(booking) && (
                  <button
                    onClick={() => handleConfirmCheckIn(booking.bookingId)}
                    disabled={actionLoading === booking.bookingId}
                    className="px-4 py-2 bg-green-500 hover:bg-green-600 disabled:bg-gray-500 text-white rounded-lg transition-colors text-sm"
                  >
                    {actionLoading === booking.bookingId ? 'Confirming...' : 'Confirm Check-in'}
                  </button>
                )}

                {canReleasePayment(booking) && (
                  <button
                    onClick={() => handleReleasePayment(booking.bookingId)}
                    disabled={actionLoading === booking.bookingId}
                    className="px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-500 text-white rounded-lg transition-colors text-sm"
                  >
                    {actionLoading === booking.bookingId ? 'Releasing...' : 'Release Payment'}
                  </button>
                )}

                {canCancel(booking) && (
                  <button
                    onClick={() => handleCancelBooking(booking.bookingId)}
                    disabled={actionLoading === booking.bookingId}
                    className="px-4 py-2 bg-red-500 hover:bg-red-600 disabled:bg-gray-500 text-white rounded-lg transition-colors text-sm"
                  >
                    {actionLoading === booking.bookingId ? 'Cancelling...' : 'Cancel Booking'}
                  </button>
                )}

                {canRaiseDispute(booking) && (
                  <button
                    onClick={() => handleRaiseDispute(booking.bookingId)}
                    disabled={actionLoading === booking.bookingId}
                    className="px-4 py-2 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-500 text-white rounded-lg transition-colors text-sm"
                  >
                    {actionLoading === booking.bookingId ? 'Raising...' : 'Raise Dispute'}
                  </button>
                )}

                <button
                  onClick={() => setSelectedBooking(booking)}
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors text-sm"
                >
                  View Details
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Booking Details Modal */}
      {selectedBooking && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 rounded-xl border border-white/10 p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-white">
                Booking #{selectedBooking.bookingId} Details
              </h3>
              <button
                onClick={() => setSelectedBooking(null)}
                className="text-white/60 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-white/60 text-sm">Status</div>
                  <div className={`inline-block px-2 py-1 rounded text-sm border ${getStatusColor(selectedBooking.status)}`}>
                    {getBookingStatusText(selectedBooking.status)}
                  </div>
                </div>
                <div>
                  <div className="text-white/60 text-sm">Amount</div>
                  <div className="text-cyan-400 font-semibold">{formatEther(selectedBooking.amount)} ETH</div>
                </div>
              </div>

              <div>
                <div className="text-white/60 text-sm">Check-in Time</div>
                <div className="text-white">{formatDateTime(selectedBooking.checkInTime)}</div>
              </div>

              <div>
                <div className="text-white/60 text-sm">Check-out Time</div>
                <div className="text-white">{formatDateTime(selectedBooking.checkOutTime)}</div>
              </div>

              <div>
                <div className="text-white/60 text-sm">Buffer Time</div>
                <div className="text-white">{selectedBooking.bufferTime / 3600} hours</div>
              </div>

              {selectedBooking.roomDetails && (
                <div>
                  <div className="text-white/60 text-sm">Room Details</div>
                  <div className="text-white">
                    <div>Type: {selectedBooking.roomDetails.roomType}</div>
                    <div>Guests: {selectedBooking.roomDetails.guestCount}</div>
                    <div>Nights: {selectedBooking.roomDetails.totalNights}</div>
                    {selectedBooking.roomDetails.specialRequests && (
                      <div>Special Requests: {selectedBooking.roomDetails.specialRequests}</div>
                    )}
                  </div>
                </div>
              )}

              <div>
                <div className="text-white/60 text-sm">Created At</div>
                <div className="text-white">{formatDateTime(selectedBooking.createdAt)}</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
