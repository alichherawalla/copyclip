import { Tray, Menu, nativeImage, app, NativeImage } from 'electron';
import { toggleSearchWindow } from './window';
import { getItemCount, clearAllItems } from './database';

let tray: Tray | null = null;

export function createTray(): void {
  try {
    // Create a simple 16x16 icon using raw RGBA data
    const size = { width: 16, height: 16 };
    const buffer = Buffer.alloc(size.width * size.height * 4);

    // Create a simple clipboard shape
    for (let y = 0; y < size.height; y++) {
      for (let x = 0; x < size.width; x++) {
        const idx = (y * size.width + x) * 4;

        // Draw a simple rectangle (clipboard body) and small rectangle on top (clip)
        const isBody = x >= 2 && x <= 13 && y >= 4 && y <= 15;
        const isClip = x >= 5 && x <= 10 && y >= 0 && y <= 5;
        const isBorder = (
          (isBody && (x === 2 || x === 13 || y === 4 || y === 15)) ||
          (isClip && (x === 5 || x === 10 || y === 0))
        );

        if (isBorder) {
          buffer[idx] = 0;       // R
          buffer[idx + 1] = 0;   // G
          buffer[idx + 2] = 0;   // B
          buffer[idx + 3] = 255; // A - fully opaque
        } else {
          buffer[idx] = 0;
          buffer[idx + 1] = 0;
          buffer[idx + 2] = 0;
          buffer[idx + 3] = 0;   // A - transparent
        }
      }
    }

    const icon = nativeImage.createFromBuffer(buffer, {
      width: size.width,
      height: size.height,
    });

    console.log('Created icon, isEmpty:', icon.isEmpty(), 'size:', icon.getSize());

    if (icon.isEmpty()) {
      console.error('Icon is empty after creation');
      return;
    }

    icon.setTemplateImage(true);

    tray = new Tray(icon);
    tray.setToolTip('CopyClip');

    // Left-click toggles window
    tray.on('click', () => {
      toggleSearchWindow();
    });

    // Right-click shows menu
    tray.on('right-click', () => {
      updateTrayMenu();
    });

    updateTrayMenu();
    console.log('Tray created successfully');
  } catch (error) {
    console.error('Failed to create tray:', error);
  }
}

export function updateTrayMenu(): void {
  if (!tray) return;

  const count = getItemCount();

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Open CopyClip',
      click: () => toggleSearchWindow(),
    },
    { type: 'separator' },
    {
      label: `${count} item${count !== 1 ? 's' : ''} in history`,
      enabled: false,
    },
    { type: 'separator' },
    {
      label: 'Clear History',
      click: () => {
        clearAllItems();
        updateTrayMenu();
      },
    },
    { type: 'separator' },
    {
      label: 'Quit',
      click: () => {
        app.quit();
      },
    },
  ]);

  tray.setContextMenu(contextMenu);
}

export function getTray(): Tray | null {
  return tray;
}
