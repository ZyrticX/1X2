"use client"

import { useState, useEffect } from "react"
import {
  TestTube,
  Calendar,
  Clock,
  User,
  Lock,
  Unlock,
  Save,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertTriangle,
} from "lucide-react"

export default function AdminTestingTool() {
  // State for different test sections
  const [activeTab, setActiveTab] = useState<"auth" | "timer" | "days" | "predictions" | "admin">("auth")
  const [testResults, setTestResults] = useState<Record<string, { success: boolean; message: string }>>({})
  const [isRunningTest, setIsRunningTest] = useState(false)

  // Auth testing state
  const [testUserCode, setTestUserCode] = useState("12345678")
  const [testAdminCode, setTestAdminCode] = useState("50244100")
  const [testSuperAdminCode, setTestSuperAdminCode] = useState("987654321")

  // Timer testing state
  const [testDay, setTestDay] = useState(getCurrentDay())
  const [testTime, setTestTime] = useState(getCurrentTime())
  const [testClosingTime, setTestClosingTime] = useState("")

  // Day selection testing
  const [systemDay, setSystemDay] = useState(getStoredSystemDay())

  // Prediction testing
  const [testGameId, setTestGameId] = useState("1")
  const [testPrediction, setTestPrediction] = useState("1")

  // Admin functionality testing
  const [testLockGameId, setTestLockGameId] = useState("1")
  const [testLockStatus, setTestLockStatus] = useState(false)

  // Helper functions
  function getCurrentDay() {
    const days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"]
    return days[new Date().getDay()]
  }

  function getCurrentTime() {
    const now = new Date()
    return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`
  }

  function getStoredSystemDay() {
    if (typeof window !== "undefined") {
      return localStorage.getItem("currentSystemDay") || getCurrentDay()
    }
    return getCurrentDay()
  }

  // Load stored values on component mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedSystemDay = localStorage.getItem("currentSystemDay")
      if (storedSystemDay) {
        setSystemDay(storedSystemDay)
      }

      // Check if any games are locked
      const storedLockedGames = localStorage.getItem("adminGames")
      if (storedLockedGames) {
        try {
          const adminGames = JSON.parse(storedLockedGames)
          if (adminGames.length > 0 && adminGames[0].manuallyLocked) {
            setTestLockGameId(adminGames[0].id)
            setTestLockStatus(true)
          }
        } catch (error) {
          console.error("Error parsing locked games:", error)
        }
      }
    }
  }, [])

  // Test functions
  const runAuthTest = async () => {
    setIsRunningTest(true)
    const results: Record<string, { success: boolean; message: string }> = {}

    // Test user authentication
    try {
      // Simulate login by checking if code exists in valid codes
      const validCodes = ["12345678", "87654321", "11223344", "55667788", "99887766"]
      const isValidUser = validCodes.includes(testUserCode)

      results["auth_user"] = {
        success: isValidUser,
        message: isValidUser
          ? `התחברות משתמש עם קוד ${testUserCode} הצליחה`
          : `התחברות משתמש עם קוד ${testUserCode} נכשלה`,
      }
    } catch (error) {
      results["auth_user"] = {
        success: false,
        message: `שגיאה בבדיקת התחברות משתמש: ${error}`,
      }
    }

    // Test admin authentication
    try {
      const adminCodes = ["123456", "50244100", "12345678", "323317966"]
      const isValidAdmin = adminCodes.includes(testAdminCode)

      results["auth_admin"] = {
        success: isValidAdmin,
        message: isValidAdmin
          ? `התחברות מנהל עם קוד ${testAdminCode} הצליחה`
          : `התחברות מנהל עם קוד ${testAdminCode} נכשלה`,
      }
    } catch (error) {
      results["auth_admin"] = {
        success: false,
        message: `שגיאה בבדיקת התחברות מנהל: ${error}`,
      }
    }

    // Test super admin authentication
    try {
      const superAdminCodes = ["323317966", "987654321"]
      const isValidSuperAdmin = superAdminCodes.includes(testSuperAdminCode)

      results["auth_super_admin"] = {
        success: isValidSuperAdmin,
        message: isValidSuperAdmin
          ? `התחברות סופר-אדמין עם קוד ${testSuperAdminCode} הצליחה`
          : `התחברות סופר-אדמין עם קוד ${testSuperAdminCode} נכשלה`,
      }
    } catch (error) {
      results["auth_super_admin"] = {
        success: false,
        message: `שגיאה בבדיקת התחברות סופר-אדמין: ${error}`,
      }
    }

    setTestResults({ ...testResults, ...results })
    setIsRunningTest(false)
  }

  const runTimerTest = async () => {
    setIsRunningTest(true)
    const results: Record<string, { success: boolean; message: string }> = {}

    try {
      // Parse test time and closing time
      const [testHours, testMinutes] = testTime.split(":").map(Number)
      const testDate = new Date()
      testDate.setHours(testHours, testMinutes, 0, 0)

      let closingDate
      if (testClosingTime) {
        const [closingHours, closingMinutes] = testClosingTime.split(":").map(Number)
        closingDate = new Date()
        closingDate.setHours(closingHours, closingMinutes, 0, 0)
      } else {
        // Default to 1 hour from test time
        closingDate = new Date(testDate)
        closingDate.setHours(closingDate.getHours() + 1)
      }

      // Check if timer should be visible based on day
      let shouldShowTimer = false

      if (testDay === "sunday" || testDay === "monday" || testDay === "tuesday" || testDay === "wednesday") {
        shouldShowTimer = false
        results["timer_day_rule"] = {
          success: true,
          message: `ביום ${testDay} הטיימר לא אמור להיות מוצג`,
        }
      } else if (testDay === "thursday") {
        // On Thursday, timer should only show if current time is before game time
        const isBeforeGameTime = testDate < closingDate
        shouldShowTimer = isBeforeGameTime

        results["timer_thursday_rule"] = {
          success: true,
          message: isBeforeGameTime
            ? `ביום חמישי בשעה ${testTime} הטיימר אמור להיות מוצג כי זמן הסגירה הוא ${closingDate.getHours()}:${String(closingDate.getMinutes()).padStart(2, "0")}`
            : `ביום חמישי בשעה ${testTime} הטיימר לא אמור להיות מוצג כי זמן הסגירה כבר עבר`,
        }
      } else {
        // Friday and Saturday follow normal rules
        shouldShowTimer = testDate < closingDate
        results["timer_weekend_rule"] = {
          success: true,
          message: shouldShowTimer
            ? `בסוף שבוע בשעה ${testTime} הטיימר אמור להיות מוצג`
            : `בסוף שבוע בשעה ${testTime} הטיימר לא אמור להיות מוצג כי זמן הסגירה כבר עבר`,
        }
      }

      results["timer_visibility"] = {
        success: true,
        message: shouldShowTimer ? "הטיימר אמור להיות מוצג במצב הנוכחי" : "הטיימר לא אמור להיות מוצג במצב הנוכחי",
      }
    } catch (error) {
      results["timer_test"] = {
        success: false,
        message: `שגיאה בבדיקת הטיימר: ${error}`,
      }
    }

    setTestResults({ ...testResults, ...results })
    setIsRunningTest(false)
  }

  const runDayTest = async () => {
    setIsRunningTest(true)
    const results: Record<string, { success: boolean; message: string }> = {}

    try {
      // Save the current system day to localStorage
      localStorage.setItem("currentSystemDay", systemDay)

      results["day_set"] = {
        success: true,
        message: `יום המערכת נקבע ל-${systemDay}`,
      }

      // Check if the system day is correctly retrieved
      const retrievedDay = localStorage.getItem("currentSystemDay")

      results["day_get"] = {
        success: retrievedDay === systemDay,
        message:
          retrievedDay === systemDay
            ? `יום המערכת נשמר ונקרא בהצלחה (${retrievedDay})`
            : `שגיאה בקריאת יום המערכת: צפוי ${systemDay}, התקבל ${retrievedDay || "ריק"}`,
      }
    } catch (error) {
      results["day_test"] = {
        success: false,
        message: `שגיאה בבדיקת יום המערכת: ${error}`,
      }
    }

    setTestResults({ ...testResults, ...results })
    setIsRunningTest(false)
  }

  const runPredictionTest = async () => {
    setIsRunningTest(true)
    const results: Record<string, { success: boolean; message: string }> = {}

    try {
      // Save a test prediction to localStorage
      const testPredictionObj = {
        id: Date.now().toString(),
        userId: "test-user",
        gameId: testGameId,
        prediction: testPrediction,
        timestamp: new Date(),
      }

      // Get existing predictions or initialize empty array
      const storedPredictions = localStorage.getItem("predictions") || "[]"
      const parsedPredictions = JSON.parse(storedPredictions)

      // Add new prediction
      parsedPredictions.push(testPredictionObj)
      localStorage.setItem("predictions", JSON.stringify(parsedPredictions))

      results["prediction_save"] = {
        success: true,
        message: `ניחוש "${testPrediction}" למשחק ${testGameId} נשמר בהצלחה`,
      }

      // Verify prediction was saved
      const updatedPredictions = JSON.parse(localStorage.getItem("predictions") || "[]")
      const foundPrediction = updatedPredictions.find((p: any) => p.gameId === testGameId && p.userId === "test-user")

      results["prediction_verify"] = {
        success: !!foundPrediction,
        message: foundPrediction
          ? `ניחוש אומת בהצלחה: ${foundPrediction.prediction} למשחק ${foundPrediction.gameId}`
          : `לא נמצא ניחוש למשחק ${testGameId}`,
      }
    } catch (error) {
      results["prediction_test"] = {
        success: false,
        message: `שגיאה בבדיקת ניחושים: ${error}`,
      }
    }

    setTestResults({ ...testResults, ...results })
    setIsRunningTest(false)
  }

  const runAdminTest = async () => {
    setIsRunningTest(true)
    const results: Record<string, { success: boolean; message: string }> = {}

    try {
      // Test game locking functionality
      const mockGame = {
        id: testLockGameId,
        homeTeam: "מכבי חיפה",
        awayTeam: "הפועל באר שבע",
        time: "19:00",
        date: new Date().toISOString().split("T")[0],
        league: "ליגת העל",
        closingTime: new Date(Date.now() + 3600000),
        manuallyLocked: testLockStatus,
      }

      // Get existing games or initialize with mock game
      const storedGames = localStorage.getItem("adminGames")
      let adminGames = []

      if (storedGames) {
        adminGames = JSON.parse(storedGames)
        // Update the game if it exists, otherwise add it
        const gameIndex = adminGames.findIndex((g: any) => g.id === testLockGameId)
        if (gameIndex !== -1) {
          adminGames[gameIndex] = {
            ...adminGames[gameIndex],
            manuallyLocked: testLockStatus,
          }
        } else {
          adminGames.push(mockGame)
        }
      } else {
        adminGames = [mockGame]
      }

      localStorage.setItem("adminGames", JSON.stringify(adminGames))

      results["admin_lock"] = {
        success: true,
        message: testLockStatus ? `משחק ${testLockGameId} ננעל בהצלחה` : `משחק ${testLockGameId} נפתח בהצלחה`,
      }

      // Verify game lock status
      const updatedGames = JSON.parse(localStorage.getItem("adminGames") || "[]")
      const foundGame = updatedGames.find((g: any) => g.id === testLockGameId)

      results["admin_lock_verify"] = {
        success: foundGame && foundGame.manuallyLocked === testLockStatus,
        message: foundGame
          ? `סטטוס נעילת משחק אומת: ${foundGame.manuallyLocked ? "נעול" : "פתוח"}`
          : `לא נמצא משחק עם מזהה ${testLockGameId}`,
      }
    } catch (error) {
      results["admin_test"] = {
        success: false,
        message: `שגיאה בבדיקת פונקציונליות מנהל: ${error}`,
      }
    }

    setTestResults({ ...testResults, ...results })
    setIsRunningTest(false)
  }

  const runAllTests = async () => {
    setIsRunningTest(true)
    await runAuthTest()
    await runTimerTest()
    await runDayTest()
    await runPredictionTest()
    await runAdminTest()
    setIsRunningTest(false)
  }

  // Reset all test results
  const resetTests = () => {
    setTestResults({})
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold flex items-center">
          <TestTube className="w-6 h-6 mr-2" />
          כלי בדיקות מערכת
        </h3>
        <div className="flex space-x-2 rtl:space-x-reverse">
          <button
            className="px-4 py-2 bg-navy-600 text-white rounded-md hover:bg-navy-700 flex items-center"
            onClick={runAllTests}
            disabled={isRunningTest}
          >
            {isRunningTest ? (
              <>
                <RefreshCw className="w-4 h-4 ml-2 animate-spin" />
                מריץ בדיקות...
              </>
            ) : (
              <>
                <TestTube className="w-4 h-4 ml-2" />
                הרץ את כל הבדיקות
              </>
            )}
          </button>
          <button
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 flex items-center"
            onClick={resetTests}
            disabled={isRunningTest}
          >
            <RefreshCw className="w-4 h-4 ml-2" />
            אפס תוצאות
          </button>
        </div>
      </div>

      <div className="mb-6 p-4 bg-blue-50 text-blue-700 rounded-md">
        <p className="flex items-center">
          <AlertTriangle className="w-5 h-5 mr-2 flex-shrink-0" />
          כלי זה מיועד לבדיקת פונקציונליות המערכת. השתמש בו בסביבת פיתוח או בדיקות בלבד.
        </p>
      </div>

      {/* Test navigation tabs */}
      <div className="flex border-b border-gray-200 mb-6 overflow-x-auto">
        <button
          className={`px-4 py-2 border-b-2 ${
            activeTab === "auth"
              ? "border-navy-600 text-navy-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
          onClick={() => setActiveTab("auth")}
        >
          <User className="w-4 h-4 inline mr-1" />
          בדיקת התחברות
        </button>
        <button
          className={`px-4 py-2 border-b-2 ${
            activeTab === "timer"
              ? "border-navy-600 text-navy-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
          onClick={() => setActiveTab("timer")}
        >
          <Clock className="w-4 h-4 inline mr-1" />
          בדיקת טיימר
        </button>
        <button
          className={`px-4 py-2 border-b-2 ${
            activeTab === "days"
              ? "border-navy-600 text-navy-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
          onClick={() => setActiveTab("days")}
        >
          <Calendar className="w-4 h-4 inline mr-1" />
          בדיקת ימים
        </button>
        <button
          className={`px-4 py-2 border-b-2 ${
            activeTab === "predictions"
              ? "border-navy-600 text-navy-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
          onClick={() => setActiveTab("predictions")}
        >
          <Save className="w-4 h-4 inline mr-1" />
          בדיקת ניחושים
        </button>
        <button
          className={`px-4 py-2 border-b-2 ${
            activeTab === "admin"
              ? "border-navy-600 text-navy-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
          onClick={() => setActiveTab("admin")}
        >
          <Lock className="w-4 h-4 inline mr-1" />
          בדיקת מנהל
        </button>
      </div>

      {/* Test content */}
      <div className="mb-6">
        {activeTab === "auth" && (
          <div>
            <h4 className="text-lg font-medium mb-4">בדיקת התחברות</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">קוד משתמש לבדיקה</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  value={testUserCode}
                  onChange={(e) => setTestUserCode(e.target.value)}
                  placeholder="הזן קוד משתמש"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">קוד מנהל לבדיקה</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  value={testAdminCode}
                  onChange={(e) => setTestAdminCode(e.target.value)}
                  placeholder="הזן קוד מנהל"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">קוד סופר-אדמין לבדיקה</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  value={testSuperAdminCode}
                  onChange={(e) => setTestSuperAdminCode(e.target.value)}
                  placeholder="הזן קוד סופר-אדמין"
                />
              </div>
            </div>
            <button
              className="px-4 py-2 bg-navy-600 text-white rounded-md hover:bg-navy-700"
              onClick={runAuthTest}
              disabled={isRunningTest}
            >
              {isRunningTest ? "מריץ בדיקה..." : "בדוק התחברות"}
            </button>
          </div>
        )}

        {activeTab === "timer" && (
          <div>
            <h4 className="text-lg font-medium mb-4">בדיקת טיימר</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">יום לבדיקה</label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  value={testDay}
                  onChange={(e) => setTestDay(e.target.value)}
                >
                  <option value="sunday">יום ראשון</option>
                  <option value="monday">יום שני</option>
                  <option value="tuesday">יום שלישי</option>
                  <option value="wednesday">יום רביעי</option>
                  <option value="thursday">יום חמישי</option>
                  <option value="friday">יום שישי</option>
                  <option value="saturday">שבת</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">שעה נוכחית לבדיקה</label>
                <input
                  type="time"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  value={testTime}
                  onChange={(e) => setTestTime(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">שעת סגירת משחק לבדיקה</label>
                <input
                  type="time"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  value={testClosingTime}
                  onChange={(e) => setTestClosingTime(e.target.value)}
                  placeholder="השאר ריק לברירת מחדל"
                />
              </div>
            </div>
            <button
              className="px-4 py-2 bg-navy-600 text-white rounded-md hover:bg-navy-700"
              onClick={runTimerTest}
              disabled={isRunningTest}
            >
              {isRunningTest ? "מריץ בדיקה..." : "בדוק טיימר"}
            </button>
          </div>
        )}

        {activeTab === "days" && (
          <div>
            <h4 className="text-lg font-medium mb-4">בדיקת ימים</h4>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">יום מערכת לבדיקה</label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                value={systemDay}
                onChange={(e) => setSystemDay(e.target.value)}
              >
                <option value="sunday">יום ראשון</option>
                <option value="monday">יום שני</option>
                <option value="tuesday">יום שלישי</option>
                <option value="wednesday">יום רביעי</option>
                <option value="thursday">יום חמישי</option>
                <option value="friday">יום שישי</option>
                <option value="saturday">שבת</option>
              </select>
            </div>
            <button
              className="px-4 py-2 bg-navy-600 text-white rounded-md hover:bg-navy-700"
              onClick={runDayTest}
              disabled={isRunningTest}
            >
              {isRunningTest ? "מריץ בדיקה..." : "בדוק ימים"}
            </button>
          </div>
        )}

        {activeTab === "predictions" && (
          <div>
            <h4 className="text-lg font-medium mb-4">בדיקת ניחושים</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">מזהה משחק לבדיקה</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  value={testGameId}
                  onChange={(e) => setTestGameId(e.target.value)}
                  placeholder="הזן מזהה משחק"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ניחוש לבדיקה</label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  value={testPrediction}
                  onChange={(e) => setTestPrediction(e.target.value)}
                >
                  <option value="1">1 - ניצחון בית</option>
                  <option value="X">X - תיקו</option>
                  <option value="2">2 - ניצחון חוץ</option>
                </select>
              </div>
            </div>
            <button
              className="px-4 py-2 bg-navy-600 text-white rounded-md hover:bg-navy-700"
              onClick={runPredictionTest}
              disabled={isRunningTest}
            >
              {isRunningTest ? "מריץ בדיקה..." : "בדוק ניחושים"}
            </button>
          </div>
        )}

        {activeTab === "admin" && (
          <div>
            <h4 className="text-lg font-medium mb-4">בדיקת פונקציונליות מנהל</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">מזהה משחק לנעילה/פתיחה</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  value={testLockGameId}
                  onChange={(e) => setTestLockGameId(e.target.value)}
                  placeholder="הזן מזהה משחק"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">סטטוס נעילה</label>
                <div className="flex items-center mt-2">
                  <button
                    className={`flex-1 px-4 py-2 rounded-l-md ${
                      testLockStatus ? "bg-gray-200 text-gray-800" : "bg-navy-600 text-white"
                    }`}
                    onClick={() => setTestLockStatus(false)}
                  >
                    <Unlock className="w-4 h-4 inline mr-1" />
                    פתוח
                  </button>
                  <button
                    className={`flex-1 px-4 py-2 rounded-r-md ${
                      testLockStatus ? "bg-navy-600 text-white" : "bg-gray-200 text-gray-800"
                    }`}
                    onClick={() => setTestLockStatus(true)}
                  >
                    <Lock className="w-4 h-4 inline mr-1" />
                    נעול
                  </button>
                </div>
              </div>
            </div>
            <button
              className="px-4 py-2 bg-navy-600 text-white rounded-md hover:bg-navy-700"
              onClick={runAdminTest}
              disabled={isRunningTest}
            >
              {isRunningTest ? "מריץ בדיקה..." : "בדוק פונקציונליות מנהל"}
            </button>
          </div>
        )}
      </div>

      {/* Test results */}
      {Object.keys(testResults).length > 0 && (
        <div className="mt-8">
          <h4 className="text-lg font-medium mb-4">תוצאות בדיקה</h4>
          <div className="bg-gray-50 p-4 rounded-md">
            {Object.entries(testResults).map(([key, result]) => (
              <div key={key} className="mb-2 flex items-start">
                <div className={`flex-shrink-0 ${result.success ? "text-green-500" : "text-red-500"}`}>
                  {result.success ? <CheckCircle className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                </div>
                <div className="ml-2">
                  <p className={`${result.success ? "text-green-700" : "text-red-700"}`}>{result.message}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
