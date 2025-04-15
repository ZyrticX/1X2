import { createClient } from "@supabase/supabase-js"

// Singleton instance for Supabase client
let supabaseClient: any = null

export const getSupabaseClient = () => {
  // Return existing instance if already created
  if (supabaseClient) {
    return supabaseClient
  }

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      console.error("Missing Supabase environment variables")
      return null
    }

    // וודא שה-URL תקין
    const formattedUrl = supabaseUrl.startsWith("http") ? supabaseUrl : `https://${supabaseUrl}`

    // Create and store the client instance
    supabaseClient = createClient(formattedUrl, supabaseKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    })

    console.log("Supabase client initialized successfully")
    return supabaseClient
  } catch (error) {
    console.error("Error creating Supabase client:", error)
    return null
  }
}

// Function to check if Supabase connection is available
export const testSupabaseConnection = async () => {
  try {
    const supabase = getSupabaseClient()
    if (!supabase) return false

    // Try a simple query to test the connection
    const { data, error } = await supabase.from("games").select("count", { count: "exact", head: true })

    if (error) {
      console.error("Supabase connection test failed:", error)
      return false
    }

    console.log("Supabase connection test successful")
    return true
  } catch (error) {
    console.error("Error testing Supabase connection:", error)
    return false
  }
}
