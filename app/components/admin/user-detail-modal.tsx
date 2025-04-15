"use client"

import { useState } from "react"
import { X, CheckCircle, XCircle, RefreshCw, AlertCircle } from "lucide-react"
import { updateUserStatus, deleteUser, updateUserPoints } from "../../lib/dataService"
import { getUserPredictions } from "../../lib/dataService"

// Define the types based on existing usage
interface User {
  id: string
  name: string
  phone?: string
  email?: string
  city?: string
  playercode: string
  status?: "active" | "blocked"
  points?: number
  created_at?: string
  updated_at?: string
}

interface Game {
  id: string
  hometeam: string
  awayteam: string
  time: string
  date: string
  league: string
  closingtime: string
  isfinished?: boolean
  islocked?: boolean
  result?: string
}

interface Prediction {
  id: string
  userid: string
  gameid: string
  prediction: string
  timestamp: string
}

interface UserDetailModalProps {
  user: User
  games: Game[]
  onClose: () => void
  onUserUpdated: () => void
}

export default function UserDetailModal({ user, games, onClose, onUserUpdated }: UserDetailModalProps) {
  const [isUpdating, setIsUpdating] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [predictions, setPredictions] = useState<Prediction[]>([])
  const [loadingPredictions, setLoadingPredictions] = useState(true)
  const [pointsInput, setPointsInput] = useState(user.points?.toString() || "0")

  // Load user predictions
  useState(() => {
    const fetchPredictions = async () => {
      setLoadingPredictions(true)
      try {
        const userPredictions = await getUserPredictions(user.id)
        setPredictions(userPredictions)
      } catch (error) {
        console.error("Error fetching user predictions:", error)
      } finally {
        setLoadingPredictions(false)
      }
    }

    fetchPredictions()
  })

  // Update user status
  const handleUpdateStatus = async (newStatus: "active" | "blocked") => {
    setIsUpdating(true)
    setError(null)
    setSuccess(null)

    try {
      const success = await updateUserStatus(user.id, newStatus)
      if (success) {
        setSuccess(`סטטוס המשתמש עודכן ל-${newStatus === "active" ? "פעיל" : "חסום"}`)
        onUserUpdated()
      } else {
        setError("לא ניתן היה לעדכן את סטטוס המשתמש")
      }
    } catch (err) {
      console.error("Error updating user status:", err)
      setError(err instanceof Error ? err.message : "שגיאה לא ידועה")
    } finally {
      setIsUpdating(false)
    }
  }

  // Delete user
  const handleDeleteUser = async () => {
    setIsDeleting(true)
    setError(null)
    setSuccess(null)

    try {
      const success = await deleteUser(user.id)
      if (success) {
        setSuccess(`המשתמש ${user.name} נמחק בהצלחה`)
        setTimeout(() => {
          onUserUpdated()
          onClose()
        }, 1500)
      } else {
        setError("לא ניתן היה למחוק את המשתמש")
      }
    } catch (err) {
      console.error("Error deleting user:", err)
      setError(err instanceof Error ? err.message : "שגיאה לא ידועה")
    } finally {
      setIsDeleting(false)
    }
  }

  // Update user points
  const handleUpdatePoints = async () => {
    setIsUpdating(true)
    setError(null)
    setSuccess(null)

    try {
      const points = Number.parseInt(pointsInput)
      if (isNaN(points)) {
        throw new Error("יש להזין מספר תקין")
      }

      const success = await updateUserPoints(user.id, points)
      if (success) {
        setSuccess(`הנקודות של המשתמש עודכנו ל-${points}`)
        onUserUpdated()
      } else {
        setError("לא ניתן היה לעדכן את נקודות המשתמש")
      }
    } catch (err) {
      console.error("Error updating user points:", err)
      setError(err instanceof Error ? err.message : "שגיאה לא ידועה")
    } finally {
      setIsUpdating(false)
    }
  }

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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">פרטי משתמש: {user.name}</h2>
          <button className="text-gray-500 hover:text-gray-700" onClick={onClose}>
            <X className="w-6 h-6" />
          </button>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4" role="alert">
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 mr-2" />
              <span>{error}</span>
            </div>
          </div>
        )}

        {success && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4" role="alert">
            <div className="flex items-center">
              <CheckCircle className="w-5 h-5 mr-2" />
              <span>{success}</span>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <h3 className="text-lg font-bold mb-2">פרטים אישיים</h3>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="mb-2">
                <span className="font-bold">שם:</span> {user.name}
              </p>
              <p className="mb-2">
                <span className="font-bold">קוד שחקן:</span> {user.playercode}
              </p>
              <p className="mb-2">
                <span className="font-bold">טלפון:</span> {user.phone || "-"}
              </p>
              <p className="mb-2">
                <span className="font-bold">עיר:</span> {user.city || "-"}
              </p>
              <p className="mb-2">
                <span className="font-bold">סטטוס:</span>{" "}
                <span
                  className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    user.status === "active" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                  }`}
                >
                  {user.status === "active" ? "פעיל" : user.status === "blocked" ? "חסום" : "-"}
                </span>
              </p>
              <p className="mb-2">
                <span className="font-bold">נקודות:</span> {user.points || 0}
              </p>
              <p className="mb-2">
                <span className="font-bold">תאריך הצטרפות:</span>{" "}
                {user.created_at ? new Date(user.created_at).toLocaleDateString() : "-"}
              </p>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-bold mb-2">פעולות</h3>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="space-y-4">
                <div className="flex items-center">
                  <span className="text-sm mr-2">נקודות:</span>
                  <input
                    type="number"
                    className="border border-gray-300 rounded-md px-2 py-1 w-16 text-center"
                    value={pointsInput}
                    onChange={(e) => setPointsInput(e.target.value)}
                    min={0}
                  />
                  <button
                    className="bg-blue-600 text-white px-2 py-1 rounded-md text-sm ml-2"
                    onClick={handleUpdatePoints}
                    disabled={isUpdating}
                  >
                    {isUpdating ? <RefreshCw className="w-4 h-4 animate-spin" /> : "עדכן"}
                  </button>
                </div>

                <div className="flex flex-wrap gap-2">
                  {user.status === "blocked" ? (
                    <button
                      className="bg-green-600 text-white px-3 py-1 rounded-md text-sm flex items-center"
                      onClick={() => handleUpdateStatus("active")}
                      disabled={isUpdating}
                    >
                      {isUpdating ? (
                        <RefreshCw className="w-4 h-4 mr-1 animate-spin" />
                      ) : (
                        <CheckCircle className="w-4 h-4 mr-1" />
                      )}
                      הפעל משתמש
                    </button>
                  ) : (
                    <button
                      className="bg-orange-600 text-white px-3 py-1 rounded-md text-sm flex items-center"
                      onClick={() => handleUpdateStatus("blocked")}
                      disabled={isUpdating}
                    >
                      {isUpdating ? (
                        <RefreshCw className="w-4 h-4 mr-1 animate-spin" />
                      ) : (
                        <XCircle className="w-4 h-4 mr-1" />
                      )}
                      חסום משתמש
                    </button>
                  )}

                  <button
                    className="bg-red-600 text-white px-3 py-1 rounded-md text-sm flex items-center"
                    onClick={() => setShowDeleteConfirm(true)}
                    disabled={isDeleting}
                  >
                    {isDeleting ? (
                      <RefreshCw className="w-4 h-4 mr-1 animate-spin" />
                    ) : (
                      <XCircle className="w-4 h-4 mr-1" />
                    )}
                    מחק משתמש
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4">
          <h3 className="text-lg font-bold mb-2">ניחושים של המשתמש</h3>
          {loadingPredictions ? (
            <div className="flex justify-center items-center h-32">
              <RefreshCw className="w-6 h-6 animate-spin text-navy-600" />
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

        {/* Confirmation Dialog */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <h4 className="text-lg font-bold mb-4">אישור מחיקת משתמש</h4>
              <p className="mb-4">
                האם אתה בטוח שברצונך למחוק את המשתמש <strong>{user.name}</strong>? פעולה זו אינה הפיכה וכל הניחושים של
                המשתמש יימחקו גם כן.
              </p>
              <div className="flex justify-end gap-2">
                <button
                  className="bg-gray-300 text-gray-800 px-4 py-2 rounded-md"
                  onClick={() => setShowDeleteConfirm(false)}
                >
                  ביטול
                </button>
                <button
                  className="bg-red-600 text-white px-4 py-2 rounded-md flex items-center"
                  onClick={handleDeleteUser}
                  disabled={isDeleting}
                >
                  {isDeleting ? (
                    <RefreshCw className="w-4 h-4 mr-1 animate-spin" />
                  ) : (
                    <XCircle className="w-4 h-4 mr-1" />
                  )}
                  מחק משתמש
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
