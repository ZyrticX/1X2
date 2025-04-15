"use client"

import { useState, useEffect } from "react"
import { Clock } from "lucide-react"

interface GameTimerProps {
  closingTime: Date
  isPastDay: boolean
  isManuallyLocked: boolean
}

export default function GameTimer({ closingTime, isPastDay, isManuallyLocked }: GameTimerProps) {
  const [timeLeft, setTimeLeft] = useState<string>("")
  const [isNearClosing, setIsNearClosing] = useState(false)
  const [isClosed, setIsClosed] = useState(false)
  const [shouldShowTimer, setShouldShowTimer] = useState(false)

  useEffect(() => {
    // Don't start the timer if it's a past day or manually locked
    if (isPastDay || isManuallyLocked) {
      setIsClosed(true)
      return
    }

    const updateTimer = () => {
      const now = new Date()
      const closing = new Date(closingTime)
      const diff = closing.getTime() - now.getTime()

      // Get current day of week (0 = Sunday, 1 = Monday, etc.)
      const dayOfWeek = now.getDay()

      // Check if we should show the timer based on day of week
      // הטיימר לא קשור למתי שהמשחק מתחיל, אלא תלוי ביום בשבוע
      if (dayOfWeek >= 0 && dayOfWeek <= 3) {
        // Sunday through Wednesday - no timer
        setShouldShowTimer(false)
        return
      } else if (dayOfWeek === 4) {
        // Thursday - show timer all day
        setShouldShowTimer(true)
      } else {
        // Friday and Saturday - show timer all day
        setShouldShowTimer(true)
      }

      if (diff <= 0) {
        setIsClosed(true)
        setTimeLeft("סגור")
        setShouldShowTimer(false)
        return
      }

      // Calculate days, hours, minutes, seconds
      const days = Math.floor(diff / (1000 * 60 * 60 * 24))
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((diff % (1000 * 60)) / 1000)

      // וודא שכל הערכים הם מספרים תקינים
      const validDays = isNaN(days) ? 0 : days
      const validHours = isNaN(hours) ? 0 : hours
      const validMinutes = isNaN(minutes) ? 0 : minutes
      const validSeconds = isNaN(seconds) ? 0 : seconds

      // Format the time based on how much time is left
      if (validDays > 0) {
        // If more than 24 hours, show days and hours
        setTimeLeft(
          `${validDays} ימים ${validHours.toString().padStart(2, "0")}:${validMinutes.toString().padStart(2, "0")}`,
        )
      } else {
        // If less than 24 hours, show hours:minutes:seconds
        setTimeLeft(
          `${validHours.toString().padStart(2, "0")}:${validMinutes.toString().padStart(2, "0")}:${validSeconds.toString().padStart(2, "0")}`,
        )
      }

      // Check if less than 1 hour remains
      setIsNearClosing(diff < 60 * 60 * 1000)
    }

    // Initial update
    updateTimer()

    // Set up interval
    const interval = setInterval(updateTimer, 1000)

    // Clean up
    return () => clearInterval(interval)
  }, [closingTime, isPastDay, isManuallyLocked])

  // Don't render if we shouldn't show the timer
  if (!shouldShowTimer || isPastDay || isManuallyLocked || isClosed) {
    return null
  }

  return (
    <div className="flex justify-center mb-4">
      <div
        className={`px-4 py-2 rounded-md flex items-center ${
          isNearClosing ? "bg-red-50 text-red-700" : "bg-blue-50 text-blue-700"
        }`}
      >
        <Clock className="w-4 h-4 mr-2" />
        <span className="font-medium">{timeLeft}</span>
      </div>
    </div>
  )
}
