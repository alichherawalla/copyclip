import { ipcMain, clipboard, nativeImage, app } from 'electron';
import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import {
  getItems,
  deleteItem,
  clearAllItems,
  getItemById,
  getItemCount,
  searchItems,
  getImageData,
  getFileContent,
} from './database';
import { hideSearchWindow } from './window';
import { updateTrayMenu } from './tray';
import { fuzzySearch } from './fuzzy-search';

export function registerIpcHandlers(): void {
  // Get clipboard items
  ipcMain.handle('get-items', async (_event, limit?: number) => {
    const items = getItems(limit);
    console.log('[IPC] get-items returned', items.length, 'items');
    items.slice(0, 5).forEach((item, i) => {
      console.log(`[IPC]   [${i}] ${item.contentType}: ${item.textContent?.substring(0, 30) || item.preview}`);
    });
    return items;
  });

  // Search items with fuzzy matching
  ipcMain.handle('search-items', async (_event, query: string) => {
    if (!query || query.trim() === '') {
      const items = getItems(100);
      return items.map(item => ({ item, score: 1, matches: [] }));
    }

    const items = getItems(1000); // Get more items for search
    return fuzzySearch(items, query);
  });

  // Delete an item
  ipcMain.handle('delete-item', async (_event, id: string) => {
    deleteItem(id);
    updateTrayMenu();
  });

  // Clear all items
  ipcMain.handle('clear-all', async () => {
    clearAllItems();
    updateTrayMenu();
  });

  // Select an item (copy to clipboard)
  ipcMain.handle('select-item', async (_event, id: string) => {
    const item = getItemById(id);
    if (!item) {
      return;
    }

    switch (item.contentType) {
      case 'image':
        const image = nativeImage.createFromBuffer(item.rawData);
        clipboard.writeImage(image);
        break;

      case 'rtf':
        clipboard.writeRTF(item.rawData.toString('utf-8'));
        // Also write plain text for apps that don't support RTF
        if (item.textContent) {
          clipboard.write({
            rtf: item.rawData.toString('utf-8'),
            text: item.textContent,
          });
        }
        break;

      case 'file':
        // Write file to temp location and use AppleScript to put it on clipboard
        // AppleScript is the only reliable way to make Finder recognize file pastes
        try {
          const tempDir = path.join(app.getPath('temp'), 'copyclip-files');
          if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
          }

          const fileName = item.textContent || 'unnamed-file';
          const tempFilePath = path.join(tempDir, fileName);

          // Write file content to temp location
          fs.writeFileSync(tempFilePath, item.rawData);

          console.log('[IPC] File written to temp:', tempFilePath);

          // Use AppleScript to set the clipboard - this is the ONLY way
          // that works reliably with Finder for pasting files
          const escapedPath = tempFilePath.replace(/"/g, '\\"');
          const script = `set the clipboard to (POSIX file "${escapedPath}")`;

          execSync(`osascript -e '${script}'`, { timeout: 5000 });

          console.log('[IPC] Clipboard set via AppleScript for file:', tempFilePath);
        } catch (err) {
          console.error('[IPC] Failed to write file to clipboard:', err);
          // Fallback: try to write as text if it's a text file
          try {
            const textContent = item.rawData.toString('utf-8');
            clipboard.writeText(textContent);
          } catch {
            // Binary file - nothing we can do
          }
        }
        break;

      case 'text':
      default:
        if (item.textContent) {
          clipboard.writeText(item.textContent);
        } else {
          clipboard.writeText(item.rawData.toString('utf-8'));
        }
        break;
    }

    hideSearchWindow();
  });

  // Hide window
  ipcMain.on('hide-window', () => {
    hideSearchWindow();
  });

  // Get item count
  ipcMain.handle('get-item-count', async () => {
    return getItemCount();
  });

  // Get image data as base64
  ipcMain.handle('get-image-data', async (_event, id: string) => {
    return getImageData(id);
  });

  // Get file content for preview
  ipcMain.handle('get-file-content', async (_event, id: string) => {
    console.log('[IPC] get-file-content called for id:', id);
    const result = getFileContent(id);
    console.log('[IPC] get-file-content result:', result ? { fileName: result.fileName, contentLength: result.content.length } : null);
    return result;
  });
}
