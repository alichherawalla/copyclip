import React from 'react';
import type { ClipboardItemDisplay } from '../../shared/types';

interface ItemRowProps {
  item: ClipboardItemDisplay;
  isSelected: boolean;
  matches: Array<[number, number]>;
  onClick: () => void;
  onDoubleClick: () => void;
  onMouseEnter: () => void;
}

const styles = {
  container: (isSelected: boolean): React.CSSProperties => ({
    padding: '10px 14px',
    cursor: 'pointer',
    backgroundColor: isSelected ? 'rgba(59, 130, 246, 0.3)' : 'transparent',
    borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
    transition: 'background-color 0.1s',
  }),
  preview: {
    fontSize: '13px',
    color: '#fff',
    whiteSpace: 'nowrap' as const,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    marginBottom: '4px',
  },
  meta: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: '11px',
    color: 'rgba(255, 255, 255, 0.5)',
  },
  type: (type: string): React.CSSProperties => ({
    padding: '2px 6px',
    borderRadius: '4px',
    backgroundColor: getTypeColor(type),
    fontSize: '10px',
    textTransform: 'uppercase' as const,
  }),
  highlight: {
    backgroundColor: 'rgba(251, 191, 36, 0.4)',
    borderRadius: '2px',
  },
};

function getTypeColor(type: string): string {
  switch (type) {
    case 'image':
      return 'rgba(139, 92, 246, 0.3)';
    case 'rtf':
      return 'rgba(236, 72, 153, 0.3)';
    case 'file':
      return 'rgba(34, 197, 94, 0.3)';
    default:
      return 'rgba(59, 130, 246, 0.3)';
  }
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
      <span key={start} style={styles.highlight}>
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
  const previewText = item.preview.slice(0, 100);

  return (
    <div
      style={styles.container(isSelected)}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      onMouseEnter={onMouseEnter}
    >
      <div style={styles.preview}>
        {highlightText(previewText, matches)}
      </div>
      <div style={styles.meta}>
        <span style={styles.type(item.contentType)}>{item.contentType}</span>
        <span>{formatTime(item.timestamp)}</span>
      </div>
    </div>
  );
}
