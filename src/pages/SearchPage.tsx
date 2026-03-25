import { Search } from 'lucide-react'

export function SearchPage() {
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Recherche</h2>
      <div className="relative mb-8">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Chercher un souvenir, une personne, un lieu…"
          className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
        />
      </div>
      <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
        <div className="text-4xl mb-4">🔍</div>
        <h3 className="text-lg font-semibold text-gray-800 mb-2">
          Recherche naturelle
        </h3>
        <p className="text-gray-400 text-sm">
          "Les vacances à la mer", "Les photos de Lucas", "Noël 2023"
        </p>
      </div>
    </div>
  )
}
