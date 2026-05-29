import { Navigate } from 'react-router-dom'

/**
 * AdminDashboard — legacy redirect.
 *
 * The old AdminDashboard is superseded by the AdminLayout + CurriculumPage.
 * This component exists only for backward compatibility with any bookmarks
 * or navigation that still points to /admin/dashboard.
 */
export default function AdminDashboard() {
  return <Navigate to="/admin/curriculum" replace />
}
