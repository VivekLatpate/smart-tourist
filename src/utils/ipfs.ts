/**
 * IPFS Integration Utilities for Hotel Booking Platform
 * Handles metadata storage for hotel details, cancellation policies, and dispute evidence
 */

export interface HotelMetadata {
  name: string;
  description: string;
  location: {
    address: string;
    city: string;
    country: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  amenities: string[];
  photos: string[]; // IPFS hashes of photos
  roomTypes: {
    type: string;
    description: string;
    pricePerNight: number; // in wei
    maxOccupancy: number;
    amenities: string[];
  }[];
  contact: {
    email: string;
    phone: string;
    website?: string;
  };
  rating?: number;
  policies?: {
    checkInTime: string;
    checkOutTime: string;
    petPolicy: string;
    smokingPolicy: string;
  };
}

export interface CancellationPolicy {
  freeCancellation: boolean;
  cancellationDeadline: number; // hours before check-in
  refundPercentage: number;
  description: string;
}

export interface DisputeEvidence {
  type: 'photo' | 'document' | 'video' | 'audio' | 'other';
  description: string;
  timestamp: string;
  location?: {
    lat: number;
    lng: number;
  };
  metadata?: Record<string, any>;
}

export interface RoomDetails {
  roomType: string;
  roomNumber?: string;
  amenities: string[];
  photos: string[]; // IPFS hashes
  specialRequests?: string;
  guestCount: number;
  pricePerNight: number; // in wei
  totalNights: number;
}

class IPFSService {
  private pinataApiKey: string;
  private pinataSecretKey: string;
  private pinataGateway: string;

  constructor() {
    this.pinataApiKey = process.env.NEXT_PUBLIC_PINATA_API_KEY || '';
    this.pinataSecretKey = process.env.PINATA_SECRET_KEY || '';
    this.pinataGateway = process.env.NEXT_PUBLIC_PINATA_GATEWAY || 'https://gateway.pinata.cloud/ipfs/';
  }

  /**
   * Upload JSON data to IPFS via Pinata
   */
  async uploadJSON(data: any): Promise<string> {
    if (!this.pinataApiKey || !this.pinataSecretKey) {
      throw new Error('Pinata API keys not configured');
    }

    try {
      const response = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'pinata_api_key': this.pinataApiKey,
          'pinata_secret_api_key': this.pinataSecretKey,
        },
        body: JSON.stringify({
          pinataContent: data,
          pinataMetadata: {
            name: `hotel-booking-${Date.now()}`,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Pinata upload failed: ${response.statusText}`);
      }

      const result = await response.json();
      return result.IpfsHash;
    } catch (error) {
      console.error('IPFS upload error:', error);
      throw new Error('Failed to upload to IPFS');
    }
  }

  /**
   * Upload file to IPFS via Pinata
   */
  async uploadFile(file: File): Promise<string> {
    if (!this.pinataApiKey || !this.pinataSecretKey) {
      throw new Error('Pinata API keys not configured');
    }

    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const metadata = JSON.stringify({
        name: `hotel-booking-file-${Date.now()}`,
      });
      formData.append('pinataMetadata', metadata);

      const options = JSON.stringify({
        cidVersion: 0,
      });
      formData.append('pinataOptions', options);

      const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
        method: 'POST',
        headers: {
          'pinata_api_key': this.pinataApiKey,
          'pinata_secret_api_key': this.pinataSecretKey,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Pinata file upload failed: ${response.statusText}`);
      }

      const result = await response.json();
      return result.IpfsHash;
    } catch (error) {
      console.error('IPFS file upload error:', error);
      throw new Error('Failed to upload file to IPFS');
    }
  }

