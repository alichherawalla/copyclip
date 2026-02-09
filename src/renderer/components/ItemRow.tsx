import React, { useState } from 'react';
import type { ClipboardItemDisplay } from '../../shared/types';

interface ItemRowProps {
  item: ClipboardItemDisplay;
  isSelected: boolean;
  matches: Array<[number, number]>;
  onClick: () => void;
  onDoubleClick: () => void;
  onMouseEnter: () => void;
}

function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - date.getTime();

  if (diff < 60000) {
    return 'Just now';
  }
  if (diff < 3600000) {
    const mins = Math.floor(diff / 60000);
    return `${mins}m ago`;
  }
  if (diff < 86400000) {
    const hours = Math.floor(diff / 3600000);
    return `${hours}h ago`;
  }
  if (diff < 604800000) {
    const days = Math.floor(diff / 86400000);
    return `${days}d ago`;
  }
  return date.toLocaleDateString();
}

function highlightText(
  text: string,
  matches: Array<[number, number]>
): React.ReactNode {
  if (matches.length === 0) {
    return text;
  }

  const result: React.ReactNode[] = [];
  let lastIndex = 0;

  for (const [start, end] of matches) {
    if (start > lastIndex) {
      result.push(text.slice(lastIndex, start));
    }
    result.push(
      <span key={start} style={{
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        borderRadius: '2px',
      }}>
        {text.slice(start, end)}
      </span>
    );
    lastIndex = end;
  }

  if (lastIndex < text.length) {
    result.push(text.slice(lastIndex));
  }

  return result;
}

export default function ItemRow({
  item,
  isSelected,
  matches,
  onClick,
  onDoubleClick,
  onMouseEnter,
}: ItemRowProps) {
  const [isHovered, setIsHovered] = useState(false);
  const previewText = item.preview.slice(0, 100);

  return (
    <div
      style={{
        padding: '10px 14px',
        cursor: 'pointer',
        backgroundColor: isSelected
          ? 'rgba(38, 38, 38, 0.4)'
          : isHovered
            ? 'rgba(38, 38, 38, 0.2)'
            : 'transparent',
        borderBottom: '1px solid rgba(38, 38, 38, 0.5)',
        borderLeft: isSelected ? '2px solid #404040' : '2px solid transparent',
        transition: 'background-color 0.15s, border-color 0.15s',
      }}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      onMouseEnter={() => { onMouseEnter(); setIsHovered(true); }}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div style={{
        fontSize: '13px',
        color: isSelected ? '#ffffff' : '#e5e5e5',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        marginBottom: '6px',
        fontWeight: 400,
        lineHeight: '1.4',
      }}>
        {highlightText(previewText, matches)}
      </div>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <span style={{
          padding: '2px 7px',
          borderRadius: '4px',
          backgroundColor: '#262626',
          border: '1px solid #404040',
          fontSize: '9px',
          fontWeight: 600,
          textTransform: 'uppercase' as const,
          letterSpacing: '0.08em',
          color: '#a3a3a3',
        }}>
          {item.contentType}
        </span>
        <span style={{
          fontSize: '10px',
          color: '#737373',
          letterSpacing: '0.01em',
        }}>
          {formatTime(item.timestamp)}
        </span>
      </div>
    </div>
  );
}
