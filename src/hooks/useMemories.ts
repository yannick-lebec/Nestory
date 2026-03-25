import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useAuthStore } from '@/store/auth'
import type { Memory } from '@/types'

interface MemoriesResponse {
  memories: Memory[]
  total: number
}

interface Filters {
  year?: number
  month?: number
  category?: string
  q?: string
}

export function useMemories(filters: Filters = {}) {
  const familyId = useAuthStore((s) => s.familyId)

  const params = new URLSearchParams()
  if (filters.year) params.set('year', String(filters.year))
  if (filters.month) params.set('month', String(filters.month))
  if (filters.category) params.set('category', filters.category)
  if (filters.q) params.set('q', filters.q)

  return useQuery({
    queryKey: ['memories', familyId, filters],
    queryFn: () => api.get<MemoriesResponse>(`/memories?${params}`),
    enabled: !!familyId,
  })
}
