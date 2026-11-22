// ============================================================
// VaultDesk – SQLite Database Layer (sql.js / WebAssembly)
// ============================================================
// Uses sql.js: the official SQLite compiled to WebAssembly.
// No native C++ build tools required.
// DB is loaded into memory on startup and persisted to disk
// after every write operation (atomic overwrite).
// ============================================================

import path from 'path'
import fs from 'fs'
import initSqlJs, { type Database, type SqlJsStatic } from 'sql.js'
import type { VaultSettings, Category } from '../shared/types'

// Safe reference to Electron app (allows running in unit tests / headless Node)
let electronApp: { getPath: (name: string) => string; getAppPath: () => string } | null = null
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const electron = require('electron')
  if (electron && electron.app) {
    electronApp = electron.app
  }
} catch {
  // Running outside Electron (e.g. vitest)
}

let SQL: SqlJsStatic | null = null
let db: Database | null = null
let dbPath: string = ''

// ----------------------------------------------------------------
// Initialization
// ----------------------------------------------------------------

export function getDbPath(customDir?: string): string {
  const dir = customDir || (electronApp ? electronApp.getPath('userData') : path.join(process.cwd(), 'vault_data'))
  return path.join(dir, 'vaultdesk.db')
}

export async function initDatabase(customDir?: string): Promise<Database> {
  dbPath = getDbPath(customDir)
  fs.mkdirSync(path.dirname(dbPath), { recursive: true })

  // Locate the sql.js WASM file (works both in dev, packaged, and tests)
  const appPath = electronApp ? electronApp.getAppPath() : process.cwd()
  const wasmPaths = [
    path.join(__dirname, '../../node_modules/sql.js/dist/sql-wasm.wasm'),
    path.join(process.resourcesPath || '', 'sql-wasm.wasm'),
    path.join(appPath, 'node_modules/sql.js/dist/sql-wasm.wasm'),
    path.join(process.cwd(), 'node_modules/sql.js/dist/sql-wasm.wasm'),
    path.join(__dirname, '../../../node_modules/sql.js/dist/sql-wasm.wasm'),
  ]

  SQL = await initSqlJs({
    locateFile: () => {
      for (const p of wasmPaths) {
        if (fs.existsSync(p)) return p
      }
      // Fallback: let sql.js try to load from default location
      return 'sql-wasm.wasm'
    }
  })

  // Load existing database or create new
  if (fs.existsSync(dbPath)) {
    const fileBuffer = fs.readFileSync(dbPath)
    db = new SQL.Database(fileBuffer)
  } else {
    db = new SQL.Database()
  }

  // Enable WAL-equivalent (sql.js doesn't support WAL, but secure_delete works)
  db.run('PRAGMA foreign_keys = ON')
  db.run('PRAGMA secure_delete = ON')

  runMigrations()
  persistDb()
  return db
}

export function getDb(): Database {
  if (!db) throw new Error('Database not initialized. Call initDatabase() first.')
  return db
}

/** Write the in-memory database to disk atomically. */
export function persistDb(): void {
  if (!db) return
  const data = db.export()
  const buffer = Buffer.from(data)
  // Write to temp file first, then rename for atomicity
  const tmpPath = dbPath + '.tmp'
  fs.writeFileSync(tmpPath, buffer)
  fs.renameSync(tmpPath, dbPath)
}

export function closeDatabase(): void {
  if (db) {
    persistDb()
    db.close()
    db = null
  }
}

export function getDatabasePath(): string { return dbPath }

// ----------------------------------------------------------------
// Schema migrations
// ----------------------------------------------------------------

function tableExists(name: string): boolean {
  const result = getDb().exec(
    `SELECT name FROM sqlite_master WHERE type='table' AND name='${name}'`
  )
  return result.length > 0 && result[0].values.length > 0
}

function getCurrentVersion(): number {
  if (!tableExists('schema_version')) return 0
  const r = getDb().exec('SELECT version FROM schema_version LIMIT 1')
  if (!r.length || !r[0].values.length) return 0
  return r[0].values[0][0] as number
}

function runMigrations(): void {
  const current = getCurrentVersion()
  if (current < 1) applyMigrationV1()
}

