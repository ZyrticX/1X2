// הסרת ייבואים לא נחוצים ופונקציות כפולות

// טיפוסי נתונים
export interface Game {
  id: string
  homeTeam: string
  awayTeam: string
  time: string
  date: string
  league: string
  closingTime: Date
  result?: string
  isFinished?: boolean
}

export interface Prediction {
  id?: string
  userId: string
  gameId: string
  prediction: string
  timestamp: Date
}

export interface User {
  id: string
  name: string
  email: string
  points: number
  correctPredictions: number
  totalPredictions: number
  lastWeekPoints?: number
  trend?: "up" | "down" | "same"
  successRate?: number
}

// נתוני דוגמה למשחקים
const mockGames: Game[] = [
  {
    id: "1",
    homeTeam: "מכבי חיפה",
    awayTeam: "הפועל באר שבע",
    time: "19:00",
    date: new Date().toISOString(),
    league: "ליגת העל",
    closingTime: new Date(Date.now() + 3600000),
  },
  {
    id: "2",
    homeTeam: "מכבי תל אביב",
    awayTeam: "הפועל תל אביב",
    time: "21:00",
    date: new Date().toISOString(),
    league: "ליגת העל",
    closingTime: new Date(Date.now() + 7200000),
  },
  {
    id: "3",
    homeTeam: 'בית"ר ירושלים',
    awayTeam: "הפועל ירושלים",
    time: "20:15",
    date: new Date(Date.now() + 86400000).toISOString(),
    league: "ליגת העל",
    closingTime: new Date(Date.now() + 86400000),
  },
  {
    id: "4",
    homeTeam: "הפועל חיפה",
    awayTeam: "מכבי נתניה",
    time: "19:30",
    date: new Date(Date.now() + 172800000).toISOString(),
    league: "ליגת העל",
    closingTime: new Date(Date.now() + 172800000),
  },
]

// נתוני דוגמה למשתמשים - מרוקן את המערך
const mockUsers: User[] = []

// פונקציות עזר
const getFromLocalStorage = <T>(key: string, defaultValue: T): T => {
 if (typeof window === "undefined") return defaultValue
 const stored = localStorage.getItem(key)
 return stored ? JSON.parse(stored) : defaultValue
}

const saveToLocalStorage = <T>(key: string, value: T): void => {
 if (typeof window === "undefined") return
 localStorage.setItem(key, JSON.stringify(value))
}

// אתחול נתונים
const initializeData = () => {
 if (typeof window === "undefined") return

 // בדוק אם יש כבר נתונים ב-localStorage
 const storedGames = localStorage.getItem("games")
 const storedUsers = localStorage.getItem("users")
 const storedPredictions = localStorage.getItem("predictions")

 // אם אין, אתחל עם נתוני ברירת מחדל
 if (!storedGames) {
   localStorage.setItem("games", JSON.stringify(mockGames))
 }
 if (!storedUsers) {
   localStorage.setItem("users", JSON.stringify(mockUsers))
 }
 if (!storedPredictions) {
   localStorage.setItem("predictions", JSON.stringify([]))
 }
}

// פונקציות שירות

// משחקים
export const getGames = async (day?: string): Promise<Game[]> => {
 initializeData()
 const games = getFromLocalStorage<Game[]>("games", mockGames)

 if (!day) return games

 // סינון לפי יום
 const startOfDay = new Date(day)
 startOfDay.setHours(0, 0, 0, 0)
 const endOfDay = new Date(day)
 endOfDay.setHours(23, 59, 59, 999)

 return games.filter((game) => {
   const gameDate = new Date(game.date)
   return gameDate >= startOfDay && gameDate <= endOfDay
 })
}

export const getGamesByDay = async (): Promise<Record<string, Game[]>> => {
 initializeData()
 const games = getFromLocalStorage<Game[]>("games", mockGames)
 
 // מיון משחקים לפי ימים
 const gamesByDay: Record<string, Game[]> = {
   sunday: [],
   monday: [],
   tuesday: [],
   wednesday: [],
   thursday: [],
   friday: [],
   saturday: [],
 }
 
 games.forEach(game => {
   const gameDate = new Date(game.date)
   const day = gameDate.getDay()
   
   // המרת מספר היום לשם היום
   const dayNames = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"]
   const dayName = dayNames[day]
   
   if (gamesByDay[dayName]) {
     gamesByDay[dayName].push(game)
   }
 })
 
 return gamesByDay
}

// ניחושים
export const submitPrediction = async (prediction: Prediction): Promise<boolean> => {
 initializeData()
 const predictions: Prediction[] = getFromLocalStorage<Prediction[]>("predictions", [])

 // בדיקה אם כבר קיים ניחוש למשחק זה מהמשתמש הזה
 const existingIndex = predictions.findIndex(
   (p) => p.userId === prediction.userId && p.gameId === prediction.gameId
 )

 if (existingIndex !== -1) {
   // עדכון ניחוש קיים
   predictions[existingIndex] = {
     ...predictions[existingIndex],
     prediction: prediction.prediction,
     timestamp: new Date(),
   }
 } else {
   // יצירת ניחוש חדש
   predictions.push({
     ...prediction,
     id: Date.now().toString(),
     timestamp: new Date(),
   })
 }

 saveToLocalStorage("predictions", predictions)
 return true
}

export const getUserPredictions = async (userId: string): Promise<Prediction[]> => {
 initializeData()
 const predictions = getFromLocalStorage<Prediction[]>("predictions", [])
 return predictions.filter((p) => p.userId === userId)
}

// טבלת דירוג
export const getLeaderboard = async (timeFrame: "all" | "weekly" | "monthly" = "all"): Promise<User[]> => {
 initializeData();
 
 // החזר מערך ריק במקום נתוני דוגמה
 return [];
}

// משתמש נוכחי - לצורך הדגמה
export const getCurrentUser = (): User => {
 return {
   id: "current-user",
   name: "המשתמש שלי",
   email: "me@example.com",
   points: 27,
   correctPredictions: 9,
   totalPredictions: 21,
   lastWeekPoints: 12,
   trend: "up",
   successRate: 42.9,
 }
}
