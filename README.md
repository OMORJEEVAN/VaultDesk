<div align="center">

<img src="resources/icon.png" alt="VaultDesk Logo" width="110" height="110" />

# VaultDesk

**Standalone Offline Desktop Password Manager for Windows**

[![Platform](https://img.shields.io/badge/Platform-Windows_10_%7C_11_(x64)-0078D6?style=flat&logo=windows&logoColor=white)](https://github.com/OMORJEEVAN/VaultDesk)
[![Framework](https://img.shields.io/badge/Framework-Electron_28_%7C_React_18-61DAFB?style=flat&logo=react&logoColor=black)](https://github.com/OMORJEEVAN/VaultDesk)
[![Language](https://img.shields.io/badge/Language-TypeScript_5-3178C6?style=flat&logo=typescript&logoColor=white)](https://github.com/OMORJEEVAN/VaultDesk)
[![Database](https://img.shields.io/badge/Database-SQLite_(sql.js_WASM)-003B57?style=flat&logo=sqlite&logoColor=white)](https://github.com/OMORJEEVAN/VaultDesk)

[![Encryption](https://img.shields.io/badge/Encryption-AES--256--GCM_%7C_Argon2id-10B981?style=flat)](https://github.com/OMORJEEVAN/VaultDesk)
[![Privacy](https://img.shields.io/badge/Privacy-100%25_Offline_%7C_Zero_Telemetry-0ecb81?style=flat)](https://github.com/OMORJEEVAN/VaultDesk)
[![Tests](https://img.shields.io/badge/Tests-48_%2F_48_Passed-brightgreen?style=flat&logo=vitest&logoColor=white)](https://github.com/OMORJEEVAN/VaultDesk)
[![Design](https://img.shields.io/badge/Design-Binance_Dark_%26_Light-FCD535?style=flat&logoColor=black)](https://github.com/OMORJEEVAN/VaultDesk)
[![License](https://img.shields.io/badge/License-MIT-blue?style=flat)](LICENSE)

<br />

*VaultDesk is a local, production-grade desktop password vault designed for privacy-conscious users on Windows. It operates with zero telemetry, zero cloud synchronisation, and strict application-level cryptographic isolation.*

</div>

---

## 🌟 Key Features

-  **Zero-Knowledge Encryption**: AES-256-GCM authenticated encryption for all credential fields before storing in SQLite.
- **Argon2id Key Derivation**: Derives 256-bit symmetric keys using industry-standard OWASP recommendations ($m=65536\text{ KiB}$, $t=3$, $p=4$). The master password is never stored or logged.
-  **Cryptographic Verification**: Key check record prevents unauthorized vault unlocks and guarantees cryptographic integrity.
-  **Local SQLite Database (WebAssembly)**: Powered by `sql.js` (official SQLite compiled to WebAssembly). Full database encryption at rest, atomic disk persistence, and zero native toolchain dependencies.
-  **Binance Design System**: High-contrast dark and light themes styled after Binance's interface specification (`#fcd535` primary brand accents, `#0b0e11` deep canvas floor, `#1e2329` elevated cards, `#eaecef` clean light borders, and `#d9a206` high-contrast light indicators).
-  **Centered Ergonomic Desktop Layout**: Designed with responsive widescreen centering (`max-w-4xl mx-auto`) and seamless `h-16` sidebar header alignment for comfortable reading and focused workflows on wide monitors.
-  **Instant In-Memory Global Search**: Search across platforms, usernames, emails, URLs, categories, tags, and notes (`Ctrl + K`) without writing unencrypted search indexes to disk.
-  **Smart Autocomplete & Duplicate Detection**: Suggests existing emails on new entries, detects accounts sharing identical emails and platforms, and flags reused passwords.
-  **CSPRNG Password Generator**: Generates cryptographically secure passwords using Node.js `crypto.randomBytes`, rejection sampling (zero modulo bias), and Fisher-Yates shuffle.
-  **Security Dashboard**: Analyzes password strength, evaluates Shannon entropy locally, identifies weak and reused credentials, and generates a security score.
-  **Encrypted Backup & Portability**: Backup and restore database files with master password verification. Easily migrate vaults between workstations.
-  **Auto-Lock & Clipboard Protection**: Configurable inactivity lock and automatic clipboard memory wiper.

---

## 🏗️ Technical Architecture

| Component | Technology | Description |
|---|---|---|
| **Desktop Shell** | Electron 28.3.3 | Sandboxed, `contextIsolation` enabled, `nodeIntegration` disabled |
| **Renderer Frontend** | React 18 + TypeScript 5 | Modern reactive UI, Lucide icons, Tailwind CSS 3 |
| **Build System** | Vite 5 + electron-vite 2 | Fast HMR in development, optimized rollup bundles in production |
| **Database** | SQLite via `sql.js` 1.12 | WebAssembly SQLite engine, atomic file flushing, `PRAGMA secure_delete` |
| **Key Derivation** | Argon2id (`argon2` 0.41) | OWASP-recommended memory-hard KDF with 32-byte CSPRNG salt |
| **Symmetric Encryption** | AES-256-GCM (Node `crypto`) | 12-byte random nonce per record, 16-byte authentication tag, AAD binding |
| **UI Design System** | Binance Design System | Custom palette: `#fcd535` yellow accents, `#0b0e11` canvas, `#1e2329` card surface |
| **Packaging & Installer** | electron-builder 24 | Windows NSIS `.exe` installer & standalone portable `.exe` executable |
| **Automated Testing** | Vitest 1.6 | Comprehensive unit and security integration test suite (48 tests) |

---

## 🔐 Cryptographic Architecture & Flow

```
[ Master Password ] + [ 32-byte CSPRNG Salt ]
             │
             ▼
   Argon2id (m=65536 KiB, t=3, p=4)
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

##  Getting Started

### Prerequisites
- Windows 10 or 11 (64-bit)
- Node.js 20+ LTS

### Installation
```powershell
# Clone the repository
git clone https://github.com/OMORJEEVAN/VaultDesk.git
cd VaultDesk

# Install dependencies
npm install

# Run automated test suite (48 tests)
npm test

# Launch in development mode
npm run dev
```

### Packaging Windows Executables
```powershell
# Compile frontend, main, and preload bundles
npm run build

# Package Windows NSIS installer and portable executable
npx electron-builder --win
```

The output executables will be generated in the `release/` directory:
- `release/VaultDesk Setup 1.0.0.exe` – Windows NSIS Installer
- `release/VaultDesk 1.0.0.exe` – Standalone portable executable

---

##  Global Shortcuts

| Shortcut | Function |
|---|---|
| `Ctrl + K` / `Cmd + K` | Focus Global Instant Search |
| `Escape` | Dismiss modal dialogs / clear search |
| `Enter` | Submit unlock / save credential form |

---

##  Testing & Verification

VaultDesk includes an automated test suite with 48 unit and integration tests covering:
- **Argon2id KDF**: Salt uniqueness, memory parameter conformance, and key derivation reproducibility.
- **AES-256-GCM**: Symmetric encryption roundtrips, random nonce generation, tamper detection, and AAD record-swap rejection.
- **Shannon Entropy & Password Scoring**: Correct categorization of weak, moderate, strong, and very strong passwords.
- **CSPRNG Password Generation**: Character set constraints, length bounds, and unbiased character distribution.

To execute the test suite:
```powershell
npm test
```

---

## Limitations & Security Disclosures

- **Process Memory Forensic Protection**: While in-memory key buffers are actively zeroed on lock (`buffer.fill(0)`), JavaScript garbage-collected environments cannot guarantee instantaneous memory erasure against low-level kernel memory dumps.
- **Master Password Recovery**: VaultDesk is strictly zero-knowledge. If the master password is lost, encrypted data is mathematically unrecoverable.

---
