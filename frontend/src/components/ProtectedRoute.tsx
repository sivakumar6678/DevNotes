import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

interface ProtectedRouteProps {
  children: ReactNode
  requireAdmin?: boolean
  requireContributor?: boolean
}

export default function ProtectedRoute({
  children,
  requireAdmin = false,
  requireContributor = false,
}: ProtectedRouteProps) {
  const { isAuthenticated, isAdmin, isContributor } = useAuth()
  const location = useLocation()

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (requireAdmin && !isAdmin) {
    return <Navigate to="/" replace />
  }

  if (requireContributor && !isContributor) {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}
