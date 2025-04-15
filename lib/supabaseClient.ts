import { createClient } from "@supabase/supabase-js"

let supabaseClient: any = null

export const getSupabaseClient = () => {
  if (supabaseClient) {
    return supabaseClient
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase environment variables")
    return null
  }

  try {
    supabaseClient = createClient(supabaseUrl, supabaseKey)
    return supabaseClient
  } catch (error) {
    console.error("Error creating Supabase client:", error)
    return null
  }
}
