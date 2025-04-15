"use client"

import { useState, useEffect, useCallback } from "react"
import { getSupabaseClient } from "../lib/supabase"
import AdminDataPanel from "./components/admin-data-panel"
import UsersList from "./components/users-list"
import PredictionsList from "./components/predictions-list"
import GamesList from "./components/games-list"
import AddUserForm from "./components/add-user-form"
import type { User, Prediction, Game } from "./types"

export default function AdminDataAccessPage() {
  const [adminUser, setAdminUser] = useState<User | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [predictions, setPredictions] = useState<Prediction[]>([])
  const [games, setGames] = useState<Game[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<"users" | "predictions" | "games">("users")
  const [error, setError] = useState<string | null>(null)
  const [refreshCounter, setRefreshCounter] = useState(0)

  // פונקציה לרענון הנתונים - מוגדרת עם useCallback כדי למנוע יצירה מחדש בכל רינדור
  const refreshData = useCallback(async () => {
    console.log("Refreshing data...")
    setLoading(true)
    setError(null)

    try {
      const supabase = getSupabaseClient()
      if (!supabase) {
        throw new Error("Supabase client is not available")
      }

      // חיפוש המשתמש הראשי
      const { data: adminData, error: adminError } = await supabase
        .from("users")
        .select("*")
        .eq("playercode", "323317966")
        .limit(1)

      if (adminError) {
        console.error("Error finding admin user:", adminError)
      } else if (adminData && adminData.length > 0) {
        setAdminUser(adminData[0])
        console.log("Found admin user:", adminData[0])
      } else {
        console.log("Admin user not found in database")
        setAdminUser(null)
      }

      // שימוש בפונקציית ה-RPC המעודכנת לקבלת כל המשתמשים
      const { data: usersData, error: usersError } = await supabase.rpc("get_all_users_for_admin")

      if (usersError) {
        console.error("Error using RPC function:", usersError)

        // נסיון לקבל משתמשים ישירות מהטבלה
        const { data: fallbackData, error: fallbackError } = await supabase.from("users").select("*").order("name")

        if (fallbackError) {
          throw new Error(`Error fetching users: ${fallbackError.message}`)
        }

        setUsers(fallbackData || [])
      } else {
        console.log("Fetched users:", usersData?.length || 0)
        setUsers(usersData || [])
      }

      // קבלת כל הניחושים
      const { data: predictionsData, error: predictionsError } = await supabase
        .from("predictions")
        .select("*")
        .order("timestamp", { ascending: false })
        .limit(100)

      if (predictionsError) {
        console.error("Error fetching predictions:", predictionsError)
      } else {
        setPredictions(predictionsData || [])
      }

      // קבלת כל המשחקים
      const { data: gamesData, error: gamesError } = await supabase.from("games").select("*").order("date")

      if (gamesError) {
        console.error("Error fetching games:", gamesError)
      } else {
        setGames(gamesData || [])
      }
    } catch (err) {
      console.error("Error in data fetching:", err)
      setError(err instanceof Error ? err.message : "Unknown error occurred")
    } finally {
      setLoading(false)
    }
  }, [])

  // פונקציה לאתחול רענון הנתונים
  const triggerRefresh = useCallback(() => {
    console.log("Triggering refresh...")
    setRefreshCounter((prev) => prev + 1)
  }, [])

  // טעינת נתונים בעת טעינת הדף או כאשר מונה הרענון משתנה
  useEffect(() => {
    refreshData()
  }, [refreshData, refreshCounter])

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">מערכת ניהול נתונים</h1>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-navy-600"></div>
        </div>
      ) : error ? (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p className="font-bold">שגיאה!</p>
          <p>{error}</p>
        </div>
      ) : (
        <>
          <AdminDataPanel
            adminUser={adminUser}
            userCount={users.length}
            predictionCount={predictions.length}
            gameCount={games.length}
          />

          <div className="mb-6 border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                className={`mr-1 py-2 px-4 text-center border-b-2 font-medium text-sm ${
                  activeTab === "users"
                    ? "border-navy-600 text-navy-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
                onClick={() => setActiveTab("users")}
              >
                משתמשים
              </button>
              <button
                className={`mr-1 py-2 px-4 text-center border-b-2 font-medium text-sm ${
                  activeTab === "predictions"
                    ? "border-navy-600 text-navy-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
                onClick={() => setActiveTab("predictions")}
              >
                ניחושים
              </button>
              <button
                className={`mr-1 py-2 px-4 text-center border-b-2 font-medium text-sm ${
                  activeTab === "games"
                    ? "border-navy-600 text-navy-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
                onClick={() => setActiveTab("games")}
              >
                משחקים
              </button>
            </nav>
          </div>

          {activeTab === "users" && (
            <>
              <AddUserForm onUserAdded={triggerRefresh} />
              <UsersList users={users} games={games} onUserUpdated={triggerRefresh} />
            </>
          )}
          {activeTab === "predictions" && <PredictionsList predictions={predictions} users={users} games={games} />}
          {activeTab === "games" && <GamesList games={games} />}
        </>
      )}
    </div>
  )
}
