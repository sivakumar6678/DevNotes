import { Outlet, Link, useLocation } from 'react-router-dom'
import { BookOpen, Users, UserCheck } from 'lucide-react'

export default function AdminLayout() {
  const location = useLocation()
  
  const navItems = [
    { name: 'Curriculum', href: '/admin/curriculum', icon: BookOpen },
    { name: 'Manage Users', href: '/admin/users', icon: Users },
    { name: 'Approve Users', href: '/admin/users?filter=pending', icon: UserCheck },
  ]

  return (
    <div className="flex flex-1 overflow-hidden bg-slate-50">
      {/* Admin Sidebar */}
      <aside className="w-64 shrink-0 border-r border-slate-200 bg-white shadow-sm flex flex-col">
        <div className="flex h-16 items-center px-6 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-900">Admin Dashboard</h2>
        </div>
        <nav className="flex flex-1 flex-col gap-1 p-4 overflow-y-auto">
          {navItems.map((item) => {
            // Precise active state checking, accounting for search params for "Approve Users"
            const isActive = location.pathname === item.href.split('?')[0] && 
              (item.href.includes('?') 
                ? location.search === `?${item.href.split('?')[1]}` 
                : location.search === '' || !item.href.includes('users'))

            const Icon = item.icon
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-brand-orange text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <Icon className={`h-5 w-5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                {item.name}
              </Link>
            )
          })}
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  )
}
