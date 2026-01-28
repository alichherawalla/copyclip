import { contextBridge, ipcRenderer } from 'electron';
import type { IpcApi } from '../shared/types';

const api: IpcApi = {
  getItems: (limit?: number) => ipcRenderer.invoke('get-items', limit),
  searchItems: (query: string) => ipcRenderer.invoke('search-items', query),
  deleteItem: (id: string) => ipcRenderer.invoke('delete-item', id),
  clearAll: () => ipcRenderer.invoke('clear-all'),
  selectItem: (id: string) => ipcRenderer.invoke('select-item', id),
  hideWindow: () => ipcRenderer.send('hide-window'),
  getItemCount: () => ipcRenderer.invoke('get-item-count'),
  getImageData: (id: string) => ipcRenderer.invoke('get-image-data', id),
};

contextBridge.exposeInMainWorld('api', api);

// Listen for window events
ipcRenderer.on('window-shown', () => {
  window.dispatchEvent(new CustomEvent('copyclip-window-shown'));
});

ipcRenderer.on('window-hidden', () => {
  window.dispatchEvent(new CustomEvent('copyclip-window-hidden'));
});
