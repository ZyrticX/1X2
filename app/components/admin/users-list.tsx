"use client"

import { useState } from "react"
import { Search, Download } from "lucide-react"
import UserDetailModal from "./user-detail-modal"
import type { User, Game } from "../types"

interface UsersListProps {
  users: User[]
  games?: Game[]
  onUserUpdated?: () => void
}

export default function UsersList({ users, games = [], onUserUpdated }: UsersListProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [sortField, setSortField] = useState<keyof User>("name")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [showUserDetail, setShowUserDetail] = useState(false)

  // Filter users based on search term
  const filteredUsers = users.filter(
    (user) =>
      user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.playercode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.phone?.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  // Sort users based on sort field and direction
  const sortedUsers = [...filteredUsers].sort((a, b) => {
    const aValue = a[sortField] || ""
    const bValue = b[sortField] || ""

    if (sortDirection === "asc") {
      return aValue > bValue ? 1 : -1
    } else {
      return aValue < bValue ? 1 : -1
    }
  })

  // Handle sort change
  const handleSort = (field: keyof User) => {
    if (field === sortField) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
  }

  const handleUserUpdated = () => {
    // Trigger a refresh of the users list
    onUserUpdated?.()
  }

  // Export users to CSV
  const exportToCSV = () => {
    const headers = ["שם", "קוד שחקן", "טלפון", "עיר", "סטטוס", "נקודות", "תאריך יצירה"]
    const csvData = sortedUsers.map((user) => [
      user.name || "",
      user.playercode || "",
      user.phone || "",
      user.city || "",
      user.status || "",
      user.points?.toString() || "0",
      user.created_at ? new Date(user.created_at).toLocaleDateString() : "",
    ])

    const csvContent = [headers.join(","), ...csvData.map((row) => row.join(","))].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", "users.csv")
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">רשימת משתמשים</h2>

        <div className="flex items-center">
          <div className="relative mr-2">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="חיפוש..."
              className="pl-3 pr-10 py-2 border border-gray-300 rounded-md"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <button className="bg-navy-600 text-white px-4 py-2 rounded-md flex items-center" onClick={exportToCSV}>
            <Download className="w-4 h-4 mr-2" />
            ייצוא CSV
          </button>
        </div>
      </div>

      <div className="overflow-x-auto bg-white shadow rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th
                className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort("name")}
              >
                שם {sortField === "name" && (sortDirection === "asc" ? "▲" : "▼")}
              </th>
              <th
                className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort("playercode")}
              >
                קוד שחקן {sortField === "playercode" && (sortDirection === "asc" ? "▲" : "▼")}
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">טלפון</th>
              <th
                className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort("city")}
              >
                עיר {sortField === "city" && (sortDirection === "asc" ? "▲" : "▼")}
              </th>
              <th
                className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort("status")}
              >
                סטטוס {sortField === "status" && (sortDirection === "asc" ? "▲" : "▼")}
              </th>
              <th
                className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort("points")}
              >
                נקודות {sortField === "points" && (sortDirection === "asc" ? "▲" : "▼")}
              </th>
              <th
                className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort("created_at")}
              >
                תאריך יצירה {sortField === "created_at" && (sortDirection === "asc" ? "▲" : "▼")}
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedUsers.length > 0 ? (
              sortedUsers.map((user) => (
                <tr
                  key={user.id}
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => {
                    setSelectedUser(user)
                    setShowUserDetail(true)
                  }}
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{user.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">{user.playercode}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.phone || "-"}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.city || "-"}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span
                      className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        user.status === "active" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                      }`}
                    >
                      {user.status === "active" ? "פעיל" : user.status === "blocked" ? "חסום" : "-"}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {isNaN(Number(user.points)) ? "0" : String(user.points || 0)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.created_at ? new Date(user.created_at).toLocaleDateString() : "-"}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="px-6 py-4 text-center text-sm text-gray-500">
                  לא נמצאו משתמשים
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {showUserDetail && selectedUser && (
        <UserDetailModal
          user={selectedUser}
          games={games}
          onClose={() => setShowUserDetail(false)}
          onUserUpdated={handleUserUpdated}
        />
      )}
    </div>
  )
}
