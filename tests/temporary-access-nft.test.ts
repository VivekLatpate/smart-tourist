import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { expect } from "chai";
import { PublicKey, Keypair, SystemProgram } from "@solana/web3.js";

describe("temporary-access-nft", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.TemporaryAccessNft as Program<any>;
  const provider = anchor.getProvider();

  // Test accounts
  let authority: Keypair;
  let tourist: Keypair;
  let programConfigPda: PublicKey;
  let accessNftPda: PublicKey;

  // Test data
  const touristIdHash = new Uint8Array(32).fill(1); // Mock tourist ID hash
  const zoneId = "PARK_ZONE_001";
  const metadataUri = "https://ipfs.io/ipfs/QmTestMetadataHash";
  const futureTimestamp = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
  const pastTimestamp = Math.floor(Date.now() / 1000) - 3600; // 1 hour ago

  before(async () => {
    // Generate test keypairs
    authority = Keypair.generate();
    tourist = Keypair.generate();

    // Airdrop SOL to test accounts
    await provider.connection.requestAirdrop(authority.publicKey, 2 * anchor.web3.LAMPORTS_PER_SOL);
    await provider.connection.requestAirdrop(tourist.publicKey, 2 * anchor.web3.LAMPORTS_PER_SOL);

    // Wait for airdrops to confirm
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Derive PDAs
    [programConfigPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("program_config")],
      program.programId
    );
  });

  it("Initialize the program", async () => {
    const tx = await program.methods
      .initialize()
      .accounts({
        programConfig: programConfigPda,
        authority: authority.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([authority])
      .rpc();

    console.log("Initialize transaction signature:", tx);

    // Verify program config
    const programConfig = await program.account.programConfig.fetch(programConfigPda);
    expect(programConfig.authority.toString()).to.equal(authority.publicKey.toString());
    expect(programConfig.nftCounter.toNumber()).to.equal(0);
  });

  it("Mint a temporary access NFT", async () => {
    // Derive access NFT PDA
    [accessNftPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("access_nft"), new anchor.BN(0).toArrayLike(Buffer, "le", 8)],
      program.programId
    );

    const tx = await program.methods
      .mintAccessNft(
        Array.from(touristIdHash),
        zoneId,
        new anchor.BN(futureTimestamp),
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

    console.log("Mint NFT transaction signature:", tx);

    // Verify NFT was created
    const accessNft = await program.account.accessNft.fetch(accessNftPda);
    expect(accessNft.nftId.toNumber()).to.equal(0);
    expect(Array.from(accessNft.touristIdHash)).to.deep.equal(Array.from(touristIdHash));
    expect(accessNft.zoneId).to.equal(zoneId);
    expect(accessNft.expiryTimestamp.toNumber()).to.equal(futureTimestamp);
    expect(accessNft.touristWallet.toString()).to.equal(tourist.publicKey.toString());
    expect(accessNft.isValid).to.be.true;
    expect(accessNft.metadataUri).to.equal(metadataUri);
  });

  it("Verify access - valid NFT", async () => {
    const result = await program.methods
      .verifyAccess(tourist.publicKey, zoneId)
      .accounts({
        accessNft: accessNftPda,
      })
      .view();

    expect(result).to.be.true;
    console.log("Access verification result:", result);
  });

  it("Verify access - wrong tourist", async () => {
    const wrongTourist = Keypair.generate();
    
    try {
      await program.methods
        .verifyAccess(wrongTourist.publicKey, zoneId)
        .accounts({
          accessNft: accessNftPda,
        })
        .view();
      
      // Should not reach here
      expect.fail("Should have failed with wrong tourist");
    } catch (error) {
      console.log("Expected error for wrong tourist:", error.message);
      expect(error.message).to.include("constraint");
    }
  });

  it("Verify access - wrong zone", async () => {
    const wrongZone = "WRONG_ZONE";
    
    try {
      await program.methods
        .verifyAccess(tourist.publicKey, wrongZone)
        .accounts({
          accessNft: accessNftPda,
        })
        .view();
      
      // Should not reach here
      expect.fail("Should have failed with wrong zone");
    } catch (error) {
      console.log("Expected error for wrong zone:", error.message);
      expect(error.message).to.include("constraint");
    }
  });

  it("Revoke pass by authority", async () => {
    const tx = await program.methods
      .revokePass()
      .accounts({
        accessNft: accessNftPda,
        programConfig: programConfigPda,
        authority: authority.publicKey,
      })
      .signers([authority])
      .rpc();

    console.log("Revoke pass transaction signature:", tx);

    // Verify NFT was revoked
    const accessNft = await program.account.accessNft.fetch(accessNftPda);
    expect(accessNft.isValid).to.be.false;
  });

  it("Verify access - revoked NFT", async () => {
    const result = await program.methods
      .verifyAccess(tourist.publicKey, zoneId)
      .accounts({
        accessNft: accessNftPda,
      })
      .view();

    expect(result).to.be.false;
    console.log("Access verification result for revoked NFT:", result);
  });

  it("Update metadata by authority", async () => {
    const newMetadataUri = "https://ipfs.io/ipfs/QmNewMetadataHash";
    
    const tx = await program.methods
      .updateMetadata(newMetadataUri)
      .accounts({
        accessNft: accessNftPda,
        programConfig: programConfigPda,
        authority: authority.publicKey,
      })
      .signers([authority])
      .rpc();

    console.log("Update metadata transaction signature:", tx);

    // Verify metadata was updated
    const accessNft = await program.account.accessNft.fetch(accessNftPda);
    expect(accessNft.metadataUri).to.equal(newMetadataUri);
  });

  it("Mint NFT with invalid expiry time", async () => {
    const newTourist = Keypair.generate();
    await provider.connection.requestAirdrop(newTourist.publicKey, anchor.web3.LAMPORTS_PER_SOL);
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Derive new access NFT PDA for second NFT
    [accessNftPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("access_nft"), new anchor.BN(1).toArrayLike(Buffer, "le", 8)],
      program.programId
    );

    try {
      await program.methods
        .mintAccessNft(
          Array.from(touristIdHash),
          zoneId,
          new anchor.BN(pastTimestamp), // Past timestamp
          metadataUri
        )
        .accounts({
          programConfig: programConfigPda,
          accessNft: accessNftPda,
          tourist: newTourist.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([newTourist])
        .rpc();
      
      // Should not reach here
      expect.fail("Should have failed with past expiry time");
    } catch (error) {
      console.log("Expected error for past expiry time:", error.message);
      expect(error.message).to.include("InvalidExpiryTime");
    }
  });

  it("Try to revoke already revoked pass", async () => {
    try {
      await program.methods
        .revokePass()
        .accounts({
          accessNft: accessNftPda,
          programConfig: programConfigPda,
          authority: authority.publicKey,
        })
        .signers([authority])
        .rpc();
      
      // Should not reach here
      expect.fail("Should have failed - pass already revoked");
    } catch (error) {
      console.log("Expected error for already revoked pass:", error.message);
      expect(error.message).to.include("PassAlreadyRevoked");
    }
  });

  it("Try to update metadata with wrong authority", async () => {
    const wrongAuthority = Keypair.generate();
    await provider.connection.requestAirdrop(wrongAuthority.publicKey, anchor.web3.LAMPORTS_PER_SOL);
    await new Promise(resolve => setTimeout(resolve, 1000));

    try {
      await program.methods
        .updateMetadata("https://ipfs.io/ipfs/QmWrongAuthority")
        .accounts({
          accessNft: accessNftPda,
          programConfig: programConfigPda,
          authority: wrongAuthority.publicKey,
        })
        .signers([wrongAuthority])
        .rpc();
      
      // Should not reach here
      expect.fail("Should have failed with wrong authority");
    } catch (error) {
      console.log("Expected error for wrong authority:", error.message);
      expect(error.message).to.include("constraint");
    }
  });

  it("Mint multiple NFTs and verify counter increment", async () => {
    // Get current counter
    const programConfig = await program.account.programConfig.fetch(programConfigPda);
    const currentCounter = programConfig.nftCounter.toNumber();

    // Mint another NFT
    const newTourist = Keypair.generate();
    await provider.connection.requestAirdrop(newTourist.publicKey, anchor.web3.LAMPORTS_PER_SOL);
    await new Promise(resolve => setTimeout(resolve, 1000));

    const newAccessNftPda = PublicKey.findProgramAddressSync(
      [Buffer.from("access_nft"), new anchor.BN(currentCounter).toArrayLike(Buffer, "le", 8)],
      program.programId
    )[0];

    const tx = await program.methods
      .mintAccessNft(
        Array.from(new Uint8Array(32).fill(2)), // Different tourist ID hash
        "PARK_ZONE_002", // Different zone
        new anchor.BN(futureTimestamp),
        "https://ipfs.io/ipfs/QmSecondNFT"
      )
      .accounts({
        programConfig: programConfigPda,
        accessNft: newAccessNftPda,
        tourist: newTourist.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([newTourist])
      .rpc();

    console.log("Second NFT mint transaction signature:", tx);

    // Verify counter was incremented
    const updatedProgramConfig = await program.account.programConfig.fetch(programConfigPda);
    expect(updatedProgramConfig.nftCounter.toNumber()).to.equal(currentCounter + 1);

    // Verify second NFT
    const secondNft = await program.account.accessNft.fetch(newAccessNftPda);
    expect(secondNft.nftId.toNumber()).to.equal(currentCounter);
    expect(secondNft.zoneId).to.equal("PARK_ZONE_002");
  });
});
