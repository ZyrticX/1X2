"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Clock, Lock } from "lucide-react"

interface GameTimerProps {
  closingTime: Date
  isPastDay?: boolean
  isManuallyLocked?: boolean
}

const GameTimer: React.FC<GameTimerProps> = ({ closingTime, isPastDay = false, isManuallyLocked = false }) => {
  const [timeLeft, setTimeLeft] = useState<string>("")
  const [isLocked, setIsLocked] = useState<boolean>(false)

  useEffect(() => {
    const updateTimer = () => {
      const now = new Date()
      const closing = new Date(closingTime)
      const diff = closing.getTime() - now.getTime()

      // בדיקה אם המשחק נעול
      if (diff <= 0 || isPastDay || isManuallyLocked) {
        setIsLocked(true)
        setTimeLeft("סגור להימורים")
        return
      }

      setIsLocked(false)

      // חישוב הזמן שנותר
      const hours = Math.floor(diff / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((diff % (1000 * 60)) / 1000)

      // פורמט הזמן
      if (hours > 0) {
        setTimeLeft(`${hours}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`)
      } else {
        setTimeLeft(`${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`)
      }
    }

    // עדכון ראשוני
    updateTimer()

    // עדכון כל שנייה
    const interval = setInterval(updateTimer, 1000)

    return () => clearInterval(interval)
  }, [closingTime, isPastDay, isManuallyLocked])

  return (
    <div
      className={`flex items-center justify-center py-1 px-3 rounded-full text-sm font-medium mb-4 ${
        isLocked ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"
      }`}
    >
      {isLocked ? (
        <>
          <Lock className="w-4 h-4 mr-1" />
          <span>סגור להימורים</span>
        </>
      ) : (
        <>
          <Clock className="w-4 h-4 mr-1" />
          <span>זמן שנותר: </span>
          <span className="font-mono">{timeLeft}</span>
        </>
      )}
    </div>
  )
}

export default GameTimer
