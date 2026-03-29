import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { Recap } from '@/types'

export interface AvailableMonth {
  year: number
  month: number
}

export function useRecapMonths() {
  return useQuery<AvailableMonth[]>({
    queryKey: ['recap-months'],
    queryFn: () => api.get<AvailableMonth[]>('/recap/months'),
  })
}

export function useRecap(year: number, month: number) {
  return useQuery<Recap>({
    queryKey: ['recap', year, month],
    queryFn: () => api.get<Recap>(`/recap?year=${year}&month=${month}`),
  })
}
