"use client"

import { useState } from "react"
import { getSupabaseClient } from "../../lib/supabase"
import type { Game } from "../types"
import { RefreshCw, CheckCircle, AlertCircle } from "lucide-react"

interface GameResultEditorProps {
  game: Game
  onResultUpdated: () => void
}

export default function GameResultEditor({ game, onResultUpdated }: GameResultEditorProps) {
  const [result, setResult] = useState(game.result || "")
  const [isUpdating, setIsUpdating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const updateGameResult = async () => {
    if (!result.trim()) {
      setError("יש להזין תוצאה")
      return
    }

    setIsUpdating(true)
    setError(null)
    setSuccess(null)

    try {
      const supabase = getSupabaseClient()
      if (!supabase) {
        throw new Error("Supabase client is not available")
      }

      const { data, error } = await supabase.rpc("update_game_result", {
        game_id: game.id,
        game_result: result,
      })

      if (error) {
        throw new Error(`Error updating game result: ${error.message}`)
      }

      if (data) {
        setSuccess(`תוצאת המשחק עודכנה ל-${result}`)
        onResultUpdated()
      } else {
        setError("לא ניתן היה לעדכן את תוצאת המשחק")
      }
    } catch (err) {
      console.error("Error updating game result:", err)
      setError(err instanceof Error ? err.message : "שגיאה לא ידועה")
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <div className="space-y-2">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-3 py-2 rounded text-sm" role="alert">
          <div className="flex items-center">
            <AlertCircle className="w-4 h-4 mr-1" />
            <span>{error}</span>
          </div>
        </div>
      )}

      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-3 py-2 rounded text-sm" role="alert">
          <div className="flex items-center">
            <CheckCircle className="w-4 h-4 mr-1" />
            <span>{success}</span>
          </div>
        </div>
      )}

      <div className="flex items-center">
        <input
          type="text"
          className="border border-gray-300 rounded-md px-3 py-1 w-24 text-center"
          placeholder="1-0"
          value={result}
          onChange={(e) => setResult(e.target.value)}
          disabled={isUpdating}
        />
        <button
          className="bg-navy-600 text-white px-3 py-1 rounded-md text-sm ml-2 flex items-center"
          onClick={updateGameResult}
          disabled={isUpdating}
        >
          {isUpdating ? <RefreshCw className="w-4 h-4 mr-1 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-1" />}
          עדכן תוצאה
        </button>
      </div>
    </div>
  )
}
