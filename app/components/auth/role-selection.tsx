"use client"

import { useAuth } from "../../contexts/auth-context"
import { UserCog, User } from "lucide-react"

export default function RoleSelection() {
  const { selectRole, userIdentifier } = useAuth()

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4" dir="rtl">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="bg-navy-600 p-6 text-white text-center">
          <h1 className="text-2xl font-bold">ניחושים בין החברים</h1>
          <p className="mt-2 opacity-90">בחירת תפקיד</p>
        </div>

        <div className="p-6">
          <div className="mb-6 text-center">
            <h2 className="text-xl font-bold text-gray-800">שלום, {userIdentifier}</h2>
            <p className="text-gray-600 text-sm mt-1">התחברת עם קוד מנהל. בחר את התפקיד שברצונך להיכנס אליו</p>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <button
              onClick={() => selectRole("admin")}
              className="flex flex-col items-center justify-center p-6 border-2 border-navy-600 rounded-lg hover:bg-navy-50 transition-colors"
            >
              <UserCog className="w-16 h-16 text-navy-600 mb-4" />
              <span className="text-lg font-bold text-navy-600">מנהל</span>
              <span className="text-sm text-gray-500 mt-2">ניהול המערכת</span>
            </button>

            <button
              onClick={() => selectRole("player")}
              className="flex flex-col items-center justify-center p-6 border-2 border-olive-600 rounded-lg hover:bg-olive-50 transition-colors"
            >
              <User className="w-16 h-16 text-olive-600 mb-4" />
              <span className="text-lg font-bold text-olive-600">שחקן</span>
              <span className="text-sm text-gray-500 mt-2">ניחושים ודירוג</span>
            </button>
          </div>

          <div className="mt-6 text-center text-sm text-gray-500">
            <p>תוכל לשנות את התפקיד בכל עת מתוך התפריט</p>
          </div>
        </div>
      </div>
    </div>
  )
}
