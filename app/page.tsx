"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Calendar, LogIn, Bell, Lock, Eye, AlertCircle, Clock } from "lucide-react"
import { useRouter } from "next/navigation"
import { useAuth } from "./contexts/auth-context"
import Leaderboard from "./components/leaderboard-with-mock"
import PredictionHistory from "./components/prediction-history"
import Login from "./components/auth/login"
import RoleSelection from "./components/auth/role-selection"
import AdminDashboard from "./components/admin/admin-dashboard"
import GameTimer from "./components/game-timer"
import { submitPrediction } from "./utils/api"
import DatabaseInitializer from "./components/database-initializer"
import { getSupabaseClient } from "./utils/supabaseClient"

// Updated mock data for weekly games with closing times and mock predictions
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

// Mock data for other players' predictions
const mockOtherPredictions: Record<
  string,
  Array<{ playerName: string; prediction: string; submissionTime: string }>
> = {}

// טיפוס למשחק
interface Game {
  id: string
  homeTeam: string
  awayTeam: string
  time: string
  league: string
  closingTime: Date
  result?: string
  isFinished?: boolean
  manuallyLocked?: boolean
}

// פונקציית עזר להמרת יום לערך מספרי לצורך השוואה
const getDayOfWeek = () => {
  // Check if there's a system day set by super admin
  if (typeof window !== "undefined") {
    const systemDay = localStorage.getItem("currentSystemDay")
    if (systemDay) {
      return systemDay
    }
  }

  // Otherwise use the actual day
  const today = new Date()
  const dayOfWeek = today.getDay() // 0 = יום ראשון, 1 = יום שני, וכו'

  const daysMap: Record<number, string> = {
    0: "sunday",
    1: "monday",
    2: "tuesday",
    3: "wednesday",
    4: "thursday",
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

// הוספת הצגת מספר השבוע הנוכחי בעמוד הראשי
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
    setShowLoginPage(!isAuthenticated)
  }, [isAuthenticated])

  // Add a function to check localStorage contents for debugging
  // Add this function near the top of the component:

  const debugLocalStorage = () => {
    if (typeof window === "undefined") return

    console.log("--- DEBUG LOCALSTORAGE ---")

    // Check for selectedGames_week_X entries
    const weekKeys = Object.keys(localStorage).filter((key) => key.startsWith("selectedGames_week_"))
    console.log("Week keys:", weekKeys)

    weekKeys.forEach((key) => {
      try {
        const data = JSON.parse(localStorage.getItem(key) || "{}")
        const gameCount = Object.values(data).flat().length
        console.log(`${key}: ${gameCount} games`)
        console.log("Sample data:", data)
      } catch (e) {
        console.error(`Error parsing ${key}:`, e)
      }
    })

    // Check games, cachedGames, cachedGamesByDay
    ;["games", "cachedGames", "cachedGamesByDay"].forEach((key) => {
      try {
        const data = JSON.parse(localStorage.getItem(key) || "{}")
        if (Array.isArray(data)) {
          console.log(`${key}: ${data.length} items`)
        } else {
          console.log(`${key}: Object with ${Object.keys(data).length} keys`)
        }
      } catch (e) {
        console.error(`Error parsing ${key}:`, e)
      }
    })

    console.log("--- END DEBUG ---")
  }

  // עדכון useEffect שטוען את המשחקים
  useEffect(() => {
    debugLocalStorage()

    const loadGamesFromDB = async () => {
      try {
        setLoadingGames(true)
        console.log("Starting to load games...")

        // ראשית, ננסה לטעון משחקים מ-Supabase
        let gamesLoaded = false

        try {
          const supabase = getSupabaseClient()
          if (supabase) {
            // קבל את מספר השבוע הנוכחי
            const storedWeek = localStorage.getItem("currentWeek") || "1"
            const weekNumber = Number.parseInt(storedWeek)

            console.log("Attempting to load games for week:", weekNumber)

            // נסה לטעון את המשחקים ישירות מטבלת games
            try {
              // בדיקה אם עמודת week קיימת
              const { data: columnsData, error: columnsError } = await supabase.rpc("get_table_columns", {
                table_name: "games",
              })

              let hasWeekColumn = false
              if (!columnsError && columnsData) {
                hasWeekColumn = columnsData.some((col: any) => col.column_name === "week")
              }

              // אם עמודת week לא קיימת, טען את כל המשחקים ללא סינון
              let gamesQuery
              if (hasWeekColumn) {
                // Only get games where week is explicitly set to the current week number
                // and is not null
                gamesQuery = supabase.from("games").select("*").eq("week", weekNumber).not("week", "is", null)
              } else {
                console.log("Week column does not exist, loading all games")
                gamesQuery = supabase.from("games").select("*")
              }

              const { data: gamesData, error: gamesError } = await gamesQuery

              if (gamesError) {
                if (gamesError.message.includes("does not exist")) {
                  console.log("games table does not exist, falling back to localStorage")
                  // במקום לזרוק שגיאה, פשוט נמשיך לטעינה מהלוקל סטורג'
                } else {
                  console.error("Error loading games:", gamesError)
                }
                // בכל מקרה של שגיאה, נמשיך לטעינה מהלוקל סטורג'
              } else if (gamesData && gamesData.length > 0) {
                console.log("Loaded games from Supabase:", gamesData)
                console.log(
                  "Games count by week:",
                  gamesData.reduce((acc, game) => {
                    acc[game.week || "null"] = (acc[game.week || "null"] || 0) + 1
                    return acc
                  }, {}),
                )

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

                // Check if we have selectedGames in localStorage
                const storedSelectedGames = localStorage.getItem(`selectedGames_week_${weekNumber}`)
                let selectedGameIds: string[] = []

                if (storedSelectedGames) {
                  try {
                    const parsedSelectedGames = JSON.parse(storedSelectedGames)
                    // Flatten the object to get all selected game IDs
                    selectedGameIds = Object.values(parsedSelectedGames).flat() as string[]
                    console.log(`Found ${selectedGameIds.length} selected games in localStorage for week ${weekNumber}`)
                  } catch (e) {
                    console.error("Error parsing selectedGames from localStorage:", e)
                  }
                }

                // Filter games to only include selected ones if we have a selection
                const filteredGamesData =
                  selectedGameIds.length > 0 ? gamesData.filter((game) => selectedGameIds.includes(game.id)) : gamesData

                console.log(`Filtered from ${gamesData.length} to ${filteredGamesData.length} games based on selection`)

                // Now organize by day
                filteredGamesData.forEach((game) => {
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
                      closingTime: new Date(game.closingtime),
                      isFinished: game.isfinished,
                      result: game.result,
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

                // שמירה בלוקל סטורג' לשימוש במקרה של בעיות תקשורת
                localStorage.setItem("cachedGames", JSON.stringify(gamesData))
                localStorage.setItem("cachedGamesByDay", JSON.stringify(gamesByDay))
                localStorage.setItem("lastGamesUpdate", new Date().toISOString())

                gamesLoaded = true
                console.log("Successfully loaded and cached games from Supabase")
                return // נצא מהפונקציה אם הטעינה הצליחה
              } else {
                console.log("No games found for week", weekNumber)
                // נמשיך לטעינה מהלוקל סטורג'
              }
            } catch (gamesError) {
              console.error("Error in games query:", gamesError)
              // נמשיך לטעינה מהלוקל סטורג'
            }
          }
        } catch (supabaseError) {
          console.error("Error loading games from Supabase:", supabaseError)
          // נמשיך לטעינה מהלוקל סטורג'
        }

        // אם לא הצלחנו לטעון מ-Supabase, ננסה לטעון מהלוקל סטורג'
        if (!gamesLoaded) {
          console.log("Attempting to load games from localStorage")
          try {
            // נסה לטעון מהמטמון המקומי קודם (מהטעינה האחרונה המוצלחת מ-Supabase)
            const cachedGames = localStorage.getItem("cachedGames")
            const cachedGamesByDay = localStorage.getItem("cachedGamesByDay")

            if (cachedGames && cachedGamesByDay) {
              console.log("Using cached games from previous Supabase load")
              setGames(JSON.parse(cachedGames))
              setWeeklyGames(JSON.parse(cachedGamesByDay))
              gamesLoaded = true
            } else {
              // קבל את מספר השבוע הנוכחי
              const storedWeek = localStorage.getItem("currentWeek") || "1"
              const weekNumber = Number.parseInt(storedWeek)

              // טען את המשחקים השבועיים מהלוקל סטורג'
              const storedSelectedGames = localStorage.getItem(`selectedGames_week_${weekNumber}`)
              const storedGames = localStorage.getItem("games")

              if (storedSelectedGames && storedGames) {
                const selectedGames = JSON.parse(storedSelectedGames)
                const allGames = JSON.parse(storedGames)

                console.log("Loaded games from localStorage:", allGames)

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

                // עבור על כל הימים והמשחקים הנבחרים
                for (const [day, gameIds] of Object.entries(selectedGames)) {
                  if (!gameIds.length) continue

                  // עבור על כל המשחקים הנבחרים ליום זה
                  for (const gameId of gameIds as string[]) {
                    // מצא את המשחק במערך המשחקים
                    const gameData = allGames.find((g: any) => g.id === gameId)

                    if (gameData) {
                      gamesByDay[day].push({
                        id: gameData.id,
                        homeTeam: gameData.hometeam,
                        awayTeam: gameData.awayteam,
                        time: gameData.time,
                        league: gameData.league,
                        closingTime: new Date(gameData.closingtime),
                        isFinished: gameData.isfinished,
                        result: gameData.result,
                      })
                    }
                  }
                }

                // עדכון המשחקים השבועיים
                setWeeklyGames(gamesByDay)
                setGames(allGames)
                gamesLoaded = true
                console.log("Successfully loaded games from localStorage")
              } else {
                console.log("No games found in localStorage")
              }
            }
          } catch (localStorageError) {
            console.error("Error loading games from localStorage:", localStorageError)
          }
        }

        // אם עדיין לא הצלחנו לטעון משחקים, השתמש במשחקי ברירת המחדל
        if (!gamesLoaded) {
          console.log("No games available")
          setWeeklyGames(emptyWeeklyGames)
          setGames([])
        }
      } catch (error) {
        console.error("Error loading games:", error)
        // Fallback to empty data in case of any error
        setWeeklyGames(emptyWeeklyGames)
        setGames([])
      } finally {
        setLoadingGames(false)
      }
    }

    // פונקציה לבדיקת עדכונים במשחקים
    const checkForGameUpdates = () => {
      // בדוק אם יש שינויים בלוקאלסטורג'
      const storedWeek = localStorage.getItem("currentWeek") || "1"
      const weekNumber = Number.parseInt(storedWeek)

      // שמור את הזמן האחרון שבו נבדקו עדכונים
      const lastCheckTime = localStorage.getItem("lastGameCheckTime")
      const currentTime = new Date().getTime().toString()

      // אם עברו לפחות 30 שניות מהבדיקה האחרונה
      if (!lastCheckTime || Number(currentTime) - Number(lastCheckTime) > 30000) {
        // עדכן את זמן הבדיקה האחרון
        localStorage.setItem("lastGameCheckTime", currentTime)

        // בדוק אם יש שינויים בלוקל סטורג' בלי לרענן את הדף
        const storedGames = localStorage.getItem("cachedGames")
        const storedGamesByDay = localStorage.getItem("cachedGamesByDay")
        if (storedGames && storedGamesByDay) {
          try {
            const parsedGames = JSON.parse(storedGames)
            const parsedGamesByDay = JSON.parse(storedGamesByDay)

            // עדכן את המצב רק אם יש שינויים
            if (JSON.stringify(parsedGames) !== JSON.stringify(games)) {
              setGames(parsedGames)
              setWeeklyGames(parsedGamesByDay)
              console.log("Updated games from localStorage without page refresh")
            }
          } catch (error) {
            console.error("Error parsing cached games:", error)
          }
        }
      }
    }

    // טען את המשחקים בטעינה ראשונית
    loadGamesFromDB()

    // הגדר בדיקה תקופתית לעדכוני משחקים
    const gameUpdateInterval = setInterval(checkForGameUpdates, 10000) // בדוק כל 10 שניות

    // נקה את ה-interval כשהקומפוננטה מתפרקת
    return () => clearInterval(gameUpdateInterval)
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
    // מחיקת המטמון של המשחקים כדי לאלץ טעינה מחדש
    localStorage.removeItem("cachedGames")
    localStorage.removeItem("cachedGamesByDay")
    localStorage.removeItem("lastGamesUpdate")

    // טעינה מחדש של המשחקים
    const loadGamesFromDB = async () => {
      setLoadingGames(true)
      try {
        const supabase = getSupabaseClient()
        if (supabase) {
          const storedWeek = localStorage.getItem("currentWeek") || "1"
          const weekNumber = Number.parseInt(storedWeek)

          // טעינה ישירה מ-Supabase
          const { data: gamesData, error: gamesError } = await supabase.from("games").select("*").eq("week", weekNumber)

          if (!gamesError && gamesData && gamesData.length > 0) {
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
                  closingTime: new Date(game.closingtime),
                  isFinished: game.isfinished,
                  result: game.result,
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

            console.log("Successfully refreshed games from Supabase")
          }
        }
      } catch (error) {
        console.error("Error refreshing games:", error)
      } finally {
        setLoadingGames(false)
      }
    }

    loadGamesFromDB()
  }

  useEffect(() => {
    // טעינת מספר השבוע הנוכחי מהלוקל סטורג'
    if (typeof window !== "undefined") {
      const storedWeek = localStorage.getItem("currentWeek")
      if (storedWeek) {
        const weekNum = Number.parseInt(storedWeek, 10)
        setCurrentWeek(isNaN(weekNum) ? 1 : weekNum)
      }

      // טעינת משחקים נעולים ידנית
      const storedLockedGames = localStorage.getItem("adminGames")
      if (storedLockedGames) {
        try {
          const adminGames = JSON.parse(storedLockedGames)
          const lockedGamesMap: Record<string, boolean> = {}

          adminGames.forEach((game: any) => {
            if (game.manuallyLocked) {
              lockedGamesMap[game.id] = true
            }
          })

          setManuallyLockedGames(lockedGamesMap)
        } catch (error) {
          console.error("Error parsing locked games:", error)
        }
      }

      // הגדר את היום הנוכחי כברירת מחדל
      setActiveDay(getDayOfWeek())
    }
  }, [])

  // עדכון ה-useEffect שטוען את הניחושים של המשתמש
  useEffect(() => {
    const loadUserPredictions = async () => {
      if (isAuthenticated && userIdentifier) {
        try {
          console.log("Loading predictions for user:", userIdentifier)

          // נסה לטעון ניחושים מהלוקל סטורג' תחילה כגיבוי
          let localPredictionsLoaded = false
          if (typeof window !== "undefined") {
            try {
              const localPredictions = JSON.parse(localStorage.getItem("predictions") || "[]")
              const userLocalPredictions = localPredictions.filter((pred: any) => pred.user_id === userIdentifier)

              if (userLocalPredictions.length > 0) {
                const submittedGames: Record<string, boolean> = {}
                const userPredictionsMap: Record<string, string> = {}

                userLocalPredictions.forEach((pred: any) => {
                  if (pred.game_id) {
                    submittedGames[pred.game_id] = true
                    userPredictionsMap[pred.game_id] = pred.prediction
                  }
                })

                setSubmittedPredictions(submittedGames)
                setPredictions((prev) => ({
                  ...prev,
                  ...userPredictionsMap,
                }))

                localPredictionsLoaded = true
                console.log("Loaded predictions from localStorage")
              }
            } catch (localError) {
              console.error("Error loading predictions from localStorage:", localError)
            }
          }

          // נסה לטעון מ-Supabase רק אם לא הצלחנו לטעון מהלוקל סטורג'
          if (!localPredictionsLoaded) {
            try {
              // בדיקה אם Supabase זמין
              const supabase = getSupabaseClient()
              if (!supabase) {
                throw new Error("Supabase client is not available")
              }

              // בדיקה אם המשתמש קיים במסד הנתונים
              try {
                const { data: userData, error: userError } = await supabase
                  .from("users")
                  .select("id")
                  .eq("playercode", userIdentifier)

                if (userError) {
                  if (userError.message.includes("does not exist")) {
                    console.log("users table does not exist, falling back to localStorage")
                  } else {
                    console.error("Error finding user:", userError)
                  }
                  throw new Error("Failed to find user")
                }

                if (userData && userData.length > 0) {
                  console.log("Found user with ID:", userData[0].id)

                  // טעינת הניחושים של המשתמש
                  try {
                    const { data: userPredictions, error: predError } = await supabase
                      .from("predictions")
                      .select("*")
                      .eq("userid", userData[0].id)

                    if (predError) {
                      if (predError.message.includes("does not exist")) {
                        console.log("predictions table does not exist, falling back to localStorage")
                      } else {
                        console.error("Error loading predictions:", predError)
                      }
                      throw new Error("Failed to load predictions")
                    }

                    if (userPredictions && userPredictions.length > 0) {
                      const submittedGames: Record<string, boolean> = {}
                      const userPredictionsMap: Record<string, string> = {}

                      userPredictions.forEach((pred) => {
                        if (pred.gameid) {
                          submittedGames[pred.gameid] = true
                          userPredictionsMap[pred.gameid] = pred.prediction
                        }
                      })

                      setSubmittedPredictions(submittedGames)
                      setPredictions((prev) => ({
                        ...prev,
                        ...userPredictionsMap,
                      }))

                      console.log("Loaded predictions from Supabase")
                    }
                  } catch (predError) {
                    console.error("Error in predictions query:", predError)
                  }
                } else {
                  console.log("No user found with playercode:", userIdentifier)
                }
              } catch (userError) {
                console.error("Error in user query:", userError)
              }
            } catch (supabaseError) {
              console.error("Error with Supabase:", supabaseError)
              // כבר טענו מהלוקל סטורג', אז לא צריך לעשות כלום נוסף
            }
          }
        } catch (error) {
          console.error("Error in loadUserPredictions:", error)
        }
      }
    }

    if (isAuthenticated && userIdentifier) {
      loadUserPredictions()
    }
  }, [isAuthenticated, userIdentifier])

  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date()
      const dateOptions: Intl.DateTimeFormatOptions = {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      }
      const timeOptions: Intl.DateTimeFormatOptions = { hour: "2-digit", minute: "2-digit" }
      const hebrewDate = now.toLocaleDateString("he-IL", dateOptions)
      const hebrewTime = now.toLocaleTimeString("he-IL", timeOptions)
      setCurrentDateTime(`${hebrewDate} | ${hebrewTime}`)
    }

    updateDateTime()
    const timer = setInterval(updateDateTime, 60000) // Update every minute

    return () => clearInterval(timer)
  }, [])

  const getDayName = (day: string) => {
    const days = {
      sunday: "יום א'",
      monday: "יום ב'",
      tuesday: "יום ג'",
      wednesday: "יום ד'",
      thursday: "יום ה'",
      friday: "יום ו'",
      saturday: "שבת",
    }
    return days[day as keyof typeof days]
  }

  // בתוך הקוד של הכפתורים של ימי השבוע, אוסיף פונקציה לחישוב התאריך של כל יום

  // הוסף את הפונקציה הזו לפני הפונקציה getDayName
  const getDateForDay = (day: string) => {
    const today = new Date()
    const currentDayNumber = today.getDay() // 0 = יום ראשון, 1 = יום שני, וכו'
    const targetDayNumber = dayToNumber(day)

    // חישוב מספר הימים להוסיף כדי להגיע ליום המבוקש
    const daysToAdd = (targetDayNumber - currentDayNumber + 7) % 7

    // יצירת תאריך חדש
    const date = new Date(today)
    date.setDate(today.getDate() + daysToAdd)

    // החזרת התאריך בפורמט יום/חודש/שנה
    return `${date.getDate().toString().padStart(2, "0")}/${(date.getMonth() + 1).toString().padStart(2, "0")}/${date.getFullYear()}`
  }

  const getDayBonus = (day: string) => {
    if (day === "saturday") return "X2"
    return null
  }

  const handlePredictionChange = (gameId: string, prediction: string) => {
    const gameDay = Object.entries(weeklyGames).find(([_, games]) => games.some((game) => game.id === gameId))?.[0]

    if (gameDay && !submittedPredictions[gameId]) {
      setPredictions((prev) => ({
        ...prev,
        [gameId]: prediction,
      }))
    }
  }

  // עדכון פונקציית handleSubmitPredictions כדי לטפל בבעיה של RLS

  const handleSubmitPredictions = async (gameId: string) => {
    const gameDay = Object.entries(weeklyGames).find(([_, games]) => games.some((game) => game.id === gameId))?.[0]

    if (!gameDay) {
      alert("לא ניתן להמר על משחק זה")
      return
    }

    if (!predictions[gameId]) {
      alert("יש לבחור ניחוש לפני ההגשה")
      return
    }

    try {
      // יצירת אובייקט הניחוש - עדכון שמות השדות
      const predictionObj = {
        user_id: userIdentifier || "anonymous",
        game_id: gameId,
        prediction: predictions[gameId],
        timestamp: new Date(),
      }

      console.log("Submitting prediction:", predictionObj)

      // שליחת הניחוש לשירות ה-Supabase
      const success = await submitPrediction(predictionObj)

      if (success) {
        // עדכון ניחושים שהוגשו
        setSubmittedPredictions((prev) => ({
          ...prev,
          [gameId]: true,
        }))

        alert(`הניחוש למשחק ${gameId} נשלח בהצלחה!`)
      } else {
        // Fallback to localStorage if Supabase fails
        if (typeof window !== "undefined") {
          const localPredictions = JSON.parse(localStorage.getItem("predictions") || "[]")
          localPredictions.push({
            ...predictionObj,
            id: Date.now().toString(),
          })
          localStorage.setItem("predictions", JSON.stringify(localPredictions))

          setSubmittedPredictions((prev) => ({
            ...prev,
            [gameId]: true,
          }))

          alert(`הניחוש למשחק ${gameId} נשלח בהצלחה (מקומי)!`)
          return
        }

        alert("אירעה שגיאה בשליחת הניחוש. נסה שוב מאוחר יותר.")
      }
    } catch (error) {
      console.error("Error submitting prediction:", error)
      alert("אירעה שגיאה בשליחת הניחוש. נסה שוב מאוחר יותר.")
    }
  }

  const toggleShowPredictions = (gameId: string) => {
    setShowPredictions((prev) => ({
      ...prev,
      [gameId]: !prev[gameId],
    }))
  }

  const handleLogout = () => {
    logout()
  }

  // Home Page Component
  const HomePage = () => (
    <div className="max-w-4xl mx-auto p-4">
      <div className="bg-white text-gray-800 p-8 rounded-lg shadow-md mb-8 border border-gray-200 text-center">
        <h1 className="text-3xl font-bold mb-4 text-center text-navy-600">ברוכים הבאים</h1>
        <h2 className="text-4xl font-bold mb-6 text-center text-olive-600">ניחושים בין החברים</h2>
        <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
          <p className="text-xl text-center text-gray-600 bg-gray-100 py-2 px-4 rounded-full">{currentDateTime}</p>
          <p className="text-xl text-center text-white bg-navy-600 py-2 px-4 rounded-full">
            שבוע {currentWeek ? currentWeek.toString() : "1"}
          </p>
        </div>
      </div>

      {/* Day Navigation */}
      <div className="flex justify-between mb-6 overflow-x-auto">
        {daysOfWeek
          .filter((day) => day !== "saturday")
          .map((day) => {
            const bonus = day === "friday" ? "X2" : getDayBonus(day)
            const isCurrentDay = day === getDayOfWeek()
            const isPastDay = dayToNumber(day) < dayToNumber(getDayOfWeek())

            // עדכון הכפתור כך שיציג גם את התאריך
            return (
              <button
                key={day}
                className={`px-4 py-2 rounded-md text-sm font-bold transition duration-300 ${
                  activeTab === day || (day === "friday" && activeTab === "saturday")
                    ? "bg-navy-600 text-white"
                    : isCurrentDay
                      ? "bg-green-600 text-white"
                      : isPastDay
                        ? "bg-gray-300 text-gray-600"
                        : "bg-gray-200 text-gray-800 hover:bg-gray-300"
                }`}
                onClick={() => {
                  setActiveDay(day)
                  // אם לוחצים על יום שישי, נציג גם את משחקי שבת
                  if (day === "friday") {
                    // במקום לשלב את המשחקים, נשמור על ההפרדה בין יום שישי ושבת
                    setActiveDay(day)
                    // לא נשנה את מבנה המשחקים, רק נסמן שאנחנו במצב סוף שבוע
                    forceRefreshGames()
                  } else {
                    // אחרת, נחזיר למצב הרגיל
                    setActiveDay(day)
                    forceRefreshGames()
                  }
                }}
              >
                <div>
                  {day === "friday" ? "סוף שבוע" : getDayName(day)}
                  <div className="text-xs mt-1">{getDateForDay(day)}</div>
                </div>
                {bonus && <span className="ml-1 text-yellow-400">{bonus}</span>}
                {isCurrentDay && <span className="ml-1 text-white">•</span>}
              </button>
            )
          })}
      </div>

      <h2 className="text-2xl font-bold mb-2 flex items-center text-gray-800">
        <Calendar className="w-6 h-6 mr-2" />
        {activeTab === "friday"
          ? `משחקי סוף שבוע: ${getDateForDay("friday")}-${getDateForDay("saturday")}`
          : `משחקי ${getDayName(activeDay)}: ${getDateForDay(activeDay)}`}
        {getDayBonus(activeDay) && <span className="ml-2 text-yellow-500 text-xl">({getDayBonus(activeDay)})</span>}
      </h2>

      {activeDay === "friday" && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6 rounded-md">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertCircle className="h-5 w-5 text-yellow-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">הודעות חשובות לסוף שבוע:</h3>
              <div className="mt-2 text-sm text-yellow-700">
                <ul className="list-disc space-y-1 pl-5">
                  <li>
                    <strong>יום שישי:</strong> יש לבצע את הניחושים עד השעה 18:00
                  </li>
                  <li>
                    <strong>חובה:</strong> לבצע את הניחושים גם ליום שישי וגם ליום שבת
                  </li>
                  <li>
                    <strong>יום שבת:</strong> מקבלים כפול ניקוד על ניחוש נכון!
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {loadingGames ? (
        <div className="bg-white p-6 rounded-lg shadow-md text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-navy-600 border-r-transparent"></div>
          <p className="mt-2 text-gray-600">טוען משחקים...</p>
        </div>
      ) : activeDay === "friday" ? (
        // מצב סוף שבוע - הצג את משחקי יום שישי ושבת בנפרד
        <div className="space-y-8 mb-8">
          {/* משחקי יום שישי */}
          <div>
            <h3 className="text-xl font-bold mb-4 flex items-center text-gray-800 border-b pb-2">
              <Calendar className="w-5 h-5 mr-2" />
              משחקי יום שישי: {getDateForDay("friday")}
            </h3>

            {weeklyGames.friday?.length > 0 ? (
              <div className="space-y-6">
                {weeklyGames.friday
                  .filter((game) => !game.isSaturday)
                  .map((game: any) => {
                    // בדיקה אם המשחק נעול ידנית
                    const isManuallyLocked = manuallyLockedGames[game.id] || false

                    // בדיקה אם המשחק נעול
                    const isLocked =
                      !isGameDayReached("friday") ||
                      new Date() > new Date(game.closingTime) ||
                      submittedPredictions[game.id] ||
                      isManuallyLocked

                    return (
                      <div
                        key={game.id}
                        className={`bg-white p-6 rounded-lg shadow-md border border-gray-200 transition duration-300 ${
                          isLocked ? "opacity-70" : ""
                        }`}
                      >
                        {/* תוכן המשחק - זהה לקוד הקיים */}
                        <div className="flex justify-between items-center mb-4">
                          <span className="text-sm font-medium text-gray-600">{game.league}</span>
                          <div className="flex items-center">
                            <span className="text-sm font-medium text-gray-600">{game.time}</span>
                          </div>
                        </div>
                        <div className="w-full text-center mt-2">
                          {!isLocked && (
                            <div className="inline-block px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                              <Clock className="inline-block w-4 h-4 mr-1" />
                              <span>נסגר להימורים: </span>
                              <GameCountdown closingTime={game.closingTime} />
                            </div>
                          )}
                        </div>
                        <div className="flex justify-between items-center mb-4">
                          <div className="text-lg font-bold text-gray-800">{game.homeTeam}</div>
                          <div className="text-xl font-bold text-gray-400">vs</div>
                          <div className="text-lg font-bold text-gray-800">{game.awayTeam}</div>
                        </div>
                        <div className="flex flex-col items-center justify-center w-full mb-4">
                          {isLocked ? (
                            <div className="bg-red-50 text-red-700 px-4 py-2 rounded-md flex items-center w-full justify-center">
                              <Lock className="w-5 h-5 mr-2" />
                              <span className="font-bold">
                                {game.isFinished
                                  ? "המשחק נגמר: " + (game.result || "אין תוצאה")
                                  : new Date() > new Date(game.closingTime)
                                    ? "זמן ההימור הסתיים"
                                    : !isGameDayReached("friday")
                                      ? dayToNumber("friday") < dayToNumber(getDayOfWeek())
                                        ? "המשחק כבר עבר"
                                        : "המשחק עוד לא נפתח להימורים"
                                      : isManuallyLocked
                                        ? "המשחק נעול על ידי מנהל"
                                        : submittedPredictions[game.id]
                                          ? "הניחוש נשלח בהצלחה"
                                          : "ההימורים נעולים"}
                              </span>
                            </div>
                          ) : (
                            <div className="bg-green-50 text-green-700 px-4 py-2 rounded-md flex items-center w-full justify-center">
                              <span className="font-bold">ניתן להמר על משחק זה</span>
                            </div>
                          )}
                        </div>
                        <GameTimer
                          closingTime={game.closingTime}
                          isPastDay={dayToNumber("friday") < dayToNumber(getDayOfWeek())}
                          isManuallyLocked={isManuallyLocked}
                        />
                        <div className="flex justify-center space-x-4 mb-4">
                          {["1", "X", "2"].map((option) => (
                            <button
                              key={option}
                              className={`px-6 py-2 rounded-full text-lg font-bold transition duration-300 ${
                                predictions[game.id] === option
                                  ? "bg-navy-600 text-white"
                                  : "bg-gray-200 text-gray-800 hover:bg-gray-300"
                              } ${isLocked ? "opacity-50 cursor-not-allowed" : ""}`}
                              onClick={() => handlePredictionChange(game.id, option)}
                              disabled={isLocked}
                            >
                              {option}
                            </button>
                          ))}
                        </div>
                        <div className="flex justify-between items-center mb-2">
                          <button
                            className="bg-blue-500 text-white py-1.5 px-3 rounded-lg font-medium text-sm shadow-md hover:bg-blue-600 transition duration-300 flex items-center justify-center"
                            onClick={() => toggleShowPredictions(game.id)}
                          >
                            <Eye className="w-3 h-3 mr-1" />
                            {showPredictions[game.id] ? "הסתר ניחושים" : "הצג ניחושים"}
                          </button>
                          <button
                            className={`bg-olive-600 text-white py-1.5 px-3 rounded-lg font-medium text-sm shadow-md ${
                              isLocked || !predictions[game.id] ? "opacity-50 cursor-not-allowed" : "hover:bg-olive-700"
                            }`}
                            onClick={() => handleSubmitPredictions(game.id)}
                            disabled={isLocked || !predictions[game.id]}
                          >
                            {submittedPredictions[game.id] ? "נשלח" : "שלח ניחוש"}
                          </button>
                        </div>
                        {showPredictions[game.id] && (
                          <div className="mt-3 bg-gray-100 p-3 rounded-lg">
                            <h4 className="font-bold mb-2 text-sm">ניחושי שחקנים אחרים:</h4>
                            <ul className="text-xs">
                              {mockOtherPredictions[game.id]?.map((pred, index) => (
                                <li key={index} className="flex justify-between items-center py-1">
                                  <span>{pred.playerName}</span>
                                  <span className="font-bold">{pred.prediction}</span>
                                  <span className="text-gray-500">{pred.submissionTime}</span>
                                </li>
                              )) || <li className="text-center py-2 text-gray-500">אין ניחושים עדיין</li>}
                            </ul>
                          </div>
                        )}
                      </div>
                    )
                  })}
              </div>
            ) : (
              <div className="bg-white p-6 rounded-lg shadow-md text-center">
                <p className="text-gray-600">אין משחקים ביום שבת</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        // מצב רגיל - הצג את המשחקים של היום הנבחר
        <div className="space-y-6 mb-8">
          {weeklyGames[activeDay as keyof typeof weeklyGames].map((game: any) => {
            // בדיקה אם המשחק נעול ידנית
            const isManuallyLocked = manuallyLockedGames[game.id] || false

            // בתוך הלולאה של המשחקים
            // בדיקה אם המשחק נעול
            const isLocked =
              !isGameDayReached(activeDay) ||
              new Date() > new Date(game.closingTime) ||
              submittedPredictions[game.id] ||
              isManuallyLocked

            // בדיקה אם זה משחק שבת (כשנמצאים ביום שישי)
            const isSaturdayGame = game.isSaturday

            return (
              <div
                key={game.id}
                className={`bg-white p-6 rounded-lg shadow-md border border-gray-200 transition duration-300 ${
                  isLocked ? "opacity-70" : ""
                } ${isSaturdayGame ? "border-l-4 border-l-yellow-500" : ""}`}
              >
                <div className="flex justify-between items-center mb-4">
                  <span className="text-sm font-medium text-gray-600">{game.league}</span>
                  <div className="flex items-center">
                    <span className="text-sm font-medium text-gray-600">{game.time}</span>
                    {isSaturdayGame && (
                      <span className="ml-2 bg-yellow-100 text-yellow-800 text-xs font-medium px-2 py-0.5 rounded">
                        שבת X2
                      </span>
                    )}
                  </div>
                </div>
                <div className="w-full text-center mt-2">
                  {!isLocked && (
                    <div className="inline-block px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                      <Clock className="inline-block w-4 h-4 mr-1" />
                      <span>נסגר להימורים: </span>
                      <GameCountdown closingTime={game.closingTime} />
                    </div>
                  )}
                </div>
                <div className="flex justify-between items-center mb-4">
                  <div className="text-lg font-bold text-gray-800">{game.homeTeam}</div>
                  <div className="text-xl font-bold text-gray-400">vs</div>
                  <div className="text-lg font-bold text-gray-800">{game.awayTeam}</div>
                </div>
                <div className="flex flex-col items-center justify-center w-full mb-4">
                  {isLocked ? (
                    <div className="bg-red-50 text-red-700 px-4 py-2 rounded-md flex items-center w-full justify-center">
                      <Lock className="w-5 h-5 mr-2" />
                      <span className="font-bold">
                        {game.isFinished
                          ? "המשחק נגמר: " + (game.result || "אין תוצאה")
                          : new Date() > new Date(game.closingTime)
                            ? "זמן ההימור הסתיים"
                            : !isGameDayReached(activeDay)
                              ? dayToNumber(activeDay) < dayToNumber(getDayOfWeek())
                                ? "המשחק כבר עבר"
                                : "המשחק עוד לא נפתח להימורים"
                              : isManuallyLocked
                                ? "המשחק נעול על ידי מנהל"
                                : submittedPredictions[game.id]
                                  ? "הניחוש נשלח בהצלחה"
                                  : "ההימורים נעולים"}
                      </span>
                    </div>
                  ) : (
                    <div className="bg-green-50 text-green-700 px-4 py-2 rounded-md flex items-center w-full justify-center">
                      <span className="font-bold">ניתן להמר על משחק זה</span>
                    </div>
                  )}
                </div>
                <GameTimer
                  closingTime={game.closingTime}
                  isPastDay={dayToNumber(activeDay) < dayToNumber(getDayOfWeek())}
                  isManuallyLocked={isManuallyLocked}
                />
                <div className="flex justify-center space-x-4 mb-4">
                  {["1", "X", "2"].map((option) => (
                    <button
                      key={option}
                      className={`px-6 py-2 rounded-full text-lg font-bold transition duration-300 ${
                        predictions[game.id] === option
                          ? "bg-navy-600 text-white"
                          : "bg-gray-200 text-gray-800 hover:bg-gray-300"
                      } ${isLocked ? "opacity-50 cursor-not-allowed" : ""}`}
                      onClick={() => handlePredictionChange(game.id, option)}
                      disabled={isLocked}
                    >
                      {option}
                    </button>
                  ))}
                </div>
                <div className="flex justify-between items-center mb-2">
                  <button
                    className="bg-blue-500 text-white py-1.5 px-3 rounded-lg font-medium text-sm shadow-md hover:bg-blue-600 transition duration-300 flex items-center justify-center"
                    onClick={() => toggleShowPredictions(game.id)}
                  >
                    <Eye className="w-3 h-3 mr-1" />
                    {showPredictions[game.id] ? "הסתר ניחושים" : "הצג ניחושים"}
                  </button>
                  <button
                    className={`bg-olive-600 text-white py-1.5 px-3 rounded-lg font-medium text-sm shadow-md ${
                      isLocked || !predictions[game.id] ? "opacity-50 cursor-not-allowed" : "hover:bg-olive-700"
                    }`}
                    onClick={() => handleSubmitPredictions(game.id)}
                    disabled={isLocked || !predictions[game.id]}
                  >
                    {submittedPredictions[game.id] ? "נשלח" : "שלח ניחוש"}
                  </button>
                </div>
                {showPredictions[game.id] && (
                  <div className="mt-3 bg-gray-100 p-3 rounded-lg">
                    <h4 className="font-bold mb-2 text-sm">ניחושי שחקנים אחרים:</h4>
                    <ul className="text-xs">
                      {mockOtherPredictions[game.id]?.map((pred, index) => (
                        <li key={index} className="flex justify-between items-center py-1">
                          <span>{pred.playerName}</span>
                          <span className="font-bold">{pred.prediction}</span>
                          <span className="text-gray-500">{pred.submissionTime}</span>
                        </li>
                      )) || <li className="text-center py-2 text-gray-500">אין ניחושים עדיין</li>}
                    </ul>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )

  // אם המשתמש לא מחובר, הצג את דף הכניסה
  if (showLoginPage) {
    return <Login />
  }

  // אם המשתמש מחובר אבל צריך לבחור תפקיד, הצג את מסך בחירת התפקיד
  if (isRoleSelectionRequired) {
    return <RoleSelection />
  }

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      {/* Database Initializer */}
      <DatabaseInitializer />

      {/* Header */}
      <header className="bg-white shadow-md">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="font-bold text-2xl text-navy-600">ניחושים בין החברים</div>

          <div className="flex items-center space-x-4">
            <button className="text-gray-600 hover:text-navy-600 transition duration-300">
              <Bell className="w-6 h-6" />
            </button>
            <div className="flex items-center">
              <span className="text-sm text-gray-600 ml-2">שלום, {userName || userIdentifier}</span>
              {isSuperAdmin && (
                <span className="ml-2 bg-red-600 text-white text-xs px-2 py-1 rounded-full">SUPER ADMIN</span>
              )}

              {isAdmin && (
                <div className="flex items-center mr-4">
                  <button
                    className={`px-3 py-1 rounded-md text-xs font-medium mr-2 ${
                      activeTab !== "admin" ? "bg-navy-600 text-white" : "bg-gray-200 text-gray-800"
                    }`}
                    onClick={() => {
                      switchToPlayerMode()
                      setActiveTab("home")
                    }}
                  >
                    מצב שחקן
                  </button>
                  <button
                    className={`px-3 py-1 rounded-md text-xs font-medium ${
                      activeTab === "admin" ? "bg-navy-600 text-white" : "bg-gray-200 text-gray-800"
                    }`}
                    onClick={() => {
                      switchToAdminMode()
                      setActiveTab("admin")
                    }}
                  >
                    מצב מנהל
                  </button>
                </div>
              )}

              {/* כפתור מעבר למצב מנהל - יוצג רק אם יש קוד מנהל והמשתמש לא במצב מנהל */}
              {adminCode && !isAdmin && (
                <button
                  className="px-3 py-1 rounded-md text-xs font-medium bg-gray-200 text-gray-800 hover:bg-gray-300 mr-4"
                  onClick={() => setShowAdminModal(true)}
                >
                  מעבר למצב מנהל
                </button>
              )}

              <button
                className="flex items-center text-gray-600 hover:text-navy-600 transition duration-300 mr-4"
                onClick={handleLogout}
              >
                <LogIn className="w-5 h-5 ml-1" />
                התנתק
              </button>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="max-w-6xl mx-auto px-4 py-2 flex border-t border-gray-200">
          {["home", "leaderboard", "history", "admin"].map((tab) => {
            // הסתר את לשונית "ממשק מנהל" אם המשתמש אינו מנהל
            if (tab === "admin" && !isAdmin) {
              return null
            }

            return (
              <button
                key={tab}
                className={`mr-4 px-3 py-2 rounded-md transition duration-300 ${
                  activeTab === tab ? "bg-gray-100 text-navy-600" : "text-gray-600 hover:bg-gray-100"
                }`}
                onClick={() => setActiveTab(tab)}
              >
                {tab === "home" && "דף הבית"}
                {tab === "leaderboard" && "טבלת דירוג"}
                {tab === "history" && "תוצאות"}
                {tab === "admin" && "ממשק מנהל"}
              </button>
            )
          })}
        </nav>
      </header>

      <main className="py-8">
        {activeTab === "home" && <HomePage />}
        {activeTab === "leaderboard" && <Leaderboard />}
        {activeTab === "history" && <PredictionHistory />}
        {activeTab === "admin" && isAdmin && <AdminDashboard />}
      </main>

      <footer className="bg-gray-800 text-white py-6 text-center">
        <div className="max-w-6xl mx-auto px-4">
          <p className="text-lg">© 2025 ניחושים בין החברים - כל הזכויות שמורות</p>
        </div>
      </footer>

      {showAdminModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-bold mb-4">אימות מנהל</h3>

            {adminPasswordError && (
              <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md flex items-center">
                <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
                <span>{adminPasswordError}</span>
              </div>
            )}

            <form onSubmit={handleAdminPasswordSubmit}>
              <div className="mb-4">
                <label htmlFor="adminPassword" className="block text-sm font-medium text-gray-700 mb-1">
                  סיסמת מנהל
                </label>
                <input
                  type="password"
                  id="adminPassword"
                  ref={adminPasswordRef}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-navy-500 focus:border-navy-500"
                  placeholder="הזן סיסמת מנהל"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                />
              </div>

              <div className="flex justify-end space-x-2 rtl:space-reverse">
                <button
                  type="button"
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
                  onClick={() => {
                    setShowAdminModal(false)
                    setAdminPassword("")
                    setAdminPasswordError("")
                  }}
                >
                  ביטול
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-navy-600 text-white rounded-md hover:bg-navy-700"
                  disabled={isSubmittingAdminPassword}
                >
                  {isSubmittingAdminPassword ? "מאמת..." : "אישור"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

// קומפוננטת טיימר לספירה לאחור עד לסגירת המשחק
function GameCountdown({ closingTime }: { closingTime: Date }) {
  const [timeLeft, setTimeLeft] = useState<string>("")

  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date()
      const closing = new Date(closingTime)
      const diff = closing.getTime() - now.getTime()

      if (diff <= 0) {
        setTimeLeft("סגור להימורים")
        return
      }

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
    updateCountdown()

    // עדכון כל שנייה
    const interval = setInterval(updateCountdown, 1000)

    return () => clearInterval(interval)
  }, [closingTime])

  return <span className="font-mono">{timeLeft}</span>
}
