import { clipboard, nativeImage } from 'electron';
import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import { insertItem, computeHash } from './database';
import { updateTrayMenu } from './tray';
import type { ContentType } from '../shared/types';

/**
 * Resolves macOS file reference URLs (file:///.file/id=...) to actual file paths.
 * These special URLs are used by Finder when copying files and need to be
 * resolved using macOS-specific APIs via AppleScript.
 */
function resolveFileReferenceUrl(fileUrl: string): string | null {
  // Check if this is a macOS file reference URL
  if (!fileUrl.includes('/.file/id=')) {
    return null;
  }

  try {
    // Use AppleScript to resolve the file reference URL to an actual path
    // This calls macOS's NSURL APIs to convert the file ID to a POSIX path
    const script = `
      use framework "Foundation"
      set theURL to current application's NSURL's URLWithString:"${fileUrl}"
      set resolvedURL to theURL's filePathURL()
      if resolvedURL is not missing value then
        return (resolvedURL's |path|()) as text
      else
        return ""
      end if
    `;
    const result = execSync(`osascript -e '${script.replace(/'/g, "'\"'\"'")}'`, {
      encoding: 'utf-8',
      timeout: 5000,
    }).trim();

    if (result && result.length > 0 && result.startsWith('/')) {
      console.log('[ClipboardMonitor] Resolved file reference URL to:', result);
      return result;
    }
  } catch (err) {
    console.log('[ClipboardMonitor] Failed to resolve file reference URL:', err);
  }

  return null;
}

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB

let monitorInterval: NodeJS.Timeout | null = null;
let lastHash: string = '';

const POLL_INTERVAL = 500; // ms

