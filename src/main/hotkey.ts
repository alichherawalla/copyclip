import { globalShortcut } from 'electron';
import { toggleSearchWindow } from './window';

const HOTKEY = 'CommandOrControl+Shift+C';

export function registerHotkey(): boolean {
  const success = globalShortcut.register(HOTKEY, () => {
    toggleSearchWindow();
  });

  if (!success) {
    console.error(`Failed to register global hotkey: ${HOTKEY}`);
  }

  return success;
}

export function unregisterHotkey(): void {
  globalShortcut.unregister(HOTKEY);
}

export function isHotkeyRegistered(): boolean {
  return globalShortcut.isRegistered(HOTKEY);
}
