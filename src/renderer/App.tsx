import React, { useState, useEffect, useCallback, useRef } from 'react';
import SearchField from './components/SearchField';
import ItemList from './components/ItemList';
import PreviewPane from './components/PreviewPane';
import Footer from './components/Footer';
import type { SearchResult, ClipboardItemDisplay } from '../shared/types';

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    background: 'rgba(30, 30, 30, 0.95)',
    borderRadius: '10px',
    overflow: 'hidden',
    boxShadow: '0 10px 40px rgba(0, 0, 0, 0.5)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
  },
  content: {
    display: 'flex',
    flex: 1,
    overflow: 'hidden',
  },
  leftPane: {
    width: '55%',
    borderRight: '1px solid rgba(255, 255, 255, 0.1)',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  rightPane: {
    width: '45%',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
};

export default function App() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [itemCount, setItemCount] = useState(0);
  const searchFieldRef = useRef<HTMLInputElement>(null);

  const loadItems = useCallback(async () => {
    const searchResults = await window.api.searchItems(query);
    setResults(searchResults);
    setSelectedIndex(0);
    const count = await window.api.getItemCount();
    setItemCount(count);
  }, [query]);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  useEffect(() => {
    // Focus search field when window is shown
    const handleWindowShown = () => {
      searchFieldRef.current?.focus();
      loadItems();
    };

    // Clear search when window is hidden
    const handleWindowHidden = () => {
      setQuery('');
      setSelectedIndex(0);
    };

    window.addEventListener('copyclip-window-shown', handleWindowShown);
    window.addEventListener('copyclip-window-hidden', handleWindowHidden);

    return () => {
      window.removeEventListener('copyclip-window-shown', handleWindowShown);
      window.removeEventListener('copyclip-window-hidden', handleWindowHidden);
    };
  }, [loadItems]);

  const selectedItem: ClipboardItemDisplay | null = results[selectedIndex]?.item ?? null;

  const handleSelect = useCallback(async (item: ClipboardItemDisplay) => {
    await window.api.selectItem(item.id);
  }, []);

  const handleDelete = useCallback(async (item: ClipboardItemDisplay) => {
    await window.api.deleteItem(item.id);
    loadItems();
  }, [loadItems]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => Math.min(prev + 1, results.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedItem) {
          handleSelect(selectedItem);
        }
        break;
      case 'Delete':
      case 'Backspace':
        if (e.metaKey && selectedItem) {
          e.preventDefault();
          handleDelete(selectedItem);
        }
        break;
      case 'Escape':
        e.preventDefault();
        window.api.hideWindow();
        break;
    }
  }, [results.length, selectedItem, handleSelect, handleDelete]);

  return (
    <div style={styles.container} onKeyDown={handleKeyDown}>
      <SearchField
        ref={searchFieldRef}
        value={query}
        onChange={setQuery}
      />
      <div style={styles.content}>
        <div style={styles.leftPane}>
          <ItemList
            results={results}
            selectedIndex={selectedIndex}
            onSelect={handleSelect}
            onDelete={handleDelete}
            onIndexChange={setSelectedIndex}
          />
        </div>
        <div style={styles.rightPane}>
          <PreviewPane item={selectedItem} />
        </div>
      </div>
      <Footer itemCount={itemCount} />
    </div>
  );
}
