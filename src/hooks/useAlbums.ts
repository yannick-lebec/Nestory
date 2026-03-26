import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useAuthStore } from '@/store/auth'
import type { Memory } from '@/types'

interface MemoriesResponse {
  memories: Memory[]
  total: number
}

export interface SmartAlbum {
  type: 'category' | 'person' | 'year'
  key: string
  title: string
  emoji: string
  count: number
  coverUrl?: string
  memories: Memory[]
}

const CATEGORY_META: Record<string, { label: string; emoji: string }> = {
  anniversary: { label: 'Anniversaires', emoji: '🎂' },
  vacation:    { label: 'Vacances',      emoji: '🏖️' },
  school:      { label: 'École',         emoji: '🎒' },
  everyday:    { label: 'Quotidien',     emoji: '☀️' },
  trip:        { label: 'Voyages',       emoji: '✈️' },
  quote:       { label: 'Citations',     emoji: '💬' },
  achievement: { label: 'Réussites',     emoji: '🏆' },
}

export function useAlbums() {
  const familyId = useAuthStore((s) => s.familyId)

  const { data, isLoading } = useQuery({
    queryKey: ['memories-all', familyId],
    queryFn: () => api.get<MemoriesResponse>('/memories?limit=200'),
    enabled: !!familyId,
  })

  const albums = useMemo<SmartAlbum[]>(() => {
    const memories = data?.memories ?? []
    if (!memories.length) return []

    const byCategory = new Map<string, Memory[]>()
    const byPerson   = new Map<string, Memory[]>()
    const byYear     = new Map<string, Memory[]>()

    for (const m of memories) {
      // Category
      const cat = m.category
      if (!byCategory.has(cat)) byCategory.set(cat, [])
      byCategory.get(cat)!.push(m)

      // People
      for (const p of m.people ?? []) {
        if (!byPerson.has(p)) byPerson.set(p, [])
        byPerson.get(p)!.push(m)
      }

      // Year
      const year = String(new Date(m.memoryDate).getFullYear())
      if (!byYear.has(year)) byYear.set(year, [])
      byYear.get(year)!.push(m)
    }

    const result: SmartAlbum[] = []

    byCategory.forEach((mems, cat) => {
      const meta = CATEGORY_META[cat] ?? { label: cat, emoji: '📁' }
      result.push({
        type: 'category', key: cat,
        title: meta.label, emoji: meta.emoji,
        count: mems.length,
        coverUrl: mems.find((m) => (m.media ?? []).length > 0)?.media![0].url,
        memories: mems,
      })
    })

    byPerson.forEach((mems, person) => {
      result.push({
        type: 'person', key: person,
        title: person, emoji: '👤',
        count: mems.length,
        coverUrl: mems.find((m) => (m.media ?? []).length > 0)?.media![0].url,
        memories: mems,
      })
    })

    byYear.forEach((mems, year) => {
      result.push({
        type: 'year', key: year,
        title: year, emoji: '📅',
        count: mems.length,
        coverUrl: mems.find((m) => (m.media ?? []).length > 0)?.media![0].url,
        memories: mems,
      })
    })

    return result
  }, [data])

  return { albums, isLoading }
}
