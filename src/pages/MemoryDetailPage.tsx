import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, MapPin, Tag, Users, Trash2 } from 'lucide-react'
import { PhotoLightbox } from '@/components/media/PhotoLightbox'
import { useQueryClient } from '@tanstack/react-query'
import { useMemory } from '@/hooks/useMemory'
import { useAuthStore } from '@/store/auth'
import { api } from '@/lib/api'

const CATEGORY_EMOJI: Record<string, string> = {
  anniversary: '🎂', vacation: '🏖️', school: '🎒',
  everyday: '☀️', trip: '✈️', quote: '💬', achievement: '🏆',
}
const CATEGORY_LABEL: Record<string, string> = {
  anniversary: 'Anniversaire', vacation: 'Vacances', school: 'École',
  everyday: 'Quotidien', trip: 'Voyage', quote: 'Citation', achievement: 'Réussite',
}

export function MemoryDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const familyId = useAuthStore((s) => s.familyId)
  const { data: memory, isLoading } = useMemory(id!)

  const [lightbox, setLightbox] = useState<number | null>(null)
  const [confirm, setConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const media = memory?.media ?? []

  async function handleDelete() {
    setDeleting(true)
    try {
      await api.delete(`/memories/${id}`)
      queryClient.invalidateQueries({ queryKey: ['memories', familyId] })
      navigate('/timeline')
    } finally {
      setDeleting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="p-6 max-w-2xl mx-auto animate-pulse">
        <div className="h-6 w-32 bg-gray-100 rounded mb-6" />
        <div className="h-64 bg-gray-100 rounded-2xl mb-4" />
        <div className="h-4 w-48 bg-gray-100 rounded mb-2" />
        <div className="h-4 w-full bg-gray-100 rounded" />
      </div>
    )
  }

  if (!memory) {
    return (
      <div className="p-6 max-w-2xl mx-auto text-center">
        <p className="text-gray-400">Souvenir introuvable</p>
      </div>
    )
  }

  const date = new Date(memory.memoryDate)
  const formattedDate = date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  const tags = memory.tags ?? []
  const people = memory.people ?? []

  return (
    <div className="p-6 max-w-2xl mx-auto pb-24">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-500 hover:text-gray-800 text-sm">
          <ArrowLeft size={18} /> Retour
        </button>
        {confirm ? (
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">Supprimer ?</span>
            <button onClick={handleDelete} disabled={deleting} className="text-xs text-white bg-red-500 hover:bg-red-600 px-2 py-1 rounded-lg disabled:opacity-50">
              {deleting ? '…' : 'Oui'}
            </button>
            <button onClick={() => setConfirm(false)} className="text-xs text-gray-500 border border-gray-200 px-2 py-1 rounded-lg">
              Non
            </button>
          </div>
        ) : (
          <button onClick={() => setConfirm(true)} className="text-gray-300 hover:text-red-400 transition-colors">
            <Trash2 size={18} />
          </button>
        )}
      </div>

      {/* Catégorie + humeur */}
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xs font-medium text-violet-500 bg-violet-50 px-2 py-0.5 rounded-full">
          {CATEGORY_EMOJI[memory.category]} {CATEGORY_LABEL[memory.category]}
        </span>
        {memory.mood && <span className="text-lg">{memory.mood}</span>}
      </div>

      {/* Titre */}
      <h1 className="text-2xl font-bold text-gray-900 mb-1">{memory.title}</h1>

      {/* Date + lieu */}
      <div className="flex flex-wrap gap-3 text-sm text-gray-400 mb-4">
        <span className="capitalize">{formattedDate}</span>
        {memory.locationName && (
          <span className="flex items-center gap-1"><MapPin size={13} /> {memory.locationName}</span>
        )}
      </div>

      {/* Description */}
      {memory.description && (
        <p className="text-gray-600 text-sm leading-relaxed mb-6">{memory.description}</p>
      )}

      {/* Galerie photos */}
      {media.length > 0 && (
        <div className="mb-6">
          {media.length === 1 ? (
            <div className="rounded-2xl overflow-hidden cursor-pointer" onClick={() => setLightbox(0)}>
              <img src={media[0].url} alt="" className="w-full aspect-video object-cover" />
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-1.5">
              {media.map((m, i) => (
                <div key={m.id} className="aspect-square rounded-xl overflow-hidden cursor-pointer" onClick={() => setLightbox(i)}>
                  <img src={m.url} alt="" className="w-full h-full object-cover hover:scale-105 transition-transform" />
                </div>
              ))}
            </div>
          )}
          <p className="text-xs text-gray-400 mt-2">{media.length} photo{media.length > 1 ? 's' : ''}</p>
        </div>
      )}

      {/* Personnes */}
      {people.length > 0 && (
        <div className="flex items-center gap-2 mb-3">
          <Users size={14} className="text-gray-400 shrink-0" />
          <div className="flex flex-wrap gap-1.5">
            {people.map((p) => (
              <span key={p} className="bg-violet-50 text-violet-700 text-xs px-2 py-0.5 rounded-full">{p}</span>
            ))}
          </div>
        </div>
      )}

      {/* Tags */}
      {tags.length > 0 && (
        <div className="flex items-center gap-2">
          <Tag size={14} className="text-gray-400 shrink-0" />
          <div className="flex flex-wrap gap-1.5">
            {tags.map((t) => (
              <span key={t} className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full">#{t}</span>
            ))}
          </div>
        </div>
      )}

      {lightbox !== null && (
        <PhotoLightbox photos={media} initialIndex={lightbox} onClose={() => setLightbox(null)} />
      )}
    </div>
  )
}
