# 🎫 Temporary Access NFT Program

A Solana smart contract program built with Anchor framework that implements **Temporary Access NFTs** for secure tourist access to restricted areas, parks, and sites.

## 🌟 Features

### Core Functionality
- **Time-Limited Access**: NFTs automatically expire after a specified timestamp
- **Soulbound NFTs**: Non-transferable, permanently bound to tourist wallet
- **Zone-Specific Access**: Each NFT grants access to a specific restricted area
- **Authority Control**: Tourism department can revoke access before expiry
- **Metadata Storage**: IPFS/Arweave integration for off-chain metadata

### Key Instructions
1. **`initialize`**: Initialize the program with authority
2. **`mint_access_nft`**: Mint a temporary access NFT for a tourist
3. **`verify_access`**: Check if a tourist has valid access to a zone
4. **`revoke_pass`**: Authority can revoke access before expiry
5. **`update_metadata`**: Authority can update NFT metadata

## 🏗️ Architecture

### Account Structures

#### ProgramConfig
```rust
pub struct ProgramConfig {
    pub authority: Pubkey,        // Program authority (tourism department)
    pub nft_counter: u64,         // Counter for unique NFT IDs
    pub bump: u8,                 // PDA bump seed
}
```

#### AccessNft
```rust
pub struct AccessNft {
    pub nft_id: u64,              // Unique NFT identifier
    pub tourist_id_hash: [u8; 32], // Soulbound binding to tourist digital ID
    pub zone_id: String,          // Restricted area identifier
    pub expiry_timestamp: i64,    // Unix timestamp for expiry
    pub tourist_wallet: Pubkey,   // Tourist's wallet address
    pub is_valid: bool,           // Current validity status
    pub metadata_uri: String,     // IPFS/Arweave metadata URI
    pub minted_at: i64,           // Minting timestamp
    pub bump: u8,                 // PDA bump seed
}
```

## 🚀 Deployment

### Prerequisites
- Solana CLI installed
- Anchor framework installed
- Node.js and npm/yarn

### Build and Deploy

1. **Build the program**:
   ```bash
   anchor build
   ```

2. **Deploy to Devnet**:
   ```bash
   anchor deploy --provider.cluster devnet
   ```

3. **Run tests**:
   ```bash
   anchor test --provider.cluster devnet
   ```

### Program ID
```
TempAccessNFT1111111111111111111111111111111
```

## 📋 Usage Examples

### 1. Initialize Program
```typescript
const tx = await program.methods
  .initialize()
  .accounts({
    programConfig: programConfigPda,
    authority: authority.publicKey,
    systemProgram: SystemProgram.programId,
  })
  .rpc();
```

### 2. Mint Access NFT
```typescript
const tx = await program.methods
  .mintAccessNft(
    Array.from(touristIdHash),    // Tourist ID hash
    "CENTRAL_PARK_NYC",           // Zone ID
    new anchor.BN(expiryTimestamp), // Expiry timestamp
    "https://ipfs.io/ipfs/..."    // Metadata URI
  )
  .accounts({
    programConfig: programConfigPda,
    accessNft: accessNftPda,
    tourist: tourist.publicKey,
    systemProgram: SystemProgram.programId,
  })
  .rpc();
```

### 3. Verify Access
```typescript
const isValid = await program.methods
  .verifyAccess(tourist.publicKey, "CENTRAL_PARK_NYC")
  .accounts({
    accessNft: accessNftPda,
  })
  .view();
```

### 4. Revoke Pass
```typescript
const tx = await program.methods
  .revokePass()
  .accounts({
    accessNft: accessNftPda,
    programConfig: programConfigPda,
    authority: authority.publicKey,
  })
  .rpc();
```

## 🎯 Use Cases

### National Parks
- Time-limited entry passes for protected areas
- Automatic expiry prevents overstaying
- Zone-specific access for different park sections

### Museums & Cultural Sites
- Restricted access to historical monuments
- Time-based tickets with automatic invalidation
- Authority can revoke access for security reasons

