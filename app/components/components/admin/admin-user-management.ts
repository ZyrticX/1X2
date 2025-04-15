export interface AdminUser {
  id: string
  name: string
  phone: string
  city: string
  playerCode: string
  status: "active" | "blocked"
  winner?: boolean
}
