import { BrowserWindow, screen, app } from 'electron';
import * as path from 'path';

let searchWindow: BrowserWindow | null = null;

export function createSearchWindow(): BrowserWindow {
  const { width: screenWidth, height: screenHeight } = screen.getPrimaryDisplay().workAreaSize;

  const windowWidth = 600;
  const windowHeight = 450;

  searchWindow = new BrowserWindow({
    width: windowWidth,
    height: windowHeight,
    x: Math.round((screenWidth - windowWidth) / 2),
    y: Math.round((screenHeight - windowHeight) / 3), // Upper third
    frame: false,
    transparent: true,
    resizable: false,
    movable: true,
    minimizable: false,
    maximizable: false,
    closable: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, '../../preload/preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false, // Required for better-sqlite3
    },
  });

  // Set window level to floating (above other windows)
  searchWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });

  // Load the renderer
  const isDev = process.env.VITE_DEV_SERVER === 'true';
  if (isDev) {
    // In development with Vite dev server
    searchWindow.loadURL('http://localhost:5173').catch(() => {
      // Fallback to file if dev server not running
      searchWindow?.loadFile(path.join(__dirname, '../../renderer/index.html'));
    });
  } else {
    // Use built renderer files
    searchWindow.loadFile(path.join(__dirname, '../../renderer/index.html'));
  }

  // Hide window when it loses focus
  searchWindow.on('blur', () => {
    hideSearchWindow();
  });

  // Prevent window from being destroyed, just hide it
  searchWindow.on('close', (e) => {
    e.preventDefault();
    hideSearchWindow();
  });

  return searchWindow;
}

export function getSearchWindow(): BrowserWindow | null {
  return searchWindow;
}

export function showSearchWindow(): void {
  if (!searchWindow) {
    createSearchWindow();
  }

  if (searchWindow) {
    // Center window on current screen
    const currentScreen = screen.getDisplayNearestPoint(screen.getCursorScreenPoint());
    const { width: screenWidth, height: screenHeight } = currentScreen.workArea;
    const [windowWidth, windowHeight] = searchWindow.getSize();

    searchWindow.setPosition(
      Math.round(currentScreen.workArea.x + (screenWidth - windowWidth) / 2),
      Math.round(currentScreen.workArea.y + (screenHeight - windowHeight) / 3)
    );

    searchWindow.show();
    searchWindow.focus();

    // Notify renderer to focus search field
    searchWindow.webContents.send('window-shown');
  }
}

export function hideSearchWindow(): void {
  if (searchWindow && searchWindow.isVisible()) {
    searchWindow.hide();
    // Notify renderer to clear search
    searchWindow.webContents.send('window-hidden');
  }
}

export function toggleSearchWindow(): void {
  if (searchWindow && searchWindow.isVisible()) {
    hideSearchWindow();
  } else {
    showSearchWindow();
  }
}
