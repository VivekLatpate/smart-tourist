import { useState, useCallback } from 'react'
import { motion } from 'framer-motion'

type QRScannerProps = {
  isOpen: boolean
  onScan: (data: any) => void
  onClose: () => void
}

export default function QRScanner({ isOpen, onScan, onClose }: QRScannerProps) {
  const [isScanning, setIsScanning] = useState(false)
  const [scannedData, setScannedData] = useState<string>('')

  const handleManualInput = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setScannedData(e.target.value)
  }, [])

  const handleVerify = useCallback(() => {
    try {
      const parsedData = JSON.parse(scannedData)
      
      // Validate the scanned data structure
      if (parsedData.name && parsedData.idNumber && parsedData.validUntil && parsedData.txHash) {
        onScan(parsedData)
      } else {
        alert('Invalid QR code data. Please scan a valid Digital ID QR code.')
      }
    } catch (error) {
      alert('Invalid QR code data. Please scan a valid Digital ID QR code.')
    }
  }, [scannedData, onScan])

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        const result = event.target?.result as string
        setScannedData(result)
      }
      reader.readAsText(file)
    }
  }, [])

  if (!isOpen) return null

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
      
      {/* Scanner Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="relative w-full max-w-md glass-strong rounded-2xl border border-cyan-500/20 p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold gradient-text mb-2">Verify Digital ID</h2>
          <p className="text-white/70 text-sm">
            Scan a QR code or manually enter the data to verify a Digital ID
          </p>
        </div>

        {/* Camera Scanner Placeholder */}
        <div className="mb-6">
          <div className="relative bg-black/20 rounded-xl p-8 border-2 border-dashed border-cyan-500/30">
            <div className="text-center">
              <div className="text-4xl mb-3">📱</div>
              <p className="text-white/60 text-sm mb-4">
                {isScanning ? 'Scanning...' : 'Camera scanner coming soon'}
              </p>
              
              {/* Camera permission button */}
              <motion.button
                onClick={() => setIsScanning(!isScanning)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-4 py-2 glass rounded-lg border border-cyan-500/20 text-cyan-400 hover:text-cyan-300 text-sm transition-colors"
              >
                {isScanning ? 'Stop Scanner' : 'Enable Camera'}
              </motion.button>
            </div>
            
            {/* Scanning animation */}
            {isScanning && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-32 h-32 border-2 border-cyan-400 rounded-lg relative">
                  <div className="absolute inset-0 border-t-2 border-cyan-400 rounded-t-lg animate-pulse"></div>
                  <div className="absolute inset-0 border-r-2 border-cyan-400 rounded-r-lg animate-pulse" style={{ animationDelay: '0.5s' }}></div>
                  <div className="absolute inset-0 border-b-2 border-cyan-400 rounded-b-lg animate-pulse" style={{ animationDelay: '1s' }}></div>
                  <div className="absolute inset-0 border-l-2 border-cyan-400 rounded-l-lg animate-pulse" style={{ animationDelay: '1.5s' }}></div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Alternative Input Methods */}
        <div className="space-y-4 mb-6">
          {/* File Upload */}
          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">
              Upload QR Code Image
            </label>
            <input
              type="file"
              accept="image/*,.txt"
              onChange={handleFileUpload}
              className="w-full px-3 py-2 glass rounded-lg border border-white/10 text-white text-sm file:mr-4 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-cyan-500/20 file:text-cyan-400 hover:file:bg-cyan-500/30"
            />
          </div>

          {/* Manual Input */}
          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">
              Or Paste QR Code Data
            </label>
            <textarea
              value={scannedData}
              onChange={handleManualInput}
              placeholder="Paste the QR code data here..."
              rows={4}
              className="w-full px-3 py-2 glass rounded-lg border border-white/10 text-white placeholder-white/50 focus:border-cyan-500/50 focus:outline-none transition-colors resize-none text-sm"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 glass rounded-xl border border-white/20 text-white hover:border-white/40 transition-colors"
          >
            Cancel
          </button>
          <motion.button
            onClick={handleVerify}
            disabled={!scannedData.trim()}
            whileHover={{ scale: scannedData.trim() ? 1.02 : 1 }}
            whileTap={{ scale: scannedData.trim() ? 0.98 : 1 }}
            className="flex-1 px-4 py-3 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-xl text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            Verify ID
          </motion.button>
        </div>

        {/* Instructions */}
        <div className="mt-6 p-4 glass rounded-lg border border-white/10">
          <h4 className="text-white font-medium mb-2 text-sm">How to use:</h4>
          <ul className="text-white/70 text-xs space-y-1">
            <li>• Point your camera at a Digital ID QR code</li>
            <li>• Or upload a QR code image file</li>
            <li>• Or manually paste the QR code data</li>
            <li>• Click "Verify ID" to check authenticity</li>
          </ul>
        </div>
      </motion.div>
    </div>
  )
}
