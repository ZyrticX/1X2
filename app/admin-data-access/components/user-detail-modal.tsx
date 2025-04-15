"use client"

import type { User, Game } from "../types"
import { X } from "lucide-react"
import UserActions from "./user-actions"
import UserPredictions from "./user-predictions"

interface UserDetailModalProps {
  user: User
  games: Game[]
  onClose: () => void
  onUserUpdated: () => void
}

export default function UserDetailModal({ user, games, onClose, onUserUpdated }: UserDetailModalProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">פרטי משתמש: {user.name}</h2>
          <button className="text-gray-500 hover:text-gray-700" onClick={onClose}>
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <h3 className="text-lg font-bold mb-2">פרטים אישיים</h3>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="mb-2">
                <span className="font-bold">שם:</span> {user.name}
              </p>
              <p className="mb-2">
                <span className="font-bold">קוד שחקן:</span> {user.playercode}
              </p>
              <p className="mb-2">
                <span className="font-bold">טלפון:</span> {user.phone || "-"}
              </p>
              <p className="mb-2">
                <span className="font-bold">עיר:</span> {user.city || "-"}
              </p>
              <p className="mb-2">
                <span className="font-bold">סטטוס:</span>{" "}
                <span
                  className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    user.status === "active" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                  }`}
                >
                  {user.status === "active" ? "פעיל" : user.status === "blocked" ? "חסום" : "-"}
                </span>
              </p>
              <p className="mb-2">
                <span className="font-bold">נקודות:</span> {user.points || 0}
              </p>
              <p className="mb-2">
                <span className="font-bold">תאריך הצטרפות:</span>{" "}
                {user.created_at ? new Date(user.created_at).toLocaleDateString() : "-"}
              </p>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-bold mb-2">פעולות</h3>
            <div className="bg-gray-50 p-4 rounded-lg">
              <UserActions user={user} onActionComplete={onUserUpdated} />
            </div>
          </div>
        </div>

        <UserPredictions userId={user.id} games={games} />
      </div>
    </div>
  )
}
