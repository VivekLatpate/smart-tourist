import { motion } from 'framer-motion'

type VerificationResultProps = {
  scannedData: any
  onClose: () => void
}

export default function VerificationResult({ scannedData, onClose }: VerificationResultProps) {
  const isValid = scannedData && scannedData.name && scannedData.idNumber && scannedData.validUntil && scannedData.txHash
  
  const formatDate = (dateString: string) => {
    if (!dateString) return 'Invalid Date'
    
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return 'Invalid Date'
    
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const isExpired = () => {
    if (!scannedData.validUntil) return false
    
    const validDate = new Date(scannedData.validUntil)
    if (isNaN(validDate.getTime())) return true // Treat invalid dates as expired
    
    return new Date() > validDate
  }

  const getStatusColor = () => {
    if (isExpired()) return 'text-red-400'
    return 'text-green-400'
  }

  const getStatusText = () => {
    if (isExpired()) return 'Expired'
    return 'Valid'
  }

  const getStatusIcon = () => {
    if (isExpired()) return '❌'
    return '✅'
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Result Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="relative w-full max-w-lg glass-strong rounded-2xl border border-cyan-500/20 p-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="text-center mb-6">
          <div className="text-6xl mb-3">{getStatusIcon()}</div>
          <h2 className="text-2xl font-bold gradient-text mb-2">
            Digital ID Verification
          </h2>
          <p className={`text-lg font-semibold ${getStatusColor()}`}>
            {getStatusText()}
          </p>
        </div>

        {isValid ? (
          <>
            {/* ID Details */}
            <div className="space-y-4 mb-6">
              <div className="glass rounded-xl p-4 border border-white/10">
                <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                  <span className="text-cyan-400">👤</span>
                  Personal Information
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-white/60">Name:</span>
                    <span className="text-white font-medium">{scannedData.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/60">ID Number:</span>
                    <span className="text-white font-medium font-mono">{scannedData.idNumber}</span>
                  </div>
                </div>
              </div>

              <div className="glass rounded-xl p-4 border border-white/10">
                <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                  <span className="text-cyan-400">⏰</span>
                  Validity
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-white/60">Valid Until:</span>
                    <span className="text-white font-medium">{formatDate(scannedData.validUntil)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/60">Status:</span>
                    <span className={`font-medium ${getStatusColor()}`}>
                      {getStatusText()}
                    </span>
                  </div>
                </div>
              </div>

              <div className="glass rounded-xl p-4 border border-white/10">
                <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                  <span className="text-cyan-400">🔗</span>
                  Blockchain Verification
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-white/60">Transaction:</span>
                    <a
                      href={`https://explorer.solana.com/tx/${scannedData.txHash}?cluster=devnet`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-cyan-400 hover:text-cyan-300 text-xs underline break-all"
                    >
                      {scannedData.txHash.slice(0, 20)}...
                    </a>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/60">ID Hash:</span>
                    <span className="text-white font-mono text-xs">{scannedData.id}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Security Features */}
            <div className="mb-6 p-4 glass rounded-lg border border-white/10">
              <h4 className="text-white font-medium mb-3 text-sm flex items-center gap-2">
                <span className="text-cyan-400">🔒</span>
                Security Features
              </h4>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                  <span className="text-white/70">Blockchain Verified</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                  <span className="text-white/70">Time-Limited</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                  <span className="text-white/70">Immutable Record</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                  <span className="text-white/70">Tamper-Proof</span>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-8">
            <div className="text-4xl mb-4">⚠️</div>
            <h3 className="text-xl font-semibold text-white mb-2">
              Invalid QR Code
            </h3>
            <p className="text-white/70">
              The scanned data doesn't contain valid Digital ID information.
            </p>
          </div>
        )}

        {/* Action Button */}
        <div className="text-center">
          <motion.button
            onClick={onClose}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="px-8 py-3 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-xl text-white font-semibold"
          >
            Close
          </motion.button>
        </div>

        {/* Footer Note */}
        <div className="mt-6 text-center">
          <p className="text-white/50 text-xs">
            This verification is powered by Solana blockchain technology
          </p>
        </div>
      </motion.div>
    </div>
  )
}
