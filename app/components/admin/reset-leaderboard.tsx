"use client"

import { useState } from "react"
import { RefreshCw, AlertTriangle, CheckCircle } from "lucide-react"
import { getSupabaseClient } from "../../lib/supabase"

export default function ResetLeaderboard() {
  const [isResetting, setIsResetting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const resetLeaderboard = async () => {
    if (!confirm("האם אתה בטוח שברצונך למחוק את כל המשתמשים מטבלת הדירוג? פעולה זו אינה הפיכה!")) {
      return
    }

    setIsResetting(true)
    setError(null)
    setSuccess(false)

    try {
      // 1. ניקוי נתונים מ-localStorage
      if (typeof window !== "undefined") {
        localStorage.removeItem("leaderboard")
        localStorage.removeItem("weeklyLeaderboard")
        localStorage.removeItem("predictions")
        localStorage.removeItem("users")
        localStorage.removeItem("cachedLeaderboard")
      }

      // 2. ניקוי נתונים מ-Supabase
      const supabase = getSupabaseClient()
      if (supabase) {
        try {
          // ניסיון למחוק את כל המשתמשים
          const { error: usersError } = await supabase
            .from("users")
            .delete()
            .neq("id", "00000000-0000-0000-0000-000000000000")

          if (usersError) {
            console.error("Error deleting users:", usersError)

            // אם אין הרשאות מחיקה, ננסה להשתמש ב-RPC
            try {
              const { error: rpcError } = await supabase.rpc("clear_users_table")
              if (rpcError) {
                throw new Error(`RPC error: ${rpcError.message}`)
              }
            } catch (rpcErr) {
              console.error("Error using RPC to clear users:", rpcErr)
              throw new Error("אין הרשאות למחיקת משתמשים. נסה להריץ את הסקריפט SQL ידנית.")
            }
          }

          // ניסיון למחוק את כל הניחושים
          const { error: predictionsError } = await supabase
            .from("predictions")
            .delete()
            .neq("id", "00000000-0000-0000-0000-000000000000")
          if (predictionsError) {
            console.error("Error deleting predictions:", predictionsError)
          }
        } catch (dbError) {
          console.error("Database error:", dbError)
          throw new Error("אירעה שגיאה בניקוי נתונים ממסד הנתונים")
        }
      }

      setSuccess(true)
      setTimeout(() => {
        window.location.reload()
      }, 1500)
    } catch (err) {
      console.error("Error resetting leaderboard:", err)
      setError(err instanceof Error ? err.message : "שגיאה לא ידועה")
    } finally {
      setIsResetting(false)
    }
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md mb-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold">איפוס טבלת דירוג</h3>
        <button
          className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 flex items-center"
          onClick={resetLeaderboard}
          disabled={isResetting}
        >
          {isResetting ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
          {isResetting ? "מאפס..." : "אפס טבלת דירוג"}
        </button>
      </div>

      <div className="mb-4 p-3 bg-yellow-50 text-yellow-700 rounded-md flex items-center">
        <AlertTriangle className="w-5 h-5 mr-2 flex-shrink-0" />
        <div>
          <p className="font-bold">שים לב!</p>
          <p>פעולה זו תמחק את כל המשתמשים מטבלת הדירוג ותאפס את כל הניחושים. פעולה זו אינה הפיכה!</p>
        </div>
      </div>

      {error && (
        <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-md flex items-center">
          <AlertTriangle className="w-5 h-5 mr-2 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="mt-4 p-3 bg-green-50 text-green-700 rounded-md flex items-center">
          <CheckCircle className="w-5 h-5 mr-2 flex-shrink-0" />
          <span>טבלת הדירוג אופסה בהצלחה! הדף יטען מחדש בקרוב.</span>
        </div>
      )}
    </div>
  )
}
