import { Clock, BookImage, CalendarDays, Plus } from 'lucide-react'

export function HomePage() {
  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900">Bonjour 👋</h2>
        <p className="text-gray-500 mt-1">Que voulez-vous capturer aujourd'hui ?</p>
      </div>

      {/* Quick add */}
      <button className="w-full flex items-center gap-3 bg-violet-600 hover:bg-violet-700 text-white px-5 py-4 rounded-xl text-base font-medium transition-colors mb-8">
        <Plus size={20} />
        Ajouter un souvenir
      </button>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Souvenirs', value: '0', icon: Clock },
          { label: 'Albums', value: '0', icon: BookImage },
          { label: 'Récaps', value: '0', icon: CalendarDays },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="bg-white rounded-xl p-4 border border-gray-100 text-center">
            <Icon size={20} className="text-violet-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            <p className="text-xs text-gray-400">{label}</p>
          </div>
        ))}
      </div>

      {/* Empty state */}
      <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
        <div className="text-4xl mb-4">📸</div>
        <h3 className="text-lg font-semibold text-gray-800 mb-2">
          Votre journal commence ici
        </h3>
        <p className="text-gray-400 text-sm max-w-sm mx-auto">
          Ajoutez votre premier souvenir — une photo, une anecdote, un moment du quotidien.
        </p>
      </div>
    </div>
  )
}
