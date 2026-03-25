import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useAuthStore } from '@/store/auth'
import type { Family } from '@/types'

export function useMyFamilies() {
  const setFamilyId = useAuthStore((s) => s.setFamilyId)
  const familyId = useAuthStore((s) => s.familyId)

  const query = useQuery({
    queryKey: ['families', 'mine'],
    queryFn: () => api.get<{ families: Family[] }>('/families/mine'),
  })

  // Auto-select first family if none selected
  useEffect(() => {
    if (!familyId && query.data?.families?.length) {
      setFamilyId(query.data.families[0].id)
    }
  }, [query.data, familyId, setFamilyId])

  return query
}
