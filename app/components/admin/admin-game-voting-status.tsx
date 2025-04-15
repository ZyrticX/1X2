"use client"

import { useState, useEffect, useCallback } from "react"
import {
  Calendar,
  AlertTriangle,
  Users,
  Eye,
  EyeOff,
  Clock,
  RefreshCw,
  Search,
  CheckCircle,
  XCircle,
} from "lucide-react"
import { getSupabaseClient } from "../../lib/supabase"

// טיפוסים
interface Game {
  id: string
  hometeam: string
  awayteam: string
  time: string
  date: string
  league: string
  closingtime: Date
  isfinished?: boolean
  islocked?: boolean
  result?: string
}

interface User {
  id: string
  name: string
  playercode: string
  email?: string
  phone?: string
}

interface Prediction {
  id: string
  userid: string
  gameid: string
  prediction: string
  timestamp: string
}

export default function AdminGameVotingStatus() {
  const [games, setGames] = useState<Game[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [predictions, setPredictions] = useState<Prediction[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split("T")[0])
  const [expandedGames, setExpandedGames] = useState<Record<string, boolean>>({})
  const [lastUpdateTime, setLastUpdateTime] = useState<string>("")
  const [playerFilter, setPlayerFilter] = useState<"all" | "voted" | "not-voted">("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [sortBy, setSortBy] = useState<"name" | "status" | "time">("name")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [error, setError] = useState<string | null>(null)

  // עדכון שעת העדכון האחרונה
  const updateLastUpdateTime = useCallback(() => {
    const now = new Date()
    setLastUpdateTime(
      `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:${String(
        now.getSeconds(),
      ).padStart(2, "0")}`,
    )
  }, [])

  // טעינת משחקים, משתמשים וניחושים
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      setError(null)
      try {
        const supabase = getSupabaseClient()
        if (!supabase) {
          throw new Error("Supabase client is not available")
        }

        // טעינת משחקים
        const { data: gamesData, error: gamesError } = await supabase.from("games").select("*").order("date")
        if (gamesError) {
          throw new Error(`Error fetching games: ${gamesError.message}`)
        }

        // המרת הנתונים למבנה הנכון
        const formattedGames: Game[] = gamesData.map((game) => ({
          id: game.id,
          hometeam: game.hometeam,
          awayteam: game.awayteam,
          time: game.time,
          date: game.date,
          league: game.league,
          closingtime: new Date(game.closingtime),
          isfinished: game.isfinished,
          islocked: game.islocked,
          result: game.result,
        }))
        setGames(formattedGames)

        // טעינת משתמשים
        const { data: usersData, error: usersError } = await supabase
          .from("users")
          .select("id, name, playercode, email, phone")
          .order("name")
        if (usersError) {
          throw new Error(`Error fetching users: ${usersError.message}`)
        }
        setUsers(usersData)

        // טעינת ניחושים
        const { data: predictionsData, error: predictionsError } = await supabase.from("predictions").select("*")
        if (predictionsError) {
          throw new Error(`Error fetching predictions: ${predictionsError.message}`)
        }
        setPredictions(predictionsData)

        updateLastUpdateTime()
      } catch (error) {
        console.error("Error fetching data:", error)
        setError(error instanceof Error ? error.message : "שגיאה בטעינת נתונים")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [updateLastUpdateTime, refreshTrigger])

  // עדכון בזמן אמת
  useEffect(() => {
    if (!autoRefresh) return

    const realTimeUpdateInterval = setInterval(async () => {
      try {
        const supabase = getSupabaseClient()
        if (!supabase) return

        // קבלת הניחושים העדכניים מ-Supabase
        const { data: predictionsData, error: predictionsError } = await supabase.from("predictions").select("*")
        if (predictionsError) {
          console.error("Error fetching predictions:", predictionsError)
          return
        }

        setPredictions(predictionsData)
        updateLastUpdateTime()
      } catch (error) {
        console.error("Error in real-time update:", error)
      }
    }, 10000) // עדכון כל 10 שניות

    return () => clearInterval(realTimeUpdateInterval)
  }, [autoRefresh, updateLastUpdateTime])

  // פונקציה לקבלת משחקים לפי תאריך
  const getGamesByDate = (date: string) => {
    return games.filter((game) => {
      const gameDate = new Date(game.date)
      const formattedDate = `${gameDate.getFullYear()}-${String(gameDate.getMonth() + 1).padStart(2, "0")}-${String(
        gameDate.getDate(),
      ).padStart(2, "0")}`
      return formattedDate === date
    })
  }

  // פונקציה לקבלת שחקנים שהצביעו למשחק מסוים
  const getVotingPlayers = (gameId: string) => {
    const votedUserIds = predictions.filter((pred) => pred.gameid === gameId).map((pred) => pred.userid)

    return users.filter((user) => votedUserIds.includes(user.id))
  }

  // פונקציה לקבלת שחקנים שלא הצביעו למשחק מסוים
  const getNonVotingPlayers = (gameId: string) => {
    const votedUserIds = predictions.filter((pred) => pred.gameid === gameId).map((pred) => pred.userid)

    return users.filter((user) => !votedUserIds.includes(user.id))
  }

  // פונקציה לקבלת הניחוש של שחקן למשחק מסוים
  const getPlayerPrediction = (gameId: string, userId: string) => {
    const prediction = predictions.find((pred) => pred.gameid === gameId && pred.userid === userId)
    return prediction?.prediction || "-"
  }

  // פונקציה לקבלת שעת ההצבעה של שחקן למשחק מסוים
  const getPlayerVotingTime = (gameId: string, userId: string) => {
    const prediction = predictions.find((pred) => pred.gameid === gameId && pred.userid === userId)
    return prediction?.timestamp ? new Date(prediction.timestamp).toLocaleString() : "-"
  }

  // פונקציה להרחבה/צמצום של משחק
  const toggleGameExpansion = (gameId: string) => {
    setExpandedGames((prev) => ({
      ...prev,
      [gameId]: !prev[gameId],
    }))
  }

  // פונקציה לסינון שחקנים לפי סטטוס הצבעה ומונח חיפוש
  const getFilteredPlayers = (gameId: string) => {
    let filteredPlayers: User[] = []

    if (playerFilter === "all") {
      filteredPlayers = users
    } else if (playerFilter === "voted") {
      filteredPlayers = getVotingPlayers(gameId)
    } else {
      filteredPlayers = getNonVotingPlayers(gameId)
    }

    // סינון לפי מונח חיפוש
    if (searchTerm) {
      filteredPlayers = filteredPlayers.filter(
        (player) =>
          player.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          player.playercode.includes(searchTerm) ||
          (player.phone && player.phone.includes(searchTerm)) ||
          (player.email && player.email.toLowerCase().includes(searchTerm.toLowerCase())),
      )
    }

    return filteredPlayers
  }

  // פונקציה למיון שחקנים
  const getSortedPlayers = (gameId: string) => {
    const filteredPlayers = getFilteredPlayers(gameId)

    return [...filteredPlayers].sort((a, b) => {
      if (sortBy === "name") {
        return sortDirection === "asc" ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name)
      } else if (sortBy === "status") {
        const predictionA = predictions.find((pred) => pred.gameid === gameId && pred.userid === a.id)
        const predictionB = predictions.find((pred) => pred.gameid === gameId && pred.userid === b.id)

        const hasVotedA = !!predictionA
        const hasVotedB = !!predictionB

        return sortDirection === "asc"
          ? hasVotedA === hasVotedB
            ? 0
            : hasVotedA
              ? -1
              : 1
          : hasVotedA === hasVotedB
            ? 0
            : hasVotedA
              ? 1
              : -1
      } else if (sortBy === "time") {
        const predictionA = predictions.find((pred) => pred.gameid === gameId && pred.userid === a.id)
        const predictionB = predictions.find((pred) => pred.gameid === gameId && pred.userid === b.id)

        const timeA = predictionA?.timestamp || ""
        const timeB = predictionB?.timestamp || ""

        // שחקנים שלא הצביעו יופיעו בסוף
        if (!timeA && !timeB) return 0
        if (!timeA) return sortDirection === "asc" ? 1 : -1
        if (!timeB) return sortDirection === "asc" ? -1 : 1

        return sortDirection === "asc" ? timeA.localeCompare(timeB) : timeB.localeCompare(timeA)
      }

      return 0
    })
  }

  // פונקציה להחלפת כיוון המיון
  const toggleSortDirection = () => {
    setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"))
  }

  // פונקציה לרענון ידני של הנתונים
  const refreshData = () => {
    setRefreshTrigger((prev) => prev + 1)
  }

  // פונקציה לחישוב אחוז ההצבעה
  const calculateVotingPercentage = (gameId: string) => {
    const totalPlayers = users.length
    const votedPlayers = getVotingPlayers(gameId).length

    if (totalPlayers === 0) return 0
    return Math.round((votedPlayers / totalPlayers) * 100)
  }

  // פונקציה לחישוב התפלגות הניחושים
  const calculatePredictionDistribution = (gameId: string) => {
    const gamePredictions = predictions.filter((pred) => pred.gameid === gameId)
    const total = gamePredictions.length

    if (total === 0) return { "1": 0, X: 0, "2": 0 }

    const counts = gamePredictions.reduce(
      (acc, pred) => {
        acc[pred.prediction] = (acc[pred.prediction] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )

    return {
      "1": Math.round(((counts["1"] || 0) / total) * 100),
      X: Math.round(((counts["X"] || 0) / total) * 100),
      "2": Math.round(((counts["2"] || 0) / total) * 100),
    }
  }

  // פונקציה לשליחת תזכורת לשחקנים שלא הצביעו
  const sendReminder = (gameId: string) => {
    const nonVotingPlayers = getNonVotingPlayers(gameId)
    const game = games.find((g) => g.id === gameId)

    if (!game || nonVotingPlayers.length === 0) return

    alert(`נשלחה תזכורת ל-${nonVotingPlayers.length} שחקנים שטרם הצביעו למשחק ${game.hometeam} נגד ${game.awayteam}`)
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold flex items-center">
          <span>סטטוס הצבעות למשחקים</span>
        </h3>
        <div className="flex items-center space-x-2 rtl:space-x-reverse">
          {lastUpdateTime && (
            <span className="text-sm font-normal text-gray-500 flex items-center">
              <Clock className="w-4 h-4 ml-1" />
              עדכון אחרון: {lastUpdateTime}
            </span>
          )}
          <button
            className="p-2 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 flex items-center"
            onClick={refreshData}
          >
            <RefreshCw className="w-4 h-4 ml-1" />
            רענן
          </button>
          <div className="flex items-center">
            <input
              type="checkbox"
              id="autoRefresh"
              checked={autoRefresh}
              onChange={() => setAutoRefresh(!autoRefresh)}
              className="ml-1"
            />
            <label htmlFor="autoRefresh" className="text-sm">
              עדכון אוטומטי
            </label>
          </div>
        </div>
      </div>

      <div className="mb-6">
        <div className="flex items-center mb-4">
          <Calendar className="w-5 h-5 ml-2 text-gray-500" />
          <span className="text-sm ml-2">סנן לפי תאריך:</span>
          <input
            type="date"
            className="p-2 border border-gray-300 rounded-md ml-2"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
          />
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md flex items-center">
          <AlertTriangle className="w-5 h-5 mr-2 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="text-center py-8">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-navy-600 border-r-transparent"></div>
          <p className="mt-2 text-gray-600">טוען נתונים...</p>
        </div>
      ) : (
        <div className="space-y-6">
          {getGamesByDate(selectedDate).length > 0 ? (
            getGamesByDate(selectedDate).map((game) => {
              const votingPlayers = getVotingPlayers(game.id)
              const nonVotingPlayers = getNonVotingPlayers(game.id)
              const isExpanded = expandedGames[game.id] || false
              const votingPercentage = calculateVotingPercentage(game.id)
              const predictionDistribution = calculatePredictionDistribution(game.id)

              return (
                <div key={game.id} className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="bg-gray-50 p-4 flex justify-between items-center">
                    <div>
                      <h4 className="font-bold text-lg">
                        {game.hometeam} - {game.awayteam}
                      </h4>
                      <p className="text-sm text-gray-600">
                        {game.league} | {game.time} | {new Date(game.date).toLocaleDateString()}
                      </p>
                      <div className="mt-2">
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div
                            className="bg-blue-600 h-2.5 rounded-full"
                            style={{ width: `${votingPercentage}%` }}
                          ></div>
                        </div>
                        <p className="text-sm mt-1">
                          {votingPercentage}% הצביעו ({votingPlayers.length} מתוך {users.length})
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end space-y-2">
                      <div className="flex items-center space-x-2 rtl:space-x-reverse">
                        <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium flex items-center">
                          <Users className="w-4 h-4 ml-1" />
                          {users.length} משתתפים
                        </div>
                        <div
                          className={`px-3 py-1 rounded-full text-sm font-medium flex items-center ${
                            nonVotingPlayers.length > 0 ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"
                          }`}
                        >
                          <AlertTriangle className={`w-4 h-4 ml-1 ${nonVotingPlayers.length > 0 ? "" : "hidden"}`} />
                          {nonVotingPlayers.length} לא הצביעו
                        </div>
                        <button
                          className="p-2 bg-gray-200 rounded-md hover:bg-gray-300"
                          onClick={() => toggleGameExpansion(game.id)}
                        >
                          {isExpanded ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                      {nonVotingPlayers.length > 0 && (
                        <button
                          className="px-3 py-1 bg-orange-100 text-orange-800 rounded-md text-sm hover:bg-orange-200 flex items-center"
                          onClick={() => sendReminder(game.id)}
                        >
                          <AlertTriangle className="w-4 h-4 ml-1" />
                          שלח תזכורת
                        </button>
                      )}
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="p-4">
                      <div className="mb-6">
                        <h5 className="font-bold mb-3">התפלגות ניחושים:</h5>
                        <div className="grid grid-cols-3 gap-4">
                          <div className="bg-blue-50 p-3 rounded-lg text-center">
                            <div className="text-sm text-blue-600 mb-1">ניצחון בית (1)</div>
                            <div className="text-xl font-bold">{predictionDistribution["1"]}%</div>
                            <div className="text-sm text-gray-500">
                              {predictions.filter((p) => p.gameid === game.id && p.prediction === "1").length} הצבעות
                            </div>
                          </div>
                          <div className="bg-gray-50 p-3 rounded-lg text-center">
                            <div className="text-sm text-gray-600 mb-1">תיקו (X)</div>
                            <div className="text-xl font-bold">{predictionDistribution["X"]}%</div>
                            <div className="text-sm text-gray-500">
                              {predictions.filter((p) => p.gameid === game.id && p.prediction === "X").length} הצבעות
                            </div>
                          </div>
                          <div className="bg-green-50 p-3 rounded-lg text-center">
                            <div className="text-sm text-green-600 mb-1">ניצחון חוץ (2)</div>
                            <div className="text-xl font-bold">{predictionDistribution["2"]}%</div>
                            <div className="text-sm text-gray-500">
                              {predictions.filter((p) => p.gameid === game.id && p.prediction === "2").length} הצבעות
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="mb-4">
                        <div className="flex justify-between items-center mb-3">
                          <h5 className="font-bold">פירוט הצבעות:</h5>
                          <div className="flex items-center space-x-2 rtl:space-x-reverse">
                            <div className="relative">
                              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                              <input
                                type="text"
                                placeholder="חיפוש שחקן..."
                                className="pl-3 pr-10 py-1 border border-gray-300 rounded-md text-sm"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                              />
                            </div>
                            <div className="flex items-center">
                              <span className="text-sm ml-2">סנן:</span>
                              <select
                                className="p-1 border border-gray-300 rounded-md text-sm ml-1"
                                value={playerFilter}
                                onChange={(e) => setPlayerFilter(e.target.value as "all" | "voted" | "not-voted")}
                              >
                                <option value="all">כל השחקנים</option>
                                <option value="voted">הצביעו</option>
                                <option value="not-voted">לא הצביעו</option>
                              </select>
                            </div>
                            <div className="flex items-center">
                              <span className="text-sm ml-2">מיון:</span>
                              <select
                                className="p-1 border border-gray-300 rounded-md text-sm ml-1"
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value as "name" | "status" | "time")}
                              >
                                <option value="name">לפי שם</option>
                                <option value="status">לפי סטטוס</option>
                                <option value="time">לפי זמן הצבעה</option>
                              </select>
                              <button
                                className="p-1 border border-gray-300 rounded-md text-sm ml-1"
                                onClick={toggleSortDirection}
                              >
                                {sortDirection === "asc" ? "⬆️" : "⬇️"}
                              </button>
                            </div>
                          </div>
                        </div>
                        <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                              <tr>
                                <th
                                  scope="col"
                                  className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                                >
                                  שם שחקן
                                </th>
                                <th
                                  scope="col"
                                  className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
                                >
                                  סטטוס
                                </th>
                                <th
                                  scope="col"
                                  className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
                                >
                                  ניחוש
                                </th>
                                <th
                                  scope="col"
                                  className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
                                >
                                  שעת הצבעה
                                </th>
                                <th
                                  scope="col"
                                  className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
                                >
                                  פרטי קשר
                                </th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {getSortedPlayers(game.id).map((player) => {
                                const prediction = predictions.find(
                                  (pred) => pred.gameid === game.id && pred.userid === player.id,
                                )
                                const hasVoted = !!prediction

                                return (
                                  <tr key={player.id} className={hasVoted ? "" : "bg-red-50"}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                      {player.name}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                                      <span
                                        className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                          hasVoted ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                                        }`}
                                      >
                                        {hasVoted ? (
                                          <CheckCircle className="w-3 h-3 ml-1" />
                                        ) : (
                                          <XCircle className="w-3 h-3 ml-1" />
                                        )}
                                        {hasVoted ? "הצביע" : "לא הצביע"}
                                      </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center font-bold">
                                      {getPlayerPrediction(game.id, player.id)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-600">
                                      {getPlayerVotingTime(game.id, player.id)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                                      {player.phone && <div>טלפון: {player.phone}</div>}
                                      {player.email && <div>אימייל: {player.email}</div>}
                                    </td>
                                  </tr>
                                )
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )
            })
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
          <li>הנתונים מתעדכנים בזמן אמת כל 10 שניות</li>
          <li>המשחקים נסגרים להצבעות 5 דקות לפני תחילת המשחק</li>
          <li>ניתן לסנן את השחקנים לפי סטטוס ההצבעה</li>
          <li>ניתן למיין את הטבלה לפי שם, סטטוס או זמן הצבעה</li>
          <li>ניתן לשלוח תזכורת לשחקנים שטרם הצביעו</li>
        </ul>
      </div>
    </div>
  )
}
