"use client"

import { useState } from "react"
import type { Prediction, User, Game } from "../types"
import { Search, Filter } from "lucide-react"

interface PredictionsListProps {
  predictions: Prediction[]
  users: User[]
  games: Game[]
}

export default function PredictionsList({ predictions, users, games }: PredictionsListProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [userFilter, setUserFilter] = useState("")
  const [gameFilter, setGameFilter] = useState("")

  // Get user name by ID
  const getUserName = (userId: string) => {
    const user = users.find((u) => u.id === userId)
    return user ? user.name : "משתמש לא ידוע"
  }

  // Get user playercode by ID
  const getUserPlayerCode = (userId: string) => {
    const user = users.find((u) => u.id === userId)
    return user ? user.playercode : "-"
  }

  // Get game name by ID
  const getGameName = (gameId: string) => {
    const game = games.find((g) => g.id === gameId)
    return game ? `${game.hometeam} נגד ${game.awayteam}` : "משחק לא ידוע"
  }

  // Filter predictions
  const filteredPredictions = predictions.filter((prediction) => {
    const userName = getUserName(prediction.userid).toLowerCase()
    const userPlayerCode = getUserPlayerCode(prediction.userid).toLowerCase()
    const gameName = getGameName(prediction.gameid).toLowerCase()

    const matchesSearch =
      userName.includes(searchTerm.toLowerCase()) ||
      userPlayerCode.includes(searchTerm.toLowerCase()) ||
      gameName.includes(searchTerm.toLowerCase()) ||
      prediction.prediction.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesUserFilter = userFilter ? prediction.userid === userFilter : true
    const matchesGameFilter = gameFilter ? prediction.gameid === gameFilter : true

    return matchesSearch && matchesUserFilter && matchesGameFilter
  })

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">רשימת ניחושים</h2>

        <div className="flex items-center">
          <div className="relative mr-2">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="חיפוש..."
              className="pl-3 pr-10 py-2 border border-gray-300 rounded-md"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        <div className="flex items-center">
          <Filter className="w-4 h-4 mr-1" />
          <span className="text-sm mr-2">סינון לפי משתמש:</span>
          <select
            className="border border-gray-300 rounded-md px-3 py-1"
            value={userFilter}
            onChange={(e) => setUserFilter(e.target.value)}
          >
            <option value="">כל המשתמשים</option>
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name} ({user.playercode})
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center">
          <Filter className="w-4 h-4 mr-1" />
          <span className="text-sm mr-2">סינון לפי משחק:</span>
          <select
            className="border border-gray-300 rounded-md px-3 py-1"
            value={gameFilter}
            onChange={(e) => setGameFilter(e.target.value)}
          >
            <option value="">כל המשחקים</option>
            {games.map((game) => (
              <option key={game.id} value={game.id}>
                {game.hometeam} נגד {game.awayteam}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="overflow-x-auto bg-white shadow rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">משתמש</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                קוד שחקן
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">משחק</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">ניחוש</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                נקודות
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                זמן הגשה
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredPredictions.length > 0 ? (
              filteredPredictions.map((prediction) => (
                <tr key={prediction.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {getUserName(prediction.userid)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                    {getUserPlayerCode(prediction.userid)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {getGameName(prediction.gameid)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                      {prediction.prediction}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {isNaN(Number(prediction.points)) ? "0" : String(prediction.points || 0)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {prediction.timestamp ? new Date(prediction.timestamp).toLocaleString() : "-"}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                  לא נמצאו ניחושים
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
