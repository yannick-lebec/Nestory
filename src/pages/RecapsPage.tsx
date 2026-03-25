export function RecapsPage() {
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Récaps mensuels</h2>
      <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
        <div className="text-4xl mb-4">📖</div>
        <h3 className="text-lg font-semibold text-gray-800 mb-2">
          Votre mois en quelques mots
        </h3>
        <p className="text-gray-400 text-sm">
          Chaque mois, un résumé narratif généré à partir de vos souvenirs.
        </p>
      </div>
    </div>
  )
}
