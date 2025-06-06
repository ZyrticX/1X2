"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { getSupabaseClient } from "../lib/supabase" // תיקון הנתיב לקובץ supabase

// רשימת קודי משתמשים מאושרים - במערכת אמיתית זה יגיע מהשרת/מסד נתונים
const VALID_CODES = ["12345678", "87654321", "11223344", "55667788", "99887766"]

// עדכון קודי המנהל - הוספת Super Admin
// קודי מנהל מיוחדים - רק 50244100 ו-323317966 יהיו מנהלים עם גישה מלאה
const ADMIN_CODES = ["123456", "50244100", "12345678", "323317966"]

// הוספת רשימת Super Admin - כולל קוד 9 ספרות
const SUPER_ADMIN_CODES = ["323317966", "987654321"] // יבגני וקוד 9 ספרות - Super Admin

// עדכון הטיפוס AuthContextType להוספת תכונת isSuperAdmin
type AuthContextType = {
  isAuthenticated: boolean
  isAdmin: boolean
  isPlayer: boolean
  isSuperAdmin: boolean // הוספת תכונה חדשה
  userIdentifier: string | null
  adminCode: string | null
  isRoleSelectionRequired: boolean
  loginWithCode: (code: string) => boolean
  loginAsAdmin: (code: string) => boolean
  switchToPlayerMode: () => void
  switchToAdminMode: () => void
  selectRole: (role: "admin" | "player") => void
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// עדכון ה-Provider להוספת תכונת isSuperAdmin
export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [isPlayer, setIsPlayer] = useState(false)
  const [isSuperAdmin, setIsSuperAdmin] = useState(false) // הוספת state חדש
  const [userIdentifier, setUserIdentifier] = useState<string | null>(null)
  const [adminCode, setAdminCode] = useState<string | null>(null)
  const [isRoleSelectionRequired, setIsRoleSelectionRequired] = useState(false)

  // בדיקה אם המשתמש כבר מחובר (מהלוקל סטורג')
  useEffect(() => {
    // בדיקת אימות מול Supabase בטעינה ראשונית
    const checkAuthState = async () => {
      try {
        const supabase = getSupabaseClient()
        if (!supabase) return

        // בדיקה אם יש משתמש מחובר בסשן
        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (session) {
          // אם יש סשן פעיל, נשתמש במידע מהסשן
          const userMetadata = session.user?.user_metadata
          if (userMetadata) {
            setUserIdentifier(userMetadata.playercode || session.user?.id)
            setIsAuthenticated(true)
            setIsAdmin(userMetadata.role === "admin")
            setIsPlayer(userMetadata.role === "player" || userMetadata.role === "admin-player")
            setIsSuperAdmin(SUPER_ADMIN_CODES.includes(userMetadata.playercode || ""))

            if (userMetadata.adminCode) {
              setAdminCode(userMetadata.adminCode)
            }
          }
        }
      } catch (error) {
        console.error("Error checking auth state:", error)
      }
    }

    checkAuthState()
  }, [])

  // פונקציית התחברות עם קוד
  const loginWithCode = (code: string): boolean => {
    // בדיקה אם הקוד תקין
    const isAdminCode = ADMIN_CODES.includes(code)
    const isSuperAdminCode = SUPER_ADMIN_CODES.includes(code)

    if (VALID_CODES.includes(code) || isAdminCode || isSuperAdminCode) {
      setUserIdentifier(code)
      setIsAuthenticated(true)
      setIsSuperAdmin(isSuperAdminCode)

      if (isAdminCode || isSuperAdminCode) {
        setAdminCode(code)

        if (isSuperAdminCode) {
          setIsAdmin(true)
          setIsPlayer(true)
          setIsRoleSelectionRequired(false)
        } else {
          setIsRoleSelectionRequired(true)
          setIsAdmin(false)
          setIsPlayer(false)
        }
      } else {
        setIsPlayer(true)
        setIsAdmin(false)
      }

      // שמירת מצב האימות ב-Supabase אם צריך
      const supabase = getSupabaseClient()
      if (supabase) {
        // אפשר להשתמש ב-custom claims או ב-metadata
        // לדוגמה:
        // supabase.auth.updateUser({
        //   data: {
        //     playercode: code,
        //     role: isAdminCode || isSuperAdminCode ? "admin" : "player",
        //     adminCode: isAdminCode || isSuperAdminCode ? code : null
        //   }
        // });
      }

      return true
    }

    // בדיקה מול מסד הנתונים
    checkUserCodeInDatabase(code)
    return false
  }

  // פונקציה חדשה לבדיקת קוד משתמש במסד הנתונים
  const checkUserCodeInDatabase = async (code: string) => {
    try {
      if (typeof window === "undefined") return

      // בדיקה אם Supabase זמין
      const supabase = getSupabaseClient()
      if (!supabase) {
        console.error("Supabase client is not available")
        return
      }

      try {
        // בדיקה אם הקוד קיים במסד הנתונים
        const { data, error } = await supabase.from("users").select("*").eq("playercode", code).limit(1)

        if (error) {
          console.error("Error checking user code:", error)
          return
        }

        // אם נמצא משתמש עם הקוד הזה
        if (data && data.length > 0) {
          console.log("User found in database:", data[0])

          // עדכון המצב כאילו התחברנו בהצלחה
          setUserIdentifier(code)
          setIsAuthenticated(true)
          setIsPlayer(true)
          setIsAdmin(false)

          // שמירה בלוקל סטורג'
          // localStorage.setItem("userType", "player")
          // localStorage.setItem("userIdentifier", code)

          // הוספת הקוד לרשימת הקודים המורשים בלוקל סטורג'
          const storedCodes = localStorage.getItem("validPlayerCodes")
          const dynamicCodes = storedCodes ? JSON.parse(storedCodes) : []
          if (!dynamicCodes.includes(code)) {
            dynamicCodes.push(code)
            localStorage.setItem("validPlayerCodes", JSON.stringify(dynamicCodes))
          }

          // גורם לדף להתרענן כדי להציג את המצב המעודכן
          window.location.reload()
        }
      } catch (dbError) {
        console.error("Database operation failed:", dbError)
        // אם יש שגיאה בבדיקה במסד הנתונים, נמשיך כרגיל
      }
    } catch (error) {
      console.error("Error in checkUserCodeInDatabase:", error)
    }
  }

  // פונקציה חדשה להתחברות ישירה כמנהל
  const loginAsAdmin = (code: string): boolean => {
    // וידוא שזה קוד מנהל תקף
    if (ADMIN_CODES.includes(code) || SUPER_ADMIN_CODES.includes(code)) {
      setUserIdentifier(code)
      setIsAuthenticated(true)
      setIsAdmin(true)
      setIsPlayer(true)
      setAdminCode(code)
      setIsRoleSelectionRequired(false)

      // בדיקה אם המשתמש הוא Super Admin
      setIsSuperAdmin(SUPER_ADMIN_CODES.includes(code))

      // localStorage.setItem("userIdentifier", code)
      // localStorage.setItem("adminCode", code)
      // localStorage.setItem("userType", "admin")

      return true
    }
    return false
  }

  // פונקציה לבחירת תפקיד
  const selectRole = (role: "admin" | "player") => {
    if (adminCode) {
      if (role === "admin") {
        setIsAdmin(true)
        setIsPlayer(true)
      } else {
        setIsAdmin(false)
        setIsPlayer(true)
      }
      setIsRoleSelectionRequired(false)

      // עדכון ב-Supabase אם צריך
    }
  }

  // פונקציה למעבר למצב שחקן
  const switchToPlayerMode = () => {
    if (adminCode) {
      setIsAdmin(false)
      setIsPlayer(true)
      // שמירת סוג המשתמש כמנהל-שחקן, אבל שמירת קוד המנהל
      // localStorage.setItem("userType", "admin-player")
      // חשוב: לא מוחקים את adminCode מהלוקל סטורג'
    }
  }

  // פונקציה למעבר למצב מנהל
  const switchToAdminMode = () => {
    if (adminCode) {
      setIsAdmin(true)
      setIsPlayer(true)
      // localStorage.setItem("userType", "admin")
    }
  }

  // פונקציית התנתקות
  const logout = () => {
    setUserIdentifier(null)
    setIsAuthenticated(false)
    setIsAdmin(false)
    setIsPlayer(false)
    setIsSuperAdmin(false)
    setAdminCode(null)
    setIsRoleSelectionRequired(false)

    // ניתוק מ-Supabase אם צריך
    const supabase = getSupabaseClient()
    if (supabase) {
      supabase.auth.signOut()
    }
  }

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        isAdmin,
        isPlayer,
        isSuperAdmin, // הוספת התכונה החדשה לקונטקסט
        userIdentifier,
        adminCode,
        isRoleSelectionRequired,
        loginWithCode,
        loginAsAdmin,
        switchToPlayerMode,
        switchToAdminMode,
        selectRole,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

// הוק לשימוש בקונטקסט
export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
