'use client'

import { useState, useEffect } from 'react'
import { ethers } from 'ethers'
import { motion, AnimatePresence } from 'framer-motion'

// Contract ABI - in a real app, this would be imported from compiled artifacts
const SAFETY_ESCROW_ABI = [
  "function createBooking(string memory bookingId, address operator) external payable",
  "function getBooking(string memory bookingId) external view returns (tuple(address tourist, address operator, uint256 amount, uint256 depositTime, uint256 slaDeadline, uint8 status, bool slaVerified, string bookingId))",
  "function getTimeRemaining(string memory bookingId) external view returns (uint256)",
  "function isTimedOut(string memory bookingId) external view returns (bool)",
  "function raiseDispute(string memory bookingId) external",
  "function releaseToOperator(string memory bookingId) external",
  "function refundToTourist(string memory bookingId) external",
  "function refundWithPenalty(string memory bookingId) external",
  "function handleTimeout(string memory bookingId) external",
  "event DepositMade(string indexed bookingId, address indexed tourist, address indexed operator, uint256 amount)",
  "event SLAPassed(string indexed bookingId, address indexed operator)",
  "event SLAFailed(string indexed bookingId, address indexed tourist)",
  "event Refunded(string indexed bookingId, address indexed tourist, uint256 amount)",
  "event PaidOut(string indexed bookingId, address indexed operator, uint256 amount)",
  "event Disputed(string indexed bookingId, address indexed tourist, address indexed operator)"
]

// Booking status enum
enum BookingStatus {
  Pending = 0,
  SLAPassed = 1,
  SLAFailed = 2,
  Refunded = 3,
  Paid = 4,
  Disputed = 5
}

interface Booking {
  tourist: string
  operator: string
  amount: bigint
  depositTime: bigint
  slaDeadline: bigint
  status: BookingStatus
  slaVerified: boolean
  bookingId: string
}

interface SafeBookingEscrowProps {
  contractAddress?: string
}

