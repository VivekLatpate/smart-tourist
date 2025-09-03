import Link from 'next/link'
import { useEffect, useState } from 'react'

export default function Header() {
  const [isAtTop, setIsAtTop] = useState(true)

  // shrink on scroll
  useEffect(() => {
    const onScroll = () => setIsAtTop(window.scrollY < 10)
    onScroll()
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header className={`sticky top-0 z-50 ${isAtTop ? 'glass' : 'glass-strong'} border-b border-white/10 pl-80`}>
      <div className="mx-auto max-w-6xl px-4 h-14 flex items-center justify-between">
        <Link href="#top" className="flex items-center gap-3">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-gradient-to-br from-teal-500 via-sky-500 to-indigo-500 text-white font-bold shadow">S</span>
          <span className="font-bold tracking-tight text-white/95">Smart Tourist Safety</span>
        </Link>
        <nav aria-label="Top navigation" className="hidden md:flex items-center gap-6 text-sm">
          <Link className="hover:text-white text-white/80" href="#top">Home</Link>
          <Link className="hover:text-white text-white/80" href="#about">About</Link>
          <Link className="hover:text-white text-white/80" href="#contact">Contact</Link>
        </nav>
        <button
          type="button"
          className="md:hidden rounded-md px-3 py-2 text-sm font-semibold text-white/85 hover:text-white hover:bg-white/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
          aria-label="Open menu"
          onClick={() => {
            if (typeof window !== 'undefined') {
              window.dispatchEvent(new Event('open-sidebar'))
            }
          }}
        >
          Menu
        </button>
      </div>
    </header>
  )
}


