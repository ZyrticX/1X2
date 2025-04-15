import type React from "react"
import type { Metadata } from "next"
import { Heebo } from "next/font/google"
import "./globals.css"
import { AuthProvider } from "./contexts/auth-context"
import { SupabaseProvider } from "./contexts/supabase-provider"

const heebo = Heebo({
  subsets: ["hebrew"],
  variable: "--font-heebo",
})

export const metadata: Metadata = {
  title: "פנטזי 1X2 - ניחושים בין החברים",
  description: "אפליקציית ניחוש תוצאות משחקי כדורגל ותחרות עם חברים",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="he" dir="rtl">
      <body className={`${heebo.variable} font-sans`}>
        <SupabaseProvider>
          <AuthProvider>{children}</AuthProvider>
        </SupabaseProvider>
      </body>
    </html>
  )
}


import './globals.css'