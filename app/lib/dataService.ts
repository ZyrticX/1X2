import { getSupabaseClient, isSupabaseAvailable } from "./supabase"

// הוספת טיפוס למשתמש חדש
export interface NewUser {
  name: string
  phone: string
  email?: string
  city: string
  playerCode: string
  status?: "active" | "blocked"
}

export interface User {
  id: string
  name: string
  phone: string
  email?: string
  city: string
  playercode: string // Updated to match database column name
  status?: "active" | "blocked"
  points: number
  correct_predictions: number
  total_predictions: number
  last_week_points: number
  trend: "up" | "down" | "same"
  success_rate: number
}

// פונקציה להוספת משתמש חדש באמצעות RPC
export async function addUser(userData: {
  name: string
  playercode: string
  phone?: string
  city?: string
  status?: string
  points?: number
}) {
  try {
    const supabase = getSupabaseClient()
    if (!supabase) {
      throw new Error("Supabase client is not available")
    }

    // שימוש בפונקציית ה-RPC המתוקנת
    const { data, error } = await supabase.rpc("add_new_user", {
      user_name: userData.name,
      user_playercode: userData.playercode,
      user_phone: userData.phone || null,
      user_city: userData.city || null,
      user_status: userData.status || "active",
      user_points: userData.points || 0,
    })

    if (error) {
      console.error("Error adding user via RPC:", error.message)
      throw new Error(`Error adding user via RPC: ${error.message}`)
    }

    return data // מחזיר את ה-UUID של המשתמש החדש
  } catch (error) {
    console.error("Error in addUser:", error)
    throw error
  }
}

// פונקציה למחיקת משתמש באמצעות RPC
export async function deleteUser(userId: string) {
  try {
    const supabase = getSupabaseClient()
    if (!supabase) {
      throw new Error("Supabase client is not available")
    }

    const { data, error } = await supabase.rpc("delete_user", {
      user_id: userId,
    })

    if (error) {
      console.error("Error deleting user via RPC:", error.message)
      throw new Error(`Error deleting user via RPC: ${error.message}`)
    }

    return data
  } catch (error) {
    console.error("Error in deleteUser:", error)
    throw error
  }
}

// פונקציה לעדכון סטטוס משתמש באמצעות RPC
export async function updateUserStatus(userId: string, newStatus: string) {
  try {
    const supabase = getSupabaseClient()
    if (!supabase) {
      throw new Error("Supabase client is not available")
    }

    const { data, error } = await supabase.rpc("update_user_status", {
      user_id: userId,
      new_status: newStatus,
    })

    if (error) {
      console.error("Error updating user status via RPC:", error.message)
      throw new Error(`Error updating user status via RPC: ${error.message}`)
    }

    return data
  } catch (error) {
    console.error("Error in updateUserStatus:", error)
    throw error
  }
}

// פונקציה לעדכון נקודות משתמש באמצעות RPC
export async function updateUserPoints(userId: string, newPoints: number) {
  try {
    const supabase = getSupabaseClient()
    if (!supabase) {
      throw new Error("Supabase client is not available")
    }

    const { data, error } = await supabase.rpc("update_user_points", {
      user_id: userId,
      new_points: newPoints,
    })

    if (error) {
      console.error("Error updating user points via RPC:", error.message)
      throw new Error(`Error updating user points via RPC: ${error.message}`)
    }

    return data
  } catch (error) {
    console.error("Error in updateUserPoints:", error)
    throw error
  }
}

// פונקציה לקבלת כל המשתמשים באמצעות RPC
export async function getAllUsers() {
  try {
    const supabase = getSupabaseClient()
    if (!supabase) {
      throw new Error("Supabase client is not available")
    }

    const { data, error } = await supabase.rpc("get_all_users_for_admin")

    if (error) {
      console.error("Error getting all users via RPC:", error.message)

      // נסיון לקבל משתמשים ישירות מהטבלה כגיבוי
      const { data: fallbackData, error: fallbackError } = await supabase.from("users").select("*").order("name")

      if (fallbackError) {
        throw new Error(`Error fetching users: ${fallbackError.message}`)
      }

      return fallbackData || []
    }

    return data || []
  } catch (error) {
    console.error("Error in getAllUsers:", error)
    throw error
  }
}

// פונקציה לעדכון תוצאת משחק באמצעות RPC
export async function updateGameResult(gameId: string, result: string) {
  try {
    const supabase = getSupabaseClient()
    if (!supabase) {
      throw new Error("Supabase client is not available")
    }

    const { data, error } = await supabase.rpc("update_game_result", {
      game_id: gameId,
      game_result: result,
    })

    if (error) {
      console.error("Error updating game result via RPC:", error.message)
      throw new Error(`Error updating game result via RPC: ${error.message}`)
    }

    return data
  } catch (error) {
    console.error("Error in updateGameResult:", error)
    throw error
  }
}

