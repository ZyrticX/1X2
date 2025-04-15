"use client"

import { type ReactNode, createContext, useContext, useState, useEffect } from "react"
import { createClient } from "@supabase/supabase-js"

const SupabaseContext = createContext<any>(null)

export const SupabaseProvider = ({ children }: { children: ReactNode }) => {
  const [supabase, setSupabase] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const initializeSupabase = () => {
      try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

        // Log the values for debugging (will be removed in production)
        console.log("Supabase URL:", supabaseUrl)
        console.log("Supabase Key exists:", !!supabaseKey)

        if (!supabaseUrl || !supabaseKey) {
          console.error("Missing Supabase environment variables")
          setIsLoading(false)
          return null
        }

        // Ensure URL has correct format
        const formattedUrl = supabaseUrl.startsWith("http") ? supabaseUrl : `https://${supabaseUrl}`

        const client = createClient(formattedUrl, supabaseKey)
        setSupabase(client)
      } catch (error) {
        console.error("Error initializing Supabase client:", error)
      } finally {
        setIsLoading(false)
      }
    }

    initializeSupabase()
  }, [])

  // Show a simple loading state while initializing
  if (isLoading) {
    return <div>Loading...</div>
  }

  return <SupabaseContext.Provider value={supabase}>{children}</SupabaseContext.Provider>
}

export const useSupabase = () => {
  const context = useContext(SupabaseContext)
  if (context === null) {
    console.warn("Supabase client is not initialized. Check your environment variables.")
  }
  return context
}
