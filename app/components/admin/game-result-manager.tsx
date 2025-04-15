"use client"

import { useState, useEffect } from "react"
import { getSupabaseClient } from "../../lib/supabase"
import { calculatePoints, isSaturdayGame } from "../../lib/point-calculator"
import { Calendar, Save, Download, RefreshCw, CheckCircle, AlertTriangle, FileText, Trash2 } from "lucide-react"

interface Game {
  id: string
  hometeam: string
  awayteam: string
  time: string
  date: string
  league: string
  isfinished?: boolean
  result?: string
}

interface Prediction {
  id: string
  userid: string
  gameid: string
  prediction: string
  timestamp: string
}

interface User {
  id: string
  name: string
  playercode: string
  points: number
}

export default function GameResultManager() {
  const [games, setGames] = useState<Game[]>([])
  const [predictions, setPredictions] = useState<Prediction[]>([])
  const [users, setUsers] = useState<Record<string, User>>({})
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split("T")[0])
  const [results, setResults] = useState<Record<string, string>>({})
  const [processing, setProcessing] = useState<Record<string, boolean>>({})
  const [success, setSuccess] = useState<Record<string, boolean>>({})
  const [error, setError] = useState<Record<string, string>>({})
  const [exportLoading, setExportLoading] = useState<Record<string, boolean>>({})

  // טעינת משחקים, ניחושים ומשתמשים
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
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
        setGames(gamesData || [])

        // טעינת ניחושים
        const { data: predictionsData, error: predictionsError } = await supabase.from("predictions").select("*")
        if (predictionsError) {
          throw new Error(`Error fetching predictions: ${predictionsError.message}`)
        }
        setPredictions(predictionsData || [])

        // טעינת משתמשים
        const { data: usersData, error: usersError } = await supabase.from("users").select("*")
        if (usersError) {
          throw new Error(`Error fetching users: ${usersError.message}`)
        }

        // המרת מערך המשתמשים למבנה מפתח-ערך לגישה מהירה
        const usersMap: Record<string, User> = {}
        usersData?.forEach((user) => {
          usersMap[user.id] = user
        })
        setUsers(usersMap)

        // אתחול מצב התוצאות
        const resultsMap: Record<string, string> = {}
        gamesData?.forEach((game) => {
          if (game.result) {
            resultsMap[game.id] = game.result
          }
        })
        setResults(resultsMap)
      } catch (error) {
        console.error("Error fetching data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  // פונקציה לקבלת משחקים לפי תאריך
  const getGamesByDate = (date: string) => {
    return games.filter((game) => {
      const gameDate = new Date(game.date)
      const formattedDate = `${gameDate.getFullYear()}-${String(gameDate.getMonth() + 1).padStart(2, "0")}-${String(gameDate.getDate()).padStart(2, "0")}`
      return formattedDate === date
    })
  }

  // פונקציה לעדכון תוצאת משחק
  const updateGameResult = async (gameId: string, result: string) => {
    if (!result.trim()) {
      setError((prev) => ({ ...prev, [gameId]: "יש להזין תוצאה" }))
      return
    }

    setProcessing((prev) => ({ ...prev, [gameId]: true }))
    setError((prev) => ({ ...prev, [gameId]: "" }))
    setSuccess((prev) => ({ ...prev, [gameId]: false }))

    try {
      const supabase = getSupabaseClient()
      if (!supabase) {
        throw new Error("Supabase client is not available")
      }

      // עדכון תוצאת המשחק
      const { error: updateError } = await supabase
        .from("games")
        .update({
          result,
          isfinished: true,
        })
        .eq("id", gameId)

      if (updateError) {
        throw new Error(`Error updating game result: ${updateError.message}`)
      }

      // חישוב וחלוקת נקודות
      await calculateAndDistributePoints(gameId, result)

      // עדכון המצב המקומי
      setGames((prev) => prev.map((game) => (game.id === gameId ? { ...game, result, isfinished: true } : game)))
      setSuccess((prev) => ({ ...prev, [gameId]: true }))

      // עדכון מצב התוצאות
      setResults((prev) => ({ ...prev, [gameId]: result }))

      // הסרת הודעת ההצלחה אחרי 3 שניות
      setTimeout(() => {
        setSuccess((prev) => ({ ...prev, [gameId]: false }))
      }, 3000)
    } catch (err) {
      console.error("Error updating game result:", err)
      setError((prev) => ({ ...prev, [gameId]: err instanceof Error ? err.message : "שגיאה לא ידועה" }))
    } finally {
      setProcessing((prev) => ({ ...prev, [gameId]: false }))
    }
  }

  // פונקציה לחישוב וחלוקת נקודות
  const calculateAndDistributePoints = async (gameId: string, result: string) => {
    try {
      const supabase = getSupabaseClient()
      if (!supabase) {
        throw new Error("Supabase client is not available")
      }

      // קבלת המשחק
      const game = games.find((g) => g.id === gameId)
      if (!game) {
        throw new Error("Game not found")
      }

      // בדיקה אם המשחק הוא ביום שבת
      const gameDate = new Date(game.date)
      const isSaturday = isSaturdayGame(gameDate)

      // קבלת כל הניחושים למשחק זה
      const gamePredictions = predictions.filter((p) => p.gameid === gameId)

      // עדכון נקודות לכל משתמש
      for (const prediction of gamePredictions) {
        // חישוב הנקודות
        const points = calculatePoints(prediction.prediction, result, isSaturday)

        if (points > 0) {
          // עדכון נקודות המשתמש
          const { error: updateError } = await supabase
            .from("users")
            .update({
              points: supabase.rpc("increment_points", { user_id: prediction.userid, points_to_add: points }),
              correct_predictions: supabase.rpc("increment_correct_predictions", { user_id: prediction.userid }),
            })
            .eq("id", prediction.userid)

          if (updateError) {
            console.error(`Error updating points for user ${prediction.userid}:`, updateError)
          }
        }

        // עדכון הניחוש עם הנקודות שהתקבלו
        const { error: predictionError } = await supabase.from("predictions").update({ points }).eq("id", prediction.id)

        if (predictionError) {
          console.error(`Error updating prediction ${prediction.id}:`, predictionError)
        }
      }

      return true
    } catch (error) {
      console.error("Error calculating and distributing points:", error)
      throw error
    }
  }

  // פונקציה לייצוא נתוני הצבעות למשחק
  const exportGamePredictions = async (gameId: string) => {
    setExportLoading((prev) => ({ ...prev, [gameId]: true }))

    try {
      const game = games.find((g) => g.id === gameId)
      if (!game) {
        throw new Error("Game not found")
      }

      // קבלת כל הניחושים למשחק זה
      const gamePredictions = predictions.filter((p) => p.gameid === gameId)

      // הכנת נתוני הייצוא
      const exportData = await Promise.all(
        gamePredictions.map(async (prediction) => {
          const user = users[prediction.userid]
          const userName = user ? user.name : "משתמש לא ידוע"
          const userCode = user ? user.playercode : "קוד לא ידוע"

          // חישוב הנקודות
          const gameDate = new Date(game.date)
          const isSaturday = isSaturdayGame(gameDate)
          const points = game.result ? calculatePoints(prediction.prediction, game.result, isSaturday) : 0
          const isCorrect = game.result ? prediction.prediction === game.result : false

          return {
            userName,
            userCode,
            prediction: prediction.prediction,
            timestamp: new Date(prediction.timestamp).toLocaleString(),
            isCorrect,
            points,
          }
        }),
      )

      // יצירת תוכן ה-CSV
      const headers = ["שם משתמש", "קוד שחקן", "ניחוש", "זמן הגשה", "ניחוש נכון", "נקודות"]
      const csvContent = [
        headers.join(","),
        ...exportData.map((row) =>
          [
            `"${row.userName}"`,
            row.userCode,
            row.prediction,
            `"${row.timestamp}"`,
            row.isCorrect ? "כן" : "לא",
            row.points,
          ].join(","),
        ),
      ].join("\n")

      // יצירת קובץ CSV והורדתו
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.setAttribute("href", url)
      link.setAttribute("download", `predictions_${game.hometeam}_vs_${game.awayteam}.csv`)
      link.style.visibility = "hidden"
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (error) {
      console.error("Error exporting game predictions:", error)
    } finally {
      setExportLoading((prev) => ({ ...prev, [gameId]: false }))
    }
  }

  // פונקציה לייצוא סיכום נקודות של כל המשתמשים
  const exportPointsSummary = async () => {
    try {
      const supabase = getSupabaseClient()
      if (!supabase) {
        throw new Error("Supabase client is not available")
      }

      // קבלת כל המשתמשים עם הנקודות שלהם
      const { data: usersData, error: usersError } = await supabase
        .from("users")
        .select("*")
        .order("points", { ascending: false })

      if (usersError) {
        throw new Error(`Error fetching users: ${usersError.message}`)
      }

      // הכנת נתוני הייצוא
      const exportData = usersData.map((user) => ({
        name: user.name,
        playerCode: user.playercode,
        points: user.points || 0,
        correctPredictions: user.correct_predictions || 0,
        totalPredictions: user.total_predictions || 0,
        successRate:
          user.total_predictions > 0
            ? ((user.correct_predictions / user.total_predictions) * 100).toFixed(1) + "%"
            : "0%",
      }))

      // יצירת תוכן ה-CSV
      const headers = ["שם משתמש", "קוד שחקן", "נקודות", "ניחושים נכונים", 'סה"כ ניחושים', "אחוז הצלחה"]
      const csvContent = [
        headers.join(","),
        ...exportData.map((row) =>
          [
            `"${row.name}"`,
            row.playerCode,
            row.points,
            row.correctPredictions,
            row.totalPredictions,
            row.successRate,
          ].join(","),
        ),
      ].join("\n")

      // יצירת קובץ CSV והורדתו
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.setAttribute("href", url)
      link.setAttribute("download", `points_summary_${new Date().toISOString().split("T")[0]}.csv`)
      link.style.visibility = "hidden"
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (error) {
      console.error("Error exporting points summary:", error)
    }
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold">ניהול תוצאות משחקים</h3>
        <button
          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center"
          onClick={exportPointsSummary}
        >
          <FileText className="w-4 h-4 ml-2" />
          ייצוא סיכום נקודות
        </button>
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

      {loading ? (
        <div className="text-center py-8">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-navy-600 border-r-transparent"></div>
          <p className="mt-2 text-gray-600">טוען נתונים...</p>
        </div>
      ) : (
        <div className="space-y-6">
          {getGamesByDate(selectedDate).length > 0 ? (
            getGamesByDate(selectedDate).map((game) => (
              <div key={game.id} className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="bg-gray-50 p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-bold text-lg">
                        {game.hometeam} - {game.awayteam}
                      </h4>
                      <p className="text-sm text-gray-600">
                        {game.league} | {game.time} | {new Date(game.date).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2 rtl:space-x-reverse">
                      <div
                        className={`px-3 py-1 rounded-full text-sm font-medium ${
                          game.isfinished ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {game.isfinished ? "הסתיים" : "טרם הסתיים"}
                      </div>
                      {game.isfinished && game.result && (
                        <div className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                          תוצאה: {game.result}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="p-4">
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">תוצאה (1, X, 2)</label>
                    <div className="flex items-center">
                      <input
                        type="text"
                        className="border border-gray-300 rounded-md px-3 py-2 w-24"
                        value={results[game.id] || ""}
                        onChange={(e) => setResults((prev) => ({ ...prev, [game.id]: e.target.value }))}
                        placeholder="1, X, 2"
                      />
                      <button
                        className={`ml-2 px-4 py-2 rounded-md text-white flex items-center ${
                          processing[game.id] ? "bg-gray-400 cursor-not-allowed" : "bg-navy-600 hover:bg-navy-700"
                        }`}
                        onClick={() => updateGameResult(game.id, results[game.id] || "")}
                        disabled={processing[game.id]}
                      >
                        {processing[game.id] ? (
                          <RefreshCw className="w-4 h-4 ml-1 animate-spin" />
                        ) : (
                          <Save className="w-4 h-4 ml-1" />
                        )}
                        עדכן תוצאה
                      </button>
                      <button
                        className={`ml-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center ${
                          exportLoading[game.id] ? "opacity-50 cursor-not-allowed" : ""
                        }`}
                        onClick={() => exportGamePredictions(game.id)}
                        disabled={exportLoading[game.id]}
                      >
                        {exportLoading[game.id] ? (
                          <RefreshCw className="w-4 h-4 ml-1 animate-spin" />
                        ) : (
                          <Download className="w-4 h-4 ml-1" />
                        )}
                        ייצוא ניחושים
                      </button>
                      <button
                        className={`ml-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 flex items-center ${
                          processing[game.id] ? "opacity-50 cursor-not-allowed" : ""
                        }`}
                        onClick={() => {
                          if (confirm("האם אתה בטוח שברצונך למחוק משחק זה? פעולה זו אינה הפיכה!")) {
                            const supabase = getSupabaseClient()
                            if (supabase) {
                              supabase
                                .from("games")
                                .delete()
                                .eq("id", game.id)
                                .then(({ error }) => {
                                  if (error) {
                                    alert(`שגיאה במחיקת המשחק: ${error.message}`)
                                  } else {
                                    alert("המשחק נמחק בהצלחה")
                                    // רענון הדף לאחר מחיקה
                                    window.location.reload()
                                  }
                                })
                            }
                          }
                        }}
                        disabled={processing[game.id]}
                      >
                        <Trash2 className="w-4 h-4 ml-1" />
                        מחק משחק
                      </button>
                    </div>
                    {error[game.id] && (
                      <div className="mt-2 text-red-600 text-sm flex items-center">
                        <AlertTriangle className="w-4 h-4 ml-1" />
                        {error[game.id]}
                      </div>
                    )}
                    {success[game.id] && (
                      <div className="mt-2 text-green-600 text-sm flex items-center">
                        <CheckCircle className="w-4 h-4 ml-1" />
                        התוצאה עודכנה בהצלחה והנקודות חולקו
                      </div>
                    )}
                  </div>

                  <div className="mt-4 bg-gray-50 p-3 rounded-md">
                    <h5 className="font-medium mb-2">סטטיסטיקת ניחושים:</h5>
                    <div className="grid grid-cols-3 gap-4">
                      {["1", "X", "2"].map((option) => {
                        const count = predictions.filter((p) => p.gameid === game.id && p.prediction === option).length
                        const total = predictions.filter((p) => p.gameid === game.id).length
                        const percentage = total > 0 ? Math.round((count / total) * 100) : 0

                        return (
                          <div key={option} className="bg-white p-3 rounded-lg shadow-sm">
                            <div className="text-center font-bold">{option}</div>
                            <div className="text-center text-2xl">{percentage}%</div>
                            <div className="text-center text-sm text-gray-500">{count} ניחושים</div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              </div>
            ))
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
          <li>עדכון תוצאת משחק יחשב אוטומטית את הנקודות לכל המשתמשים</li>
          <li>ניחוש נכון מזכה ב-1 נקודה</li>
          <li>ניחוש נכון במשחק של יום שבת מזכה ב-2 נקודות</li>
          <li>ניתן לייצא את רשימת הניחושים של כל משחק לקובץ CSV</li>
          <li>ניתן לייצא סיכום נקודות של כל המשתמשים</li>
        </ul>
      </div>
    </div>
  )
}
