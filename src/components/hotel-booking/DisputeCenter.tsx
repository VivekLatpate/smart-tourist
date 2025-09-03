import { useState, useEffect } from 'react';
import { Dispute, Booking, Vendor, DisputeStatus, DisputeType, getDisputeStatusText, getDisputeTypeText, formatDateTime } from '@/utils/contracts';
import { ipfsService } from '@/utils/ipfs';
import { contractService } from '@/utils/contracts';

interface DisputeCenterProps {
  disputes: Dispute[];
  bookings: Booking[];
  vendors: Vendor[];
  onDisputeCreated: () => void;
  onRefresh: () => void;
}

interface DisputeWithDetails extends Dispute {
  booking?: Booking;
  vendor?: Vendor;
  evidence?: any[];
}

export default function DisputeCenter({ disputes, bookings, vendors, onDisputeCreated, onRefresh }: DisputeCenterProps) {
  const [disputesWithDetails, setDisputesWithDetails] = useState<DisputeWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDispute, setSelectedDispute] = useState<DisputeWithDetails | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  useEffect(() => {
    loadDisputeDetails();
  }, [disputes]);

  const loadDisputeDetails = async () => {
    setLoading(true);
    setError(null);

    try {
      const disputesWithMeta = await Promise.all(
        disputes.map(async (dispute) => {
          try {
            const booking = bookings.find(b => b.bookingId === dispute.bookingId);
            const vendor = vendors.find(v => v.vendorAddress === vendors[dispute.vendorId - 1]?.vendorAddress);
            const evidence = await contractService.getDisputeEvidence(dispute.disputeId);

            return {
              ...dispute,
              booking,
              vendor,
              evidence,
            };
          } catch (err) {
            console.error(`Failed to load details for dispute ${dispute.disputeId}:`, err);
            return dispute;
          }
        })
      );

      setDisputesWithDetails(disputesWithMeta);
    } catch (err) {
      setError('Failed to load dispute details');
    } finally {
      setLoading(false);
    }
  };

  const handleAddEvidence = async (disputeId: number) => {
    const description = prompt('Please describe the evidence:');
    if (!description) return;

    const evidence = prompt('Please provide evidence details:');
    if (!evidence) return;

    setActionLoading(disputeId);
    try {
      // Upload evidence to IPFS
      const evidenceHash = await ipfsService.uploadJSON({
        description,
        evidence,
        timestamp: new Date().toISOString(),
        type: 'additional_evidence'
      });

      const tx = await contractService.addEvidence(disputeId, evidenceHash, description);
      await tx.wait();
      onRefresh();
    } catch (err) {
      console.error('Failed to add evidence:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusColor = (status: DisputeStatus) => {
    switch (status) {
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

  const getTypeColor = (type: DisputeType) => {
    switch (type) {
      case DisputeType.ServiceQuality:
        return 'bg-purple-500/20 text-purple-400';
      case DisputeType.Cancellation:
        return 'bg-orange-500/20 text-orange-400';
      case DisputeType.Payment:
        return 'bg-red-500/20 text-red-400';
      case DisputeType.PropertyCondition:
        return 'bg-blue-500/20 text-blue-400';
      case DisputeType.Other:
        return 'bg-gray-500/20 text-gray-400';
      default:
        return 'bg-gray-500/20 text-gray-400';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400 mx-auto mb-4"></div>
          <p className="text-white/80">Loading disputes...</p>
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
          onClick={loadDisputeDetails}
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
        <h2 className="text-2xl font-bold text-white">Dispute Center</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setShowCreateForm(true)}
            className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors"
          >
            Create Dispute
          </button>
          <button
            onClick={onRefresh}
            className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>

      {disputesWithDetails.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4 opacity-50">⚖️</div>
          <h3 className="text-xl font-semibold text-white mb-2">No disputes found</h3>
          <p className="text-white/60">
            You haven't raised any disputes yet. If you have issues with a booking, you can create a dispute.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {disputesWithDetails.map((dispute) => (
            <div
              key={dispute.disputeId}
              className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-6 hover:border-white/20 transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-white">
                    Dispute #{dispute.disputeId}
                  </h3>
                  <p className="text-white/60">
                    Booking #{dispute.bookingId} • {dispute.vendor?.metadataHash ? 'Hotel details available' : 'Vendor: ' + dispute.vendor?.vendorAddress}
                  </p>
                </div>
                <div className="flex gap-2">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(dispute.status)}`}>
                    {getDisputeStatusText(dispute.status)}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getTypeColor(dispute.disputeType)}`}>
                    {getDisputeTypeText(dispute.disputeType)}
                  </span>
                </div>
              </div>

              <div className="mb-4">
                <div className="text-white/60 text-sm mb-1">Description</div>
                <div className="text-white">{dispute.description}</div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <div className="text-white/60 text-sm">Created</div>
                  <div className="text-white">{formatDateTime(dispute.createdAt)}</div>
                </div>
                {dispute.resolvedAt > 0 && (
                  <div>
                    <div className="text-white/60 text-sm">Resolved</div>
                    <div className="text-white">{formatDateTime(dispute.resolvedAt)}</div>
                  </div>
                )}
                {dispute.evidence && (
                  <div>
                    <div className="text-white/60 text-sm">Evidence</div>
                    <div className="text-white">{dispute.evidence.length} item{dispute.evidence.length !== 1 ? 's' : ''}</div>
                  </div>
                )}
              </div>

              {dispute.resolution && (
                <div className="mb-4 p-4 bg-white/5 rounded-lg border border-white/10">
                  <div className="text-white/60 text-sm mb-1">Resolution</div>
                  <div className="text-white">{dispute.resolution}</div>
                  <div className="text-white/60 text-sm mt-2">
                    Outcome: {dispute.favorTraveler ? 'Favor Traveler' : 'Favor Vendor'}
                    {dispute.reputationImpact !== 0 && (
                      <span className="ml-2">
                        (Reputation impact: {dispute.reputationImpact > 0 ? '+' : ''}{dispute.reputationImpact})
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-2">
                {dispute.status === DisputeStatus.Open && (
                  <button
                    onClick={() => handleAddEvidence(dispute.disputeId)}
                    disabled={actionLoading === dispute.disputeId}
                    className="px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-500 text-white rounded-lg transition-colors text-sm"
                  >
                    {actionLoading === dispute.disputeId ? 'Adding...' : 'Add Evidence'}
                  </button>
                )}

                <button
                  onClick={() => setSelectedDispute(dispute)}
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors text-sm"
                >
                  View Details
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Dispute Modal */}
      {showCreateForm && (
        <CreateDisputeModal
          bookings={bookings}
          onClose={() => setShowCreateForm(false)}
          onDisputeCreated={() => {
            onDisputeCreated();
            setShowCreateForm(false);
          }}
        />
      )}

      {/* Dispute Details Modal */}
      {selectedDispute && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 rounded-xl border border-white/10 p-6 max-w-4xl w-full max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-white">
                Dispute #{selectedDispute.disputeId} Details
              </h3>
              <button
                onClick={() => setSelectedDispute(null)}
                className="text-white/60 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-white/60 text-sm">Status</div>
                  <div className={`inline-block px-2 py-1 rounded text-sm border ${getStatusColor(selectedDispute.status)}`}>
                    {getDisputeStatusText(selectedDispute.status)}
                  </div>
                </div>
                <div>
                  <div className="text-white/60 text-sm">Type</div>
                  <div className={`inline-block px-2 py-1 rounded text-sm ${getTypeColor(selectedDispute.disputeType)}`}>
                    {getDisputeTypeText(selectedDispute.disputeType)}
                  </div>
                </div>
              </div>

              <div>
                <div className="text-white/60 text-sm">Description</div>
                <div className="text-white">{selectedDispute.description}</div>
              </div>

              {/* Evidence */}
              {selectedDispute.evidence && selectedDispute.evidence.length > 0 && (
                <div>
                  <div className="text-white/60 text-sm mb-2">Evidence</div>
                  <div className="space-y-2">
                    {selectedDispute.evidence.map((item, index) => (
                      <div key={index} className="bg-white/5 rounded-lg p-3 border border-white/10">
                        <div className="text-white text-sm mb-1">{item.description}</div>
                        <div className="text-white/60 text-xs">
                          Submitted by: {item.submitter.slice(0, 6)}...{item.submitter.slice(-4)} • {formatDateTime(item.submittedAt)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Resolution */}
              {selectedDispute.resolution && (
                <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                  <div className="text-white/60 text-sm mb-2">Resolution</div>
                  <div className="text-white mb-2">{selectedDispute.resolution}</div>
                  <div className="text-white/60 text-sm">
                    Resolved by: {selectedDispute.resolvedBy.slice(0, 6)}...{selectedDispute.resolvedBy.slice(-4)} • {formatDateTime(selectedDispute.resolvedAt)}
                  </div>
                  <div className="text-white/60 text-sm mt-1">
                    Outcome: {selectedDispute.favorTraveler ? 'Favor Traveler' : 'Favor Vendor'}
                    {selectedDispute.reputationImpact !== 0 && (
                      <span className="ml-2">
                        (Reputation impact: {selectedDispute.reputationImpact > 0 ? '+' : ''}{selectedDispute.reputationImpact})
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Create Dispute Modal Component
function CreateDisputeModal({ bookings, onClose, onDisputeCreated }: {
  bookings: Booking[];
  onClose: () => void;
  onDisputeCreated: () => void;
}) {
  const [formData, setFormData] = useState({
    bookingId: 0,
    disputeType: DisputeType.ServiceQuality,
    description: '',
    evidence: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.bookingId || !formData.description) {
      setError('Please fill in all required fields');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Upload evidence to IPFS
      const evidenceHash = await ipfsService.uploadJSON({
        description: formData.evidence,
        timestamp: new Date().toISOString(),
        type: 'dispute_evidence'
      });

      const tx = await contractService.createDispute(
        formData.bookingId,
        formData.disputeType,
        formData.description,
        evidenceHash
      );

      await tx.wait();
      onDisputeCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create dispute');
    } finally {
      setLoading(false);
    }
  };

  const availableBookings = bookings.filter(b => 
    b.status === 0 || b.status === 1 // Active or CheckedIn
  );

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-slate-900 rounded-xl border border-white/10 p-6 max-w-2xl w-full">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-white">Create New Dispute</h3>
          <button
            onClick={onClose}
            className="text-white/60 hover:text-white"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="bg-red-500/20 border border-red-500/50 text-red-400 p-4 rounded-lg mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-white font-medium mb-2">Select Booking</label>
            <select
              value={formData.bookingId}
              onChange={(e) => setFormData(prev => ({ ...prev, bookingId: parseInt(e.target.value) }))}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
            >
              <option value={0}>Choose a booking...</option>
              {availableBookings.map((booking) => (
                <option key={booking.bookingId} value={booking.bookingId}>
                  Booking #{booking.bookingId} - {formatDateTime(booking.checkInTime)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-white font-medium mb-2">Dispute Type</label>
            <select
              value={formData.disputeType}
              onChange={(e) => setFormData(prev => ({ ...prev, disputeType: parseInt(e.target.value) as DisputeType }))}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
            >
              <option value={DisputeType.ServiceQuality}>Service Quality</option>
              <option value={DisputeType.Cancellation}>Cancellation</option>
              <option value={DisputeType.Payment}>Payment</option>
              <option value={DisputeType.PropertyCondition}>Property Condition</option>
              <option value={DisputeType.Other}>Other</option>
            </select>
          </div>

          <div>
            <label className="block text-white font-medium mb-2">Description *</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={4}
              placeholder="Describe the issue in detail..."
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-cyan-400"
              required
            />
          </div>

          <div>
            <label className="block text-white font-medium mb-2">Evidence</label>
            <textarea
              value={formData.evidence}
              onChange={(e) => setFormData(prev => ({ ...prev, evidence: e.target.value }))}
              rows={3}
              placeholder="Provide evidence or additional details..."
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-cyan-400"
            />
          </div>

          <div className="flex gap-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-3 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-500 text-white rounded-lg transition-colors"
            >
              {loading ? 'Creating...' : 'Create Dispute'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
