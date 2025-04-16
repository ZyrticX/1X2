"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "./contexts/auth-context"
import { getSupabaseClient } from "./lib/supabaseClient"
import GameTimer from "./components/game-timer"
import Link from "next/link"

const emptyWeeklyGames = {
  sunday: [],
  monday: [],
  tuesday: [],
  wednesday: [],
  thursday: [],
  friday: [],
  saturday: [],
}

const daysOfWeek = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"]

// עדכון הטיפוס למשחק כדי להתאים לשמות השדות במסד הנתונים
interface Game {
  id: string
  homeTeam: string
  awayTeam: string
  time: string
  league: string
  closingTime?: Date
  result?: string
  isFinished?: boolean
  islocked?: boolean // שינוי מ-isLocked ל-islocked
  manuallylocked?: boolean // שינוי מ-manuallyLocked ל-manuallylocked
}

// פונקציית עזר להמרת יום לערך מספרי לצורך השוואה
const getDayOfWeek = () => {
  // Otherwise use the actual day
  const today = new Date()
  const dayOfWeek = today.getDay() // 0 = יום ראשון, 1 = יום שני, וכו'

  const daysMap: Record<number, string> = {
    0: "sunday",
    1: "monday",
    2: "tuesday",
    3: "wednesday",
    4: "friday",
    5: "friday",
    6: "saturday",
  }

  return daysMap[dayOfWeek]
}

// פונקציה להמרת שם יום למספר לצורך השוואה
const dayToNumber = (day: string): number => {
  const daysMap: Record<string, number> = {
    sunday: 0,
    monday: 1,
    tuesday: 2,
    wednesday: 3,
    thursday: 4,
    friday: 5,
    saturday: 6,
  }

  return daysMap[day] || 0
}

const isGameDayReached = (day: string) => {
  // המרת היום הנוכחי למחרוזת באנגלית (sunday, monday, וכו')
  const currentDay = getDayOfWeek()

  // אם היום הנוכחי הוא יום שישי, מאפשרים גם את משחקי שבת
  if (currentDay === "friday" && (day === "friday" || day === "saturday")) {
    return true
  }

  // אחרת, מאפשרים רק את משחקי היום הנוכחי
  return day === currentDay
}

// עדכון פונקציית isGameLocked כדי להשתמש בשמות השדות הנכונים
const isGameLocked = (game: Game) => {
  // בדיקה אם המשחק ננעל ידנית על ידי מנהל
  if (game.manuallylocked) {
    return true
  }

  // בדיקה אם המשחק כבר הסתיים
  if (game.isFinished) {
    return true
  }

  // בדיקה אם המשחק מסומן כנעול
  if (game.islocked) {
    return true
  }

  // בדיקה אם עבר זמן הסגירה
  if (game.closingTime && new Date() > new Date(game.closingTime)) {
    return true
  }

  return false
}