function applyMigrationV1(): void {
  const database = getDb()

  database.run(`CREATE TABLE IF NOT EXISTS schema_version (version INTEGER NOT NULL)`)

  database.run(`CREATE TABLE IF NOT EXISTS vault_settings (
    id                    INTEGER PRIMARY KEY CHECK (id = 1),
    salt                  BLOB    NOT NULL,
    kdf_algorithm         TEXT    NOT NULL DEFAULT 'argon2id',
    kdf_parameters        TEXT    NOT NULL,
    key_check_ciphertext  BLOB    NOT NULL,
    key_check_nonce       BLOB    NOT NULL,
    key_check_auth_tag    BLOB    NOT NULL,
    encryption_version    INTEGER NOT NULL DEFAULT 1,
    created_at            TEXT    NOT NULL DEFAULT (datetime('now'))
  )`)

  database.run(`CREATE TABLE IF NOT EXISTS credentials (
    id                 INTEGER PRIMARY KEY AUTOINCREMENT,
    encrypted_data     BLOB    NOT NULL,
    nonce              BLOB    NOT NULL,
    authentication_tag BLOB    NOT NULL,
    encryption_version INTEGER NOT NULL DEFAULT 1,
    is_favorite        INTEGER NOT NULL DEFAULT 0 CHECK (is_favorite IN (0,1)),
    created_at         TEXT    NOT NULL DEFAULT (datetime('now')),
    updated_at         TEXT    NOT NULL DEFAULT (datetime('now'))
  )`)

  database.run(`CREATE TABLE IF NOT EXISTS categories (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    name       TEXT    NOT NULL UNIQUE COLLATE NOCASE,
    created_at TEXT    NOT NULL DEFAULT (datetime('now'))
  )`)

  // Default categories
  const defaultCategories = [
    'Social Media', 'Email', 'Finance / Banking', 'Gaming',
    'Shopping', 'Work', 'Education', 'Entertainment', 'Developer / Tech', 'Other'
  ]
  for (const cat of defaultCategories) {
    database.run('INSERT OR IGNORE INTO categories (name) VALUES (?)', [cat])
  }

  database.run(`CREATE INDEX IF NOT EXISTS idx_credentials_created_at  ON credentials (created_at)`)
  database.run(`CREATE INDEX IF NOT EXISTS idx_credentials_updated_at  ON credentials (updated_at)`)
  database.run(`CREATE INDEX IF NOT EXISTS idx_credentials_is_favorite ON credentials (is_favorite)`)

  // Set version
  const hasVersion = database.exec('SELECT version FROM schema_version LIMIT 1')
  if (!hasVersion.length || !hasVersion[0].values.length) {
    database.run('INSERT INTO schema_version (version) VALUES (1)')
  } else {
    database.run('UPDATE schema_version SET version = 1')
  }
}

// ----------------------------------------------------------------
// Helper: execute a query and return rows as objects
// ----------------------------------------------------------------

function queryAll<T = Record<string, unknown>>(sql: string, params: (string | number | Buffer | Uint8Array | null)[] = []): T[] {
  const stmt = getDb().prepare(sql)
  stmt.bind(params)
  const rows: T[] = []
  while (stmt.step()) {
    rows.push(stmt.getAsObject() as unknown as T)
  }
  stmt.free()
  return rows
}

function queryOne<T = Record<string, unknown>>(sql: string, params: (string | number | Buffer | Uint8Array | null)[] = []): T | undefined {
  const rows = queryAll<T>(sql, params)
  return rows[0]
}

function run(sql: string, params: (string | number | Buffer | Uint8Array | null)[] = []): void {
  getDb().run(sql, params)
  persistDb()
}

function getLastInsertRowid(): number {
  const r = getDb().exec('SELECT last_insert_rowid()')
  return r[0]?.values[0]?.[0] as number ?? 0
}

// ----------------------------------------------------------------
// Vault settings
// ----------------------------------------------------------------

type VaultSettingsRow = {
  id: number
  salt: Uint8Array
  kdf_algorithm: string
  kdf_parameters: string
  key_check_ciphertext: Uint8Array
  key_check_nonce: Uint8Array
  key_check_auth_tag: Uint8Array
  encryption_version: number
  created_at: string
}

export function getVaultSettings(): VaultSettings | null {
  const row = queryOne<VaultSettingsRow>('SELECT * FROM vault_settings WHERE id = 1')
  if (!row) return null
  return {
    id: row.id,
    salt: Buffer.from(row.salt).toString('hex'),
    kdfAlgorithm: row.kdf_algorithm,
    kdfParameters: JSON.parse(row.kdf_parameters),
    keyCheckCiphertext: Buffer.from(row.key_check_ciphertext).toString('hex'),
    keyCheckNonce: Buffer.from(row.key_check_nonce).toString('hex'),
    keyCheckAuthTag: Buffer.from(row.key_check_auth_tag).toString('hex'),
    encryptionVersion: row.encryption_version,
    createdAt: row.created_at
  }
}

