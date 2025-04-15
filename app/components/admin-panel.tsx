"use client"

import { useRouter } from "next/navigation"

export default function AdminPanel() {
  const router = useRouter()

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-center">פאנל ניהול</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button
          onClick={() => router.push("/admin-data-access")}
          className="bg-navy-600 text-white p-4 rounded-lg hover:bg-navy-700 transition-colors"
        >
          ניהול נתונים
        </button>

        <button
          onClick={() => router.push("/admin/games")}
          className="bg-green-600 text-white p-4 rounded-lg hover:bg-green-700 transition-colors"
        >
          ניהול משחקים
        </button>

        <button
          onClick={() => router.push("/admin/users")}
          className="bg-blue-600 text-white p-4 rounded-lg hover:bg-blue-700 transition-colors"
        >
          ניהול משתמשים
        </button>

        <button
          onClick={() => router.push("/admin/settings")}
          className="bg-purple-600 text-white p-4 rounded-lg hover:bg-purple-700 transition-colors"
        >
          הגדרות מערכת
        </button>
      </div>
    </div>
  )
}
