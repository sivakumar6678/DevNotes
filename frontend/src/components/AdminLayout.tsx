import { useState } from 'react'
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { BookOpen, Users, UserCheck, LogOut, BookText, ChevronDown, ChevronRight, Upload, Database, TerminalSquare } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export default function AdminLayout() {
  const { logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [guidelinesOpen, setGuidelinesOpen] = useState(true)

  const navItems = [
    { name: 'Curriculum', href: '/admin/curriculum', icon: BookOpen },
    { name: 'Manage Users', href: '/admin/users', icon: Users, end: true },
    { name: 'Approve Users', href: '/admin/users?filter=pending', icon: UserCheck },
  ]

  const guidelineItems = [
    { name: 'How to Upload', href: '/admin/guidelines/upload', icon: Upload },
    { name: 'JSON Schema', href: '/admin/guidelines/schema', icon: Database },
    { name: 'AI Prompt', href: '/admin/guidelines/prompt', icon: TerminalSquare },
  ]

  function handleLogout() {
    logout()
    navigate('/login')
  }

  const isEditor = location.pathname.startsWith('/admin/notes/') && (location.pathname.endsWith('/edit') || location.pathname.endsWith('/new'))

  return (
    <div className={`flex relative ${isEditor ? 'flex-1 min-h-0 h-full' : ''}`}>
      {/* ── Left sidebar ── */}
      <aside className={`sticky top-0 w-64 shrink-0 border-r border-slate-200 bg-white flex flex-col ${isEditor ? 'h-full' : 'h-screen'}`}>
        <div className="flex h-14 items-center px-5 border-b border-slate-100">
          <h2 className="text-base font-bold text-slate-900 tracking-tight">Admin</h2>
        </div>

        <nav className="flex flex-1 flex-col gap-1 p-3 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.name}
                to={item.href}
                end={item.end}
                className={() => {
                  const isActive = location.pathname + location.search === item.href
                  return `flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors ${isActive
                      ? 'bg-brand-orange text-white'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`
                }}
              >
                {() => {
                  const isActive = location.pathname + location.search === item.href
                  return (
                    <>
                      <Icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                      {item.name}
                    </>
                  )
                }}
              </NavLink>
            )
          })}

          <div className="mt-4 mb-1 px-4 flex items-center justify-between">
            <button
              onClick={() => setGuidelinesOpen(!guidelinesOpen)}
              className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider hover:text-slate-900 w-full text-left"
            >
              <BookText className="h-4 w-4" />
              Guidelines
              {guidelinesOpen ? (
                <ChevronDown className="h-4 w-4 ml-auto" />
              ) : (
                <ChevronRight className="h-4 w-4 ml-auto" />
              )}
            </button>
          </div>

          {guidelinesOpen && (
            <div className="flex flex-col gap-1 pl-4 border-l-2 border-slate-100 ml-4">
              {guidelineItems.map((item) => {
                const Icon = item.icon
                return (
                  <NavLink
                    key={item.name}
                    to={item.href}
                    className={() => {
                      const isActive = location.pathname + location.search === item.href
                      return `flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors ${isActive
                          ? 'bg-orange-50 text-brand-orange'
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                        }`
                    }}
                  >
                    {() => {
                      const isActive = location.pathname + location.search === item.href
                      return (
                        <>
                          <Icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-brand-orange' : 'text-slate-400'}`} />
                          {item.name}
                        </>
                      )
                    }}
                  </NavLink>
                )
              })}
            </div>
          )}
        </nav>

        {/* Logout at the bottom */}
        <div className="border-t border-slate-100 p-3">
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-red-50 hover:text-red-600"
          >
            <LogOut className="h-4 w-4 shrink-0 text-slate-400" />
            Logout
          </button>
        </div>
      </aside>

      {/* ── Main content area ── */}
      <main className={`flex-1 min-w-0 bg-slate-50 ${isEditor ? 'flex flex-col min-h-0' : ''}`}>
        <Outlet />
      </main>
    </div>
  )
}
