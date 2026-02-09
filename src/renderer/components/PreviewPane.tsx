import React, { useState, useEffect } from 'react';
import type { ClipboardItemDisplay, FileContent } from '../../shared/types';

interface PreviewPaneProps {
  item: ClipboardItemDisplay | null;
}

function formatFullTime(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleString();
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function FileIcon({ fileName }: { fileName: string }) {
  const ext = fileName.split('.').pop()?.toLowerCase() || '';
  const imageExts = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp', 'ico', 'svg'];
  const codeExts = ['js', 'ts', 'jsx', 'tsx', 'py', 'rb', 'go', 'rs', 'java', 'c', 'cpp', 'h', 'swift'];

  if (imageExts.includes(ext)) {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#737373" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
        <circle cx="8.5" cy="8.5" r="1.5" />
        <polyline points="21,15 16,10 5,21" />
      </svg>
    );
  }
  if (codeExts.includes(ext)) {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#737373" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="16,18 22,12 16,6" />
        <polyline points="8,6 2,12 8,18" />
      </svg>
    );
  }
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#737373" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14,2 14,8 20,8" />
    </svg>
  );
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
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        </div>
        <span style={{
          color: '#a3a3a3',
          fontSize: '14px',
          fontWeight: 500,
        }}>Select an item to preview</span>
      </div>
    );
  }

  return (
    <div style={{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      padding: '16px',
      overflowY: 'auto',
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '14px',
        paddingBottom: '10px',
        borderBottom: '1px solid #262626',
      }}>
        <span style={{
          fontSize: '10px',
          fontWeight: 600,
          color: '#737373',
          textTransform: 'uppercase' as const,
          letterSpacing: '0.1em',
        }}>
          {item.contentType}
        </span>
        <span style={{
          fontSize: '10px',
          color: '#525252',
        }}>
          {formatFullTime(item.timestamp)}
        </span>
      </div>
      {item.contentType === 'image' && imageData ? (
        <img
          src={imageData}
          alt="Clipboard image"
          style={{
            maxWidth: '100%',
            maxHeight: '300px',
            objectFit: 'contain' as const,
            borderRadius: '8px',
            backgroundColor: 'rgba(23, 23, 23, 0.6)',
            border: '1px solid #262626',
          }}
        />
      ) : item.contentType === 'file' && fileContent ? (
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            marginBottom: '14px',
            padding: '10px 14px',
            backgroundColor: 'rgba(23, 23, 23, 0.6)',
            borderRadius: '10px',
            border: '1px solid #262626',
          }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              backgroundColor: 'rgba(38, 38, 38, 0.6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <FileIcon fileName={fileContent.fileName} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{
                fontSize: '13px',
                color: '#ffffff',
                fontWeight: 500,
              }}>
                {fileContent.fileName}
              </div>
              {fileContent.fileSize && (
                <div style={{
                  fontSize: '10px',
                  color: '#737373',
                  marginTop: '2px',
                }}>
                  {formatFileSize(fileContent.fileSize)}
                </div>
              )}
            </div>
          </div>
          {fileContent.isImage && fileContent.imageData ? (
            <img
              src={fileContent.imageData}
              alt={fileContent.fileName}
              style={{
                maxWidth: '100%',
                maxHeight: '300px',
                objectFit: 'contain' as const,
                borderRadius: '8px',
                backgroundColor: 'rgba(23, 23, 23, 0.6)',
                border: '1px solid #262626',
              }}
            />
          ) : fileContent.content ? (
            <div style={{
              flex: 1,
              fontSize: '12px',
              fontFamily: 'SF Mono, Monaco, Menlo, monospace',
              color: '#d4d4d4',
              lineHeight: '1.6',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              backgroundColor: 'rgba(23, 23, 23, 0.5)',
              padding: '14px',
              borderRadius: '10px',
              border: '1px solid #262626',
              overflow: 'auto',
            }}>
              {fileContent.content}
            </div>
          ) : null}
        </div>
      ) : (
        <div style={{
          flex: 1,
          fontSize: '13px',
          color: '#d4d4d4',
          lineHeight: '1.6',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
          fontWeight: 400,
        }}>
          {item.textContent || item.preview}
        </div>
      )}
    </div>
  );
}
