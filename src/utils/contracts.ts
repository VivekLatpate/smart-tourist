/**
 * Smart Contract Interaction Utilities for Hotel Booking Platform
 * Handles all blockchain interactions with ethers.js
 */

import { ethers } from 'ethers';
import { ipfsService } from './ipfs';

// Contract ABIs (these would be imported from compiled contracts in production)
export const VENDOR_REGISTRY_ABI = [
  "function registerVendor(string memory _did, string memory _metadataHash, string memory _cancellationPolicyHash) external",
  "function getVendor(uint256 _vendorId) external view returns (tuple(address vendorAddress, string did, string metadataHash, string cancellationPolicyHash, bool isVerified, uint256 reputationScore, uint256 registrationTime, bool isActive))",
  "function getTotalVendors() external view returns (uint256)",
  "function isVendorVerifiedAndActive(uint256 _vendorId) external view returns (bool)",
  "function getVendorIdByAddress(address _vendorAddress) external view returns (uint256)",
  "event VendorRegistered(address indexed vendor, uint256 indexed vendorId, string did)",
  "event VendorVerified(uint256 indexed vendorId, bool verified)"
];

export const BOOKING_ESCROW_ABI = [
  "function createBooking(uint256 _vendorId, uint256 _checkInTime, uint256 _checkOutTime, string memory _roomDetailsHash, uint256 _bufferTime) external payable",
  "function confirmCheckIn(uint256 _bookingId) external",
  "function releasePayment(uint256 _bookingId) external",
  "function cancelBooking(uint256 _bookingId, string memory _cancellationReason) external",
  "function raiseDispute(uint256 _bookingId, string memory _evidenceHash) external",
  "function getBooking(uint256 _bookingId) external view returns (tuple(uint256 bookingId, address traveler, uint256 vendorId, uint256 amount, uint256 checkInTime, uint256 checkOutTime, uint256 bufferTime, string roomDetailsHash, uint8 status, uint256 createdAt, bool autoReleaseEnabled))",
  "function getTravelerBookings(address _traveler) external view returns (uint256[] memory)",
  "function getVendorBookings(uint256 _vendorId) external view returns (uint256[] memory)",
  "function getTotalBookings() external view returns (uint256)",
  "event BookingCreated(uint256 indexed bookingId, address indexed traveler, uint256 indexed vendorId, uint256 amount, uint256 checkInTime, uint256 checkOutTime)",
  "event PaymentReleased(uint256 indexed bookingId, address indexed recipient, uint256 amount)",
  "event BookingCancelled(uint256 indexed bookingId, address indexed traveler, uint256 refundAmount)",
  "event CheckInConfirmed(uint256 indexed bookingId, address indexed traveler)",
  "event DisputeRaised(uint256 indexed bookingId, address indexed traveler, string evidenceHash)"
];

export const DISPUTE_RESOLUTION_ABI = [
  "function createDispute(uint256 _bookingId, uint8 _disputeType, string memory _description, string memory _evidenceHash) external",
  "function addEvidence(uint256 _disputeId, string memory _evidenceHash, string memory _description) external",
  "function getDispute(uint256 _disputeId) external view returns (tuple(uint256 disputeId, uint256 bookingId, address traveler, uint256 vendorId, uint8 disputeType, string description, string initialEvidenceHash, uint8 status, uint256 createdAt, uint256 resolvedAt, address resolvedBy, bool favorTraveler, string resolution, uint256 reputationImpact))",
  "function getDisputeEvidence(uint256 _disputeId) external view returns (tuple(address submitter, string evidenceHash, string description, uint256 submittedAt)[] memory)",
  "function getTravelerDisputes(address _traveler) external view returns (uint256[] memory)",
  "function getVendorDisputes(uint256 _vendorId) external view returns (uint256[] memory)",
  "function getTotalDisputes() external view returns (uint256)",
  "event DisputeCreated(uint256 indexed disputeId, uint256 indexed bookingId, address indexed traveler, string evidenceHash, string description)",
  "event EvidenceAdded(uint256 indexed disputeId, address indexed submitter, string evidenceHash)",
  "event DisputeResolved(uint256 indexed disputeId, address indexed admin, bool favorTraveler, string resolution)"
];

// Contract addresses (these would be loaded from deployment config)
export const CONTRACT_ADDRESSES = {
  VENDOR_REGISTRY: process.env.NEXT_PUBLIC_VENDOR_REGISTRY_ADDRESS || '0x5FbDB2315678afecb367f032d93F642f64180aa3',
  BOOKING_ESCROW: process.env.NEXT_PUBLIC_BOOKING_ESCROW_ADDRESS || '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512',
  DISPUTE_RESOLUTION: process.env.NEXT_PUBLIC_DISPUTE_RESOLUTION_ADDRESS || '0x0000000000000000000000000000000000000000',
};