export function saveVaultSettings(settings: {
  salt: Buffer
  kdfAlgorithm: string
  kdfParameters: string
  keyCheckCiphertext: Buffer
  keyCheckNonce: Buffer
  keyCheckAuthTag: Buffer
  encryptionVersion: number
}): void {
  run(
    `INSERT OR REPLACE INTO vault_settings
      (id, salt, kdf_algorithm, kdf_parameters,
       key_check_ciphertext, key_check_nonce, key_check_auth_tag, encryption_version)
     VALUES (1, ?, ?, ?, ?, ?, ?, ?)`,
    [
      settings.salt,
      settings.kdfAlgorithm,
      settings.kdfParameters,
      settings.keyCheckCiphertext,
      settings.keyCheckNonce,
      settings.keyCheckAuthTag,
      settings.encryptionVersion
    ]
  )
}

// ----------------------------------------------------------------
// Credentials CRUD
// ----------------------------------------------------------------

type CredentialRow = {
  id: number
  encrypted_data: Uint8Array
  nonce: Uint8Array
  authentication_tag: Uint8Array
  encryption_version: number
  is_favorite: number
  created_at: string
  updated_at: string
}

type CredentialRowBuffered = {
  id: number
  encrypted_data: Buffer
  nonce: Buffer
  authentication_tag: Buffer
  encryption_version: number
  is_favorite: number
  created_at: string
  updated_at: string
}

function toBufferedRow(row: CredentialRow): CredentialRowBuffered {
  return {
    id: row.id,
    encrypted_data: Buffer.from(row.encrypted_data),
    nonce: Buffer.from(row.nonce),
    authentication_tag: Buffer.from(row.authentication_tag),
    encryption_version: row.encryption_version,
    is_favorite: row.is_favorite,
    created_at: row.created_at,
    updated_at: row.updated_at
  }
}

export function insertCredential(params: {
  encryptedData: Buffer
  nonce: Buffer
  authTag: Buffer
  encryptionVersion: number
  isFavorite: boolean
}): number {
  run(
    `INSERT INTO credentials (encrypted_data, nonce, authentication_tag, encryption_version, is_favorite)
     VALUES (?, ?, ?, ?, ?)`,
    [params.encryptedData, params.nonce, params.authTag, params.encryptionVersion, params.isFavorite ? 1 : 0]
  )
  return getLastInsertRowid()
}

export function updateCredentialBlob(id: number, params: {
  encryptedData: Buffer
  nonce: Buffer
  authTag: Buffer
  isFavorite: boolean
}): void {
  run(
    `UPDATE credentials
     SET encrypted_data = ?, nonce = ?, authentication_tag = ?,
         is_favorite = ?, updated_at = datetime('now')
     WHERE id = ?`,
    [params.encryptedData, params.nonce, params.authTag, params.isFavorite ? 1 : 0, id]
  )
}

export function updateFavoriteFlag(id: number, isFavorite: boolean): void {
  run(
    `UPDATE credentials SET is_favorite = ?, updated_at = datetime('now') WHERE id = ?`,
    [isFavorite ? 1 : 0, id]
  )
}

export function deleteCredentialById(id: number): void {
  run('DELETE FROM credentials WHERE id = ?', [id])
}

export function getAllCredentialRows(): CredentialRowBuffered[] {
  return queryAll<CredentialRow>('SELECT * FROM credentials ORDER BY created_at DESC').map(toBufferedRow)
}

export function getCredentialRowById(id: number): CredentialRowBuffered | undefined {
  const row = queryOne<CredentialRow>('SELECT * FROM credentials WHERE id = ?', [id])
  return row ? toBufferedRow(row) : undefined
}

// ----------------------------------------------------------------
// Categories
// ----------------------------------------------------------------

export function getAllCategories(): Category[] {
  return queryAll<{ id: number; name: string; created_at: string }>(
    'SELECT * FROM categories ORDER BY name ASC'
  ).map(r => ({ id: r.id, name: r.name, createdAt: r.created_at }))
}

export function insertCategory(name: string): number {
  run('INSERT INTO categories (name) VALUES (?)', [name])
  return getLastInsertRowid()
}

export function deleteCategoryById(id: number): void {
  run('DELETE FROM categories WHERE id = ?', [id])
}

// ----------------------------------------------------------------
// Backup / Restore
// ----------------------------------------------------------------

export function backupDatabase(destPath: string): void {
  if (!db) throw new Error('Database not initialized.')
  const data = db.export()
  fs.writeFileSync(destPath, Buffer.from(data))
}

export function replaceDatabase(srcPath: string): void {
  if (!fs.existsSync(srcPath)) throw new Error('Backup file not found.')
  if (db) { db.close(); db = null }
  fs.copyFileSync(srcPath, dbPath)
  // Reload
  if (!SQL) throw new Error('sql.js not initialized.')
  const fileBuffer = fs.readFileSync(dbPath)
  db = new SQL.Database(fileBuffer)
}
