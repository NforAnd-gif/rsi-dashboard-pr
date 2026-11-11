import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import type { ReactNode } from 'react'
import {
  getCurrentUser,
  loginRequest,
  registerRequest,
} from '../api/authApi'
import { getApiError } from '../api/client'
import type { User } from '../types'

interface AuthContextValue {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const logout = useCallback(() => {
    localStorage.removeItem('rk_token')
    setUser(null)
    setLoading(false)
  }, [])

  useEffect(() => {
    const handleUnauthorized = () => {
      localStorage.removeItem('rk_token')
      setUser(null)
      setLoading(false)
    }

    window.addEventListener('rk:unauthorized', handleUnauthorized)

    return () => {
      window.removeEventListener('rk:unauthorized', handleUnauthorized)
    }
  }, [])

  useEffect(() => {
    let active = true
    const token = localStorage.getItem('rk_token')

    if (!token) {
      setLoading(false)
      return () => {
        active = false
      }
    }

    getCurrentUser()
      .then((currentUser) => {
        if (active) setUser(currentUser)
      })
      .catch(() => {
        if (active) {
          localStorage.removeItem('rk_token')
          setUser(null)
        }
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    try {
      const result = await loginRequest(email, password)

      if (!result.user || !result.token) {
        throw new Error('Respons login tidak berisi user atau token.')
      }

      localStorage.setItem('rk_token', result.token)
      setUser(result.user)
    } catch (error) {
      throw new Error(getApiError(error))
    }
  }, [])

  const register = useCallback(async (
    name: string,
    email: string,
    password: string,
  ) => {
    try {
      const result = await registerRequest(name, email, password)

      if (!result.user || !result.token) {
        throw new Error('Respons registrasi tidak berisi user atau token.')
      }

      // Backend menetapkan role customer secara otomatis.
      localStorage.setItem('rk_token', result.token)
      setUser(result.user)
    } catch (error) {
      throw new Error(getApiError(error))
    }
  }, [])

  const value = useMemo(
    () => ({
      user,
      loading,
      login,
      register,
      logout,
    }),
    [user, loading, login, register, logout],
  )

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth harus digunakan di dalam AuthProvider.')
  }

  return context
}
