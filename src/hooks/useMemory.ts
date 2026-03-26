import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { Memory } from '@/types'

export function useMemory(id: string) {
  return useQuery({
    queryKey: ['memory', id],
    queryFn: () => api.get<Memory>(`/memories/${id}`),
    enabled: !!id,
  })
}
