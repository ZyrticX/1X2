"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Calendar, Save, RefreshCw, Lock, Unlock, AlertCircle } from "lucide-react"
import { updateSystemSettings, getSystemSettings } from "../../lib/dataService"

interface AdminDaySelectorProps {
  currentDay: string
  onDayChange: (day: string) => void
}

export default function AdminDaySelector({ currentDay, onDayChange }: AdminDaySelectorProps) {
  const [selectedDay, setSelectedDay] = useState(currentDay)
  const [isSaving, setIsSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [isLocked, setIsLocked] = useState(true)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [password, setPassword] = useState("")
  const [passwordError, setPasswordError] = useState("")
  const [showTool, setShowTool] = useState(false)

  const days = [
    { id: "sunday", name: "יום א'" },
    { id: "monday", name: "יום ב'" },
    { id: "tuesday", name: "יום ג'" },
    { id: "wednesday", name: "יום ד'" },
    { id: "thursday", name: "יום ה'" },
    { id: "friday", name: "יום ו'" },
    { id: "saturday", name: "שבת" },
  ]

  // Load current day from database on component mount
  useEffect(() => {
    const loadSystemSettings = async () => {
      try {
        const settings = await getSystemSettings()
        if (settings && settings.currentday) {
          setSelectedDay(settings.currentday)
          onDayChange(settings.currentday)
        } else {
          // אם אין הגדרות, השתמש בערך הנוכחי או בברירת מחדל
          const defaultDay = currentDay || "sunday"
          setSelectedDay(defaultDay)
          onDayChange(defaultDay)

          // Save to localStorage for consistency
          localStorage.setItem("currentSystemDay", defaultDay)
          localStorage.setItem("systemSettings", JSON.stringify({ currentday: defaultDay }))
        }
      } catch (error) {
        // במקרה של שגיאה, השתמש בערך הנוכחי או בלוקל סטורג'
        const storedDay = localStorage.getItem("currentSystemDay")
        const defaultDay = storedDay || currentDay || "sunday"
        setSelectedDay(defaultDay)
        onDayChange(defaultDay)

        // Also save this to localStorage to ensure consistency
        localStorage.setItem("currentSystemDay", defaultDay)
        localStorage.setItem("systemSettings", JSON.stringify({ currentday: defaultDay }))
      }
    }

    loadSystemSettings()
  }, [onDayChange, currentDay])

  const handleSaveDay = async () => {
    setIsSaving(true)

    try {
      // Save to database
      const success = await updateSystemSettings({ currentday: selectedDay })

      if (success) {
        // Also save to localStorage for client-side access
        localStorage.setItem("currentSystemDay", selectedDay)

        // Call the parent component's handler
        onDayChange(selectedDay)

        setSaved(true)

        // Reset saved state after 3 seconds
        setTimeout(() => setSaved(false), 3000)
      } else {
        console.error("Failed to update system settings")
      }
    } catch (error) {
      console.error("Error saving day:", error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleUnlock = () => {
    setShowPasswordModal(true)
  }

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordError("")

    // בדיקת הסיסמה - "פלוגות5" היא הסיסמה שמשמשת גם במקומות אחרים במערכת
    if (password === "פלוגות5") {
      setIsLocked(false)
      setShowPasswordModal(false)
      setPassword("")
      setShowTool(true)
    } else {
      setPasswordError("סיסמה שגויה, נסה שנית")
    }
  }

  // אם הכלי מוסתר, הצג רק כפתור לפתיחה
  if (!showTool) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-bold mb-0 flex items-center">
            <Calendar className="w-5 h-5 mr-2" />
            כלי שינוי יום מערכת
          </h3>
          <button
            className="px-4 py-2 bg-navy-600 text-white rounded-md flex items-center"
            onClick={() => setShowTool(true)}
          >
            <Lock className="w-4 h-4 mr-2" />
            הצג כלי
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md mb-6">
      <h3 className="text-lg font-bold mb-4 flex items-center">
        <Calendar className="w-5 h-5 mr-2" />
        שינוי יום מערכת
        {isLocked ? (
          <button
            className="mr-2 px-3 py-1 bg-red-600 text-white text-sm rounded-md flex items-center"
            onClick={handleUnlock}
          >
            <Lock className="w-4 h-4 mr-1" />
            נעול
          </button>
        ) : (
          <button
            className="mr-2 px-3 py-1 bg-green-600 text-white text-sm rounded-md flex items-center"
            onClick={() => setIsLocked(true)}
          >
            <Unlock className="w-4 h-4 mr-1" />
            פתוח
          </button>
        )}
      </h3>

      <div className="mb-4 p-3 bg-blue-50 text-blue-700 rounded-md">
        <p>באמצעות כלי זה תוכל לשנות את היום הנוכחי במערכת, ללא קשר ליום האמיתי בשבוע.</p>
        <p className="mt-2">שימוש בכלי זה ישפיע על הצגת המשחקים והאפשרות להמר עליהם.</p>
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">בחר יום:</label>
        <div className="flex flex-wrap gap-2">
          {days.map((day) => (
            <button
              key={day.id}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                selectedDay === day.id ? "bg-navy-600 text-white" : "bg-gray-200 text-gray-800 hover:bg-gray-300"
              } ${isLocked ? "opacity-50 cursor-not-allowed" : ""}`}
              onClick={() => !isLocked && setSelectedDay(day.id)}
              disabled={isLocked}
            >
              {day.name}
            </button>
          ))}
        </div>
      </div>

      <div className="flex justify-end">
        <button
          className={`px-4 py-2 rounded-md text-sm font-medium flex items-center ${
            saved ? "bg-green-600 text-white" : "bg-navy-600 text-white hover:bg-navy-700"
          } ${isLocked ? "opacity-50 cursor-not-allowed" : ""}`}
          onClick={handleSaveDay}
          disabled={isSaving || saved || isLocked}
        >
          {isSaving ? (
            <>
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              שומר...
            </>
          ) : saved ? (
            <>
              <Save className="w-4 h-4 mr-2" />
              נשמר בהצלחה
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              שמור שינויים
            </>
          )}
        </button>
      </div>

      {/* מודאל הזנת סיסמה */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full">
            <h3 className="text-lg font-bold mb-4">הזנת סיסמת מנהל-על</h3>

            {passwordError && (
              <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md flex items-center">
                <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
                <span>{passwordError}</span>
              </div>
            )}

            <form onSubmit={handlePasswordSubmit}>
              <div className="mb-4">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  סיסמה
                </label>
                <input
                  type="password"
                  id="password"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoFocus
                />
              </div>

              <div className="flex justify-end space-x-2 rtl:space-x-reverse">
                <button
                  type="button"
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md"
                  onClick={() => {
                    setShowPasswordModal(false)
                    setPassword("")
                    setPasswordError("")
                  }}
                >
                  ביטול
                </button>
                <button type="submit" className="px-4 py-2 bg-navy-600 text-white rounded-md">
                  אישור
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