// Booking status enum
export enum BookingStatus {
  Active = 0,
  CheckedIn = 1,
  Completed = 2,
  Cancelled = 3,
  Disputed = 4
}

// Dispute status enum
export enum DisputeStatus {
  Open = 0,
  UnderReview = 1,
  Resolved = 2
}

// Dispute type enum
export enum DisputeType {
  ServiceQuality = 0,
  Cancellation = 1,
  Payment = 2,
  PropertyCondition = 3,
  Other = 4
}

export interface Vendor {
  vendorAddress: string;
  did: string;
  metadataHash: string;
  cancellationPolicyHash: string;
  isVerified: boolean;
  reputationScore: number;
  registrationTime: number;
  isActive: boolean;
}

export interface Booking {
  bookingId: number;
  traveler: string;
  vendorId: number;
  amount: string;
  checkInTime: number;
  checkOutTime: number;
  bufferTime: number;
  roomDetailsHash: string;
  status: BookingStatus;
  createdAt: number;
  autoReleaseEnabled: boolean;
}

export interface Dispute {
  disputeId: number;
  bookingId: number;
  traveler: string;
  vendorId: number;
  disputeType: DisputeType;
  description: string;
  initialEvidenceHash: string;
  status: DisputeStatus;
  createdAt: number;
  resolvedAt: number;
  resolvedBy: string;
  favorTraveler: boolean;
  resolution: string;
  reputationImpact: number;
}

export interface Evidence {
  submitter: string;
  evidenceHash: string;
  description: string;
  submittedAt: number;
}

class ContractService {
  private provider: ethers.BrowserProvider | null = null;
  private signer: ethers.JsonRpcSigner | null = null;
  private vendorRegistry: ethers.Contract | null = null;
  private bookingEscrow: ethers.Contract | null = null;
  private disputeResolution: ethers.Contract | null = null;
  private isDemoMode: boolean = false;

  async connect() {
    if (typeof window === 'undefined' || !(window as any).ethereum) {
      throw new Error('MetaMask not detected');
    }

    this.provider = new ethers.BrowserProvider((window as any).ethereum);
    this.signer = await this.provider.getSigner();
    
    // Check if contracts are deployed (non-zero addresses)
    const contractsDeployed = CONTRACT_ADDRESSES.VENDOR_REGISTRY !== '0x0000000000000000000000000000000000000000';
    
    if (contractsDeployed) {
      // Initialize contracts with real addresses
      this.vendorRegistry = new ethers.Contract(
        CONTRACT_ADDRESSES.VENDOR_REGISTRY,
        VENDOR_REGISTRY_ABI,
        this.signer
      );
      
      this.bookingEscrow = new ethers.Contract(
        CONTRACT_ADDRESSES.BOOKING_ESCROW,
        BOOKING_ESCROW_ABI,
        this.signer
      );
      
      this.disputeResolution = new ethers.Contract(
        CONTRACT_ADDRESSES.DISPUTE_RESOLUTION,
        DISPUTE_RESOLUTION_ABI,
        this.signer
      );
      this.isDemoMode = false;
      console.log('🚀 Real Mode: Connected to deployed contracts');
      console.log('Vendor Registry:', CONTRACT_ADDRESSES.VENDOR_REGISTRY);
      console.log('Booking Escrow:', CONTRACT_ADDRESSES.BOOKING_ESCROW);
    } else {
      // Demo mode - contracts not deployed
      this.isDemoMode = true;
      console.log('🏗️ Demo Mode: Contracts not deployed, using mock data');
    }
  }

  async getAccount(): Promise<string> {
    if (!this.signer) {
      await this.connect();
    }
    return await this.signer!.getAddress();
  }

  isInDemoMode(): boolean {
    return this.isDemoMode;
  }

  // Vendor Registry Functions
  async registerVendor(
    did: string,
    metadataHash: string,
    cancellationPolicyHash: string
  ): Promise<ethers.ContractTransactionResponse> {
    if (!this.vendorRegistry) {
      throw new Error('Contract not connected');
    }
    return await this.vendorRegistry.registerVendor(did, metadataHash, cancellationPolicyHash);
  }

  async getVendor(vendorId: number): Promise<Vendor> {
    if (!this.vendorRegistry) {
      throw new Error('Contract not connected');
    }
    const vendor = await this.vendorRegistry.getVendor(vendorId);
    return {
      vendorAddress: vendor[0],
      did: vendor[1],
      metadataHash: vendor[2],
      cancellationPolicyHash: vendor[3],
      isVerified: vendor[4],
      reputationScore: Number(vendor[5]),
      registrationTime: Number(vendor[6]),
      isActive: vendor[7]
    };
  }

