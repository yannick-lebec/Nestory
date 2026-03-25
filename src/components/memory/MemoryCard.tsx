import { MapPin, Tag, Users } from 'lucide-react'
import type { Memory, MemoryCategory } from '@/types'

const CATEGORY_EMOJI: Record<MemoryCategory, string> = {
  anniversary: '🎂',
  vacation: '🏖️',
  school: '🎒',
  everyday: '☀️',
  trip: '✈️',
  quote: '💬',
  achievement: '🏆',
}

const CATEGORY_LABEL: Record<MemoryCategory, string> = {
  anniversary: 'Anniversaire',
  vacation: 'Vacances',
  school: 'École',
  everyday: 'Quotidien',
  trip: 'Voyage',
  quote: 'Citation',
  achievement: 'Réussite',
}

interface Props {
  memory: Memory
}

export function MemoryCard({ memory }: Props) {
  // API may return null for empty arrays
  const tags = memory.tags ?? []
  const people = memory.people ?? []
  const media = memory.media ?? []
  const date = new Date(memory.memoryDate)
  const day = date.getDate()
  const weekday = date.toLocaleDateString('fr-FR', { weekday: 'short' })

  return (
    <div className="flex gap-4">
      {/* Date badge */}
      <div className="flex flex-col items-center w-12 shrink-0">
        <span className="text-xs text-gray-400 capitalize">{weekday}</span>
        <span className="text-2xl font-bold text-gray-800">{day}</span>
        <div className="w-px flex-1 bg-gray-200 mt-2" />
      </div>

      {/* Card */}
      <div className="flex-1 bg-white rounded-2xl border border-gray-100 p-5 mb-4 hover:shadow-sm transition-shadow">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <span className="text-xs font-medium text-violet-500 bg-violet-50 px-2 py-0.5 rounded-full">
              {CATEGORY_EMOJI[memory.category]} {CATEGORY_LABEL[memory.category]}
            </span>
            {memory.mood && <span className="ml-2 text-sm">{memory.mood}</span>}
          </div>
        </div>

        <h3 className="font-semibold text-gray-900 mb-1">{memory.title}</h3>

        {memory.description && (
          <p className="text-sm text-gray-500 line-clamp-2 mb-3">{memory.description}</p>
        )}

        {media.length > 0 && (
          <div className="flex gap-1.5 mb-3 overflow-hidden rounded-lg">
            {media.slice(0, 3).map((m, i) => (
              <div
                key={m.id}
                className={`relative overflow-hidden rounded-lg bg-gray-100 ${media.length === 1 ? 'w-full aspect-video' : 'flex-1 aspect-square'}`}
              >
                <img src={m.url} alt="" className="w-full h-full object-cover" />
                {i === 2 && media.length > 3 && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white font-semibold text-sm">
                    +{media.length - 3}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="flex flex-wrap gap-3 text-xs text-gray-400">
          {memory.locationName && (
            <span className="flex items-center gap-1">
              <MapPin size={11} /> {memory.locationName}
            </span>
          )}
          {people.length > 0 && (
            <span className="flex items-center gap-1">
              <Users size={11} /> {people.join(', ')}
            </span>
          )}
          {tags.length > 0 && (
            <span className="flex items-center gap-1">
              <Tag size={11} /> {tags.map((t) => `#${t}`).join(' ')}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
