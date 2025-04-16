"use client"

import { useState } from "react"
import { Users, Trophy, Calendar, BarChart2, FileText, UserPlus, Home } from "lucide-react"
import { useAuth } from "../../contexts/auth-context"
import AdminUserManagement from "./admin-user-management"
import AdminLeaderboardManagement from "./admin-leaderboard-management"
import AdminUserForm from "./admin-user-form"
import AdminWeeklyGames from "./admin-weekly-games"
import AdminGameVotingStatus from "./admin-game-voting-status"
import GameResultManager from "./game-result-manager"
import { resetWeeklyData } from "../../lib/reset-data"
import { useRouter } from "next/navigation" // הוסף את useRouter

export default function AdminDashboard() {
  const [activeSection, setActiveSection] = useState<
    "users" | "leaderboard" | "add-user" | "weekly-games" | "voting-status" | "results"
  >("users")
  const { isSuperAdmin } = useAuth()
  const router = useRouter() // הוסף את useRouter

  return (
    <div className="max-w-6xl mx-auto p-4">
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {/* כפתור איפוס בחלק העליון של הממשק */}
        <div className="p-6 bg-navy-600 text-white">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <h2 className="text-2xl font-bold">ממשק ניהול</h2>
              <button
                className="mr-4 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm flex items-center"
                onClick={() => router.push("/")}
              >
                <Home className="w-4 h-4 mr-2" />
                חזרה למסך הבית
              </button>
            </div>
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

        {/* לשוניות ניווט */}
        <div className="flex flex-wrap border-b border-gray-200 bg-gray-50 overflow-x-auto">
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
        </div>

        {/* תוכן */}
        <div className="p-6">
          {activeSection === "users" && <AdminUserManagement />}
          {activeSection === "leaderboard" && <AdminLeaderboardManagement />}
          {activeSection === "add-user" && <AdminUserForm />}
          {activeSection === "weekly-games" && <AdminWeeklyGames />}
          {activeSection === "voting-status" && <AdminGameVotingStatus />}
          {activeSection === "results" && <GameResultManager />}
        </div>
      </div>
    </div>
  )
}
