import { clipboard, nativeImage } from 'electron';
import { insertItem, computeHash } from './database';
import { updateTrayMenu } from './tray';
import type { ContentType } from '../shared/types';

let monitorInterval: NodeJS.Timeout | null = null;
let lastHash: string = '';

const POLL_INTERVAL = 500; // ms

export function startClipboardMonitor(): void {
  if (monitorInterval) {
    return;
  }

  // Initialize with current clipboard content
  lastHash = getCurrentClipboardHash();

  monitorInterval = setInterval(() => {
    checkClipboard();
  }, POLL_INTERVAL);
}

export function stopClipboardMonitor(): void {
  if (monitorInterval) {
    clearInterval(monitorInterval);
    monitorInterval = null;
  }
}

function checkClipboard(): void {
  try {
    const formats = clipboard.availableFormats();

    if (formats.length === 0) {
      return;
    }

    const { contentType, rawData, textContent } = extractClipboardContent(formats);

    if (!rawData || rawData.length === 0) {
      return;
    }

    const hash = computeHash(rawData);

    // Skip if same as last clipboard content
    if (hash === lastHash) {
      return;
    }

    lastHash = hash;

    // Get source app (not available in Electron, would need native module)
    const sourceApp: string | null = null;

    // Insert into database
    const result = insertItem({
      timestamp: Date.now(),
      contentType,
      textContent,
      rawData,
      sourceApp,
      hash,
    });

    if (result) {
      // Update tray menu to show new count
      updateTrayMenu();
    }
  } catch (error) {
    console.error('Error checking clipboard:', error);
  }
}

function extractClipboardContent(formats: string[]): {
  contentType: ContentType;
  rawData: Buffer;
  textContent: string | null;
} {
  // Check for image first
  if (formats.some(f => f.includes('image'))) {
    const image = clipboard.readImage();
    if (!image.isEmpty()) {
      return {
        contentType: 'image',
        rawData: image.toPNG(),
        textContent: null,
      };
    }
  }

  // Check for RTF
  if (formats.includes('text/rtf')) {
    const rtf = clipboard.readRTF();
    const text = clipboard.readText();
    if (rtf) {
      return {
        contentType: 'rtf',
        rawData: Buffer.from(rtf, 'utf-8'),
        textContent: text || null,
      };
    }
  }

  // Check for file paths (macOS)
  if (formats.includes('public.file-url') || formats.includes('text/uri-list')) {
    const text = clipboard.readText();
    // Check if it looks like a file path
    if (text && (text.startsWith('/') || text.startsWith('file://'))) {
      return {
        contentType: 'file',
        rawData: Buffer.from(text, 'utf-8'),
        textContent: text,
      };
    }
  }

  // Default to plain text
  const text = clipboard.readText();
  if (text) {
    return {
      contentType: 'text',
      rawData: Buffer.from(text, 'utf-8'),
      textContent: text,
    };
  }

  // Fallback: try to get any available format
  return {
    contentType: 'text',
    rawData: Buffer.from(''),
    textContent: null,
  };
}

function getCurrentClipboardHash(): string {
  try {
    const formats = clipboard.availableFormats();
    if (formats.length === 0) {
      return '';
    }
    const { rawData } = extractClipboardContent(formats);
    return computeHash(rawData);
  } catch {
    return '';
  }
}
