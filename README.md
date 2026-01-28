# CopyClip

A lightweight, privacy-focused clipboard manager for macOS.

## Privacy First

**Your clipboard data never leaves your computer.**

- **100% Offline** - CopyClip works entirely offline. No internet connection required.
- **No Analytics** - Zero tracking, telemetry, or usage data collection.
- **No Cloud Sync** - Your clipboard history is stored locally on your machine only.
- **No Account Required** - Just install and use. No sign-ups, no logins.
- **Local SQLite Database** - All data stored in `~/Library/Application Support/copyclip/clipboard.db`

Your clipboard often contains sensitive information - passwords, API keys, personal messages. CopyClip ensures this data stays private by design.

---

## Installation

### Quick Install (Recommended)

1. **[Download CopyClip DMG](./release/CopyClip-1.0.0-arm64.dmg)** (Apple Silicon)
2. Open the DMG file
3. Drag CopyClip to your Applications folder
4. Launch CopyClip from Applications
5. Grant accessibility permissions when prompted (required for global hotkey)

> **Note**: Since the app is not signed with an Apple Developer certificate, you may need to right-click and select "Open" the first time, then click "Open" in the dialog.

### System Requirements

- macOS 10.13 (High Sierra) or later
- Apple Silicon (M1/M2/M3) or Intel processor

---

## Usage

### Opening CopyClip

- **Keyboard Shortcut**: Press `Cmd + Shift + C` from anywhere
- **Menu Bar**: Click the clipboard icon in your menu bar

### Navigating

| Key | Action |
|-----|--------|
| `↑` / `↓` | Navigate through items |
| `Enter` | Copy selected item to clipboard |
| `Cmd + Delete` | Delete selected item |
| `Esc` | Close window |
| Type | Search/filter items |

### Features

- **Clipboard History** - Automatically saves everything you copy
- **Fuzzy Search** - Quickly find items by typing part of the text
- **Preview Pane** - See full content before pasting
- **Multiple Formats** - Supports text, RTF, images, and file paths
- **Deduplication** - Identical items are merged, not duplicated

### Menu Bar Options

Right-click the menu bar icon to:
- Open CopyClip
- View item count
- Clear all history
- Quit the application

---

## For Developers

### Prerequisites

- Node.js 18+
- npm 9+

### Setup

```bash
# Clone the repository
git clone https://github.com/yourusername/copyclip.git
cd copyclip

# Install dependencies
npm install

# Rebuild native modules for Electron
npx electron-rebuild
```

### Development

```bash
# Run in development mode (with Vite hot reload)
npm run dev

# Or run with built files
npm run start
```

### Building

```bash
# Build all (main, preload, renderer)
npm run build

# Package as DMG
npm run package
```

### Project Structure

```
copyclip-electron/
├── src/
│   ├── main/                    # Main process (Node.js)
│   │   ├── index.ts             # App entry, lifecycle
│   │   ├── tray.ts              # Menu bar icon & menu
│   │   ├── window.ts            # Search window management
│   │   ├── hotkey.ts            # Global shortcut (Cmd+Shift+C)
│   │   ├── clipboard-monitor.ts # Polls clipboard every 500ms
│   │   ├── database.ts          # SQLite operations
│   │   ├── fuzzy-search.ts      # Search algorithm
│   │   └── ipc-handlers.ts      # IPC communication
│   ├── renderer/                # Renderer process (React)
│   │   ├── App.tsx              # Main UI component
│   │   └── components/          # UI components
│   ├── preload/                 # Preload scripts
│   │   └── index.ts             # Secure IPC bridge
│   └── shared/
│       └── types.ts             # TypeScript definitions
├── resources/
│   └── tray-iconTemplate.png    # Menu bar icon
├── package.json
├── tsconfig.json
└── vite.config.ts
```

### Database Schema

```sql
CREATE TABLE clipboard_items (
  id TEXT PRIMARY KEY,
  timestamp INTEGER NOT NULL,
  content_type TEXT NOT NULL,  -- 'text', 'rtf', 'image', 'file'
  text_content TEXT,
  raw_data BLOB NOT NULL,
  source_app TEXT,
  hash TEXT UNIQUE             -- SHA-256, prevents duplicates
);
```

### Tech Stack

- **Electron** 28 - Cross-platform desktop framework
- **React** 18 - UI library
- **TypeScript** - Type safety
- **Vite** - Fast build tool
- **better-sqlite3** - Fast, synchronous SQLite
- **electron-builder** - Packaging and distribution

---

## Configuration

CopyClip stores its data in:

```
~/Library/Application Support/copyclip/
├── clipboard.db    # SQLite database with clipboard history
```

To reset CopyClip, quit the app and delete this folder.

---

## Troubleshooting

### "CopyClip can't be opened because it is from an unidentified developer"

1. Right-click on CopyClip.app
2. Select "Open" from the context menu
3. Click "Open" in the dialog

### Global hotkey not working

1. Open System Preferences → Security & Privacy → Privacy
2. Select "Accessibility" from the left sidebar
3. Click the lock to make changes
4. Add CopyClip to the list and ensure it's checked

### Clipboard not being monitored

Restart the app. CopyClip polls the clipboard every 500ms and should detect changes automatically.

---

## Limitations

- No auto-paste (you must press Cmd+V after selecting an item)
- Images are stored as PNG (may increase database size)
- No sync between devices (by design, for privacy)

---

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

## License

MIT License - feel free to use, modify, and distribute.

---

## Acknowledgments

Built with privacy in mind. Your data belongs to you.
