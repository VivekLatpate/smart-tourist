import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { PublicKey, SystemProgram } from "@solana/web3.js";

async function main() {
  // Configure the client to use the devnet cluster
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.TemporaryAccessNft as Program<any>;
  const authority = provider.wallet;

  console.log("Deploying Temporary Access NFT program...");
  console.log("Program ID:", program.programId.toString());
  console.log("Authority:", authority.publicKey.toString());

  // Derive program config PDA
  const [programConfigPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("program_config")],
    program.programId
  );

  console.log("Program Config PDA:", programConfigPda.toString());

  try {
    // Initialize the program
    const tx = await (program as any).methods
      .initialize()
      .accounts({
        programConfig: programConfigPda,
        authority: authority.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    console.log("✅ Program initialized successfully!");
    console.log("Transaction signature:", tx);

    // Verify initialization
    const programConfig = await (program as any).account.programConfig.fetch(programConfigPda);
    console.log("Program Config:");
    console.log("- Authority:", programConfig.authority.toString());
    console.log("- NFT Counter:", programConfig.nftCounter.toNumber());
    console.log("- Bump:", programConfig.bump);

  } catch (error) {
    console.error("❌ Failed to initialize program:", error);
    throw error;
  }
}

main()
  .then(() => {
    console.log("🎉 Deployment completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("💥 Deployment failed:", error);
    process.exit(1);
  });
