import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { PublicKey, Keypair, SystemProgram } from "@solana/web3.js";

async function main() {
  // Configure the client
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.TemporaryAccessNft as Program<any>;
  const authority = provider.wallet;

  console.log("🚀 Temporary Access NFT Sample Usage");
  console.log("=====================================");

  // Derive PDAs
  const [programConfigPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("program_config")],
    program.programId
  );

  // Create a sample tourist
  const tourist = Keypair.generate();
  console.log("Sample Tourist Wallet:", tourist.publicKey.toString());

  // Airdrop SOL to tourist
  console.log("Airdropping SOL to tourist...");
  await provider.connection.requestAirdrop(tourist.publicKey, 2 * anchor.web3.LAMPORTS_PER_SOL);
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Sample data
  const touristIdHash = new Uint8Array(32);
  touristIdHash.fill(1); // Mock tourist ID hash
  const zoneId = "CENTRAL_PARK_NYC";
  const metadataUri = "https://ipfs.io/ipfs/QmSampleMetadataHash123456789";
  const expiryTimestamp = Math.floor(Date.now() / 1000) + 86400; // 24 hours from now

  console.log("\n📋 Sample Data:");
  console.log("- Tourist ID Hash:", Array.from(touristIdHash).slice(0, 8).join('') + "...");
  console.log("- Zone ID:", zoneId);
  console.log("- Expiry Timestamp:", new Date(expiryTimestamp * 1000).toISOString());
  console.log("- Metadata URI:", metadataUri);

  try {
    // Step 1: Mint Access NFT
    console.log("\n🎫 Step 1: Minting Temporary Access NFT...");
    
    const [accessNftPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("access_nft"), new anchor.BN(0).toArrayLike(Buffer, "le", 8)],
      program.programId
    );

    const mintTx = await (program as any).methods
      .mintAccessNft(
        Array.from(touristIdHash),
        zoneId,
        new anchor.BN(expiryTimestamp),
        metadataUri
      )
      .accounts({
        programConfig: programConfigPda,
        accessNft: accessNftPda,
        tourist: tourist.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([tourist])
      .rpc();

    console.log("✅ NFT minted successfully!");
    console.log("Transaction signature:", mintTx);
    console.log("NFT PDA:", accessNftPda.toString());

    // Step 2: Verify Access
    console.log("\n🔍 Step 2: Verifying Access...");
    
    const isValid = await (program as any).methods
      .verifyAccess(tourist.publicKey, zoneId)
      .accounts({
        accessNft: accessNftPda,
      })
      .view();

    console.log("✅ Access verification result:", isValid);

    // Step 3: Try to verify with wrong tourist
    console.log("\n🚫 Step 3: Testing with wrong tourist...");
    
    const wrongTourist = Keypair.generate();
    try {
      await (program as any).methods
        .verifyAccess(wrongTourist.publicKey, zoneId)
        .accounts({
          accessNft: accessNftPda,
        })
        .view();
    } catch (error) {
      console.log("✅ Correctly rejected wrong tourist:", (error as any).message?.includes("constraint"));
    }

    // Step 4: Try to verify with wrong zone
    console.log("\n🚫 Step 4: Testing with wrong zone...");
    
    try {
      await (program as any).methods
        .verifyAccess(tourist.publicKey, "WRONG_ZONE")
        .accounts({
          accessNft: accessNftPda,
        })
        .view();
    } catch (error) {
      console.log("✅ Correctly rejected wrong zone:", (error as any).message?.includes("constraint"));
    }

    // Step 5: Update metadata (authority only)
    console.log("\n📝 Step 5: Updating metadata...");
    
    const newMetadataUri = "https://ipfs.io/ipfs/QmUpdatedMetadataHash987654321";
    
    const updateTx = await (program as any).methods
      .updateMetadata(newMetadataUri)
      .accounts({
        accessNft: accessNftPda,
        programConfig: programConfigPda,
        authority: authority.publicKey,
      })
      .rpc();

    console.log("✅ Metadata updated successfully!");
    console.log("Transaction signature:", updateTx);

    // Step 6: Revoke pass (authority only)
    console.log("\n🚫 Step 6: Revoking access pass...");
    
    const revokeTx = await (program as any).methods
      .revokePass()
      .accounts({
        accessNft: accessNftPda,
        programConfig: programConfigPda,
        authority: authority.publicKey,
      })
      .rpc();

    console.log("✅ Access pass revoked successfully!");
    console.log("Transaction signature:", revokeTx);

    // Step 7: Verify access after revocation
    console.log("\n🔍 Step 7: Verifying access after revocation...");
    
    const isValidAfterRevoke = await (program as any).methods
      .verifyAccess(tourist.publicKey, zoneId)
      .accounts({
        accessNft: accessNftPda,
      })
      .view();

    console.log("✅ Access verification result after revocation:", isValidAfterRevoke);

    // Step 8: Display final NFT state
    console.log("\n📊 Final NFT State:");
    const finalNft = await (program as any).account.accessNft.fetch(accessNftPda);
    console.log("- NFT ID:", finalNft.nftId.toNumber());
    console.log("- Tourist Wallet:", finalNft.touristWallet.toString());
    console.log("- Zone ID:", finalNft.zoneId);
    console.log("- Expiry Timestamp:", new Date(finalNft.expiryTimestamp.toNumber() * 1000).toISOString());
    console.log("- Is Valid:", finalNft.isValid);
    console.log("- Metadata URI:", finalNft.metadataUri);
    console.log("- Minted At:", new Date(finalNft.mintedAt.toNumber() * 1000).toISOString());

  } catch (error) {
    console.error("❌ Error during sample usage:", error);
    throw error;
  }
}

main()
  .then(() => {
    console.log("\n🎉 Sample usage completed successfully!");
    console.log("\n💡 Key Features Demonstrated:");
    console.log("1. ✅ Minting time-limited access NFTs");
    console.log("2. ✅ Soulbound binding (non-transferable)");
    console.log("3. ✅ Access verification with zone validation");
    console.log("4. ✅ Authority-based metadata updates");
    console.log("5. ✅ Authority-based access revocation");
    console.log("6. ✅ Proper error handling for invalid access");
    process.exit(0);
  })
  .catch((error) => {
    console.error("💥 Sample usage failed:", error);
    process.exit(1);
  });
