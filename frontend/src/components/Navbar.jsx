import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'

const navItems = [
  { label: 'Home', to: '/' },
  { label: 'Learning Paths', to: '/categories' },
  { label: 'About', to: '/about' },
]

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-brand-border/80 bg-white/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 lg:px-8">
        <Link to="/" className="flex items-center gap-3">
          <span className="relative flex h-11 w-11 items-center justify-center rounded-2xl border border-orange-200 bg-brand-orangeSoft shadow-sm">
            <span className="absolute h-6 w-[2px] rounded-full bg-brand-orange" />
            <span className="absolute top-2 h-0 w-0 border-x-[6px] border-b-[8px] border-x-transparent border-b-brand-orange" />
            <span className="absolute left-[9px] top-[11px] text-[10px] font-semibold text-slate-400">{'<'}</span>
            <span className="absolute right-[9px] top-[11px] text-[10px] font-semibold text-slate-400">{'/>'}</span>
          </span>
          <div>
            <p className="font-display text-base font-semibold tracking-tight text-brand-ink">VelStack</p>
            <p className="text-xs text-brand-muted">Structured learning for developers</p>
          </div>
        </Link>

        <nav className="hidden items-center gap-2 md:flex">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `rounded-full px-4 py-2 text-sm font-medium transition ${
                  isActive
                    ? 'bg-brand-orangeSoft text-brand-ink shadow-sm ring-1 ring-orange-200'
                    : 'text-brand-muted hover:bg-white hover:text-brand-ink'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <Link to="/notes/closures" className="brand-button-primary">
            Start Learning
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setMenuOpen((open) => !open)}
          className="inline-flex rounded-2xl border border-brand-border px-4 py-2 text-sm font-medium text-brand-ink md:hidden"
          aria-expanded={menuOpen}
          aria-label="Toggle navigation"
        >
          Menu
        </button>
      </div>

      {menuOpen ? (
        <div className="border-t border-brand-border bg-white px-4 py-4 md:hidden">
          <nav className="flex flex-col gap-2">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setMenuOpen(false)}
                className={({ isActive }) =>
                  `rounded-2xl px-4 py-3 text-sm font-medium transition ${
                    isActive
                      ? 'bg-brand-orangeSoft text-brand-ink ring-1 ring-orange-200'
                      : 'text-brand-muted hover:bg-brand-orangeSoft hover:text-brand-ink'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
            <Link to="/notes/closures" onClick={() => setMenuOpen(false)} className="brand-button-primary mt-2">
              Start Learning
            </Link>
          </nav>
        </div>
      ) : null}
    </header>
  )
}
