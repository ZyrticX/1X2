"use client"

import { useState, useEffect } from "react"
import { Lock, Unlock, AlertTriangle, Calendar, RefreshCw } from "lucide-react"
import { getSupabaseClient } from "../../lib/supabase"

// טיפוס למשחק
interface Game {
  id: string
  homeTeam: string
  awayTeam: string
  time: string
  date: string
  league: string
  isLocked?: boolean
  manuallyLocked?: boolean
}

export default function AdminGameLockManager() {
  const [games, setGames] = useState<Game[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split("T")[0])
  const [filteredGames, setFilteredGames] = useState<Game[]>([])
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [selectedGame, setSelectedGame] = useState<Game | null>(null)
  const [actionType, setActionType] = useState<"lock" | "unlock">("lock")
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // טעינת משחקים
  useEffect(() => {
    const fetchGames = async () => {
      setLoading(true)
      try {
        // קבלת הנתונים מ-Supabase
        const supabase = getSupabaseClient()
        if (!supabase) {
          throw new Error("Supabase client is not available")
        }

        // קבלת כל המשחקים
        const { data, error } = await supabase.from("games").select("*")

        if (error) {
          throw new Error(`Error fetching games: ${error.message}`)
        }

        // המרת הנתונים למבנה הנדרש
        const formattedGames = data.map((game) => ({
          id: game.id,
          homeTeam: game.hometeam,
          awayTeam: game.awayteam,
          time: game.time,
          date: new Date(game.date).toISOString().split("T")[0],
          league: game.league,
          isLocked: game.islocked || false,
          manuallyLocked: game.manuallylocked || false,
        }))

        setGames(formattedGames)
      } catch (error) {
        console.error("Error fetching games:", error)
        setError("אירעה שגיאה בטעינת המשחקים. נסה לרענן את הדף.")
      } finally {
        setLoading(false)
      }
    }

    fetchGames()
  }, [])

  // סינון משחקים לפי תאריך
  useEffect(() => {
    if (selectedDate) {
      setFilteredGames(games.filter((game) => game.date === selectedDate))
    } else {
      setFilteredGames(games)
    }
  }, [games, selectedDate])

  // פונקציה לנעילת משחק
  const handleLockGame = (game: Game) => {
    setSelectedGame(game)
    setActionType("lock")
    setShowConfirmDialog(true)
  }

  // פונקציה לפתיחת משחק
  const handleUnlockGame = (game: Game) => {
    setSelectedGame(game)
    setActionType("unlock")
    setShowConfirmDialog(true)
  }

  // פונקציה לאישור הפעולה - מתוקנת
  const confirmAction = async () => {
    if (!selectedGame) return

    setIsLoading(true)
    setError(null)

    try {
      // עדכון ב-Supabase
      const supabase = getSupabaseClient()
      if (!supabase) {
        throw new Error("Supabase client is not available")
      }

      // ביצוע העדכון במסד הנתונים
      const { error: updateError, data: updateData } = await supabase
        .from("games")
        .update({
          islocked: actionType === "lock",
          manuallylocked: actionType === "lock",
        })
        .eq("id", selectedGame.id)
        .select()

      // בדיקה אם העדכון הצליח
      if (updateError) {
        console.error("Error updating game lock status:", updateError)
        throw new Error(`Error updating game: ${updateError.message}`)
      }

      // רק אם העדכון הצליח, עדכן את המצב המקומי
      const updatedGames = games.map((game) => {
        if (game.id === selectedGame.id) {
          return {
            ...game,
            isLocked: actionType === "lock",
            manuallyLocked: actionType === "lock",
          }
        }
        return game
      })

      // עדכון המצב המקומי
      setGames(updatedGames)

      // סגירת הדיאלוג
      setShowConfirmDialog(false)
      setSelectedGame(null)

      // הצגת הודעת הצלחה
      setError(null)
    } catch (error) {
      console.error("Error confirming action:", error)
      setError(error instanceof Error ? error.message : "שגיאה בעדכון סטטוס המשחק")
    } finally {
      setIsLoading(false)
    }
  }

  // פונקציה לרענון ידני של המשחקים
  const refreshGames = async () => {
    setRefreshing(true)
    setError(null)

    try {
      // קבלת הנתונים מ-Supabase
      const supabase = getSupabaseClient()
      if (!supabase) {
        throw new Error("Supabase client is not available")
      }

      // קבלת כל המשחקים
      const { data, error } = await supabase.from("games").select("*")

      if (error) {
        throw new Error(`Error fetching games: ${error.message}`)
      }

      // המרת הנתונים למבנה הנדרש
      const formattedGames = data.map((game) => ({
        id: game.id,
        homeTeam: game.hometeam,
        awayTeam: game.awayteam,
        time: game.time,
        date: new Date(game.date).toISOString().split("T")[0],
        league: game.league,
        isLocked: game.islocked || false,
        manuallyLocked: game.manuallylocked || false,
      }))

      setGames(formattedGames)
    } catch (error) {
      console.error("Error refreshing games:", error)
      setError("אירעה שגיאה ברענון המשחקים.")
    } finally {
      setRefreshing(false)
    }
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold">ניהול נעילת משחקים</h3>
        <button
          className="bg-blue-600 text-white py-1.5 px-3 rounded-md text-sm hover:bg-blue-700 transition-colors flex items-center"
          onClick={refreshGames}
          disabled={refreshing}
        >
          {refreshing ? <RefreshCw className="w-4 h-4 mr-1 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-1" />}
          רענן משחקים
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md flex items-center">
          <AlertTriangle className="w-5 h-5 mr-2 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="mb-4 p-3 bg-blue-50 text-blue-700 rounded-md flex items-center">
        <Calendar className="w-5 h-5 mr-2" />
        <p>
          <span className="font-bold">היום יום שלישי:</span> כל המשחקים נעולים חוץ ממשחקי יום שלישי.
        </p>
      </div>

      <div className="mb-6">
        <p className="text-sm text-gray-600 mb-4">
          כאן תוכל לנעול או לפתוח משחקים באופן ידני במקרה של תקלה או שינוי לוח זמנים.
        </p>

        <div className="flex items-center mb-4">
          <Calendar className="w-5 h-5 ml-2 text-gray-500" />
          <span className="text-sm ml-2">סנן לפי תאריך:</span>
          <input
            type="date"
            className="p-2 border border-gray-300 rounded-md ml-2"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
          />
          {selectedDate && (
            <button className="ml-2 text-sm text-blue-600 hover:text-blue-800" onClick={() => setSelectedDate("")}>
              נקה סינון
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-navy-600 border-r-transparent"></div>
          <p className="mt-2 text-gray-600">טוען משחקים...</p>
        </div>
      ) : filteredGames.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <p className="text-gray-600">לא נמצאו משחקים בתאריך זה</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredGames.map((game) => (
            <div
              key={game.id}
              className={`p-4 border rounded-lg ${
                game.isLocked ? "bg-red-50 border-red-200" : "bg-green-50 border-green-200"
              }`}
            >
              <div className="flex justify-between items-center">
                <div>
                  <div className="font-bold text-lg">
                    {game.homeTeam} - {game.awayTeam}
                  </div>
                  <div className="text-sm text-gray-600">
                    {game.league} | {game.time} | {new Date(game.date).toLocaleDateString("he-IL")}
                  </div>
                </div>
                <div className="flex items-center">
                  <div
                    className={`px-3 py-1 rounded-full text-sm font-medium mr-4 ${
                      game.isLocked ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"
                    }`}
                  >
                    {game.isLocked ? (
                      <span className="flex items-center">
                        <Lock className="w-4 h-4 ml-1" />
                        נעול
                        {game.manuallyLocked && " (ידני)"}
                      </span>
                    ) : (
                      <span className="flex items-center">
                        <Unlock className="w-4 h-4 ml-1" />
                        פתוח
                      </span>
                    )}
                  </div>
                  {game.isLocked ? (
                    <button
                      className="bg-green-600 text-white py-1 px-3 rounded-md text-sm hover:bg-green-700 transition-colors flex items-center"
                      onClick={() => handleUnlockGame(game)}
                    >
                      <Unlock className="w-4 h-4 ml-1" />
                      פתח משחק
                    </button>
                  ) : (
                    <button
                      className="bg-red-600 text-white py-1 px-3 rounded-md text-sm hover:bg-red-700 transition-colors flex items-center"
                      onClick={() => handleLockGame(game)}
                    >
                      <Lock className="w-4 h-4 ml-1" />
                      נעל משחק
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* דיאלוג אישור */}
      {showConfirmDialog && selectedGame && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex items-center text-navy-600 mb-4">
              <AlertTriangle className="w-6 h-6 mr-2" />
              <h4 className="text-lg font-bold">אישור פעולה</h4>
            </div>
            <p className="mb-6">
              {actionType === "lock"
                ? `האם אתה בטוח שברצונך לנעול את המשחק בין ${selectedGame.homeTeam} ל-${selectedGame.awayTeam}? משתמשים לא יוכלו להמר על משחק זה.`
                : `האם אתה בטוח שברצונך לפתוח את המשחק בין ${selectedGame.homeTeam} ל-${selectedGame.awayTeam}? משתמשים יוכלו להמר על משחק זה.`}
            </p>
            <div className="flex justify-end space-x-2 rtl:space-x-reverse">
              <button
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
                onClick={() => setShowConfirmDialog(false)}
              >
                ביטול
              </button>
              <button
                className={`px-4 py-2 text-white rounded-md ${
                  actionType === "lock" ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"
                }`}
                onClick={confirmAction}
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="flex items-center justify-center">
                    <RefreshCw className="w-4 h-4 ml-2 animate-spin" />
                    {actionType === "lock" ? "נועל..." : "פותח..."}
                  </span>
                ) : actionType === "lock" ? (
                  "נעל משחק"
                ) : (
                  "פתח משחק"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="mt-6 text-sm text-gray-500 bg-gray-50 p-4 rounded-md">
        <div className="flex items-center mb-2">
          <AlertTriangle className="w-4 h-4 mr-2" />
          <span className="font-medium">הערות חשובות:</span>
        </div>
        <ul className="list-disc list-inside space-y-1 mr-6">
          <li>נעילת משחק תמנע ממשתמשים להמר על המשחק</li>
          <li>פתיחת משחק תאפשר למשתמשים להמר על המשחק גם אם הוא היה נעול קודם</li>
          <li>שינויים אלו משפיעים על כל המשתמשים במערכת</li>
          <li>משחקים שנעולים באופן אוטומטי (בגלל זמן) לא יפתחו אוטומטית</li>
        </ul>
      </div>
    </div>
  )
}
