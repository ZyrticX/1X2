"use client"

import { useState, useEffect } from "react"
import { Trophy, Calendar } from "lucide-react"
import type { User } from "../lib/mockDataService"
// הוסף את הייבוא בראש הקובץ
import { getSupabaseClient } from "../lib/supabase"

// שנה את מערך mockUsers להיות ריק
const mockUsers: User[] = []

export default function Leaderboard() {
  const [timeFilter, setTimeFilter] = useState<"all" | "weekly" | "monthly">("all")
  const [leaderboardData, setLeaderboardData] = useState<User[]>(mockUsers)
  const [loading, setLoading] = useState(false)

  // עדכן את useEffect כדי לטעון רק משתמשים מהשרת
  useEffect(() => {
    const fetchLeaderboard = async () => {
      setLoading(true)
      try {
        // נסה לטעון את הנתונים מהשירות, אם זמין
        if (typeof window !== "undefined") {
          try {
            // טען את הנתונים מ-Supabase
            const supabase = getSupabaseClient()
            if (supabase) {
              const { data, error } = await supabase.from("users").select("*").order("points", { ascending: false })

              if (error) {
                console.error("Error fetching leaderboard from Supabase:", error)
                throw error
              }

              // המר את הנתונים למבנה הנכון
              const formattedData = data.map((user) => ({
                id: user.id,
                name: user.name,
                points: user.points || 0,
                correctPredictions: user.correct_predictions || 0,
                totalPredictions: user.total_predictions || 0,
                lastWeekPoints: user.last_week_points || 0,
                trend: user.trend || "same",
                successRate: user.success_rate || 0,
              }))

              setLeaderboardData(formattedData)
            } else {
              // אם Supabase לא זמין, נסה לטעון מהשירות המקומי
              const { getLeaderboard } = await import("../lib/mockDataService")
              const data = await getLeaderboard("weekly")
              setLeaderboardData(data)
            }
          } catch (error) {
            console.error("Error importing or using getLeaderboard:", error)
            // השתמש בנתוני ברירת מחדל אם יש בעיה
            setLeaderboardData(mockUsers)
          }
        }
      } catch (error) {
        console.error("Error fetching leaderboard:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchLeaderboard()
  }, [])

  // מיון הנתונים לפי נקודות
  const sortedData = [...leaderboardData].sort((a, b) => b.points - a.points)

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="bg-white text-gray-800 p-6 rounded-lg shadow-md mb-8 border border-gray-200">
        <h2 className="text-2xl font-bold mb-6 flex items-center text-navy-600">
          <Trophy className="w-6 h-6 mr-2" />
          טבלת דירוג שבועית
        </h2>
        <p className="text-sm text-gray-500 mb-4">טבלת הדירוג לשבוע הנוכחי - מתאפסת בתחילת כל שבוע</p>

        {/* טבלת דירוג */}
        {loading ? (
          <div className="text-center py-8">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-navy-600 border-r-transparent"></div>
            <p className="mt-2 text-gray-600">טוען נתונים...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            {/* גרסת מובייל - כרטיסים */}
            <div className="md:hidden space-y-4">
              {sortedData.map((player, index) => {
                const isTopPlayer = index === 0 || index === 1 // שני המקומות הראשונים

                return (
                  <div
                    key={player.id}
                    className={`p-4 rounded-lg border ${
                      isTopPlayer ? "bg-yellow-50 border-yellow-200" : "bg-white border-gray-200"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center">
                        {isTopPlayer && (
                          <div className="w-6 h-6 bg-yellow-500 text-white rounded-full flex items-center justify-center mr-2">
                            <Trophy className="w-3 h-3" />
                          </div>
                        )}
                        <span className={`font-bold text-lg ${isTopPlayer ? "text-yellow-800" : ""}`}>
                          {index + 1}. {player.name}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-sm">
                      <div className="bg-gray-50 p-2 rounded">
                        <div className="text-gray-500">נקודות</div>
                        <div className="font-bold text-lg">{player.points}</div>
                      </div>
                      <div className="bg-gray-50 p-2 rounded">
                        <div className="text-gray-500">ניחושים נכונים</div>
                        <div className="font-bold">
                          {player.correctPredictions}/{player.totalPredictions}
                        </div>
                      </div>
                      <div className="bg-gray-50 p-2 rounded">
                        <div className="text-gray-500">אחוז הצלחה</div>
                        <div className="font-bold">{player.successRate?.toFixed(1)}%</div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* גרסת דסקטופ - טבלה */}
            <table className="w-full border-collapse hidden md:table">
              <thead>
                <tr className="bg-gray-100 text-gray-700">
                  <th className="px-4 py-3 text-right">#</th>
                  <th className="px-4 py-3 text-right">שם</th>
                  <th className="px-4 py-3 text-center">נקודות</th>
                  <th className="px-4 py-3 text-center">ניחושים נכונים</th>
                  <th className="px-4 py-3 text-center">אחוז הצלחה</th>
                </tr>
              </thead>
              <tbody>
                {sortedData.map((player, index) => {
                  const successRate = player.successRate?.toFixed(1) || "0.0"
                  const isTopPlayer = index === 0 || index === 1 // שני המקומות הראשונים

                  return (
                    <tr
                      key={player.id}
                      className={`border-b border-gray-200 ${isTopPlayer ? "bg-yellow-50" : ""} hover:bg-gray-50 transition duration-150`}
                    >
                      <td className="px-4 py-3 text-right">
                        {isTopPlayer ? (
                          <div className="inline-flex items-center justify-center w-6 h-6 bg-yellow-500 text-white rounded-full">
                            <Trophy className="w-3 h-3" />
                          </div>
                        ) : (
                          <span>{index + 1}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right font-medium">{player.name}</td>
                      <td className="px-4 py-3 text-center font-bold">{player.points}</td>
                      <td className="px-4 py-3 text-center">
                        {player.correctPredictions}/{player.totalPredictions}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {isNaN(Number(player.successRate)) ? "0.0%" : `${(player.successRate || 0).toFixed(1)}%`}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* הסבר */}
        <div className="mt-6 text-sm text-gray-500 bg-gray-50 p-4 rounded-md">
          <div className="flex items-center mb-2">
            <Calendar className="w-4 h-4 mr-2" />
            <span className="font-medium">הסבר חישוב נקודות:</span>
          </div>
          <ul className="list-disc list-inside space-y-1 mr-6">
            <li>ניחוש נכון: 1 נקודה</li>
            <li>משחקי יום שבת: 2 נקודות לניחוש נכון</li>
            <li>הטבלה מתעדכנת בזמן אמת לאחר כל משחק</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
