import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { api } from '@/lib/api'
import { useAuthStore } from '@/store/auth'

export function JoinPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const code = searchParams.get('code') ?? ''
  const { user, setFamilyId } = useAuthStore()

  const [status, setStatus] = useState<'idle' | 'joining' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const [familyName, setFamilyName] = useState('')

  // Auto-join on load if logged in and code is present
  useEffect(() => {
    if (user && code) join()
  }, [])

  async function join() {
    if (!code) return
    setStatus('joining')
    setErrorMsg('')
    try {
      const family = await api.post<{ id: string; name: string }>('/families/join', { code })
      setFamilyName(family.name)
      setFamilyId(family.id)
      setStatus('success')
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Erreur inconnue'
      setErrorMsg(msg.includes('already') ? 'Vous êtes déjà membre de cette famille.' : 'Lien invalide ou expiré.')
      setStatus('error')
    }
  }

  if (!code) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
        <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center max-w-sm w-full">
          <p className="text-gray-500">Lien d'invitation invalide.</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
        <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center max-w-sm w-full shadow-sm">
          <h1 className="text-2xl font-bold text-violet-600 mb-1">Nestory</h1>
          <p className="text-gray-400 text-sm mb-6">Journal de famille</p>
          <p className="text-gray-700 font-medium mb-6">Vous avez été invité à rejoindre une famille !</p>
          <button
            onClick={() => navigate(`/register?redirect=/join?code=${code}`)}
            className="w-full bg-violet-600 hover:bg-violet-700 text-white font-medium py-3 rounded-xl text-sm mb-3"
          >
            Créer un compte
          </button>
          <button
            onClick={() => navigate(`/login?redirect=/join?code=${code}`)}
            className="w-full border border-gray-200 text-gray-600 hover:bg-gray-50 font-medium py-3 rounded-xl text-sm"
          >
            Se connecter
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center max-w-sm w-full shadow-sm">
        {status === 'joining' && (
          <>
            <div className="text-4xl mb-4 animate-bounce">🏠</div>
            <p className="text-gray-700 font-medium">Rejoindre la famille…</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="text-4xl mb-4">🎉</div>
            <h2 className="text-xl font-bold text-gray-900 mb-1">Bienvenue !</h2>
            <p className="text-gray-500 text-sm mb-6">Vous avez rejoint <strong>{familyName}</strong>.</p>
            <button
              onClick={() => navigate('/')}
              className="w-full bg-violet-600 hover:bg-violet-700 text-white font-medium py-3 rounded-xl text-sm"
            >
              Accéder à la famille
            </button>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="text-4xl mb-4">😕</div>
            <p className="text-gray-700 font-medium mb-2">{errorMsg}</p>
            {errorMsg.includes('déjà') && (
              <button
                onClick={() => navigate('/')}
                className="mt-4 w-full bg-violet-600 hover:bg-violet-700 text-white font-medium py-3 rounded-xl text-sm"
              >
                Aller à l'accueil
              </button>
            )}
          </>
        )}

        {status === 'idle' && (
          <>
            <div className="text-4xl mb-4">🏠</div>
            <p className="text-gray-700 font-medium mb-6">Rejoindre la famille avec le code <strong>{code}</strong> ?</p>
            <button
              onClick={join}
              className="w-full bg-violet-600 hover:bg-violet-700 text-white font-medium py-3 rounded-xl text-sm"
            >
              Rejoindre
            </button>
          </>
        )}
      </div>
    </div>
  )
}
