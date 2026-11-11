import axios from 'axios'

const baseURL = import.meta.env.VITE_API_BASE_URL || '/api'

export const api = axios.create({
  baseURL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('rk_token')

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

api.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status
      const url = error.config?.url || ''

      const isPublicAuthRequest =
        url.includes('/auth/login') ||
        url.includes('/auth/register')

      if (status === 401 && !isPublicAuthRequest) {
        window.dispatchEvent(new Event('rk:unauthorized'))
      }
    }

    return Promise.reject(error)
  },
)

export function getApiError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const responseData = error.response?.data as
      | {
          message?: string
          errors?: Array<{ field?: string; message?: string }>
        }
      | undefined

    if (responseData?.message) {
      if (responseData.errors?.length) {
        const details = responseData.errors
          .map((item) => item.field ? `${item.field}: ${item.message}` : item.message)
          .join('; ')

        return `${responseData.message} (${details})`
      }

      return responseData.message
    }

    if (error.code === 'ECONNABORTED') {
      return 'Permintaan ke server melewati batas waktu. Coba lagi.'
    }

    if (!error.response) {
      return 'Tidak dapat terhubung ke backend. Pastikan backend berjalan pada port 3000.'
    }

    return `Permintaan gagal dengan HTTP ${error.response.status}.`
  }

  if (error instanceof Error) {
    return error.message
  }

  return 'Terjadi kesalahan yang tidak diketahui.'
}
