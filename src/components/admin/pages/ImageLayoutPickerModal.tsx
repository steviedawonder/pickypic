import React from 'react';

interface Props {
  isOpen: boolean;
  imageCount: number;
  previewUrls?: string[];
  onSelect: (mode: 'individual' | 'collage') => void;
  onClose: () => void;
}

const overlayStyle: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(0,0,0,0.5)',
  zIndex: 10000,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 24,
};

const cardStyle: React.CSSProperties = {
  background: '#fff',
  borderRadius: 12,
  width: '100%',
  maxWidth: 720,
  padding: '32px 28px',
  position: 'relative',
  boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
};

const closeBtnStyle: React.CSSProperties = {
  position: 'absolute',
  top: 16,
  right: 16,
  width: 32,
  height: 32,
  border: 'none',
  background: 'none',
  fontSize: 22,
  cursor: 'pointer',
  color: '#666',
};

const optionCardStyle: React.CSSProperties = {
  flex: 1,
  border: '1px solid #e5e5e5',
  borderRadius: 8,
  padding: '16px 16px 20px',
  cursor: 'pointer',
  background: '#fff',
  transition: 'border-color 0.15s, box-shadow 0.15s',
  textAlign: 'center',
};

function IndividualPreview() {
  return (
    <div
      style={{
        width: '100%',
        height: 140,
        background: '#fafafa',
        borderRadius: 4,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        padding: 12,
      }}
    >
      <div style={{ width: 90, height: 36, background: '#d4d4d4', borderRadius: 3 }} />
      <div style={{ width: 90, height: 36, background: '#d4d4d4', borderRadius: 3 }} />
      <div style={{ width: 90, height: 36, background: '#d4d4d4', borderRadius: 3 }} />
    </div>
  );
}

function CollagePreview() {
  return (
    <div
      style={{
        width: '100%',
        height: 140,
        background: '#fafafa',
        borderRadius: 4,
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gridTemplateRows: '1fr 1fr',
        gap: 4,
        padding: 12,
      }}
    >
      <div style={{ background: '#d4d4d4', borderRadius: 3 }} />
      <div style={{ background: '#bfbfbf', borderRadius: 3 }} />
      <div style={{ background: '#bfbfbf', borderRadius: 3 }} />
      <div style={{ background: '#d4d4d4', borderRadius: 3 }} />
    </div>
  );
}

export default function ImageLayoutPickerModal({
  isOpen,
  imageCount,
  onSelect,
  onClose,
}: Props) {
  if (!isOpen) return null;

  return (
    <div
      style={overlayStyle}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
    >
      <div style={cardStyle}>
        <button
          style={closeBtnStyle}
          onClick={onClose}
          aria-label="닫기"
          type="button"
        >
          ×
        </button>

        <h2
          style={{
            textAlign: 'center',
            fontSize: 22,
            fontWeight: 700,
            margin: '0 0 10px',
            color: '#222',
          }}
        >
          사진 첨부 방식
        </h2>
        <p
          style={{
            textAlign: 'center',
            color: '#888',
            fontSize: 14,
            margin: '0 0 28px',
          }}
        >
          첨부되는 사진들의 레이아웃을 선택할 수 있습니다. ({imageCount}장)
        </p>

        <div style={{ display: 'flex', gap: 16 }}>
          <button
            type="button"
            style={optionCardStyle}
            onClick={() => onSelect('individual')}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#3b82f6';
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(59,130,246,0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#e5e5e5';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <IndividualPreview />
            <div style={{ marginTop: 14, fontSize: 15, fontWeight: 600, color: '#333' }}>
              개별사진
            </div>
            <div style={{ marginTop: 4, fontSize: 12, color: '#999' }}>
              한 장씩 세로로 배치
            </div>
          </button>

          <button
            type="button"
            style={optionCardStyle}
            onClick={() => onSelect('collage')}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#3b82f6';
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(59,130,246,0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#e5e5e5';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <CollagePreview />
            <div style={{ marginTop: 14, fontSize: 15, fontWeight: 600, color: '#333' }}>
              콜라주
            </div>
            <div style={{ marginTop: 4, fontSize: 12, color: '#999' }}>
              자동 그리드 배치
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
