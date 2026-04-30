import { Outlet } from 'react-router-dom'
import Navbar from './Navbar'

export default function Layout() {
  return (
    <div className="brand-shell min-h-screen text-brand-ink">
      <Navbar />
      <main className="min-w-0 pb-16 pt-24 lg:pt-28">
        <Outlet />
      </main>
    </div>
  )
}