export default function Home() {
  const {
    isAuthenticated,
    isAdmin,
    isPlayer,
    isSuperAdmin,
    userIdentifier,
    logout,
    switchToPlayerMode,
    switchToAdminMode,
    isRoleSelectionRequired,
    adminCode,
  } = useAuth()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("home")
  const [predictions, setPredictions] = useState<Record<string, string>>({})
  const [currentDateTime, setCurrentDateTime] = useState("")
  const [activeDay, setActiveDay] = useState("sunday")
  const [submittedPredictions, setSubmittedPredictions] = useState<Record<string, boolean>>({})
  const [showPredictions, setShowPredictions] = useState<Record<string, boolean>>({})
  const [playersPaid, setPlayersPaid] = useState({ paid: 8, total: 12 })
  const [weeklyGames, setWeeklyGames] = useState(emptyWeeklyGames)
  const [currentWeek, setCurrentWeek] = useState(1)
  const [showLoginPage, setShowLoginPage] = useState(false)
  const [manuallyLockedGames, setManuallyLockedGames] = useState<Record<string, boolean>>({})
  const [games, setGames] = useState(Object.values(weeklyGames).flat())
  const [loadingGames, setLoadingGames] = useState(true)
  const [userName, setUserName] = useState<string>("")

  const [showAdminModal, setShowAdminModal] = useState(false)
  const [adminPassword, setAdminPassword] = useState("")
  const [adminPasswordError, setAdminPasswordError] = useState("")
  const [isSubmittingAdminPassword, setIsSubmittingAdminPassword] = useState(false)
  const adminPasswordRef = useRef<HTMLInputElement>(null)

  // נוסיף פונקציה לטיפול בהגשת הסיסמה:
  const handleAdminPasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setAdminPasswordError("")
    setIsSubmittingAdminPassword(true)

    // בדיקת הסיסמה - "5555" היא הסיסמה החדשה
    if (adminPassword === "5555") {
      // אם הסיסמה נכונה, עבור למצב מנהל
      switchToAdminMode()
      setShowAdminModal(false)
      setAdminPassword("")
      setActiveTab("admin")
    } else {
      setAdminPasswordError("סיסמה שגויה, נסה שנית")
    }

    setIsSubmittingAdminPassword(false)
  }

  // נוסיף useEffect כדי לשים פוקוס על שדה הסיסמה כאשר המודאל נפתח
  useEffect(() => {
    if (showAdminModal && adminPasswordRef.current) {
      adminPasswordRef.current.focus()
    }
  }, [showAdminModal])

  // עדכון מצב הכניסה
  useEffect(() => {
    if (isAuthenticated && router.pathname === "/login") {
      router.push("/")
    }
  }, [isAuthenticated, router])

  // מחיקת כל השימושים ב-localStorage

  // הסרת הקוד הקשור ל-localStorage בטעינת משחקים
  useEffect(() => {
    const loadGamesFromDB = async () => {
      try {
        setLoadingGames(true)
        console.log("Starting to load games...")

        // טעינת משחקים מ-Supabase
        try {
          const supabase = getSupabaseClient()
          if (supabase) {
            // קבל את מספר השבוע הנוכחי (נשתמש ב-1 כברירת מחדל)
            const { data: settingsData, error: settingsError } = await supabase
              .from("settings")
              .select("*")
              .eq("id", "current_week")
              .single()

            const weekNumber = settingsData ? Number.parseInt(settingsData.value) : 1
            setCurrentWeek(weekNumber)
            console.log("Current week:", weekNumber)

            // טעינת המשחקים השבועיים מטבלת WEEKLY_GAMES
            const { data: weeklyGamesData, error: weeklyGamesError } = await supabase
              .from("weekly_games")
              .select("*")
              .eq("week", weekNumber)
              .single()

            if (weeklyGamesError && !weeklyGamesError.message.includes("No rows found")) {
              console.error("Error loading weekly games:", weeklyGamesError)
              setWeeklyGames(emptyWeeklyGames)
              setGames([])
              setLoadingGames(false)
              return
            }

            // אם אין נתונים בטבלת WEEKLY_GAMES, הצג הודעה ריקה
            if (!weeklyGamesData || !weeklyGamesData.games) {
              console.log("No weekly games found for week", weekNumber)
              setWeeklyGames(emptyWeeklyGames)
              setGames([])
              setLoadingGames(false)
              return
            }

            // המרת ה-JSONB של טבלת WEEKLY_GAMES לרשימת מזהים
            const gameIds: string[] = []
            Object.values(weeklyGamesData.games).forEach((dayGames: any) => {
              if (Array.isArray(dayGames)) {
                gameIds.push(...dayGames)
              }
            })

            console.log(`Found ${gameIds.length} game IDs in weekly_games table`)

            // אם אין משחקים בטבלת WEEKLY_GAMES, הצג הודעה ריקה
            if (gameIds.length === 0) {
              console.log("No games found in weekly_games")
              setWeeklyGames(emptyWeeklyGames)
              setGames([])
              setLoadingGames(false)
              return
            }

            // טעינת רק המשחקים שנמצאים ברשימת המזהים מטבלת WEEKLY_GAMES
            const { data: gamesData, error: gamesError } = await supabase
              .from("games")
              .select("*")
              .in("id", gameIds)
              .order("date")

            if (gamesError) {
              console.error("Error loading games:", gamesError)
              setWeeklyGames(emptyWeeklyGames)
              setGames([])
              setLoadingGames(false)
              return
            }

            console.log(`Loaded ${gamesData?.length || 0} games from database`)

            // ארגון המשחקים לפי ימים
            const gamesByDay: Record<string, any[]> = {
              sunday: [],
              monday: [],
              tuesday: [],
              wednesday: [],
              thursday: [],
              friday: [],
              saturday: [],
            }

            gamesData?.forEach((game) => {
              const gameDate = new Date(game.date)
              const day = gameDate.getDay() // 0 = Sunday, 1 = Monday, etc.
              const dayNames = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"]
              const dayName = dayNames[day]

              if (gamesByDay[dayName]) {
                // המרת המשחק לפורמט המתאים לממשק
                gamesByDay[dayName].push({
                  id: game.id,
                  homeTeam: game.hometeam,
                  awayTeam: game.awayteam,
                  time: game.time,
                  league: game.league,
                  closingTime: game.closingtime ? new Date(game.closingtime) : undefined,
                  isFinished: game.isfinished,
                  result: game.result,
                  islocked: game.islocked,
                })
              }
            })

            // עדכון המשחקים השבועיים
            setWeeklyGames(gamesByDay)
            setGames(gamesData || [])
          }
        } catch (error) {
          console.error("Error loading games from Supabase:", error)
          setWeeklyGames(emptyWeeklyGames)
          setGames([])
        }
      } catch (error) {
        console.error("Error loading games:", error)
        setWeeklyGames(emptyWeeklyGames)
        setGames([])
      } finally {
        setLoadingGames(false)
      }
    }

    // טען את המשחקים בטעינה ראשונית
    loadGamesFromDB()
  }, [])

  // טעינת שם המשתמש
  useEffect(() => {
    const fetchUserName = async () => {
      if (!isAuthenticated || !userIdentifier) return

      try {
        const supabase = getSupabaseClient()
        if (!supabase) return

        // בדיקה אם המזהה הוא UUID או קוד שחקן
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(userIdentifier)

        let query
        if (isUUID) {
          query = supabase.from("users").select("name").eq("id", userIdentifier)
        } else {
          query = supabase.from("users").select("name").eq("playercode", userIdentifier)
        }

        const { data, error } = await query

        if (error) {
          console.error("Error fetching user name:", error)
          return
        }

        if (data && data.length > 0) {
          setUserName(data[0].name)
        }
      } catch (error) {
        console.error("Error in fetchUserName:", error)
      }
    }

    fetchUserName()
  }, [isAuthenticated, userIdentifier])

  // פונקציה לרענון מיידי של המשחקים
  const forceRefreshGames = () => {
    const loadGamesFromDB = async () => {
      setLoadingGames(true)
      try {
        const supabase = getSupabaseClient()
        if (supabase) {
          const weekNumber = 1

          // טעינה ישירה מ-Supabase
          const { data: gamesData, error: gamesError } = await supabase
            .from("games")
            .select("*")
            .eq("week", weekNumber)
            .order("date")

          if (gamesError) {
            console.error("Error loading games:", gamesError)
            setWeeklyGames(emptyWeeklyGames)
            setGames([])
            setLoadingGames(false)
            return
          }

          // ארגון המשחקים לפי ימים
          const gamesByDay: Record<string, any[]> = {
            sunday: [],
            monday: [],
            tuesday: [],
            wednesday: [],
            thursday: [],
            friday: [],
            saturday: [],
          }

          gamesData.forEach((game) => {
            const gameDate = new Date(game.date)
            const day = gameDate.getDay()
            const dayNames = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"]
            const dayName = dayNames[day]

            if (gamesByDay[dayName]) {
              // המרת המשחק לפורמט המתאים לממשק
              gamesByDay[dayName].push({
                id: game.id,
                homeTeam: game.hometeam,
                awayTeam: game.awayteam,
                time: game.time,
                league: game.league,
                closingTime: game.closingtime ? new Date(game.closingtime) : undefined,
                isFinished: game.isfinished,
                result: game.result,
                islocked: game.islocked,
              })
            }
          })

          // לאחר הלולאה, נוודא שלכל יום יש רק 3 משחקים
          Object.keys(gamesByDay).forEach((day) => {
            if (gamesByDay[day].length > 3) {
              gamesByDay[day] = gamesByDay[day].slice(0, 3)
            }
          })

          // עדכון המשחקים השבועיים
          setWeeklyGames(gamesByDay)
          setGames(gamesData)
        }
      } catch (error) {
        console.error("Error refreshing games:", error)
        setWeeklyGames(emptyWeeklyGames)
        setGames([])
      } finally {
        setLoadingGames(false)
      }
    }

    loadGamesFromDB()
  }

  useEffect(() => {
    // הגדר את היום הנוכחי כברירת מחדל
    setActiveDay(getDayOfWeek())
  }, [])

  // פונקציה לשמירת ניחוש
  const savePrediction = (gameId: string, prediction: string) => {
    setPredictions((prev) => ({
      ...prev,
      [gameId]: prediction,
    }))
  }

  // עדכון פונקציית submitPrediction - הסרת השימוש ב-localStorage
  const submitPrediction = async (gameId: string) => {
    if (!isAuthenticated || !userIdentifier) {
      alert("יש להתחבר כדי לשלוח ניחושים")
      return
    }

    const prediction = predictions[gameId]
    if (!prediction) {
      alert("יש לבחור ניחוש לפני השליחה")
      return
    }

    try {
      // שמירה ב-Supabase
      const supabase = getSupabaseClient()
      if (supabase) {
        // בדיקה אם המזהה הוא UUID או קוד שחקן
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(userIdentifier)

        let userId = userIdentifier

        // אם המזהה אינו UUID, נחפש את ה-UUID של המשתמש לפי קוד השחקן
        if (!isUUID) {
          console.log("Looking up user by playercode:", userIdentifier)

          const { data: userData, error: userError } = await supabase
            .from("users")
            .select("id")
            .eq("playercode", userIdentifier)
            .limit(1)

          if (userError) {
            console.error("Error finding user by playercode:", userError)
            alert("אירעה שגיאה בזיהוי המשתמש. נסה שוב.")
            return
          }

          if (!userData || userData.length === 0) {
            console.error("No user found with playercode:", userIdentifier)
            alert("לא נמצא משתמש עם קוד זה. אנא פנה למנהל המערכת.")
            return
          }

          userId = userData[0].id
          console.log("Found user ID:", userId)
        }

        // בדיקה אם הניחוש כבר קיים
        const { data: existingPrediction, error: checkError } = await supabase
          .from("predictions")
          .select("*")
          .eq("gameid", gameId)
          .eq("userid", userId)

        if (checkError) {
          console.error("Error checking existing prediction:", checkError)
          alert("אירעה שגיאה בבדיקת ניחושים קיימים. נסה שוב.")
          return
        }

        // הוספת לוגים לדיבוג
        console.log("Submitting prediction:", {
          gameId,
          userId,
          prediction,
          existingPrediction: existingPrediction?.length > 0 ? existingPrediction[0] : null,
        })

        if (existingPrediction && existingPrediction.length > 0) {
          // עדכון ניחוש קיים
          const { data: updateData, error: updateError } = await supabase
            .from("predictions")
            .update({
              prediction,
              timestamp: new Date().toISOString(),
            })
            .eq("id", existingPrediction[0].id)
            .select()

          if (updateError) {
            console.error("Error updating prediction:", updateError)
            alert("אירעה שגיאה בעדכון הניחוש. נסה שוב.")
            return
          }

          console.log("Prediction updated successfully:", updateData)
        } else {
          // יצירת ניחוש חדש
          const { data: insertData, error: insertError } = await supabase
            .from("predictions")
            .insert([
              {
                gameid: gameId,
                userid: userId,
                prediction,
                timestamp: new Date().toISOString(),
              },
            ])
            .select()

          if (insertError) {
            console.error("Error inserting prediction:", insertError)
            alert("אירעה שגיאה בשמירת הניחוש. נסה שוב.")
            return
          }

          console.log("Prediction inserted successfully:", insertData)
        }

        // עדכון המצב המקומי
        setSubmittedPredictions((prev) => ({
          ...prev,
          [gameId]: true,
        }))

        // הוספת הודעת הצלחה למשתמש
        alert("הניחוש נשלח בהצלחה!")
      }
    } catch (error) {
      console.error("Error saving prediction:", error)
      alert("אירעה שגיאה בשמירת הניחוש. נסה שוב.")
    }
  }

  // פונקציה להצגת ניחושים של שחקנים אחרים
  const toggleShowPredictions = (gameId: string) => {
    setShowPredictions((prev) => ({
      ...prev,
      [gameId]: !prev[gameId],
    }))
  }

  // פונקציה לבדיקה אם משחק נעול

  // פונקציה לבדיקה אם יום המשחק הגיע
  const isDayReached = (day: string) => {
    return isGameDayReached(day)
  }

  // פונקציה לבדיקה אם יום המשחק עבר
  const isDayPassed = (day: string) => {
    const currentDay = getDayOfWeek()
    return dayToNumber(day) < dayToNumber(currentDay)
  }

  // פונקציה לבדיקה אם יום המשחק הוא היום
  const isToday = (day: string) => {
    const currentDay = getDayOfWeek()
    return day === currentDay
  }

  // פונקציה לבדיקה אם יום המשחק הוא בעתיד
  const isFutureDay = (day: string) => {
    const currentDay = getDayOfWeek()
    return dayToNumber(day) > dayToNumber(currentDay)
  }

  // פונקציה לבדיקה אם יש משחקים ביום מסוים
  const hasGamesForDay = (day: string) => {
    return weeklyGames[day] && weeklyGames[day].length > 0
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-md p-4">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold">Fantasy Prediction</h1>
          <div className="flex items-center space-x-4">
            {isAuthenticated ? (
              <div className="flex items-center space-x-4">
                <span className="text-sm">שלום, {userName || userIdentifier}</span>
                {isAdmin && (
                  <Link href="/admin" className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm">
                    ממשק מנהל
                  </Link>
                )}
                <button onClick={logout} className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm">
                  התנתק
                </button>
              </div>
            ) : (
              <button
                onClick={() => router.push("/login")}
                className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm"
              >
                התחבר
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto p-4">
        {/* תוכן העמוד הראשי */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">שבוע {currentWeek}</h2>
          <div className="flex flex-wrap gap-2 mb-4">
            {daysOfWeek.map((day) => (
              <button
                key={day}
                onClick={() => setActiveDay(day)}
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  activeDay === day ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                } ${!hasGamesForDay(day) && "opacity-50 cursor-not-allowed"}`}
                disabled={!hasGamesForDay(day)}
              >
                {day === "sunday"
                  ? "ראשון"
                  : day === "monday"
                    ? "שני"
                    : day === "tuesday"
                      ? "שלישי"
                      : day === "wednesday"
                        ? "רביעי"
                        : day === "thursday"
                          ? "חמישי"
                          : day === "friday"
                            ? "שישי"
                            : "שבת"}
              </button>
            ))}
          </div>

          {/* הצגת המשחקים של היום הנבחר */}
          <div className="space-y-6">
            {weeklyGames[activeDay] && weeklyGames[activeDay].length > 0 ? (
              weeklyGames[activeDay].map((game: Game) => (
                <div key={game.id} className="border rounded-lg p-4 bg-gray-50">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-500">{game.league}</span>
                    <span className="text-sm font-medium">{game.time}</span>
                  </div>
                  <div className="flex justify-between items-center mb-4">
                    <div className="text-lg font-medium">{game.homeTeam}</div>
                    <div className="text-sm">VS</div>
                    <div className="text-lg font-medium">{game.awayTeam}</div>
                  </div>

                  {/* טיימר למשחק */}
                  {game.closingTime && (
                    <GameTimer
                      closingTime={game.closingTime}
                      isPastDay={isDayPassed(activeDay)}
                      isManuallyLocked={game.manuallylocked} // שינוי מ-manuallyLockedGames[game.id] ל-game.manuallylocked
                    />
                  )}

                  {/* אפשרויות ניחוש */}
                  {!isGameLocked(game) && !isDayPassed(activeDay) && isAuthenticated ? (
                    <div className="flex flex-col space-y-2">
                      <div className="flex justify-between space-x-2">
                        <button
                          onClick={() => savePrediction(game.id, "1")}
                          className={`flex-1 py-2 rounded ${
                            predictions[game.id] === "1" ? "bg-blue-500 text-white" : "bg-gray-200 hover:bg-gray-300"
                          }`}
                        >
                          ניצחון {game.homeTeam}
                        </button>
                        <button
                          onClick={() => savePrediction(game.id, "X")}
                          className={`flex-1 py-2 rounded ${
                            predictions[game.id] === "X" ? "bg-blue-500 text-white" : "bg-gray-200 hover:bg-gray-300"
                          }`}
                        >
                          תיקו
                        </button>
                        <button
                          onClick={() => savePrediction(game.id, "2")}
                          className={`flex-1 py-2 rounded ${
                            predictions[game.id] === "2" ? "bg-blue-500 text-white" : "bg-gray-200 hover:bg-gray-300"
                          }`}
                        >
                          ניצחון {game.awayTeam}
                        </button>
                      </div>
                      <button
                        onClick={() => submitPrediction(game.id)}
                        disabled={!predictions[game.id] || submittedPredictions[game.id]}
                        className={`w-full py-2 rounded ${
                          !predictions[game.id] || submittedPredictions[game.id]
                            ? "bg-gray-300 cursor-not-allowed"
                            : "bg-green-500 hover:bg-green-600 text-white"
                        }`}
                      >
                        {submittedPredictions[game.id] ? "הניחוש נשלח" : "שלח ניחוש"}
                      </button>
                    </div>
                  ) : (
                    <div className="text-center py-2 bg-gray-200 rounded">
                      {isAuthenticated ? (
                        game.result ? (
                          <div className="font-bold">תוצאה: {game.result}</div>
                        ) : (
                          <div>המשחק סגור להימורים</div>
                        )
                      ) : (
                        <div>יש להתחבר כדי לנחש</div>
                      )}
                    </div>
                  )}

                  {/* הצגת ניחושים של שחקנים אחרים */}
                  {isAuthenticated && (
                    <div className="mt-4">
                      <button
                        onClick={() => toggleShowPredictions(game.id)}
                        className="text-sm text-blue-500 hover:underline"
                      >
                        {showPredictions[game.id] ? "הסתר ניחושים" : "הצג ניחושים של שחקנים אחרים"}
                      </button>
                      {showPredictions[game.id] && (
                        <div className="mt-2 text-sm">
                          <p>אין ניחושים להצגה</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">אין משחקים להצגה ביום זה</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
