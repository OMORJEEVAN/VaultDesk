import React from 'react'
import { AlertTriangle, X } from 'lucide-react'

interface Props {
  open: boolean
  title: string
  message: string
  confirmLabel?: string
  onConfirm: () => void
  onCancel: () => void
  danger?: boolean
}

export default function ConfirmDialog({ open, title, message, confirmLabel = 'Confirm', onConfirm, onCancel, danger }: Props) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-sm bg-[#1e2329] rounded-xl border border-[#2b3139] shadow-card-dark p-6 space-y-4">
        <div className="flex items-start gap-3">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${danger ? 'bg-[#f6465d]/15' : 'bg-[#fcd535]/15'}`}>
            <AlertTriangle className={`w-5 h-5 ${danger ? 'text-[#f6465d]' : 'text-[#fcd535]'}`} />
          </div>
          <div>
            <h3 className="font-semibold text-white text-sm">{title}</h3>
            <p className="text-xs text-[#707a8a] mt-1 leading-relaxed">{message}</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button className="btn-ghost flex-1 text-sm" onClick={onCancel}>Cancel</button>
          <button
            className={`flex-1 text-sm ${danger ? 'btn-danger font-semibold' : 'btn-primary font-semibold'}`}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
