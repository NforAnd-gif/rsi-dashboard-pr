import { api } from './client'
import type { Stall, StallPayload } from '../types'

interface StallListResponse {
  success: boolean
  data: Stall[]
  pagination?: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

interface StallResponse {
  success: boolean
  message?: string
  data: Stall
}

export interface StallListParams {
  search?: string
  category?: string
  page?: number
  limit?: number
}

export async function getStalls(params: StallListParams = {}) {
  const response = await api.get<StallListResponse>('/stalls', { params })

  if (!Array.isArray(response.data.data)) {
    throw new Error('Format daftar kantin dari backend tidak sesuai.')
  }

  return response.data
}

export async function getStall(id: number): Promise<Stall> {
  const response = await api.get<StallResponse>(`/stalls/${id}`)
  return response.data.data
}

export async function createStall(payload: StallPayload): Promise<Stall> {
  const response = await api.post<StallResponse>('/stalls', payload)
  return response.data.data
}

export async function updateStall(
  id: number,
  payload: Partial<StallPayload>,
): Promise<Stall> {
  const response = await api.put<StallResponse>(`/stalls/${id}`, payload)
  return response.data.data
}

export async function deleteStall(
  id: number,
): Promise<{ success: boolean; message: string }> {
  const response = await api.delete<{ success: boolean; message: string }>(
    `/stalls/${id}`,
  )

  return response.data
}
