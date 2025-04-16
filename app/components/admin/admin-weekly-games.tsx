"use client"

import { useState, useEffect } from "react"
import { getSupabaseClient } from "../../lib/supabase"
import { Calendar, Save, RefreshCw, CheckCircle, AlertTriangle, Search, Filter } from "lucide-react"

interface Game {
  id: string
  hometeam: string
  awayteam: string
  time: string
  date: string
  league: string
  week: number
}

interface WeeklyGames {
  [day: string]: string[]
}

const daysOfWeek = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"]

export default function AdminWeeklyGames() {
  const [games, setGames] = useState<Game[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState("")
  const [currentWeek, setCurrentWeek] = useState(1)
  const [selectedGames, setSelectedGames] = useState<WeeklyGames>({})
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split("T")[0])

  const [leagueFilter, setLeagueFilter] = useState<string>("")
  const [teamFilter, setTeamFilter] = useState<string>("")
  const [searchTerm, setSearchTerm] = useState<string>("")

  const [activeDay, setActiveDay] = useState<string>("sunday")

  // טעינת משחקים
  useEffect(() => {
    const fetchGames = async () => {
      setLoading(true)
      try {
        const supabase = getSupabaseClient()
        if (!supabase) {
          throw new Error("Supabase client is not available")
        }

        // קבלת השבוע הנוכחי
        const { data: settingsData, error: settingsError } = await supabase
          .from("settings")
          .select("*")
          .eq("id", "current_week")

        let currentWeek = 1
        if (settingsData && settingsData.length > 0) {
          currentWeek = Number.parseInt(settingsData[0].value)
        }
        setCurrentWeek(currentWeek)

        // טעינת המשחקים לפי השבוע הנוכחי
        const { data: gamesData, error: gamesError } = await supabase
          .from("games")
          .select("*")
          .eq("week", currentWeek)
          .order("date")

        if (gamesError) {
          throw new Error(`Error fetching games: ${gamesError.message}`)
        }

        setGames(gamesData || [])

        // טעינת המשחקים השבועיים הנוכחיים
        const { data: weeklyGamesData, error: weeklyGamesError } = await supabase
          .from("weekly_games")
          .select("*")
          .eq("week", currentWeek)

        if (weeklyGamesError) {
          console.error("Error fetching weekly games:", weeklyGamesError)
        }

        // אתחול המשחקים הנבחרים
        if (weeklyGamesData && weeklyGamesData.length > 0) {
          setSelectedGames(weeklyGamesData[0].games || {})
        } else {
          setSelectedGames({})
        }
      } catch (error) {
        console.error("Error fetching games:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchGames()
  }, [])

  const getUniqueLeagues = () => {
    const leagues = new Set<string>()
    games.forEach((game) => {
      if (game.league) {
        leagues.add(game.league)
      }
    })
    return Array.from(leagues).sort()
  }

  // פונקציה לקבלת משחקים לפי תאריך
  const getGamesByDate = (date: string) => {
    return games.filter((game) => {
      const gameDate = new Date(game.date)
      const formattedDate = `${gameDate.getFullYear()}-${String(gameDate.getMonth() + 1).padStart(2, "0")}-${String(gameDate.getDate()).padStart(2, "0")}`

      // Date filter
      const matchesDate = formattedDate === date

      // League filter
      const matchesLeague = leagueFilter ? game.league === leagueFilter : true

      // Team filter (check both home and away teams)
      const matchesTeam = teamFilter
        ? game.hometeam.toLowerCase().includes(teamFilter.toLowerCase()) ||
          game.awayteam.toLowerCase().includes(teamFilter.toLowerCase())
        : true

      // Search filter (check home team, away team, and league)
      const matchesSearch = searchTerm
        ? game.hometeam.toLowerCase().includes(searchTerm.toLowerCase()) ||
          game.awayteam.toLowerCase().includes(searchTerm.toLowerCase()) ||
          game.league.toLowerCase().includes(searchTerm.toLowerCase())
        : true

      return matchesDate && matchesLeague && matchesTeam && matchesSearch
    })
  }

  // פונקציה לבדיקה אם משחק נבחר
  const isGameSelected = (gameId: string, date: string) => {
    const formattedDate = formatDateKey(date)
    return selectedGames[formattedDate]?.includes(gameId) || false
  }

  // פונקציה לפורמט תאריך למפתח
  const formatDateKey = (date: string) => {
    const d = new Date(date)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
  }

  // פונקציה לספירת משחקים נבחרים לפי יום
  const countSelectedGamesByDay = () => {
    const counts: Record<string, number> = {}

    // Initialize counts for all days
    Object.keys(selectedGames).forEach((dateKey) => {
      const date = new Date(dateKey)
      const dayOfWeek = date.toLocaleDateString("en-US", { weekday: "long" }).toLowerCase()
      counts[dayOfWeek] = (counts[dayOfWeek] || 0) + (selectedGames[dateKey]?.length || 0)
    })

    return counts
  }

  // פונקציה לטיפול בבחירת משחק
  const handleGameSelection = (gameId: string, date: string) => {
    const formattedDate = formatDateKey(date)

    setSelectedGames((prev) => {
      const newSelectedGames = { ...prev }

      // אם התאריך לא קיים, יצירת מערך חדש
      if (!newSelectedGames[formattedDate]) {
        newSelectedGames[formattedDate] = []
      }

      // אם המשחק כבר נבחר, הסרתו
      if (newSelectedGames[formattedDate].includes(gameId)) {
        newSelectedGames[formattedDate] = newSelectedGames[formattedDate].filter((id) => id !== gameId)

        // אם אין יותר משחקים בתאריך זה, מחיקת המפתח
        if (newSelectedGames[formattedDate].length === 0) {
          delete newSelectedGames[formattedDate]
        }
      } else {
        // הוספת המשחק לרשימה
        newSelectedGames[formattedDate].push(gameId)
      }

      return newSelectedGames
    })
  }

  // פונקציה לשמירת המשחקים השבועיים
  const saveWeeklyGames = async () => {
    setSaving(true)
    setError("")
    setSuccess(false)

    try {
      const supabase = getSupabaseClient()
      if (!supabase) {
        throw new Error("Supabase client is not available")
      }

      // בדיקה אם יש כבר רשומה לשבוע הנוכחי
      const { data: existingData, error: checkError } = await supabase
        .from("weekly_games")
        .select("id")
        .eq("week", currentWeek)

      if (checkError) {
        throw new Error(`Error checking existing weekly games: ${checkError.message}`)
      }

      let result

      if (existingData && existingData.length > 0) {
        // עדכון הרשומה הקיימת
        result = await supabase
          .from("weekly_games")
          .update({
            games: selectedGames,
            updated_at: new Date().toISOString(),
          })
          .eq("week", currentWeek)
      } else {
        // יצירת רשומה חדשה
        result = await supabase.from("weekly_games").insert({
          week: currentWeek,
          games: selectedGames,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
      }

      if (result.error) {
        throw new Error(`Error saving weekly games: ${result.error.message}`)
      }

      setSuccess(true)

      // הסרת הודעת ההצלחה אחרי 3 שניות
      setTimeout(() => {
        setSuccess(false)
      }, 3000)
    } catch (err) {
      console.error("Error saving weekly games:", err)
      setError(err instanceof Error ? err.message : "שגיאה לא ידועה")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold flex items-center">
          <span>בחירת משחקים שבועיים</span>
          <span className="ml-2 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">שבוע {currentWeek}</span>
        </h3>
        <button
          className={`px-4 py-2 rounded-md text-white flex items-center ${
            saving ? "bg-gray-400 cursor-not-allowed" : "bg-navy-600 hover:bg-navy-700"
          }`}
          onClick={saveWeeklyGames}
          disabled={saving}
        >
          {saving ? <RefreshCw className="w-4 h-4 ml-1 animate-spin" /> : <Save className="w-4 h-4 ml-1" />}
          שמור משחקים שבועיים
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md flex items-center">
          <AlertTriangle className="w-5 h-5 ml-2" />
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-md flex items-center">
          <CheckCircle className="w-5 h-5 ml-2" />
          המשחקים השבועיים נשמרו בהצלחה
        </div>
      )}

      <div className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <div>
            <div className="flex items-center mb-2">
              <Calendar className="w-5 h-5 ml-2 text-gray-500" />
              <span className="text-sm">סנן לפי תאריך:</span>
            </div>
            <input
              type="date"
              className="w-full p-2 border border-gray-300 rounded-md"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
          </div>

          <div>
            <div className="flex items-center mb-2">
              <Filter className="w-5 h-5 ml-2 text-gray-500" />
              <span className="text-sm">סנן לפי ליגה:</span>
            </div>
            <select
              className="w-full p-2 border border-gray-300 rounded-md"
              value={leagueFilter}
              onChange={(e) => setLeagueFilter(e.target.value)}
            >
              <option value="">כל הליגות</option>
              {getUniqueLeagues().map((league) => (
                <option key={league} value={league}>
                  {league}
                </option>
              ))}
            </select>
          </div>

          <div>
            <div className="flex items-center mb-2">
              <Filter className="w-5 h-5 ml-2 text-gray-500" />
              <span className="text-sm">סנן לפי קבוצה:</span>
            </div>
            <input
              type="text"
              className="w-full p-2 border border-gray-300 rounded-md"
              placeholder="הזן שם קבוצה..."
              value={teamFilter}
              onChange={(e) => setTeamFilter(e.target.value)}
            />
          </div>

          <div>
            <div className="flex items-center mb-2">
              <Search className="w-5 h-5 ml-2 text-gray-500" />
              <span className="text-sm">חיפוש:</span>
            </div>
            <div className="relative">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                className="w-full pl-3 pr-10 py-2 border border-gray-300 rounded-md"
                placeholder="חיפוש חופשי..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Reset filters button */}
        <div className="flex justify-end">
          <button
            className="px-3 py-1 bg-gray-200 text-gray-700 rounded-md text-sm hover:bg-gray-300 flex items-center"
            onClick={() => {
              setLeagueFilter("")
              setTeamFilter("")
              setSearchTerm("")
            }}
          >
            <RefreshCw className="w-4 h-4 ml-1" />
            אפס סינונים
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-navy-600 border-r-transparent"></div>
          <p className="mt-2 text-gray-600">טוען משחקים...</p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex flex-wrap gap-2 mb-4">
            {daysOfWeek.map((day) => {
              const selectedCount = countSelectedGamesByDay()[day] || 0

              return (
                <button
                  key={day}
                  onClick={() => setActiveDay(day)}
                  className={`px-3 py-1 rounded-full text-sm font-medium relative ${
                    activeDay === day ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                >
                  {day === "sunday"
                    ? "ראשון"
                    : day === "monday"
                      ? "שני"
                      : day === "tuesday"
                        ? "שלישי"
                        : day === "wednesday"
                          ? "רביעי"
                          : day === "thursday"
                            ? "חמישי"
                            : day === "friday"
                              ? "שישי"
                              : "שבת"}
                  {selectedCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-navy-600 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">
                      {selectedCount}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
          {getGamesByDate(selectedDate).length > 0 ? (
            <div>
              <div className="flex justify-between items-center mb-2">
                <h4 className="font-medium">משחקים בתאריך {new Date(selectedDate).toLocaleDateString()}</h4>
                <div className="text-sm text-gray-500">
                  {Object.values(selectedGames).flat().length} משחקים נבחרו בסה"כ
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {getGamesByDate(selectedDate).map((game) => (
                  <div
                    key={game.id}
                    className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                      isGameSelected(game.id, game.date)
                        ? "border-navy-500 bg-navy-50"
                        : "border-gray-200 hover:border-navy-300"
                    }`}
                    onClick={() => handleGameSelection(game.id, game.date)}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <h5 className="font-medium">
                          {game.hometeam} - {game.awayteam}
                        </h5>
                        <p className="text-sm text-gray-600">
                          {game.league} | {game.time}
                        </p>
                      </div>
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center ${
                          isGameSelected(game.id, game.date) ? "bg-navy-600 text-white" : "bg-gray-200 text-gray-500"
                        }`}
                      >
                        {isGameSelected(game.id, game.date) ? "✓" : ""}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-8 bg-gray-50 rounded-lg">
              <p className="text-gray-600">לא נמצאו משחקים בתאריך זה</p>
            </div>
          )}
        </div>
      )}

      <div className="mt-6 text-sm text-gray-500 bg-gray-50 p-4 rounded-md">
        <div className="flex items-center mb-2">
          <AlertTriangle className="w-4 h-4 mr-2" />
          <span className="font-medium">הערות:</span>
        </div>
        <ul className="list-disc list-inside space-y-1 mr-6">
          <li>בחר את המשחקים שיופיעו בשבוע הנוכחי</li>
          <li>רק המשחקים הנבחרים יופיעו למשתמשים</li>
          <li>ניתן לבחור משחקים מתאריכים שונים</li>
          <li>לחץ על משחק כדי להוסיף/להסיר אותו מהרשימה</li>
          <li>לחץ על "שמור משחקים שבועיים" כדי לשמור את הבחירה</li>
        </ul>
      </div>
    </div>
  )
}
