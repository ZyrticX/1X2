import { collection, doc, addDoc, updateDoc, getDocs, query, where, deleteDoc } from "firebase/firestore"
import { getDb, isFirestoreAvailable } from "./firebase"

// עדכון תוצאת משחק
export const updateGameResult = async (gameId: string, result: string): Promise<boolean> => {
  try {
    if (!isFirestoreAvailable()) {
      console.error("Firestore is not available")
      return false
    }

    const db = getDb()
    if (!db) {
      console.error("Firestore db is not available")
      return false
    }

    // בדיקה אם כבר קיימת תוצאה למשחק זה
    const resultsRef = collection(db, "gameResults")
    const q = query(resultsRef, where("gameId", "==", gameId))
    const querySnapshot = await getDocs(q)

    if (!querySnapshot.empty) {
      // עדכון תוצאה קיימת
      const docId = querySnapshot.docs[0].id
      await updateDoc(doc(db, "gameResults", docId), {
        result,
        updatedAt: new Date(),
      })
    } else {
      // יצירת תוצאה חדשה
      await addDoc(collection(db, "gameResults"), {
        gameId,
        result,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
    }

    // עדכון סטטוס המשחק ל"הסתיים"
    const gamesRef = collection(db, "games")
    const gamesQuery = query(gamesRef, where("id", "==", gameId))
    const gamesSnapshot = await getDocs(gamesQuery)

    if (!gamesSnapshot.empty) {
      const gameDocId = gamesSnapshot.docs[0].id
      await updateDoc(doc(db, "games", gameDocId), {
        result,
        isFinished: true,
        updatedAt: new Date(),
      })
    }

    return true
  } catch (error) {
    console.error("Error updating game result:", error)
    return false
  }
}

// הוספת משחק חדש
export const addGame = async (game: any): Promise<string | null> => {
  try {
    if (!isFirestoreAvailable()) {
      console.error("Firestore is not available")
      return null
    }

    const db = getDb()
    if (!db) {
      console.error("Firestore db is not available")
      return null
    }

    const docRef = await addDoc(collection(db, "games"), {
      ...game,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    return docRef.id
  } catch (error) {
    console.error("Error adding game:", error)
    return null
  }
}

// מחיקת משחק
export const deleteGame = async (gameId: string): Promise<boolean> => {
  try {
    if (!isFirestoreAvailable()) {
      console.error("Firestore is not available")
      return false
    }

    const db = getDb()
    if (!db) {
      console.error("Firestore db is not available")
      return false
    }

    // מציאת המסמך עם ה-ID המתאים
    const gamesRef = collection(db, "games")
    const q = query(gamesRef, where("id", "==", gameId))
    const querySnapshot = await getDocs(q)

    if (!querySnapshot.empty) {
      const docId = querySnapshot.docs[0].id
      await deleteDoc(doc(db, "games", docId))
      return true
    }

    return false
  } catch (error) {
    console.error("Error deleting game:", error)
    return false
  }
}
