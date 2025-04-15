"use client"

import { useState, useEffect } from "react"
import { Users, Trophy, Settings, UserPlus, Calendar, BarChart2, TestTube, FileText } from "lucide-react"
import { useAuth } from "../../contexts/auth-context"
// עדכון הייבואים לאחר ארגון מחדש של הקבצים
import AdminUserManagement from "./admin-user-management"
import AdminLeaderboardManagement from "./admin-leaderboard-management"
import AdminUserForm from "./admin-user-form"
import AdminWeeklyGames from "./admin-weekly-games"
import AdminGameVotingStatus from "./admin-game-voting-status"
import AdminGameLockManager from "./admin-game-lock-manager"
import AdminDaySelector from "./admin-day-selector"
import AdminTestingTool from "./admin-testing-tool"
import ResetAllData from "./reset-all-data"
import ManageLeaderboardUsers from "./manage-leaderboard-users"
import GameResultManager from "./game-result-manager" // הוספת הקומפוננטה החדשה
import DeleteGames from "./delete-games"

// הוספת ייבוא של פונקציית האיפוס - תיקון הנתיב
import { resetWeeklyData } from "../../lib/reset-data"

export default function AdminDashboard() {
  const [activeSection, setActiveSection] = useState<
    "users" | "leaderboard" | "add-user" | "weekly-games" | "voting-status" | "settings" | "testing" | "results"
  >("users")
  const { isSuperAdmin } = useAuth()
  const [currentSystemDay, setCurrentSystemDay] = useState("")

  // Load current system day on component mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedDay = localStorage.getItem("currentSystemDay")
      if (storedDay) {
        setCurrentSystemDay(storedDay)
      } else {
        // Default to current day if not set
        const days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"]
        const today = new Date().getDay() // 0 = Sunday, 1 = Monday, etc.
        setCurrentSystemDay(days[today])
      }
    }
  }, [])

  // Handle day change from the day selector
  const handleDayChange = (day: string) => {
    setCurrentSystemDay(day)
    // You could also trigger other updates here if needed
  }

  return (
    <div className="max-w-6xl mx-auto p-4">
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {/* הוספת כפתור איפוס בחלק העליון של הממשק */}
        <div className="p-6 bg-navy-600 text-white">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">ממשק ניהול</h2>
            <button
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm"
              onClick={() => {
                if (
                  window.confirm(
                    "האם אתה בטוח שברצונך לאפס את כל הנתונים לתחילת שבוע חדש? פעולה זו תאפס את טבלת הדירוג השבועית.",
                  )
                ) {
                  resetWeeklyData()
                  alert("הנתונים אופסו בהצלחה! טבלת הדירוג השבועית אופסה.")
                }
              }}
            >
              איפוס לשבוע חדש
            </button>
          </div>
          <p className="text-sm opacity-80">ניהול משתמשים, טבלאות דירוג ונתוני המערכת</p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap border-b border-gray-200 bg-gray-50">
          <button
            className={`px-4 py-3 flex items-center text-sm font-medium ${
              activeSection === "users"
                ? "border-b-2 border-navy-600 text-navy-600 bg-white"
                : "text-gray-600 hover:text-navy-600 hover:bg-gray-100"
            }`}
            onClick={() => setActiveSection("users")}
          >
            <Users className="w-4 h-4 ml-2" />
            ניהול משתמשים
          </button>
          <button
            className={`px-4 py-3 flex items-center text-sm font-medium ${
              activeSection === "leaderboard"
                ? "border-b-2 border-navy-600 text-navy-600 bg-white"
                : "text-gray-600 hover:text-navy-600 hover:bg-gray-100"
            }`}
            onClick={() => setActiveSection("leaderboard")}
          >
            <Trophy className="w-4 h-4 ml-2" />
            ניהול טבלת דירוג
          </button>
          <button
            className={`px-4 py-3 flex items-center text-sm font-medium ${
              activeSection === "add-user"
                ? "border-b-2 border-navy-600 text-navy-600 bg-white"
                : "text-gray-600 hover:text-navy-600 hover:bg-gray-100"
            }`}
            onClick={() => setActiveSection("add-user")}
          >
            <UserPlus className="w-4 h-4 ml-2" />
            הוספת משתמש
          </button>
          <button
            className={`px-4 py-3 flex items-center text-sm font-medium ${
              activeSection === "weekly-games"
                ? "border-b-2 border-navy-600 text-navy-600 bg-white"
                : "text-gray-600 hover:text-navy-600 hover:bg-gray-100"
            }`}
            onClick={() => setActiveSection("weekly-games")}
          >
            <Calendar className="w-4 h-4 ml-2" />
            עדכון משחקים שבועיים
          </button>
          <button
            className={`px-4 py-3 flex items-center text-sm font-medium ${
              activeSection === "voting-status"
                ? "border-b-2 border-navy-600 text-navy-600 bg-white"
                : "text-gray-600 hover:text-navy-600 hover:bg-gray-100"
            }`}
            onClick={() => setActiveSection("voting-status")}
          >
            <BarChart2 className="w-4 h-4 ml-2" />
            סטטוס הצבעות
          </button>
          <button
            className={`px-4 py-3 flex items-center text-sm font-medium ${
              activeSection === "results"
                ? "border-b-2 border-navy-600 text-navy-600 bg-white"
                : "text-gray-600 hover:text-navy-600 hover:bg-gray-100"
            }`}
            onClick={() => setActiveSection("results")}
          >
            <FileText className="w-4 h-4 ml-2" />
            ניהול תוצאות
          </button>
          <button
            className={`px-4 py-3 flex items-center text-sm font-medium ${
              activeSection === "settings"
                ? "border-b-2 border-navy-600 text-navy-600 bg-white"
                : "text-gray-600 hover:text-navy-600 hover:bg-gray-100"
            }`}
            onClick={() => setActiveSection("settings")}
          >
            <Settings className="w-4 h-4 ml-2" />
            הגדרות מערכת
          </button>
          {/* הוספת לשונית כלי בדיקות - רק לסופר אדמין */}
          {isSuperAdmin && (
            <button
              className={`px-4 py-3 flex items-center text-sm font-medium ${
                activeSection === "testing"
                  ? "border-b-2 border-navy-600 text-navy-600 bg-white"
                  : "text-gray-600 hover:text-navy-600 hover:bg-gray-100"
              }`}
              onClick={() => setActiveSection("testing")}
            >
              <TestTube className="w-4 h-4 ml-2" />
              כלי בדיקות
            </button>
          )}
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Super Admin Day Selector - only visible for super admins */}
          {isSuperAdmin && <AdminDaySelector currentDay={currentSystemDay} onDayChange={handleDayChange} />}

          {activeSection === "users" && <AdminUserManagement />}
          {activeSection === "leaderboard" && (
            <>
              <ManageLeaderboardUsers />
              <AdminLeaderboardManagement />
            </>
          )}
          {activeSection === "add-user" && <AdminUserForm />}
          {activeSection === "weekly-games" && <AdminWeeklyGames />}
          {activeSection === "voting-status" && <AdminGameVotingStatus />}
          {activeSection === "results" && <GameResultManager />}
          {activeSection === "settings" && (
            <div>
              <h3 className="text-xl font-bold mb-6">הגדרות מערכת</h3>
              <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
                <ResetAllData />
                <AdminGameLockManager />
                <DeleteGames />

                <div className="p-6 bg-white rounded-lg shadow-md">
                  <h3 className="text-lg font-bold mb-4">הגדרות נוספות</h3>
                  <p className="text-gray-500">הגדרות נוספות יהיו זמינות בקרוב</p>
                </div>
              </div>
            </div>
          )}
          {/* הוספת תוכן כלי בדיקות */}
          {activeSection === "testing" && isSuperAdmin && <AdminTestingTool />}
        </div>
      </div>
    </div>
  )
}
