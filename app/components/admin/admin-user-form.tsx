"use client"

import type React from "react"

import { useState } from "react"
import { addUser } from "../../lib/dataService"
import { generateRandomCode } from "../../lib/utils"
import { AlertCircle, CheckCircle, RefreshCw, UserPlus, Dice1Icon as Dice } from "lucide-react"

interface AdminUserFormProps {
  onUserAdded?: () => void // הפכתי את הפרופ לאופציונלי
}

export default function AdminUserForm({ onUserAdded }: AdminUserFormProps) {
  const [isAdding, setIsAdding] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    playercode: "",
    phone: "",
    city: "",
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const generatePlayerCode = () => {
    // יצירת קוד שחקן אקראי בן 8 ספרות
    const randomCode = generateRandomCode(8)
    setFormData((prev) => ({ ...prev, playercode: randomCode }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsAdding(true)
    setError(null)
    setSuccess(null)

    try {
      if (!formData.name.trim() || !formData.playercode.trim()) {
        throw new Error("שם וקוד שחקן הם שדות חובה")
      }

      // שימוש בפונקציה המעודכנת מ-dataService
      const userId = await addUser({
        name: formData.name,
        playercode: formData.playercode,
        phone: formData.phone,
        city: formData.city,
      })

      // הוספת קוד המשתמש החדש לרשימת הקודים המורשים בלוקל סטורג'
      if (typeof window !== "undefined") {
        const storedCodes = localStorage.getItem("validPlayerCodes")
        const dynamicCodes = storedCodes ? JSON.parse(storedCodes) : []
        if (!dynamicCodes.includes(formData.playercode)) {
          dynamicCodes.push(formData.playercode)
          localStorage.setItem("validPlayerCodes", JSON.stringify(dynamicCodes))
        }
      }

      setSuccess(`המשתמש ${formData.name} נוסף בהצלחה`)
      setFormData({
        name: "",
        playercode: "",
        phone: "",
        city: "",
      })

      // קריאה לפונקציה שתרענן את רשימת המשתמשים (רק אם היא קיימת)
      if (onUserAdded && typeof onUserAdded === "function") {
        onUserAdded()
      }

      // סגירת הטופס לאחר הוספה מוצלחת
      setTimeout(() => {
        setSuccess(null)
      }, 3000)
    } catch (err) {
      console.error("Error adding user:", err)
      setError(err instanceof Error ? err.message : "שגיאה לא ידועה")
    } finally {
      setIsAdding(false)
    }
  }

  return (
    <div className="bg-white p-4 rounded-lg shadow mb-6">
      <h3 className="text-lg font-bold mb-4">הוספת משתמש חדש</h3>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4" role="alert">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 mr-2" />
            <span>{error}</span>
          </div>
        </div>
      )}

      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4" role="alert">
          <div className="flex items-center">
            <CheckCircle className="w-5 h-5 mr-2" />
            <span>{success}</span>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              שם <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              required
            />
          </div>

          <div>
            <label htmlFor="playercode" className="block text-sm font-medium text-gray-700 mb-1">
              קוד שחקן <span className="text-red-500">*</span>
            </label>
            <div className="flex">
              <input
                type="text"
                id="playercode"
                name="playercode"
                value={formData.playercode}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-l-md"
                required
              />
              <button
                type="button"
                onClick={generatePlayerCode}
                className="bg-blue-500 text-white px-3 py-2 rounded-r-md hover:bg-blue-600 flex items-center"
                title="צור קוד אקראי"
              >
                <Dice className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">קוד בן 8 ספרות המשמש להתחברות למערכת</p>
          </div>

          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
              טלפון
            </label>
            <input
              type="text"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>

          <div>
            <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
              עיר
            </label>
            <input
              type="text"
              id="city"
              name="city"
              value={formData.city}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="bg-green-600 text-white px-4 py-2 rounded-md flex items-center"
            disabled={isAdding}
          >
            {isAdding ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <UserPlus className="w-4 h-4 mr-2" />}
            הוסף משתמש
          </button>
        </div>
      </form>
    </div>
  )
}
