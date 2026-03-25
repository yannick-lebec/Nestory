export function AlbumsPage() {
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Albums</h2>
      <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
        <div className="text-4xl mb-4">📚</div>
        <h3 className="text-lg font-semibold text-gray-800 mb-2">
          Albums intelligents
        </h3>
        <p className="text-gray-400 text-sm">
          Des albums générés automatiquement par date, lieu, personnes et événements.
        </p>
      </div>
    </div>
  )
}
