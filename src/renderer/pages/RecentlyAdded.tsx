import React, { useEffect, useState } from 'react'
import { Clock } from 'lucide-react'
import type { Credential } from '@shared/types'

export default function RecentlyAdded() {
  const [creds, setCreds] = useState<Credential[]>([])

  useEffect(() => {
    window.vaultAPI.getCredentials()
      .then(all => setCreds([...all].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 50)))
      .catch(() => {})
  }, [])

  return (
    <div className="space-y-4 max-w-3xl">
      <div className="flex items-center gap-3">
        <Clock className="w-5 h-5 text-[#fcd535]" />
        <h1 className="text-2xl font-bold text-white">Recently Added</h1>
      </div>
      {creds.length === 0 ? (
        <div className="card p-12 text-center text-[#707a8a]">
          <Clock className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No passwords yet.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {creds.map(cred => (
            <div key={cred.id} className="card p-4 flex items-center gap-4 hover:border-[#363d47] transition-all duration-150">
              <div className="w-10 h-10 rounded-lg bg-[#fcd535]/15 flex items-center justify-center text-[#fcd535] font-bold shrink-0 font-mono">
                {cred.platformName.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-white text-sm truncate">{cred.platformName}</p>
                <p className="text-xs text-[#707a8a] truncate">{cred.email || cred.username || '—'}</p>
              </div>
              <span className="text-xs text-[#707a8a] shrink-0 font-mono">{new Date(cred.createdAt).toLocaleDateString()}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
