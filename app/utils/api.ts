import { getSupabaseClient } from "../lib/supabase"

// Helper function to check if a string is a valid UUID
function isValidUUID(str: string) {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return uuidRegex.test(str)
}

// Function to convert simple IDs to valid UUIDs
async function getGameUUID(gameId: string) {
  // If it's already a valid UUID, return it
  if (isValidUUID(gameId)) {
    return gameId
  }

  try {
    const supabase = getSupabaseClient()
    if (!supabase) {
      throw new Error("Supabase client is not available")
    }

    // Try to find the game in the database by its simple ID or other identifier
    const { data, error } = await supabase.from("games").select("id").eq("id", gameId).single()

    if (error || !data) {
      console.error("Error finding game:", error || "No game found")
      throw new Error("Game not found")
    }

    return data.id
  } catch (error) {
    console.error("Error getting game UUID:", error)
    throw error
  }
}

// עדכון פונקציית submitPrediction כדי להסיר את השימוש ב-external_user_id

// במקום הקוד הקיים של פונקציית submitPrediction, החלף אותו בקוד הבא:
export const submitPrediction = async (prediction: any): Promise<boolean> => {
  try {
    // שמירה בלוקל סטורג' תחילה כגיבוי
    if (typeof window !== "undefined") {
      const predictions = JSON.parse(localStorage.getItem("predictions") || "[]")
      predictions.push({
        ...prediction,
        id: Date.now().toString(),
        timestamp: new Date(),
      })
      localStorage.setItem("predictions", JSON.stringify(predictions))
      console.log("Prediction saved to localStorage")
    }

    // נסה לשמור ב-Supabase
    try {
      const supabase = getSupabaseClient()

      if (!supabase) {
        console.error("Supabase is not available")
        return true // מחזיר הצלחה כי שמרנו בלוקל סטורג'
      }

      // בדוק אם המשתמש קיים לפי קוד השחקן
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("id")
        .eq("playercode", prediction.user_id)
        .limit(1)

      if (userError) {
        console.error("Error checking user:", userError)
        return true // מחזיר הצלחה כי שמרנו בלוקל סטורג'
      }

      // אם המשתמש קיים, השתמש ב-ID שלו
      if (userData && userData.length > 0) {
        const userId = userData[0].id

        // שמירת הניחוש עם ה-ID של המשתמש
        const { error: predError } = await supabase.from("predictions").insert([
          {
            userid: userId,
            gameid: prediction.game_id,
            prediction: prediction.prediction,
            timestamp: new Date().toISOString(),
          },
        ])

        if (predError) {
          console.error("Error saving prediction:", predError)
          // אם יש שגיאה, נסתפק בשמירה בלוקל סטורג'
          return true
        }
      } else {
        // אם המשתמש לא קיים, שמור רק בלוקל סטורג'
        console.log("User not found, prediction saved only to localStorage")
      }

      console.log("Prediction process completed")
      return true
    } catch (supabaseError) {
      console.error("Error with Supabase:", supabaseError)
      return true // מחזיר הצלחה כי שמרנו בלוקל סטורג'
    }
  } catch (error) {
    console.error("Error submitting prediction:", error)
    return false
  }
}
