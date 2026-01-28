import Database from 'better-sqlite3';
import { app } from 'electron';
import * as path from 'path';
import * as crypto from 'crypto';
import type { ClipboardItem, ClipboardItemDisplay, ContentType } from '../shared/types';

let db: Database.Database | null = null;

export function initDatabase(): void {
  const dbPath = path.join(app.getPath('userData'), 'clipboard.db');
  db = new Database(dbPath);

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

  // Check for duplicate hash
  const existing = database.prepare('SELECT id FROM clipboard_items WHERE hash = ?').get(item.hash);
  if (existing) {
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
