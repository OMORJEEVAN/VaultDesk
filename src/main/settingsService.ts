// ============================================================
// VaultDesk – Settings Service
// ============================================================

import { app } from 'electron'
import path from 'path'
import fs from 'fs'
import type { AppSettings } from '../shared/types'
import { DEFAULT_SETTINGS } from '../shared/types'

function getSettingsPath(): string {
  return path.join(app.getPath('userData'), 'settings.json')
}

export function getSettings(): AppSettings {
  try {
    const raw = fs.readFileSync(getSettingsPath(), 'utf8')
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) }
  } catch {
    return { ...DEFAULT_SETTINGS }
  }
}

export async function saveSettings(partial: Partial<AppSettings>): Promise<void> {
  const current = getSettings()
  const updated = { ...current, ...partial }
  fs.writeFileSync(getSettingsPath(), JSON.stringify(updated, null, 2), 'utf8')
}
