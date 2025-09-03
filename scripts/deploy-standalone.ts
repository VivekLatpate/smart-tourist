import pkg from "hardhat";
const { ethers } = pkg;

async function main() {
  console.log("🚀 Starting deployment of standalone contracts...");

  // Get the contract factories
  const SimpleVendorRegistry = await ethers.getContractFactory("SimpleVendorRegistry");
  const StandaloneBookingEscrow = await ethers.getContractFactory("StandaloneBookingEscrow");

  console.log("📝 Deploying SimpleVendorRegistry...");
  const vendorRegistry = await SimpleVendorRegistry.deploy();
  await vendorRegistry.waitForDeployment();
  const vendorRegistryAddress = await vendorRegistry.getAddress();
  console.log("✅ SimpleVendorRegistry deployed to:", vendorRegistryAddress);

  console.log("📝 Deploying StandaloneBookingEscrow...");
  const bookingEscrow = await StandaloneBookingEscrow.deploy();
  await bookingEscrow.waitForDeployment();
  const bookingEscrowAddress = await bookingEscrow.getAddress();
  console.log("✅ StandaloneBookingEscrow deployed to:", bookingEscrowAddress);

  console.log("\n🎉 All contracts deployed successfully!");
  console.log("📋 Contract Addresses:");
  console.log("SimpleVendorRegistry:", vendorRegistryAddress);
  console.log("StandaloneBookingEscrow:", bookingEscrowAddress);

  // Create some demo vendors
  console.log("\n📝 Creating demo vendors...");
  const [deployer, vendor1, vendor2] = await ethers.getSigners();
  
  // Register vendor 1
  const vendor1Tx = await vendorRegistry.connect(vendor1).registerVendor(
    "QmDemoHotel1Metadata",
    "QmDemoCancellationPolicy1"
  );
  await vendor1Tx.wait();
  console.log("✅ Demo vendor 1 registered");

  // Register vendor 2
  const vendor2Tx = await vendorRegistry.connect(vendor2).registerVendor(
    "QmDemoHotel2Metadata", 
    "QmDemoCancellationPolicy2"
  );
  await vendor2Tx.wait();
  console.log("✅ Demo vendor 2 registered");

  // Verify vendors
  const verify1Tx = await vendorRegistry.verifyVendor(await vendor1.getAddress(), true);
  await verify1Tx.wait();
  const verify2Tx = await vendorRegistry.verifyVendor(await vendor2.getAddress(), true);
  await verify2Tx.wait();
  console.log("✅ Demo vendors verified");

  console.log("\n📝 Update your .env.local file with these addresses:");
  console.log(`NEXT_PUBLIC_VENDOR_REGISTRY_ADDRESS=${vendorRegistryAddress}`);
  console.log(`NEXT_PUBLIC_BOOKING_ESCROW_ADDRESS=${bookingEscrowAddress}`);
  console.log(`NEXT_PUBLIC_DISPUTE_RESOLUTION_ADDRESS=0x0000000000000000000000000000000000000000`);
  
  console.log("\n🔑 Demo Accounts (for testing):");
  console.log("Admin:", await deployer.getAddress());
  console.log("Vendor 1:", await vendor1.getAddress());
  console.log("Vendor 2:", await vendor2.getAddress());
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
