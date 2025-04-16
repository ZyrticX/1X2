"use client"

import AdminDashboard from "../components/admin/admin-dashboard"
import { useAuth } from "../contexts/auth-context"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

export default function AdminPage() {
  const { isAuthenticated, isAdmin } = useAuth()
  const router = useRouter()

  useEffect(() => {
    // אם המשתמש לא מחובר או לא מנהל, הפנה אותו לדף הבית
    if (!isAuthenticated || !isAdmin) {
      router.push("/")
    }
  }, [isAuthenticated, isAdmin, router])

  // אם המשתמש לא מחובר או לא מנהל, הצג מסך טעינה
  if (!isAuthenticated || !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-navy-600"></div>
      </div>
    )
  }

  return <AdminDashboard />
}
