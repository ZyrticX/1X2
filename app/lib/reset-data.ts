/**
 * פונקציה לאיפוס נתוני המערכת לתחילת שבוע חדש
 */
export function resetWeeklyData() {
  if (typeof window === "undefined") return

  // איפוס מספר השבוע הנוכחי
  const currentWeek = localStorage.getItem("currentWeek")
  if (currentWeek) {
    const weekNumber = Number.parseInt(currentWeek)
    localStorage.setItem("currentWeek", (weekNumber + 1).toString())
  } else {
    localStorage.setItem("currentWeek", "1")
  }

  // איפוס ניחושים
  localStorage.removeItem("predictions")

  // איפוס טבלת דירוג שבועית
  const leaderboardData = localStorage.getItem("leaderboard")
  if (leaderboardData) {
    try {
      const parsedData = JSON.parse(leaderboardData)
      // איפוס מלא של הנקודות השבועיות
      const resetData = parsedData.map((user: any) => ({
        ...user,
        lastWeekPoints: 0,
        trend: "same",
        // איפוס הנקודות השבועיות
        weeklyPoints: 0,
        weeklyCorrectPredictions: 0,
        weeklyTotalPredictions: 0,
      }))
      localStorage.setItem("leaderboard", JSON.stringify(resetData))
    } catch (error) {
      console.error("Error resetting leaderboard data:", error)
    }
  }

  // איפוס תוצאות משחקים
  localStorage.removeItem("gameResults")

  // איפוס טבלת דירוג שבועית נפרדת (אם קיימת)
  localStorage.removeItem("weeklyLeaderboard")

  console.log("כל הנתונים אופסו לתחילת שבוע חדש")
}
