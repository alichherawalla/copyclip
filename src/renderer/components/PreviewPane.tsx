import React, { useState, useEffect } from 'react';
import type { ClipboardItemDisplay, FileContent } from '../../shared/types';

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
  fileHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '12px',
    padding: '8px 12px',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: '6px',
  },
  fileIcon: {
    fontSize: '20px',
  },
  fileInfo: {
    flex: 1,
  },
  fileName: {
    fontSize: '13px',
    color: '#fff',
    fontWeight: 500,
  },
  fileSize: {
    fontSize: '11px',
    color: 'rgba(255, 255, 255, 0.5)',
    marginTop: '2px',
  },
  codeBlock: {
    flex: 1,
    fontSize: '12px',
    fontFamily: 'SF Mono, Monaco, Menlo, monospace',
    color: '#e0e0e0',
    lineHeight: '1.5',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    padding: '12px',
    borderRadius: '6px',
    overflow: 'auto',
  },
};

function formatFullTime(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleString();
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileIcon(fileName: string): string {
  const ext = fileName.split('.').pop()?.toLowerCase() || '';
  const imageExts = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp', 'ico', 'svg'];
  const codeExts = ['js', 'ts', 'jsx', 'tsx', 'py', 'rb', 'go', 'rs', 'java', 'c', 'cpp', 'h', 'swift'];
  const docExts = ['md', 'txt', 'doc', 'docx', 'pdf'];
  const dataExts = ['json', 'xml', 'yaml', 'yml', 'csv', 'sql'];

  if (imageExts.includes(ext)) return '\uD83D\uDDBC\uFE0F';
  if (codeExts.includes(ext)) return '\uD83D\uDCDD';
  if (docExts.includes(ext)) return '\uD83D\uDCC4';
  if (dataExts.includes(ext)) return '\uD83D\uDCC1';
  return '\uD83D\uDCC2';
}

export default function PreviewPane({ item }: PreviewPaneProps) {
  const [imageData, setImageData] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<FileContent | null>(null);

  useEffect(() => {
    if (item?.contentType === 'image') {
      window.api.getImageData(item.id).then(setImageData);
      setFileContent(null);
    } else if (item?.contentType === 'file') {
      window.api.getFileContent(item.id).then(setFileContent);
      setImageData(null);
    } else {
      setImageData(null);
      setFileContent(null);
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
      ) : item.contentType === 'file' && fileContent ? (
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
          <div style={styles.fileHeader}>
            <span style={styles.fileIcon}>{getFileIcon(fileContent.fileName)}</span>
            <div style={styles.fileInfo}>
              <div style={styles.fileName}>{fileContent.fileName}</div>
              {fileContent.fileSize && (
                <div style={styles.fileSize}>{formatFileSize(fileContent.fileSize)}</div>
              )}
            </div>
          </div>
          {fileContent.isImage && fileContent.imageData ? (
            <img src={fileContent.imageData} alt={fileContent.fileName} style={styles.image} />
          ) : fileContent.content ? (
            <div style={styles.codeBlock}>{fileContent.content}</div>
          ) : null}
        </div>
      ) : (
        <div style={styles.content}>
          {item.textContent || item.preview}
        </div>
      )}
    </div>
  );
}
