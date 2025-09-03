// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title SimpleVendorRegistry
 * @dev Simplified vendor registry without external dependencies
 */
contract SimpleVendorRegistry {
    struct Vendor {
        address vendorAddress;
        string metadataHash;
        string cancellationPolicyHash;
        uint256 reputationScore;
        bool isVerified;
        bool exists;
    }

    mapping(address => Vendor) public vendors;
    mapping(uint256 => address) public vendorIds;
    uint256 public nextVendorId = 1;
    
    address public admin;
    uint256 public totalVendors = 0;

    event VendorRegistered(address indexed vendor, uint256 indexed vendorId);
    event VendorVerified(address indexed vendor, bool verified);
    event ReputationUpdated(address indexed vendor, uint256 newScore);

    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin can call this function");
        _;
    }

    modifier onlyVendor() {
        require(vendors[msg.sender].exists, "Vendor not registered");
        _;
    }

    constructor() {
        admin = msg.sender;
    }

    function registerVendor(
        string memory _metadataHash,
        string memory _cancellationPolicyHash
    ) external {
        require(!vendors[msg.sender].exists, "Vendor already registered");
        
        vendors[msg.sender] = Vendor({
            vendorAddress: msg.sender,
            metadataHash: _metadataHash,
            cancellationPolicyHash: _cancellationPolicyHash,
            reputationScore: 50, // Start with neutral score
            isVerified: false,
            exists: true
        });

        vendorIds[nextVendorId] = msg.sender;
        nextVendorId++;
        totalVendors++;

        emit VendorRegistered(msg.sender, nextVendorId - 1);
    }

    function verifyVendor(address _vendor, bool _verified) external onlyAdmin {
        require(vendors[_vendor].exists, "Vendor not found");
        vendors[_vendor].isVerified = _verified;
        emit VendorVerified(_vendor, _verified);
    }

    function updateReputation(address _vendor, uint256 _newScore) external onlyAdmin {
        require(vendors[_vendor].exists, "Vendor not found");
        require(_newScore <= 100, "Reputation score cannot exceed 100");
        vendors[_vendor].reputationScore = _newScore;
        emit ReputationUpdated(_vendor, _newScore);
    }

    function getVendor(address _vendor) external view returns (Vendor memory) {
        require(vendors[_vendor].exists, "Vendor not found");
        return vendors[_vendor];
    }

    function getVendorById(uint256 _vendorId) external view returns (Vendor memory) {
        require(_vendorId > 0 && _vendorId < nextVendorId, "Invalid vendor ID");
        return vendors[vendorIds[_vendorId]];
    }

    function getAllVendors() external view returns (Vendor[] memory) {
        Vendor[] memory allVendors = new Vendor[](totalVendors);
        uint256 index = 0;
        
        for (uint256 i = 1; i < nextVendorId; i++) {
            allVendors[index] = vendors[vendorIds[i]];
            index++;
        }
        
        return allVendors;
    }
}