  async getTotalVendors(): Promise<number> {
    if (this.isDemoMode) {
      // Return mock data for demo mode
      return 5;
    }
    if (!this.vendorRegistry) {
      throw new Error('Contract not connected');
    }
    return Number(await this.vendorRegistry.getTotalVendors());
  }

  async isVendorVerifiedAndActive(vendorId: number): Promise<boolean> {
    if (!this.vendorRegistry) {
      throw new Error('Contract not connected');
    }
    return await this.vendorRegistry.isVendorVerifiedAndActive(vendorId);
  }

  async getVendorIdByAddress(address: string): Promise<number> {
    if (!this.vendorRegistry) {
      throw new Error('Contract not connected');
    }
    return Number(await this.vendorRegistry.getVendorIdByAddress(address));
  }

  // Booking Escrow Functions
  async createBooking(
    vendorId: number,
    checkInTime: number,
    checkOutTime: number,
    roomDetailsHash: string,
    bufferTime: number,
    paymentAmount: string
  ): Promise<ethers.ContractTransactionResponse> {
    if (this.isDemoMode) {
      // Simulate booking creation in demo mode
      console.log('🎭 Demo Mode: Simulating booking creation');
      console.log('Vendor ID:', vendorId);
      console.log('Check-in:', new Date(checkInTime * 1000).toLocaleString());
      console.log('Check-out:', new Date(checkOutTime * 1000).toLocaleString());
      console.log('Payment Amount:', paymentAmount, 'ETH');
      
      // Return a mock transaction response
      return {
        hash: '0x' + Math.random().toString(16).substr(2, 64),
        wait: async () => {
          // Simulate transaction confirmation delay
          await new Promise(resolve => setTimeout(resolve, 2000));
          return {
            status: 1,
            blockNumber: Math.floor(Math.random() * 1000000) + 1000000,
            gasUsed: BigInt(150000),
            effectiveGasPrice: BigInt(20000000000) // 20 gwei
          };
        }
      } as any;
    }
    
    if (!this.bookingEscrow) {
      throw new Error('Contract not connected');
    }
    // For the standalone contract, we need to get the vendor address first
    if (!this.vendorRegistry) {
      throw new Error('Vendor registry contract not connected');
    }

    // Get vendor address from registry
    const vendor = await this.vendorRegistry.getVendorById(vendorId);
    
    return await this.bookingEscrow.createBooking(
      vendor.vendorAddress,
      checkInTime,
      checkOutTime,
      roomDetailsHash,
      bufferTime,
      { value: ethers.parseEther(paymentAmount) }
    );
  }

  async confirmCheckIn(bookingId: number): Promise<ethers.ContractTransactionResponse> {
    if (!this.bookingEscrow) {
      throw new Error('Contract not connected');
    }
    return await this.bookingEscrow.confirmCheckIn(bookingId);
  }

  async releasePayment(bookingId: number): Promise<ethers.ContractTransactionResponse> {
    if (!this.bookingEscrow) {
      throw new Error('Contract not connected');
    }
    return await this.bookingEscrow.releasePayment(bookingId);
  }

  async cancelBooking(bookingId: number, cancellationReason: string): Promise<ethers.ContractTransactionResponse> {
    if (!this.bookingEscrow) {
      throw new Error('Contract not connected');
    }
    return await this.bookingEscrow.cancelBooking(bookingId, cancellationReason);
  }

  async raiseDispute(bookingId: number, evidenceHash: string): Promise<ethers.ContractTransactionResponse> {
    if (!this.bookingEscrow) {
      throw new Error('Contract not connected');
    }
    return await this.bookingEscrow.raiseDispute(bookingId, evidenceHash);
  }

  async getBooking(bookingId: number): Promise<Booking> {
    if (!this.bookingEscrow) {
      throw new Error('Contract not connected');
    }
    const booking = await this.bookingEscrow.getBooking(bookingId);
    return {
      bookingId: Number(booking[0]),
      traveler: booking[1],
      vendorId: Number(booking[2]),
      amount: booking[3].toString(),
      checkInTime: Number(booking[4]),
      checkOutTime: Number(booking[5]),
      bufferTime: Number(booking[6]),
      roomDetailsHash: booking[7],
      status: booking[8] as BookingStatus,
      createdAt: Number(booking[9]),
      autoReleaseEnabled: booking[10]
    };
  }

  async getTravelerBookings(traveler: string): Promise<number[]> {
    if (!this.bookingEscrow) {
      throw new Error('Contract not connected');
    }
    const bookings = await this.bookingEscrow.getTravelerBookings(traveler);
    return bookings.map((id: any) => Number(id));
  }

  async getVendorBookings(vendorId: number): Promise<number[]> {
    if (!this.bookingEscrow) {
      throw new Error('Contract not connected');
    }
    const bookings = await this.bookingEscrow.getVendorBookings(vendorId);
    return bookings.map((id: any) => Number(id));
  }

