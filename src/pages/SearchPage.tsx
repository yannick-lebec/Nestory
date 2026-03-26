import { useState, useDeferredValue } from 'react'
import { Search } from 'lucide-react'
import { useMemories } from '@/hooks/useMemories'
import { MemoryCard } from '@/components/memory/MemoryCard'
import type { MemoryCategory } from '@/types'

const CATEGORIES: { value: MemoryCategory; label: string; emoji: string }[] = [
  { value: 'everyday', label: 'Quotidien', emoji: '☀️' },
  { value: 'vacation', label: 'Vacances', emoji: '🏖️' },
  { value: 'school', label: 'École', emoji: '🎒' },
  { value: 'anniversary', label: 'Anniversaire', emoji: '🎂' },
  { value: 'trip', label: 'Voyage', emoji: '✈️' },
  { value: 'quote', label: 'Citation', emoji: '💬' },
  { value: 'achievement', label: 'Réussite', emoji: '🏆' },
]

export function SearchPage() {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<MemoryCategory | ''>('')
  const deferredQuery = useDeferredValue(query)

  const { data, isLoading } = useMemories({
    q: deferredQuery || undefined,
    category: category || undefined,
  })

  const memories = data?.memories ?? []
  const hasFilters = !!deferredQuery || !!category

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Recherche</h2>

      {/* Barre de recherche */}
      <div className="relative mb-4">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Chercher un souvenir, une personne, un lieu…"
          className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
        />
      </div>

      {/* Filtres catégorie */}
      <div className="flex gap-2 flex-wrap mb-6">
        {CATEGORIES.map((c) => (
          <button
            key={c.value}
            onClick={() => setCategory(category === c.value ? '' : c.value)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs border transition-colors ${
              category === c.value
                ? 'bg-violet-100 border-violet-400 text-violet-700 font-medium'
                : 'border-gray-200 text-gray-500 hover:border-gray-300'
            }`}
          >
            {c.emoji} {c.label}
          </button>
        ))}
      </div>

      {/* Résultats */}
      {isLoading && hasFilters && (
        <div className="flex flex-col gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex gap-4 animate-pulse">
              <div className="w-12 h-20 bg-gray-100 rounded" />
              <div className="flex-1 bg-gray-100 rounded-2xl h-28" />
            </div>
          ))}
        </div>
      )}

      {!isLoading && hasFilters && memories.length === 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <div className="text-4xl mb-4">🔍</div>
          <p className="text-gray-400 text-sm">Aucun souvenir trouvé</p>
        </div>
      )}

      {!hasFilters && (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <div className="text-4xl mb-4">🔍</div>
          <p className="text-gray-500 font-medium mb-1">Recherche naturelle</p>
          <p className="text-gray-400 text-sm">"Les vacances à la mer", "Les photos de Lucas"…</p>
        </div>
      )}

      {memories.length > 0 && (
        <div>
          <p className="text-xs text-gray-400 mb-4">{data?.total ?? memories.length} résultat{memories.length > 1 ? 's' : ''}</p>
          {memories.map((m) => (
            <MemoryCard key={m.id} memory={m} />
          ))}
        </div>
      )}
    </div>
  )
}
