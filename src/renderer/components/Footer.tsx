import React from 'react';

interface FooterProps {
  itemCount: number;
}

export default function Footer({ itemCount }: FooterProps) {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '8px 14px',
      borderTop: '1px solid #262626',
      backgroundColor: 'rgba(10, 10, 10, 0.8)',
      fontSize: '10px',
      color: '#737373',
      letterSpacing: '0.02em',
    }}>
      <span style={{
        textTransform: 'uppercase' as const,
        letterSpacing: '0.08em',
        fontSize: '9px',
        fontWeight: 500,
      }}>
        {itemCount} item{itemCount !== 1 ? 's' : ''}
      </span>
      <div style={{
        display: 'flex',
        gap: '14px',
      }}>
        <span style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '5px',
        }}>
          <span style={{
            padding: '2px 6px',
            backgroundColor: '#262626',
            borderRadius: '4px',
            fontSize: '9px',
            fontFamily: 'SF Mono, Monaco, Menlo, monospace',
            color: '#a3a3a3',
            border: '1px solid #404040',
          }}>
            enter
          </span>
          <span>Paste</span>
        </span>
        <span style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '5px',
        }}>
          <span style={{
            padding: '2px 6px',
            backgroundColor: '#262626',
            borderRadius: '4px',
            fontSize: '9px',
            fontFamily: 'SF Mono, Monaco, Menlo, monospace',
            color: '#a3a3a3',
            border: '1px solid #404040',
          }}>
            cmd+del
          </span>
          <span>Delete</span>
        </span>
        <span style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '5px',
        }}>
          <span style={{
            padding: '2px 6px',
            backgroundColor: '#262626',
            borderRadius: '4px',
            fontSize: '9px',
            fontFamily: 'SF Mono, Monaco, Menlo, monospace',
            color: '#a3a3a3',
            border: '1px solid #404040',
          }}>
            esc
          </span>
          <span>Close</span>
        </span>
      </div>
    </div>
  );
}