// פונקציה לקבלת כל המשתמשים
export const getUsers = async (): Promise<User[]> => {
  try {
    if (!isSupabaseAvailable()) {
      console.error("Supabase is not available")
      return []
    }

    const supabase = getSupabaseClient()
    if (!supabase) {
      console.error("Supabase client is not available")
      return []
    }

    const { data, error } = await supabase.from("users").select("*").order("name")

    if (error) {
      console.error("Error getting users:", error)
      // לא נחזיר נתוני דוגמה, אלא מערך ריק
      return []
    }

    // המרת הנתונים למבנה הצפוי - using playercode
    return data.map((user) => ({
      id: user.id,
      name: user.name || "",
      email: user.email || "",
      phone: user.phone || "",
      city: user.city || "",
      playercode: user.playercode || "", // Use the correct column name
      status: user.status || "active",
      points: user.points || 0,
      // נשתמש בערכי ברירת מחדל לשדות שאולי לא קיימים
      correct_predictions: 0,
      total_predictions: 0,
      last_week_points: 0,
      trend: "same" as "up" | "down" | "same",
      success_rate: 0,
    }))
  } catch (error) {
    console.error("Error getting users:", error)
    return []
  }
}

// פונקציה ליצירת קוד שחקן אקראי
export function generatePlayerCode(): string {
  // יצירת מערך של 8 מספרים אקראיים בין 0 ל-9
  const randomDigits = Array.from({ length: 8 }, () => Math.floor(Math.random() * 10))
  return randomDigits.join("")
}

// פונקציה לבדיקה אם המשתמש הוא מנהל
export const isAdminUser = (playerCode: string): boolean => {
  // רשימת קודי שחקן של מנהלים
  const adminPlayerCodes = ["323317966"]
  return adminPlayerCodes.includes(playerCode)
}

// Update the getUserPredictions function to properly handle player codes
export const getUserPredictions = async (userIdentifier: string): Promise<any[]> => {
  try {
    console.log("Getting predictions for user:", userIdentifier)

    // בדיקה אם המשתמש הוא מנהל - אם כן, נחזיר מערך ריק כי אין צורך בניחושים למנהל
    if (isAdminUser(userIdentifier)) {
      console.log("Admin user detected, returning empty predictions array")
      return []
    }

    if (!isSupabaseAvailable()) {
      console.error("Supabase is not available")
      return []
    }

    const supabase = getSupabaseClient()
    if (!supabase) {
      console.error("Supabase client is not available")
      return []
    }

    // First, check if the userIdentifier is a valid UUID
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(userIdentifier)

    let userId = userIdentifier

    // If not a UUID, look up the user by playercode
    if (!isUUID) {
      console.log("Looking up user by playercode:", userIdentifier)

      // בדיקה אם המשתמש קיים
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("id")
        .eq("playercode", userIdentifier)

      if (userError) {
        console.error("Error finding user by playercode:", userError)

        // אם המשתמש הוא מנהל, נחזיר מערך ריק
        if (isAdminUser(userIdentifier)) {
          console.log("Admin user detected, returning empty predictions array")
          return []
        }

        return []
      }

      // Check if we found any users
      if (!userData || userData.length === 0) {
        console.log("No user found with playercode:", userIdentifier)

        // אם המשתמש הוא מנהל, נחזיר מערך ריק
        if (isAdminUser(userIdentifier)) {
          console.log("Admin user detected, returning empty predictions array")
          return []
        }

        // אם המשתמש לא נמצא, ננסה ליצור אותו אם הוא מנהל
        if (isAdminUser(userIdentifier)) {
          console.log("Creating admin user with playercode:", userIdentifier)
          try {
            const { data: newUser, error: createError } = await supabase
              .from("users")
              .insert([
                {
                  name: "מנהל",
                  playercode: userIdentifier,
                  status: "active",
                  points: 0,
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                },
              ])
              .select()

            if (createError) {
              console.error("Error creating admin user:", createError)
            } else if (newUser && newUser.length > 0) {
              console.log("Admin user created successfully:", newUser[0])
              userId = newUser[0].id
            }
          } catch (err) {
            console.error("Error creating admin user:", err)
          }
        }

        return []
      }

      // If multiple users found, use the first one
      if (userData.length > 1) {
        console.warn(`Multiple users found with playercode ${userIdentifier}, using the first one`)
      }

      userId = userData[0].id
      console.log("Found user ID:", userId)
    }

    // Now query predictions with the correct UUID
    const { data, error } = await supabase
      .from("predictions")
      .select("*")
      .eq("userid", userId)
      .order("timestamp", { ascending: false })

    if (error) {
      console.error("Error getting user predictions:", error)
      return []
    }

    return data || []
  } catch (error) {
    console.error("Error getting user predictions:", error)
    return []
  }
}

