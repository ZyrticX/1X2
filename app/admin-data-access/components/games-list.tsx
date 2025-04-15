"use client"

import { useState } from "react"
import type { Game } from "../types"
import { Search, Filter, Calendar } from "lucide-react"
// Add the import for GameResultEditor
import GameResultEditor from "./game-result-editor"

interface GamesListProps {
  games: Game[]
}

export default function GamesList({ games }: GamesListProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [leagueFilter, setLeagueFilter] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | "finished" | "upcoming">("all")
  // Add a state for refreshing games
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  // Get unique leagues
  const leagues = Array.from(new Set(games.map((game) => game.league)))

  // Filter games
  const filteredGames = games.filter((game) => {
    const matchesSearch =
      game.hometeam.toLowerCase().includes(searchTerm.toLowerCase()) ||
      game.awayteam.toLowerCase().includes(searchTerm.toLowerCase()) ||
      game.league.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesLeague = leagueFilter ? game.league === leagueFilter : true

    const isFinished = game.isfinished === true
    const matchesStatus = statusFilter === "all" ? true : statusFilter === "finished" ? isFinished : !isFinished

    return matchesSearch && matchesLeague && matchesStatus
  })

  // Add a function to handle game result updates
  const handleGameResultUpdated = () => {
    setRefreshTrigger((prev) => prev + 1)
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">רשימת משחקים</h2>

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
          <span className="text-sm mr-2">סינון לפי ליגה:</span>
          <select
            className="border border-gray-300 rounded-md px-3 py-1"
            value={leagueFilter}
            onChange={(e) => setLeagueFilter(e.target.value)}
          >
            <option value="">כל הליגות</option>
            {leagues.map((league) => (
              <option key={league} value={league}>
                {league}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center">
          <Calendar className="w-4 h-4 mr-1" />
          <span className="text-sm mr-2">סטטוס:</span>
          <select
            className="border border-gray-300 rounded-md px-3 py-1"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as "all" | "finished" | "upcoming")}
          >
            <option value="all">הכל</option>
            <option value="finished">הסתיימו</option>
            <option value="upcoming">עתידיים</option>
          </select>
        </div>
      </div>

      <div className="overflow-x-auto bg-white shadow rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                קבוצת בית
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                קבוצת חוץ
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">ליגה</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">תאריך</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">שעה</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">סטטוס</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">תוצאה</th>
              {/* Add a column for actions in the table header */}
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                פעולות
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredGames.length > 0 ? (
              filteredGames.map((game) => (
                <tr key={game.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{game.hometeam}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{game.awayteam}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{game.league}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(game.date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{game.time}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span
                      className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        game.isfinished
                          ? "bg-green-100 text-green-800"
                          : game.islocked
                            ? "bg-red-100 text-red-800"
                            : "bg-blue-100 text-blue-800"
                      }`}
                    >
                      {game.isfinished ? "הסתיים" : game.islocked ? "נעול" : "פתוח"}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{game.result || "-"}</td>
                  {/* Add a cell for the game result editor in the table rows */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {!game.isfinished && <GameResultEditor game={game} onResultUpdated={handleGameResultUpdated} />}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="px-6 py-4 text-center text-sm text-gray-500">
                  לא נמצאו משחקים
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
