import type { LoginResponse, NotesResponse, SignupResponse, User, UsersResponse } from '../types'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'
const TOKEN_KEY = 'token'
const USER_KEY = 'auth_user'

async function apiFetch(path: string, options: RequestInit = {}) {
  const url = `${API_BASE_URL}${path}`
  const token = getToken()
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
    ...options,
  })

  const contentType = response.headers.get('content-type') || ''
  const isJson = contentType.includes('application/json')
  const data = isJson ? await response.json().catch(() => null) : await response.text().catch(() => null)

  if (!response.ok) {
    const message = (data && data.error && data.error.message) || 'Request failed'
    const error = new Error(message) as any
    error.status = response.status
    error.payload = data
    throw error
  }

  return data
}

export async function signup(name: string, email: string, password: string) {
  return (await apiFetch('/api/auth/signup', {
    method: 'POST',
    body: JSON.stringify({ name, email, password }),
  })) as SignupResponse
}

export async function login(email: string, password: string) {
  const response = (await apiFetch('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })) as LoginResponse
  const { token, user } = response
  if (token) {
    localStorage.setItem(TOKEN_KEY, token)
  }
  if (user) {
    localStorage.setItem(USER_KEY, JSON.stringify(user))
  }
  return response
}

export function getToken() {
  return localStorage.getItem(TOKEN_KEY)
}

export function getCurrentUser(): User | null {
  const raw = localStorage.getItem(USER_KEY)
  if (!raw) {
    return null
  }

  try {
    return JSON.parse(raw) as User
  } catch {
    localStorage.removeItem(USER_KEY)
    return null
  }
}

export function logout() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
}

export async function createNoteVersion(topicId: number, versionType: string, content: object) {
  return await apiFetch('/api/note-version', {
    method: 'POST',
    body: JSON.stringify({ topic_id: topicId, version_type: versionType, content }),
  })
}

export async function getAllNotes() {
  return (await apiFetch('/api/notes')) as NotesResponse
}

export async function getUsers() {
  return (await apiFetch('/api/users')) as UsersResponse
}

export async function approveUser(userId: number) {
  return (await apiFetch(`/api/users/approve/${userId}`, {
    method: 'POST',
  })) as { message: string; user: User }
}

export async function getProfile() {
  const response = (await apiFetch('/api/auth/protected')) as { user: User }
  if (response.user) {
    localStorage.setItem(USER_KEY, JSON.stringify(response.user))
  }
  return response
}
