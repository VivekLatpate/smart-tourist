import { motion, useReducedMotion } from 'framer-motion'
import Link from 'next/link'
import Image from 'next/image'
import { useId, useEffect, useState } from 'react'

type HeroProps = {
  onPrimaryCta?: () => void
  onSecondaryCta?: () => void
}

// Enhanced entrance animations with stunning effects
const containerVariants = {
  hidden: { opacity: 0, y: 50, scale: 0.95 },
  visible: (shouldReduce: boolean) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { 
      duration: shouldReduce ? 0 : 1.2, 
      ease: [0.16, 1, 0.3, 1],
      staggerChildren: shouldReduce ? 0 : 0.2
    },
  }),
}

const childVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: (shouldReduce: boolean) => ({
    opacity: 1,
    y: 0,
    transition: { duration: shouldReduce ? 0 : 0.8, ease: [0.16, 1, 0.3, 1] }
  })
}

const floatingVariants = {
  animate: {
    y: [0, -10, 0],
    rotate: [0, 1, -1, 0],
    transition: {
      duration: 6,
      repeat: Infinity,
      ease: "easeInOut"
    }
  }
}

export default function Hero({ onPrimaryCta, onSecondaryCta }: HeroProps) {
  const shouldReduceMotion = useReducedMotion()
  const decorativeId = useId()
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY })
    }
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  return (
    <section aria-labelledby={`hero-heading-${decorativeId}`} className="relative overflow-hidden min-h-screen flex items-center">
      {/* Dynamic background with parallax effect */}
      <div className="absolute inset-0 -z-10">
        <div 
          className="absolute inset-0 opacity-60"
          style={{
            background: `radial-gradient(circle at ${mousePosition.x * 0.1}px ${mousePosition.y * 0.1}px, rgba(0, 245, 255, 0.1) 0%, transparent 50%)`
          }}
        />
        <Image
          src="https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=1200&auto=format&fit=crop"
          alt=""
          role="presentation"
          fill
          sizes="100vw"
          className="object-cover opacity-20"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950/90 via-slate-900/80 to-purple-950/90"></div>
        
        {/* Floating geometric shapes */}
        <motion.div 
          variants={floatingVariants}
          animate="animate"
          className="absolute top-20 left-10 w-20 h-20 bg-gradient-to-r from-cyan-400/20 to-blue-400/20 rounded-full blur-xl"
        />
        <motion.div 
          variants={floatingVariants}
          animate="animate"
          style={{ animationDelay: '2s' }}
          className="absolute top-40 right-20 w-32 h-32 bg-gradient-to-r from-purple-400/20 to-pink-400/20 rounded-full blur-xl"
        />
        <motion.div 
          variants={floatingVariants}
          animate="animate"
          style={{ animationDelay: '4s' }}
          className="absolute bottom-40 left-1/4 w-16 h-16 bg-gradient-to-r from-green-400/20 to-teal-400/20 rounded-full blur-xl"
        />
      </div>

      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
        variants={containerVariants}
        custom={Boolean(shouldReduceMotion)}
        className="mx-auto max-w-6xl px-4 py-24 sm:py-32 text-center relative z-10"
      >
        <motion.h1 
          variants={childVariants}
          custom={Boolean(shouldReduceMotion)}
          id={`hero-heading-${decorativeId}`} 
          className="text-5xl sm:text-7xl md:text-8xl font-extrabold tracking-tight gradient-text leading-tight"
        >
          Smart Tourist Safety
        </motion.h1>
        
        <motion.div
          variants={childVariants}
          custom={Boolean(shouldReduceMotion)}
          className="mt-6 relative"
        >
          <p className="text-xl sm:text-2xl text-white/90 max-w-3xl mx-auto leading-relaxed">
            Trustworthy, privacy-first safety tools for travelers, tourism boards, and law enforcement.
          </p>
          <div className="absolute -inset-1 bg-gradient-to-r from-cyan-400/20 to-purple-400/20 rounded-lg blur opacity-30"></div>
        </motion.div>

        <motion.div 
          variants={childVariants}
          custom={Boolean(shouldReduceMotion)}
          className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <motion.button
            type="button"
            onClick={onPrimaryCta}
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            className="group relative inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-600 px-8 py-4 text-lg font-bold text-white shadow-2xl glow-hover overflow-hidden"
            aria-label="Explore Smart Tourist Safety solutions"
          >
            <span className="relative z-10">Explore Solutions</span>
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          </motion.button>
          
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Link
              href="#solutions"
              onClick={onSecondaryCta}
              className="inline-flex items-center justify-center rounded-xl px-8 py-4 text-lg font-semibold glass border border-white/20 hover:border-white/40 text-white transition-all duration-300 hover:shadow-xl"
              aria-label="Skip to solutions grid"
            >
              Skip to Solutions
            </Link>
          </motion.div>
        </motion.div>

        <motion.p 
          variants={childVariants}
          custom={Boolean(shouldReduceMotion)}
          className="mt-8 text-sm text-white/70 glass-strong rounded-full px-6 py-2 inline-block"
        >
          🔒 Your data stays yours. We use ephemeral identifiers and explicit consent.
        </motion.p>

        {/* Scroll indicator */}
        <motion.div
          variants={childVariants}
          custom={Boolean(shouldReduceMotion)}
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
        >
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center"
          >
            <div className="w-1 h-3 bg-white/50 rounded-full mt-2"></div>
          </motion.div>
        </motion.div>
      </motion.div>
    </section>
  )
}


