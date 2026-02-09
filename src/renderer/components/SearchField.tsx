import React, { forwardRef, useState } from 'react';

interface SearchFieldProps {
  value: string;
  onChange: (value: string) => void;
}

const SearchField = forwardRef<HTMLInputElement, SearchFieldProps>(
  ({ value, onChange }, ref) => {
    const [isFocused, setIsFocused] = useState(false);

    return (
      <div style={{
        padding: '12px 14px',
        borderBottom: '1px solid #262626',
      }}>
        <div style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
        }}>
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#737373"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{
              position: 'absolute',
              left: '12px',
              pointerEvents: 'none',
            }}
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            ref={ref}
            type="text"
            placeholder="Search..."
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            style={{
              width: '100%',
              padding: '10px 14px 10px 38px',
              fontSize: '14px',
              fontWeight: 400,
              backgroundColor: 'rgba(23, 23, 23, 0.8)',
              border: `1px solid ${isFocused ? '#525252' : '#262626'}`,
              borderRadius: '10px',
              color: '#ffffff',
              outline: 'none',
              transition: 'border-color 0.2s',
              letterSpacing: '0.01em',
            }}
            autoFocus
          />
        </div>
      </div>
    );
  }
);

SearchField.displayName = 'SearchField';

export default SearchField;