export function startClipboardMonitor(): void {
  if (monitorInterval) {
    console.log('[ClipboardMonitor] Already running, skipping start');
    return;
  }

  console.log('[ClipboardMonitor] Starting clipboard monitor (poll interval:', POLL_INTERVAL, 'ms)');

  // Initialize with current clipboard content
  lastHash = getCurrentClipboardHash();
  console.log('[ClipboardMonitor] Initial hash:', lastHash.substring(0, 16) || '(empty)');

  monitorInterval = setInterval(() => {
    checkClipboard();
  }, POLL_INTERVAL);

  console.log('[ClipboardMonitor] Monitor started successfully');
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

    console.log('[ClipboardMonitor] Formats detected:', formats);

    const { contentType, rawData, textContent } = extractClipboardContent(formats);

    console.log('[ClipboardMonitor] Extracted content:', {
      contentType,
      rawDataLength: rawData?.length ?? 0,
      textContent: textContent?.substring(0, 100),
    });

    if (!rawData || rawData.length === 0) {
      console.log('[ClipboardMonitor] No raw data, skipping');
      return;
    }

    const hash = computeHash(rawData);

    // Skip if same as last clipboard content
    if (hash === lastHash) {
      return;
    }

    console.log('[ClipboardMonitor] New content detected, hash:', hash.substring(0, 16));
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

    console.log('[ClipboardMonitor] Insert result:', result ? 'success' : 'failed/duplicate');

    if (result) {
      // Update tray menu to show new count
      updateTrayMenu();
    }
  } catch (error) {
    console.error('[ClipboardMonitor] Error checking clipboard:', error);
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
  // Note: On macOS, we try multiple pasteboard types because Finder doesn't always
  // populate all formats, and availableFormats() doesn't always report them accurately
  if (formats.includes('public.file-url') || formats.includes('text/uri-list')) {
    console.log('[ClipboardMonitor] File URL format detected');

    // Debug: Log what all formats contain
    for (const fmt of formats) {
      try {
        const buf = clipboard.readBuffer(fmt);
        console.log(`[ClipboardMonitor] Format '${fmt}' buffer: ${buf?.length || 0} bytes, content: ${buf?.toString('utf-8').substring(0, 80)}`);
      } catch (e) {
        console.log(`[ClipboardMonitor] Format '${fmt}' - couldn't read buffer`);
      }
    }
    let fileUrl: string | null = null;

    // Try multiple macOS-specific pasteboard types
    // Even if not listed in availableFormats(), they might still work
    const macOSFileTypes = [
      'public.file-url',
      'NSFilenamesPboardType',
      'com.apple.nspasteboard.promised-file-url',
      'dyn.ah62d4rv4gu8y', // Dynamic UTI that Finder sometimes uses
      'text/uri-list',
    ];

    for (const formatType of macOSFileTypes) {
      if (fileUrl) break;
      try {
        const buffer = clipboard.readBuffer(formatType);
        console.log(`[ClipboardMonitor] ${formatType} buffer:`, buffer?.length, 'bytes');
        if (buffer && buffer.length > 0) {
          let parsed = buffer.toString('utf-8').replace(/\0/g, '').trim();

          // NSFilenamesPboardType returns a plist - try to extract paths
          if (formatType === 'NSFilenamesPboardType' && parsed.includes('<?xml')) {
            const pathMatch = parsed.match(/<string>([^<]+)<\/string>/);
            if (pathMatch) {
              parsed = pathMatch[1];
            }
          }

          // Handle multi-line URI lists (take first one)
          if (parsed.includes('\n')) {
            parsed = parsed.split('\n')[0].trim();
          }

          if (parsed && (parsed.startsWith('/') || parsed.startsWith('file://'))) {
            fileUrl = parsed;
            console.log(`[ClipboardMonitor] Parsed ${formatType}:`, fileUrl);
          }
        }
      } catch (err) {
        console.log(`[ClipboardMonitor] Error reading ${formatType}:`, err);
      }
    }

    // Try clipboard.read() which handles some types as strings
    if (!fileUrl) {
      for (const formatType of macOSFileTypes) {
        try {
          const str = clipboard.read(formatType);
          if (str && str.length > 0) {
            console.log(`[ClipboardMonitor] clipboard.read(${formatType}):`, str.substring(0, 100));
            const cleaned = str.replace(/\0/g, '').trim();
            if (cleaned.startsWith('/') || cleaned.startsWith('file://')) {
              fileUrl = cleaned.split('\n')[0].trim();
              console.log(`[ClipboardMonitor] Got file URL from read():`, fileUrl);
              break;
            }
          }
        } catch (err) {
          // Silently ignore - not all types support read()
        }
      }
    }

    // Fallback: try readText and check if it might be a full path
    if (!fileUrl) {
      const text = clipboard.readText();
      console.log('[ClipboardMonitor] Fallback to readText:', text?.substring(0, 100));
      // Only use readText if it looks like a full file path
      if (text && (text.startsWith('/') || text.startsWith('file://'))) {
        fileUrl = text;
      }
    }

    // Check if it looks like a file path
    if (fileUrl && (fileUrl.startsWith('/') || fileUrl.startsWith('file://'))) {
      let filePath: string;

      // First, check if this is a macOS file reference URL that needs resolving
      const resolvedPath = resolveFileReferenceUrl(fileUrl);
      if (resolvedPath) {
        filePath = resolvedPath;
      } else {
        // Standard file:// URL - just decode it
        filePath = fileUrl.startsWith('file://') ? decodeURIComponent(fileUrl.replace('file://', '')) : fileUrl;
      }
      console.log('[ClipboardMonitor] Resolved file path:', filePath);

      try {
        const stats = fs.statSync(filePath);
        console.log('[ClipboardMonitor] File stats:', {
          isFile: stats.isFile(),
          isDirectory: stats.isDirectory(),
          size: stats.size,
        });

        // Only store actual file content for regular files under 20MB
        if (stats.isFile() && stats.size <= MAX_FILE_SIZE) {
          const fileContent = fs.readFileSync(filePath);
          const fileName = path.basename(filePath);
          console.log('[ClipboardMonitor] Storing file:', fileName, 'size:', fileContent.length);

          return {
            contentType: 'file',
            rawData: fileContent,
            textContent: fileName, // Store filename for display
          };
        } else if (stats.isFile() && stats.size > MAX_FILE_SIZE) {
          // File too large - store just the path as reference
          console.log('[ClipboardMonitor] File too large, storing path only');
          return {
            contentType: 'text',
            rawData: Buffer.from(fileUrl, 'utf-8'),
            textContent: `[File too large: ${path.basename(filePath)}]`,
          };
        }
        // For directories, fall through to store as text
        console.log('[ClipboardMonitor] Directory detected, storing as text');
      } catch (err) {
        // File doesn't exist or can't be read - store the path as text
        console.log('[ClipboardMonitor] Error accessing file:', err);
      }

      return {
        contentType: 'text',
        rawData: Buffer.from(fileUrl, 'utf-8'),
        textContent: fileUrl,
      };
    } else {
      console.log('[ClipboardMonitor] fileUrl does not look like a file path:', fileUrl?.substring(0, 50));
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