export default function SafeBookingEscrow({ contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3" }: SafeBookingEscrowProps) {
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null)
  const [signer, setSigner] = useState<ethers.JsonRpcSigner | null>(null)
  const [contract, setContract] = useState<ethers.Contract | null>(null)
  const [account, setAccount] = useState<string>("")
  const [isConnected, setIsConnected] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  // Booking form state
  const [bookingId, setBookingId] = useState("")
  const [operatorAddress, setOperatorAddress] = useState("")
  const [depositAmount, setDepositAmount] = useState("")

  // Booking display state
  const [currentBooking, setCurrentBooking] = useState<Booking | null>(null)
  const [timeRemaining, setTimeRemaining] = useState(0)
  const [isTimedOut, setIsTimedOut] = useState(false)

  // Connect to MetaMask
  const connectWallet = async () => {
    try {
      if (typeof (window as any).ethereum !== 'undefined') {
        const provider = new ethers.BrowserProvider((window as any).ethereum)
        await provider.send("eth_requestAccounts", [])
        const signer = await provider.getSigner()
        const address = await signer.getAddress()
        
        setProvider(provider)
        setSigner(signer)
        setAccount(address)
        setIsConnected(true)
        
        // Initialize contract
        const contract = new ethers.Contract(contractAddress, SAFETY_ESCROW_ABI, signer)
        setContract(contract)
        
        setSuccess("Wallet connected successfully!")
        setTimeout(() => setSuccess(""), 3000)
      } else {
        setError("MetaMask is not installed. Please install MetaMask to continue.")
      }
    } catch (err: any) {
      setError(`Failed to connect wallet: ${err.message}`)
    }
  }

  // Create booking
  const createBooking = async () => {
    if (!contract || !bookingId || !operatorAddress || !depositAmount) {
      setError("Please fill in all fields")
      return
    }

    try {
      setLoading(true)
      setError("")
      
      const amount = ethers.parseEther(depositAmount)
      const tx = await contract.createBooking(bookingId, operatorAddress, { value: amount })
      
      setSuccess(`Booking created! Transaction: ${tx.hash}`)
      await tx.wait()
      
      // Refresh booking data
      await loadBooking(bookingId)
      
      // Clear form
      setBookingId("")
      setOperatorAddress("")
      setDepositAmount("")
      
    } catch (err: any) {
      setError(`Failed to create booking: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  // Load booking data
  const loadBooking = async (id: string) => {
    if (!contract) return

    try {
      const booking = await contract.getBooking(id)
      setCurrentBooking(booking)
      
      // Get time remaining
      const remaining = await contract.getTimeRemaining(id)
      setTimeRemaining(Number(remaining))
      
      // Check if timed out
      const timedOut = await contract.isTimedOut(id)
      setIsTimedOut(timedOut)
      
    } catch (err: any) {
      if (err.message.includes("Booking does not exist")) {
        setCurrentBooking(null)
      } else {
        setError(`Failed to load booking: ${err.message}`)
      }
    }
  }

  // Raise dispute
  const raiseDispute = async () => {
    if (!contract || !currentBooking) return

    try {
      setLoading(true)
      setError("")
      
      const tx = await contract.raiseDispute(currentBooking.bookingId)
      setSuccess(`Dispute raised! Transaction: ${tx.hash}`)
      await tx.wait()
      
      // Refresh booking data
      await loadBooking(currentBooking.bookingId)
      
    } catch (err: any) {
      setError(`Failed to raise dispute: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  // Handle timeout
  const handleTimeout = async () => {
    if (!contract || !currentBooking) return

    try {
      setLoading(true)
      setError("")
      
      const tx = await contract.handleTimeout(currentBooking.bookingId)
      setSuccess(`Timeout handled! Transaction: ${tx.hash}`)
      await tx.wait()
      
      // Refresh booking data
      await loadBooking(currentBooking.bookingId)
      
    } catch (err: any) {
      setError(`Failed to handle timeout: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  // Format time remaining
  const formatTimeRemaining = (seconds: number) => {
    if (seconds <= 0) return "Expired"
    
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    
    return `${hours}h ${minutes}m ${secs}s`
  }

  // Get status text
  const getStatusText = (status: BookingStatus) => {
    switch (status) {
      case BookingStatus.Pending: return "Pending SLA Verification"
      case BookingStatus.SLAPassed: return "SLA Passed"
      case BookingStatus.SLAFailed: return "SLA Failed"
      case BookingStatus.Refunded: return "Refunded"
      case BookingStatus.Paid: return "Paid to Operator"
      case BookingStatus.Disputed: return "Disputed"
      default: return "Unknown"
    }
  }

  // Get status color
  const getStatusColor = (status: BookingStatus) => {
    switch (status) {
      case BookingStatus.Pending: return "text-yellow-400"
      case BookingStatus.SLAPassed: return "text-green-400"
      case BookingStatus.SLAFailed: return "text-red-400"
      case BookingStatus.Refunded: return "text-blue-400"
      case BookingStatus.Paid: return "text-green-400"
      case BookingStatus.Disputed: return "text-orange-400"
      default: return "text-gray-400"
    }
  }

  // Update countdown timer
  useEffect(() => {
    if (timeRemaining > 0) {
      const timer = setInterval(() => {
        setTimeRemaining(prev => Math.max(0, prev - 1))
      }, 1000)
      
      return () => clearInterval(timer)
    }
  }, [timeRemaining])

  return (
    <div className="max-w-4xl mx-auto p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-strong rounded-xl p-8 border border-white/10"
      >
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">🛡️ Safe Booking Escrow</h1>
          <p className="text-white/70">Secure your tour bookings with blockchain escrow and safety verification</p>
        </div>

        {/* Connection Status */}
        {!isConnected ? (
          <div className="text-center py-8">
            <button
              onClick={connectWallet}
              className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-semibold py-3 px-8 rounded-lg transition-all duration-200 transform hover:scale-105"
            >
              Connect MetaMask Wallet
            </button>
            <p className="text-white/60 mt-4 text-sm">
              Connect your wallet to interact with the Safety Escrow contract
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Wallet Info */}
            <div className="bg-white/5 rounded-lg p-4 border border-white/10">
              <h3 className="text-white font-semibold mb-2">Connected Wallet</h3>
              <p className="text-white/70 text-sm font-mono">{account}</p>
            </div>

            {/* Create Booking Form */}
            <div className="bg-white/5 rounded-lg p-6 border border-white/10">
              <h3 className="text-white font-semibold mb-4">Create New Booking</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-white/70 text-sm mb-2">Booking ID</label>
                  <input
                    type="text"
                    value={bookingId}
                    onChange={(e) => setBookingId(e.target.value)}
                    placeholder="e.g., tour-123"
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-white/70 text-sm mb-2">Operator Address</label>
                  <input
                    type="text"
                    value={operatorAddress}
                    onChange={(e) => setOperatorAddress(e.target.value)}
                    placeholder="0x..."
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-white/70 text-sm mb-2">Deposit Amount (ETH)</label>
                  <input
                    type="number"
                    step="0.001"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    placeholder="0.1"
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>
              <button
                onClick={createBooking}
                disabled={loading}
                className="mt-4 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 disabled:from-gray-500 disabled:to-gray-600 text-white font-semibold py-2 px-6 rounded-lg transition-all duration-200 disabled:cursor-not-allowed"
              >
                {loading ? "Creating..." : "Deposit Booking Fee"}
              </button>
            </div>

            {/* Load Booking */}
            <div className="bg-white/5 rounded-lg p-6 border border-white/10">
              <h3 className="text-white font-semibold mb-4">Load Existing Booking</h3>
              <div className="flex gap-4">
                <input
                  type="text"
                  placeholder="Enter booking ID"
                  className="flex-1 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-cyan-500"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      loadBooking((e.target as HTMLInputElement).value)
                    }
                  }}
                />
                <button
                  onClick={() => {
                    const input = document.querySelector('input[placeholder="Enter booking ID"]') as HTMLInputElement
                    if (input?.value) loadBooking(input.value)
                  }}
                  className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white font-semibold py-2 px-6 rounded-lg transition-all duration-200"
                >
                  Load Booking
                </button>
              </div>
            </div>

            {/* Booking Display */}
            {currentBooking && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white/5 rounded-lg p-6 border border-white/10"
              >
                <h3 className="text-white font-semibold mb-4">Booking Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <div>
                      <span className="text-white/70 text-sm">Booking ID:</span>
                      <p className="text-white font-mono">{currentBooking.bookingId}</p>
                    </div>
                    <div>
                      <span className="text-white/70 text-sm">Tourist:</span>
                      <p className="text-white font-mono text-sm">{currentBooking.tourist}</p>
                    </div>
                    <div>
                      <span className="text-white/70 text-sm">Operator:</span>
                      <p className="text-white font-mono text-sm">{currentBooking.operator}</p>
                    </div>
                    <div>
                      <span className="text-white/70 text-sm">Amount:</span>
                      <p className="text-white">{ethers.formatEther(currentBooking.amount)} ETH</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <span className="text-white/70 text-sm">Status:</span>
                      <p className={`font-semibold ${getStatusColor(currentBooking.status)}`}>
                        {getStatusText(currentBooking.status)}
                      </p>
                    </div>
                    <div>
                      <span className="text-white/70 text-sm">SLA Verified:</span>
                      <p className="text-white">{currentBooking.slaVerified ? "Yes" : "No"}</p>
                    </div>
                    <div>
                      <span className="text-white/70 text-sm">Time Remaining:</span>
                      <p className={`font-semibold ${timeRemaining > 0 ? "text-yellow-400" : "text-red-400"}`}>
                        {formatTimeRemaining(timeRemaining)}
                      </p>
                    </div>
                    <div>
                      <span className="text-white/70 text-sm">Timed Out:</span>
                      <p className={`font-semibold ${isTimedOut ? "text-red-400" : "text-green-400"}`}>
                        {isTimedOut ? "Yes" : "No"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="mt-6 flex flex-wrap gap-3">
                  {currentBooking.status === BookingStatus.Pending && isTimedOut && (
                    <button
                      onClick={handleTimeout}
                      disabled={loading}
                      className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 disabled:from-gray-500 disabled:to-gray-600 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200 disabled:cursor-not-allowed"
                    >
                      Handle Timeout
                    </button>
                  )}
                  
                  {(currentBooking.status === BookingStatus.SLAPassed || currentBooking.status === BookingStatus.SLAFailed) && (
                    <button
                      onClick={raiseDispute}
                      disabled={loading}
                      className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:from-gray-500 disabled:to-gray-600 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200 disabled:cursor-not-allowed"
                    >
                      Raise Dispute
                    </button>
                  )}
                </div>
              </motion.div>
            )}

            {/* Messages */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="bg-red-500/20 border border-red-500/50 rounded-lg p-4"
                >
                  <p className="text-red-300">{error}</p>
                </motion.div>
              )}
              
              {success && (
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="bg-green-500/20 border border-green-500/50 rounded-lg p-4"
                >
                  <p className="text-green-300">{success}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </motion.div>
    </div>
  )
}
