import React, { forwardRef } from 'react';

interface SearchFieldProps {
  value: string;
  onChange: (value: string) => void;
}

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    padding: '12px',
    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
  },
  input: {
    width: '100%',
    padding: '10px 14px',
    fontSize: '14px',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    border: '1px solid rgba(255, 255, 255, 0.15)',
    borderRadius: '8px',
    color: '#fff',
    outline: 'none',
    transition: 'border-color 0.2s, background-color 0.2s',
  },
};

const SearchField = forwardRef<HTMLInputElement, SearchFieldProps>(
  ({ value, onChange }, ref) => {
    return (
      <div style={styles.container}>
        <input
          ref={ref}
          type="text"
          placeholder="Search clipboard history..."
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={styles.input}
          autoFocus
        />
      </div>
    );
  }
);

SearchField.displayName = 'SearchField';

export default SearchField;
