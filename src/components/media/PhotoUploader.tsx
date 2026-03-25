import { useState, useRef } from 'react'
import { ImagePlus, X, Loader } from 'lucide-react'
import { cn } from '@/lib/utils'

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8080/api/v1'

interface UploadedPhoto {
  id: string
  url: string
}

interface Props {
  memoryId: string
  onChange?: (photos: UploadedPhoto[]) => void
}

export function PhotoUploader({ memoryId, onChange }: Props) {
  const [photos, setPhotos] = useState<UploadedPhoto[]>([])
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleFiles(files: FileList | null) {
    if (!files?.length) return
    setError('')
    setUploading(true)

    const token = localStorage.getItem('token')
    const familyId = JSON.parse(localStorage.getItem('nestory-auth') ?? '{}')?.state?.familyId

    const uploaded: UploadedPhoto[] = []

    for (const file of Array.from(files)) {
      if (file.size > 20 * 1024 * 1024) {
        setError(`${file.name} dépasse 20 Mo`)
        continue
      }

      const form = new FormData()
      form.append('file', file)

      try {
        const res = await fetch(`${BASE_URL}/memories/${memoryId}/media`, {
          method: 'POST',
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...(familyId ? { 'X-Family-Id': familyId } : {}),
          },
          body: form,
        })

        if (!res.ok) throw new Error('Upload failed')
        const data = await res.json()
        uploaded.push({ id: data.id, url: data.url })
      } catch {
        setError(`Échec de l'upload de ${file.name}`)
      }
    }

    const next = [...photos, ...uploaded]
    setPhotos(next)
    onChange?.(next)
    setUploading(false)
  }

  function removePhoto(id: string) {
    const next = photos.filter((p) => p.id !== id)
    setPhotos(next)
    onChange?.(next)
  }

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">Photos</label>

      <div className="grid grid-cols-3 gap-2 mb-3">
        {photos.map((p) => (
          <div key={p.id} className="relative aspect-square rounded-xl overflow-hidden bg-gray-100">
            <img src={p.url} alt="" className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={() => removePhoto(p.id)}
              className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-0.5 hover:bg-black/70"
            >
              <X size={12} />
            </button>
          </div>
        ))}

        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className={cn(
            'aspect-square rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-1 transition-colors',
            uploading
              ? 'border-gray-200 bg-gray-50 cursor-wait'
              : 'border-gray-300 hover:border-violet-400 hover:bg-violet-50 cursor-pointer'
          )}
        >
          {uploading ? (
            <Loader size={20} className="text-gray-400 animate-spin" />
          ) : (
            <>
              <ImagePlus size={20} className="text-gray-400" />
              <span className="text-xs text-gray-400">Ajouter</span>
            </>
          )}
        </button>
      </div>

      {error && <p className="text-xs text-red-500">{error}</p>}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif,video/mp4"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
    </div>
  )
}
