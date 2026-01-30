import { app, BrowserWindow } from 'electron';
import { createTray, updateTrayMenu } from './tray';
import { createSearchWindow, getSearchWindow } from './window';
import { registerHotkey, unregisterHotkey } from './hotkey';
import { startClipboardMonitor, stopClipboardMonitor } from './clipboard-monitor';
import { initDatabase, closeDatabase, cleanupExpiredFiles } from './database';
import { registerIpcHandlers } from './ipc-handlers';

// Handle EPIPE errors from broken console pipe (happens in dev mode when terminal closes)
process.stdout?.on?.('error', (err: NodeJS.ErrnoException) => {
  if (err.code === 'EPIPE') return;
  throw err;
});
process.stderr?.on?.('error', (err: NodeJS.ErrnoException) => {
  if (err.code === 'EPIPE') return;
  throw err;
});

// Prevent multiple instances
const gotTheLock = app.requestSingleInstanceLock();

// Cleanup interval for expired files (1 hour)
const CLEANUP_INTERVAL_MS = 60 * 60 * 1000;
let cleanupInterval: NodeJS.Timeout | null = null;

if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    const win = getSearchWindow();
    if (win) {
      win.show();
      win.focus();
    }
  });

  // Hide dock icon (menu bar app)
  if (app.dock) {
    app.dock.hide();
  }

  app.whenReady().then(() => {
    console.log('='.repeat(60));
    console.log('[CopyClip] App starting at:', new Date().toISOString());
    console.log('[CopyClip] Version:', app.getVersion());
    console.log('[CopyClip] Is packaged:', app.isPackaged);
    console.log('[CopyClip] User data path:', app.getPath('userData'));
    console.log('='.repeat(60));
    console.log('App ready, initializing...');

    try {
      // Initialize database
      console.log('Initializing database...');
      initDatabase();

      // Clean up expired files on startup and schedule periodic cleanup
      const expiredCount = cleanupExpiredFiles();
      if (expiredCount > 0) {
        console.log(`Cleaned up ${expiredCount} expired file(s)`);
      }
      cleanupInterval = setInterval(() => {
        const count = cleanupExpiredFiles();
        if (count > 0) {
          console.log(`Cleaned up ${count} expired file(s)`);
          updateTrayMenu();
        }
      }, CLEANUP_INTERVAL_MS);

      // Register IPC handlers
      console.log('Registering IPC handlers...');
      registerIpcHandlers();

      // Create search window (hidden initially)
      console.log('Creating search window...');
      createSearchWindow();

      // Create system tray
      console.log('Creating tray...');
      createTray();

      // Register global hotkey
      console.log('Registering hotkey...');
      registerHotkey();

      // Start clipboard monitoring
      console.log('Starting clipboard monitor...');
      startClipboardMonitor();

      // Update tray menu with item count
      updateTrayMenu();

      console.log('CopyClip started successfully!');
    } catch (error) {
      console.error('Failed to initialize app:', error);
    }
  });

  // Don't quit when all windows are closed (menu bar app)
  app.on('window-all-closed', () => {
    // Do nothing - keep the app running in the tray
  });

  app.on('before-quit', () => {
    unregisterHotkey();
    stopClipboardMonitor();
    if (cleanupInterval) {
      clearInterval(cleanupInterval);
      cleanupInterval = null;
    }
    closeDatabase();
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createSearchWindow();
    }
  });
}
