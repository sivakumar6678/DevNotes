const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

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
  const response = await apiFetch('/api/auth/signup', {
    method: 'POST',
    body: JSON.stringify({ name, email, password }),
  })
  const { token } = response
  if (token) localStorage.setItem('token', token)
  return response
}

export async function login(email: string, password: string) {
  const response = await apiFetch('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
  const { token } = response
  if (token) localStorage.setItem('token', token)
  return response
}

export function getToken() {
  return localStorage.getItem('token')
}

export function logout() {
  localStorage.removeItem('token')
}

export async function createNoteVersion(noteId: number, versionType: string, content: object) {
  return await apiFetch('/api/note-version', {
    method: 'POST',
    body: JSON.stringify({ note_id: noteId, version_type: versionType, content }),
  })
}

export async function getAllNotes() {
  return await apiFetch('/api/notes')  // Assuming we add this endpoint
}