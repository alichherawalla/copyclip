import { ipcMain, clipboard, nativeImage } from 'electron';
import {
  getItems,
  deleteItem,
  clearAllItems,
  getItemById,
  getItemCount,
  searchItems,
  getImageData,
} from './database';
import { hideSearchWindow } from './window';
import { updateTrayMenu } from './tray';
import { fuzzySearch } from './fuzzy-search';

export function registerIpcHandlers(): void {
  // Get clipboard items
  ipcMain.handle('get-items', async (_event, limit?: number) => {
    return getItems(limit);
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
}
