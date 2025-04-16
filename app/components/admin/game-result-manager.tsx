"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { getSupabaseClient } from "../../lib/supabase"
import { calculatePoints, isSaturdayGame } from "../../lib/point-calculator"
import { Calendar, Save, Download, RefreshCw, CheckCircle, AlertTriangle, FileText, Trash2, Lock } from "lucide-react"

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
  const [currentWeek, setCurrentWeek] = useState(1)

  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [password, setPassword] = useState("")
  const [selectedGameForUpdate, setSelectedGameForUpdate] = useState<string | null>(null)
  const [passwordError, setPasswordError] = useState("")

  // Dummy function for exportPointsSummary
  const exportPointsSummary = async () => {
    alert("Exporting points summary - functionality not yet implemented")
  }

  // טעינת משחקים, ניחושים ומשתמשים
  useEffect(() => {
    const fetchData = async () => {
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

        // טעינת המשחקים השבועיים מטבלת WEEKLY_GAMES
        const { data: weeklyGamesData, error: weeklyGamesError } = await supabase
          .from("weekly_games")
          .select("*")
          .eq("week", currentWeek)

        if (weeklyGamesError) {
          console.error("Error fetching weekly games:", weeklyGamesError)
        }

        // המרת ה-JSONB של טבלת WEEKLY_GAMES לרשימת מזהים
        const gameIds: string[] = []
        if (weeklyGamesData && weeklyGamesData.length > 0) {
          // Use the first entry if multiple exist
          const weeklyGames = weeklyGamesData[0]
          if (weeklyGames && weeklyGames.games) {
            // מעבר על כל הימים ואיסוף מזהי המשחקים
            Object.values(weeklyGames.games).forEach((dayGames: any) => {
              gameIds.push(...dayGames)
            })
          }
        }

        // טעינת רק המשחקים שנמצאים ברשימת המזהים מטבלת WEEKLY_GAMES
        let gamesQuery = supabase.from("games").select("*")

        // אם יש מזהי משחקים, סנן לפיהם
        if (gameIds.length > 0) {
          gamesQuery = gamesQuery.in("id", gameIds)
        } else {
          // אם אין משחקים שבועיים, טען לפי השבוע הנוכחי
          gamesQuery = gamesQuery.eq("week", currentWeek)
        }

        const { data: gamesData, error: gamesError } = await gamesQuery.order("date")

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

    // בדיקה אם המשחק כבר יש לו תוצאה
    const game = games.find((g) => g.id === gameId)
    if (game && game.isfinished && game.result) {
      // אם יש כבר תוצאה, נדרוש סיסמה
      setSelectedGameForUpdate(gameId)
      setShowPasswordModal(true)
      return
    }

    // אם אין תוצאה, נמשיך כרגיל
    await processGameResultUpdate(gameId, result)
  }

  // פונקציה לעיבוד עדכון תוצאת משחק
  const processGameResultUpdate = async (gameId: string, result: string) => {
    setProcessing((prev) => ({ ...prev, [gameId]: true }))
    setError((prev) => ({ ...prev, [gameId]: "" }))
    setSuccess((prev) => ({ ...prev, [gameId]: false }))

    try {
      const supabase = getSupabaseClient()
      if (!supabase) {
        throw new Error("Supabase client is not available")
      }

      // עדכון תוצאת המשחק בטבלת games
      console.log(`Updating game ${gameId} with result: ${result}`)
      const { data: updateData, error: updateError } = await supabase
        .from("games")
        .update({
          result,
          isfinished: true,
          islocked: true, // הוספת שדה נעילה
          updated_at: new Date().toISOString(),
        })
        .eq("id", gameId)
        .select()

      if (updateError) {
        console.error("Error updating game result:", updateError)
        throw new Error(`Error updating game result: ${updateError.message}`)
      } else {
        console.log("Game update successful:", updateData)
      }

      // עדכון תוצאת המשחק בטבלת game_results באמצעות RPC
      console.log(`Updating game result in game_results table for game ${gameId}`)
      try {
        // נשתמש ב-RPC כדי לעקוף את מדיניות אבטחת השורות
        const { data: rpcResult, error: rpcError } = await supabase.rpc("update_game_result", {
          game_id: gameId,
          game_result: result,
          game_week: currentWeek,
          created_by: "admin", // הוספת השדה created_by
        })

        if (rpcError) {
          console.error("Error updating game result via RPC:", rpcError)
          // ננסה שיטה חלופית אם ה-RPC נכשל
          console.log("Trying alternative method to update game result...")

          // בדיקה אם יש כבר תוצאה למשחק זה
          const { data: existingResult, error: checkError } = await supabase
            .from("game_results")
            .select("*")
            .eq("game_id", gameId)
            .maybeSingle()

          if (!checkError && existingResult) {
            // אם יש תוצאה קיימת, ננסה לעדכן אותה
            console.log("Existing result found, trying to update...")
            const { error: updateError } = await supabase.rpc("exec_sql", {
              query: `UPDATE game_results SET result = '${result}', updated_at = NOW(), week = ${currentWeek}, created_by = 'admin' WHERE game_id = '${gameId}'`,
            })

            if (updateError) {
              console.error("Error updating via exec_sql:", updateError)
            } else {
              console.log("Successfully updated game result via exec_sql")
            }
          } else {
            // אם אין תוצאה קיימת, ננסה להוסיף חדשה
            console.log("No existing result, trying to insert...")
            const { error: insertError } = await supabase.rpc("exec_sql", {
              query: `INSERT INTO game_results (game_id, result, created_at, updated_at, week, created_by) 
                      VALUES ('${gameId}', '${result}', NOW(), NOW(), ${currentWeek}, 'admin')`,
            })

            if (insertError) {
              console.error("Error inserting via exec_sql:", insertError)
            } else {
              console.log("Successfully inserted game result via exec_sql")
            }
          }
        } else {
          console.log("Successfully updated game result via RPC:", rpcResult)
        }
      } catch (rpcCatchError) {
        console.error("Exception in RPC call:", rpcCatchError)
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

      // רענון הניחושים לאחר עדכון התוצאה
      try {
        const { data: updatedPredictions, error: predFetchError } = await supabase
          .from("predictions")
          .select("*")
          .eq("gameid", gameId)

        if (predFetchError) {
          console.error("Error fetching updated predictions:", predFetchError)
        } else {
          console.log(`Fetched ${updatedPredictions.length} updated predictions for game ${gameId}`)

          // עדכון הניחושים המקומיים
          setPredictions((prev) => {
            // הסר את הניחושים הישנים למשחק זה
            const filteredPredictions = prev.filter((p) => p.gameid !== gameId)
            // הוסף את הניחושים המעודכנים
            return [...filteredPredictions, ...updatedPredictions]
          })
        }
      } catch (refreshError) {
        console.error("Error refreshing predictions:", refreshError)
      }
    } catch (err) {
      console.error("Error updating game result:", err)
      setError((prev) => ({ ...prev, [gameId]: err instanceof Error ? err.message : "שגיאה לא ידועה" }))
    } finally {
      setProcessing((prev) => ({ ...prev, [gameId]: false }))
    }
  }

  // פונקציה לטיפול בהגשת הסיסמה
  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordError("")

    // בדיקת הסיסמה - "פלוגות5" היא הסיסמה
    if (password === "פלוגות5") {
      // אם הסיסמה נכונה, נמשיך בעדכון התוצאה
      if (selectedGameForUpdate) {
        processGameResultUpdate(selectedGameForUpdate, results[selectedGameForUpdate] || "")
        setShowPasswordModal(false)
        setPassword("")
        setSelectedGameForUpdate(null)
      }
    } else {
      setPasswordError("סיסמה שגויה, נסה שנית")
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
          // קבלת הנקודות הנוכחיות של המשתמש
          const { data: userData, error: userError } = await supabase
            .from("users")
            .select("points, correct_predictions, total_predictions")
            .eq("id", prediction.userid)
            .single()

          if (userError) {
            console.error(`Error fetching user data for user ${prediction.userid}:`, userError)
            continue
          }

          // חישוב הנקודות והניחושים החדשים
          const currentPoints = userData.points || 0
          const currentCorrectPredictions = userData.correct_predictions || 0
          const currentTotalPredictions = userData.total_predictions || 0

          const newPoints = currentPoints + points
          const newCorrectPredictions = currentCorrectPredictions + 1
          const newTotalPredictions = currentTotalPredictions + 1

          console.log(`Updating user ${prediction.userid} points: ${currentPoints} -> ${newPoints}`)

          // עדכון נקודות המשתמש
          const { error: updateError } = await supabase
            .from("users")
            .update({
              points: newPoints,
              correct_predictions: newCorrectPredictions,
              total_predictions: newTotalPredictions,
              updated_at: new Date().toISOString(),
            })
            .eq("id", prediction.userid)

          if (updateError) {
            console.error(`Error updating points for user ${prediction.userid}:`, updateError)
          }
        } else {
          // אם הניחוש לא נכון, רק מעדכנים את total_predictions
          const { data: userData, error: userError } = await supabase
            .from("users")
            .select("total_predictions")
            .eq("id", prediction.userid)
            .single()

          if (userError) {
            console.error(`Error fetching user data for user ${prediction.userid}:`, userError)
            continue
          }

          const currentTotalPredictions = userData.total_predictions || 0
          const newTotalPredictions = currentTotalPredictions + 1

          // עדכון סך הניחושים של המשתמש
          const { error: updateError } = await supabase
            .from("users")
            .update({
              total_predictions: newTotalPredictions,
              updated_at: new Date().toISOString(),
            })
            .eq("id", prediction.userid)

          if (updateError) {
            console.error(`Error updating total predictions for user ${prediction.userid}:`, updateError)
          }
        }

        // עדכון הניחוש עם הנקודות שהתקבלו
        console.log(`Updating prediction ${prediction.id} with ${points} points`)
        const { error: predictionError } = await supabase
          .from("predictions")
          .update({
            points: points,
            updated_at: new Date().toISOString(),
          })
          .eq("id", prediction.id)

        if (predictionError) {
          console.error(`Error updating prediction ${prediction.id}:`, predictionError)
          console.error("Error details:", predictionError)
        } else {
          console.log(`Successfully updated prediction ${prediction.id} with ${points} points`)
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

  // פונקציה לבדיקה אם המשחק נעול לעריכה
  const isGameLocked = (game: Game) => {
    // משחק נעול אם יש לו תוצאה והוא הסתיים
    return game.isfinished && game.result
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold flex items-center">
          <span>ניהול תוצאות משחקים</span>
          {/* הוספת תצוגת השבוע הנוכחי */}
          <span className="ml-2 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">שבוע {currentWeek}</span>
        </h3>
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
                        className={`border border-gray-300 rounded-md px-3 py-2 w-24 ${
                          isGameLocked(game) ? "bg-gray-100" : ""
                        }`}
                        value={results[game.id] || ""}
                        onChange={(e) => setResults((prev) => ({ ...prev, [game.id]: e.target.value }))}
                        placeholder="1, X, 2"
                        disabled={isGameLocked(game) && !showPasswordModal}
                      />
                      <button
                        className={`ml-2 px-4 py-2 rounded-md text-white flex items-center ${
                          processing[game.id]
                            ? "bg-gray-400 cursor-not-allowed"
                            : isGameLocked(game)
                              ? "bg-gray-500 hover:bg-gray-600"
                              : "bg-navy-600 hover:bg-navy-700"
                        }`}
                        onClick={() => updateGameResult(game.id, results[game.id] || "")}
                        disabled={processing[game.id]}
                      >
                        {processing[game.id] ? (
                          <RefreshCw className="w-4 h-4 ml-1 animate-spin" />
                        ) : isGameLocked(game) ? (
                          <Lock className="w-4 h-4 ml-1" />
                        ) : (
                          <Save className="w-4 h-4 ml-1" />
                        )}
                        {isGameLocked(game) ? "נעול לעריכה" : "עדכן תוצאה"}
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
          <li>ניחוש נכון מזכה ב-3 נקודות</li>
          <li>ניחוש נכון במשחק של יום שבת מזכה ב-6 נקודות</li>
          <li>לאחר עדכון התוצאה, לא ניתן לשנות אותה ללא סיסמת מנהל</li>
          <li>ניתן לייצא את רשימת הניחושים של כל משחק לקובץ CSV</li>
          <li>ניתן לייצא סיכום נקודות של כל המשתמשים</li>
        </ul>
      </div>

      {/* מודאל הזנת סיסמה */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full">
            <h3 className="text-lg font-bold mb-4">אימות סיסמה</h3>
            <p className="mb-4">המשחק כבר יש לו תוצאה. יש להזין סיסמת מנהל כדי לעדכן את התוצאה.</p>

            {passwordError && (
              <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md flex items-center">
                <AlertTriangle className="w-5 h-5 mr-2 flex-shrink-0" />
                <span>{passwordError}</span>
              </div>
            )}

            <form onSubmit={handlePasswordSubmit}>
              <div className="mb-4">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  סיסמה
                </label>
                <input
                  type="password"
                  id="password"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoFocus
                />
              </div>

              <div className="flex justify-end space-x-2 rtl:space-x-reverse">
                <button
                  type="button"
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
                  onClick={() => {
                    setShowPasswordModal(false)
                    setPassword("")
                    setSelectedGameForUpdate(null)
                    setPasswordError("")
                  }}
                >
                  ביטול
                </button>
                <button type="submit" className="px-4 py-2 bg-navy-600 text-white rounded-md hover:bg-navy-700">
                  אישור
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