export const getGames = async (): Promise<any[]> => {
  try {
    if (!isSupabaseAvailable()) {
      console.error("Supabase is not available")
      return []
    }

    const supabase = getSupabaseClient()
    if (!supabase) {
      console.error("Supabase client is not available")
      return []
    }

    const { data, error } = await supabase.from("games").select("*").order("date")

    if (error) {
      console.error("Error getting games:", error)
      return []
    }

    return data || []
  } catch (error) {
    console.error("Error getting games:", error)
    return []
  }
}

export const seedSampleData = async (): Promise<boolean> => {
  try {
    // This function is intentionally left empty as the seeding logic is handled elsewhere.
    return true
  } catch (error) {
    console.error("Error seeding sample data:", error)
    return false
  }
}

export const getLeaderboard = async (timeFrame: string): Promise<any[]> => {
  try {
    if (!isSupabaseAvailable()) {
      console.error("Supabase is not available")
      return []
    }

    const supabase = getSupabaseClient()
    if (!supabase) {
      console.error("Supabase client is not available")
      return []
    }

    const { data, error } = await supabase.from("users").select("*").order("points", { ascending: false })

    if (error) {
      console.error("Error getting leaderboard data:", error)
      return []
    }

    return data || []
  } catch (error) {
    console.error("Error getting leaderboard data:", error)
    return []
  }
}

// Update the submitPrediction function in dataService.ts
export const submitPrediction = async (prediction: any): Promise<boolean> => {
  try {
    if (!isSupabaseAvailable()) {
      console.error("Supabase is not available")

      // Fallback to localStorage
      if (typeof window !== "undefined") {
        const predictions = JSON.parse(localStorage.getItem("predictions") || "[]")
        predictions.push({
          ...prediction,
          id: Date.now().toString(),
        })
        localStorage.setItem("predictions", JSON.stringify(predictions))
        return true
      }

      return false
    }

    const supabase = getSupabaseClient()
    if (!supabase) {
      console.error("Supabase client is not available")
      return false
    }

    // Log the prediction for debugging
    console.log("Submitting prediction:", prediction)

    // Check if the user exists
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("id", prediction.userid)
      .single()

    if (userError) {
      console.error("Error checking user:", userError)
      return false
    }

    if (!userData) {
      console.error("User not found with ID:", prediction.userid)
      return false
    }

    // Insert the prediction
    const { error } = await supabase.from("predictions").insert([prediction])

    if (error) {
      console.error("Error inserting prediction:", error)
      return false
    }

    return true
  } catch (error) {
    console.error("Error submitting prediction:", error)
    return false
  }
}

// Update to use the settings table instead of system_settings
export const updateSystemSettings = async (settings: any): Promise<boolean> => {
  try {
    if (!isSupabaseAvailable()) {
      return false
    }

    const supabase = getSupabaseClient()
    if (!supabase) {
      return false
    }

    try {
      // Try to update the settings table
      const { error } = await supabase.from("settings").upsert([{ id: "1", ...settings }], { onConflict: "id" })

      if (error) {
        console.error("Error updating system settings:", error)
        return false
      }

      return true
    } catch (error) {
      console.error("Error in updateSystemSettings:", error)
      return false
    }
  } catch (error) {
    console.error("Error updating system settings:", error)
    return false
  }
}

// Update to use the settings table instead of system_settings
export const getSystemSettings = async (): Promise<any> => {
  try {
    if (!isSupabaseAvailable()) {
      return { currentday: getCurrentDay() }
    }

    const supabase = getSupabaseClient()
    if (!supabase) {
      return { currentday: getCurrentDay() }
    }

    try {
      const { data, error } = await supabase.from("settings").select("*").limit(1).single()

      if (error) {
        // If the table doesn't exist, return default settings
        if (error.message.includes("does not exist")) {
          return { currentday: getCurrentDay() }
        }

        console.error("Error getting system settings:", error)
        return { currentday: getCurrentDay() }
      }

      return data || { currentday: getCurrentDay() }
    } catch (error) {
      // Return default settings for any other errors
      return { currentday: getCurrentDay() }
    }
  } catch (error) {
    console.error("Error getting system settings:", error)
    return { currentday: getCurrentDay() }
  }
}

// Helper function to get current day
function getCurrentDay(): string {
  const days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"]
  const today = new Date().getDay() // 0 = Sunday, 1 = Monday, etc.
  return days[today]
}

// Add this function to dataService.ts to help with game ID conversion
export async function getGameById(gameId: string) {
  try {
    const supabase = getSupabaseClient()
    if (!supabase) {
      throw new Error("Supabase client is not available")
    }

    // Try to find the game in the database
    const { data, error } = await supabase.from("games").select("*").eq("id", gameId).single()

    if (error) {
      console.error("Error finding game:", error)
      return null
    }

    return data
  } catch (error) {
    console.error("Error getting game by ID:", error)
    return null
  }
}
