import React from 'react';

interface NaverInsertBarProps {
  onImageUpload: () => void;
  onVideoInsert: () => void;
  onVideoUpload: () => void;
  onQuoteInsert: () => void;
  onDividerInsert: () => void;
  onLinkInsert: () => void;
  onFileUpload: () => void;
}

const iconBase = {
  width: 22,
  height: 22,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: '#676d73',
  strokeWidth: 1.5,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

function PhotoIcon() {
  return (
    <svg {...iconBase}>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <circle cx="8.5" cy="9.5" r="1.5" />
      <path d="M21 15l-5-5L5 20" />
    </svg>
  );
}

function VideoIcon() {
  return (
    <svg {...iconBase}>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <polygon points="10,9 10,15 15,12" fill="#676d73" stroke="none" />
    </svg>
  );
}

function QuoteIcon() {
  return (
    <svg {...iconBase} stroke="none" fill="#676d73">
      <path d="M6 17h3l2-4V7H5v6h3l-2 4zm8 0h3l2-4V7h-6v6h3l-2 4z" />
    </svg>
  );
}

function DividerIcon() {
  return (
    <svg {...iconBase}>
      <line x1="4" y1="12" x2="20" y2="12" strokeWidth="2" />
      <line x1="4" y1="12" x2="6" y2="12" strokeWidth="2" />
      <line x1="9" y1="12" x2="15" y2="12" strokeWidth="2" />
      <line x1="18" y1="12" x2="20" y2="12" strokeWidth="2" />
    </svg>
  );
}

function LinkIcon() {
  return (
    <svg {...iconBase}>
      <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
    </svg>
  );
}

function FileIcon() {
  return (
    <svg {...iconBase}>
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
      <polyline points="14,2 14,8 20,8" />
      <line x1="12" y1="12" x2="12" y2="18" />
      <line x1="9" y1="15" x2="15" y2="15" />
    </svg>
  );
}

const buttonStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '6px 10px',
  border: 'none',
  background: 'transparent',
  cursor: 'pointer',
  borderRadius: 4,
  transition: 'background 0.15s',
};

const labelStyle: React.CSSProperties = {
  fontSize: 10,
  color: '#676d73',
  marginTop: 2,
  lineHeight: 1,
  whiteSpace: 'nowrap',
};

interface BarButton {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
}

export default function NaverInsertBar(props: NaverInsertBarProps) {
  const buttons: BarButton[] = [
    { label: '사진', icon: <PhotoIcon />, onClick: props.onImageUpload },
    { label: '동영상', icon: <VideoIcon />, onClick: props.onVideoInsert },
    { label: '인용구', icon: <QuoteIcon />, onClick: props.onQuoteInsert },
    { label: '구분선', icon: <DividerIcon />, onClick: props.onDividerInsert },
    { label: '링크', icon: <LinkIcon />, onClick: props.onLinkInsert },
    { label: '파일', icon: <FileIcon />, onClick: props.onFileUpload },
  ];

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        width: '100%',
        height: 56,
        background: '#fff',
        borderBottom: '1px solid #e5e8eb',
        gap: 2,
        padding: '0 8px',
        boxSizing: 'border-box',
      }}
    >
      {buttons.map((btn) => (
        <button
          key={btn.label}
          type="button"
          style={buttonStyle}
          onClick={btn.onClick}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = '#f0f1f3';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
          }}
          title={btn.label}
        >
          {btn.icon}
          <span style={labelStyle}>{btn.label}</span>
        </button>
      ))}
      <div
        style={{
          width: 1,
          height: 28,
          background: '#e5e8eb',
          marginLeft: 4,
          flexShrink: 0,
        }}
      />
    </div>
  );
}
