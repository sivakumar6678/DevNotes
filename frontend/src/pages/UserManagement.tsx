import { useEffect, useState } from 'react'
import { approveUser, getUsers } from '../api/auth'
import { PrimaryLoader, SavingLoader } from '../components/Loader'
import type { User } from '../types'

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [statusMessage, setStatusMessage] = useState('')
  const [approvingId, setApprovingId] = useState<number | null>(null)

  useEffect(() => {
    loadUsers()
  }, [])

  async function loadUsers() {
    setLoading(true)
    setError('')

    try {
      const response = await getUsers()
      setUsers(response.users || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load users.')
    } finally {
      setLoading(false)
    }
  }

  async function handleApprove(userId: number) {
    setApprovingId(userId)
    setError('')
    setStatusMessage('')

    try {
      const response = await approveUser(userId)
      setUsers((current) =>
        current.map((user) => (user.id === userId ? response.user : user))
      )
      setStatusMessage('User approved successfully.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to approve user.')
    } finally {
      setApprovingId(null)
    }
  }

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">Manage Users</h1>
        <p className="text-sm text-slate-600">Approve pending users and monitor account roles.</p>
      </div>

      {statusMessage && <p className="text-green-700">{statusMessage}</p>}
      {error && <p className="text-red-600">{error}</p>}

      <div className="overflow-x-auto rounded-3xl border border-slate-200">
        <div className="min-w-[760px]">
          <div className="grid grid-cols-[1.5fr_1.5fr_120px_120px_140px] gap-4 bg-slate-100 px-6 py-4 text-sm font-semibold text-slate-700">
            <span>Name</span>
            <span>Email</span>
            <span>Role</span>
            <span>Status</span>
            <span>Action</span>
          </div>

          {loading ? (
            <PrimaryLoader className="min-h-[220px] px-6" label="Loading users" />
          ) : users.length === 0 ? (
            <div className="px-6 py-8 text-sm text-slate-600">No users found.</div>
          ) : (
            users.map((user) => (
              <div
                key={user.id}
                className="grid grid-cols-[1.5fr_1.5fr_120px_120px_140px] gap-4 border-t border-slate-200 px-6 py-4 text-sm text-slate-700"
              >
                <span className="font-medium text-slate-900">{user.name}</span>
                <span>{user.email}</span>
                <span className="capitalize">{user.role}</span>
                <span className="capitalize">{user.status}</span>
                <span>
                  {user.status === 'approved' ? (
                    <span className="inline-flex rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">
                      Approved
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleApprove(user.id)}
                      disabled={approvingId === user.id}
                      className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-3 py-1 text-xs font-medium text-white transition hover:bg-blue-700 disabled:opacity-60"
                    >
                      {approvingId === user.id ? <SavingLoader className="w-10 bg-blue-400/30" label="Approving user" /> : null}
                      Approve
                    </button>
                  )}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  )
}
