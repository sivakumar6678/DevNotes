import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { User } from '../types'

const TOKEN_KEY = 'token'
const USER_KEY = 'auth_user'

interface AuthContextValue {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isAdmin: boolean
  isContributor: boolean
  login: (token: string, user: User) => void
  logout: () => void
  refreshUser: (user: User) => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const raw = localStorage.getItem(USER_KEY)
      return raw ? (JSON.parse(raw) as User) : null
    } catch {
      return null
    }
  })

  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY))

  const login = (newToken: string, newUser: User) => {
    localStorage.setItem(TOKEN_KEY, newToken)
    localStorage.setItem(USER_KEY, JSON.stringify(newUser))
    setToken(newToken)
    setUser(newUser)
  }

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    setToken(null)
    setUser(null)
  }

  const refreshUser = (updatedUser: User) => {
    localStorage.setItem(USER_KEY, JSON.stringify(updatedUser))
    setUser(updatedUser)
  }

  // Keep state in sync if another tab logs out
  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key === TOKEN_KEY) {
        setToken(e.newValue)
      }
      if (e.key === USER_KEY) {
        setUser(e.newValue ? JSON.parse(e.newValue) : null)
      }
    }
    window.addEventListener('storage', handler)
    return () => window.removeEventListener('storage', handler)
  }, [])

  const isAuthenticated = Boolean(token && user)
  const isAdmin = user?.role === 'super_admin'
  const isContributor = user?.role === 'contributor' || user?.role === 'super_admin'

  return (
    <AuthContext.Provider
      value={{ user, token, isAuthenticated, isAdmin, isContributor, login, logout, refreshUser }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>')
  return ctx
}
