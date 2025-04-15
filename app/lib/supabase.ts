import { createClient } from "@supabase/supabase-js"

// Supabase client for server-side operations
const createServerSupabaseClient = () => {
  const supabaseUrl = process.env.SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_JWT_SECRET || process.env.SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Missing Supabase environment variables")
  }

  return createClient(supabaseUrl, supabaseKey)
}

// Supabase client for client-side operations
let clientSupabaseInstance: ReturnType<typeof createClient> | null = null

const createClientSupabaseClient = () => {
  if (typeof window === "undefined") {
    return null
  }

  if (clientSupabaseInstance) {
    return clientSupabaseInstance
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase environment variables")
    return null
  }

  clientSupabaseInstance = createClient(supabaseUrl, supabaseKey)
  return clientSupabaseInstance
}

// Function to get the appropriate Supabase client based on environment
export const getSupabaseClient = () => {
  if (typeof window === "undefined") {
    return createServerSupabaseClient()
  }
  return createClientSupabaseClient()
}

// Check if Supabase is available
export const isSupabaseAvailable = () => {
  try {
    const client = getSupabaseClient()
    return !!client
  } catch (error) {
    console.error("Error checking Supabase availability:", error)
    return false
  }
}
