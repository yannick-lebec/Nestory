import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/auth'
import { api } from '@/lib/api'
import type { Memory, MemoryCategory } from '@/types'
import { X } from 'lucide-react'

const CATEGORIES: { value: MemoryCategory; label: string; emoji: string }[] = [
  { value: 'everyday', label: 'Quotidien', emoji: '☀️' },
  { value: 'vacation', label: 'Vacances', emoji: '🏖️' },
  { value: 'school', label: 'École', emoji: '🎒' },
  { value: 'anniversary', label: 'Anniversaire', emoji: '🎂' },
  { value: 'trip', label: 'Voyage', emoji: '✈️' },
  { value: 'quote', label: 'Citation', emoji: '💬' },
  { value: 'achievement', label: 'Réussite', emoji: '🏆' },
]

const MOODS = ['😊', '😄', '🥰', '😂', '🤩', '😢', '🥹']

export function AddMemoryPage() {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [memoryDate, setMemoryDate] = useState(new Date().toISOString().split('T')[0])
  const [locationName, setLocationName] = useState('')
  const [category, setCategory] = useState<MemoryCategory>('everyday')
  const [mood, setMood] = useState('')
  const [tagInput, setTagInput] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [peopleInput, setPeopleInput] = useState('')
  const [people, setPeople] = useState<string[]>([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const familyId = useAuthStore((s) => s.familyId)
  const navigate = useNavigate()

  function addTag() {
    const t = tagInput.trim().toLowerCase()
    if (t && !tags.includes(t)) setTags([...tags, t])
    setTagInput('')
  }

  function addPerson() {
    const p = peopleInput.trim()
    if (p && !people.includes(p)) setPeople([...people, p])
    setPeopleInput('')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!familyId) {
      navigate('/family/create')
      return
    }
    setError('')
    setLoading(true)
    try {
      await api.post<Memory>('/memories', {
        title,
        description,
        memory_date: memoryDate,
        location_name: locationName,
        category,
        mood,
        tags,
        people,
      })
      navigate('/timeline')
    } catch {
      setError('Impossible de sauvegarder le souvenir')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 max-w-2xl mx-auto pb-24">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Nouveau souvenir</h2>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        {/* Titre */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Titre *</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
            placeholder="Premier jour d'école de Lucas…"
          />
        </div>

        {/* Catégorie */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Catégorie</label>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((c) => (
              <button
                key={c.value}
                type="button"
                onClick={() => setCategory(c.value)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm border transition-colors ${
                  category === c.value
                    ? 'bg-violet-100 border-violet-400 text-violet-700 font-medium'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                {c.emoji} {c.label}
              </button>
            ))}
          </div>
        </div>

        {/* Date & lieu */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Date *</label>
            <input
              type="date"
              value={memoryDate}
              onChange={(e) => setMemoryDate(e.target.value)}
              required
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Lieu</label>
            <input
              type="text"
              value={locationName}
              onChange={(e) => setLocationName(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
              placeholder="Paris, maison…"
            />
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"
            placeholder="Raconte ce moment…"
          />
        </div>

        {/* Humeur */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Humeur</label>
          <div className="flex gap-2">
            {MOODS.map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMood(mood === m ? '' : m)}
                className={`text-2xl p-1.5 rounded-lg transition-all ${
                  mood === m ? 'bg-violet-100 scale-110' : 'hover:bg-gray-100'
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        {/* Personnes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Personnes</label>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              value={peopleInput}
              onChange={(e) => setPeopleInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addPerson())}
              className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
              placeholder="Lucas, Emma…"
            />
            <button
              type="button"
              onClick={addPerson}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm"
            >
              Ajouter
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {people.map((p) => (
              <span key={p} className="flex items-center gap-1 bg-violet-50 text-violet-700 px-3 py-1 rounded-full text-sm">
                {p}
                <button type="button" onClick={() => setPeople(people.filter((x) => x !== p))}>
                  <X size={12} />
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* Tags */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Tags</label>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
              className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
              placeholder="été, famille, drôle…"
            />
            <button
              type="button"
              onClick={addTag}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm"
            >
              Ajouter
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {tags.map((t) => (
              <span key={t} className="flex items-center gap-1 bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-sm">
                #{t}
                <button type="button" onClick={() => setTags(tags.filter((x) => x !== t))}>
                  <X size={12} />
                </button>
              </span>
            ))}
          </div>
        </div>

        {error && (
          <p className="text-sm text-red-500 bg-red-50 px-4 py-2.5 rounded-lg">{error}</p>
        )}

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex-1 border border-gray-200 text-gray-600 hover:bg-gray-50 font-medium py-3 rounded-xl text-sm transition-colors"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-violet-600 hover:bg-violet-700 disabled:opacity-60 text-white font-medium py-3 rounded-xl text-sm transition-colors"
          >
            {loading ? 'Sauvegarde…' : 'Sauvegarder'}
          </button>
        </div>
      </form>
    </div>
  )
}
