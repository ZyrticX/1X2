"use client"

import { useState, useEffect } from "react"
import { getAllUsers } from "../lib/dataService"
import AdminUserForm from "../components/admin/admin-user-form"
import UsersList from "../components/admin/users-list"
import { RefreshCw } from "lucide-react"

export default function AdminPage() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshCounter, setRefreshCounter] = useState(0)

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true)
      try {
        const usersData = await getAllUsers()
        setUsers(usersData)
      } catch (err) {
        console.error("Error fetching users:", err)
        setError(err instanceof Error ? err.message : "שגיאה בטעינת משתמשים")
      } finally {
        setLoading(false)
      }
    }

    fetchUsers()
  }, [refreshCounter])

  const handleRefresh = () => {
    setRefreshCounter((prev) => prev + 1)
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">ניהול משתמשים</h1>

      <AdminUserForm onUserAdded={handleRefresh} />

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <RefreshCw className="w-8 h-8 animate-spin text-navy-600" />
        </div>
      ) : error ? (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p>{error}</p>
        </div>
      ) : (
        <UsersList users={users} onUserUpdated={handleRefresh} />
      )}
    </div>
  )
}
