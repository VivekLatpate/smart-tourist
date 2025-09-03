import { useWallet } from '@solana/wallet-adapter-react'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import { motion } from 'framer-motion'

export default function WalletConnect() {
  const { connected, publicKey } = useWallet()

  return (
    <div className="glass-strong rounded-xl p-6 border border-cyan-500/20">
      <div className="flex items-center gap-4">
        <div className="flex-shrink-0">
          {connected ? (
            <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
          ) : (
            <div className="w-3 h-3 bg-red-400 rounded-full"></div>
          )}
        </div>
        
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-white mb-2">
            Wallet Connection
          </h3>
          
          {connected ? (
            <div className="space-y-2">
              <p className="text-green-400 text-sm">
                ✅ Connected to Solana Devnet
              </p>
              <p className="text-white/70 text-xs font-mono break-all">
                {publicKey?.toString()}
              </p>
            </div>
          ) : (
            <p className="text-white/70 text-sm">
              Connect your Phantom wallet to create Digital IDs
            </p>
          )}
        </div>
        
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <WalletMultiButton className="!bg-gradient-to-r !from-cyan-500 !to-purple-600 hover:!from-cyan-400 hover:!to-purple-500 !rounded-xl !px-6 !py-3 !text-sm !font-semibold !transition-all !duration-300" />
        </motion.div>
      </div>
    </div>
  )
}
