"use client"

import { useState, useEffect } from "react"
import { getSupabaseClient } from "../../lib/supabase"
import { Trash2, Search, RefreshCw, AlertTriangle, CheckCircle } from "lucide-react"

interface Game {
  id: string
  hometeam: string
  awayteam: string
  time: string
  date: string
  league: string
  week: number
  isfinished?: boolean
  result?: string
}

export default function DeleteGames() {
  const [games, setGames] = useState<Game[]>([])
  const [filteredGames, setFilteredGames] = useState<Game[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedWeek, setSelectedWeek] = useState<number | null>(null)
  const [selectedDate, setSelectedDate] = useState<string>("")
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // טעינת המשחקים
  useEffect(() => {
    const fetchGames = async () => {
      setLoading(true)
      setError(null)

      try {
        const supabase = getSupabaseClient()
        if (!supabase) {
          throw new Error("Supabase client is not available")
        }

        const { data, error } = await supabase.from("games").select("*").order("date", { ascending: false })

        if (error) {
          throw new Error(`Error fetching games: ${error.message}`)
        }

        setGames(data || [])
        setFilteredGames(data || [])
      } catch (err) {
        console.error("Error fetching games:", err)
        setError(err instanceof Error ? err.message : "שגיאה בטעינת המשחקים")
      } finally {
        setLoading(false)
      }
    }

    fetchGames()
  }, [])

  // סינון המשחקים לפי חיפוש, שבוע ותאריך
  useEffect(() => {
    let filtered = [...games]

    // סינון לפי חיפוש
    if (searchTerm) {
      filtered = filtered.filter(
        (game) =>
          game.hometeam.toLowerCase().includes(searchTerm.toLowerCase()) ||
          game.awayteam.toLowerCase().includes(searchTerm.toLowerCase()) ||
          game.league.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    // סינון לפי שבוע
    if (selectedWeek !== null) {
      filtered = filtered.filter((game) => game.week === selectedWeek)
    }

    // סינון לפי תאריך
    if (selectedDate) {
      filtered = filtered.filter((game) => {
        const gameDate = new Date(game.date).toISOString().split("T")[0]
        return gameDate === selectedDate
      })
    }

    setFilteredGames(filtered)
  }, [games, searchTerm, selectedWeek, selectedDate])

  // פונקציה למחיקת משחק
  const handleDeleteGame = async (gameId: string) => {
    if (!confirm("האם אתה בטוח שברצונך למחוק משחק זה? פעולה זו אינה הפיכה!")) {
      return
    }

    setIsDeleting(true)
    setError(null)
    setSuccess(null)

    try {
      const supabase = getSupabaseClient()
      if (!supabase) {
        throw new Error("Supabase client is not available")
      }

      // מחיקת המשחק מבסיס הנתונים
      const { error } = await supabase.from("games").delete().eq("id", gameId)

      if (error) {
        throw new Error(`Error deleting game: ${error.message}`)
      }

      // עדכון הרשימה המקומית
      setGames((prev) => prev.filter((game) => game.id !== gameId))
      setSuccess("המשחק נמחק בהצלחה")

      // הסרת הודעת ההצלחה אחרי 3 שניות
      setTimeout(() => {
        setSuccess(null)
      }, 3000)
    } catch (err) {
      console.error("Error deleting game:", err)
      setError(err instanceof Error ? err.message : "שגיאה במחיקת המשחק")
    } finally {
      setIsDeleting(false)
    }
  }

  // פונקציה למחיקת כל המשחקים המסוננים
  const handleDeleteFilteredGames = async () => {
    if (filteredGames.length === 0) {
      setError("אין משחקים למחיקה")
      return
    }

    if (!confirm(`האם אתה בטוח שברצונך למחוק ${filteredGames.length} משחקים? פעולה זו אינה הפיכה!`)) {
      return
    }

    setIsDeleting(true)
    setError(null)
    setSuccess(null)

    try {
      const supabase = getSupabaseClient()
      if (!supabase) {
        throw new Error("Supabase client is not available")
      }

      // מחיקת המשחקים מבסיס הנתונים
      const gameIds = filteredGames.map((game) => game.id)

      // מחיקה בקבוצות של 100 משחקים (מגבלת Supabase)
      const chunkSize = 100
      for (let i = 0; i < gameIds.length; i += chunkSize) {
        const chunk = gameIds.slice(i, i + chunkSize)
        const { error } = await supabase.from("games").delete().in("id", chunk)

        if (error) {
          throw new Error(`Error deleting games: ${error.message}`)
        }
      }

      // עדכון הרשימה המקומית
      setGames((prev) => prev.filter((game) => !gameIds.includes(game.id)))
      setSuccess(`${gameIds.length} משחקים נמחקו בהצלחה`)

      // הסרת הודעת ההצלחה אחרי 3 שניות
      setTimeout(() => {
        setSuccess(null)
      }, 3000)
    } catch (err) {
      console.error("Error deleting games:", err)
      setError(err instanceof Error ? err.message : "שגיאה במחיקת המשחקים")
    } finally {
      setIsDeleting(false)
    }
  }

  // קבלת כל השבועות הייחודיים
  const getUniqueWeeks = () => {
    const weeks = new Set<number>()
    games.forEach((game) => {
      if (game.week !== null && game.week !== undefined) {
        weeks.add(game.week)
      }
    })
    return Array.from(weeks).sort((a, b) => a - b)
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md mb-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold">מחיקת משחקים</h3>
        <button
          className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 flex items-center"
          onClick={handleDeleteFilteredGames}
          disabled={isDeleting || filteredGames.length === 0}
        >
          {isDeleting ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Trash2 className="w-4 h-4 mr-2" />}
          מחק את כל המשחקים המסוננים ({filteredGames.length})
        </button>
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

      <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">חיפוש</label>
          <div className="relative">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="חיפוש לפי קבוצה או ליגה..."
              className="pl-3 pr-10 py-2 border border-gray-300 rounded-md w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">סינון לפי שבוע</label>
          <select
            className="border border-gray-300 rounded-md px-3 py-2 w-full"
            value={selectedWeek === null ? "" : selectedWeek}
            onChange={(e) => setSelectedWeek(e.target.value ? Number(e.target.value) : null)}
          >
            <option value="">כל השבועות</option>
            {getUniqueWeeks().map((week) => (
              <option key={week} value={week}>
                שבוע {week}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">סינון לפי תאריך</label>
          <div className="flex items-center">
            <input
              type="date"
              className="border border-gray-300 rounded-md px-3 py-2 w-full"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
            {selectedDate && (
              <button
                className="ml-2 text-gray-500 hover:text-gray-700"
                onClick={() => setSelectedDate("")}
                title="נקה תאריך"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-navy-600 border-r-transparent"></div>
          <p className="mt-2 text-gray-600">טוען משחקים...</p>
        </div>
      ) : filteredGames.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <p className="text-gray-600">לא נמצאו משחקים</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  קבוצת בית
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  קבוצת חוץ
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ליגה
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  תאריך
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">שעה</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  שבוע
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  סטטוס
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  פעולות
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredGames.map((game) => (
                <tr key={game.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{game.hometeam}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{game.awayteam}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{game.league}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(game.date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{game.time}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {game.week !== null && game.week !== undefined ? game.week : "-"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span
                      className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        game.isfinished ? "bg-green-100 text-green-800" : "bg-blue-100 text-blue-800"
                      }`}
                    >
                      {game.isfinished ? "הסתיים" : "פעיל"}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                    <button
                      className="text-red-600 hover:text-red-900"
                      onClick={() => handleDeleteGame(game.id)}
                      disabled={isDeleting}
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-6 text-sm text-gray-500 bg-gray-50 p-4 rounded-md">
        <div className="flex items-center mb-2">
          <AlertTriangle className="w-4 h-4 mr-2" />
          <span className="font-medium">הערות חשובות:</span>
        </div>
        <ul className="list-disc list-inside space-y-1 mr-6">
          <li>מחיקת משחק תמחק גם את כל הניחושים הקשורים אליו</li>
          <li>פעולת המחיקה אינה הפיכה - לא ניתן לשחזר משחקים שנמחקו</li>
          <li>ניתן לסנן משחקים לפי שבוע, תאריך או חיפוש טקסט חופשי</li>
          <li>ניתן למחוק משחק בודד או את כל המשחקים המסוננים בבת אחת</li>
        </ul>
      </div>
    </div>
  )
}
