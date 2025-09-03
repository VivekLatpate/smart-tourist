import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import QRCode from 'qrcode.react'
import VerifyIDModal from './VerifyIDModal'

type DigitalID = {
  id: string
  fullName: string
  idNumber: string
  emergencyContact: string
  visitStartDate: string
  visitEndDate: string
  destination: string
  createdAt: string
  expiryTimestamp: number
  isActive: boolean
  transactionHash?: string
}


export default function DigitalIDList() {
  const [digitalIDs, setDigitalIDs] = useState<DigitalID[]>([])
  const [expandedID, setExpandedID] = useState<string | null>(null)
  const [verifyModalOpen, setVerifyModalOpen] = useState(false)
  const [idToVerify, setIdToVerify] = useState('')

  useEffect(() => {
    // Load IDs from localStorage
    const loadIDs = () => {
      const storedIDs = JSON.parse(localStorage.getItem('digitalIDs') || '[]')
      console.log('Loading stored IDs:', storedIDs)
      
      // Update active status based on expiry
      const updatedIDs = storedIDs.map((id: DigitalID) => ({
        ...id,
        isActive: new Date().getTime() < id.expiryTimestamp
      }))
      
      console.log('Updated IDs with active status:', updatedIDs)
      setDigitalIDs(updatedIDs)
      
      // Save back the updated status
      localStorage.setItem('digitalIDs', JSON.stringify(updatedIDs))
    }

    loadIDs()
    
    // Check every minute for expired IDs
    const interval = setInterval(loadIDs, 60000)
    
    return () => clearInterval(interval)
  }, [])

  // Listen for storage changes to refresh the list
  useEffect(() => {
    const handleStorageChange = () => {
      console.log('Storage changed, reloading IDs...')
      const storedIDs = JSON.parse(localStorage.getItem('digitalIDs') || '[]')
      console.log('New stored IDs:', storedIDs)
      
      const updatedIDs = storedIDs.map((id: DigitalID) => ({
        ...id,
        isActive: new Date().getTime() < id.expiryTimestamp
      }))
      
      setDigitalIDs(updatedIDs)
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  const activeIDs = digitalIDs.filter(id => id.isActive)
  const expiredIDs = digitalIDs.filter(id => !id.isActive)

  const refreshIDs = useCallback(() => {
    console.log('Manual refresh triggered...')
    const storedIDs = JSON.parse(localStorage.getItem('digitalIDs') || '[]')
    console.log('Refreshed stored IDs:', storedIDs)
    
    const updatedIDs = storedIDs.map((id: DigitalID) => ({
      ...id,
      isActive: new Date().getTime() < id.expiryTimestamp
    }))
    
    setDigitalIDs(updatedIDs)
  }, [])

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Invalid Date'
    
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return 'Invalid Date'
    
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const generateQRData = useCallback((id: DigitalID) => {
    return JSON.stringify({
      name: id.fullName,
      idNumber: id.idNumber,
      validUntil: id.visitEndDate,
      txHash: id.transactionHash,
      id: id.id
    })
  }, [])

  const copyIDData = useCallback((id: DigitalID) => {
    const qrData = generateQRData(id)
    navigator.clipboard.writeText(qrData)
    alert('ID data copied to clipboard!')
  }, [generateQRData])

  const handleVerifyID = useCallback((id: string) => {
    setIdToVerify(id)
    setVerifyModalOpen(true)
  }, [])

  const IDCard = ({ id, isExpired = false }: { id: DigitalID; isExpired?: boolean }) => {
    const isExpanded = expandedID === id.id
    
    return (
      <motion.div
        layout
        className={`glass-strong rounded-xl border overflow-hidden ${
          isExpired 
            ? 'border-red-500/20 bg-red-500/5' 
            : 'border-cyan-500/20 hover:border-cyan-500/40'
        } transition-colors duration-300`}
      >
        <div className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <div className={`w-3 h-3 rounded-full ${
                  isExpired ? 'bg-red-400' : 'bg-green-400 animate-pulse'
                }`} />
                <h3 className="text-lg font-semibold text-white">
                  {id.fullName}
                </h3>
              </div>
              
              <div className="space-y-1 text-sm text-white/70">
                <p>ID: {id.idNumber}</p>
                <p>Valid until: {formatDate(id.visitEndDate)}</p>
                {isExpired && (
                  <p className="text-red-400 font-medium">
                    ⚠️ Expired
                  </p>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <motion.button
                onClick={() => handleVerifyID(id.id)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-3 py-2 glass rounded-lg border border-green-500/20 text-green-400 hover:text-green-300 text-sm transition-colors"
                title="Verify this Digital ID"
              >
                🔍 Verify
              </motion.button>
              
              {!isExpired && (
                <>
                  <motion.button
                    onClick={() => copyIDData(id)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-3 py-2 glass rounded-lg border border-cyan-500/20 text-cyan-400 hover:text-cyan-300 text-sm transition-colors"
                    title="Copy ID data to clipboard"
                  >
                    Copy
                  </motion.button>
                  
                  <motion.button
                    onClick={() => {
                      const qrData = generateQRData(id)
                      navigator.clipboard.writeText(qrData)
                      alert('QR code data copied! Share this with others to verify your ID.')
                    }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-3 py-2 glass rounded-lg border border-purple-500/20 text-purple-400 hover:text-purple-300 text-sm transition-colors"
                    title="Copy QR code data for sharing"
                  >
                    📱 QR
                  </motion.button>
                </>
              )}
              
              <motion.button
                onClick={() => setExpandedID(isExpanded ? null : id.id)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-3 py-2 glass rounded-lg border border-white/20 text-white/70 hover:text-white text-sm transition-colors"
              >
                {isExpanded ? 'Less' : 'More'}
              </motion.button>
            </div>
          </div>

          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <div className="mt-4 pt-4 border-t border-white/10">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* ID Details */}
                    <div className="space-y-3">
                      <h4 className="text-white font-medium">Details</h4>
                      <div className="space-y-2 text-sm">
                        <div>
                          <span className="text-white/60">Emergency Contact:</span>
                          <span className="text-white ml-2">{id.emergencyContact}</span>
                        </div>
                        <div>
                          <span className="text-white/60">Travel Period:</span>
                          <span className="text-white ml-2">
                            {formatDate(id.visitStartDate)} - {formatDate(id.visitEndDate)}
                          </span>
                        </div>
                        <div>
                          <span className="text-white/60">Created:</span>
                          <span className="text-white ml-2">
                            {new Date(id.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        {id.transactionHash && (
                          <div>
                            <span className="text-white/60">Transaction:</span>
                            <a
                              href={`https://explorer.solana.com/tx/${id.transactionHash}?cluster=devnet`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-cyan-400 hover:text-cyan-300 ml-2 text-xs underline break-all"
                            >
                              {id.transactionHash.slice(0, 20)}...
                            </a>
                          </div>
                        )}
                      </div>
                      
                      <div className="mt-4">
                        <span className="text-white/60 text-sm">Destination:</span>
                        <p className="text-white text-sm mt-1 leading-relaxed">
                          {id.destination}
                        </p>
                      </div>
                    </div>

                    {/* QR Code */}
                    {!isExpired && (
                      <div className="flex flex-col items-center">
                        <h4 className="text-white font-medium mb-3">QR Code</h4>
                        <div className="bg-white p-3 rounded-xl">
                          <QRCode 
                            value={generateQRData(id)} 
                            size={150}
                          />
                        </div>
                        <p className="text-white/60 text-xs mt-2 text-center">
                          Scan to verify identity
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Active IDs */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse" />
            <h2 className="text-2xl font-bold text-white">
              Active Digital IDs ({activeIDs.length})
            </h2>
          </div>
          
          <div className="flex items-center gap-3">
            <motion.button
              onClick={refreshIDs}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-4 py-2 glass rounded-lg border border-white/20 text-white/70 hover:text-white text-sm transition-colors flex items-center gap-2"
              title="Refresh Digital IDs list"
            >
              <span>🔄</span>
              Refresh
            </motion.button>
            
            <motion.button
              onClick={() => window.location.href = '#scan-qr'}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-4 py-2 glass rounded-lg border border-cyan-500/20 text-cyan-400 hover:text-cyan-300 text-sm transition-colors flex items-center gap-2"
            >
              <span>📱</span>
              Scan QR Code
            </motion.button>
          </div>
        </div>
        
        {activeIDs.length > 0 ? (
          <div className="space-y-4">
            {activeIDs.map((id) => (
              <IDCard key={`active-${id.id}`} id={id} />
            ))}
          </div>
        ) : (
          <div className="glass-strong rounded-xl p-8 text-center border border-white/10">
            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-cyan-500/20 to-purple-500/20 rounded-full flex items-center justify-center">
              <span className="text-2xl">🪪</span>
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">
              No Active Digital IDs
            </h3>
            <p className="text-white/70">
              Create your first Digital ID to get started with secure travel verification.
            </p>
          </div>
        )}
      </section>

      {/* Expired IDs */}
      {expiredIDs.length > 0 && (
        <section>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-3 h-3 bg-red-400 rounded-full" />
            <h2 className="text-2xl font-bold text-white">
              Expired Digital IDs ({expiredIDs.length})
            </h2>
          </div>
          
          <div className="space-y-4">
            {expiredIDs.map((id) => (
              <IDCard key={`expired-${id.id}`} id={id} isExpired />
            ))}
          </div>
        </section>
      )}

      {/* Verify ID Modal */}
      <VerifyIDModal 
        isOpen={verifyModalOpen}
        onClose={() => {
          setVerifyModalOpen(false)
          setIdToVerify('')
        }}
      />
    </div>
  )
}
