import React, { useEffect, useState } from 'react'
import { Shield, AlertTriangle, CheckCircle, RefreshCw, XCircle, Info } from 'lucide-react'
import type { SecurityReport } from '@shared/types'

export default function SecurityDashboard() {
  const [report, setReport] = useState<SecurityReport | null>(null)
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    // Build report via IPC
    const creds = await window.vaultAPI.getCredentials()
    // Client-side report building (matches server logic)
    const { analyzePassword } = await import('@shared/passwordStrength')
    const passwordMap = new Map<string, number[]>()
    for (const c of creds) {
      if (!c.password) continue
      if (!passwordMap.has(c.password)) passwordMap.set(c.password, [])
      passwordMap.get(c.password)!.push(c.id)
    }
    const reusedGroups = [...passwordMap.entries()]
      .filter(([, ids]) => ids.length > 1)
      .map(([password, ids]) => ({ password, ids }))
    const reusedIds = new Set(reusedGroups.flatMap(g => g.ids))
    let strong = 0, weak = 0, missing = 0
    for (const c of creds) {
      const { strength } = analyzePassword(c.password)
      if (strength === 'strong' || strength === 'very-strong') strong++
      else weak++
      if (!c.email && !c.username) missing++
    }
    const seen = new Set<string>(); let dupes = 0
    for (const c of creds) {
      const key = `${c.platformName.toLowerCase()}|${c.email.toLowerCase()}`
      if (seen.has(key)) dupes++
      else seen.add(key)
    }
    setReport({ total: creds.length, strong, weak, reused: reusedIds.size, duplicateAccounts: dupes, missingInfo: missing, reusedGroups })
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const score = report ? Math.round(
    report.total === 0 ? 0 :
    ((report.strong / report.total) * 60) +
    (report.reused === 0 ? 20 : 0) +
    (report.weak === 0 ? 20 : Math.max(0, 20 - (report.weak / report.total) * 20))
  ) : 0

  const scoreColor = score >= 80 ? 'text-green-400' : score >= 60 ? 'text-yellow-400' : 'text-red-400'
  const scoreLabel = score >= 80 ? 'Good' : score >= 60 ? 'Fair' : 'Needs Attention'

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Shield className="w-5 h-5 text-vault-400" />
          <h1 className="text-2xl font-bold text-white">Security Dashboard</h1>
        </div>
        <button className="btn-ghost text-sm flex items-center gap-1" onClick={load}>
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-6 h-6 border-2 border-vault-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : report ? (
        <>
          {/* Score */}
          <div className="card p-6 flex items-center gap-6">
            <div className="text-center">
              <div className={`text-5xl font-bold ${scoreColor}`}>{score}</div>
              <div className="text-xs text-slate-500 mt-1">/ 100</div>
            </div>
            <div>
              <p className={`text-lg font-semibold ${scoreColor}`}>{scoreLabel}</p>
              <p className="text-sm text-slate-400 mt-1">Based on password strength, uniqueness, and completeness.</p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[
              { icon: <CheckCircle className="w-5 h-5" />, label: 'Strong Passwords', value: report.strong, color: 'green' },
              { icon: <AlertTriangle className="w-5 h-5" />, label: 'Weak Passwords', value: report.weak, color: report.weak > 0 ? 'red' : 'green' },
              { icon: <RefreshCw className="w-5 h-5" />, label: 'Reused Passwords', value: report.reused, color: report.reused > 0 ? 'orange' : 'green' },
              { icon: <XCircle className="w-5 h-5" />, label: 'Duplicate Accounts', value: report.duplicateAccounts, color: report.duplicateAccounts > 0 ? 'orange' : 'green' },
              { icon: <Info className="w-5 h-5" />, label: 'Incomplete Records', value: report.missingInfo, color: report.missingInfo > 0 ? 'yellow' : 'green' },
              { icon: <Shield className="w-5 h-5" />, label: 'Total Accounts', value: report.total, color: 'vault' },
            ].map((s, i) => (
              <div key={i} className={`card p-4 border-${s.color}-500/20 bg-${s.color}-500/5`}>
                <div className={`text-${s.color}-400 mb-2`}>{s.icon}</div>
                <div className="text-2xl font-bold text-white">{s.value}</div>
                <div className="text-xs text-slate-500">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Reused password groups */}
          {report.reusedGroups.length > 0 && (
            <div className="card p-5">
              <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-orange-400" />
                Reused Passwords ({report.reusedGroups.length} groups)
              </h3>
              <div className="space-y-2">
                {report.reusedGroups.map((g, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-orange-500/5 border border-orange-500/15">
                    <RefreshCw className="w-4 h-4 text-orange-400 shrink-0" />
                    <span className="font-mono text-xs text-slate-300">{'•'.repeat(12)}</span>
                    <span className="ml-auto text-xs text-orange-300">Used in {g.ids.length} accounts</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="card p-4 border-blue-500/20 bg-blue-500/5">
            <p className="text-xs text-blue-300 leading-relaxed">
              <Info className="w-3.5 h-3.5 inline mr-1" />
              All security analysis runs locally on your device. No password data leaves your computer.
            </p>
          </div>
        </>
      ) : null}
    </div>
  )
}
