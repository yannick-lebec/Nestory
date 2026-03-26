import { useState, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Upload, X, Check, ChevronDown, ChevronUp } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/store/auth'

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8080/api/v1'

const CATEGORIES = [
  { value: 'everyday',    label: 'Quotidien',    emoji: '☀️' },
  { value: 'vacation',    label: 'Vacances',     emoji: '🏖️' },
  { value: 'school',      label: 'École',        emoji: '🎒' },
  { value: 'anniversary', label: 'Anniversaire', emoji: '🎂' },
  { value: 'trip',        label: 'Voyage',       emoji: '✈️' },
  { value: 'achievement', label: 'Réussite',     emoji: '🏆' },
  { value: 'quote',       label: 'Citation',     emoji: '💬' },
]

interface Photo {
  id: string
  url: string
  takenAt: string
  filename: string
}

interface Group {
  date: string
  title: string
  photos: Photo[]
}

interface AnalyzeResponse {
  sessionId: string
  groups: Group[]
  total: number
}

interface EditableGroup extends Group {
  category: string
  expanded: boolean
  selected: boolean
}

type Step = 'pick' | 'uploading' | 'review' | 'saving' | 'done'

export function ImportPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const familyId = useAuthStore((s) => s.familyId)
  const token = localStorage.getItem('token')

  const [step, setStep] = useState<Step>('pick')
  const [progress, setProgress] = useState(0)
  const [fileCount, setFileCount] = useState(0)
  const [sessionId, setSessionId] = useState('')
  const [groups, setGroups] = useState<EditableGroup[]>([])
  const [error, setError] = useState('')
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  async function upload(files: FileList) {
    const arr = Array.from(files).filter((f) =>
      /^image\/(jpeg|png|webp|heic|heif)|video\/(mp4|quicktime|webm)$/.test(f.type)
    )
    if (!arr.length) return

    setFileCount(arr.length)
    setStep('uploading')
    setProgress(0)
    setError('')

    const form = new FormData()
    arr.forEach((f) => form.append('files', f))

    try {
      // Use XHR for real upload progress
      const data = await new Promise<AnalyzeResponse>((resolve, reject) => {
        const xhr = new XMLHttpRequest()
        xhr.open('POST', `${BASE_URL}/import/analyze`)
        xhr.setRequestHeader('Authorization', `Bearer ${token}`)
        if (familyId) xhr.setRequestHeader('X-Family-Id', familyId)
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) setProgress(Math.round((e.loaded / e.total) * 100))
        }
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              resolve(JSON.parse(xhr.responseText))
            } catch {
              reject(new Error('Invalid response'))
            }
          } else {
            reject(new Error(`Upload failed: ${xhr.status}`))
          }
        }
        xhr.onerror = () => reject(new Error('Network error'))
        xhr.send(form)
      })

      setSessionId(data.sessionId)
      setGroups(
        data.groups.map((g) => ({
          ...g,
          category: 'everyday',
          expanded: true,
          selected: true,
        }))
      )
      setStep('review')
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erreur lors de l\'upload')
      setStep('pick')
    }
  }

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    if (e.dataTransfer.files.length) upload(e.dataTransfer.files)
  }, [])

  async function confirm() {
    const selected = groups.filter((g) => g.selected)
    if (!selected.length) return

    setStep('saving')
    try {
      const res = await fetch(`${BASE_URL}/import/confirm`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          ...(familyId ? { 'X-Family-Id': familyId } : {}),
        },
        body: JSON.stringify({
          session_id: sessionId,
          groups: selected.map((g) => ({
            date: g.date,
            title: g.title,
            category: g.category,
            photo_ids: g.photos.map((p) => p.id),
          })),
        }),
      })
      if (!res.ok) throw new Error('Erreur lors de la sauvegarde')
      queryClient.invalidateQueries({ queryKey: ['memories'] })
      queryClient.invalidateQueries({ queryKey: ['memories-all'] })
      setStep('done')
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erreur')
      setStep('review')
    }
  }

  function updateGroup(i: number, patch: Partial<EditableGroup>) {
    setGroups((gs) => gs.map((g, idx) => idx === i ? { ...g, ...patch } : g))
  }

  // ── PICK ──────────────────────────────────────────────────────────────────
  if (step === 'pick') {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Importer des photos</h2>
        <p className="text-gray-400 text-sm mb-8">
          Glisse jusqu'à 500 photos — elles seront automatiquement regroupées par jour.
        </p>

        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          onClick={() => inputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-16 flex flex-col items-center gap-4 cursor-pointer transition-colors ${
            dragging ? 'border-violet-400 bg-violet-50' : 'border-gray-200 hover:border-violet-300 hover:bg-gray-50'
          }`}
        >
          <div className="w-16 h-16 bg-violet-100 rounded-2xl flex items-center justify-center">
            <Upload size={28} className="text-violet-500" />
          </div>
          <div className="text-center">
            <p className="font-semibold text-gray-700 mb-1">Glisse tes photos ici</p>
            <p className="text-sm text-gray-400">ou clique pour sélectionner</p>
          </div>
          <p className="text-xs text-gray-300">JPG, PNG, HEIC, MP4 · max 500 fichiers</p>
        </div>

        {error && <p className="mt-4 text-sm text-red-500 text-center">{error}</p>}

        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/heic,video/mp4,video/quicktime"
          multiple
          className="hidden"
          onChange={(e) => e.target.files && upload(e.target.files)}
        />
      </div>
    )
  }

  // ── UPLOADING ─────────────────────────────────────────────────────────────
  if (step === 'uploading') {
    return (
      <div className="p-6 max-w-2xl mx-auto flex flex-col items-center justify-center min-h-64 gap-6">
        <div className="text-4xl">📤</div>
        <div className="text-center">
          <p className="font-semibold text-gray-800 mb-1">Upload en cours…</p>
          <p className="text-sm text-gray-400">{fileCount} fichier{fileCount > 1 ? 's' : ''}</p>
        </div>
        <div className="w-full max-w-sm">
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-violet-500 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-gray-400 text-right mt-1">{progress}%</p>
        </div>
      </div>
    )
  }

  // ── REVIEW ────────────────────────────────────────────────────────────────
  if (step === 'review') {
    const selectedCount = groups.filter((g) => g.selected).length
    return (
      <div className="p-6 max-w-2xl mx-auto pb-32">
        <h2 className="text-2xl font-bold text-gray-900 mb-1">Vérifier les groupes</h2>
        <p className="text-sm text-gray-400 mb-6">
          {fileCount} photos regroupées en {groups.length} souvenir{groups.length > 1 ? 's' : ''} par date.
        </p>

        <div className="flex flex-col gap-3">
          {groups.map((g, i) => (
            <div key={g.date} className={`bg-white border rounded-2xl overflow-hidden transition-colors ${g.selected ? 'border-violet-200' : 'border-gray-100 opacity-60'}`}>
              {/* Group header */}
              <div className="flex items-center gap-3 p-4">
                <input
                  type="checkbox"
                  checked={g.selected}
                  onChange={(e) => updateGroup(i, { selected: e.target.checked })}
                  className="accent-violet-600 w-4 h-4 shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <input
                    type="text"
                    value={g.title}
                    onChange={(e) => updateGroup(i, { title: e.target.value })}
                    className="font-semibold text-gray-900 text-sm w-full bg-transparent focus:outline-none focus:ring-1 focus:ring-violet-300 rounded px-1"
                  />
                  <p className="text-xs text-gray-400">{g.date} · {g.photos.length} photo{g.photos.length > 1 ? 's' : ''}</p>
                </div>
                {/* Category picker */}
                <select
                  value={g.category}
                  onChange={(e) => updateGroup(i, { category: e.target.value })}
                  className="text-xs border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-violet-300"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>{c.emoji} {c.label}</option>
                  ))}
                </select>
                <button onClick={() => updateGroup(i, { expanded: !g.expanded })} className="text-gray-300 hover:text-gray-500">
                  {g.expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
              </div>

              {/* Photo thumbnails */}
              {g.expanded && (
                <div className="flex gap-1.5 px-4 pb-4 overflow-x-auto">
                  {g.photos.map((p) => (
                    <img
                      key={p.id}
                      src={p.url}
                      alt={p.filename}
                      className="w-16 h-16 object-cover rounded-lg shrink-0"
                    />
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {error && <p className="mt-4 text-sm text-red-500">{error}</p>}

        {/* Fixed bottom bar */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-4 flex gap-3 max-w-2xl mx-auto">
          <button
            onClick={() => setStep('pick')}
            className="flex-none border border-gray-200 text-gray-600 px-4 py-3 rounded-xl text-sm"
          >
            Annuler
          </button>
          <button
            onClick={confirm}
            disabled={selectedCount === 0}
            className="flex-1 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white font-medium py-3 rounded-xl text-sm"
          >
            Créer {selectedCount} souvenir{selectedCount > 1 ? 's' : ''}
          </button>
        </div>
      </div>
    )
  }

  // ── SAVING ────────────────────────────────────────────────────────────────
  if (step === 'saving') {
    return (
      <div className="p-6 max-w-2xl mx-auto flex flex-col items-center justify-center min-h-64 gap-4">
        <div className="text-4xl animate-bounce">💾</div>
        <p className="font-semibold text-gray-800">Création des souvenirs…</p>
      </div>
    )
  }

  // ── DONE ──────────────────────────────────────────────────────────────────
  const created = groups.filter((g) => g.selected).length
  return (
    <div className="p-6 max-w-2xl mx-auto flex flex-col items-center justify-center min-h-64 gap-6 text-center">
      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
        <Check size={32} className="text-green-500" />
      </div>
      <div>
        <p className="text-xl font-bold text-gray-900 mb-1">Import terminé !</p>
        <p className="text-gray-400 text-sm">{created} souvenir{created > 1 ? 's' : ''} créé{created > 1 ? 's' : ''}</p>
      </div>
      <button
        onClick={() => navigate('/timeline')}
        className="bg-violet-600 hover:bg-violet-700 text-white px-8 py-3 rounded-xl font-medium text-sm"
      >
        Voir la timeline
      </button>
    </div>
  )
}
