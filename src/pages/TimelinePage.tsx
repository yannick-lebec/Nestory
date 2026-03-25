import { useNavigate } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { useMemories } from '@/hooks/useMemories'
import { useMyFamilies } from '@/hooks/useFamily'
import { MemoryCard } from '@/components/memory/MemoryCard'
import type { Memory } from '@/types'

function groupByMonth(memories: Memory[]) {
  const groups: Record<string, Memory[]> = {}
  for (const m of memories) {
    const date = new Date(m.memoryDate)
    const key = date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
    if (!groups[key]) groups[key] = []
    groups[key].push(m)
  }
  return groups
}

export function TimelinePage() {
  const navigate = useNavigate()
  const { data: familyData } = useMyFamilies()
  const { data, isLoading } = useMemories()

  const memories = data?.memories ?? []
  const groups = groupByMonth(memories)
  const hasFamily = (familyData?.families?.length ?? 0) > 0

  if (!hasFamily) {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <div className="text-4xl mb-4">🏡</div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Pas encore de famille</h3>
          <p className="text-gray-400 text-sm mb-6">Créez votre espace familial pour commencer.</p>
          <button
            onClick={() => navigate('/family/create')}
            className="bg-violet-600 hover:bg-violet-700 text-white px-6 py-2.5 rounded-lg text-sm font-medium"
          >
            Créer ma famille
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-bold text-gray-900">Timeline</h2>
        <button
          onClick={() => navigate('/memories/add')}
          className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          <Plus size={16} /> Ajouter
        </button>
      </div>

      {isLoading && (
        <div className="flex flex-col gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex gap-4 animate-pulse">
              <div className="w-12 h-20 bg-gray-100 rounded" />
              <div className="flex-1 bg-gray-100 rounded-2xl h-28" />
            </div>
          ))}
        </div>
      )}

      {!isLoading && memories.length === 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <div className="text-4xl mb-4">📸</div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Aucun souvenir pour l'instant</h3>
          <p className="text-gray-400 text-sm mb-6">Commencez par capturer votre premier moment.</p>
          <button
            onClick={() => navigate('/memories/add')}
            className="bg-violet-600 hover:bg-violet-700 text-white px-6 py-2.5 rounded-lg text-sm font-medium"
          >
            Ajouter un souvenir
          </button>
        </div>
      )}

      {Object.entries(groups).map(([month, items]) => (
        <div key={month} className="mb-8">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
            {month}
          </h3>
          {items.map((m) => (
            <MemoryCard key={m.id} memory={m} />
          ))}
        </div>
      ))}
    </div>
  )
}
