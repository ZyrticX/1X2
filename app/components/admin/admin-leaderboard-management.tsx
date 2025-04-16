"use client"

import { useState, useEffect } from "react"
import { Trophy, Edit, Save, X, RefreshCw, AlertCircle } from "lucide-react"
import { getSupabaseClient } from "../../lib/supabase"

// עדכון הטיפוס של AdminUser
interface AdminUser {
  id: string
  name: string
  playercode: string
  points: number
  status?: "active" | "blocked"
  winner?: boolean
}

export default function AdminLeaderboardManagement() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [editMode, setEditMode] = useState(false)
  const [editingUser, setEditingUser] = useState<string | null>(null)
  const [editValues, setEditValues] = useState<Record<string, { points: number; correctPredictions: number }>>({})
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // פונקציה לרענון טבלת הדירוג
  const refreshLeaderboard = async () => {
    setLoading(true)
    setError(null)
    try {
      const supabase = getSupabaseClient()
      if (!supabase) {
        throw new Error("Supabase client is not available")
      }

      // טעינת משתמשים אמיתיים מ-Supabase
      const { data, error } = await supabase.from("users").select("*").order("points", { ascending: false })

      if (error) {
        throw new Error(`Error fetching users: ${error.message}`)
      }

      // המרת הנתונים למבנה הנדרש
      const formattedUsers = data.map((user) => ({
        id: user.id,
        name: user.name || "",
        playercode: user.playercode || "",
        points: user.points || 0,
        status: (user.status as "active" | "blocked") || "active",
        winner: false, // ברירת מחדל
      }))

      setUsers(formattedUsers)
    } catch (error) {
      console.error("Error fetching users:", error)
      setError(error instanceof Error ? error.message : "שגיאה בטעינת המשתמשים")
      setUsers([]) // מערך ריק במקרה של שגיאה
    } finally {
      setLoading(false)
    }
  }

  // עדכון useEffect לטעינת משתמשים אמיתיים מ-Supabase
  useEffect(() => {
    refreshLeaderboard()
  }, [])

  const handleEditStart = (user: AdminUser) => {
    setEditingUser(user.id)
    setEditValues({
      ...editValues,
      [user.id]: {
        points: user.points,
        correctPredictions: Math.floor(user.points / 3), // לצורך הדוגמה
      },
    })
  }

  const handleEditCancel = () => {
    setEditingUser(null)
  }

  const handleEditSave = async (userId: string) => {
    try {
      setError(null)
      setSuccess(null)

      const supabase = getSupabaseClient()
      if (!supabase) {
        throw new Error("Supabase client is not available")
      }

      // עדכון הנקודות של המשתמש ב-Supabase
      const { error } = await supabase.from("users").update({ points: editValues[userId].points }).eq("id", userId)

      if (error) {
        throw new Error(`Error updating user points: ${error.message}`)
      }

      // רענון הטבלה לאחר העדכון
      await refreshLeaderboard()

      setEditingUser(null)
      setSuccess("הנקודות עודכנו בהצלחה")

      // מחיקת ההודעה אחרי 3 שניות
      setTimeout(() => {
        setSuccess(null)
      }, 3000)
    } catch (err) {
      console.error("Error saving user points:", err)
      setError(err instanceof Error ? err.message : "שגיאה בעדכון הנקודות")
    }
  }

  const handleInputChange = (userId: string, field: "points" | "correctPredictions", value: number) => {
    setEditValues({
      ...editValues,
      [userId]: {
        ...editValues[userId],
        [field]: value,
      },
    })
  }

  const resetLeaderboard = async () => {
    if (window.confirm("האם אתה בטוח שברצונך לאפס את טבלת הדירוג? פעולה זו תאפס את הנקודות של כל המשתמשים.")) {
      try {
        setError(null)
        setSuccess(null)

        const supabase = getSupabaseClient()
        if (!supabase) {
          throw new Error("Supabase client is not available")
        }

        // איפוס הנקודות של כל המשתמשים ב-Supabase
        const { error } = await supabase.from("users").update({
          points: 0,
          correct_predictions: 0,
          total_predictions: 0,
          last_week_points: 0,
        })

        if (error) {
          throw new Error(`Error resetting leaderboard: ${error.message}`)
        }

        // רענון הטבלה לאחר האיפוס
        await refreshLeaderboard()

        setSuccess("טבלת הדירוג אופסה בהצלחה")

        // מחיקת ההודעה אחרי 3 שניות
        setTimeout(() => {
          setSuccess(null)
        }, 3000)
      } catch (err) {
        console.error("Error resetting leaderboard:", err)
        setError(err instanceof Error ? err.message : "שגיאה באיפוס טבלת הדירוג")
      }
    }
  }

  // הוספת מנגנון רענון אוטומטי כל 30 שניות
  useEffect(() => {
    const intervalId = setInterval(() => {
      refreshLeaderboard()
    }, 30000) // 30 seconds

    return () => clearInterval(intervalId)
  }, [])

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold">ניהול טבלת דירוג</h3>
        <div className="flex space-x-2 rtl:space-x-reverse">
          <button
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center"
            onClick={refreshLeaderboard}
          >
            <RefreshCw className="w-4 h-4 ml-2" />
            רענן טבלה
          </button>
          <button
            className="px-4 py-2 bg-navy-600 text-white rounded-md hover:bg-navy-700 flex items-center"
            onClick={() => setEditMode(!editMode)}
          >
            <Edit className="w-4 h-4 ml-2" />
            {editMode ? "סיום עריכה" : "ערוך טבלה"}
          </button>
          <button
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 flex items-center"
            onClick={resetLeaderboard}
          >
            <RefreshCw className="w-4 h-4 ml-2" />
            אפס טבלה
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md flex items-center">
          <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 bg-green-50 text-green-700 rounded-md flex items-center">
          <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {loading ? (
        <div className="text-center py-8">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-navy-600 border-r-transparent"></div>
          <p className="mt-2 text-gray-600">טוען נתונים...</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100 text-gray-700">
                <th className="px-4 py-3 text-right">#</th>
                <th className="px-4 py-3 text-right">שם</th>
                <th className="px-4 py-3 text-center">קוד שחקן</th>
                <th className="px-4 py-3 text-center">נקודות</th>
                <th className="px-4 py-3 text-center">ניחושים נכונים</th>
                {editMode && <th className="px-4 py-3 text-center">פעולות</th>}
              </tr>
            </thead>
            <tbody>
              {users.length > 0 ? (
                users.map((user, index) => {
                  const isEditing = editingUser === user.id
                  const correctPredictions = Math.floor(user.points / 3) // לצורך הדוגמה

                  return (
                    <tr
                      key={user.id}
                      className={`border-b border-gray-200 ${index < 3 ? "bg-yellow-50" : ""} hover:bg-gray-50`}
                    >
                      <td className="px-4 py-3 text-right">
                        {index === 0 ? (
                          <div className="inline-flex items-center justify-center w-6 h-6 bg-yellow-500 text-white rounded-full">
                            <Trophy className="w-3 h-3" />
                          </div>
                        ) : (
                          <span className={`${index < 3 ? "font-bold" : ""}`}>{index + 1}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right font-medium">{user.name}</td>
                      <td className="px-4 py-3 text-center font-mono">{user.playercode}</td>
                      <td className="px-4 py-3 text-center">
                        {isEditing ? (
                          <input
                            type="number"
                            className="w-16 px-2 py-1 border border-gray-300 rounded-md text-center"
                            value={editValues[user.id]?.points || 0}
                            onChange={(e) => handleInputChange(user.id, "points", Number.parseInt(e.target.value) || 0)}
                          />
                        ) : (
                          <span className="font-bold">{isNaN(Number(user.points)) ? 0 : user.points}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {isEditing ? (
                          <input
                            type="number"
                            className="w-16 px-2 py-1 border border-gray-300 rounded-md text-center"
                            value={editValues[user.id]?.correctPredictions || 0}
                            onChange={(e) =>
                              handleInputChange(user.id, "correctPredictions", Number.parseInt(e.target.value) || 0)
                            }
                          />
                        ) : (
                          correctPredictions
                        )}
                      </td>
                      {editMode && (
                        <td className="px-4 py-3 text-center">
                          {isEditing ? (
                            <div className="flex justify-center space-x-1 rtl:space-x-reverse">
                              <button
                                className="p-1 text-green-600 hover:bg-green-50 rounded"
                                onClick={() => handleEditSave(user.id)}
                              >
                                <Save className="w-4 h-4" />
                              </button>
                              <button className="p-1 text-red-600 hover:bg-red-50 rounded" onClick={handleEditCancel}>
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <button
                              className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                              onClick={() => handleEditStart(user)}
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                          )}
                        </td>
                      )}
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan={editMode ? 6 : 5} className="px-4 py-4 text-center text-gray-500">
                    לא נמצאו משתמשים
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-6 text-sm text-gray-500 bg-gray-50 p-4 rounded-md">
        <p className="font-medium mb-2">הערות:</p>
        <ul className="list-disc list-inside space-y-1 mr-6">
          <li>שינויים בטבלת הדירוג ישפיעו על הדירוג המוצג למשתמשים</li>
          <li>איפוס הטבלה יאפס את הנקודות של כל המשתמשים ל-0</li>
          <li>הטבלה מתעדכנת אוטומטית בסוף כל שבוע</li>
        </ul>
      </div>
    </div>
  )
}
