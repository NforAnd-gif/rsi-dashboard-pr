export type UserRole = 'admin' | 'owner' | 'customer'

export interface User {
  id: number
  name: string
  email: string
  role: UserRole
  created_at?: string
}

export interface StallOwner {
  id: number
  name: string
  email?: string
}

export interface Stall {
  id: number
  owner_id: number
  name: string
  category: string | null
  location: string | null
  description: string | null
  avg_rating: number | string
  review_count: number
  created_at?: string
  owner?: StallOwner
  menuItems?: Array<{
    id: number
    name: string
    price: number | string
    is_available: boolean
  }>
  reviews?: Array<{
    id: number
    rating: number
    comment: string | null
    like_count: number
    created_at: string
    user?: { id: number; name: string }
  }>
}

export interface StallPayload {
  name: string
  category?: string
  location?: string
  description?: string
}

export interface PaginatedStalls {
  data: Stall[]
  pagination?: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}
