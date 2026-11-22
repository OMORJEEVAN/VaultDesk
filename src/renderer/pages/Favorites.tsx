import React, { useEffect, useState } from 'react'
import { Heart, KeyRound } from 'lucide-react'
import type { Credential } from '@shared/types'

export default function Favorites() {
  const [creds, setCreds] = useState<Credential[]>([])

  useEffect(() => {
    window.vaultAPI.getCredentials()
      .then(all => setCreds(all.filter(c => c.isFavorite)))
      .catch(() => {})
  }, [])

  return (
    <div className="space-y-4 w-full">
      <div className="flex items-center gap-3">
        <Heart className="w-5 h-5 text-[#f6465d] fill-[#f6465d]" />
        <h1 className="text-2xl font-bold text-[#181a20] dark:text-white">Favorites</h1>
      </div>
      {creds.length === 0 ? (
        <div className="card p-12 text-center text-[#707a8a]">
          <Heart className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No favorites yet. Star a password to add it here.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {creds.map(cred => (
            <div key={cred.id} className="card p-4 flex items-center gap-4 hover:border-[#cdd1d6] dark:hover:border-[#363d47] transition-all duration-150">
              <div className="w-10 h-10 rounded-lg bg-[#f6465d]/15 flex items-center justify-center text-[#f6465d] font-bold shrink-0 font-mono">
                {cred.platformName.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-[#181a20] dark:text-white text-sm truncate">{cred.platformName}</p>
                <p className="text-xs text-[#707a8a] truncate">{cred.email || cred.username || '—'}</p>
              </div>
              <Heart className="w-4 h-4 text-[#f6465d] fill-[#f6465d] shrink-0" />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
