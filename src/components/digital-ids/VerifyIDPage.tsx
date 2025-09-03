import { useState } from 'react'
import { motion } from 'framer-motion'
import VerifyIDModal from './VerifyIDModal'

export default function VerifyIDPage() {
  const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false)

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-5xl md:text-6xl font-bold mb-6 gradient-text">
              Verify Digital ID
            </h1>
            <p className="text-xl text-white/80 mb-8 max-w-3xl mx-auto">
              Instantly verify the validity and status of any Digital ID. Check expiration dates, 
              view holder information, and confirm authenticity with blockchain verification.
            </p>
            
            <motion.button
              onClick={() => setIsVerifyModalOpen(true)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-8 py-4 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-xl text-white font-semibold text-lg shadow-lg hover:shadow-xl transition-all"
            >
              🔍 Verify Digital ID
            </motion.button>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold mb-6 gradient-text">
              Why Verify Digital IDs?
            </h2>
            <p className="text-xl text-white/80 max-w-3xl mx-auto">
              Our verification system provides instant, secure, and comprehensive validation 
              of Digital IDs with blockchain-backed authenticity.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="glass rounded-2xl p-6 border border-white/10 hover:border-cyan-500/30 transition-all"
            >
              <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-cyan-400 rounded-xl flex items-center justify-center mb-4">
                <span className="text-2xl">⚡</span>
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">Instant Verification</h3>
              <p className="text-white/70">
                Get immediate results on ID validity, expiration status, and holder information 
                in seconds.
              </p>
            </motion.div>

            {/* Feature 2 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="glass rounded-2xl p-6 border border-white/10 hover:border-cyan-500/30 transition-all"
            >
              <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-purple-400 rounded-xl flex items-center justify-center mb-4">
                <span className="text-2xl">🔐</span>
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">Blockchain Security</h3>
              <p className="text-white/70">
                Every verification is backed by Solana blockchain records, ensuring 
                tamper-proof authenticity.
              </p>
            </motion.div>

            {/* Feature 3 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="glass rounded-2xl p-6 border border-white/10 hover:border-cyan-500/30 transition-all"
            >
              <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-red-400 rounded-xl flex items-center justify-center mb-4">
                <span className="text-2xl">📊</span>
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">Complete Information</h3>
              <p className="text-white/70">
                View full ID details including expiration dates, holder information, 
                and transaction history.
              </p>
            </motion.div>

            {/* Feature 4 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="glass rounded-2xl p-6 border border-white/10 hover:border-cyan-500/30 transition-all"
            >
              <div className="w-16 h-16 bg-gradient-to-br from-pink-400 to-rose-400 rounded-xl flex items-center justify-center mb-4">
                <span className="text-2xl">🌍</span>
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">Tourism Ready</h3>
              <p className="text-white/70">
                Perfect for hotels, attractions, and authorities to quickly verify 
                tourist credentials.
              </p>
            </motion.div>

            {/* Feature 5 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.7 }}
              className="glass rounded-2xl p-6 border border-white/10 hover:border-cyan-500/30 transition-all"
            >
              <div className="w-16 h-16 bg-gradient-to-br from-emerald-400 to-teal-400 rounded-xl flex items-center justify-center mb-4">
                <span className="text-2xl">🔄</span>
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">Real-time Updates</h3>
              <p className="text-white/70">
                Always get the most current information with live blockchain data 
                and instant status updates.
              </p>
            </motion.div>

            {/* Feature 6 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.8 }}
              className="glass rounded-2xl p-6 border border-white/10 hover:border-cyan-500/30 transition-all"
            >
              <div className="w-16 h-16 bg-gradient-to-br from-violet-400 to-indigo-400 rounded-xl flex items-center justify-center mb-4">
                <span className="text-2xl">📱</span>
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">Mobile Friendly</h3>
              <p className="text-white/70">
                Verify IDs on any device with our responsive design and intuitive 
                mobile interface.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.9 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold mb-6 gradient-text">
              How Verification Works
            </h2>
            <p className="text-xl text-white/80">
              Simple three-step process to verify any Digital ID
            </p>
          </motion.div>

          <div className="space-y-8">
            {/* Step 1 */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 1.0 }}
              className="flex items-center gap-6"
            >
              <div className="w-16 h-16 bg-gradient-to-br from-cyan-400 to-blue-400 rounded-full flex items-center justify-center text-white font-bold text-xl">
                1
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-white mb-2">Enter the Digital ID</h3>
                <p className="text-white/70">
                  Input the Digital ID you want to verify. This can be copied from the ID holder 
                  or scanned from a QR code.
                </p>
              </div>
            </motion.div>

            {/* Step 2 */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 1.1 }}
              className="flex items-center gap-6"
            >
              <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-white font-bold text-xl">
                2
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-white mb-2">Instant Blockchain Check</h3>
                <p className="text-white/70">
                  Our system queries the Solana blockchain to verify the ID's authenticity, 
                  check expiration, and retrieve all associated data.
                </p>
              </div>
            </motion.div>

            {/* Step 3 */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 1.2 }}
              className="flex items-center gap-6"
            >
              <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-emerald-400 rounded-full flex items-center justify-center text-white font-bold text-xl">
                3
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-white mb-2">Get Complete Results</h3>
                <p className="text-white/70">
                  Receive comprehensive verification results including validity status, 
                  holder information, expiration dates, and blockchain transaction details.
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1.3 }}
          >
            <h2 className="text-4xl font-bold mb-6 gradient-text">
              Ready to Verify a Digital ID?
            </h2>
            <p className="text-xl text-white/80 mb-8">
              Start verifying Digital IDs in seconds with our secure, blockchain-powered system.
            </p>
            
            <motion.button
              onClick={() => setIsVerifyModalOpen(true)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-8 py-4 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-xl text-white font-semibold text-lg shadow-lg hover:shadow-xl transition-all"
            >
              🔍 Start Verifying Now
            </motion.button>
          </motion.div>
        </div>
      </section>

      {/* Verification Modal */}
      <VerifyIDModal 
        isOpen={isVerifyModalOpen}
        onClose={() => setIsVerifyModalOpen(false)}
      />
    </div>
  )
}
