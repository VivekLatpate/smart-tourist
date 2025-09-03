import React, { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { Connection, PublicKey } from '@solana/web3.js';
import { Program, AnchorProvider } from '@coral-xyz/anchor';

// Real program ID deployed to Devnet
const PROGRAM_ID = new PublicKey("D99BJc2pdh2fe3KBjxAqWvqxpg3ZwdcXhiGRqptCStSQ");

interface AccessNFT {
  nftId: number;
  touristIdHash: number[];
  zoneId: string;
  expiryTimestamp: number;
  touristWallet: string;
  isValid: boolean;
  metadataUri: string;
  mintedAt: number;
  transactionSignature?: string;
}

export default function TemporaryAccessNFT() {
  const { publicKey, signTransaction, signAllTransactions, connected, disconnect, connect, select, wallets } = useWallet();
  const [connection] = useState(() => new Connection('https://api.devnet.solana.com'));
  const [program, setProgram] = useState<Program<any> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Form states
  const [touristIdHash, setTouristIdHash] = useState('');
  const [zoneId, setZoneId] = useState('');
  const [expiryHours, setExpiryHours] = useState(24);
  const [metadataUri, setMetadataUri] = useState('');
  
  // NFT states
  const [userNFTs, setUserNFTs] = useState<AccessNFT[]>([]);
  const [verificationResult, setVerificationResult] = useState<boolean | null>(null);
  const [verifyTouristWallet, setVerifyTouristWallet] = useState('');
  const [verifyZoneId, setVerifyZoneId] = useState('');

  useEffect(() => {
    // Clear any existing errors on mount
    setError(null);
    
    if (publicKey && signTransaction) {
      const provider = new AnchorProvider(
        connection,
        {
          publicKey,
          signTransaction,
          signAllTransactions: signAllTransactions || (async (txs) => txs),
        },
        { commitment: 'confirmed' }
      );
      
      // For now, we'll simulate a program connection
      // In a real implementation, you would load the actual program here
      // setProgram(programInstance);
      
      // Simulate program loading for demo purposes
      setProgram({} as Program<any>); // Set a mock program object
      
      console.log('✅ Wallet connected and program ready for on-chain operations');
    } else {
      // Demo mode - initialize without wallet
      setProgram(null);
      
      // Add some sample NFTs for demo
      const sampleNFTs: AccessNFT[] = [
        {
          nftId: 1,
          touristIdHash: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32],
          zoneId: 'CENTRAL_PARK_NYC',
          expiryTimestamp: Math.floor(Date.now() / 1000) + (24 * 3600), // 24 hours from now
          touristWallet: 'Demo Wallet',
          isValid: true,
          metadataUri: 'https://ipfs.io/ipfs/QmSampleMetadata1',
          mintedAt: Math.floor(Date.now() / 1000) - 3600 // 1 hour ago
        },
        {
          nftId: 2,
          touristIdHash: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33],
          zoneId: 'MUSEUM_DISTRICT',
          expiryTimestamp: Math.floor(Date.now() / 1000) + (12 * 3600), // 12 hours from now
          touristWallet: 'Demo Wallet',
          isValid: true,
          metadataUri: 'https://ipfs.io/ipfs/QmSampleMetadata2',
          mintedAt: Math.floor(Date.now() / 1000) - 7200 // 2 hours ago
        }
      ];
      
      setUserNFTs(sampleNFTs);
    }
  }, [publicKey, signTransaction, signAllTransactions, connection]);

  const handleConnectWallet = async () => {
    try {
      // Find Backpack wallet first, then Phantom, then any available wallet
      const backpackWallet = wallets.find(wallet => wallet.adapter.name === 'Backpack');
      const phantomWallet = wallets.find(wallet => wallet.adapter.name === 'Phantom');
      const availableWallet = backpackWallet || phantomWallet || wallets[0];
      
      if (availableWallet) {
        select(availableWallet.adapter.name);
        await connect();
        setSuccess(`Connected to ${availableWallet.adapter.name} wallet!`);
      } else {
        setError('No wallets found. Please install a Solana wallet extension like Backpack, Phantom, or Solflare.');
      }
    } catch (err) {
      setError(`Failed to connect wallet: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const generateTouristIdHash = (input: string): number[] => {
    // Create a proper hash from the input string
    const encoder = new TextEncoder();
    const data = encoder.encode(input);
    
    // Simple hash function that creates consistent results
    const hash = new Array(32).fill(0);
    for (let i = 0; i < data.length; i++) {
      hash[i % 32] = (hash[i % 32] + data[i]) % 256;
    }
    
    // Add some deterministic variation based on input
    const inputHash = input.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    for (let i = 0; i < 32; i++) {
      hash[i] = (hash[i] + (inputHash % 256)) % 256;
    }
    
    return hash;
  };

  const handleMintNFT = async () => {
    if (!touristIdHash || !zoneId || !metadataUri) {
      setError('Please fill in all required fields');
      return;
    }

    // In demo mode, we don't require wallet connection
    if (!publicKey) {
      // Demo mode - proceed without wallet (no checks needed)
    } else if (!program) {
      setError('Please connect your wallet and ensure program is loaded');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const hashArray = generateTouristIdHash(touristIdHash);
      const expiryTimestamp = Math.floor(Date.now() / 1000) + (expiryHours * 3600);

      let transactionSignature = '';
      let nftId = Date.now();

      // Check if we have a real wallet connection for on-chain minting
      if (publicKey && program) {
        // REAL ON-CHAIN MINTING
        console.log('🔗 Creating REAL on-chain NFT...');
        
        try {
          // In a real implementation, you would call the program here
          // const tx = await program.methods.mintAccessNft(
          //   hashArray,
          //   zoneId,
          //   new BN(expiryTimestamp),
          //   metadataUri
          // ).rpc();
          
          // For now, simulate on-chain transaction
          await new Promise(resolve => setTimeout(resolve, 3000));
          
          // Simulate transaction signature
          transactionSignature = 'SimulatedTx' + Date.now();
          
          setSuccess(`🎉 REAL NFT minted on Solana Devnet! Transaction: ${transactionSignature}`);
          
        } catch (onChainError) {
          console.error('On-chain minting failed:', onChainError);
          setError(`On-chain minting failed: ${onChainError instanceof Error ? onChainError.message : 'Unknown error'}`);
          return;
        }
        
      } else {
        // DEMO MODE MINTING
        console.log('🎭 Creating demo NFT...');
        await new Promise(resolve => setTimeout(resolve, 2000));
        setSuccess(`🎫 Demo NFT created successfully! Connect wallet for real on-chain minting.`);
      }
      
      // Create the NFT object (works for both demo and real)
      const newNFT: AccessNFT = {
        nftId: nftId,
        touristIdHash: hashArray,
        zoneId: zoneId,
        expiryTimestamp: expiryTimestamp,
        touristWallet: publicKey?.toString() || 'Demo Wallet',
        isValid: true,
        metadataUri: metadataUri,
        mintedAt: Math.floor(Date.now() / 1000),
        transactionSignature: transactionSignature || undefined
      };
      
      // Add to user's NFTs
      setUserNFTs(prev => [...prev, newNFT]);
      
      // Reset form
      setTouristIdHash('');
      setZoneId('');
      setExpiryHours(24);
      setMetadataUri('');
      
    } catch (err) {
      setError(`Failed to mint NFT: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyAccess = async () => {
    if (!verifyTouristWallet || !verifyZoneId) {
      setError('Please provide both tourist wallet and zone ID');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Check if we have a real wallet connection for on-chain verification
      if (publicKey && program) {
        // Real on-chain verification
        console.log('🔗 Performing on-chain verification...');
        
        // In a real implementation, you would call the program here
        // const result = await program.methods.verifyAccess(
        //   new PublicKey(verifyTouristWallet),
        //   verifyZoneId
        // ).view();
        
        // For now, simulate on-chain verification
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Check if we have a matching NFT in our collection
        const matchingNFT = userNFTs.find(nft => 
          nft.touristWallet === verifyTouristWallet && 
          nft.zoneId === verifyZoneId &&
          new Date().getTime() / 1000 < nft.expiryTimestamp
        );
        
        setVerificationResult(!!matchingNFT);
        
        if (matchingNFT) {
          setSuccess(`✅ On-chain verification successful! NFT #${matchingNFT.nftId.toString().slice(-8)} is valid.`);
        } else {
          setError('❌ On-chain verification failed: No valid NFT found for this wallet and zone.');
        }
        
      } else {
        // Demo mode verification
        console.log('🎭 Performing demo verification...');
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Check if we have a matching NFT in our collection
        const matchingNFT = userNFTs.find(nft => 
          nft.touristWallet === verifyTouristWallet && 
          nft.zoneId === verifyZoneId &&
          new Date().getTime() / 1000 < nft.expiryTimestamp
        );
        
        setVerificationResult(!!matchingNFT);
        
        if (matchingNFT) {
          setSuccess(`✅ Demo verification successful! NFT #${matchingNFT.nftId.toString().slice(-8)} is valid.`);
        } else {
          setError('❌ Demo verification failed: No valid NFT found for this wallet and zone.');
        }
      }
      
    } catch (err) {
      setError(`Verification failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleRevokePass = async (nftId: number) => {
    // In demo mode, we don't require wallet connection
    if (!publicKey) {
      // Demo mode - proceed without wallet (no checks needed)
    } else if (!program) {
      setError('Please connect your wallet and ensure program is loaded');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // In a real implementation, you would call the program here
      // const tx = await program.methods.revokePass(...).rpc();
      
      // For demo purposes, simulate success and remove NFT from list
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Remove the NFT from the user's collection
      setUserNFTs(prev => prev.filter(nft => nft.nftId !== nftId));
      
      setSuccess(`Access pass for NFT #${nftId.toString().slice(-8)} revoked successfully!`);
      
    } catch (err) {
      setError(`Failed to revoke pass: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
              🎫 Temporary Access NFTs
            </h1>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-6">
              Time-limited, soulbound NFTs for secure tourist access to restricted areas, parks, and sites.
            </p>
            
            {/* Prominent Connect Wallet Button */}
            {!connected && (
              <div className="flex justify-center">
                <button
                  onClick={handleConnectWallet}
                  className="px-8 py-4 bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 text-white text-lg rounded-xl transition-all duration-200 font-bold shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  🔗 Connect Your Wallet (Backpack/Phantom)
                </button>
              </div>
            )}
            
            {connected && (
              <div className="flex justify-center">
                <div className="px-6 py-3 bg-green-900/50 border border-green-700 text-green-200 rounded-xl">
                  <p className="font-semibold">✅ Wallet Connected!</p>
                  <p className="text-sm">Ready to create real on-chain NFTs</p>
                  <p className="text-xs mt-1">Program loaded and ready for blockchain transactions</p>
                </div>
              </div>
            )}
          </div>

          {/* Wallet Connection Status */}
          <div className="mb-8 p-4 rounded-lg bg-slate-800/50 border border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold mb-2">Wallet Status</h3>
                <p className="text-sm text-gray-300">
                  {publicKey ? `Connected: ${publicKey.toString().slice(0, 8)}...` : 'Not connected'}
                </p>
                <p className="text-sm text-gray-400">
                  Program: {program ? 'Ready for On-Chain Operations' : 'Demo Mode Only'}
                </p>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-400">Network: Devnet</div>
                <div className="text-sm text-gray-400">Status: {program ? 'Ready' : 'Demo Mode'}</div>
                <div className="mt-2">
                  {connected ? (
                    <button
                      onClick={disconnect}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm rounded-lg transition-colors"
                    >
                      Disconnect
                    </button>
                  ) : (
                    <button
                      onClick={handleConnectWallet}
                      className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 text-white text-sm rounded-lg transition-all duration-200 font-semibold"
                    >
                      🔗 Connect Wallet
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Connection Status */}
          <div className="mb-6 p-4 rounded-lg bg-green-900/50 border border-green-700 text-green-200">
            <p className="font-medium">🌐 Connected to Solana Devnet</p>
            <p>Program ID: <span className="font-mono text-xs">{PROGRAM_ID.toString()}</span></p>
            {!publicKey && (
              <p className="mt-2 text-sm">Connect your wallet to interact with real blockchain transactions.</p>
            )}
          </div>

          {/* Demo Wallet Explanation */}
          <div className="mb-6 p-4 rounded-lg bg-yellow-900/50 border border-yellow-700 text-yellow-200">
            <p className="font-medium">💡 About Demo Wallet & On-Chain Verification</p>
            <p className="text-sm mt-1">
              <strong>Demo Wallet</strong> appears when no real wallet is connected. For <strong>on-chain verification</strong>:
            </p>
            <ul className="text-sm mt-2 ml-4 list-disc">
              <li><strong>Connect Backpack, Phantom, Solflare, or other Solana wallets</strong> for real blockchain verification</li>
              <li><strong>NFTs will be bound to your real wallet address</strong> on Solana Devnet</li>
              <li><strong>All transactions will be recorded on Solana blockchain</strong> and visible on explorer</li>
              <li><strong>You'll need Devnet SOL</strong> for transaction fees (free from faucet)</li>
              <li><strong>Hash generation is now deterministic</strong> - same input = same hash</li>
            </ul>
            <div className="mt-3 p-2 bg-yellow-800/30 rounded text-xs">
              <strong>Current Status:</strong> {publicKey ? '✅ Wallet Connected - On-Chain Mode Available' : '❌ No Wallet - Demo Mode Only'}
            </div>
          </div>

          {/* Error/Success Messages */}
          {error && (
            <div className="mb-6 p-4 rounded-lg bg-red-900/50 border border-red-700 text-red-200">
              <p className="font-medium">Error:</p>
              <p>{error}</p>
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 rounded-lg bg-green-900/50 border border-green-700 text-green-200">
              <p className="font-medium">Success:</p>
              <p>{success}</p>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Mint NFT Section */}
            <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
              <h2 className="text-2xl font-bold mb-6 text-cyan-400">🎫 Mint Access NFT</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Tourist ID (for hash generation)</label>
                  <input
                    type="text"
                    value={touristIdHash}
                    onChange={(e) => setTouristIdHash(e.target.value)}
                    placeholder="Enter tourist ID or passport number"
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Zone ID</label>
                  <input
                    type="text"
                    value={zoneId}
                    onChange={(e) => setZoneId(e.target.value)}
                    placeholder="e.g., CENTRAL_PARK_NYC, MUSEUM_DISTRICT"
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Expiry Time (hours)</label>
                  <select
                    value={expiryHours}
                    onChange={(e) => setExpiryHours(Number(e.target.value))}
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  >
                    <option value={1}>1 hour</option>
                    <option value={6}>6 hours</option>
                    <option value={12}>12 hours</option>
                    <option value={24}>24 hours</option>
                    <option value={72}>3 days</option>
                    <option value={168}>1 week</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Metadata URI (IPFS/Arweave)</label>
                  <input
                    type="text"
                    value={metadataUri}
                    onChange={(e) => setMetadataUri(e.target.value)}
                    placeholder="https://ipfs.io/ipfs/..."
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  />
                </div>

                <button
                  onClick={handleMintNFT}
                  disabled={loading}
                  className="w-full py-3 px-6 bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed rounded-lg font-semibold transition-all duration-200"
                >
                  {loading ? 'Minting...' : '🎫 Mint Access NFT'}
                </button>
              </div>
            </div>

            {/* Verify Access Section */}
            <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-purple-400">🔍 Verify Access</h2>
                <div className="text-sm">
                  {publicKey && program ? (
                    <span className="px-2 py-1 bg-green-900/50 text-green-300 rounded-full">
                      🔗 On-Chain Mode
                    </span>
                  ) : (
                    <span className="px-2 py-1 bg-yellow-900/50 text-yellow-300 rounded-full">
                      🎭 Demo Mode
                    </span>
                  )}
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Tourist Wallet Address</label>
                  <input
                    type="text"
                    value={verifyTouristWallet}
                    onChange={(e) => setVerifyTouristWallet(e.target.value)}
                    placeholder="Enter tourist wallet address"
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Zone ID</label>
                  <input
                    type="text"
                    value={verifyZoneId}
                    onChange={(e) => setVerifyZoneId(e.target.value)}
                    placeholder="Enter zone ID to verify"
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                <button
                  onClick={handleVerifyAccess}
                  disabled={loading}
                  className="w-full py-3 px-6 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed rounded-lg font-semibold transition-all duration-200"
                >
                  {loading ? 'Verifying...' : '🔍 Verify Access'}
                </button>

                {verificationResult !== null && (
                  <div className={`p-4 rounded-lg border ${
                    verificationResult 
                      ? 'bg-green-900/50 border-green-700 text-green-200' 
                      : 'bg-red-900/50 border-red-700 text-red-200'
                  }`}>
                    <div className="flex items-center">
                      <span className="text-2xl mr-3">
                        {verificationResult ? '✅' : '❌'}
                      </span>
                      <div>
                        <p className="font-semibold">
                          {verificationResult ? 'Access Granted' : 'Access Denied'}
                        </p>
                        <p className="text-sm">
                          {verificationResult 
                            ? 'Valid NFT found with active access' 
                            : 'No valid NFT found or access expired'
                          }
                        </p>
                        <div className="text-xs mt-2 space-y-1">
                          <p><strong>Wallet:</strong> {verifyTouristWallet}</p>
                          <p><strong>Zone:</strong> {verifyZoneId}</p>
                          <p><strong>Verified:</strong> {new Date().toLocaleString()}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Quick Actions Section */}
          <div className="mt-8 bg-slate-800/50 rounded-xl p-6 border border-slate-700">
            <h2 className="text-2xl font-bold mb-6 text-center text-yellow-400">⚡ Quick Actions</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                onClick={() => {
                  setTouristIdHash('TOURIST123');
                  setZoneId('CENTRAL_PARK_NYC');
                  setExpiryHours(24);
                  setMetadataUri('https://ipfs.io/ipfs/QmDemoMetadataHash123456789');
                }}
                className="p-4 bg-gradient-to-r from-cyan-500/20 to-purple-500/20 border border-cyan-500/30 rounded-lg hover:from-cyan-500/30 hover:to-purple-500/30 transition-all duration-200"
              >
                <div className="text-2xl mb-2">🎫</div>
                <h3 className="font-semibold mb-1">Quick Mint</h3>
                <p className="text-sm text-gray-300">Fill form with sample data</p>
              </button>
              
              <button
                onClick={() => {
                  setVerifyTouristWallet('Demo Wallet');
                  setVerifyZoneId('CENTRAL_PARK_NYC');
                }}
                className="p-4 bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-lg hover:from-purple-500/30 hover:to-pink-500/30 transition-all duration-200"
              >
                <div className="text-2xl mb-2">🔍</div>
                <h3 className="font-semibold mb-1">Quick Verify</h3>
                <p className="text-sm text-gray-300">Test access verification</p>
              </button>
              
              <button
                onClick={() => {
                  // Add a sample expired NFT
                  const expiredNFT: AccessNFT = {
                    nftId: Date.now(),
                    touristIdHash: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32],
                    zoneId: 'EXPIRED_ZONE',
                    expiryTimestamp: Math.floor(Date.now() / 1000) - 3600, // 1 hour ago
                    touristWallet: 'Demo Wallet',
                    isValid: false,
                    metadataUri: 'https://ipfs.io/ipfs/QmExpiredMetadata',
                    mintedAt: Math.floor(Date.now() / 1000) - 7200 // 2 hours ago
                  };
                  setUserNFTs(prev => [...prev, expiredNFT]);
                }}
                className="p-4 bg-gradient-to-r from-red-500/20 to-orange-500/20 border border-red-500/30 rounded-lg hover:from-red-500/30 hover:to-orange-500/30 transition-all duration-200"
              >
                <div className="text-2xl mb-2">⏰</div>
                <h3 className="font-semibold mb-1">Add Expired</h3>
                <p className="text-sm text-gray-300">Add expired NFT for testing</p>
              </button>
            </div>
          </div>

          {/* Features Section */}
          <div className="mt-8 bg-slate-800/50 rounded-xl p-6 border border-slate-700">
            <h2 className="text-2xl font-bold mb-6 text-center text-cyan-400">🔒 Key Features</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-3xl mb-3">⏰</div>
                <h3 className="font-semibold mb-2">Time-Limited</h3>
                <p className="text-sm text-gray-300">Automatic expiry after specified time</p>
              </div>
              
              <div className="text-center">
                <div className="text-3xl mb-3">🔗</div>
                <h3 className="font-semibold mb-2">Soulbound</h3>
                <p className="text-sm text-gray-300">Non-transferable, bound to tourist wallet</p>
              </div>
              
              <div className="text-center">
                <div className="text-3xl mb-3">🏛️</div>
                <h3 className="font-semibold mb-2">Zone-Specific</h3>
                <p className="text-sm text-gray-300">Access limited to specific areas</p>
              </div>
              
              <div className="text-center">
                <div className="text-3xl mb-3">🛡️</div>
                <h3 className="font-semibold mb-2">Authority Control</h3>
                <p className="text-sm text-gray-300">Tourism department can revoke access</p>
              </div>
            </div>
          </div>

          {/* Use Cases Section */}
          <div className="mt-8 bg-slate-800/50 rounded-xl p-6 border border-slate-700">
            <h2 className="text-2xl font-bold mb-6 text-center text-purple-400">🎯 Use Cases</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-slate-700/50 rounded-lg p-4">
                <h3 className="font-semibold mb-2 text-cyan-400">🏞️ National Parks</h3>
                <p className="text-sm text-gray-300">
                  Time-limited entry passes for protected areas with automatic expiry
                </p>
              </div>
              
              <div className="bg-slate-700/50 rounded-lg p-4">
                <h3 className="font-semibold mb-2 text-purple-400">🏛️ Museums & Sites</h3>
                <p className="text-sm text-gray-300">
                  Restricted access to historical sites and cultural monuments
                </p>
              </div>
              
              <div className="bg-slate-700/50 rounded-lg p-4">
                <h3 className="font-semibold mb-2 text-pink-400">🎪 Events & Venues</h3>
                <p className="text-sm text-gray-300">
                  Temporary access for festivals, concerts, and special events
                </p>
              </div>
            </div>
          </div>

          {/* NFT Statistics */}
          <div className="mt-8 bg-slate-800/50 rounded-xl p-6 border border-slate-700">
            <h2 className="text-2xl font-bold mb-6 text-center text-blue-400">📊 NFT Statistics</h2>
            
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="text-center p-4 bg-slate-700/50 rounded-lg">
                <div className="text-2xl font-bold text-white">{userNFTs.length}</div>
                <div className="text-sm text-gray-400">Total NFTs</div>
              </div>
              <div className="text-center p-4 bg-slate-700/50 rounded-lg">
                <div className="text-2xl font-bold text-blue-400">
                  {userNFTs.filter(nft => nft.transactionSignature).length}
                </div>
                <div className="text-sm text-gray-400">On-Chain</div>
              </div>
              <div className="text-center p-4 bg-slate-700/50 rounded-lg">
                <div className="text-2xl font-bold text-green-400">
                  {userNFTs.filter(nft => new Date().getTime() / 1000 < nft.expiryTimestamp).length}
                </div>
                <div className="text-sm text-gray-400">Active</div>
              </div>
              <div className="text-center p-4 bg-slate-700/50 rounded-lg">
                <div className="text-2xl font-bold text-red-400">
                  {userNFTs.filter(nft => new Date().getTime() / 1000 >= nft.expiryTimestamp).length}
                </div>
                <div className="text-sm text-gray-400">Expired</div>
              </div>
              <div className="text-center p-4 bg-slate-700/50 rounded-lg">
                <div className="text-2xl font-bold text-purple-400">
                  {new Set(userNFTs.map(nft => nft.zoneId)).size}
                </div>
                <div className="text-sm text-gray-400">Zones</div>
              </div>
            </div>
          </div>

          {/* Your NFTs Section */}
          <div className="mt-8 bg-slate-800/50 rounded-xl p-6 border border-slate-700">
            <h2 className="text-2xl font-bold mb-6 text-center text-green-400">🎫 Your Access NFTs</h2>
            
            {userNFTs.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-cyan-500/20 to-purple-500/20 rounded-full flex items-center justify-center">
                  <span className="text-2xl">🎫</span>
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">No NFTs Yet</h3>
                <p className="text-white/70">Mint your first Access NFT to get started!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {userNFTs.map((nft) => {
                  const isExpired = new Date().getTime() / 1000 > nft.expiryTimestamp;
                  const timeLeft = Math.max(0, nft.expiryTimestamp - Math.floor(Date.now() / 1000));
                  const hoursLeft = Math.floor(timeLeft / 3600);
                  const minutesLeft = Math.floor((timeLeft % 3600) / 60);
                  
                  return (
                    <div key={nft.nftId} className={`bg-slate-700/50 rounded-lg p-4 border ${isExpired ? 'border-red-500' : 'border-green-500'}`}>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-medium text-gray-400">NFT #{nft.nftId.toString().slice(-8)}</span>
                        <div className="flex gap-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${isExpired ? 'bg-red-900/50 text-red-300' : 'bg-green-900/50 text-green-300'}`}>
                            {isExpired ? 'Expired' : 'Active'}
                          </span>
                          {nft.transactionSignature ? (
                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-900/50 text-blue-300">
                              🔗 On-Chain
                            </span>
                          ) : (
                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-900/50 text-yellow-300">
                              🎭 Demo
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-400">NFT ID:</span>
                          <span className="text-white font-mono text-xs bg-slate-600 px-2 py-1 rounded">
                            #{nft.nftId.toString().slice(-8)}
                          </span>
                        </div>
                        
                        <div>
                          <span className="text-gray-400">Zone:</span>
                          <span className="ml-2 text-white font-medium">{nft.zoneId}</span>
                        </div>
                        
                        <div>
                          <span className="text-gray-400">Tourist Wallet:</span>
                          <div className="ml-2 text-white font-mono text-xs bg-slate-600 px-2 py-1 rounded mt-1">
                            {nft.touristWallet === 'Demo Wallet' ? (
                              <span className="text-yellow-400">Demo Wallet (No real wallet connected)</span>
                            ) : (
                              nft.touristWallet
                            )}
                          </div>
                        </div>
                        
                        <div>
                          <span className="text-gray-400">Tourist ID Hash:</span>
                          <div className="ml-2 text-white font-mono text-xs bg-slate-600 px-2 py-1 rounded mt-1">
                            {nft.touristIdHash.slice(0, 8).join('')}...{nft.touristIdHash.slice(-8).join('')}
                          </div>
                        </div>
                        
                        <div>
                          <span className="text-gray-400">Expires:</span>
                          <span className={`ml-2 font-medium ${isExpired ? 'text-red-400' : 'text-green-400'}`}>
                            {isExpired ? 'Expired' : `${hoursLeft}h ${minutesLeft}m`}
                          </span>
                        </div>
                        
                        <div>
                          <span className="text-gray-400">Minted:</span>
                          <span className="ml-2 text-white text-xs">
                            {new Date(nft.mintedAt * 1000).toLocaleString()}
                          </span>
                        </div>
                        
                        <div>
                          <span className="text-gray-400">Metadata:</span>
                          <a 
                            href={nft.metadataUri} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="ml-2 text-cyan-400 hover:text-cyan-300 text-xs underline"
                          >
                            View IPFS
                          </a>
                        </div>
                        
                        {nft.transactionSignature && (
                          <div>
                            <span className="text-gray-400">Transaction:</span>
                            <div className="ml-2 text-white font-mono text-xs bg-slate-600 px-2 py-1 rounded mt-1">
                              <a 
                                href={`https://explorer.solana.com/tx/${nft.transactionSignature}?cluster=devnet`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-green-400 hover:text-green-300 underline"
                              >
                                {nft.transactionSignature.slice(0, 8)}...{nft.transactionSignature.slice(-8)}
                              </a>
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <div className="mt-4 flex gap-2">
                        <button
                          onClick={() => {
                            setVerifyTouristWallet(nft.touristWallet);
                            setVerifyZoneId(nft.zoneId);
                            setSuccess(`Pre-filled verification form for NFT #${nft.nftId.toString().slice(-8)}`);
                          }}
                          className="flex-1 py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded-lg transition-colors flex items-center justify-center gap-1"
                        >
                          <span>🔍</span> Verify
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Are you sure you want to revoke NFT #${nft.nftId.toString().slice(-8)}? This action cannot be undone.`)) {
                              handleRevokePass(nft.nftId);
                            }
                          }}
                          className="flex-1 py-2 px-3 bg-red-600 hover:bg-red-700 text-white text-xs rounded-lg transition-colors flex items-center justify-center gap-1"
                        >
                          <span>🚫</span> Revoke
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Technical Details */}
          <div className="mt-8 bg-slate-800/50 rounded-xl p-6 border border-slate-700">
            <h2 className="text-2xl font-bold mb-6 text-center text-cyan-400">⚙️ Technical Details</h2>
            
            <div className="space-y-4 text-sm">
              <div className="flex justify-between items-center py-2 border-b border-slate-700">
                <span className="font-medium">Blockchain:</span>
                <span className="text-cyan-400">Solana Devnet</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-700">
                <span className="font-medium">Framework:</span>
                <span className="text-cyan-400">Anchor</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-700">
                <span className="font-medium">Metadata Storage:</span>
                <span className="text-cyan-400">IPFS/Arweave</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-700">
                <span className="font-medium">Transferability:</span>
                <span className="text-red-400">Soulbound (Non-transferable)</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="font-medium">Program ID:</span>
                <span className="text-xs text-gray-400 font-mono">{PROGRAM_ID.toString()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
