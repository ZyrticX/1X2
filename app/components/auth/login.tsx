"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "../../contexts/auth-context"
import { AlertCircle, Key, Lock } from "lucide-react"
import { getSupabaseClient } from "@/lib/supabaseClient"

export default function Login() {
  const [code, setCode] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [showPasswordInput, setShowPasswordInput] = useState(false)
  const { loginWithCode, loginAsAdmin } = useAuth()
  const router = useRouter()

  // קוד המנהל הראשי שדורש סיסמה
  const MAIN_ADMIN_CODE = "50244100"
  // הסיסמה הנדרשת למנהל הראשי - תיקון לפלוגות5
  const ADMIN_PASSWORD = "פלוגות5"

  // נוסיף פונקציה לבדיקת קוד משתמש במסד הנתונים

  const handleUserLogin = (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    // בדיקת תקינות הקוד
    if (!code.trim()) {
      setError("יש להזין קוד משתמש")
      setIsLoading(false)
      return
    }

    // וידוא שהקוד מכיל 8 או 9 ספרות (עבור סופר אדמין)
    if (!/^\d{8,9}$/.test(code) && code !== "123456") {
      setError("קוד משתמש חייב להכיל 8 או 9 ספרות")
      setIsLoading(false)
      return
    }

    // בדיקה אם זה קוד המנהל הראשי
    if (code === MAIN_ADMIN_CODE) {
      // אם זה קוד המנהל הראשי, הצג את שדה הסיסמה
      setShowPasswordInput(true)
      setIsLoading(false)
      return
    }

    // ניסיון התחברות לקודים אחרים
    setTimeout(async () => {
      const success = loginWithCode(code)

      if (success) {
        router.push("/")
      } else {
        // אם ההתחברות נכשלה, בדוק אם הקוד קיים במסד הנתונים
        try {
          const supabase = getSupabaseClient()
          if (supabase) {
            const { data, error } = await supabase.from("users").select("*").eq("playercode", code).limit(1)

            if (error) {
              console.error("Error checking user code:", error)
              setError("קוד משתמש שגוי, נסה שנית")
            } else if (data && data.length > 0) {
              // אם נמצא משתמש, נוסיף את הקוד לרשימת הקודים המורשים
              const storedCodes = localStorage.getItem("validPlayerCodes")
              const dynamicCodes = storedCodes ? JSON.parse(storedCodes) : []
              if (!dynamicCodes.includes(code)) {
                dynamicCodes.push(code)
                localStorage.setItem("validPlayerCodes", JSON.stringify(dynamicCodes))
              }

              // ננסה להתחבר שוב
              const retrySuccess = loginWithCode(code)
              if (retrySuccess) {
                router.push("/")
              } else {
                setError("קוד משתמש נמצא אך ההתחברות נכשלה, נסה שנית")
              }
            } else {
              setError("קוד משתמש שגוי, נסה שנית")
            }
          } else {
            setError("קוד משתמש שגוי, נסה שנית")
          }
        } catch (err) {
          console.error("Error in database check:", err)
          setError("קוד משתמש שגוי, נסה שנית")
        }
      }
      setIsLoading(false)
    }, 800) // דימוי עיכוב רשת
  }

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    // בדיקת הסיסמה
    if (password === ADMIN_PASSWORD) {
      // אם הסיסמה נכונה, התחבר ישירות כמנהל (ללא מסך בחירת תפקיד)
      setTimeout(() => {
        const success = loginAsAdmin(MAIN_ADMIN_CODE)
        if (success) {
          router.push("/")
        } else {
          setError("אירעה שגיאה בהתחברות, נסה שנית")
        }
        setIsLoading(false)
      }, 800) // דימוי עיכוב רשת
    } else {
      setError("סיסמה שגויה, נסה שנית")
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4" dir="rtl">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="bg-navy-600 p-6 text-white text-center">
          <h1 className="text-2xl font-bold">ניחושים בין החברים</h1>
          <p className="mt-2 opacity-90">כניסה למערכת</p>
        </div>

        <div className="p-6">
          <div className="mb-6 text-center">
            <div className="w-16 h-16 bg-navy-100 rounded-full flex items-center justify-center mx-auto mb-4">
              {showPasswordInput ? (
                <Lock className="w-8 h-8 text-navy-600" />
              ) : (
                <Key className="w-8 h-8 text-navy-600" />
              )}
            </div>
            {showPasswordInput ? (
              <>
                <h2 className="text-xl font-bold text-gray-800">אימות מנהל ראשי</h2>
                <p className="text-gray-600 text-sm mt-1">הזן את סיסמת המנהל הראשי</p>
              </>
            ) : (
              <>
                <h2 className="text-xl font-bold text-gray-800">כניסה באמצעות קוד משתמש</h2>
                <p className="text-gray-600 text-sm mt-1">הזן את הקוד שקיבלת ממנהל המערכת</p>
              </>
            )}
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md flex items-center">
              <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {showPasswordInput ? (
            <form onSubmit={handlePasswordSubmit}>
              <div className="mb-4">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  סיסמת מנהל
                </label>
                <input
                  type="password"
                  id="password"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-navy-500 focus:border-navy-500"
                  placeholder="הזן סיסמת מנהל"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoFocus
                />
              </div>

              <div className="flex space-x-2 rtl:space-x-reverse">
                <button
                  type="button"
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
                  onClick={() => {
                    setShowPasswordInput(false)
                    setPassword("")
                    setError("")
                  }}
                >
                  חזרה
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-navy-600 text-white rounded-md hover:bg-navy-700 transition-colors"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center">
                      <svg
                        className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      מתחבר...
                    </span>
                  ) : (
                    "אישור"
                  )}
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleUserLogin}>
              <div className="mb-4">
                <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-1">
                  קוד משתמש
                </label>
                <input
                  type="text"
                  id="code"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-navy-500 focus:border-navy-500"
                  placeholder="הזן קוד בן 8 או 9 ספרות"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  maxLength={9}
                  pattern="\d{8,9}"
                  title="קוד משתמש חייב להכיל 8 או 9 ספרות"
                />
                <p className="text-xs text-gray-500 mt-1">הקוד חייב להכיל 8 או 9 ספרות</p>
              </div>

              <button
                type="submit"
                className="w-full bg-navy-600 text-white py-2 px-4 rounded-md hover:bg-navy-700 focus:outline-none focus:ring-2 focus:ring-navy-500 focus:ring-offset-2 transition-colors"
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="flex items-center justify-center">
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    מתחבר...
                  </span>
                ) : (
                  "כניסה"
                )}
              </button>
            </form>
          )}

          <div className="mt-6 text-center text-sm text-gray-500">
            <p>אם אין לך קוד משתמש, פנה למנהל המערכת</p>
          </div>
        </div>
      </div>
    </div>
  )
}
