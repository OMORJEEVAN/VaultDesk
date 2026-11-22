// ============================================================
// VaultDesk – Preload Script
// ============================================================
// Exposes a typed, restricted API to the renderer via contextBridge.
// No Node.js APIs are directly exposed.
// Every method maps 1:1 to a validated IPC handler.
// ============================================================

import { contextBridge, ipcRenderer } from 'electron'
import type { VaultAPI } from '../shared/types'

const api: VaultAPI = {
  // Vault lifecycle
  getVaultStatus:    () => ipcRenderer.invoke('vault:getStatus'),
  setupVault:        (mp) => ipcRenderer.invoke('vault:setup', mp),
  unlockVault:       (mp) => ipcRenderer.invoke('vault:unlock', mp),
  lockVault:         ()  => ipcRenderer.invoke('vault:lock'),
  changeVaultLocation: (p) => ipcRenderer.invoke('vault:changeLocation', p),

  // Credentials
  getCredentials:    () => ipcRenderer.invoke('credentials:getAll'),
  addCredential:     (c) => ipcRenderer.invoke('credentials:add', c),
  updateCredential:  (c) => ipcRenderer.invoke('credentials:update', c),
  deleteCredential:  (id) => ipcRenderer.invoke('credentials:delete', id),
  toggleFavorite:    (id, v) => ipcRenderer.invoke('credentials:toggleFavorite', id, v),

  // Categories
  getCategories:     () => ipcRenderer.invoke('categories:getAll'),
  addCategory:       (n) => ipcRenderer.invoke('categories:add', n),
  deleteCategory:    (id) => ipcRenderer.invoke('categories:delete', id),

  // Backup
  exportBackup:      (p) => ipcRenderer.invoke('backup:export', p),
  importBackup:      (p, mp) => ipcRenderer.invoke('backup:import', p, mp),

  // Settings
  getSettings:       () => ipcRenderer.invoke('settings:get'),
  saveSettings:      (s) => ipcRenderer.invoke('settings:save', s),

  // Dialogs
  showSaveDialog:    (o) => ipcRenderer.invoke('dialog:save', o),
  showOpenDialog:    (o) => ipcRenderer.invoke('dialog:open', o),
  showDirectoryDialog: () => ipcRenderer.invoke('dialog:directory'),

  // Clipboard
  writeClipboard:    (t) => ipcRenderer.invoke('clipboard:write', t),

  // Password generator
  generatePassword:  (opts) => ipcRenderer.invoke('password:generate', opts),

  // Events: main → renderer
  onLockVault: (cb) => {
    const handler = () => cb()
    ipcRenderer.on('vault:locked', handler)
    return () => ipcRenderer.off('vault:locked', handler)
  },
  onActivityReset: (cb) => {
    const handler = () => cb()
    ipcRenderer.on('activity:reset', handler)
    return () => ipcRenderer.off('activity:reset', handler)
  }
}

contextBridge.exposeInMainWorld('vaultAPI', api)

// Type augmentation for renderer
export type { VaultAPI }
