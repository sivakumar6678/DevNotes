import type { LoginResponse, NotesResponse, SignupResponse, User, UsersResponse } from '../types'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'
const TOKEN_KEY = 'token'

// ─── Raw localStorage helpers (used only by AuthContext init) ───────────────
export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

// ─── Shared fetch utility ────────────────────────────────────────────────────
export async function apiFetch<T = any>(path: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${path}`
  const token = getToken()
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
    ...options,
  })

  const contentType = response.headers.get('content-type') || ''
  const isJson = contentType.includes('application/json')
  const data = isJson
    ? await response.json().catch(() => null)
    : await response.text().catch(() => null)

  if (!response.ok) {
    if (response.status === 401 && !url.includes('/api/auth/login') && !url.includes('/api/auth/signup')) {
      localStorage.removeItem(TOKEN_KEY)
      localStorage.removeItem('auth_user')
      window.location.replace('/login')
    }

    const message = (data && data.error && data.error.message) || 'Request failed'
    const error = new Error(message) as any
    error.status = response.status
    error.payload = data
    throw error
  }

  return data
}

// ─── Auth API calls ──────────────────────────────────────────────────────────
export async function apiLogin(email: string, password: string): Promise<LoginResponse> {
  return (await apiFetch('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })) as LoginResponse
}

export async function apiSignup(
  name: string,
  email: string,
  password: string,
): Promise<SignupResponse> {
  return (await apiFetch('/api/auth/signup', {
    method: 'POST',
    body: JSON.stringify({ name, email, password }),
  })) as SignupResponse
}

export async function apiGetProfile(): Promise<{ user: User }> {
  return (await apiFetch('/api/auth/protected')) as { user: User }
}

// ─── Note APIs ───────────────────────────────────────────────────────────────
export async function createNoteVersion(topicId: number, versionType: string, content: object) {
  return await apiFetch('/api/note-version', {
    method: 'POST',
    body: JSON.stringify({ topic_id: topicId, version_type: versionType, content }),
  })
}

export async function getAllNotes() {
  return (await apiFetch('/api/notes')) as NotesResponse
}

// ─── User management APIs ────────────────────────────────────────────────────
export async function getUsers() {
  return (await apiFetch('/api/admin/users')) as UsersResponse
}

export async function approveUser(userId: number) {
  return (await apiFetch(`/api/admin/users/${userId}/approve`, {
    method: 'PUT',
  })) as { message: string; user: User }
}

export async function rejectUser(userId: number) {
  return (await apiFetch(`/api/admin/users/${userId}/reject`, {
    method: 'PUT',
  })) as { message: string; user: User }
}

// ─── Legacy shims — kept for components not yet migrated to useAuth() ────────
/** @deprecated Use useAuth().login() instead */
export function login(email: string, password: string) {
  return apiLogin(email, password)
}

/** @deprecated Use useAuth().logout() instead */
export function logout() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem('auth_user')
}

/** @deprecated Use useAuth().user instead */
export function getCurrentUser(): User | null {
  try {
    const raw = localStorage.getItem('auth_user')
    return raw ? (JSON.parse(raw) as User) : null
  } catch {
    return null
  }
}
