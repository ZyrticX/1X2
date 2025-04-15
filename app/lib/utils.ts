// יצירת קובץ utils חדש עם פונקציות שימושיות

// פונקציה ליצירת קוד אקראי
export function generateRandomCode(length: number): string {
  const digits = Array.from({ length }, () => Math.floor(Math.random() * 10))
  return digits.join("")
}

// פונקציה לפורמט תאריך לפורמט עברי
export function formatDateHebrew(date: Date): string {
  return date.toLocaleDateString("he-IL", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

// פונקציה לפורמט זמן לפורמט עברי
export function formatTimeHebrew(date: Date): string {
  return date.toLocaleTimeString("he-IL", {
    hour: "2-digit",
    minute: "2-digit",
  })
}

// פונקציה לבדיקה אם משחק מתקיים ביום שבת
export function isSaturdayGame(gameDate: Date): boolean {
  // יום שבת הוא 6 (0 = יום ראשון, 6 = יום שבת)
  return gameDate.getDay() === 6
}
