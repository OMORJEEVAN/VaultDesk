// ============================================================
// VaultDesk – Electron Main Entry Point
// ============================================================

import { app, BrowserWindow, shell, ipcMain, nativeTheme } from 'electron'
import { join } from 'path'
import fs from 'fs'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import { initDatabase } from './database'
import { registerIpcHandlers } from './ipc'
import { getSettings } from './settingsService'
import { lockVault, getVaultStatus } from './vaultService'

let mainWindow: BrowserWindow | null = null
let inactivityTimer: NodeJS.Timeout | null = null

// ----------------------------------------------------------------
// Window creation
// ----------------------------------------------------------------

function createWindow(): void {
  const settings = getSettings()

  // Apply theme before window opens
  if (settings.theme === 'dark')   nativeTheme.themeSource = 'dark'
  else if (settings.theme === 'light') nativeTheme.themeSource = 'light'
  else nativeTheme.themeSource = 'system'

  const iconPath = fs.existsSync(join(process.resourcesPath, 'icon.ico'))
    ? join(process.resourcesPath, 'icon.ico')
    : join(__dirname, '../../resources/icon.ico')

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 900,
    minHeight: 600,
    show: false,
    frame: true,
    titleBarStyle: 'default',
    autoHideMenuBar: true,
    backgroundColor: settings.theme === 'light' ? '#ffffff' : '#0b0e11',
    icon: iconPath,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true,
      allowRunningInsecureContent: false,
      experimentalFeatures: false
    }
  })

  // Remove default application menu (File, Edit, View, Window, Help)
  mainWindow.removeMenu()

  // Content Security Policy
  const scriptSrc = is.dev ? "'self' 'unsafe-inline'" : "'self'"
  const connectSrc = is.dev ? "'self' ws://localhost:* http://localhost:*" : "'self'"

  mainWindow.webContents.session.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [
          "default-src 'self'; " +
          `script-src ${scriptSrc}; ` +
          "style-src 'self' 'unsafe-inline'; " +
          "img-src 'self' data:; " +
          "font-src 'self' data:; " +
          `connect-src ${connectSrc}; ` +
          "object-src 'none'; " +
          "base-uri 'none'"
        ]
      }
    })
  })

  mainWindow.webContents.on('did-fail-load', (e, code, desc, url) => {
    console.error('[MainWindow] did-fail-load:', code, desc, url)
  })
  mainWindow.webContents.on('console-message', (e, level, message, line, sourceId) => {
    console.log(`[Renderer] [${level}] ${message} (${sourceId}:${line})`)
  })

  // Restrict navigation to app content only
  mainWindow.webContents.on('will-navigate', (e, url) => {
    if (!url.startsWith('file://') && !url.startsWith('http://localhost')) {
      e.preventDefault()
    }
  })

  // Open external links in the OS browser, not in the app
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow?.show()
  })

  mainWindow.on('closed', () => {
    lockVault()
    mainWindow = null
  })

  // Load app
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
    mainWindow.webContents.openDevTools({ mode: 'detach' })
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  // Start inactivity timer
  resetInactivityTimer()
}

// ----------------------------------------------------------------
// Auto-lock on inactivity
// ----------------------------------------------------------------

function resetInactivityTimer(): void {
  if (inactivityTimer) clearTimeout(inactivityTimer)
  const settings = getSettings()
  const minutes = settings.autoLockMinutes
  if (!minutes || minutes <= 0) return

  inactivityTimer = setTimeout(() => {
    if (getVaultStatus() === 'unlocked') {
      lockVault()
      mainWindow?.webContents.send('vault:locked')
    }
  }, minutes * 60 * 1000)
}

// Reset timer on user activity signals from renderer
ipcMain.on('activity:reset', () => resetInactivityTimer())

// ----------------------------------------------------------------
// App lifecycle
// ----------------------------------------------------------------

app.whenReady().then(async () => {
  electronApp.setAppUserModelId('com.vaultdesk.app')

  optimizer.watchWindowShortcuts

  // Initialize database with optional custom path (async for sql.js WASM load)
  const settings = getSettings()
  await initDatabase(settings.vaultPath || undefined)

  registerIpcHandlers()
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  lockVault()
  if (process.platform !== 'darwin') app.quit()
})

app.on('before-quit', () => {
  lockVault()
})
