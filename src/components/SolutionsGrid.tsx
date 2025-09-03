import { motion, useReducedMotion } from 'framer-motion'
import Image from 'next/image'
import { useState } from 'react'

export type Solution = {
  id: string
  title: string
  description: string
  ctaLabel: string
  ariaLabel: string
  icon: string // emoji for simplicity; could be replaced with SVGs
  onPrimary: () => void
  onSecondary: () => void
  imageUrl?: string
}

type SolutionsGridProps = {
  solutions: Solution[]
}

const listVariants = {
  hidden: {},
  visible: (shouldReduce: boolean) => ({
    transition: shouldReduce
      ? undefined
      : { staggerChildren: 0.12, delayChildren: 0.2 },
  }),
}

const cardVariants = {
  hidden: { opacity: 0, y: 50, scale: 0.9 },
  visible: (shouldReduce: boolean) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { 
      duration: shouldReduce ? 0 : 0.8, 
      ease: [0.16, 1, 0.3, 1],
      type: "spring",
      stiffness: 100,
      damping: 15
    },
  }),
}

export default function SolutionsGrid({ solutions }: SolutionsGridProps) {
  const shouldReduceMotion = useReducedMotion()
  const [hoveredCard, setHoveredCard] = useState<string | null>(null)

  const gradients = [
    'from-cyan-500/60 via-blue-500/60 to-purple-600/60',
    'from-purple-500/60 via-pink-500/60 to-red-500/60',
    'from-green-500/60 via-teal-500/60 to-cyan-500/60',
    'from-yellow-500/60 via-orange-500/60 to-red-500/60',
    'from-indigo-500/60 via-purple-500/60 to-pink-500/60',
  ]

  return (
    <section id="solutions" aria-label="Smart Tourist Safety solutions" className="mx-auto max-w-7xl px-4 py-16 sm:py-24">
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
        className="text-center mb-16"
      >
        <h2 className="text-4xl sm:text-5xl font-extrabold gradient-text mb-4">
          Explore Solutions
        </h2>
        <p className="text-xl text-white/80 max-w-2xl mx-auto">
          Experience the future of tourist safety with our innovative, privacy-first solutions.
        </p>
      </motion.div>

      <motion.ul
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.1 }}
        variants={listVariants}
        custom={Boolean(shouldReduceMotion)}
        className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 lg:gap-8"
      >
        {solutions.map((s, index) => (
          <motion.li key={s.id} variants={cardVariants} custom={Boolean(shouldReduceMotion)}>
            <motion.div 
              id={s.id} 
              className="h-full scroll-mt-24 group"
              onHoverStart={() => setHoveredCard(s.id)}
              onHoverEnd={() => setHoveredCard(null)}
              whileHover={{ y: -8, scale: 1.02 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              <div className={`h-full rounded-2xl p-[1px] bg-gradient-to-br ${gradients[index % gradients.length]} relative overflow-hidden`}>
                {/* Animated background */}
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/20 via-purple-500/20 to-pink-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl"></div>
                
                <article className="relative h-full rounded-[15px] glass-strong p-6 overflow-hidden">
                  {/* Floating icon */}
                  <motion.div 
                    className="absolute -top-2 -right-2 w-16 h-16 bg-gradient-to-br from-white/10 to-white/5 rounded-full flex items-center justify-center backdrop-blur-sm"
                    animate={hoveredCard === s.id ? { scale: 1.1, rotate: 360 } : { scale: 1, rotate: 0 }}
                    transition={{ duration: 0.6 }}
                  >
                    <span className="text-2xl">{s.icon}</span>
                  </motion.div>

                  <div className="relative h-44 w-full overflow-hidden rounded-xl mb-6">
                    <Image
                      src={s.imageUrl ?? 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?q=80&w=800&auto=format&fit=crop'}
                      alt=""
                      role="presentation"
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      className="object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                    
                    {/* Animated overlay */}
                    <motion.div 
                      className="absolute inset-0 bg-gradient-to-br from-cyan-500/20 to-purple-500/20"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: hoveredCard === s.id ? 1 : 0 }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>

                  <div className="space-y-4">
                    <div>
                      <h3 className="text-xl font-bold text-white group-hover:text-cyan-300 transition-colors duration-300">
                        <a href={`#${s.id}`} className="hover:underline decoration-cyan-400/70 underline-offset-4">
                          {s.title}
                        </a>
                      </h3>
                      <p className="text-white/70 mt-2 leading-relaxed">{s.description}</p>
                    </div>

                    <div className="flex items-center gap-3 pt-2">
                      <motion.button
                        type="button"
                        onClick={s.onPrimary}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="flex-1 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 px-4 py-3 text-sm font-bold text-white shadow-lg hover:shadow-cyan-500/25 transition-all duration-300"
                        aria-label={s.ariaLabel}
                      >
                        {s.ctaLabel}
                      </motion.button>
                      <motion.button
                        type="button"
                        onClick={s.onSecondary}
                        whileHover={{ scale: 1.05 }}
                        className="px-4 py-3 text-sm font-semibold text-cyan-400 hover:text-cyan-300 transition-colors duration-200"
                        aria-label={`Learn more about ${s.title}`}
                      >
                        Learn →
                      </motion.button>
                    </div>
                  </div>

                  {/* Glow effect */}
                  <motion.div
                    className="absolute inset-0 rounded-[15px] opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                    style={{
                      background: 'linear-gradient(45deg, transparent 30%, rgba(0, 245, 255, 0.1) 50%, transparent 70%)',
                      backgroundSize: '200% 200%',
                    }}
                    animate={{
                      backgroundPosition: hoveredCard === s.id ? ['0% 0%', '100% 100%'] : '0% 0%',
                    }}
                    transition={{ duration: 1.5, repeat: hoveredCard === s.id ? Infinity : 0 }}
                  />
                </article>
              </div>
            </motion.div>
          </motion.li>
        ))}
      </motion.ul>
    </section>
  )
}