  // Dispute Resolution Functions
  async createDispute(
    bookingId: number,
    disputeType: DisputeType,
    description: string,
    evidenceHash: string
  ): Promise<ethers.ContractTransactionResponse> {
    if (!this.disputeResolution) {
      throw new Error('Contract not connected');
    }
    return await this.disputeResolution.createDispute(bookingId, disputeType, description, evidenceHash);
  }

  async addEvidence(
    disputeId: number,
    evidenceHash: string,
    description: string
  ): Promise<ethers.ContractTransactionResponse> {
    if (!this.disputeResolution) {
      throw new Error('Contract not connected');
    }
    return await this.disputeResolution.addEvidence(disputeId, evidenceHash, description);
  }

  async getDispute(disputeId: number): Promise<Dispute> {
    if (!this.disputeResolution) {
      throw new Error('Contract not connected');
    }
    const dispute = await this.disputeResolution.getDispute(disputeId);
    return {
      disputeId: Number(dispute[0]),
      bookingId: Number(dispute[1]),
      traveler: dispute[2],
      vendorId: Number(dispute[3]),
      disputeType: dispute[4] as DisputeType,
      description: dispute[5],
      initialEvidenceHash: dispute[6],
      status: dispute[7] as DisputeStatus,
      createdAt: Number(dispute[8]),
      resolvedAt: Number(dispute[9]),
      resolvedBy: dispute[10],
      favorTraveler: dispute[11],
      resolution: dispute[12],
      reputationImpact: Number(dispute[13])
    };
  }

  async getDisputeEvidence(disputeId: number): Promise<Evidence[]> {
    if (!this.disputeResolution) {
      throw new Error('Contract not connected');
    }
    const evidence = await this.disputeResolution.getDisputeEvidence(disputeId);
    return evidence.map((item: any) => ({
      submitter: item[0],
      evidenceHash: item[1],
      description: item[2],
      submittedAt: Number(item[3])
    }));
  }

  async getTravelerDisputes(traveler: string): Promise<number[]> {
    if (!this.disputeResolution) {
      throw new Error('Contract not connected');
    }
    const disputes = await this.disputeResolution.getTravelerDisputes(traveler);
    return disputes.map((id: any) => Number(id));
  }

  async getVendorDisputes(vendorId: number): Promise<number[]> {
    if (!this.disputeResolution) {
      throw new Error('Contract not connected');
    }
    const disputes = await this.disputeResolution.getVendorDisputes(vendorId);
    return disputes.map((id: any) => Number(id));
  }

  async getTotalBookings(): Promise<number> {
    if (this.isDemoMode) {
      // Return mock data for demo mode
      return 12;
    }
    if (!this.bookingEscrow) {
      throw new Error('Contract not connected');
    }
    return Number(await this.bookingEscrow.getTotalBookings());
  }

  async getTotalDisputes(): Promise<number> {
    if (this.isDemoMode) {
      // Return mock data for demo mode
      return 3;
    }
    if (!this.disputeResolution) {
      throw new Error('Contract not connected');
    }
    return Number(await this.disputeResolution.getTotalDisputes());
  }
}

// Create singleton instance
export const contractService = new ContractService();

// Utility functions for common operations
export const formatEther = (wei: string): string => {
  return ethers.formatEther(wei);
};

export const parseEther = (ether: string): bigint => {
  return ethers.parseEther(ether);
};

export const formatDate = (timestamp: number): string => {
  return new Date(timestamp * 1000).toLocaleDateString();
};

export const formatDateTime = (timestamp: number): string => {
  return new Date(timestamp * 1000).toLocaleString();
};

export const getBookingStatusText = (status: BookingStatus): string => {
  switch (status) {
    case BookingStatus.Active:
      return 'Active';
    case BookingStatus.CheckedIn:
      return 'Checked In';
    case BookingStatus.Completed:
      return 'Completed';
    case BookingStatus.Cancelled:
      return 'Cancelled';
    case BookingStatus.Disputed:
      return 'Disputed';
    default:
      return 'Unknown';
  }
};

export const getDisputeStatusText = (status: DisputeStatus): string => {
  switch (status) {
    case DisputeStatus.Open:
      return 'Open';
    case DisputeStatus.UnderReview:
      return 'Under Review';
    case DisputeStatus.Resolved:
      return 'Resolved';
    default:
      return 'Unknown';
  }
};

export const getDisputeTypeText = (type: DisputeType): string => {
  switch (type) {
    case DisputeType.ServiceQuality:
      return 'Service Quality';
    case DisputeType.Cancellation:
      return 'Cancellation';
    case DisputeType.Payment:
      return 'Payment';
    case DisputeType.PropertyCondition:
      return 'Property Condition';
    case DisputeType.Other:
      return 'Other';
    default:
      return 'Unknown';
  }
};
