import React from 'react';

interface FooterProps {
  itemCount: number;
}

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px 14px',
    borderTop: '1px solid rgba(255, 255, 255, 0.1)',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    fontSize: '11px',
    color: 'rgba(255, 255, 255, 0.5)',
  },
  shortcut: {
    display: 'flex',
    gap: '12px',
  },
  key: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
  },
  kbd: {
    padding: '2px 5px',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: '3px',
    fontSize: '10px',
    fontFamily: 'monospace',
  },
};

export default function Footer({ itemCount }: FooterProps) {
  return (
    <div style={styles.container}>
      <span>{itemCount} item{itemCount !== 1 ? 's' : ''}</span>
      <div style={styles.shortcut}>
        <span style={styles.key}>
          <span style={styles.kbd}>↵</span> Paste
        </span>
        <span style={styles.key}>
          <span style={styles.kbd}>⌘⌫</span> Delete
        </span>
        <span style={styles.key}>
          <span style={styles.kbd}>esc</span> Close
        </span>
      </div>
    </div>
  );
}
