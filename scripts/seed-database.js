import { createClient } from "@supabase/supabase-js"

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase environment variables")
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

// Sample data for games
const sampleGames = [
  {
    home_team: "מכבי חיפה",
    away_team: "הפועל באר שבע",
    time: "19:00",
    date: new Date().toISOString(),
    league: "ליגת העל",
    closing_time: new Date(Date.now() + 3600000).toISOString(),
  },
  {
    home_team: "מכבי תל אביב",
    away_team: "הפועל תל אביב",
    time: "21:00",
    date: new Date().toISOString(),
    league: "ליגת העל",
    closing_time: new Date(Date.now() + 7200000).toISOString(),
  },
  {
    home_team: 'בית"ר ירושלים',
    away_team: "הפועל ירושלים",
    time: "20:15",
    date: new Date(Date.now() + 86400000).toISOString(),
    league: "ליגת העל",
    closing_time: new Date(Date.now() + 86400000).toISOString(),
  },
  {
    home_team: "הפועל חיפה",
    away_team: "מכבי נתניה",
    time: "19:30",
    date: new Date(Date.now() + 172800000).toISOString(),
    league: "ליגת העל",
    closing_time: new Date(Date.now() + 172800000).toISOString(),
  },
]

// Sample data for users
const sampleUsers = [
  {
    name: "דני לוי",
    email: "dani@example.com",
    points: 42,
    correct_predictions: 14,
    total_predictions: 21,
    last_week_points: 18,
    trend: "up",
    success_rate: 66.7,
  },
  {
    name: "רונית כהן",
    email: "ronit@example.com",
    points: 39,
    correct_predictions: 13,
    total_predictions: 21,
    last_week_points: 15,
    trend: "up",
    success_rate: 61.9,
  },
  {
    name: "משה לוי",
    email: "moshe@example.com",
    points: 36,
    correct_predictions: 12,
    total_predictions: 21,
    last_week_points: 9,
    trend: "down",
    success_rate: 57.1,
  },
]

async function seedDatabase() {
  try {
    console.log("Starting database seeding...")

    // Seed games
    console.log("Seeding games...")
    const { error: gamesError } = await supabase.from("games").insert(sampleGames)
    if (gamesError) {
      console.error("Error seeding games:", gamesError)
      return false
    }

    // Seed users
    console.log("Seeding users...")
    const { error: usersError } = await supabase.from("users").insert(sampleUsers)
    if (usersError) {
      console.error("Error seeding users:", usersError)
      return false
    }

    console.log("Database seeding completed successfully!")
    return true
  } catch (error) {
    console.error("Error seeding database:", error)
    return false
  }
}

// Run the seeding function
seedDatabase()
  .then(() => {
    console.log("Seeding process completed")
    process.exit(0)
  })
  .catch((error) => {
    console.error("Seeding process failed:", error)
    process.exit(1)
  })
