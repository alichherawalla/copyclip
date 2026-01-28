import { app, BrowserWindow } from 'electron';
import { createTray, updateTrayMenu } from './tray';
import { createSearchWindow, getSearchWindow } from './window';
import { registerHotkey, unregisterHotkey } from './hotkey';
import { startClipboardMonitor, stopClipboardMonitor } from './clipboard-monitor';
import { initDatabase, closeDatabase } from './database';
import { registerIpcHandlers } from './ipc-handlers';

// Prevent multiple instances
const gotTheLock = app.requestSingleInstanceLock();

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
    console.log('App ready, initializing...');

    try {
      // Initialize database
      console.log('Initializing database...');
      initDatabase();

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
    closeDatabase();
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createSearchWindow();
    }
  });
}
