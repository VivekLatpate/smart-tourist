import { Connection, Keypair, PublicKey, SystemProgram } from '@solana/web3.js';
import { Program, AnchorProvider, BN } from '@coral-xyz/anchor';
import * as fs from 'fs';
import * as path from 'path';

// Program ID
const PROGRAM_ID = new PublicKey("EmergencyAlert1111111111111111111111111111111");

// Program IDL
const IDL = {
  "version": "0.1.0",
  "name": "emergency_alert",
  "instructions": [
    {
      "name": "initialize",
      "accounts": [
        { "name": "emergencyAlert", "isMut": true, "isSigner": false },
        { "name": "authority", "isMut": true, "isSigner": true },
        { "name": "systemProgram", "isMut": false, "isSigner": false }
      ],
      "args": []
    },
    {
      "name": "triggerAlert",
      "accounts": [
        { "name": "emergencyAlert", "isMut": true, "isSigner": false },
        { "name": "alert", "isMut": true, "isSigner": false },
        { "name": "tourist", "isMut": true, "isSigner": true },
        { "name": "systemProgram", "isMut": false, "isSigner": false }
      ],
      "args": [
        { "name": "alertType", "type": "u8" },
        { "name": "location", "type": "string" },
        { "name": "description", "type": "string" }
      ]
    }
  ],
  "accounts": [
    {
      "name": "EmergencyAlert",
      "type": {
        "kind": "struct",
        "fields": [
          { "name": "authority", "type": "publicKey" },
          { "name": "alertCounter", "type": "u64" },
          { "name": "bump", "type": "u8" }
        ]
      }
    }
  ]
};

async function main() {
  console.log("Deploying Solana Emergency Alert Program...");

  try {
    // Connect to Solana devnet
    const connection = new Connection("https://api.devnet.solana.com", "confirmed");
    console.log("Connected to Solana devnet");

    // Create a new keypair for the authority
    const authority = Keypair.generate();
    console.log("Generated authority keypair:", authority.publicKey.toString());

    // Create provider
    const provider = new AnchorProvider(
      connection,
      {
        publicKey: authority.publicKey,
        signTransaction: async (tx) => {
          tx.sign(authority as any);
          return tx;
        },
        signAllTransactions: async (txs) => {
          txs.forEach(tx => tx.sign(authority as any));
          return txs;
        }
      },
      { commitment: "confirmed" }
    );

    // Initialize program
    const program = new Program(IDL as any, provider);

    // Get PDA for emergency alert
    const [emergencyAlertPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("emergency_alert")],
      PROGRAM_ID
    );

    console.log("Emergency Alert PDA:", emergencyAlertPDA.toString());

    // Initialize the emergency alert system
    console.log("Initializing emergency alert system...");
    
    const tx = await (program as any).methods
      .initialize()
      .accounts({
        emergencyAlert: emergencyAlertPDA,
        authority: authority.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    console.log("Initialization transaction:", tx);

    // Verify the account was created
    const emergencyAlertAccount = await (program as any).account.emergencyAlert.fetch(emergencyAlertPDA);
    console.log("Emergency Alert Account:", {
      authority: emergencyAlertAccount.authority.toString(),
      alertCounter: emergencyAlertAccount.alertCounter.toString(),
      bump: emergencyAlertAccount.bump
    });

    console.log("\n=== SOLANA DEPLOYMENT COMPLETE ===");
    console.log("Program ID:", PROGRAM_ID.toString());
    console.log("Authority:", authority.publicKey.toString());
    console.log("Emergency Alert PDA:", emergencyAlertPDA.toString());
    console.log("Network: Solana Devnet");
    console.log("\nNext steps:");
    console.log("1. Update the program ID in your frontend component");
    console.log("2. Update the program ID in your backend listener");
    console.log("3. Start the backend listener: cd backend && npm start");
    console.log("4. Test the system by triggering alerts from the frontend");

    // Save deployment info
    const deploymentInfo = {
      programId: PROGRAM_ID.toString(),
      authority: authority.publicKey.toString(),
      emergencyAlertPDA: emergencyAlertPDA.toString(),
      network: "devnet",
      timestamp: new Date().toISOString()
    };

    fs.writeFileSync(
      path.join(__dirname, '../solana-deployment.json'),
      JSON.stringify(deploymentInfo, null, 2)
    );

    console.log("Deployment info saved to solana-deployment.json");

  } catch (error) {
    console.error("Deployment failed:", error);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
