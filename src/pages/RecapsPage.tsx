import { useState } from 'react'
import { ChevronLeft, ChevronRight, Sparkles, Camera } from 'lucide-react'
import { useRecap } from '@/hooks/useRecap'
import { PhotoLightbox } from '@/components/media/PhotoLightbox'
import type { RecapMemory } from '@/types'

const MONTHS_FR = ['', 'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre']

function clampMonth(year: number, month: number): [number, number] {
  if (month < 1) return [year - 1, 12]
  if (month > 12) return [year + 1, 1]
  return [year, month]
}

export function RecapsPage() {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [lightbox, setLightbox] = useState<{ photos: { url: string }[]; index: number } | null>(null)

  const { data: recap, isLoading } = useRecap(year, month)

  function navigate(delta: number) {
    const [y, m] = clampMonth(year, month + delta)
    setYear(y)
    setMonth(m)
  }

  function openLightbox(memories: RecapMemory[], memIndex: number) {
    const photos = memories.flatMap((m) => m.coverUrl ? [{ url: m.coverUrl }] : [])
    if (photos.length === 0) return
    setLightbox({ photos, index: Math.min(memIndex, photos.length - 1) })
  }

  return (
    <div className="p-6 max-w-2xl mx-auto pb-24">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Récap mensuel</h2>
      </div>

      {/* Month picker */}
      <div className="flex items-center justify-between bg-white rounded-2xl border border-gray-100 px-4 py-3 mb-6">
        <button
          onClick={() => navigate(-1)}
          className="p-1 text-gray-400 hover:text-gray-700 transition-colors"
        >
          <ChevronLeft size={22} />
        </button>
        <span className="font-semibold text-gray-800">
          {MONTHS_FR[month]} {year}
        </span>
        <button
          onClick={() => navigate(1)}
          disabled={year === now.getFullYear() && month >= now.getMonth() + 1}
          className="p-1 text-gray-400 hover:text-gray-700 transition-colors disabled:opacity-30"
        >
          <ChevronRight size={22} />
        </button>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="space-y-4 animate-pulse">
          <div className="h-28 bg-gray-100 rounded-2xl" />
          <div className="h-40 bg-gray-100 rounded-2xl" />
          <div className="h-40 bg-gray-100 rounded-2xl" />
        </div>
      )}

      {/* Empty */}
      {!isLoading && recap && recap.totalMemories === 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <div className="text-4xl mb-4">📭</div>
          <p className="text-gray-500 font-medium">Aucun souvenir ce mois-ci</p>
          <p className="text-gray-400 text-sm mt-1">Commencez à ajouter des souvenirs pour voir votre récap.</p>
        </div>
      )}

      {/* Recap content */}
      {!isLoading && recap && recap.totalMemories > 0 && (
        <div className="space-y-5">
          {/* Stats bar */}
          <div className="flex gap-3">
            <div className="flex-1 bg-violet-50 rounded-xl px-4 py-3 text-center">
              <p className="text-xl font-bold text-violet-700">{recap.totalMemories}</p>
              <p className="text-xs text-violet-500 mt-0.5">souvenir{recap.totalMemories > 1 ? 's' : ''}</p>
            </div>
            <div className="flex-1 bg-violet-50 rounded-xl px-4 py-3 text-center">
              <p className="text-xl font-bold text-violet-700">{recap.totalPhotos}</p>
              <p className="text-xs text-violet-500 mt-0.5">photo{recap.totalPhotos > 1 ? 's' : ''}</p>
            </div>
            <div className="flex-1 bg-violet-50 rounded-xl px-4 py-3 text-center">
              <p className="text-xl font-bold text-violet-700">{recap.categories.length}</p>
              <p className="text-xs text-violet-500 mt-0.5">catégorie{recap.categories.length > 1 ? 's' : ''}</p>
            </div>
          </div>


          {/* Categories */}
          {recap.categories.map((cat) => (
            <div key={cat.key} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              {/* Category header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{cat.emoji}</span>
                  <span className="font-semibold text-gray-800">{cat.label}</span>
                </div>
                <span className="text-xs text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full">
                  {cat.count} souvenir{cat.count > 1 ? 's' : ''}
                </span>
              </div>

              {/* Photo grid */}
              {cat.memories.some((m) => m.coverUrl) && (
                <div className="grid grid-cols-3 gap-0.5 bg-gray-100">
                  {cat.memories.filter((m) => m.coverUrl).slice(0, 6).map((m, i) => (
                    <div
                      key={m.id}
                      className="aspect-square overflow-hidden cursor-pointer relative group"
                      onClick={() => openLightbox(cat.memories, i)}
                    >
                      <img src={m.coverUrl} alt={m.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                      {i === 5 && cat.memories.filter((x) => x.coverUrl).length > 6 && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white font-semibold text-sm">
                          +{cat.memories.filter((x) => x.coverUrl).length - 6}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Memory list */}
              <div className="divide-y divide-gray-50">
                {cat.memories.map((m) => (
                  <div key={m.id} className="px-5 py-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-gray-800 text-sm truncate">{m.title}</p>
                        {m.aiDescription ? (
                          <div className="flex items-start gap-1 mt-1">
                            <Sparkles size={11} className="text-violet-400 shrink-0 mt-0.5" />
                            <p className="text-xs text-violet-600 italic leading-relaxed">{m.aiDescription}</p>
                          </div>
                        ) : m.description ? (
                          <p className="text-xs text-gray-400 line-clamp-2 mt-0.5">{m.description}</p>
                        ) : null}
                        <div className="flex items-center gap-2 mt-1 text-xs text-gray-400">
                          {m.locationName && <span>{m.locationName}</span>}
                          {m.people.length > 0 && <span>{m.people.join(', ')}</span>}
                        </div>
                      </div>
                      {m.coverUrl && (
                        <Camera size={14} className="text-gray-300 shrink-0 mt-1" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {lightbox && (
        <PhotoLightbox
          photos={lightbox.photos}
          initialIndex={lightbox.index}
          onClose={() => setLightbox(null)}
        />
      )}
    </div>
  )
}
