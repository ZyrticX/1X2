/**
 * מחשב את הנקודות עבור ניחוש נכון
 * @param prediction הניחוש של המשתמש
 * @param result התוצאה בפועל
 * @param isSaturdayGame האם זה משחק שבת
 * @returns מספר הנקודות
 */
export function calculatePoints(prediction: string, result: string, isSaturdayGame: boolean): number {
  // בדיקה אם הניחוש נכון
  const isCorrect = prediction === result

  if (!isCorrect) {
    return 0
  }

  // נקודות בסיסיות לניחוש נכון - שינוי ל-1 נקודה
  const basePoints = 1

  // בדיקה אם זה משחק שבת (X2)
  const multiplier = isSaturdayGame ? 2 : 1

  return basePoints * multiplier
}

/**
 * בדיקה אם משחק מתקיים ביום שבת
 * @param gameDate תאריך המשחק
 * @returns האם המשחק מתקיים ביום שבת
 */
export function isSaturdayGame(gameDate: Date): boolean {
  // יום שבת הוא 6 (0 = יום ראשון, 6 = יום שבת)
  return gameDate.getDay() === 6
}

/**
 * פונקציה לבדיקת הכפלת נקודות במשחקי שבת
 * @param gameDate תאריך המשחק
 * @param prediction הניחוש של המשתמש
 * @param result התוצאה בפועל
 * @returns אובייקט עם פרטי החישוב
 */
export function testSaturdayBonus(
  gameDate: Date,
  prediction: string,
  result: string,
): {
  isCorrect: boolean
  isSaturday: boolean
  basePoints: number
  totalPoints: number
  explanation: string
} {
  const isCorrect = prediction === result
  const isSaturday = isSaturdayGame(gameDate)
  const basePoints = isCorrect ? 1 : 0 // שינוי ל-1 נקודה
  const totalPoints = calculatePoints(prediction, result, isSaturday)

  let explanation = ""

  if (!isCorrect) {
    explanation = "הניחוש לא נכון, לכן 0 נקודות"
  } else if (isSaturday) {
    explanation = `ניחוש נכון (${basePoints} נקודות) במשחק שבת (X2) = ${totalPoints} נקודות`
  } else {
    explanation = `ניחוש נכון = ${basePoints} נקודות`
  }

  return {
    isCorrect,
    isSaturday,
    basePoints,
    totalPoints,
    explanation,
  }
}
