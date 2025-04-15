import type { User } from "../types"
import { Users, CheckSquare, Calendar } from "lucide-react"

interface AdminDataPanelProps {
  adminUser: User | null
  userCount: number
  predictionCount: number
  gameCount: number
}

export default function AdminDataPanel({ adminUser, userCount, predictionCount, gameCount }: AdminDataPanelProps) {
  return (
    <div className="bg-white shadow rounded-lg p-6 mb-6">
      <h2 className="text-xl font-bold mb-4">פרטי מנהל</h2>

      {adminUser ? (
        <div className="mb-4">
          <p className="font-bold">
            שם: <span className="font-normal">{adminUser.name}</span>
          </p>
          <p className="font-bold">
            קוד שחקן: <span className="font-normal">{adminUser.playercode}</span>
          </p>
          <p className="font-bold">
            סטטוס: <span className="font-normal">{adminUser.status || "פעיל"}</span>
          </p>
          <p className="font-bold">
            מזהה: <span className="font-normal">{adminUser.id}</span>
          </p>
        </div>
      ) : (
        <div className="mb-4 p-3 bg-yellow-100 text-yellow-800 rounded">
          <p>המשתמש עם קוד 323317966 לא נמצא במסד הנתונים.</p>
          <p>משתמש זה מוגדר בקוד כמנהל-על (Super Admin) בקובץ auth-context.tsx.</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
        <div className="bg-blue-50 p-4 rounded-lg flex items-center">
          <Users className="w-8 h-8 text-blue-500 mr-3" />
          <div>
            <p className="text-sm text-blue-500">משתמשים</p>
            <p className="text-2xl font-bold">{userCount}</p>
          </div>
        </div>

        <div className="bg-green-50 p-4 rounded-lg flex items-center">
          <CheckSquare className="w-8 h-8 text-green-500 mr-3" />
          <div>
            <p className="text-sm text-green-500">ניחושים</p>
            <p className="text-2xl font-bold">{predictionCount}</p>
          </div>
        </div>

        <div className="bg-purple-50 p-4 rounded-lg flex items-center">
          <Calendar className="w-8 h-8 text-purple-500 mr-3" />
          <div>
            <p className="text-sm text-purple-500">משחקים</p>
            <p className="text-2xl font-bold">{gameCount}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
