"use client"

import { useState, useEffect } from "react"
import { getSupabaseClient } from "../../lib/supabase"
import type { Prediction, Game } from "../types"
import { RefreshCw } from "lucide-react"

interface UserPredictionsProps {
  userId: string
  games: Game[]
}

export default function UserPredictions({ userId, games }: UserPredictionsProps) {
  const [predictions, setPredictions] = useState<Prediction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchUserPredictions = async () => {
      setLoading(true)
      setError(null)

      try {
        const supabase = getSupabaseClient()
        if (!supabase) {
          throw new Error("Supabase client is not available")
        }

        const { data, error } = await supabase.rpc("get_user_predictions", {
          user_id: userId,
        })

        if (error) {
          throw new Error(`Error fetching user predictions: ${error.message}`)
        }

        setPredictions(data || [])
      } catch (err) {
        console.error("Error fetching user predictions:", err)
        setError(err instanceof Error ? err.message : "שגיאה לא ידועה")
      } finally {
        setLoading(false)
      }
    }

    fetchUserPredictions()
  }, [userId])

  // Get game details by ID
  const getGameDetails = (gameId: string) => {
    const game = games.find((g) => g.id === gameId)
    return game
      ? {
          name: `${game.hometeam} נגד ${game.awayteam}`,
          result: game.result || "-",
          isFinished: game.isfinished,
        }
      : { name: "משחק לא ידוע", result: "-", isFinished: false }
  }

  return (
    <div className="mt-4">
      <h3 className="text-lg font-bold mb-2">ניחושים של המשתמש</h3>

      {loading ? (
        <div className="flex justify-center items-center h-32">
          <RefreshCw className="w-6 h-6 animate-spin text-navy-600" />
        </div>
      ) : error ? (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <p>{error}</p>
        </div>
      ) : predictions.length === 0 ? (
        <div className="bg-gray-100 p-4 rounded text-center">
          <p>אין ניחושים למשתמש זה</p>
        </div>
      ) : (
        <div className="overflow-x-auto bg-white shadow rounded-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  משחק
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ניחוש
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  תוצאה בפועל
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  נקודות
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  זמן הגשה
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {predictions.map((prediction) => {
                const gameDetails = getGameDetails(prediction.gameid)
                return (
                  <tr key={prediction.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{gameDetails.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                        {prediction.prediction}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {gameDetails.isFinished ? (
                        <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          {gameDetails.result}
                        </span>
                      ) : (
                        <span className="text-gray-500">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {isNaN(Number(prediction.points)) ? "0" : String(prediction.points || 0)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {prediction.timestamp ? new Date(prediction.timestamp).toLocaleString() : "-"}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
