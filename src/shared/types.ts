export type ContentType = 'text' | 'rtf' | 'image' | 'file';

export interface ClipboardItem {
  id: string;
  timestamp: number;
  contentType: ContentType;
  textContent: string | null;
  rawData: Buffer;
  sourceApp: string | null;
  hash: string;
}

export interface ClipboardItemDisplay {
  id: string;
  timestamp: number;
  contentType: ContentType;
  textContent: string | null;
  sourceApp: string | null;
  preview: string;
}

export interface SearchResult {
  item: ClipboardItemDisplay;
  score: number;
  matches: Array<[number, number]>;
}

export interface IpcApi {
  getItems: (limit?: number) => Promise<ClipboardItemDisplay[]>;
  searchItems: (query: string) => Promise<SearchResult[]>;
  deleteItem: (id: string) => Promise<void>;
  clearAll: () => Promise<void>;
  selectItem: (id: string) => Promise<void>;
  hideWindow: () => void;
  getItemCount: () => Promise<number>;
  getImageData: (id: string) => Promise<string | null>;
}

declare global {
  interface Window {
    api: IpcApi;
  }
}
