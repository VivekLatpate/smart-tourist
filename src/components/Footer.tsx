import Link from 'next/link'
import { motion } from 'framer-motion'

export default function Footer() {
  return (
    <footer className="mt-24 relative">
      {/* Gradient border */}
      <div className="h-px bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent"></div>
      
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
        className="glass-strong border-t border-white/10"
      >
        <div className="mx-auto max-w-6xl px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Brand section */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500 via-sky-500 to-indigo-500 text-white font-bold shadow-lg">S</span>
                <span className="text-xl font-bold text-white">Smart Tourist Safety</span>
              </div>
              <p className="text-white/70 text-sm leading-relaxed">
                Revolutionizing travel safety with privacy-first, AI-powered solutions for tourists, tourism boards, and law enforcement.
              </p>
            </div>

            {/* Quick links */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white">Quick Links</h3>
              <nav aria-label="Footer links" className="flex flex-col space-y-2">
                <Link className="text-white/70 hover:text-cyan-400 transition-colors duration-200" href="#solutions">Solutions</Link>
                <Link className="text-white/70 hover:text-cyan-400 transition-colors duration-200" href="#about">About</Link>
                <Link className="text-white/70 hover:text-cyan-400 transition-colors duration-200" href="#contact">Contact</Link>
                <Link className="text-white/70 hover:text-cyan-400 transition-colors duration-200" href="#privacy">Privacy</Link>
              </nav>
            </div>

            {/* Privacy info */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white">Privacy First</h3>
              <div className="glass rounded-xl p-4 border border-cyan-500/20">
                <p className="text-white/80 text-sm leading-relaxed">
                  🔒 Minimal data by default. Time-limited IDs, on-device processing, explicit opt-in for sharing, and transparent revocation controls.
                </p>
              </div>
            </div>
          </div>

          {/* Bottom section */}
          <div className="mt-12 pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-white/60 text-sm">
              © {new Date().getFullYear()} Smart Tourist Safety. All rights reserved.
            </p>
            <div className="flex items-center gap-4 text-sm text-white/60">
              <span>Built with ❤️ for safer travels</span>
            </div>
          </div>
        </div>
      </motion.div>
    </footer>
  )
}


