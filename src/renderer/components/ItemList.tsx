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
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0 16px',
      }}>
        <div style={{
          width: '48px',
          height: '48px',
          borderRadius: '14px',
          backgroundColor: '#262626',
          border: '1px solid #404040',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '12px',
        }}>
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#525252"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
            <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
          </svg>
        </div>
        <span style={{
          color: '#a3a3a3',
          fontSize: '14px',
          fontWeight: 500,
          marginBottom: '4px',
        }}>No items</span>
        <span style={{
          color: '#525252',
          fontSize: '12px',
        }}>Copy something to get started</span>
      </div>
    );
  }

  return (
    <div style={{
      position: 'relative',
      flex: 1,
      minHeight: 0,
    }}>
      <div
        ref={listRef}
        style={{
          position: 'absolute',
          inset: 0,
          overflowY: 'auto',
          overflowX: 'hidden',
          paddingBottom: '24px',
        }}
      >
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
      {/* Progressive blur at bottom */}
      <div style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: '48px',
        background: 'linear-gradient(to bottom, transparent, #0a0a0a)',
        pointerEvents: 'none',
      }} />
    </div>
  );
}
