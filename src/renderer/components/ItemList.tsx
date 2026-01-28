import React, { useRef, useEffect } from 'react';
import ItemRow from './ItemRow';
import type { SearchResult, ClipboardItemDisplay } from '../../shared/types';

interface ItemListProps {
  results: SearchResult[];
  selectedIndex: number;
  onSelect: (item: ClipboardItemDisplay) => void;
  onDelete: (item: ClipboardItemDisplay) => void;
  onIndexChange: (index: number) => void;
}

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    flex: 1,
    overflowY: 'auto',
    overflowX: 'hidden',
  },
  empty: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: '14px',
  },
};

export default function ItemList({
  results,
  selectedIndex,
  onSelect,
  onDelete,
  onIndexChange,
}: ItemListProps) {
  const listRef = useRef<HTMLDivElement>(null);
  const selectedRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Scroll selected item into view
    if (selectedRef.current && listRef.current) {
      const container = listRef.current;
      const selected = selectedRef.current;
      const containerRect = container.getBoundingClientRect();
      const selectedRect = selected.getBoundingClientRect();

      if (selectedRect.top < containerRect.top) {
        selected.scrollIntoView({ block: 'start', behavior: 'smooth' });
      } else if (selectedRect.bottom > containerRect.bottom) {
        selected.scrollIntoView({ block: 'end', behavior: 'smooth' });
      }
    }
  }, [selectedIndex]);

  if (results.length === 0) {
    return (
      <div style={styles.container}>
        <div style={styles.empty}>No clipboard items</div>
      </div>
    );
  }

  return (
    <div style={styles.container} ref={listRef}>
      {results.map((result, index) => (
        <div
          key={result.item.id}
          ref={index === selectedIndex ? selectedRef : undefined}
        >
          <ItemRow
            item={result.item}
            isSelected={index === selectedIndex}
            matches={result.matches}
            onClick={() => onSelect(result.item)}
            onDoubleClick={() => onSelect(result.item)}
            onMouseEnter={() => onIndexChange(index)}
          />
        </div>
      ))}
    </div>
  );
}
