"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "./contexts/auth-context"
import { getSupabaseClient } from "./lib/supabaseClient"
import GameTimer from "./components/game-timer"

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
  closingTime?: Date
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
                      closingTime: game.closingtime ? new Date(game.closingtime) : undefined,
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
                        closingTime: gameData.closingtime ? new Date(gameData.closingtime) : undefined,
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
                  closingTime: game.closingtime ? new Date(game.closingtime) : undefined,
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

  // פונקציה לשמירת ניחוש
  const savePrediction = (gameId: string, prediction: string) => {
    setPredictions((prev) => ({
      ...prev,
      [gameId]: prediction,
    }))
  }

  // פונקציה להגשת ניחוש
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
      // שמירה בלוקל סטורג' כגיבוי
      const localPredictions = JSON.parse(localStorage.getItem("predictions") || "[]")
      const existingPredictionIndex = localPredictions.findIndex(
        (p: any) => p.game_id === gameId && p.user_id === userIdentifier,
      )

      if (existingPredictionIndex >= 0) {
        localPredictions[existingPredictionIndex].prediction = prediction
      } else {
        localPredictions.push({
          game_id: gameId,
          user_id: userIdentifier,
          prediction,
          created_at: new Date().toISOString(),
        })
      }

      localStorage.setItem("predictions", JSON.stringify(localPredictions))

      // שמירה ב-Supabase
      try {
        const supabase = getSupabaseClient()
        if (supabase) {
          // בדיקה אם הניחוש כבר קיים
          const { data: existingPrediction, error: checkError } = await supabase
            .from("predictions")
            .select("*")
            .eq("game_id", gameId)
            .eq("user_id", userIdentifier)

          if (checkError) {
            console.error("Error checking existing prediction:", checkError)
          }

          if (existingPrediction && existingPrediction.length > 0) {
            // עדכון ניחוש קיים
            const { error: updateError } = await supabase
              .from("predictions")
              .update({ prediction })
              .eq("game_id", gameId)
              .eq("user_id", userIdentifier)

            if (updateError) {
              console.error("Error updating prediction:", updateError)
              throw updateError
            }
          } else {
            // יצירת ניחוש חדש
            const { error: insertError } = await supabase.from("predictions").insert([
              {
                game_id: gameId,
                user_id: userIdentifier,
                prediction,
              },
            ])

            if (insertError) {
              console.error("Error inserting prediction:", insertError)
              throw insertError
            }
          }

          // עדכון המצב המקומי
          setSubmittedPredictions((prev) => ({
            ...prev,
            [gameId]: true,
          }))

          console.log("Prediction saved successfully")
        }
      } catch (supabaseError) {
        console.error("Error saving prediction to Supabase:", supabaseError)
        // אם יש שגיאה ב-Supabase, לפחות שמרנו בלוקל סטורג'
        alert("הניחוש נשמר מקומית אך לא הצלחנו לשמור אותו בשרת. נסה שוב מאוחר יותר.")
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
  const isGameLocked = (game: Game) => {
    // בדיקה אם המשחק ננעל ידנית על ידי מנהל
    if (manuallyLockedGames[game.id]) {
      return true
    }

    // בדיקה אם המשחק כבר הסתיים
    if (game.isFinished) {
      return true
    }

    // בדיקה אם עבר זמן הסגירה
    if (game.closingTime && new Date() > new Date(game.closingTime)) {
      return true
    }

    return false
  }

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
              <>
                <span className="text-sm">שלום, {userName || userIdentifier}</span>
                <button onClick={logout} className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm">
                  התנתק
                </button>
              </>
            ) : (
              <button
                onClick={() => setShowLoginPage(true)}
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
                      isManuallyLocked={manuallyLockedGames[game.id]}
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
                          {mockOtherPredictions[game.id] && mockOtherPredictions[game.id].length > 0 ? (
                            <ul className="space-y-1">
                              {mockOtherPredictions[game.id].map((pred, idx) => (
                                <li key={idx} className="flex justify-between">
                                  <span>{pred.playerName}</span>
                                  <span
                                    className={`font-medium ${
                                      pred.prediction === "1"
                                        ? "text-blue-500"
                                        : pred.prediction === "X"
                                          ? "text-green-500"
                                          : "text-red-500"
                                    }`}
                                  >
                                    {pred.prediction === "1"
                                      ? `1 (${game.homeTeam})`
                                      : pred.prediction === "X"
                                        ? "X (תיקו)"
                                        : `2 (${game.awayTeam})`}
                                  </span>
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p>אין ניחושים להצגה</p>
                          )}
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
