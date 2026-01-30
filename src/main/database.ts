import Database from 'better-sqlite3';
import { app } from 'electron';
import * as path from 'path';
import * as crypto from 'crypto';
import type { ClipboardItem, ClipboardItemDisplay, ContentType } from '../shared/types';

let db: Database.Database | null = null;

export function initDatabase(): void {
  const dbPath = path.join(app.getPath('userData'), 'clipboard.db');
  console.log('[Database] Initializing database at:', dbPath);
  db = new Database(dbPath);
  console.log('[Database] Database opened successfully');

  // Create table if not exists (same schema as Swift version)
  db.exec(`
    CREATE TABLE IF NOT EXISTS clipboard_items (
      id TEXT PRIMARY KEY,
      timestamp INTEGER NOT NULL,
      content_type TEXT NOT NULL,
      text_content TEXT,
      raw_data BLOB NOT NULL,
      source_app TEXT,
      hash TEXT UNIQUE
    );
    CREATE INDEX IF NOT EXISTS idx_timestamp ON clipboard_items(timestamp DESC);
    CREATE INDEX IF NOT EXISTS idx_hash ON clipboard_items(hash);
  `);
}

export function closeDatabase(): void {
  if (db) {
    db.close();
    db = null;
  }
}

export function getDatabase(): Database.Database {
  if (!db) {
    throw new Error('Database not initialized');
  }
  return db;
}

export function generateId(): string {
  return crypto.randomUUID();
}

export function computeHash(data: Buffer): string {
  return crypto.createHash('sha256').update(data).digest('hex');
}

