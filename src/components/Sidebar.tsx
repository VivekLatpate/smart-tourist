import { useEffect, useId, useState } from 'react'
import Link from 'next/link'

type SidebarItem = { 
  id: string; 
  label: string; 
  icon?: string;
  onClick?: () => void;
}

type SidebarProps = {
  solutions?: SidebarItem[]
  currentPage?: string
  onNavigateHome?: () => void
}

export default function Sidebar({ solutions = [], currentPage = 'home', onNavigateHome }: SidebarProps) {
  const [open, setOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const dialogTitleId = useId()

  // Debug: Log sidebar state
  useEffect(() => {
    console.log('Sidebar state:', { collapsed, open, currentPage })
  }, [collapsed, open, currentPage])

  // prevent background scroll when drawer is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
  }, [open])

  // listen for header trigger to open drawer
  useEffect(() => {
    const openFromHeader = () => setOpen(true)
    if (typeof window !== 'undefined') {
      window.addEventListener('open-sidebar', openFromHeader as EventListener)
      return () => window.removeEventListener('open-sidebar', openFromHeader as EventListener)
    }
  }, [])

  return (
    <>
      {/* Mobile open button lives in Header; Sidebar only renders drawer on mobile */}

      {/* Desktop sidebar */}
      {!collapsed ? (
      <aside className="flex fixed inset-y-0 left-0 w-80 flex-col glass-strong border-r border-white/10 z-30" style={{backgroundColor: 'rgba(15, 23, 42, 0.95)', display: 'flex'}}>
        <div className="px-5 py-6">
          <Brand onNavigateHome={onNavigateHome} />
        </div>
        <div className="px-4 py-4 flex items-center justify-between">
          <h2 className="px-1 text-xs uppercase tracking-wider text-sky-400/80">Solutions</h2>
          <button
            type="button"
            onClick={() => setCollapsed(true)}
            className="rounded-md px-2 py-1 text-xs font-semibold text-white/80 hover:text-white hover:bg-white/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
            aria-label="Hide sidebar"
          >
            Hide
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-3">
          <nav aria-label="Solutions">
            <ul className="mt-0 space-y-1">
              {solutions.map((s) => (
                <li key={s.id}>
                  {s.onClick ? (
                    <button
                      onClick={s.onClick}
                      className={`w-full flex items-center gap-2 rounded-md px-3 py-2 text-sm text-left transition-colors ${
                        currentPage === s.id
                          ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                          : 'text-white/85 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      {s.icon ? <span aria-hidden className="text-base leading-none">{s.icon}</span> : null}
                      <span>{s.label}</span>
                    </button>
                  ) : (
                    <Link href={`#${s.id}`} className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-white/85 hover:text-white hover:bg-white/5">
                      {s.icon ? <span aria-hidden className="text-base leading-none">{s.icon}</span> : null}
                      <span>{s.label}</span>
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </nav>
        </div>
        <div className="p-3">
          <div className="rounded-xl p-4 bg-gradient-to-br from-cyan-500/20 via-purple-500/20 to-pink-500/20 glass border border-white/10 text-white/90">
            <p className="text-sm font-medium">🔒 Built for privacy-first safety.</p>
          </div>
        </div>
      </aside>
      ) : (
        <button
          type="button"
          onClick={() => setCollapsed(false)}
          className="inline-flex fixed left-3 top-20 z-30 rounded-md bg-slate-950/70 px-2 py-1 text-xs text-white/90 hover:text-white hover:bg-slate-900/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
          aria-label="Show sidebar"
        >
          Open Menu
        </button>
      )}

      {/* Mobile drawer */}
      {open && (
        <div
          id="mobile-drawer"
          role="dialog"
          aria-modal="true"
          aria-labelledby={dialogTitleId}
          className="fixed inset-0 z-40"
        >
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-80 max-w-[85%] bg-slate-950 text-white shadow-xl p-4">
            <div className="flex items-center justify-between">
              <Brand onNavigateHome={onNavigateHome} />
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-md px-3 py-2 text-sm font-semibold hover:bg-black/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
              >
                Close
              </button>
            </div>
            <h2 id={dialogTitleId} className="visually-hidden">Navigation</h2>
            <nav aria-label="Mobile solutions" className="mt-4">
              <h2 className="px-3 text-xs uppercase tracking-wider text-sky-400/80">Solutions</h2>
              <ul className="mt-2 space-y-1">
                {solutions.map((s) => (
                  <li key={s.id}>
                    {s.onClick ? (
                      <button
                        onClick={() => {
                          s.onClick?.()
                          setOpen(false)
                        }}
                        className={`w-full flex items-center gap-2 rounded-md px-3 py-2 text-base text-left transition-colors ${
                          currentPage === s.id
                            ? 'bg-cyan-500/20 text-cyan-300'
                            : 'hover:bg-white/5'
                        }`}
                      >
                        {s.icon ? <span aria-hidden className="text-lg leading-none">{s.icon}</span> : null}
                        <span>{s.label}</span>
                      </button>
                    ) : (
                      <Link href={`#${s.id}`} onClick={() => setOpen(false)} className="flex items-center gap-2 rounded-md px-3 py-2 text-base hover:bg-white/5">
                        {s.icon ? <span aria-hidden className="text-lg leading-none">{s.icon}</span> : null}
                        <span>{s.label}</span>
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        </div>
      )}
    </>
  )
}

function Brand({ onNavigateHome }: { onNavigateHome?: () => void }) {
  return (
    <button 
      onClick={onNavigateHome}
      className="flex items-center gap-3 group hover:opacity-80 transition-opacity"
    >
      <span className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-gradient-to-br from-teal-500 via-sky-500 to-indigo-500 text-white font-bold shadow">S</span>
      <span className="font-extrabold tracking-tight">Smart Tourist Safety</span>
    </button>
  )
}


