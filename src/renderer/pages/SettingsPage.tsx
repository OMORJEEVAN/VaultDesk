import React, { useEffect, useState } from 'react'
import { Settings, Moon, Sun, Shield, Download, Upload, FolderOpen, Lock, Trash2, AlertTriangle } from 'lucide-react'
import type { AppSettings } from '@shared/types'
import ConfirmDialog from '../components/ConfirmDialog'

interface Props {
  theme: 'dark' | 'light'
  onToggleTheme: () => void
  onLock: () => void
}

export default function SettingsPage({ theme, onToggleTheme, onLock }: Props) {
  const [settings, setSettings]   = useState<AppSettings | null>(null)
  const [saved, setSaved]         = useState(false)
  const [deleteVault, setDeleteVault] = useState(false)
  const [deletePw, setDeletePw]   = useState('')
  const [deleteErr, setDeleteErr] = useState('')

  useEffect(() => {
    window.vaultAPI.getSettings().then(setSettings)
  }, [])

  const save = async (patch: Partial<AppSettings>) => {
    if (!settings) return
    const updated = { ...settings, ...patch }
    setSettings(updated)
    await window.vaultAPI.saveSettings(patch)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleExportBackup = async () => {
    const path = await window.vaultAPI.showSaveDialog({
      title: 'Export Encrypted Backup',
      defaultPath: `vaultdesk-backup-${Date.now()}.db`,
      filters: [{ name: 'VaultDesk Backup', extensions: ['db'] }]
    })
    if (!path) return
    const r = await window.vaultAPI.exportBackup(path)
    alert(r.success ? 'Backup exported successfully.' : `Backup failed: ${r.error}`)
  }

  const handleImportBackup = async () => {
    const paths = await window.vaultAPI.showOpenDialog({
      title: 'Import Encrypted Backup',
      filters: [{ name: 'VaultDesk Backup', extensions: ['db'] }],
      properties: ['openFile']
    })
    if (!paths?.[0]) return
    const mp = prompt('Enter the master password for this backup:')
    if (!mp) return
    const r = await window.vaultAPI.importBackup(paths[0], mp)
    alert(r.success ? 'Backup restored. Please restart to apply changes.' : `Restore failed: ${r.error}`)
  }

  const handleChangeLocation = async () => {
    const dir = await window.vaultAPI.showDirectoryDialog()
    if (!dir) return
    const r = await window.vaultAPI.changeVaultLocation(dir)
    if (r.success) { alert('Vault location changed. Please restart the app.') }
    else alert(`Failed: ${r.error}`)
  }

  if (!settings) return null

  return (
    <div className="space-y-6 w-full">
      <div className="flex items-center gap-3">
        <Settings className="w-5 h-5 text-[#d9a206] dark:text-[#fcd535]" />
        <h1 className="text-2xl font-bold text-[#181a20] dark:text-white">Settings</h1>
        {saved && <span className="text-xs text-[#0ecb81] ml-auto animate-fade-in font-medium">✓ Saved</span>}
      </div>

      {/* Appearance */}
      <div className="card p-5 space-y-4">
        <h2 className="font-semibold text-[#181a20] dark:text-white text-sm">Appearance</h2>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-[#181a20] dark:text-white">Theme</p>
            <p className="text-xs text-[#707a8a]">Switch between dark and light mode</p>
          </div>
          <button
            className="btn-ghost flex items-center gap-2 px-3 py-1.5 text-sm"
            onClick={onToggleTheme}
          >
            {theme === 'dark' ? <Moon className="w-4 h-4 text-[#d9a206] dark:text-[#fcd535]" /> : <Sun className="w-4 h-4 text-[#d9a206] dark:text-[#fcd535]" />}
            {theme === 'dark' ? 'Dark' : 'Light'}
          </button>
        </div>
      </div>

      {/* Security */}
      <div className="card p-5 space-y-4">
        <h2 className="font-semibold text-[#181a20] dark:text-white text-sm">Security</h2>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-[#181a20] dark:text-white">Auto-lock after inactivity</p>
            <p className="text-xs text-[#707a8a]">Lock the vault after this many minutes of inactivity (0 = disabled)</p>
          </div>
          <select
            className="input w-32 h-9 text-sm"
            value={settings.autoLockMinutes}
            onChange={e => save({ autoLockMinutes: Number(e.target.value) })}
          >
            <option value={0}>Disabled</option>
            <option value={1}>1 minute</option>
            <option value={5}>5 minutes</option>
            <option value={10}>10 minutes</option>
            <option value={15}>15 minutes</option>
            <option value={30}>30 minutes</option>
            <option value={60}>1 hour</option>
          </select>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-[#181a20] dark:text-white">Clipboard clear delay</p>
            <p className="text-xs text-[#707a8a]">Clear copied password from clipboard after this many seconds</p>
          </div>
          <select
            className="input w-32 h-9 text-sm"
            value={settings.clipboardClearSeconds}
            onChange={e => save({ clipboardClearSeconds: Number(e.target.value) })}
          >
            <option value={0}>Disabled</option>
            <option value={15}>15 seconds</option>
            <option value={30}>30 seconds</option>
            <option value={60}>1 minute</option>
          </select>
        </div>
        <button className="btn-ghost text-sm flex items-center gap-2" onClick={onLock}>
          <Lock className="w-4 h-4 text-[#f6465d]" /> Lock Vault Now
        </button>
      </div>

      {/* Backup & Restore */}
      <div className="card p-5 space-y-3">
        <h2 className="font-semibold text-[#181a20] dark:text-white text-sm">Backup & Restore</h2>
        <p className="text-xs text-[#707a8a]">Backups are always encrypted. The vault file can only be opened with the correct master password.</p>
        <div className="flex gap-3">
          <button className="btn-ghost text-sm flex items-center gap-2 flex-1 justify-center" onClick={handleExportBackup}>
            <Download className="w-4 h-4" /> Export Backup
          </button>
          <button className="btn-ghost text-sm flex items-center gap-2 flex-1 justify-center" onClick={handleImportBackup}>
            <Upload className="w-4 h-4" /> Import Backup
          </button>
        </div>
      </div>

      {/* Vault location */}
      <div className="card p-5 space-y-3">
        <h2 className="font-semibold text-[#181a20] dark:text-white text-sm">Vault Storage Location</h2>
        <p className="text-xs text-[#181a20] dark:text-white font-mono bg-[#f5f5f5] dark:bg-[#0b0e11] border border-[#eaecef] dark:border-[#2b3139] p-2.5 rounded-lg">
          {settings.vaultPath || '(default: app data directory)'}
        </p>
        <button className="btn-ghost text-sm flex items-center gap-2" onClick={handleChangeLocation}>
          <FolderOpen className="w-4 h-4" /> Change Vault Location
        </button>
      </div>

      {/* Danger zone */}
      <div className="card p-5 space-y-3 border-[#f6465d]/20 bg-[#f6465d]/5">
        <h2 className="font-semibold text-[#f6465d] text-sm flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" /> Danger Zone
        </h2>
        <p className="text-xs text-[#707a8a]">
          Deleting vault data is permanent and cannot be undone. Normal file deletion on SSDs may not be forensically irrecoverable.
        </p>
        <button className="btn-danger text-sm flex items-center gap-2" onClick={() => setDeleteVault(true)}>
          <Trash2 className="w-4 h-4" /> Delete All Vault Data
        </button>
      </div>

      <ConfirmDialog
        open={deleteVault}
        title="Delete Vault Data"
        message="This will permanently delete all your stored passwords. This action CANNOT be undone. Are you absolutely sure?"
        confirmLabel="Delete Everything"
        onConfirm={() => { alert('Not implemented in this build for safety.'); setDeleteVault(false) }}
        onCancel={() => setDeleteVault(false)}
        danger
      />
    </div>
  )
}
