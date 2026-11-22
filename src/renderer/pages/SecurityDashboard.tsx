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

  const scoreColor = score >= 80 ? 'text-[#0ecb81]' : score >= 60 ? 'text-[#fcd535]' : 'text-[#f6465d]'
  const scoreLabel = score >= 80 ? 'Good' : score >= 60 ? 'Fair' : 'Needs Attention'

  return (
    <div className="space-y-6 w-full">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Shield className="w-5 h-5 text-[#fcd535]" />
          <h1 className="text-2xl font-bold text-white">Security Dashboard</h1>
        </div>
        <button className="btn-ghost text-sm flex items-center gap-1.5" onClick={load}>
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-6 h-6 border-2 border-[#fcd535] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : report ? (
        <>
          {/* Score */}
          <div className="card p-6 flex items-center gap-6">
            <div className="text-center">
              <div className={`text-5xl font-bold font-mono ${scoreColor}`}>{score}</div>
              <div className="text-xs text-[#707a8a] mt-1">/ 100</div>
            </div>
            <div>
              <p className={`text-lg font-semibold ${scoreColor}`}>{scoreLabel}</p>
              <p className="text-sm text-[#707a8a] mt-1">Based on password strength, uniqueness, and completeness.</p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[
              { icon: <CheckCircle className="w-5 h-5" />, label: 'Strong Passwords', value: report.strong, iconColor: 'text-[#0ecb81]', cardBorder: 'border-[#0ecb81]/30 bg-[#0ecb81]/5' },
              { icon: <AlertTriangle className="w-5 h-5" />, label: 'Weak Passwords', value: report.weak, iconColor: report.weak > 0 ? 'text-[#f6465d]' : 'text-[#0ecb81]', cardBorder: report.weak > 0 ? 'border-[#f6465d]/30 bg-[#f6465d]/5' : 'border-[#0ecb81]/30 bg-[#0ecb81]/5' },
              { icon: <RefreshCw className="w-5 h-5" />, label: 'Reused Passwords', value: report.reused, iconColor: report.reused > 0 ? 'text-[#f6465d]' : 'text-[#0ecb81]', cardBorder: report.reused > 0 ? 'border-[#f6465d]/30 bg-[#f6465d]/5' : 'border-[#0ecb81]/30 bg-[#0ecb81]/5' },
              { icon: <XCircle className="w-5 h-5" />, label: 'Duplicate Accounts', value: report.duplicateAccounts, iconColor: report.duplicateAccounts > 0 ? 'text-[#f6465d]' : 'text-[#0ecb81]', cardBorder: report.duplicateAccounts > 0 ? 'border-[#f6465d]/30 bg-[#f6465d]/5' : 'border-[#0ecb81]/30 bg-[#0ecb81]/5' },
              { icon: <Info className="w-5 h-5" />, label: 'Incomplete Records', value: report.missingInfo, iconColor: report.missingInfo > 0 ? 'text-[#fcd535]' : 'text-[#0ecb81]', cardBorder: report.missingInfo > 0 ? 'border-[#fcd535]/30 bg-[#fcd535]/5' : 'border-[#0ecb81]/30 bg-[#0ecb81]/5' },
              { icon: <Shield className="w-5 h-5" />, label: 'Total Accounts', value: report.total, iconColor: 'text-[#fcd535]', cardBorder: 'border-[#eaecef] dark:border-[#2b3139] bg-white dark:bg-[#1e2329]' },
            ].map((s, i) => (
              <div key={i} className={`card p-4 ${s.cardBorder}`}>
                <div className={`${s.iconColor} mb-2`}>{s.icon}</div>
                <div className="text-2xl font-bold font-mono text-[#181a20] dark:text-white">{s.value}</div>
                <div className="text-xs text-[#707a8a] mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Reused password groups */}
          {report.reusedGroups.length > 0 && (
            <div className="card p-5">
              <h3 className="font-semibold text-[#181a20] dark:text-white mb-3 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-[#f6465d]" />
                Reused Passwords ({report.reusedGroups.length} groups)
              </h3>
              <div className="space-y-2">
                {report.reusedGroups.map((g, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-[#f6465d]/5 border border-[#f6465d]/20">
                    <RefreshCw className="w-4 h-4 text-[#f6465d] shrink-0" />
                    <span className="font-mono text-xs text-[#181a20] dark:text-white">{'•'.repeat(12)}</span>
                    <span className="ml-auto text-xs text-[#f6465d] font-medium">Used in {g.ids.length} accounts</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="card p-4 border-[#eaecef] dark:border-[#2b3139] bg-[#fafafa] dark:bg-[#1e2329]">
            <p className="text-xs text-[#707a8a] leading-relaxed">
              <Info className="w-3.5 h-3.5 inline mr-1 text-[#fcd535]" />
              All security analysis runs locally on your device. No password data leaves your computer.
            </p>
          </div>
        </>
      ) : null}
    </div>
  )
}
