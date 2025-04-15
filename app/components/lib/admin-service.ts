// ניקוי וארגון שירותי מנהל

import type { AdminUser } from "../components/admin/admin-user-management"

// פונקציה ליצירת קוד שחקן אקראי ומאובטח
export function generateSecurePlayerCode(): string {
  // יצירת מערך של 8 מספרים אקראיים בין 0 ל-9
  const randomDigits = Array.from({ length: 8 }, () => Math.floor(Math.random() * 10))
  return randomDigits.join("")
}

// פונקציה ליצירת נתוני משתמשים לדוגמה
export function generateMockUsers(count: number): AdminUser[] {
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