### Events & Venues
- Temporary access for festivals and concerts
- VIP area access with time limits
- Emergency revocation capabilities

## 🔒 Security Features

### Soulbound Implementation
- NFTs cannot be transferred between wallets
- Permanent binding to tourist's wallet address
- Prevents resale or unauthorized access

### Time-Based Expiry
- Automatic invalidation after expiry timestamp
- No manual cleanup required
- Prevents indefinite access

### Authority Controls
- Tourism department can revoke access
- Emergency revocation capabilities
- Metadata update permissions

## 🧪 Testing

### Test Coverage
- ✅ Program initialization
- ✅ NFT minting with valid data
- ✅ Access verification (valid/invalid)
- ✅ Authority-based revocation
- ✅ Metadata updates
- ✅ Error handling for invalid inputs
- ✅ Expiry time validation
- ✅ Multiple NFT minting

### Run Tests
```bash
# Run all tests
anchor test

# Run specific test file
anchor test tests/temporary-access-nft.test.ts
```

## 📊 Events

The program emits the following events for tracking and monitoring:

### AccessNftMinted
```rust
pub struct AccessNftMinted {
    pub nft_id: u64,
    pub tourist_wallet: Pubkey,
    pub tourist_id_hash: [u8; 32],
    pub zone_id: String,
    pub expiry_timestamp: i64,
    pub metadata_uri: String,
    pub minted_at: i64,
}
```

### AccessVerified
```rust
pub struct AccessVerified {
    pub nft_id: u64,
    pub tourist_wallet: Pubkey,
    pub zone_id: String,
    pub is_valid: bool,
    pub verified_at: i64,
}
```

### PassRevoked
```rust
pub struct PassRevoked {
    pub nft_id: u64,
    pub tourist_wallet: Pubkey,
    pub zone_id: String,
    pub revoked_by: Pubkey,
    pub revoked_at: i64,
}
```

## 🚨 Error Codes

| Error Code | Description |
|------------|-------------|
| `InvalidExpiryTime` | Expiry timestamp must be in the future |
| `PassAlreadyRevoked` | Attempting to revoke already revoked pass |
| `Unauthorized` | Unauthorized access attempt |
| `NftNotFound` | NFT not found for verification |
| `AccessExpired` | Access has expired |

## 🔧 Configuration

### Anchor.toml
```toml
[programs.devnet]
temporary_access_nft = "TempAccessNFT1111111111111111111111111111111"

[provider]
cluster = "devnet"
```

### Cargo.toml Dependencies
```toml
[dependencies]
anchor-lang = "0.29.0"
anchor-spl = "0.29.0"
mpl-token-metadata = "3.2.0"
```

## 🌐 Frontend Integration

The program includes a React component (`TemporaryAccessNFT.tsx`) that provides:

- **Mint Interface**: Form to create new access NFTs
- **Verification Interface**: Check access validity
- **NFT Management**: View and manage existing NFTs
- **Authority Controls**: Revoke passes and update metadata

### Key Features
- Wallet integration with Solana wallet adapters
- Real-time access verification
- Error handling and user feedback
- Responsive design for mobile and desktop

## 📈 Future Enhancements

### Planned Features
- [ ] Batch minting for group access
- [ ] Recurring access passes
- [ ] Integration with real NFT metadata standards
- [ ] Mobile app integration
- [ ] Analytics and reporting dashboard
- [ ] Multi-zone access passes
- [ ] Integration with tourism management systems

### Technical Improvements
- [ ] Gas optimization
- [ ] Enhanced error messages
- [ ] Off-chain metadata validation
- [ ] Integration with Solana Name Service (SNS)
- [ ] Cross-program invocation (CPI) support

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For questions, issues, or contributions:
- Create an issue in the repository
- Contact the development team
- Check the documentation and examples

---

**Built with ❤️ for secure and privacy-first tourist safety systems**
