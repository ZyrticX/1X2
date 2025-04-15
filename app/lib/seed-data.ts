import { getSupabaseClient } from "./supabase"

// פונקציה ליצירת טבלאות אם הן לא קיימות
async function createTablesIfNotExist() {
  try {
    const supabase = getSupabaseClient()
    if (!supabase) {
      console.error("Supabase client is not available")
      return false
    }

    console.log("Checking if tables exist...")

    // בדיקה אם הטבלאות קיימות
    const { data: tablesData, error: tablesError } = await supabase.rpc("get_tables")

    if (tablesError) {
      console.error("Error checking tables:", tablesError)

      // אם אין פונקציה get_tables, ננסה לבדוק ישירות
      console.log("Trying to check tables directly...")

      // בדיקה אם טבלת games קיימת
      const { error: gamesError } = await supabase.from("games").select("count", { count: "exact", head: true })
      const gamesExists = !gamesError

      // בדיקה אם טבלת users קיימת
      const { error: usersError } = await supabase.from("users").select("count", { count: "exact", head: true })
      const usersExists = !usersError

      // בדיקה אם טבלת predictions קיימת
      const { error: predictionsError } = await supabase
        .from("predictions")
        .select("count", { count: "exact", head: true })
      const predictionsExists = !predictionsError

      console.log("Tables exist check:", {
        games: gamesExists,
        users: usersExists,
        predictions: predictionsExists,
      })

      // יצירת הטבלאות אם הן לא קיימות
      if (!gamesExists) {
        console.log("Creating games table...")
        const createGamesQuery = `
          CREATE TABLE IF NOT EXISTS games (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            homeTeam TEXT NOT NULL,
            awayTeam TEXT NOT NULL,
            time TEXT NOT NULL,
            date TIMESTAMP WITH TIME ZONE NOT NULL,
            league TEXT NOT NULL,
            closingTime TIMESTAMP WITH TIME ZONE NOT NULL,
            result TEXT,
            isFinished BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
        `
        const { error: createGamesError } = await supabase.rpc("exec_sql", { query: createGamesQuery })
        if (createGamesError) {
          console.error("Error creating games table:", createGamesError)
          return false
        }
      }

      if (!usersExists) {
        console.log("Creating users table...")
        const createUsersQuery = `
          CREATE TABLE IF NOT EXISTS users (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            name TEXT NOT NULL,
            email TEXT,
            points INTEGER DEFAULT 0,
            correct_predictions INTEGER DEFAULT 0,
            total_predictions INTEGER DEFAULT 0,
            last_week_points INTEGER DEFAULT 0,
            trend TEXT,
            success_rate FLOAT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
        `
        const { error: createUsersError } = await supabase.rpc("exec_sql", { query: createUsersQuery })
        if (createUsersError) {
          console.error("Error creating users table:", createUsersError)
          return false
        }
      }

      if (!predictionsExists) {
        console.log("Creating predictions table...")
        const createPredictionsQuery = `
          CREATE TABLE IF NOT EXISTS predictions (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            user_id TEXT NOT NULL,
            game_id TEXT NOT NULL,
            prediction TEXT NOT NULL,
            timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
        `
        const { error: createPredictionsError } = await supabase.rpc("exec_sql", { query: createPredictionsQuery })
        if (createPredictionsError) {
          console.error("Error creating predictions table:", createPredictionsError)
          return false
        }
      }

      return true
    }

    const tables = tablesData || []
    const gamesExists = tables.includes("games")
    const usersExists = tables.includes("users")
    const predictionsExists = tables.includes("predictions")

    console.log("Tables exist check:", {
      games: gamesExists,
      users: usersExists,
      predictions: predictionsExists,
    })

    return true
  } catch (error) {
    console.error("Error creating tables:", error)
    return false
  }
}

