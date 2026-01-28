import React, { useState, useEffect } from 'react';
import type { ClipboardItemDisplay } from '../../shared/types';

interface PreviewPaneProps {
  item: ClipboardItemDisplay | null;
}

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    padding: '16px',
    overflowY: 'auto',
  },
  empty: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: '14px',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
    paddingBottom: '8px',
    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
  },
  type: {
    fontSize: '12px',
    color: 'rgba(255, 255, 255, 0.6)',
    textTransform: 'uppercase' as const,
  },
  time: {
    fontSize: '11px',
    color: 'rgba(255, 255, 255, 0.4)',
  },
  content: {
    flex: 1,
    fontSize: '13px',
    color: '#fff',
    lineHeight: '1.5',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
  },
  image: {
    maxWidth: '100%',
    maxHeight: '300px',
    objectFit: 'contain' as const,
    borderRadius: '4px',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
};

function formatFullTime(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleString();
}

export default function PreviewPane({ item }: PreviewPaneProps) {
  const [imageData, setImageData] = useState<string | null>(null);

  useEffect(() => {
    if (item?.contentType === 'image') {
      window.api.getImageData(item.id).then(setImageData);
    } else {
      setImageData(null);
    }
  }, [item]);

  if (!item) {
    return (
      <div style={styles.container}>
        <div style={styles.empty}>Select an item to preview</div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <span style={styles.type}>{item.contentType}</span>
        <span style={styles.time}>{formatFullTime(item.timestamp)}</span>
      </div>
      {item.contentType === 'image' && imageData ? (
        <img src={imageData} alt="Clipboard image" style={styles.image} />
      ) : (
        <div style={styles.content}>
          {item.textContent || item.preview}
        </div>
      )}
    </div>
  );
}
