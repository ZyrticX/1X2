"use client"

import { useState } from "react"
import { getSupabaseClient } from "../../lib/supabase"
import type { User } from "../types"
import { AlertCircle, CheckCircle, XCircle, RefreshCw } from "lucide-react"

interface UserActionsProps {
  user: User
  onActionComplete: () => void
}

export default function UserActions({ user, onActionComplete }: UserActionsProps) {
  const [isUpdating, setIsUpdating] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  // Update user status
  const updateUserStatus = async (newStatus: "active" | "blocked") => {
    setIsUpdating(true)
    setError(null)
    setSuccess(null)

    try {
      const supabase = getSupabaseClient()
      if (!supabase) {
        throw new Error("Supabase client is not available")
      }

      const { data, error } = await supabase.rpc("update_user_status", {
        user_id: user.id,
        new_status: newStatus,
      })

      if (error) {
        throw new Error(`Error updating user status: ${error.message}`)
      }

      if (data) {
        setSuccess(`סטטוס המשתמש עודכן ל-${newStatus === "active" ? "פעיל" : "חסום"}`)
        onActionComplete()
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
  const deleteUser = async () => {
    setIsDeleting(true)
    setError(null)
    setSuccess(null)

    try {
      const supabase = getSupabaseClient()
      if (!supabase) {
        throw new Error("Supabase client is not available")
      }

      const { data, error } = await supabase.rpc("delete_user", {
        user_id: user.id,
      })

      if (error) {
        throw new Error(`Error deleting user: ${error.message}`)
      }

      if (data) {
        setSuccess(`המשתמש ${user.name} נמחק בהצלחה`)
        // קריאה לפונקציה שתרענן את רשימת המשתמשים
        onActionComplete()
        // סגירת חלון האישור
        setShowDeleteConfirm(false)
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
  const updateUserPoints = async (points: number) => {
    setIsUpdating(true)
    setError(null)
    setSuccess(null)

    try {
      const supabase = getSupabaseClient()
      if (!supabase) {
        throw new Error("Supabase client is not available")
      }

      const { data, error } = await supabase.rpc("update_user_points", {
        user_id: user.id,
        new_points: points,
      })

      if (error) {
        throw new Error(`Error updating user points: ${error.message}`)
      }

      if (data) {
        setSuccess(`הנקודות של המשתמש עודכנו ל-${points}`)
        onActionComplete()
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

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 mr-2" />
            <span>{error}</span>
          </div>
        </div>
      )}

      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative" role="alert">
          <div className="flex items-center">
            <CheckCircle className="w-5 h-5 mr-2" />
            <span>{success}</span>
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {user.status === "blocked" ? (
          <button
            className="bg-green-600 text-white px-3 py-1 rounded-md text-sm flex items-center"
            onClick={() => updateUserStatus("active")}
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
            onClick={() => updateUserStatus("blocked")}
            disabled={isUpdating}
          >
            {isUpdating ? <RefreshCw className="w-4 h-4 mr-1 animate-spin" /> : <XCircle className="w-4 h-4 mr-1" />}
            חסום משתמש
          </button>
        )}

        <button
          className="bg-red-600 text-white px-3 py-1 rounded-md text-sm flex items-center"
          onClick={() => setShowDeleteConfirm(true)}
          disabled={isDeleting}
        >
          {isDeleting ? <RefreshCw className="w-4 h-4 mr-1 animate-spin" /> : <XCircle className="w-4 h-4 mr-1" />}
          מחק משתמש
        </button>

        <div className="flex items-center">
          <span className="text-sm mr-2">נקודות:</span>
          <input
            type="number"
            className="border border-gray-300 rounded-md px-2 py-1 w-16 text-center"
            defaultValue={user.points || 0}
            min={0}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                const points = Number.parseInt((e.target as HTMLInputElement).value)
                if (!isNaN(points)) {
                  updateUserPoints(points)
                }
              }
            }}
          />
          <button
            className="bg-blue-600 text-white px-2 py-1 rounded-md text-sm ml-2"
            onClick={(e) => {
              const input = e.currentTarget.previousElementSibling as HTMLInputElement
              const points = Number.parseInt(input.value)
              if (!isNaN(points)) {
                updateUserPoints(points)
              }
            }}
            disabled={isUpdating}
          >
            עדכן
          </button>
        </div>
      </div>

      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
            <h3 className="text-lg font-bold mb-4">אישור מחיקת משתמש</h3>
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
                onClick={deleteUser}
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
  )
}
