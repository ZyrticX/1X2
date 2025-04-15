"use client"

import { useState, useEffect } from "react"
import { getSupabaseClient } from "../../lib/supabase"
import { RefreshCw, CheckCircle, AlertTriangle, Trash2, Save, UserCheck } from "lucide-react"

export default function ManageLeaderboardUsers() {
  const [users, setUsers] = useState<any[]>([])
  const [selectedUsers, setSelectedUsers] = useState<Record<string, boolean>>({})
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // טעינת המשתמשים
  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true)
      setError(null)

      try {
        const supabase = getSupabaseClient()
        if (!supabase) {
          throw new Error("Supabase client is not available")
        }

        // קבלת כל המשתמשים
        const { data, error } = await supabase.from("users").select("*").order("name")

        if (error) {
          throw new Error(`Error fetching users: ${error.message}`)
        }

        setUsers(data || [])

        // אתחול מצב הבחירה - כל המשתמשים לא מסומנים
        const initialSelection: Record<string, boolean> = {}
        data?.forEach((user) => {
          initialSelection[user.id] = false
        })
        setSelectedUsers(initialSelection)
      } catch (err) {
        console.error("Error fetching users:", err)
        setError(err instanceof Error ? err.message : "שגיאה בטעינת המשתמשים")
      } finally {
        setLoading(false)
      }
    }

    fetchUsers()
  }, [])

  // פונקציה לטיפול בשינוי בחירת משתמש
  const handleUserSelection = (userId: string) => {
    setSelectedUsers((prev) => ({
      ...prev,
      [userId]: !prev[userId],
    }))
  }

  // פונקציה לשמירת המשתמשים הנבחרים ומחיקת השאר
  const handleSaveSelection = async () => {
    if (Object.values(selectedUsers).filter(Boolean).length === 0) {
      setError("יש לבחור לפחות משתמש אחד לשמירה")
      return
    }

    if (!confirm("האם אתה בטוח שברצונך למחוק את כל המשתמשים שלא נבחרו? פעולה זו אינה הפיכה!")) {
      return
    }

    setProcessing(true)
    setError(null)
    setSuccess(null)

    try {
      const supabase = getSupabaseClient()
      if (!supabase) {
        throw new Error("Supabase client is not available")
      }

      // מציאת המשתמשים שיש למחוק (אלה שלא נבחרו)
      const usersToDelete = users.filter((user) => !selectedUsers[user.id]).map((user) => user.id)

      if (usersToDelete.length > 0) {
        // מחיקת המשתמשים שלא נבחרו
        const { error } = await supabase.from("users").delete().in("id", usersToDelete)

        if (error) {
          throw new Error(`Error deleting users: ${error.message}`)
        }

        // מחיקת הניחושים של המשתמשים שנמחקו
        const { error: predError } = await supabase.from("predictions").delete().in("userid", usersToDelete)

        if (predError) {
          console.error("Error deleting predictions:", predError)
        }
      }

      // ניקוי נתונים מקומיים
      if (typeof window !== "undefined") {
        localStorage.removeItem("leaderboard")
        localStorage.removeItem("weeklyLeaderboard")

        // עדכון הניחושים המקומיים - שמירה רק של הניחושים של המשתמשים שנבחרו
        const predictions = JSON.parse(localStorage.getItem("predictions") || "[]")
        const selectedUserIds = Object.entries(selectedUsers)
          .filter(([_, isSelected]) => isSelected)
          .map(([id]) => id)

        const filteredPredictions = predictions.filter(
          (pred: any) => selectedUserIds.includes(pred.userid) || selectedUserIds.includes(pred.user_id),
        )

        localStorage.setItem("predictions", JSON.stringify(filteredPredictions))
      }

      setSuccess(
        `נשמרו ${Object.values(selectedUsers).filter(Boolean).length} משתמשים ונמחקו ${usersToDelete.length} משתמשים`,
      )

      // עדכון רשימת המשתמשים
      setUsers(users.filter((user) => selectedUsers[user.id]))
    } catch (err) {
      console.error("Error saving selection:", err)
      setError(err instanceof Error ? err.message : "שגיאה בשמירת הבחירה")
    } finally {
      setProcessing(false)
    }
  }

  // פונקציה לבחירת כל המשתמשים
  const selectAll = () => {
    const newSelection: Record<string, boolean> = {}
    users.forEach((user) => {
      newSelection[user.id] = true
    })
    setSelectedUsers(newSelection)
  }

  // פונקציה לביטול בחירת כל המשתמשים
  const deselectAll = () => {
    const newSelection: Record<string, boolean> = {}
    users.forEach((user) => {
      newSelection[user.id] = false
    })
    setSelectedUsers(newSelection)
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md mb-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold">ניהול משתמשים בטבלת דירוג</h3>
        <div className="flex space-x-2 rtl:space-x-reverse">
          <button
            className="px-3 py-1 bg-blue-600 text-white rounded-md text-sm flex items-center"
            onClick={selectAll}
            disabled={loading || processing}
          >
            <UserCheck className="w-4 h-4 ml-1" />
            בחר הכל
          </button>
          <button
            className="px-3 py-1 bg-gray-600 text-white rounded-md text-sm flex items-center"
            onClick={deselectAll}
            disabled={loading || processing}
          >
            <Trash2 className="w-4 h-4 ml-1" />
            בטל בחירה
          </button>
          <button
            className="px-3 py-1 bg-green-600 text-white rounded-md text-sm flex items-center"
            onClick={handleSaveSelection}
            disabled={loading || processing}
          >
            {processing ? <RefreshCw className="w-4 h-4 ml-1 animate-spin" /> : <Save className="w-4 h-4 ml-1" />}
            שמור בחירה
          </button>
        </div>
      </div>

      <div className="mb-4 p-3 bg-blue-50 text-blue-700 rounded-md">
        <p>בחר את המשתמשים שברצונך לשמור בטבלת הדירוג. כל המשתמשים שלא יבחרו יימחקו מהמערכת.</p>
        <p className="mt-1 font-bold">
          נבחרו {Object.values(selectedUsers).filter(Boolean).length} מתוך {users.length} משתמשים.
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md flex items-center">
          <AlertTriangle className="w-5 h-5 mr-2 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 bg-green-50 text-green-700 rounded-md flex items-center">
          <CheckCircle className="w-5 h-5 mr-2 flex-shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {loading ? (
        <div className="text-center py-8">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-navy-600 border-r-transparent"></div>
          <p className="mt-2 text-gray-600">טוען משתמשים...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {users.map((user) => (
            <div
              key={user.id}
              className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                selectedUsers[user.id] ? "border-green-500 bg-green-50" : "border-gray-200 hover:bg-gray-50"
              }`}
              onClick={() => handleUserSelection(user.id)}
            >
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={selectedUsers[user.id] || false}
                  onChange={() => handleUserSelection(user.id)}
                  className="w-5 h-5 ml-3"
                />
                <div>
                  <div className="font-medium">{user.name}</div>
                  <div className="text-sm text-gray-500">קוד שחקן: {user.playercode}</div>
                  <div className="text-sm text-gray-500">נקודות: {user.points || 0}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
