import { Outlet, useLocation } from 'react-router-dom'
import Navbar from './Navbar'

export default function Layout() {
  const location = useLocation()
  const isEditor = location.pathname.startsWith('/admin/notes/') && (location.pathname.endsWith('/edit') || location.pathname.endsWith('/new'))

  return (
    <div className={`brand-shell text-brand-ink ${isEditor ? 'h-screen overflow-hidden flex flex-col' : 'min-h-screen'}`}>
      <Navbar />
      <main className={`min-w-0 ${isEditor ? 'flex-1 min-h-0 pt-24 lg:pt-28 pb-0 flex flex-col' : 'pb-16 pt-24 lg:pt-28'}`}>
        <Outlet />
      </main>
    </div>
  )
}
