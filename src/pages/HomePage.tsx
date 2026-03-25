import { useNavigate } from 'react-router-dom'
import { Clock, BookImage, CalendarDays, Plus } from 'lucide-react'
import { useMemories } from '@/hooks/useMemories'
import { useMyFamilies } from '@/hooks/useFamily'
import { MemoryCard } from '@/components/memory/MemoryCard'
import { useAuthStore } from '@/store/auth'

export function HomePage() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const { data: familyData } = useMyFamilies()
  const { data, isLoading } = useMemories()

  const memories = data?.memories ?? []
  const total = data?.total ?? 0
  const family = familyData?.families?.[0]
  const recent = memories.slice(0, 3)

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900">
          Bonjour, {user?.name} 👋
        </h2>
        <p className="text-gray-500 mt-1 text-sm">
          {family ? `Famille ${family.name}` : 'Créez votre famille pour commencer'}
        </p>
      </div>

      {/* Quick add */}
      <button
        onClick={() => navigate(family ? '/memories/add' : '/family/create')}
        className="w-full flex items-center gap-3 bg-violet-600 hover:bg-violet-700 text-white px-5 py-4 rounded-xl text-base font-medium transition-colors mb-8"
      >
        <Plus size={20} />
        {family ? 'Ajouter un souvenir' : 'Créer ma famille'}
      </button>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Souvenirs', value: total, icon: Clock },
          { label: 'Albums', value: 0, icon: BookImage },
          { label: 'Récaps', value: 0, icon: CalendarDays },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="bg-white rounded-xl p-4 border border-gray-100 text-center">
            <Icon size={20} className="text-violet-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            <p className="text-xs text-gray-400">{label}</p>
          </div>
        ))}
      </div>

      {/* Recent memories */}
      {family && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-800">Récents</h3>
            {memories.length > 0 && (
              <button
                onClick={() => navigate('/timeline')}
                className="text-sm text-violet-600 hover:underline"
              >
                Voir tout
              </button>
            )}
          </div>

          {isLoading && (
            <div className="flex flex-col gap-3 animate-pulse">
              {[...Array(2)].map((_, i) => (
                <div key={i} className="flex gap-4">
                  <div className="w-12 h-20 bg-gray-100 rounded" />
                  <div className="flex-1 bg-gray-100 rounded-2xl h-20" />
                </div>
              ))}
            </div>
          )}

          {!isLoading && memories.length === 0 && (
            <div className="bg-white rounded-xl border border-gray-100 p-10 text-center">
              <div className="text-4xl mb-3">📸</div>
              <p className="text-gray-400 text-sm">Votre journal commence ici.</p>
            </div>
          )}

          {recent.map((m) => (
            <MemoryCard key={m.id} memory={m} />
          ))}
        </div>
      )}
    </div>
  )
}
