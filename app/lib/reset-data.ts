/**
 * פונקציה לאיפוס נתוני המערכת לתחילת שבוע חדש
 */
import { getSupabaseClient } from "./supabase"

export async function resetWeeklyData() {
  try {
    const supabase = getSupabaseClient()
    if (!supabase) {
      console.error("Supabase client is not available")
      return false
    }

    // עדכון מספר השבוע הנוכחי בטבלת הגדרות
    const { data: settingsData, error: settingsError } = await supabase
      .from("settings")
      .select("*")
      .eq("id", "current_week")
      .single()

    if (settingsError && !settingsError.message.includes("No rows found")) {
      console.error("Error fetching current week:", settingsError)
      return false
    }

    const currentWeek = settingsData ? Number.parseInt(settingsData.value) : 1
    const newWeek = currentWeek + 1

    // עדכון או יצירת הגדרת השבוע הנוכחי
    const { error: updateError } = await supabase
      .from("settings")
      .upsert({ id: "current_week", value: newWeek.toString() })

    if (updateError) {
      console.error("Error updating current week:", updateError)
      return false
    }

    // איפוס טבלת דירוג שבועית
    const { error: leaderboardError } = await supabase.rpc("reset_weekly_leaderboard")

    if (leaderboardError) {
      console.error("Error resetting leaderboard:", leaderboardError)
      return false
    }

    // איפוס תוצאות משחקים
    const { error: resultsError } = await supabase.from("game_results").delete().eq("week", currentWeek)

    if (resultsError) {
      console.error("Error resetting game results:", resultsError)
      return false
    }

    console.log("כל הנתונים אופסו לתחילת שבוע חדש")
    return true
  } catch (error) {
    console.error("Error resetting weekly data:", error)
    return false
  }
}
