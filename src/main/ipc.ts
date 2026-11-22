// ============================================================
// VaultDesk – IPC Handlers
// ============================================================
// All sensitive operations are handled in the main process.
// Inputs are validated before use.
// No sensitive data is ever returned in error messages.
// ============================================================

import { ipcMain, clipboard, dialog, app } from 'electron'
import path from 'path'
import fs from 'fs'
import {
  getVaultStatus, setupVault, unlockVault, lockVault,
  getCredentials, addCredential, updateCredential, deleteCredential, toggleFavorite,
  buildSecurityReport
} from './vaultService'
import {
  getAllCategories, insertCategory, deleteCategoryById,
  backupDatabase, replaceDatabase, getDatabasePath, initDatabase
} from './database'
import { generatePassword, analyzePassword } from '../security/passwordGenerator'
import { getSettings, saveSettings } from './settingsService'
import {
  validateMasterPassword, validateCredential, validateCategoryName,
  sanitizeString, sanitizeNumber, sanitizeBoolean
} from '../shared/validation'
import type { NewCredential, UpdateCredential, GeneratorOptions, AppSettings } from '../shared/types'

export function registerIpcHandlers(): void {

  // ----------------------------------------------------------------
  // Vault lifecycle
  // ----------------------------------------------------------------

  ipcMain.handle('vault:getStatus', async () => {
    return getVaultStatus()
  })

  ipcMain.handle('vault:setup', async (_e, masterPassword: unknown) => {
    const mp = sanitizeString(masterPassword, 1000)
    const validation = validateMasterPassword(mp)
    if (!validation.valid) return { success: false, error: validation.errors.join(' ') }
    try {
      await setupVault(mp)
      return { success: true }
    } catch (err) {
      return { success: false, error: 'Failed to set up vault.' }
    }
  })

  ipcMain.handle('vault:unlock', async (_e, masterPassword: unknown) => {
    const mp = sanitizeString(masterPassword, 1000)
    if (!mp) return { success: false, error: 'Master password is required.' }
    try {
      const ok = await unlockVault(mp)
      return { success: ok, error: ok ? undefined : 'Incorrect master password.' }
    } catch (err) {
      return { success: false, error: 'Failed to unlock vault.' }
    }
  })

  ipcMain.handle('vault:lock', async () => {
    lockVault()
  })

  ipcMain.handle('vault:changeLocation', async (_e, newDirPath: unknown) => {
    try {
      const dirPath = sanitizeString(newDirPath, 1000)
      if (!dirPath || !fs.existsSync(dirPath)) return { success: false, error: 'Invalid directory.' }
      try {
        const currentDbPath = getDatabasePath()
        const newDbPath = path.join(dirPath, 'vaultdesk.db')
        lockVault()
        fs.copyFileSync(currentDbPath, newDbPath)
        await saveSettings({ vaultPath: dirPath })
        await initDatabase(dirPath)
        return { success: true }
      } catch {
        return { success: false, error: 'Failed to move vault.' }
      }
    } catch {
      return { success: false, error: 'Invalid request.' }
    }
  })

  // ----------------------------------------------------------------
  // Credentials
  // ----------------------------------------------------------------

  ipcMain.handle('credentials:getAll', async () => {
    try {
      return getCredentials()
    } catch {
      return []
    }
  })

  ipcMain.handle('credentials:add', async (_e, cred: unknown) => {
    try {
      const c = cred as Record<string, unknown>
      const validation = validateCredential(c)
      if (!validation.valid) return { success: false, error: validation.errors.join(' ') }

      const newCred: NewCredential = {
        platformName: sanitizeString(c.platformName, 200),
        websiteUrl:   sanitizeString(c.websiteUrl, 2000),
        email:        sanitizeString(c.email, 500),
        username:     sanitizeString(c.username, 200),
        password:     sanitizeString(c.password, 10_000),
        category:     sanitizeString(c.category, 100),
        tags:         Array.isArray(c.tags) ? (c.tags as unknown[]).map(t => sanitizeString(t, 50)).slice(0, 20) : [],
        notes:        sanitizeString(c.notes, 10_000),
        isFavorite:   sanitizeBoolean(c.isFavorite)
      }
      const id = addCredential(newCred)
      return { success: true, id }
    } catch (err) {
      return { success: false, error: 'Failed to add credential.' }
    }
  })

  ipcMain.handle('credentials:update', async (_e, cred: unknown) => {
    try {
      const c = cred as Record<string, unknown>
      const id = sanitizeNumber(c.id, 1, Number.MAX_SAFE_INTEGER)
      const update: UpdateCredential = { id }
      if (c.platformName !== undefined) update.platformName = sanitizeString(c.platformName, 200)
      if (c.websiteUrl   !== undefined) update.websiteUrl   = sanitizeString(c.websiteUrl, 2000)
      if (c.email        !== undefined) update.email        = sanitizeString(c.email, 500)
      if (c.username     !== undefined) update.username     = sanitizeString(c.username, 200)
      if (c.password     !== undefined) update.password     = sanitizeString(c.password, 10_000)
      if (c.category     !== undefined) update.category     = sanitizeString(c.category, 100)
      if (c.tags         !== undefined) update.tags         = Array.isArray(c.tags) ? (c.tags as unknown[]).map(t => sanitizeString(t, 50)).slice(0, 20) : []
      if (c.notes        !== undefined) update.notes        = sanitizeString(c.notes, 10_000)
      if (c.isFavorite   !== undefined) update.isFavorite   = sanitizeBoolean(c.isFavorite)
      updateCredential(update)
      return { success: true }
    } catch {
      return { success: false, error: 'Failed to update credential.' }
    }
  })

  ipcMain.handle('credentials:delete', async (_e, id: unknown) => {
    try {
      const credId = sanitizeNumber(id, 1, Number.MAX_SAFE_INTEGER)
      deleteCredential(credId)
      return { success: true }
    } catch {
      return { success: false, error: 'Failed to delete credential.' }
    }
  })

  ipcMain.handle('credentials:toggleFavorite', async (_e, id: unknown, value: unknown) => {
    try {
      toggleFavorite(sanitizeNumber(id, 1, Number.MAX_SAFE_INTEGER), sanitizeBoolean(value))
      return { success: true }
    } catch {
      return { success: false, error: 'Failed to update favorite.' }
    }
  })

  // ----------------------------------------------------------------
  // Categories
  // ----------------------------------------------------------------

  ipcMain.handle('categories:getAll', async () => {
    return getAllCategories()
  })

  ipcMain.handle('categories:add', async (_e, name: unknown) => {
    try {
      const n = sanitizeString(name, 100)
      const v = validateCategoryName(n)
      if (!v.valid) return { success: false, error: v.errors.join(' ') }
      const id = insertCategory(n.trim())
      return { success: true, id }
    } catch {
      return { success: false, error: 'Failed to add category (may already exist).' }
    }
  })

  ipcMain.handle('categories:delete', async (_e, id: unknown) => {
    try {
      deleteCategoryById(sanitizeNumber(id, 1, Number.MAX_SAFE_INTEGER))
      return { success: true }
    } catch {
      return { success: false, error: 'Failed to delete category.' }
    }
  })

  // ----------------------------------------------------------------
  // Security report
  // ----------------------------------------------------------------

  ipcMain.handle('security:getReport', async () => {
    try {
      return buildSecurityReport()
    } catch {
      return null
    }
  })

  // ----------------------------------------------------------------
  // Password generator & analyzer
  // ----------------------------------------------------------------

  ipcMain.handle('password:generate', async (_e, options: unknown) => {
    try {
      const opts = options as GeneratorOptions
      return { success: true, password: generatePassword(opts) }
    } catch (err) {
      return { success: false, error: (err as Error).message }
    }
  })

  ipcMain.handle('password:analyze', async (_e, password: unknown) => {
    const pw = sanitizeString(password, 10_000)
    return analyzePassword(pw)
  })

  // ----------------------------------------------------------------
  // Backup / Restore
  // ----------------------------------------------------------------

  ipcMain.handle('backup:export', async (_e, destPath: unknown) => {
    try {
      const dest = sanitizeString(destPath, 2000)
      if (!dest) return { success: false, error: 'Invalid destination path.' }
      backupDatabase(dest)
      return { success: true }
    } catch {
      return { success: false, error: 'Backup failed.' }
    }
  })

  ipcMain.handle('backup:import', async (_e, srcPath: unknown, masterPassword: unknown) => {
    const src = sanitizeString(srcPath, 2000)
    const mp  = sanitizeString(masterPassword, 1000)
    if (!src || !mp) return { success: false, error: 'Invalid parameters.' }
    try {
      replaceDatabase(src)
      const ok = await unlockVault(mp)
      return { success: ok, error: ok ? undefined : 'Wrong master password for the imported vault.' }
    } catch {
      return { success: false, error: 'Restore failed.' }
    }
  })

  // ----------------------------------------------------------------
  // Settings
  // ----------------------------------------------------------------

  ipcMain.handle('settings:get', async () => {
    return getSettings()
  })

  ipcMain.handle('settings:save', async (_e, settings: unknown) => {
    await saveSettings(settings as Partial<AppSettings>)
  })

  // ----------------------------------------------------------------
  // Dialogs
  // ----------------------------------------------------------------

  ipcMain.handle('dialog:save', async (_e, options: unknown) => {
    const result = await dialog.showSaveDialog(options as Electron.SaveDialogOptions)
    return result.canceled ? undefined : result.filePath
  })

  ipcMain.handle('dialog:open', async (_e, options: unknown) => {
    const result = await dialog.showOpenDialog(options as Electron.OpenDialogOptions)
    return result.canceled ? undefined : result.filePaths
  })

  ipcMain.handle('dialog:directory', async () => {
    const result = await dialog.showOpenDialog({ properties: ['openDirectory'] })
    return result.canceled ? undefined : result.filePaths[0]
  })

  // ----------------------------------------------------------------
  // Clipboard
  // ----------------------------------------------------------------

  ipcMain.handle('clipboard:write', async (_e, text: unknown) => {
    const t = sanitizeString(text, 100_000)
    clipboard.writeText(t)
  })
}