  /**
   * Retrieve data from IPFS
   */
  async getJSON(hash: string): Promise<any> {
    try {
      // Check if this is a mock hash (demo mode)
      if (hash.startsWith('QmMock') || hash.startsWith('QmDemo')) {
        console.log('🎭 Demo Mode: Returning mock data for hash:', hash);
        return this.getMockDataForHash(hash);
      }

      const response = await fetch(`${this.pinataGateway}${hash}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch from IPFS: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error('IPFS fetch error:', error);
      // In demo mode, return mock data instead of throwing error
      if (hash.startsWith('QmMock') || hash.startsWith('QmDemo')) {
        console.log('🎭 Demo Mode: Returning mock data for failed hash:', hash);
        return this.getMockDataForHash(hash);
      }
      throw new Error('Failed to fetch from IPFS');
    }
  }

  /**
   * Get IPFS URL for a hash
   */
  getIPFSUrl(hash: string): string {
    // For mock hashes, return a placeholder URL
    if (hash.startsWith('QmMock') || hash.startsWith('QmDemo')) {
      return 'https://via.placeholder.com/800x600/4F46E5/FFFFFF?text=Demo+Data';
    }
    return `${this.pinataGateway}${hash}`;
  }

  /**
   * Get mock data for demo mode hashes
   */
  private getMockDataForHash(hash: string): any {
    if (hash.includes('RoomDetails')) {
      return {
        roomType: 'Standard Room',
        amenities: ['WiFi', 'TV', 'Air Conditioning'],
        photos: ['https://via.placeholder.com/800x600/4F46E5/FFFFFF?text=Room+Image'],
        specialRequests: 'Demo special requests',
        guestCount: 2,
        pricePerNight: 100,
        totalNights: 3
      };
    }
    
    if (hash.includes('HotelMetadata')) {
      return {
        name: 'Demo Hotel',
        description: 'A beautiful demo hotel with excellent amenities.',
        location: {
          city: 'Demo City',
          country: 'Demo Country',
          address: '123 Demo Street',
          coordinates: { lat: 0, lng: 0 }
        },
        amenities: ['WiFi', 'Pool', 'Restaurant'],
        roomTypes: [
          {
            type: 'Standard Room',
            description: 'Comfortable room with modern amenities',
            maxOccupancy: 2,
            pricePerNight: 100,
            amenities: ['WiFi', 'TV', 'Air Conditioning']
          }
        ],
        photos: ['https://via.placeholder.com/800x600/4F46E5/FFFFFF?text=Hotel+Image'],
        rating: 4,
        contact: {
          phone: '+1-555-0123',
          email: 'info@demo.com',
          website: 'https://demo.com'
        }
      };
    }

    if (hash.includes('CancellationPolicy')) {
      return {
        freeCancellation: true,
        cancellationDeadline: 24,
        refundPercentage: 100,
        description: 'Free cancellation up to 24 hours before check-in'
      };
    }

    // Default mock data
    return {
      name: 'Demo Data',
      description: 'This is demo data for testing purposes',
      type: 'mock'
    };
  }

  /**
   * Upload hotel metadata
   */
  async uploadHotelMetadata(metadata: HotelMetadata): Promise<string> {
    return await this.uploadJSON(metadata);
  }

  /**
   * Upload cancellation policy
   */
  async uploadCancellationPolicy(policy: CancellationPolicy): Promise<string> {
    return await this.uploadJSON(policy);
  }

  /**
   * Upload room details
   */
  async uploadRoomDetails(roomDetails: RoomDetails): Promise<string> {
    return await this.uploadJSON(roomDetails);
  }

  /**
   * Upload dispute evidence
   */
  async uploadDisputeEvidence(evidence: DisputeEvidence): Promise<string> {
    return await this.uploadJSON(evidence);
  }

  /**
   * Upload multiple files and return their hashes
   */
  async uploadMultipleFiles(files: File[]): Promise<string[]> {
    const uploadPromises = files.map(file => this.uploadFile(file));
    return await Promise.all(uploadPromises);
  }
}

// Create singleton instance
export const ipfsService = new IPFSService();

// Utility functions for common operations
export const uploadHotelData = async (hotelData: {
  metadata: HotelMetadata;
  cancellationPolicy: CancellationPolicy;
  photos: File[];
}): Promise<{
  metadataHash: string;
  cancellationPolicyHash: string;
  photoHashes: string[];
}> => {
  const [metadataHash, cancellationPolicyHash, photoHashes] = await Promise.all([
    ipfsService.uploadHotelMetadata(hotelData.metadata),
    ipfsService.uploadCancellationPolicy(hotelData.cancellationPolicy),
    ipfsService.uploadMultipleFiles(hotelData.photos),
  ]);

  return {
    metadataHash,
    cancellationPolicyHash,
    photoHashes,
  };
};

export const uploadBookingData = async (bookingData: {
  roomDetails: RoomDetails;
  photos: File[];
}): Promise<{
  roomDetailsHash: string;
  photoHashes: string[];
}> => {
  const [roomDetailsHash, photoHashes] = await Promise.all([
    ipfsService.uploadRoomDetails(bookingData.roomDetails),
    ipfsService.uploadMultipleFiles(bookingData.photos),
  ]);

  return {
    roomDetailsHash,
    photoHashes,
  };
};

export const uploadDisputeData = async (disputeData: {
  evidence: DisputeEvidence;
  files: File[];
}): Promise<{
  evidenceHash: string;
  fileHashes: string[];
}> => {
  const [evidenceHash, fileHashes] = await Promise.all([
    ipfsService.uploadDisputeEvidence(disputeData.evidence),
    ipfsService.uploadMultipleFiles(disputeData.files),
  ]);

  return {
    evidenceHash,
    fileHashes,
  };
};

// Validation utilities
export const validateHotelMetadata = (metadata: any): metadata is HotelMetadata => {
  return (
    metadata &&
    typeof metadata.name === 'string' &&
    typeof metadata.description === 'string' &&
    metadata.location &&
    typeof metadata.location.address === 'string' &&
    Array.isArray(metadata.amenities) &&
    Array.isArray(metadata.roomTypes) &&
    metadata.contact &&
    typeof metadata.contact.email === 'string'
  );
};

export const validateCancellationPolicy = (policy: any): policy is CancellationPolicy => {
  return (
    policy &&
    typeof policy.freeCancellationHours === 'number' &&
    typeof policy.partialRefundHours === 'number' &&
    typeof policy.partialRefundPercentage === 'number' &&
    typeof policy.noRefundHours === 'number'
  );
};

export const validateRoomDetails = (details: any): details is RoomDetails => {
  return (
    details &&
    typeof details.roomType === 'string' &&
    typeof details.guestCount === 'number' &&
    typeof details.pricePerNight === 'number' &&
    typeof details.totalNights === 'number' &&
    Array.isArray(details.amenities)
  );
};
