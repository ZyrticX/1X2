"use client"

import { useState, useEffect } from "react"
import { Trophy, Calendar, Filter } from "lucide-react"
import { getLeaderboard, type User } from "../lib/dataService"

export default function Leaderboard() {
  const [timeFilter, setTimeFilter] = useState<"all" | "weekly" | "monthly">("all")
  const [sortBy, setSortBy] = useState<"points" | "successRate">("points")
  const [leaderboardData, setLeaderboardData] = useState<User[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setLoading(true)
      try {
        const data = await getLeaderboard(timeFilter)
        setLeaderboardData(data)
      } catch (error) {
        console.error("Error fetching leaderboard:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchLeaderboard()
  }, [timeFilter])

  // פונקציה למיון הנתונים לפי הפילטר הנבחר
  const getSortedData = () => {
    const data = [...leaderboardData]

    // מיון לפי הפילטר הנבחר
    if (sortBy === "points") {
      data.sort((a, b) => b.points - a.points)
    } else if (sortBy === "successRate") {
      data.sort((a, b) => {
        const rateA = a.totalPredictions > 0 ? (a.correctPredictions / a.totalPredictions) * 100 : 0
        const rateB = b.totalPredictions > 0 ? (b.correctPredictions / b.totalPredictions) * 100 : 0
        return rateB - rateA
      })
    }

    return data
  }

  const sortedData = getSortedData()

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="bg-white text-gray-800 p-6 rounded-lg shadow-md mb-8 border border-gray-200">
        <h2 className="text-2xl font-bold mb-6 flex items-center text-navy-600">
          <Trophy className="w-6 h-6 mr-2" />
          טבלת דירוג
        </h2>

        {/* פילטרים */}
        <div className="flex flex-wrap justify-between items-center mb-6">
          <div className="flex space-x-2 rtl:space-x-reverse mb-2 sm:mb-0">
            <button
              className={`px-4 py-2 rounded-full text-sm font-bold transition duration-300 ${
                timeFilter === "all" ? "bg-navy-600 text-white" : "bg-gray-200 text-gray-800 hover:bg-gray-300"
              }`}
              onClick={() => setTimeFilter("all")}
            >
              כל הזמנים
            </button>
            <button
              className={`px-4 py-2 rounded-full text-sm font-bold transition duration-300 ${
                timeFilter === "monthly" ? "bg-navy-600 text-white" : "bg-gray-200 text-gray-800 hover:bg-gray-300"
              }`}
              onClick={() => setTimeFilter("monthly")}
            >
              חודשי
            </button>
            <button
              className={`px-4 py-2 rounded-full text-sm font-bold transition duration-300 ${
                timeFilter === "weekly" ? "bg-navy-600 text-white" : "bg-gray-200 text-gray-800 hover:bg-gray-300"
              }`}
              onClick={() => setTimeFilter("weekly")}
            >
              שבועי
            </button>
          </div>
          <div className="flex items-center">
            <Filter className="w-4 h-4 mr-2" />
            <span className="text-sm mr-2">מיון לפי:</span>
            <select
              className="bg-gray-100 border border-gray-300 rounded-md px-3 py-1 text-sm"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as "points" | "successRate")}
            >
              <option value="points">נקודות</option>
              <option value="successRate">אחוז הצלחה</option>
            </select>
          </div>
        </div>

        {/* טבלת דירוג */}
        {loading ? (
          <div className="text-center py-8">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-navy-600 border-r-transparent"></div>
            <p className="mt-2 text-gray-600">טוען נתונים...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
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
                  const successRate =
                    player.totalPredictions > 0
                      ? ((player.correctPredictions / player.totalPredictions) * 100).toFixed(1)
                      : "0.0"

                  return (
                    <tr
                      key={player.id}
                      className={`border-b border-gray-200 ${index < 3 ? "bg-yellow-50" : ""} hover:bg-gray-50 transition duration-150`}
                    >
                      <td className="px-4 py-3 text-right">
                        {index === 0 ? (
                          <div className="inline-flex items-center justify-center w-6 h-6 bg-yellow-500 text-white rounded-full">
                            <Trophy className="w-3 h-3" />
                          </div>
                        ) : (
                          <span className={`${index < 3 ? "font-bold" : ""}`}>{index + 1}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right font-medium">{player.name}</td>
                      <td className="px-4 py-3 text-center font-bold">{player.points}</td>
                      <td className="px-4 py-3 text-center">
                        {player.correctPredictions}/{player.totalPredictions}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {isNaN(Number.parseFloat(successRate)) ? "0.0" : successRate}%
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
