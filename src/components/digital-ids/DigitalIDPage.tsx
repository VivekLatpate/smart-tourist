import { useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import WalletConnect from './WalletConnect'
import CreateIDModal from './CreateIDModal'
import DigitalIDList from './DigitalIDList'
import QRScanner from './QRScanner'
import VerificationResult from './VerificationResult'

export default function DigitalIDPage() {
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showScanner, setShowScanner] = useState(false)
  const [showVerification, setShowVerification] = useState(false)
  const [scannedData, setScannedData] = useState<any>(null)
  const [refreshList, setRefreshList] = useState(0)

  const handleCreateSuccess = useCallback(() => {
    // Refresh the list by updating the key
    setRefreshList(prev => prev + 1)
    setShowCreateModal(false)
  }, [])

  const handleShowModal = useCallback(() => {
    setShowCreateModal(true)
  }, [])

  const handleCloseModal = useCallback(() => {
    setShowCreateModal(false)
  }, [])

  const handleShowScanner = useCallback(() => {
    setShowScanner(true)
  }, [])

  const handleCloseScanner = useCallback(() => {
    setShowScanner(false)
  }, [])

  const handleScanResult = useCallback((data: any) => {
    setScannedData(data)
    setShowScanner(false)
    setShowVerification(true)
  }, [])

  const handleCloseVerification = useCallback(() => {
    setShowVerification(false)
    setScannedData(null)
  }, [])

  return (
    <div className="min-h-screen pt-8">
      <div className="mx-auto max-w-6xl px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl sm:text-5xl font-extrabold gradient-text mb-4">
            Time-Limited Digital IDs
          </h1>
          <p className="text-xl text-white/80 max-w-3xl mx-auto leading-relaxed">
            Secure, blockchain-verified digital identification for tourists. 
            Privacy-first, time-limited, and instantly verifiable.
          </p>
        </motion.div>

        {/* Wallet Connection */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="mb-8"
        >
          <WalletConnect />
        </motion.div>

                 {/* Action Buttons */}
         <motion.div
           id="scan-qr"
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ duration: 0.8, delay: 0.4 }}
           className="text-center mb-12"
         >
           <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
             {/* Create ID Button */}
             <motion.button
               onClick={handleShowModal}
               whileHover={{ scale: 1.05, y: -2 }}
               whileTap={{ scale: 0.95 }}
               className="group relative inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-600 px-8 py-4 text-lg font-bold text-white shadow-2xl overflow-hidden"
             >
               <span className="relative z-10 flex items-center gap-3">
                 <span className="text-2xl">🪪</span>
                 Create Digital ID
               </span>
               <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
               
               {/* Animated border */}
               <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 opacity-30 blur-sm group-hover:opacity-60 transition-opacity duration-300"></div>
             </motion.button>

             {/* Scan QR Code Button */}
             <motion.button
               onClick={handleShowScanner}
               whileHover={{ scale: 1.05, y: -2 }}
               whileTap={{ scale: 0.95 }}
               className="group relative inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 px-8 py-4 text-lg font-bold text-white shadow-2xl overflow-hidden"
             >
               <span className="relative z-10 flex items-center gap-3">
                 <span className="text-2xl">📱</span>
                 Scan QR Code
               </span>
               <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-orange-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
               
               {/* Animated border */}
               <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 opacity-30 blur-sm group-hover:opacity-60 transition-opacity duration-300"></div>
             </motion.button>
           </div>
           
           <p className="mt-4 text-white/60 text-sm">
             Create your own Digital ID or scan existing ones to verify authenticity
           </p>
         </motion.div>

        {/* Feature Highlights */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12"
        >
          {[
            {
              icon: '🔒',
              title: 'Privacy First',
              description: 'Your data is encrypted and stored securely with explicit consent controls.'
            },
            {
              icon: '⏰',
              title: 'Time-Limited',
              description: 'IDs automatically expire based on your travel dates for enhanced security.'
            },
            {
              icon: '🌐',
              title: 'Blockchain Verified',
              description: 'Immutable verification on Solana blockchain ensures authenticity.'
            }
          ].map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.8 + index * 0.1 }}
              className="glass-strong rounded-xl p-6 border border-white/10 text-center"
            >
              <div className="text-4xl mb-4">{feature.icon}</div>
              <h3 className="text-lg font-semibold text-white mb-2">
                {feature.title}
              </h3>
              <p className="text-white/70 text-sm leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </motion.div>

        {/* Digital ID List */}
        <motion.div
          key={refreshList} // Force re-render when refreshList changes
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
        >
          <DigitalIDList />
        </motion.div>
      </div>

             {/* Create ID Modal */}
       <CreateIDModal
         isOpen={showCreateModal}
         onClose={handleCloseModal}
         onSuccess={handleCreateSuccess}
       />

       {/* QR Scanner Modal */}
       <QRScanner
         isOpen={showScanner}
         onScan={handleScanResult}
         onClose={handleCloseScanner}
       />

       {/* Verification Result Modal */}
       {showVerification && scannedData && (
         <VerificationResult
           scannedData={scannedData}
           onClose={handleCloseVerification}
         />
       )}
     </div>
   )
 }
