"use client"

import { useState, useEffect } from "react"
import { getSupabaseClient } from "../lib/supabase"

export default function DatabaseInitializer() {
  const [isChecking, setIsChecking] = useState(true)
  const [needsInitialization, setNeedsInitialization] = useState(false)
  const [isInitializing, setIsInitializing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    // עדכון הפונקציה checkDatabase כדי לבדוק ספציפית את טבלת weekly_games
    const checkDatabase = async () => {
      setIsChecking(true)
      try {
        const supabase = getSupabaseClient()
        if (!supabase) {
          throw new Error("Supabase client is not available")
        }

        // בדיקה אם טבלת weekly_games קיימת
        const { error: weeklyGamesError } = await supabase
          .from("weekly_games")
          .select("count", { count: "exact", head: true })

        if (weeklyGamesError && weeklyGamesError.message.includes("does not exist")) {
          console.log("weekly_games table does not exist, initialization needed")
          setNeedsInitialization(true)
        } else {
          console.log("weekly_games table exists, no initialization needed")
          setNeedsInitialization(false)
        }

        // בדיקה אם המשתמש הסופר אדמין קיים
        const { data: adminUser, error: adminError } = await supabase
          .from("users")
          .select("*")
          .eq("playercode", "323317966")
          .single()

        if (adminError || !adminUser) {
          console.log("Super admin user does not exist, creating...")
          // יצירת משתמש סופר אדמין אם הוא לא קיים
          const { error: createError } = await supabase.from("users").insert([
            {
              name: "מנהל ראשי",
              playercode: "323317966",
              status: "active",
              points: 0,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
          ])

          if (createError) {
            console.error("Error creating super admin user:", createError)
          } else {
            console.log("Super admin user created successfully")
          }
        } else {
          console.log("Super admin user exists:", adminUser)
        }
      } catch (err) {
        console.error("Error checking database:", err)
        setError("שגיאה בבדיקת מסד הנתונים")
        setNeedsInitialization(true)
      } finally {
        setIsChecking(false)
      }
    }

    checkDatabase()
  }, [])

  const initializeDatabase = async () => {
    setIsInitializing(true)
    setError(null)

    try {
      const supabase = getSupabaseClient()
      if (!supabase) {
        throw new Error("Supabase client is not available")
      }

      // יצירת טבלת weekly_games בלבד
      const createWeeklyGamesTable = `
     CREATE TABLE IF NOT EXISTS weekly_games (
       id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
       week INTEGER NOT NULL,
       games JSONB NOT NULL,
       created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
       updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
     );
     
     CREATE INDEX IF NOT EXISTS weekly_games_week_idx ON weekly_games(week);
   `

      // ניסיון ליצור את הטבלה
      try {
        console.log("Attempting to create weekly_games table...")

        // נסה להשתמש ב-RPC אם זמין
        const { data: hasRpc, error: rpcCheckError } = await supabase.rpc("exec_sql", {
          query: "SELECT 1",
        })

        if (!rpcCheckError) {
          // אם ה-RPC זמין, השתמש בו ליצירת הטבלה
          const { error: weeklyGamesError } = await supabase.rpc("exec_sql", {
            query: createWeeklyGamesTable,
          })

          if (weeklyGamesError) {
            console.error("Error creating weekly_games table via RPC:", weeklyGamesError)
            throw new Error("שגיאה ביצירת טבלת משחקים שבועיים: " + weeklyGamesError.message)
          }
        } else {
          // אם ה-RPC לא זמין, נסה להשתמש ב-SQL ישיר
          console.log("RPC not available, trying direct SQL...")
          const { error: sqlError } = await supabase.from("weekly_games").insert([
            {
              week: 1,
              games: {},
            },
          ])

          if (sqlError && !sqlError.message.includes("already exists")) {
            console.error("Error creating weekly_games table via direct SQL:", sqlError)
            throw new Error("שגיאה ביצירת טבלת משחקים שבועיים: " + sqlError.message)
          }
        }

        // יצירת משתמש סופר אדמין אם הוא לא קיים
        const { data: adminUser, error: adminError } = await supabase
          .from("users")
          .select("*")
          .eq("playercode", "323317966")
          .single()

        if (adminError || !adminUser) {
          console.log("Creating super admin user during initialization...")
          const { error: createError } = await supabase.from("users").insert([
            {
              name: "מנהל ראשי",
              playercode: "323317966",
              status: "active",
              points: 0,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
          ])

          if (createError) {
            console.error("Error creating super admin user:", createError)
          } else {
            console.log("Super admin user created successfully during initialization")
          }
        }

        console.log("weekly_games table created successfully")
        setSuccess(true)
        setNeedsInitialization(false)
      } catch (sqlError) {
        console.error("SQL execution error:", sqlError)

        // אם אין הרשאות SQL, הצע לייבא את הסקריפט ידנית
        setError(`אין הרשאות ליצירת טבלאות או שאירעה שגיאה. יש לייבא את הסקריפט ידנית דרך ממשק ה-SQL של Supabase.
     
     הסקריפט נמצא בקובץ scripts/create_weekly_games_table.sql`)
      }
    } catch (err) {
      console.error("Error initializing database:", err)
      setError(err instanceof Error ? err.message : "שגיאה לא ידועה")
    } finally {
      setIsInitializing(false)
    }
  }

  if (isChecking) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-navy-600 mx-auto mb-4"></div>
          <p className="text-lg font-medium">בודק את מסד הנתונים...</p>
        </div>
      </div>
    )
  }

  if (needsInitialization && !success) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
          <h3 className="text-xl font-bold mb-4">אתחול מסד נתונים</h3>
          <p className="mb-4">מסד הנתונים חסר את הטבלאות הנדרשות. האם ברצונך לנסות ליצור אותן?</p>

          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md">
              <p className="whitespace-pre-line">{error}</p>
              <p className="mt-2 text-sm">
                אם אין לך הרשאות ליצירת טבלאות, תוכל להשתמש בסקריפט SQL מהקובץ scripts/create_tables.sql וליצור את
                הטבלאות דרך ממשק ה-SQL של Supabase.
              </p>
            </div>
          )}

          <div className="flex justify-end space-x-2 rtl:space-x-reverse">
            <button
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
              onClick={() => setNeedsInitialization(false)}
            >
              המשך ללא אתחול
            </button>
            <button
              className="px-4 py-2 bg-navy-600 text-white rounded-md hover:bg-navy-700"
              onClick={initializeDatabase}
              disabled={isInitializing}
            >
              {isInitializing ? (
                <>
                  <span className="inline-block animate-spin mr-2">⟳</span> מאתחל...
                </>
              ) : (
                "אתחל מסד נתונים"
              )}
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full text-center">
          <svg
            className="w-16 h-16 text-green-500 mx-auto mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <h3 className="text-xl font-bold mb-2">אתחול הושלם בהצלחה!</h3>
          <p className="mb-4">מסד הנתונים אותחל עם הטבלאות הנדרשות.</p>
          <button
            className="px-4 py-2 bg-navy-600 text-white rounded-md hover:bg-navy-700"
            onClick={() => setSuccess(false)}
          >
            המשך
          </button>
        </div>
      </div>
    )
  }

  return null
}
