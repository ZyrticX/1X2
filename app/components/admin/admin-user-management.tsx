"use client"

import { useState, useEffect } from "react"
import { Search, UserX, Trash2, CheckCircle, Edit, AlertCircle } from "lucide-react"
import { getUsers, updateUserStatus, deleteUser } from "../../lib/dataService"

// עדכון הממשק של AdminUser להסרת השדות המיותרים
export interface AdminUser {
  id: string
  name: string
  phone: string
  city: string
  playercode: string // Updated to match database column name
  status: "active" | "blocked"
  winner?: boolean
}

export default function AdminUserManagement() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [filteredUsers, setFilteredUsers] = useState<AdminUser[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "blocked">("all")
  const [loading, setLoading] = useState(true)
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [actionType, setActionType] = useState<"block" | "delete" | "activate">("block")
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // הוספת סטייטים לבחירת משחק וניחוש
  const [selectedGameForUser, setSelectedGameForUser] = useState("")
  const [selectedPredictionForUser, setSelectedPredictionForUser] = useState("")
  const [weeklyGames, setWeeklyGames] = useState<any>(null)

  // הוספת סטייט למודאל עריכה
  const [showEditModal, setShowEditModal] = useState(false)

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true)
      setErrorMessage(null)
      try {
        const usersData = await getUsers()
        // המרת הנתונים למבנה הנדרש - using playercode instead of player_code
        const formattedUsers = usersData.map((user) => ({
          id: user.id,
          name: user.name || "",
          phone: user.phone || "",
          city: user.city || "",
          playercode: user.playercode || "", // Use the correct column name
          status: (user.status as "active" | "blocked") || "active",
          winner: false, // ברירת מחדל
        }))
        setUsers(formattedUsers)
        setFilteredUsers(formattedUsers)

        // אם אין משתמשים, נציג הודעה מתאימה בטבלה במקום להשתמש בנתוני דוגמה
      } catch (error) {
        console.error("Error fetching users:", error)
        setErrorMessage("אירעה שגיאה בטעינת המשתמשים. נסה לרענן את הדף.")
        // לא נשתמש בנתוני דוגמה במקרה של שגיאה
        setUsers([])
        setFilteredUsers([])
      } finally {
        setLoading(false)
      }
    }

    fetchUsers()
  }, [])

  // הוספת useEffect לטעינת המשחקים השבועיים
  useEffect(() => {
    // בפרויקט אמיתי, כאן היינו מביאים את המשחקים מהשרת
    // כרגע נשתמש בנתוני דוגמה
    const mockWeeklyGames = {
      sunday: [
        { id: "1", homeTeam: "מכבי חיפה", awayTeam: "הפועל באר שבע" },
        { id: "2", homeTeam: "מכבי תל אביב", awayTeam: "הפועל תל אביב" },
      ],
      monday: [{ id: "3", homeTeam: 'בית"ר ירושלים', awayTeam: "הפועל ירושלים" }],
      // ... יתר הימים
    }

    setWeeklyGames(mockWeeklyGames)
  }, [])

  useEffect(() => {
    let result = users

    if (searchTerm) {
      result = result.filter(
        (user) =>
          user.name.includes(searchTerm) ||
          user.phone.includes(searchTerm) ||
          user.city.includes(searchTerm) ||
          user.playercode.includes(searchTerm),
      )
    }

    if (statusFilter !== "all") {
      result = result.filter((user) => user.status === statusFilter)
    }

    setFilteredUsers(result)
  }, [users, searchTerm, statusFilter])

  const handleAction = (user: AdminUser, action: "block" | "delete" | "activate") => {
    setSelectedUser(user)
    setActionType(action)
    setShowConfirmDialog(true)
  }

  const confirmAction = async () => {
    if (!selectedUser) return
    setErrorMessage(null)

    try {
      if (actionType === "delete") {
        // מחיקת משתמש
        const success = await deleteUser(selectedUser.id)
        if (success) {
          const updatedUsers = users.filter((u) => u.id !== selectedUser.id)
          setUsers(updatedUsers)
        } else {
          setErrorMessage("אירעה שגיאה במחיקת המשתמש")
        }
      } else {
        // עדכון סטטוס משתמש
        const newStatus = actionType === "activate" ? "active" : "blocked"
        const success = await updateUserStatus(selectedUser.id, newStatus)

        if (success) {
          const updatedUsers = users.map((u) => {
            if (u.id === selectedUser.id) {
              return { ...u, status: newStatus }
            }
            return u
          })
          setUsers(updatedUsers)
        } else {
          setErrorMessage("אירעה שגיאה בעדכון סטטוס המשתמש")
        }
      }
    } catch (error) {
      console.error(`Error during ${actionType} action:`, error)
      setErrorMessage(`אירעה שגיאה בביצוע הפעולה: ${actionType}`)
    }

    setShowConfirmDialog(false)
    setSelectedUser(null)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">פעיל</span>
      case "blocked":
        return <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs">חסום</span>
      default:
        return null
    }
  }

  // הוספת פונקציה לעריכת משתמש
  const handleEditUser = (user: AdminUser) => {
    // פתיחת חלון מודאלי לעריכת משתמש
    setSelectedUser(user)
    setShowEditModal(true)
  }

  // פונקציה ליצירת משתמשי דוגמה
  function generateMockUsers(count: number): AdminUser[] {
    const cities = ["תל אביב", "ירושלים", "חיפה", "באר שבע", "אשדוד"]
    const firstNames = ["דני", "רונית", "משה", "יעל", "אבי", "שרה", "יוסי", "מיכל"]
    const lastNames = ["לוי", "כהן", "מזרחי", "גולן", "אברהם", "פרץ", "דוד"]

    return Array.from({ length: count }, (_, index) => {
      const firstName = firstNames[Math.floor(Math.random() * firstNames.length)]
      const lastName = lastNames[Math.floor(Math.random() * lastNames.length)]
      const name = `${firstName} ${lastName}`
      const city = cities[Math.floor(Math.random() * cities.length)]
      const phone = `05${Math.floor(Math.random() * 10)}${Math.floor(Math.random() * 10000000)
        .toString()
        .padStart(7, "0")}`
      const playerCode = Math.floor(10000000 + Math.random() * 90000000).toString()

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
        playercode: playerCode, // Updated to match database column name
        status,
        winner,
      }
    })
  }

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h3 className="text-xl font-bold">ניהול משתמשים</h3>
        <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
          <div className="relative flex-grow">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="חיפוש לפי שם, טלפון, עיר או קוד"
              className="pl-3 pr-10 py-2 border border-gray-300 rounded-md w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select
            className="border border-gray-300 rounded-md px-3 py-2"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
          >
            <option value="all">כל הסטטוסים</option>
            <option value="active">פעילים</option>
            <option value="blocked">חסומים</option>
          </select>
        </div>
      </div>

      {errorMessage && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md flex items-center">
          <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {loading ? (
        <div className="text-center py-8">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-navy-600 border-r-transparent"></div>
          <p className="mt-2 text-gray-600">טוען משתמשים...</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          {/* עדכון הטבלה להסרת העמודות המיותרות */}
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100 text-gray-700">
                <th className="px-4 py-3 text-right">שם</th>
                <th className="px-4 py-3 text-right">טלפון</th>
                <th className="px-4 py-3 text-right">עיר</th>
                <th className="px-4 py-3 text-right">קוד שחקן</th>
                <th className="px-4 py-3 text-center">סטטוס</th>
                <th className="px-4 py-3 text-center">זוכה</th>
                <th className="px-4 py-3 text-center">פעולות</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="px-4 py-3 text-right">{user.name}</td>
                    <td className="px-4 py-3 text-right">{user.phone}</td>
                    <td className="px-4 py-3 text-right">{user.city}</td>
                    <td className="px-4 py-3 text-right font-mono">{user.playercode}</td>
                    <td className="px-4 py-3 text-center">{getStatusBadge(user.status)}</td>
                    <td className="px-4 py-3 text-center">
                      <button
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          user.winner
                            ? "bg-green-100 text-green-800 hover:bg-green-200"
                            : "bg-gray-100 text-gray-800 hover:bg-gray-200"
                        }`}
                        onClick={() => {
                          const updatedUsers = users.map((u) => (u.id === user.id ? { ...u, winner: !u.winner } : u))
                          setUsers(updatedUsers)
                        }}
                      >
                        {user.winner ? "זוכה" : "לא זוכה"}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex justify-center space-x-1 rtl:space-x-reverse">
                        <button
                          className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                          title="ערוך"
                          onClick={() => handleEditUser(user)}
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        {user.status !== "blocked" ? (
                          <button
                            className="p-1 text-red-600 hover:bg-red-50 rounded"
                            title="חסום"
                            onClick={() => handleAction(user, "block")}
                          >
                            <UserX className="w-4 h-4" />
                          </button>
                        ) : (
                          <button
                            className="p-1 text-green-600 hover:bg-green-50 rounded"
                            title="הפעל"
                            onClick={() => handleAction(user, "activate")}
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          className="p-1 text-red-600 hover:bg-red-50 rounded"
                          title="מחק"
                          onClick={() => handleAction(user, "delete")}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                    לא נמצאו משתמשים התואמים את החיפוש
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Confirmation Dialog */}
      {showConfirmDialog && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h4 className="text-lg font-bold mb-4">אישור פעולה</h4>
            <p className="mb-6">
              {actionType === "block" && `האם אתה בטוח שברצונך לחסום את ${selectedUser.name}?`}
              {actionType === "delete" && `האם אתה בטוח שברצונך למחוק את ${selectedUser.name}?`}
              {actionType === "activate" && `האם אתה בטוח שברצונך להפעיל את ${selectedUser.name}?`}
            </p>
            <div className="flex justify-end space-x-2 rtl:space-x-reverse">
              <button
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
                onClick={() => setShowConfirmDialog(false)}
              >
                ביטול
              </button>
              <button
                className={`px-4 py-2 text-white rounded-md ${
                  actionType === "delete"
                    ? "bg-red-600 hover:bg-red-700"
                    : actionType === "activate"
                      ? "bg-green-600 hover:bg-green-700"
                      : "bg-navy-600 hover:bg-navy-700"
                }`}
                onClick={confirmAction}
              >
                אישור
              </button>
            </div>
          </div>
        </div>
      )}

      {/* הוספת המודאל לעריכת משתמש בסוף הקומפוננטה, לפני הסגירה של הדיב האחרון */}
      {showEditModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h4 className="text-lg font-bold mb-4">עריכת משתמש</h4>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">שם</label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                value={selectedUser.name}
                onChange={(e) => setSelectedUser({ ...selectedUser, name: e.target.value })}
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">טלפון</label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                value={selectedUser.phone}
                onChange={(e) => setSelectedUser({ ...selectedUser, phone: e.target.value })}
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">עיר</label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                value={selectedUser.city}
                onChange={(e) => setSelectedUser({ ...selectedUser, city: e.target.value })}
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">קוד שחקן</label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                value={selectedUser.playercode}
                onChange={(e) => setSelectedUser({ ...selectedUser, playercode: e.target.value })}
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">זוכה</label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                value={selectedUser.winner ? "true" : "false"}
                onChange={(e) => setSelectedUser({ ...selectedUser, winner: e.target.value === "true" })}
              >
                <option value="true">זוכה</option>
                <option value="false">לא זוכה</option>
              </select>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">סמן משחק עבור השחקן</label>
              <div className="grid grid-cols-2 gap-2">
                <select
                  className="px-3 py-2 border border-gray-300 rounded-md"
                  value={selectedGameForUser}
                  onChange={(e) => setSelectedGameForUser(e.target.value)}
                >
                  <option value="">בחר משחק</option>
                  {Object.values(weeklyGames || {})
                    .flat()
                    .map((game: any) => (
                      <option key={game.id} value={game.id}>
                        {game.homeTeam} נגד {game.awayTeam}
                      </option>
                    ))}
                </select>
                <select
                  className="px-3 py-2 border border-gray-300 rounded-md"
                  value={selectedPredictionForUser}
                  onChange={(e) => setSelectedPredictionForUser(e.target.value)}
                >
                  <option value="">בחר ניחוש</option>
                  <option value="1">1 - ניצחון בית</option>
                  <option value="X">X - תיקו</option>
                  <option value="2">2 - ניצחון חוץ</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end space-x-2 rtl:space-x-reverse">
              <button
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
                onClick={() => {
                  setShowEditModal(false)
                  setSelectedUser(null)
                }}
              >
                ביטול
              </button>
              <button
                className="px-4 py-2 bg-navy-600 text-white rounded-md hover:bg-navy-700"
                onClick={() => {
                  // שמירת השינויים
                  const updatedUsers = users.map((u) => (u.id === selectedUser.id ? selectedUser : u))
                  setUsers(updatedUsers)

                  // אם נבחר משחק וניחוש, שמור את הניחוש עבור המשתמש
                  if (selectedGameForUser && selectedPredictionForUser) {
                    // כאן יש להוסיף את הלוגיקה לשמירת הניחוש
                    console.log(
                      `סימון משחק ${selectedGameForUser} עם ניחוש ${selectedPredictionForUser} עבור משתמש ${selectedUser.id}`,
                    )
                    // בפרויקט אמיתי, כאן היינו שולחים את הנתונים לשרת
                  }

                  setShowEditModal(false)
                  setSelectedUser(null)
                }}
              >
                שמור
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
