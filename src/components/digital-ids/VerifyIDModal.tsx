import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import QRCode from 'qrcode.react'

type VerifyIDModalProps = {
  isOpen: boolean
  onClose: () => void
}

type VerificationResult = {
  isValid: boolean
  id?: string
  fullName?: string
  idNumber?: string
  emergencyContact?: string
  visitStartDate?: string
  visitEndDate?: string
  destination?: string
  createdAt?: string
  expiryTimestamp?: number
  isActive?: boolean
  transactionHash?: string
  message: string
}

export default function VerifyIDModal({ isOpen, onClose }: VerifyIDModalProps) {
  const [idToVerify, setIdToVerify] = useState('')
  const [isVerifying, setIsVerifying] = useState(false)
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null)
  const [showQRScanner, setShowQRScanner] = useState(false)
  const [scannedData, setScannedData] = useState<string>('')

  const handleVerify = useCallback(async () => {
    if (!idToVerify.trim()) {
      alert('Please enter a Digital ID to verify')
      return
    }

    setIsVerifying(true)
    setVerificationResult(null)

    try {
      // Get stored digital IDs from localStorage
      const storedIDs = JSON.parse(localStorage.getItem('digitalIDs') || '[]')
      
      // Find the ID in stored data
      const foundID = storedIDs.find((id: any) => id.id === idToVerify.trim())
      
      if (!foundID) {
        setVerificationResult({
          isValid: false,
          message: 'Digital ID not found in our records.'
        })
        return
      }

      // Check if ID is expired
      const now = Date.now()
      const isExpired = foundID.expiryTimestamp && now > foundID.expiryTimestamp
      
      if (isExpired) {
        setVerificationResult({
          isValid: false,
          id: foundID.id,
          fullName: foundID.fullName,
          idNumber: foundID.idNumber,
          emergencyContact: foundID.emergencyContact,
          visitStartDate: foundID.visitStartDate,
          visitEndDate: foundID.visitEndDate,
          destination: foundID.destination,
          createdAt: foundID.createdAt,
          expiryTimestamp: foundID.expiryTimestamp,
          isActive: foundID.isActive,
          transactionHash: foundID.transactionHash,
          message: 'Digital ID has expired and is no longer valid.'
        })
        return
      }

      // Check if ID is active
      if (foundID.isActive === false) {
        setVerificationResult({
          isValid: false,
          id: foundID.id,
          fullName: foundID.fullName,
          idNumber: foundID.idNumber,
          emergencyContact: foundID.emergencyContact,
          visitStartDate: foundID.visitStartDate,
          visitEndDate: foundID.visitEndDate,
          destination: foundID.destination,
          createdAt: foundID.createdAt,
          expiryTimestamp: foundID.expiryTimestamp,
          isActive: foundID.isActive,
          transactionHash: foundID.transactionHash,
          message: 'Digital ID has been deactivated and is no longer valid.'
        })
        return
      }

      // ID is valid
      setVerificationResult({
        isValid: true,
        id: foundID.id,
        fullName: foundID.fullName,
        idNumber: foundID.idNumber,
        emergencyContact: foundID.emergencyContact,
        visitStartDate: foundID.visitStartDate,
        visitEndDate: foundID.visitEndDate,
        destination: foundID.destination,
        createdAt: foundID.createdAt,
        expiryTimestamp: foundID.expiryTimestamp,
        isActive: foundID.isActive,
        transactionHash: foundID.transactionHash,
        message: 'Digital ID is valid and active.'
      })

    } catch (error) {
      console.error('Error verifying ID:', error)
      setVerificationResult({
        isValid: false,
        message: 'Error occurred while verifying the Digital ID. Please try again.'
      })
    } finally {
      setIsVerifying(false)
    }
  }, [idToVerify])

  const resetForm = useCallback(() => {
    setIdToVerify('')
    setVerificationResult(null)
    setScannedData('')
    setShowQRScanner(false)
  }, [])

  const handleClose = useCallback(() => {
    resetForm()
    onClose()
  }, [resetForm, onClose])

  const handleQRScan = useCallback((data: string) => {
    setScannedData(data)
    setIdToVerify(data)
    setShowQRScanner(false)
  }, [])

  const openQRScanner = useCallback(() => {
    setShowQRScanner(true)
    setScannedData('')
  }, [])

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={handleClose}
          />
          
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto glass-strong rounded-2xl border border-cyan-500/20"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold gradient-text">Verify Digital ID</h2>
                <button
                  onClick={handleClose}
                  className="text-white/60 hover:text-white transition-colors"
                >
                  ✕
                </button>
              </div>

              {!verificationResult ? (
                // Verification Form
                <div className="space-y-6">
                  <div className="glass rounded-xl p-4 border border-white/10">
                    <p className="text-white/80 text-sm">
                      Enter a Digital ID to verify its validity, expiration status, and view associated information.
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-2">
                      Digital ID *
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={idToVerify}
                        onChange={(e) => setIdToVerify(e.target.value)}
                        placeholder="Enter the Digital ID to verify"
                        className="flex-1 px-4 py-3 glass rounded-xl border border-white/10 focus:border-cyan-500/50 focus:outline-none text-white placeholder-white/50"
                      />
                      <button
                        type="button"
                        onClick={openQRScanner}
                        className="px-4 py-3 glass rounded-xl border border-white/20 text-white hover:border-white/40 transition-colors"
                        title="Scan QR Code"
                      >
                        📷
                      </button>
                    </div>
                    <p className="text-xs text-white/60 mt-1">
                      You can also scan a QR code from a Digital ID holder
                    </p>
                    {scannedData && (
                      <div className="mt-2 p-2 bg-green-500/20 border border-green-500/30 rounded-lg">
                        <div className="flex items-center gap-2 text-green-400 text-xs">
                          <span>✓</span>
                          <span>QR Code scanned successfully!</span>
                        </div>
                        <div className="text-green-300 text-xs mt-1 font-mono break-all">
                          Scanned: {scannedData}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-4 pt-4">
                    <button
                      type="button"
                      onClick={handleClose}
                      className="flex-1 px-6 py-3 glass rounded-xl border border-white/20 text-white hover:border-white/40 transition-colors"
                    >
                      Cancel
                    </button>
                    
                    <motion.button
                      onClick={handleVerify}
                      disabled={!idToVerify.trim() || isVerifying}
                      whileHover={{ scale: idToVerify.trim() && !isVerifying ? 1.02 : 1 }}
                      whileTap={{ scale: idToVerify.trim() && !isVerifying ? 0.98 : 1 }}
                      className="flex-1 px-6 py-3 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-xl text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      {isVerifying ? 'Verifying...' : 'Verify ID'}
                    </motion.button>
                  </div>
                </div>
              ) : (
                // Verification Result
                <div className="space-y-6">
                  <div className={`glass rounded-xl p-4 border ${
                    verificationResult.isValid 
                      ? 'border-green-500/50 bg-green-500/10' 
                      : 'border-red-500/50 bg-red-500/10'
                  }`}>
                    <div className="flex items-center gap-3 mb-2">
                      <span className={`text-2xl ${verificationResult.isValid ? 'text-green-400' : 'text-red-400'}`}>
                        {verificationResult.isValid ? '✅' : '❌'}
                      </span>
                      <span className={`text-lg font-semibold ${
                        verificationResult.isValid ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {verificationResult.isValid ? 'Valid Digital ID' : 'Invalid Digital ID'}
                      </span>
                    </div>
                    <p className="text-white/80">{verificationResult.message}</p>
                  </div>

                  {verificationResult.id && (
                    <div className="glass rounded-xl p-4 border border-white/10">
                      <h3 className="text-lg font-semibold text-white mb-4">ID Details</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-white/60">ID:</span>
                          <span className="ml-2 text-white font-mono">{verificationResult.id}</span>
                        </div>
                        <div>
                          <span className="text-white/60">Status:</span>
                          <span className={`ml-2 font-semibold ${
                            verificationResult.isActive ? 'text-green-400' : 'text-red-400'
                          }`}>
                            {verificationResult.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                        <div>
                          <span className="text-white/60">Full Name:</span>
                          <span className="ml-2 text-white">{verificationResult.fullName}</span>
                        </div>
                        <div>
                          <span className="text-white/60">ID Number:</span>
                          <span className="ml-2 text-white">{verificationResult.idNumber}</span>
                        </div>
                        <div>
                          <span className="text-white/60">Emergency Contact:</span>
                          <span className="ml-2 text-white">{verificationResult.emergencyContact}</span>
                        </div>
                        <div>
                          <span className="text-white/60">Visit Start:</span>
                          <span className="ml-2 text-white">
                            {verificationResult.visitStartDate ? new Date(verificationResult.visitStartDate).toLocaleDateString() : 'N/A'}
                          </span>
                        </div>
                        <div>
                          <span className="text-white/60">Visit End:</span>
                          <span className="ml-2 text-white">
                            {verificationResult.visitEndDate ? new Date(verificationResult.visitEndDate).toLocaleDateString() : 'N/A'}
                          </span>
                        </div>
                        <div>
                          <span className="text-white/60">Created:</span>
                          <span className="ml-2 text-white">
                            {verificationResult.createdAt ? new Date(verificationResult.createdAt).toLocaleDateString() : 'N/A'}
                          </span>
                        </div>
                        <div>
                          <span className="text-white/60">Expires:</span>
                          <span className="ml-2 text-white">
                            {verificationResult.expiryTimestamp ? new Date(verificationResult.expiryTimestamp).toLocaleDateString() : 'N/A'}
                          </span>
                        </div>
                      </div>
                      
                      {verificationResult.destination && (
                        <div className="mt-4">
                          <span className="text-white/60">Destination:</span>
                          <p className="mt-1 text-white">{verificationResult.destination}</p>
                        </div>
                      )}

                      {verificationResult.transactionHash && (
                        <div className="mt-4">
                          <span className="text-white/60">Transaction Hash:</span>
                          <a
                            href={`https://explorer.solana.com/tx/${verificationResult.transactionHash}?cluster=devnet`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block mt-1 text-cyan-400 hover:text-cyan-300 text-sm font-mono break-all underline"
                          >
                            {verificationResult.transactionHash}
                          </a>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex gap-4 pt-4">
                    <button
                      type="button"
                      onClick={resetForm}
                      className="flex-1 px-6 py-3 glass rounded-xl border border-white/20 text-white hover:border-white/40 transition-colors"
                    >
                      Verify Another ID
                    </button>
                    
                    <motion.button
                      onClick={handleClose}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="flex-1 px-6 py-3 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-xl text-white font-semibold"
                    >
                      Close
                    </motion.button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}

      {/* QR Scanner Modal */}
      {showQRScanner && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
          <div className="relative w-full max-w-md glass-strong rounded-2xl border border-cyan-500/20 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white">Scan QR Code</h3>
              <button
                onClick={() => setShowQRScanner(false)}
                className="text-white/60 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>
            
            <div className="text-center space-y-4">
              <div className="glass rounded-xl p-6 border border-white/10">
                <div className="w-32 h-32 mx-auto mb-4 bg-gradient-to-br from-cyan-500/20 to-purple-500/20 rounded-xl flex items-center justify-center">
                  <span className="text-4xl">📷</span>
                </div>
                <p className="text-white/80 text-sm mb-4">
                  Point your camera at a Digital ID QR code to scan
                </p>
                
                {/* Demo QR Code for testing */}
                <div className="mb-4">
                  <p className="text-white/60 text-xs mb-2">Demo QR Code (for testing):</p>
                  <div className="bg-white p-2 rounded-lg inline-block">
                    <QRCode 
                      value="demo-digital-id-12345" 
                      size={80} 
                      level="M"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <button
                    onClick={() => handleQRScan('demo-digital-id-12345')}
                    className="w-full px-4 py-2 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-lg text-white text-sm font-semibold"
                  >
                    Scan Demo QR Code
                  </button>
                  <button
                    onClick={() => setShowQRScanner(false)}
                    className="w-full px-4 py-2 glass rounded-lg border border-white/20 text-white text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </div>
              
              <div className="text-xs text-white/60">
                <p>💡 Tip: In a real implementation, this would use your device's camera</p>
                <p>For now, use the demo QR code above to test the feature</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </AnimatePresence>
  )
}
