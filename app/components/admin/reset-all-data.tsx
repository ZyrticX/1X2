"use client"

import { useState } from "react"
import { RefreshCw, AlertTriangle, CheckCircle, Trash2 } from "lucide-react"
import { getSupabaseClient } from "../../lib/supabase"

export default function ResetAllData() {
  const [isResetting, setIsResetting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const resetAllData = async () => {
    if (!confirm("האם אתה בטוח שברצונך למחוק את כל הנתונים? פעולה זו אינה הפיכה!")) {
      return
    }

    setIsResetting(true)
    setError(null)
    setSuccess(false)

    try {
      // 1. ניקוי כל הנתונים מ-localStorage
      if (typeof window !== "undefined") {
        // מחיקת כל הנתונים הקשורים לטבלת דירוג
        localStorage.removeItem("leaderboard")
        localStorage.removeItem("weeklyLeaderboard")
        localStorage.removeItem("users")
        localStorage.removeItem("cachedLeaderboard")

        // מחיקת ניחושים
        localStorage.removeItem("predictions")

        // מחיקת נתוני משחקים מקומיים
        localStorage.removeItem("adminGames")
        localStorage.removeItem("cachedGames")
        localStorage.removeItem("cachedGamesByDay")
        localStorage.removeItem("lastGamesUpdate")

        // מחיקת נתוני שבוע נוכחי
        for (let i = 1; i <= 20; i++) {
          localStorage.removeItem(`selectedGames_week_${i}`)
        }

        // מחיקת כל הנתונים האחרים
        localStorage.removeItem("gameResults")
        localStorage.removeItem("validPlayerCodes")
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
          }

          // ניסיון למחוק את כל הניחושים
          const { error: predictionsError } = await supabase
            .from("predictions")
            .delete()
            .neq("id", "00000000-0000-0000-0000-000000000000")

          if (predictionsError) {
            console.error("Error deleting predictions:", predictionsError)
          }

          // ניסיון למחוק את כל תוצאות המשחקים
          const { error: resultsError } = await supabase
            .from("game_results")
            .delete()
            .neq("id", "00000000-0000-0000-0000-000000000000")

          if (resultsError) {
            console.error("Error deleting game results:", resultsError)
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
      console.error("Error resetting data:", err)
      setError(err instanceof Error ? err.message : "שגיאה לא ידועה")
    } finally {
      setIsResetting(false)
    }
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md mb-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold">איפוס כל הנתונים</h3>
        <button
          className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 flex items-center"
          onClick={resetAllData}
          disabled={isResetting}
        >
          {isResetting ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Trash2 className="w-4 h-4 mr-2" />}
          {isResetting ? "מאפס..." : "אפס את כל הנתונים"}
        </button>
      </div>

      <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md flex items-center">
        <AlertTriangle className="w-5 h-5 mr-2 flex-shrink-0" />
        <div>
          <p className="font-bold">אזהרה חמורה!</p>
          <p>
            פעולה זו תמחק את כל הנתונים במערכת, כולל משתמשים, ניחושים, תוצאות משחקים וטבלאות דירוג. פעולה זו אינה הפיכה!
          </p>
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
          <span>כל הנתונים אופסו בהצלחה! הדף יטען מחדש בקרוב.</span>
        </div>
      )}
    </div>
  )
}
