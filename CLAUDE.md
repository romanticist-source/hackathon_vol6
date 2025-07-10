# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Browser-to-VSCode Sync is a development tool that syncs HTML/CSS changes made in Chrome DevTools to local files in VS Code in real-time. It consists of two main components:

1. **VS Code Extension** (`vscode-extention/`): WebSocket server that receives changes and updates local files
2. **Chrome Extension** (`browser-extension/`): WebSocket client that monitors DevTools changes and sends them to VS Code

## Architecture

The system uses WebSocket communication (localhost:3001) to sync changes:
- Chrome extension monitors DOM mutations and style changes in DevTools
- VS Code extension runs a WebSocket server to receive change notifications
- FileSyncManager (`fileSyncManager.ts`) handles file resolution and updates

## Common Commands

### VS Code Extension Development
```bash
cd vscode-extention
npm install
npm run compile          # Compile TypeScript
npm run watch           # Watch mode for development
npm run lint            # Run ESLint
npm run test            # Run tests
```

### Chrome Extension Setup
1. Open `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked" and select the `browser-extension` folder

## Development Workflow

### Testing the Extension
1. Start VS Code extension with Command Palette: "Start Browser Sync Server"
2. Load Chrome extension in developer mode
3. Open localhost page in Chrome
4. Make changes in DevTools - they should sync to VS Code files

### Key Files

- `vscode-extention/src/extension.ts`: Main extension entry point, WebSocket server management
- `vscode-extention/src/fileSyncManager.ts`: File operations and change handling
- `browser-extension/content.js`: DOM monitoring and WebSocket communication
- `browser-extension/popup.js`: Extension UI and connection status

## WebSocket Message Format

Changes are sent as JSON messages:
```json
{
  "type": "attribute_change",
  "data": {
    "url": "http://localhost:3000/index.html",
    "selector": "#element-id",
    "attribute": "class",
    "value": "new-value"
  }
}
```

## Supported Changes (MVP)
- ✅ HTML attribute changes (id, class, style)
- ✅ Inline CSS (style attribute)
- ⚠️ Limited external CSS file changes
- ❌ Element addition/removal
- ❌ JavaScript files
- ❌ Text content changes

## Configuration

VS Code extension settings:
- `browserToVscodeSync.workspaceRoot`: Project root path (auto-detected)
- `browserToVscodeSync.port`: WebSocket port (default: 3001)

## File Structure

```
hackathon_vol6/
├── vscode-extention/          # VS Code extension source
│   ├── src/
│   │   ├── extension.ts       # Main extension logic
│   │   └── fileSyncManager.ts # File sync operations
│   └── package.json
├── browser-extension/         # Chrome extension
│   ├── content.js            # DOM monitoring
│   ├── popup.html/js         # Extension UI
│   └── manifest.json
└── docs/                     # Architecture documentation
```