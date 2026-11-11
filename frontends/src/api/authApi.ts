import { api } from './client'
import type { User } from '../types'

interface AuthResponse {
  status: 'success' | 'fail' | 'error'
  message?: string
  data: {
    user: User
    token?: string
  }
}

export interface AuthResult {
  user: User
  token?: string
}

export async function loginRequest(
  email: string,
  password: string,
): Promise<AuthResult> {
  const response = await api.post<AuthResponse>('/auth/login', {
    email,
    password,
  })

  return response.data.data
}

export async function registerRequest(
  name: string,
  email: string,
  password: string,
): Promise<AuthResult> {
  const response = await api.post<AuthResponse>('/auth/register', {
    name,
    email,
    password,
  })

  return response.data.data
}

export async function getCurrentUser(): Promise<User> {
  const response = await api.get<AuthResponse>('/auth/me')
  return response.data.data.user
}
