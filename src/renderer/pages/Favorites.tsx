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
    <div className="space-y-4 max-w-5xl">
      <div className="flex items-center gap-3">
        <Heart className="w-5 h-5 text-red-400 fill-red-400" />
        <h1 className="text-2xl font-bold text-white">Favorites</h1>
      </div>
      {creds.length === 0 ? (
        <div className="card p-12 text-center text-slate-600">
          <Heart className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No favorites yet. Star a password to add it here.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {creds.map(cred => (
            <div key={cred.id} className="card p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-red-500/15 flex items-center justify-center text-red-400 font-bold shrink-0">
                {cred.platformName.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-white text-sm truncate">{cred.platformName}</p>
                <p className="text-xs text-slate-500 truncate">{cred.email || cred.username || '—'}</p>
              </div>
              <Heart className="w-4 h-4 text-red-400 fill-red-400 shrink-0" />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
