import { X, ChevronLeft, ChevronRight } from 'lucide-react'
import { useState, useEffect } from 'react'

interface Props {
  photos: { url: string }[]
  initialIndex: number
  onClose: () => void
}

export function PhotoLightbox({ photos, initialIndex, onClose }: Props) {
  const [current, setCurrent] = useState(initialIndex)

  function prev() {
    setCurrent((i) => (i > 0 ? i - 1 : photos.length - 1))
  }
  function next() {
    setCurrent((i) => (i < photos.length - 1 ? i + 1 : 0))
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft') prev()
      if (e.key === 'ArrowRight') next()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <div
      className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center"
      onClick={onClose}
    >
      <button
        className="absolute top-4 right-4 text-white/70 hover:text-white"
        onClick={onClose}
      >
        <X size={28} />
      </button>

      {photos.length > 1 && (
        <>
          <button
            className="absolute left-4 text-white/70 hover:text-white p-2"
            onClick={(e) => { e.stopPropagation(); prev() }}
          >
            <ChevronLeft size={36} />
          </button>
          <button
            className="absolute right-4 text-white/70 hover:text-white p-2"
            onClick={(e) => { e.stopPropagation(); next() }}
          >
            <ChevronRight size={36} />
          </button>
        </>
      )}

      <img
        src={photos[current].url}
        alt=""
        className="max-h-screen max-w-screen-lg object-contain px-16"
        onClick={(e) => e.stopPropagation()}
      />

      {photos.length > 1 && (
        <p className="absolute bottom-4 text-white/50 text-sm">
          {current + 1} / {photos.length}
        </p>
      )}
    </div>
  )
}
