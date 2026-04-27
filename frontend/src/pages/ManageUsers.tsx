import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { CheckCircle2, XCircle, ShieldAlert, Users } from 'lucide-react'
import { getUsers, approveUser, rejectUser } from '../api/auth'
import type { User } from '../types'
import { PrimaryLoader } from '../components/Loader'

export default function ManageUsers() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const location = useLocation()
  const filterPending = new URLSearchParams(location.search).get('filter') === 'pending'

  async function loadUsers() {
    try {
      setLoading(true)
      const data = await getUsers()
      setUsers(data.users || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load users.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadUsers()
  }, [])

  async function handleApprove(userId: number) {
    try {
      await approveUser(userId)
      setUsers(users.map(u => u.id === userId ? { ...u, status: 'approved' } : u))
    } catch (err) {
      alert('Failed to approve user')
    }
  }

  async function handleReject(userId: number) {
    try {
      await rejectUser(userId)
      setUsers(users.map(u => u.id === userId ? { ...u, status: 'rejected' } : u))
    } catch (err) {
      alert('Failed to reject user')
    }
  }

  const displayedUsers = filterPending 
    ? users.filter(u => u.status === 'pending')
    : users

  if (loading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <PrimaryLoader />
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {filterPending ? 'Pending Approvals' : 'Manage Users'}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            View and manage user accounts and permissions.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-sm border border-slate-200">
          <Users className="h-4 w-4 text-brand-orange" />
          {displayedUsers.length} Users
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
          {error}
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-6 py-4">Name</th>
                <th className="px-6 py-4">Email</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {displayedUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                    No users found.
                  </td>
                </tr>
              ) : (
                displayedUsers.map((user) => (
                  <tr key={user.id} className="transition-colors hover:bg-slate-50">
                    <td className="whitespace-nowrap px-6 py-4 font-medium text-slate-900">
                      {user.name}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-slate-500">
                      {user.email}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      {user.role === 'super_admin' ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700 ring-1 ring-inset ring-indigo-200">
                          <ShieldAlert className="h-3 w-3" /> Admin
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700 ring-1 ring-inset ring-slate-200">
                          User
                        </span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      {user.status === 'approved' ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-200">
                          <CheckCircle2 className="h-3 w-3" /> Approved
                        </span>
                      ) : user.status === 'rejected' ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700 ring-1 ring-inset ring-red-200">
                          <XCircle className="h-3 w-3" /> Rejected
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 ring-1 ring-inset ring-amber-200">
                          Pending
                        </span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right">
                      {user.status === 'pending' && (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleApprove(user.id)}
                            className="rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100 active:bg-emerald-200"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleReject(user.id)}
                            className="rounded-lg bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 transition hover:bg-red-100 active:bg-red-200"
                          >
                            Reject
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
