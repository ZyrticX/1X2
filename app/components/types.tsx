export interface User {
  id: string
  name: string
  phone?: string
  email?: string
  city?: string
  playercode: string
  status?: "active" | "blocked"
  points?: number
  created_at?: string
  updated_at?: string
}

export interface Game {
  id: string
  hometeam: string
  awayteam: string
  time: string
  date: string
  league: string
  closingtime: string
  isfinished?: boolean
  islocked?: boolean
  result?: string
  created_at?: string
  updated_at?: string
}
