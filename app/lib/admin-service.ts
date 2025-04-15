import { getSupabaseClient, isSupabaseAvailable } from "./supabase"

// פונקציה ליצירת קוד שחקן אקראי ומאובטח
export function generateSecurePlayerCode(): string {
  // יצירת מערך של 8 מספרים אקראיים בין 0 ל-9
  const randomDigits = Array.from({ length: 8 }, () => Math.floor(Math.random() * 10))
  return randomDigits.join("")
}

// פונקציה ליצירת נתוני משתמשים לדוגמה
export function generateMockUsers(count: number): any[] {
  const cities = ["תל אביב", "ירושלים", "חיפה", "באר שבע", "אשדוד", "נתניה", "רמת גן", "הרצליה", "חולון", "פתח תקווה"]
  const firstNames = [
    "דני",
    "רונית",
    "משה",
    "יעל",
    "אבי",
    "שרה",
    "יוסי",
    "מיכל",
    "דוד",
    "רחל",
    "עמית",
    "נועה",
    "אלון",
    "שירה",
  ]
  const lastNames = ["לוי", "כהן", "מזרחי", "גולן", "אברהם", "פרץ", "דוד", "אדרי", "חזן", "ביטון", "גבאי", "אוחיון"]

  return Array.from({ length: count }, (_, index) => {
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)]
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)]
    const name = `${firstName} ${lastName}`
    const city = cities[Math.floor(Math.random() * cities.length)]
    const phone = `05${Math.floor(Math.random() * 10)}${Math.floor(Math.random() * 10000000)
      .toString()
      .padStart(7, "0")}`
    const playerCode = generateSecurePlayerCode()

    // רוב המשתמשים פעילים, מיעוט חסומים
    const statusRandom = Math.random()
    let status: "active" | "blocked" = "active"
    if (statusRandom > 0.9) {
      status = "blocked"
    }

    // הוספת שדה winner - רק מעט משתמשים יהיו זוכים
    const winner = Math.random() > 0.8

    return {
      id: `user-${index + 1}`,
      name,
      phone,
      city,
      playerCode,
      status,
      winner,
    }
  })
}

// Update game result
export const updateGameResult = async (gameId: string, result: string): Promise<boolean> => {
  try {
    if (!isSupabaseAvailable()) {
      console.error("Supabase is not available")
      return false
    }

    const supabase = getSupabaseClient()
    if (!supabase) {
      console.error("Supabase client is not available")
      return false
    }

    // Check if result already exists
    const { data: existingResults, error: fetchError } = await supabase
      .from("game_results")
      .select("*")
      .eq("game_id", gameId)

    if (fetchError) {
      console.error("Error checking existing result:", fetchError)
      return false
    }

    if (existingResults && existingResults.length > 0) {
      // Update existing result
      const { error: updateError } = await supabase
        .from("game_results")
        .update({
          result,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingResults[0].id)

      if (updateError) {
        console.error("Error updating game result:", updateError)
        return false
      }
    } else {
      // Create new result
      const { error: insertError } = await supabase.from("game_results").insert({
        game_id: gameId,
        result,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })

      if (insertError) {
        console.error("Error inserting game result:", insertError)
        return false
      }
    }

    // Update game status to finished
    const { error: gameUpdateError } = await supabase
      .from("games")
      .update({
        result,
        is_finished: true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", gameId)

    if (gameUpdateError) {
      console.error("Error updating game status:", gameUpdateError)
      return false
    }

    return true
  } catch (error) {
    console.error("Error updating game result:", error)
    return false
  }
}

// Add new game
export const addGame = async (game: any): Promise<string | null> => {
  try {
    if (!isSupabaseAvailable()) {
      console.error("Supabase is not available")
      return null
    }

    const supabase = getSupabaseClient()
    if (!supabase) {
      console.error("Supabase client is not available")
      return null
    }

    const { data, error } = await supabase
      .from("games")
      .insert({
        home_team: game.homeTeam,
        away_team: game.awayTeam,
        time: game.time,
        date: game.date,
        league: game.league,
        closing_time: game.closingTime,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()

    if (error) {
      console.error("Error adding game:", error)
      return null
    }

    return data[0].id
  } catch (error) {
    console.error("Error adding game:", error)
    return null
  }
}

// Delete game
export const deleteGame = async (gameId: string): Promise<boolean> => {
  try {
    if (!isSupabaseAvailable()) {
      console.error("Supabase is not available")
      return false
    }

    const supabase = getSupabaseClient()
    if (!supabase) {
      console.error("Supabase client is not available")
      return false
    }

    const { error } = await supabase.from("games").delete().eq("id", gameId)

    if (error) {
      console.error("Error deleting game:", error)
      return false
    }

    return true
  } catch (error) {
    console.error("Error deleting game:", error)
    return false
  }
}
