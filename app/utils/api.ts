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

// מחיקת כל השימושים ב-localStorage

export const submitPrediction = async (prediction: any): Promise<boolean> => {
  try {
    // נסה לשמור ב-Supabase
    const supabase = getSupabaseClient()

    if (!supabase) {
      console.error("Supabase is not available")
      return false
    }

    // בדוק אם המשתמש קיים לפי קוד השחקן
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("playercode", prediction.user_id)
      .limit(1)

    if (userError) {
      console.error("Error checking user:", userError)
      return false
    }

    // אם המשתמש קיים, השתמש ב-ID שלו
    if (userData && userData.length > 0) {
      const userId = userData[0].id

      // בדיקה אם כבר קיים ניחוש למשחק זה מהמשתמש הזה
      const { data: existingPrediction, error: checkError } = await supabase
        .from("predictions")
        .select("*")
        .eq("gameid", prediction.game_id)
        .eq("userid", userId)

      if (checkError) {
        console.error("Error checking existing prediction:", checkError)
        return false
      }

      if (existingPrediction && existingPrediction.length > 0) {
        // עדכון ניחוש קיים
        const { error: updateError } = await supabase
          .from("predictions")
          .update({
            prediction: prediction.prediction,
            timestamp: new Date().toISOString(),
          })
          .eq("id", existingPrediction[0].id)

        if (updateError) {
          console.error("Error updating prediction:", updateError)
          return false
        }
      } else {
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
          return false
        }
      }
    } else {
      // אם המשתמש לא קיים
      console.log("User not found, prediction not saved")
      return false
    }

    console.log("Prediction process completed")
    return true
  } catch (error) {
    console.error("Error submitting prediction:", error)
    return false
  }
}