// Sample data for games
const sampleGames = [
  {
    homeTeam: "מכבי חיפה",
    awayTeam: "הפועל באר שבע",
    time: "19:00",
    date: new Date().toISOString(),
    league: "ליגת העל",
    closingTime: new Date(Date.now() + 3600000).toISOString(),
  },
  {
    homeTeam: "מכבי תל אביב",
    awayTeam: "הפועל תל אביב",
    time: "21:00",
    date: new Date().toISOString(),
    league: "ליגת העל",
    closingTime: new Date(Date.now() + 7200000).toISOString(),
  },
  {
    homeTeam: 'בית"ר ירושלים',
    awayTeam: "הפועל ירושלים",
    time: "20:15",
    date: new Date(Date.now() + 86400000).toISOString(),
    league: "ליגת העל",
    closingTime: new Date(Date.now() + 86400000).toISOString(),
  },
  {
    homeTeam: "הפועל חיפה",
    awayTeam: "מכבי נתניה",
    time: "19:30",
    date: new Date(Date.now() + 172800000).toISOString(),
    league: "ליגת העל",
    closingTime: new Date(Date.now() + 172800000).toISOString(),
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

export async function seedDatabase() {
  try {
    const supabase = getSupabaseClient()
    if (!supabase) {
      console.error("Supabase client is not available")
      return false
    }

    console.log("Starting database seeding...")

    // וודא שהטבלאות קיימות לפני הזריעה
    const tablesCreated = await createTablesIfNotExist()
    if (!tablesCreated) {
      console.error("Failed to create tables")
      return false
    }

    // בדיקת מבנה הטבלאות
    console.log("Checking table structure...")

    // בדיקת מבנה טבלת games
    const { data: gamesColumns, error: gamesColumnsError } = await supabase.rpc("get_table_columns", {
      table_name: "games",
    })

    if (gamesColumnsError) {
      console.error("Error checking games table structure:", gamesColumnsError)

      // ננסה לבדוק את המבנה בדרך אחרת
      const { data: gamesSample, error: gamesSampleError } = await supabase.from("games").select("*").limit(1)

      if (!gamesSampleError && gamesSample && gamesSample.length > 0) {
        console.log("Games table sample:", gamesSample[0])
      } else {
        console.log("Could not get games table structure, proceeding with caution")
      }
    } else {
      console.log("Games table columns:", gamesColumns)
    }

    // התאמת נתוני המשחקים לפי מבנה הטבלה
    const adaptedGames = sampleGames.map((game) => ({
      // נסה את שני הפורמטים האפשריים
      home_team: game.homeTeam,
      away_team: game.awayTeam,
      homeTeam: game.homeTeam,
      awayTeam: game.awayTeam,
      time: game.time,
      date: game.date,
      league: game.league,
      closing_time: game.closingTime,
      closingTime: game.closingTime,
    }))

    // Seed games
    console.log("Seeding games...")
    const { error: gamesError } = await supabase.from("games").insert(adaptedGames)
    if (gamesError) {
      console.error("Error seeding games:", gamesError)

      // ננסה לזרוע את המשחקים אחד אחד כדי לראות איזה שדות עובדים
      console.log("Trying to seed games one by one...")

      for (const game of adaptedGames) {
        const { error } = await supabase.from("games").insert([game])
        if (error) {
          console.error(`Error seeding game ${JSON.stringify(game)}:`, error)
        } else {
          console.log(
            `Successfully seeded game: ${game.homeTeam || game.home_team} vs ${game.awayTeam || game.away_team}`,
          )
        }
      }
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

export async function checkDatabaseEmpty() {
  try {
    const supabase = getSupabaseClient()
    if (!supabase) {
      console.error("Supabase client is not available")
      return true // Assume empty if no client
    }

    // Check if games table is empty
    const { data: games, error: gamesError } = await supabase.from("games").select("id").limit(1)
    if (gamesError) {
      // אם יש שגיאה, ייתכן שהטבלה לא קיימת
      console.error("Error checking games table:", gamesError)
      return true // Assume empty on error
    }

    // Check if users table is empty
    const { data: users, error: usersError } = await supabase.from("users").select("id").limit(1)
    if (usersError) {
      console.error("Error checking users table:", usersError)
      return true // Assume empty on error
    }

    // If both tables have no records, consider the database empty
    return (!games || games.length === 0) && (!users || users.length === 0)
  } catch (error) {
    console.error("Error checking database:", error)
    return true // Assume empty on error
  }
}
