import { useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAlbums, type SmartAlbum } from '@/hooks/useAlbums'
import { MemoryCard } from '@/components/memory/MemoryCard'

function AlbumCard({ album, onClick }: { album: SmartAlbum; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="group relative rounded-2xl overflow-hidden bg-gray-100 aspect-square text-left w-full"
    >
      {album.coverUrl ? (
        <img src={album.coverUrl} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-4xl bg-linear-to-br from-violet-50 to-violet-100">
          {album.emoji}
        </div>
      )}
      <div className="absolute inset-0 bg-linear-to-t from-black/60 via-black/10 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 p-3">
        <div className="flex items-center gap-1.5 mb-0.5">
          <span className="text-base">{album.emoji}</span>
          <span className="text-white font-semibold text-sm truncate">{album.title}</span>
        </div>
        <span className="text-white/70 text-xs">{album.count} souvenir{album.count > 1 ? 's' : ''}</span>
      </div>
    </button>
  )
}

function Section({ title, albums, onSelect }: { title: string; albums: SmartAlbum[]; onSelect: (a: SmartAlbum) => void }) {
  if (!albums.length) return null
  return (
    <div className="mb-8">
      <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">{title}</h3>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {albums.map((album) => (
          <AlbumCard key={`${album.type}-${album.key}`} album={album} onClick={() => onSelect(album)} />
        ))}
      </div>
    </div>
  )
}

export function AlbumsPage() {
  const navigate = useNavigate()
  const { albums, isLoading } = useAlbums()
  const [selectedKey, setSelectedKey] = useState<string | null>(null)
  const selected = selectedKey ? albums.find((a) => `${a.type}-${a.key}` === selectedKey) ?? null : null

  const byCategory = albums.filter((a) => a.type === 'category')
  const byPerson   = albums.filter((a) => a.type === 'person')
  const byYear     = albums.filter((a) => a.type === 'year').sort((a, b) => Number(b.key) - Number(a.key))

  if (selected) {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <button
          onClick={() => setSelectedKey(null)}
          className="flex items-center gap-2 text-gray-500 hover:text-gray-800 text-sm mb-6"
        >
          <ArrowLeft size={18} /> Albums
        </button>
        <div className="flex items-center gap-3 mb-6">
          <span className="text-3xl">{selected.emoji}</span>
          <div>
            <h2 className="text-xl font-bold text-gray-900">{selected.title}</h2>
            <p className="text-sm text-gray-400">{selected.count} souvenir{selected.count > 1 ? 's' : ''}</p>
          </div>
        </div>
        {selected.memories.map((m) => (
          <MemoryCard key={m.id} memory={m} />
        ))}
      </div>
    )
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Albums</h2>

      {isLoading && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="aspect-square rounded-2xl bg-gray-100 animate-pulse" />
          ))}
        </div>
      )}

      {!isLoading && albums.length === 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <div className="text-4xl mb-4">📚</div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Aucun album pour l'instant</h3>
          <p className="text-gray-400 text-sm mb-6">Les albums se génèrent automatiquement depuis tes souvenirs.</p>
          <button
            onClick={() => navigate('/memories/add')}
            className="bg-violet-600 hover:bg-violet-700 text-white px-6 py-2.5 rounded-lg text-sm font-medium"
          >
            Ajouter un souvenir
          </button>
        </div>
      )}

      <Section title="Par catégorie" albums={byCategory} onSelect={(a) => setSelectedKey(`${a.type}-${a.key}`)} />
      <Section title="Par personne"  albums={byPerson}   onSelect={(a) => setSelectedKey(`${a.type}-${a.key}`)} />
      <Section title="Par année"     albums={byYear}     onSelect={(a) => setSelectedKey(`${a.type}-${a.key}`)} />
    </div>
  )
}
