import { Outlet } from 'react-router-dom'
import Navbar from './Navbar'

export default function Layout() {
  return (
    <div className="brand-shell min-h-screen text-brand-ink">
      <Navbar />
      <main className="min-w-0 px-4 pb-12 pt-24 lg:px-6 lg:pt-28">
        <Outlet />
      </main>
    </div>
  )
}
