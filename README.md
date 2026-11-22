# VaultDesk – Secure Local Desktop Password Manager

VaultDesk is a standalone, production-oriented desktop password vault for Windows. It runs completely offline, storing credentials locally using application-level cryptographic security.

---

## 🌟 Key Features

- 🔒 **Zero-Knowledge Encryption**: AES-256-GCM authenticated encryption for all credential fields before storing in SQLite.
- 🔑 **Argon2id Key Derivation**: Derives 256-bit keys using industry-standard OWASP recommendations ($m=65536$, $t=3$, $p=4$). Master password is never saved or logged.
- 🛡️ **Cryptographic Verification**: Key check record prevents unauthorized vault unlocks and guarantees cryptographic integrity.
- 🗄️ **Local SQLite Database**: Powered by `sql.js` (official SQLite compiled to WebAssembly). Full database encryption at rest, atomic persistence, zero native toolchain dependencies.
- 🔍 **Instant In-Memory Global Search**: Search across platforms, usernames, emails, URLs, categories, tags, and notes without writing search indexes to disk.
- 📧 **Smart Autocomplete & Duplicate Detection**: Suggests existing emails on new entries, detects accounts sharing identical emails and platforms, and flags reused passwords.
- 🎲 **CSPRNG Password Generator**: Generates cryptographically secure passwords using Node.js `crypto.randomBytes`, rejection sampling (zero modulo bias), and Fisher-Yates shuffle.
- 📊 **Security Dashboard**: Analyzes password strength, evaluates Shannon entropy locally, identifies weak and reused credentials, and generates a security score.
- 💾 **Encrypted Backup & Portability**: Backup and restore database files with master password verification. Easily migrate vaults between workstations.
- 🌙 **Modern Desktop UI**: Dark and light themes inspired by 1Password, Bitwarden, and modern Windows desktop ergonomics.
- ⏱️ **Auto-Lock & Clipboard Protection**: Configurable inactivity lock and automatic clipboard memory wiper.

---

## 🏗️ Technical Architecture

| Component | Technology | Description |
|---|---|---|
| **Desktop Shell** | Electron 28 | Sandboxed, contextIsolation enabled, nodeIntegration disabled |
| **Renderer Frontend** | React 18 + TypeScript 5 | Modern reactive UI, Lucide icons, Tailwind CSS 3 |
| **Build System** | Vite 5 + electron-vite 2 | Fast HMR in development, optimized rollup bundles in production |
| **Database** | SQLite via `sql.js` 1.12 | WebAssembly SQLite engine, atomic file flushing, PRAGMA secure_delete |
| **Key Derivation** | Argon2id (`argon2` 0.41) | OWASP-recommended memory-hard KDF with 32-byte CSPRNG salt |
| **Symmetric Encryption** | AES-256-GCM (Node `crypto`) | 12-byte random nonce per record, 16-byte authentication tag, AAD binding |
| **Packaging & Installer** | electron-builder 24 | Windows NSIS `.exe` installer & standalone portable `.exe` executable |
| **Automated Testing** | Vitest 1.6 | Comprehensive unit and security integration test suite (48 tests) |

---

## 🔐 Cryptographic Architecture & Flow

```
[ Master Password ] + [ 32-byte CSPRNG Salt ]
             │
             ▼
   Argon2id (m=65536, t=3, p=4)
             │
             ▼
  [ 256-bit Symmetric Key ] (Lives only in RAM while unlocked)
             │
             ├────────► Key Verification Check Record (AES-256-GCM + Auth Tag)
             │
             ▼
   AES-256-GCM per-record encryption
     ├─ Plaintext: JSON string of all credential properties
     ├─ Nonce: Fresh 12-byte cryptographically random IV (never reused)
     ├─ AAD: Binds record ID and schema version ("vaultdesk:credential:<id>:v1")
     └─ Output: Ciphertext + 16-byte Auth Tag stored in SQLite
```

### Security Invariants
1. **Plaintext Absence**: Neither the master password, derived key, nor any plaintext credential fields (passwords, notes, emails, usernames) are ever written to the SQLite file or persistent logs.
2. **Tamper Rejection**: Any modification to ciphertext, nonce, or authentication tag triggers immediate cryptographic rejection upon decryption.
3. **Record-Swap Prevention**: Additional Authenticated Data (AAD) cryptographically links each ciphertext to its specific row ID and encryption version.
4. **Memory Hygiene**: On vault lock, the derived key buffer is wiped (`fill(0)`), cached decrypted items are discarded, and garbage collection is triggered.

---

## 🚀 Getting Started

### Prerequisites
- Windows 10 or 11 (64-bit)
- Node.js 20+ LTS

### Installation
```powershell
# Clone or navigate to the repository
cd d:\Credentials\VaultDesk

# Install dependencies
npm install

# Run automated test suite (48 tests)
npm test

# Launch in development mode
npm run dev
```

### Packaging Windows Executables
```powershell
# Compile and build Windows NSIS installer and portable executable
npm run dist:win
```
The output will be generated inside the `release/` folder:
- `VaultDesk Setup 1.0.0.exe` (Full NSIS Installer with directory selector)
- `VaultDesk 1.0.0.exe` (Portable executable)

---

## ⌨️ Global Shortcuts

| Shortcut | Function |
|---|---|
| `Ctrl + K` / `Cmd + K` | Focus Global Instant Search |
| `Escape` | Dismiss modal dialogs / clear search |
| `Enter` | Submit unlock / save credential form |

---

## 🛡️ Limitations & Security Disclosures

- **Process Memory Forensic Protection**: While in-memory buffers are actively zeroed on lock, JavaScript garbage-collected environments cannot guarantee instantaneous memory erasure against low-level kernel memory dumps.
- **Master Password Recovery**: VaultDesk is strictly zero-knowledge. If the master password is lost, encrypted data is mathematically unrecoverable.
