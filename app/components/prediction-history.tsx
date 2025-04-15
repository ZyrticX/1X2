"use client"

import { Calendar, Check, X } from "lucide-react"
import { useState, useEffect } from "react"
import { useAuth } from "../contexts/auth-context"
import { getSupabaseClient, isSupabaseAvailable } from "../lib/supabase"

// Types for game result
interface GameResult {
  id: string
  homeTeam: string
  awayTeam: string
  prediction: string
  result: string
  correct: boolean
}

// Type for prediction day
interface PredictionDay {
  id: string
  date: string
  games: GameResult[]
  points: number
}

export default function PredictionHistory() {
  const [predictionHistory, setPredictionHistory] = useState<PredictionDay[]>([])
  const [loading, setLoading] = useState(true)
  const { userIdentifier } = useAuth()

  useEffect(() => {
    const fetchPredictionHistory = async () => {
      if (!userIdentifier || !isSupabaseAvailable()) {
        setLoading(false)
        return
      }

      setLoading(true)
      try {
        const supabase = getSupabaseClient()
        if (!supabase) {
          console.error("Supabase client is not available")
          setLoading(false)
          return
        }

        console.log("Fetching predictions for user with playercode:", userIdentifier)

        // First, find the user by playercode to get their UUID
        const { data: userData, error: userError } = await supabase
          .from("users")
          .select("id")
          .eq("playercode", userIdentifier)
          .limit(1)

        if (userError) {
          console.error("Error finding user by playercode:", userError)
          setLoading(false)
          return
        }

        if (!userData || userData.length === 0) {
          console.log("No user found with playercode:", userIdentifier)
          setLoading(false)
          return
        }

        const userId = userData[0].id
        console.log("Found user with ID:", userId)

        // Now get user predictions using the correct UUID
        const { data: predictions, error: predError } = await supabase
          .from("predictions")
          .select("*")
          .eq("userid", userId)
          .order("timestamp", { ascending: false })

        if (predError) {
          console.error("Error fetching predictions:", predError)
          setLoading(false)
          return
        }

        // Get game results
        const { data: results, error: resultsError } = await supabase.from("game_results").select("*")

        if (resultsError) {
          console.error("Error fetching game results:", resultsError)
          setLoading(false)
          return
        }

        // Create a map of game results
        const resultsMap: Record<string, string> = {}
        results?.forEach((result) => {
          resultsMap[result.game_id] = result.result
        })

        // Get games
        const { data: games, error: gamesError } = await supabase.from("games").select("*")

        if (gamesError) {
          console.error("Error fetching games:", gamesError)
          setLoading(false)
          return
        }

        // Create a map of games
        const gamesMap: Record<string, any> = {}
        games?.forEach((game) => {
          gamesMap[game.id] = {
            homeTeam: game.hometeam,
            awayTeam: game.awayteam,
            date: game.date,
          }
        })

        // Organize data by date
        const predictionsByDate: Record<string, PredictionDay> = {}

        predictions?.forEach((pred) => {
          const gameId = pred.gameid
          const gameData = gamesMap[gameId]

          if (!gameData) return

          const gameDate = new Date(gameData.date).toISOString().split("T")[0]
          const result = resultsMap[gameId]

          if (!predictionsByDate[gameDate]) {
            predictionsByDate[gameDate] = {
              id: gameDate,
              date: gameDate,
              games: [],
              points: 0,
            }
          }

          if (result) {
            const correct = pred.prediction === result
            const points = correct ? 3 : 0

            predictionsByDate[gameDate].games.push({
              id: gameId,
              homeTeam: gameData.homeTeam,
              awayTeam: gameData.awayTeam,
              prediction: pred.prediction,
              result: result,
              correct: correct,
            })

            predictionsByDate[gameDate].points += points
          }
        })

        // Convert to array and sort by date
        const historyArray = Object.values(predictionsByDate).sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
        )

        setPredictionHistory(historyArray)
      } catch (error) {
        console.error("Error fetching prediction history:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchPredictionHistory()
  }, [userIdentifier])

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-4">
        <div className="text-center py-8">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-navy-600 border-r-transparent"></div>
          <p className="mt-2 text-gray-600">טוען היסטוריית ניחושים...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h2 className="text-xl font-bold mb-4 flex items-center">
        <Calendar className="w-5 h-5 mr-2" />
        תוצאות
      </h2>

      {predictionHistory.length > 0 ? (
        <div className="space-y-6">
          {predictionHistory.map((day) => (
            <div key={day.id} className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="bg-blue-50 p-3 border-b border-blue-100 flex justify-between items-center">
                <div className="font-bold">
                  {new Date(day.date).toLocaleDateString("he-IL", { year: "numeric", month: "long", day: "numeric" })}
                </div>
                <div className="flex items-center">
                  <span className="font-bold text-blue-600">{isNaN(day.points) ? "0" : day.points} נקודות</span>
                </div>
              </div>
              <div className="divide-y">
                {day.games.map((game) => (
                  <div key={game.id} className={`p-3 flex items-center ${game.correct ? "bg-green-50" : "bg-red-50"}`}>
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${
                        game.correct ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"
                      }`}
                    >
                      {game.correct ? <Check className="w-5 h-5" /> : <X className="w-5 h-5" />}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-center">
                        <div className="text-right font-medium">{game.homeTeam}</div>
                        <div className="mx-4 text-gray-400">vs</div>
                        <div className="text-left font-medium">{game.awayTeam}</div>
                      </div>
                    </div>
                    <div className="ml-4 flex items-center space-x-3 rtl:space-x-reverse">
                      <div className="text-sm">
                        <span className="text-gray-500">ניחוש: </span>
                        <span className={`font-medium ${game.correct ? "text-green-600" : "text-red-600"}`}>
                          {game.prediction}
                        </span>
                      </div>
                      <div className="text-sm">
                        <span className="text-gray-500">תוצאה: </span>
                        <span className="font-medium">{game.result}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white p-6 rounded-lg shadow-md text-center">
          <p className="text-gray-600">אין היסטוריית ניחושים זמינה</p>
        </div>
      )}
    </div>
  )
}
