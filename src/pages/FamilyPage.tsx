import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Copy, Check, Users, Link, Crown, Baby, UserCheck } from 'lucide-react'
import { api } from '@/lib/api'
import { useAuthStore } from '@/store/auth'

interface Member {
  id: string
  userId: string
  role: 'parent' | 'child' | 'guest'
  displayName: string
  joinedAt: string
}

interface Invitation {
  id: string
  code: string
  role: 'parent' | 'child' | 'guest'
  createdAt: string
  expiresAt: string
  usedAt?: string
}

const ROLE_LABELS: Record<string, { label: string; icon: typeof Crown }> = {
  parent: { label: 'Parent', icon: Crown },
  child: { label: 'Enfant', icon: Baby },
  guest: { label: 'Invité', icon: UserCheck },
}

const ROLE_OPTIONS = [
  { value: 'parent', label: 'Parent' },
  { value: 'child', label: 'Enfant' },
  { value: 'guest', label: 'Invité (lecture seule)' },
]

export function FamilyPage() {
  const familyId = useAuthStore((s) => s.familyId)
  const queryClient = useQueryClient()
  const [selectedRole, setSelectedRole] = useState<'parent' | 'child' | 'guest'>('child')
  const [copiedCode, setCopiedCode] = useState<string | null>(null)

  const { data: membersData } = useQuery<{ members: Member[] }>({
    queryKey: ['family-members', familyId],
    queryFn: () => api.get(`/families/${familyId}/members`),
    enabled: !!familyId,
  })

  const { data: invitationsData } = useQuery<{ invitations: Invitation[] }>({
    queryKey: ['family-invitations', familyId],
    queryFn: () => api.get(`/families/${familyId}/invitations`),
    enabled: !!familyId,
  })

  const generateInvite = useMutation({
    mutationFn: (role: string) =>
      api.post<Invitation>(`/families/${familyId}/invite`, { role }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['family-invitations', familyId] }),
  })

  const members = membersData?.members ?? []
  const invitations = (invitationsData?.invitations ?? []).filter((i) => !i.usedAt && new Date(i.expiresAt) > new Date())

  function inviteLink(code: string) {
    return `${window.location.origin}/join?code=${code}`
  }

  async function copyLink(code: string) {
    await navigator.clipboard.writeText(inviteLink(code))
    setCopiedCode(code)
    setTimeout(() => setCopiedCode(null), 2000)
  }

  return (
    <div className="p-6 max-w-2xl mx-auto pb-24">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Ma famille</h2>

      {/* Members */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden mb-5">
        <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-50">
          <Users size={18} className="text-violet-500" />
          <span className="font-semibold text-gray-800">Membres</span>
          <span className="ml-auto text-xs text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full">
            {members.length}
          </span>
        </div>
        <div className="divide-y divide-gray-50">
          {members.map((m) => {
            const roleInfo = ROLE_LABELS[m.role]
            const Icon = roleInfo.icon
            return (
              <div key={m.id} className="flex items-center gap-3 px-5 py-3">
                <div className="w-9 h-9 rounded-full bg-violet-100 flex items-center justify-center text-violet-700 font-semibold text-sm shrink-0">
                  {m.displayName[0]?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-800 text-sm truncate">{m.displayName}</p>
                </div>
                <div className="flex items-center gap-1 text-xs text-gray-400">
                  <Icon size={12} />
                  {roleInfo.label}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Generate invite */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden mb-5">
        <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-50">
          <Link size={18} className="text-violet-500" />
          <span className="font-semibold text-gray-800">Inviter un membre</span>
        </div>
        <div className="px-5 py-4 flex items-end gap-3">
          <div className="flex-1">
            <label className="text-xs text-gray-500 mb-1.5 block">Rôle</label>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value as typeof selectedRole)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300"
            >
              {ROLE_OPTIONS.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>
          <button
            onClick={() => generateInvite.mutate(selectedRole)}
            disabled={generateInvite.isPending}
            className="bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors"
          >
            Générer un lien
          </button>
        </div>
      </div>

      {/* Active invitations */}
      {invitations.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-50">
            <span className="font-semibold text-gray-800">Liens à envoyer</span>
          </div>
          <p className="px-5 pt-3 text-xs text-gray-400">
            Copie le lien et envoie-le par WhatsApp, SMS ou email. La personne clique dessus, crée un compte et rejoint automatiquement ta famille.
          </p>
          <div className="divide-y divide-gray-50 mt-3">
            {invitations.map((inv) => (
              <div key={inv.id} className="px-5 py-3 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-400">
                    {ROLE_LABELS[inv.role]?.label} · expire le {new Date(inv.expiresAt).toLocaleDateString('fr-FR')}
                  </p>
                  <p className="text-xs text-gray-300 truncate mt-0.5">{inviteLink(inv.code)}</p>
                </div>
                <button
                  onClick={() => copyLink(inv.code)}
                  className="flex items-center gap-1.5 text-xs text-violet-600 hover:text-violet-800 transition-colors px-3 py-1.5 rounded-lg border border-violet-200 hover:border-violet-400 shrink-0"
                >
                  {copiedCode === inv.code ? <Check size={13} /> : <Copy size={13} />}
                  {copiedCode === inv.code ? 'Copié !' : 'Copier'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