export function insertItem(item: Omit<ClipboardItem, 'id'>): ClipboardItem | null {
  const database = getDatabase();

  console.log('[Database] insertItem called:', {
    contentType: item.contentType,
    textContent: item.textContent?.substring(0, 50),
    rawDataSize: item.rawData.length,
    hash: item.hash.substring(0, 16),
  });

  // Check for duplicate hash
  const existing = database.prepare('SELECT id FROM clipboard_items WHERE hash = ?').get(item.hash);
  if (existing) {
    console.log('[Database] Duplicate hash found, updating timestamp');
    // Update timestamp of existing item instead
    database.prepare('UPDATE clipboard_items SET timestamp = ? WHERE hash = ?').run(item.timestamp, item.hash);
    return null;
  }

  const id = generateId();
  const stmt = database.prepare(`
    INSERT INTO clipboard_items (id, timestamp, content_type, text_content, raw_data, source_app, hash)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(id, item.timestamp, item.contentType, item.textContent, item.rawData, item.sourceApp, item.hash);
  console.log('[Database] Item inserted with id:', id);

  return { id, ...item };
}

export function getItems(limit: number = 100): ClipboardItemDisplay[] {
  const database = getDatabase();
  const rows = database.prepare(`
    SELECT id, timestamp, content_type, text_content, source_app
    FROM clipboard_items
    ORDER BY timestamp DESC
    LIMIT ?
  `).all(limit) as Array<{
    id: string;
    timestamp: number;
    content_type: string;
    text_content: string | null;
    source_app: string | null;
  }>;

  return rows.map(row => ({
    id: row.id,
    timestamp: row.timestamp,
    contentType: row.content_type as ContentType,
    textContent: row.text_content,
    sourceApp: row.source_app,
    preview: generatePreview(row.text_content, row.content_type as ContentType),
  }));
}

export function getItemById(id: string): ClipboardItem | null {
  const database = getDatabase();
  const row = database.prepare('SELECT * FROM clipboard_items WHERE id = ?').get(id) as {
    id: string;
    timestamp: number;
    content_type: string;
    text_content: string | null;
    raw_data: Buffer;
    source_app: string | null;
    hash: string;
  } | undefined;

  if (!row) return null;

  return {
    id: row.id,
    timestamp: row.timestamp,
    contentType: row.content_type as ContentType,
    textContent: row.text_content,
    rawData: row.raw_data,
    sourceApp: row.source_app,
    hash: row.hash,
  };
}

export function deleteItem(id: string): void {
  const database = getDatabase();
  database.prepare('DELETE FROM clipboard_items WHERE id = ?').run(id);
}

export function clearAllItems(): void {
  const database = getDatabase();
  database.prepare('DELETE FROM clipboard_items').run();
}

export function getItemCount(): number {
  const database = getDatabase();
  const result = database.prepare('SELECT COUNT(*) as count FROM clipboard_items').get() as { count: number };
  return result.count;
}

export function searchItems(query: string): ClipboardItemDisplay[] {
  const database = getDatabase();
  const searchTerm = `%${query}%`;
  const rows = database.prepare(`
    SELECT id, timestamp, content_type, text_content, source_app
    FROM clipboard_items
    WHERE text_content LIKE ?
    ORDER BY timestamp DESC
    LIMIT 100
  `).all(searchTerm) as Array<{
    id: string;
    timestamp: number;
    content_type: string;
    text_content: string | null;
    source_app: string | null;
  }>;

  return rows.map(row => ({
    id: row.id,
    timestamp: row.timestamp,
    contentType: row.content_type as ContentType,
    textContent: row.text_content,
    sourceApp: row.source_app,
    preview: generatePreview(row.text_content, row.content_type as ContentType),
  }));
}

function generatePreview(textContent: string | null, contentType: ContentType): string {
  if (contentType === 'image') {
    return '[Image]';
  }
  if (contentType === 'file') {
    return textContent || '[File]';
  }
  if (!textContent) {
    return '[Empty]';
  }
  // Truncate long text
  const maxLength = 100;
  const text = textContent.replace(/\s+/g, ' ').trim();
  if (text.length > maxLength) {
    return text.substring(0, maxLength) + '...';
  }
  return text;
}

export function getImageData(id: string): string | null {
  const item = getItemById(id);
  if (!item || item.contentType !== 'image') {
    return null;
  }
  return `data:image/png;base64,${item.rawData.toString('base64')}`;
}

// Image extensions and their MIME types
const IMAGE_EXTENSIONS: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.bmp': 'image/bmp',
  '.ico': 'image/x-icon',
  '.svg': 'image/svg+xml',
};

// Text file extensions (for syntax highlighting hints)
const TEXT_EXTENSIONS = new Set([
  '.txt', '.md', '.json', '.js', '.ts', '.jsx', '.tsx', '.css', '.scss',
  '.html', '.xml', '.yaml', '.yml', '.toml', '.ini', '.conf', '.cfg',
  '.sh', '.bash', '.zsh', '.py', '.rb', '.go', '.rs', '.java', '.c',
  '.cpp', '.h', '.hpp', '.swift', '.kt', '.sql', '.graphql', '.env',
  '.gitignore', '.dockerfile', '.makefile', '.log', '.csv',
]);

function getFileExtension(fileName: string): string {
  const lastDot = fileName.lastIndexOf('.');
  if (lastDot === -1) return '';
  return fileName.slice(lastDot).toLowerCase();
}

function isTextContent(buffer: Buffer): boolean {
  // Check first 8KB for binary content
  const checkLength = Math.min(buffer.length, 8192);
  for (let i = 0; i < checkLength; i++) {
    const byte = buffer[i];
    // Allow common text bytes: tab, newline, carriage return, and printable ASCII
    if (byte === 0) return false; // Null byte = binary
    if (byte < 32 && byte !== 9 && byte !== 10 && byte !== 13) return false;
  }
  return true;
}

export function getFileContent(id: string): { fileName: string; content: string; isImage?: boolean; imageData?: string; fileSize?: number } | null {
  const item = getItemById(id);
  if (!item) {
    return null;
  }
  if (item.contentType !== 'file') {
    return null;
  }

  const fileName = item.textContent || 'Unknown file';
  const ext = getFileExtension(fileName);
  const fileSize = item.rawData.length;

  // Check if it's an image
  const mimeType = IMAGE_EXTENSIONS[ext];
  if (mimeType) {
    const imageData = `data:${mimeType};base64,${item.rawData.toString('base64')}`;
    return {
      fileName,
      content: '',
      isImage: true,
      imageData,
      fileSize,
    };
  }

  // Check if it's a text file by extension or content
  const isKnownTextExt = TEXT_EXTENSIONS.has(ext);
  const isTextFile = isKnownTextExt || isTextContent(item.rawData);

  if (isTextFile) {
    try {
      const content = item.rawData.toString('utf-8');
      return {
        fileName,
        content,
        fileSize,
      };
    } catch {
      // Fall through to binary
    }
  }

  // Binary file
  return {
    fileName,
    content: '[Binary file - cannot preview]',
    fileSize,
  };
}

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

export function cleanupExpiredFiles(): number {
  const database = getDatabase();
  const cutoffTime = Date.now() - ONE_DAY_MS;

  const result = database.prepare(`
    DELETE FROM clipboard_items
    WHERE content_type = 'file' AND timestamp < ?
  `).run(cutoffTime);

  return result.changes;
}
