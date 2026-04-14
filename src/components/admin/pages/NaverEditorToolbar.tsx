import React, { useState, useRef, useEffect, useCallback } from 'react';
import type { NaverEditorRef } from './NaverRichTextEditor';

/* ──────────────────────────────────────────────
   Props
   ────────────────────────────────────────────── */
interface NaverEditorToolbarProps {
  editorRef: React.RefObject<NaverEditorRef | null>;
}

/* ──────────────────────────────────────────────
   Constants
   ────────────────────────────────────────────── */

const HEADING_OPTIONS: { label: string; tag: string; fontSize: number; fontWeight: number }[] = [
  { label: '본문', tag: 'p', fontSize: 15, fontWeight: 400 },
  { label: '제목1', tag: 'h1', fontSize: 32, fontWeight: 700 },
  { label: '제목2', tag: 'h2', fontSize: 26, fontWeight: 700 },
  { label: '제목3', tag: 'h3', fontSize: 22, fontWeight: 700 },
  { label: '제목4', tag: 'h4', fontSize: 18, fontWeight: 600 },
];

const FONT_OPTIONS: { label: string; value: string }[] = [
  { label: '프리텐다드', value: 'Pretendard, sans-serif' },
  { label: '나눔고딕', value: '"Nanum Gothic", sans-serif' },
  { label: '나눔명조', value: '"Nanum Myeongjo", serif' },
  { label: '나눔스퀘어', value: '"NanumSquare", sans-serif' },
  { label: '고딕 A1', value: '"Gothic A1", sans-serif' },
  { label: '노토 산스', value: '"Noto Sans KR", sans-serif' },
  { label: '노토 세리프', value: '"Noto Serif KR", serif' },
  { label: 'Arial', value: 'Arial, Helvetica, sans-serif' },
  { label: 'Georgia', value: 'Georgia, serif' },
  { label: 'Courier', value: '"Courier New", monospace' },
];

const FONT_SIZE_OPTIONS = [11, 13, 15, 16, 19, 24, 28, 30, 34, 38];

const LINE_SPACING_OPTIONS = [1.0, 1.2, 1.4, 1.6, 1.8, 2.0, 2.4, 3.0];

const DECORATION_OPTIONS: { label: string; style: string }[] = [
  { label: '없음', style: 'none' },
  { label: '물결 밑줄', style: 'underline wavy' },
  { label: '점선 밑줄', style: 'underline dotted' },
  { label: '이중 밑줄', style: 'underline double' },
];

/* Color grid: 7 columns x 7 rows */
const COLOR_PALETTE = [
  ['#ffffff', '#ffcccc', '#ffddaa', '#ffffcc', '#ccffcc', '#ccccff', '#eeccff'],
  ['#cccccc', '#ff6666', '#ffaa55', '#ffff66', '#66ff66', '#6666ff', '#cc66ff'],
  ['#999999', '#ff0000', '#ff8800', '#ffff00', '#00ff00', '#0000ff', '#aa00ff'],
  ['#666666', '#cc0000', '#cc6600', '#cccc00', '#00cc00', '#0000cc', '#8800cc'],
  ['#333333', '#990000', '#994400', '#999900', '#009900', '#000099', '#660099'],
  ['#111111', '#660000', '#663300', '#666600', '#006600', '#000066', '#440066'],
  ['#000000', '#330000', '#331a00', '#333300', '#003300', '#000033', '#220033'],
];

/* ──────────────────────────────────────────────
   Styles
   ────────────────────────────────────────────── */
const toolbarBtnStyle: React.CSSProperties = {
  padding: '5px 8px',
  fontSize: 13,
  fontWeight: 500,
  border: 'none',
  background: 'none',
  cursor: 'pointer',
  color: '#333',
  borderRadius: 4,
  minWidth: 28,
  textAlign: 'center',
  transition: 'background 0.15s',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const activeBtnStyle: React.CSSProperties = {
  ...toolbarBtnStyle,
  background: '#e8eaed',
};

const dropdownStyle: React.CSSProperties = {
  position: 'absolute',
  top: '100%',
  left: 0,
  marginTop: 4,
  background: '#fff',
  border: '1px solid #e5e8eb',
  borderRadius: 8,
  boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
  zIndex: 100,
  padding: '4px 0',
  minWidth: 120,
};

const dividerStyle: React.CSSProperties = {
  width: 1,
  height: 20,
  background: '#e5e8eb',
  margin: '0 6px',
  flexShrink: 0,
};

const dropdownItemStyle: React.CSSProperties = {
  padding: '6px 14px',
  cursor: 'pointer',
  fontSize: 13,
  color: '#333',
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  whiteSpace: 'nowrap',
};

/* ──────────────────────────────────────────────
   Helpers
   ────────────────────────────────────────────── */

/** Close dropdown when clicking outside */
function useOutsideClick(ref: React.RefObject<HTMLElement | null>, onClose: () => void) {
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [ref, onClose]);
}

/** Get computed style from current selection */
function getSelectionComputedStyle(): CSSStyleDeclaration | null {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return null;
  let node: Node | null = sel.anchorNode;
  if (!node) return null;
  const el = node.nodeType === Node.ELEMENT_NODE ? (node as HTMLElement) : node.parentElement;
  if (!el) return null;
  return window.getComputedStyle(el);
}

/** Get the heading tag of the current selection */
function getSelectionHeading(): string {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return 'p';
  let node: Node | null = sel.anchorNode;
  while (node) {
    if (node.nodeType === Node.ELEMENT_NODE) {
      const tag = (node as HTMLElement).tagName.toLowerCase();
      if (['h1', 'h2', 'h3', 'h4'].includes(tag)) return tag;
      if (tag === 'div' || tag === 'p') return 'p';
    }
    node = node.parentNode;
  }
  return 'p';
}

/** Find the block-level ancestor of a node */
function findBlockAncestor(node: Node | null): HTMLElement | null {
  const blockTags = ['P', 'DIV', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'LI', 'BLOCKQUOTE'];
  let current = node;
  while (current) {
    if (current.nodeType === Node.ELEMENT_NODE && blockTags.includes((current as HTMLElement).tagName)) {
      return current as HTMLElement;
    }
    current = current.parentNode;
  }
  return null;
}

/* ──────────────────────────────────────────────
   SVG Icons (inline, small)
   ────────────────────────────────────────────── */

const AlignLeftIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <rect x="2" y="3" width="12" height="1.5" rx="0.5" fill="#333" />
    <rect x="2" y="6.5" width="8" height="1.5" rx="0.5" fill="#333" />
    <rect x="2" y="10" width="12" height="1.5" rx="0.5" fill="#333" />
    <rect x="2" y="13.5" width="8" height="1.5" rx="0.5" fill="#333" />
  </svg>
);

const AlignCenterIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <rect x="2" y="3" width="12" height="1.5" rx="0.5" fill="#333" />
    <rect x="4" y="6.5" width="8" height="1.5" rx="0.5" fill="#333" />
    <rect x="2" y="10" width="12" height="1.5" rx="0.5" fill="#333" />
    <rect x="4" y="13.5" width="8" height="1.5" rx="0.5" fill="#333" />
  </svg>
);

const AlignRightIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <rect x="2" y="3" width="12" height="1.5" rx="0.5" fill="#333" />
    <rect x="6" y="6.5" width="8" height="1.5" rx="0.5" fill="#333" />
    <rect x="2" y="10" width="12" height="1.5" rx="0.5" fill="#333" />
    <rect x="6" y="13.5" width="8" height="1.5" rx="0.5" fill="#333" />
  </svg>
);

const ULIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <circle cx="3" cy="4" r="1.2" fill="#333" />
    <circle cx="3" cy="8" r="1.2" fill="#333" />
    <circle cx="3" cy="12" r="1.2" fill="#333" />
    <rect x="6" y="3.25" width="8" height="1.5" rx="0.5" fill="#333" />
    <rect x="6" y="7.25" width="8" height="1.5" rx="0.5" fill="#333" />
    <rect x="6" y="11.25" width="8" height="1.5" rx="0.5" fill="#333" />
  </svg>
);

const OLIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <text x="1.5" y="5.5" fontSize="6" fill="#333" fontWeight="700">1.</text>
    <text x="1.5" y="9.5" fontSize="6" fill="#333" fontWeight="700">2.</text>
    <text x="1.5" y="13.5" fontSize="6" fill="#333" fontWeight="700">3.</text>
    <rect x="6" y="3.25" width="8" height="1.5" rx="0.5" fill="#333" />
    <rect x="6" y="7.25" width="8" height="1.5" rx="0.5" fill="#333" />
    <rect x="6" y="11.25" width="8" height="1.5" rx="0.5" fill="#333" />
  </svg>
);

const LinkIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#333" strokeWidth="1.5">
    <path d="M6.5 9.5a3 3 0 004.2.2l2-2a3 3 0 00-4.2-4.2L7.3 4.7" strokeLinecap="round" />
    <path d="M9.5 6.5a3 3 0 00-4.2-.2l-2 2a3 3 0 004.2 4.2l1.2-1.2" strokeLinecap="round" />
  </svg>
);

const ChevronDown = () => (
  <svg width="10" height="10" viewBox="0 0 10 10" fill="none" style={{ marginLeft: 2 }}>
    <path d="M2.5 4L5 6.5L7.5 4" stroke="#666" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/* ──────────────────────────────────────────────
   Component
   ────────────────────────────────────────────── */
export default function NaverEditorToolbar({ editorRef }: NaverEditorToolbarProps) {
  /* ── Active formatting state ── */
  const [currentHeading, setCurrentHeading] = useState('p');
  const [currentFont, setCurrentFont] = useState('나눔고딕');
  const [currentFontValue, setCurrentFontValue] = useState('"Nanum Gothic", sans-serif');
  const [currentSize, setCurrentSize] = useState(15);
  const [textColor, setTextColor] = useState('#000000');
  const [bgColor, setBgColor] = useState('#ffffff');

  /* ── Dropdown open states ── */
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  /* ── Hover state ── */
  const [hoveredBtn, setHoveredBtn] = useState<string | null>(null);

  /* ── Refs for outside-click ── */
  const headingRef = useRef<HTMLDivElement>(null);
  const fontRef = useRef<HTMLDivElement>(null);
  const sizeRef = useRef<HTMLDivElement>(null);
  const textColorRef = useRef<HTMLDivElement>(null);
  const bgColorRef = useRef<HTMLDivElement>(null);
  const lineSpacingRef = useRef<HTMLDivElement>(null);
  const decorationRef = useRef<HTMLDivElement>(null);

  /* ── Close all dropdowns on outside click ── */
  const closeAll = useCallback(() => setOpenDropdown(null), []);
  useOutsideClick(headingRef, useCallback(() => { if (openDropdown === 'heading') closeAll(); }, [openDropdown, closeAll]));
  useOutsideClick(fontRef, useCallback(() => { if (openDropdown === 'font') closeAll(); }, [openDropdown, closeAll]));
  useOutsideClick(sizeRef, useCallback(() => { if (openDropdown === 'size') closeAll(); }, [openDropdown, closeAll]));
  useOutsideClick(textColorRef, useCallback(() => { if (openDropdown === 'textColor') closeAll(); }, [openDropdown, closeAll]));
  useOutsideClick(bgColorRef, useCallback(() => { if (openDropdown === 'bgColor') closeAll(); }, [openDropdown, closeAll]));
  useOutsideClick(lineSpacingRef, useCallback(() => { if (openDropdown === 'lineSpacing') closeAll(); }, [openDropdown, closeAll]));
  useOutsideClick(decorationRef, useCallback(() => { if (openDropdown === 'decoration') closeAll(); }, [openDropdown, closeAll]));

  /* ── Detect current formatting from selection ── */
  useEffect(() => {
    function onSelectionChange() {
      const cs = getSelectionComputedStyle();
      if (!cs) return;

      // Heading
      setCurrentHeading(getSelectionHeading());

      // Font size
      const fs = parseFloat(cs.fontSize);
      if (!isNaN(fs)) setCurrentSize(Math.round(fs));

      // Font family - match against known fonts
      const ff = cs.fontFamily;
      const matched = FONT_OPTIONS.find((f) => {
        const primary = f.value.split(',')[0].trim().replace(/"/g, '');
        return ff.toLowerCase().includes(primary.toLowerCase());
      });
      if (matched) {
        setCurrentFont(matched.label);
        setCurrentFontValue(matched.value);
      }

      // Text color
      setTextColor(rgbToHex(cs.color));
    }

    document.addEventListener('selectionchange', onSelectionChange);
    return () => document.removeEventListener('selectionchange', onSelectionChange);
  }, []);

  /* ── Helpers ── */
  function rgbToHex(rgb: string): string {
    const match = rgb.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
    if (!match) return rgb;
    const r = parseInt(match[1]);
    const g = parseInt(match[2]);
    const b = parseInt(match[3]);
    return '#' + [r, g, b].map((c) => c.toString(16).padStart(2, '0')).join('');
  }

  function toggleDropdown(name: string) {
    setOpenDropdown((prev) => (prev === name ? null : name));
  }

  function btnStyle(id: string, extra?: React.CSSProperties): React.CSSProperties {
    const isHovered = hoveredBtn === id;
    return {
      ...toolbarBtnStyle,
      ...(isHovered ? { background: '#f0f1f3' } : {}),
      ...extra,
    };
  }

  function prevent(e: React.MouseEvent) {
    e.preventDefault();
  }

  /* ────────────────────────────────────────────
     RENDER
     ──────────────────────────────────────────── */
  return (
    <div
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        background: '#fff',
        borderBottom: '1px solid #e5e8eb',
        padding: '6px 12px',
        display: 'flex',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 2,
      }}
    >
      {/* ═══ 1. Heading Dropdown ═══ */}
      <div ref={headingRef} style={{ position: 'relative' }}>
        <button
          style={btnStyle('heading')}
          onMouseDown={prevent}
          onClick={() => toggleDropdown('heading')}
          onMouseEnter={() => setHoveredBtn('heading')}
          onMouseLeave={() => setHoveredBtn(null)}
        >
          {HEADING_OPTIONS.find((h) => h.tag === currentHeading)?.label || '본문'}
          <ChevronDown />
        </button>
        {openDropdown === 'heading' && (
          <div style={dropdownStyle}>
            {HEADING_OPTIONS.map((opt) => (
              <div
                key={opt.tag}
                style={{
                  ...dropdownItemStyle,
                  fontSize: Math.min(opt.fontSize, 20),
                  fontWeight: opt.fontWeight,
                  background: currentHeading === opt.tag ? '#f5f6f8' : 'transparent',
                }}
                onMouseDown={(e) => {
                  e.preventDefault();
                  if (opt.tag === 'p') {
                    editorRef.current?.handleHeading('p');
                  } else {
                    editorRef.current?.exec('formatBlock', opt.tag);
                  }
                  setCurrentHeading(opt.tag);
                  setOpenDropdown(null);
                }}
              >
                {currentHeading === opt.tag && <span style={{ color: '#00c73c', marginRight: 4 }}>✓</span>}
                {opt.label}
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={dividerStyle} />

      {/* ═══ 2. Font Family Dropdown ═══ */}
      <div ref={fontRef} style={{ position: 'relative' }}>
        <button
          style={btnStyle('font')}
          onMouseDown={prevent}
          onClick={() => toggleDropdown('font')}
          onMouseEnter={() => setHoveredBtn('font')}
          onMouseLeave={() => setHoveredBtn(null)}
        >
          {currentFont}
          <ChevronDown />
        </button>
        {openDropdown === 'font' && (
          <div style={{ ...dropdownStyle, minWidth: 160 }}>
            {FONT_OPTIONS.map((opt) => (
              <div
                key={opt.value}
                style={{
                  ...dropdownItemStyle,
                  fontFamily: opt.value,
                  background: currentFontValue === opt.value ? '#f5f6f8' : 'transparent',
                }}
                onMouseDown={(e) => {
                  e.preventDefault();
                  editorRef.current?.insertStyledSpan({
                    fontFamily: opt.value,
                    fontSize: currentSize + 'px',
                  } as Partial<CSSStyleDeclaration>);
                  setCurrentFont(opt.label);
                  setCurrentFontValue(opt.value);
                  setOpenDropdown(null);
                }}
              >
                {currentFontValue === opt.value && <span style={{ color: '#00c73c' }}>✓</span>}
                {opt.label}
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={dividerStyle} />

      {/* ═══ 3. Font Size Dropdown ═══ */}
      <div ref={sizeRef} style={{ position: 'relative' }}>
        <button
          style={btnStyle('size')}
          onMouseDown={prevent}
          onClick={() => toggleDropdown('size')}
          onMouseEnter={() => setHoveredBtn('size')}
          onMouseLeave={() => setHoveredBtn(null)}
        >
          {currentSize}
          <ChevronDown />
        </button>
        {openDropdown === 'size' && (
          <div style={{ ...dropdownStyle, minWidth: 70 }}>
            {FONT_SIZE_OPTIONS.map((s) => (
              <div
                key={s}
                style={{
                  ...dropdownItemStyle,
                  background: currentSize === s ? '#f5f6f8' : 'transparent',
                }}
                onMouseDown={(e) => {
                  e.preventDefault();
                  editorRef.current?.insertStyledSpan({
                    fontSize: s + 'px',
                  } as Partial<CSSStyleDeclaration>);
                  setCurrentSize(s);
                  setOpenDropdown(null);
                }}
              >
                {currentSize === s && <span style={{ color: '#00c73c' }}>✓</span>}
                {s}
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={dividerStyle} />

      {/* ═══ 4. B I U S ═══ */}
      <button
        style={btnStyle('bold', { fontWeight: 800 })}
        onMouseDown={(e) => { prevent(e); editorRef.current?.exec('bold'); }}
        onMouseEnter={() => setHoveredBtn('bold')}
        onMouseLeave={() => setHoveredBtn(null)}
      >
        B
      </button>
      <button
        style={btnStyle('italic', { fontStyle: 'italic' })}
        onMouseDown={(e) => { prevent(e); editorRef.current?.exec('italic'); }}
        onMouseEnter={() => setHoveredBtn('italic')}
        onMouseLeave={() => setHoveredBtn(null)}
      >
        I
      </button>
      <button
        style={btnStyle('underline', { textDecoration: 'underline' })}
        onMouseDown={(e) => { prevent(e); editorRef.current?.exec('underline'); }}
        onMouseEnter={() => setHoveredBtn('underline')}
        onMouseLeave={() => setHoveredBtn(null)}
      >
        U
      </button>
      <button
        style={btnStyle('strike', { textDecoration: 'line-through' })}
        onMouseDown={(e) => { prevent(e); editorRef.current?.exec('strikeThrough'); }}
        onMouseEnter={() => setHoveredBtn('strike')}
        onMouseLeave={() => setHoveredBtn(null)}
      >
        S
      </button>

      <div style={dividerStyle} />

      {/* ═══ 5. Text Color Picker ═══ */}
      <div ref={textColorRef} style={{ position: 'relative' }}>
        <button
          style={btnStyle('textColor', { flexDirection: 'column', gap: 1, padding: '3px 8px' })}
          onMouseDown={prevent}
          onClick={() => toggleDropdown('textColor')}
          onMouseEnter={() => setHoveredBtn('textColor')}
          onMouseLeave={() => setHoveredBtn(null)}
        >
          <span style={{ fontSize: 14, fontWeight: 700, lineHeight: 1 }}>A</span>
          <span style={{ width: 16, height: 3, background: textColor, borderRadius: 1, display: 'block' }} />
        </button>
        {openDropdown === 'textColor' && (
          <div style={{ ...dropdownStyle, padding: 8, minWidth: 'auto' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 3 }}>
              {COLOR_PALETTE.flat().map((color) => (
                <div
                  key={'tc-' + color}
                  style={{
                    width: 22,
                    height: 22,
                    background: color,
                    borderRadius: 3,
                    cursor: 'pointer',
                    border: color === '#ffffff' ? '1px solid #ddd' : '1px solid transparent',
                    boxSizing: 'border-box',
                  }}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    editorRef.current?.exec('foreColor', color);
                    setTextColor(color);
                    setOpenDropdown(null);
                  }}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ═══ 6. Background / Highlight Color Picker ═══ */}
      <div ref={bgColorRef} style={{ position: 'relative' }}>
        <button
          style={btnStyle('bgColor', { flexDirection: 'column', gap: 1, padding: '3px 8px' })}
          onMouseDown={prevent}
          onClick={() => toggleDropdown('bgColor')}
          onMouseEnter={() => setHoveredBtn('bgColor')}
          onMouseLeave={() => setHoveredBtn(null)}
        >
          <span
            style={{
              fontSize: 14,
              fontWeight: 700,
              lineHeight: 1,
              background: bgColor === '#ffffff' ? '#ffff00' : bgColor,
              padding: '0 2px',
              borderRadius: 2,
            }}
          >
            A
          </span>
          <span style={{ width: 16, height: 3, background: bgColor === '#ffffff' ? '#ffff00' : bgColor, borderRadius: 1, display: 'block' }} />
        </button>
        {openDropdown === 'bgColor' && (
          <div style={{ ...dropdownStyle, padding: 8, minWidth: 'auto' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 3 }}>
              {COLOR_PALETTE.flat().map((color) => (
                <div
                  key={'bg-' + color}
                  style={{
                    width: 22,
                    height: 22,
                    background: color,
                    borderRadius: 3,
                    cursor: 'pointer',
                    border: color === '#ffffff' ? '1px solid #ddd' : '1px solid transparent',
                    boxSizing: 'border-box',
                  }}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    // hiliteColor for most browsers, backColor for Firefox
                    try {
                      editorRef.current?.exec('hiliteColor', color);
                    } catch {
                      editorRef.current?.exec('backColor', color);
                    }
                    setBgColor(color);
                    setOpenDropdown(null);
                  }}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      <div style={dividerStyle} />

      {/* ═══ 7. Alignment Buttons ═══ */}
      <button
        style={btnStyle('alignLeft')}
        onMouseDown={(e) => { prevent(e); editorRef.current?.exec('justifyLeft'); }}
        onMouseEnter={() => setHoveredBtn('alignLeft')}
        onMouseLeave={() => setHoveredBtn(null)}
        title="왼쪽 정렬"
      >
        <AlignLeftIcon />
      </button>
      <button
        style={btnStyle('alignCenter')}
        onMouseDown={(e) => { prevent(e); editorRef.current?.exec('justifyCenter'); }}
        onMouseEnter={() => setHoveredBtn('alignCenter')}
        onMouseLeave={() => setHoveredBtn(null)}
        title="가운데 정렬"
      >
        <AlignCenterIcon />
      </button>
      <button
        style={btnStyle('alignRight')}
        onMouseDown={(e) => { prevent(e); editorRef.current?.exec('justifyRight'); }}
        onMouseEnter={() => setHoveredBtn('alignRight')}
        onMouseLeave={() => setHoveredBtn(null)}
        title="오른쪽 정렬"
      >
        <AlignRightIcon />
      </button>

      <div style={dividerStyle} />

      {/* ═══ 8. List Buttons ═══ */}
      <button
        style={btnStyle('ul')}
        onMouseDown={(e) => { prevent(e); editorRef.current?.exec('insertUnorderedList'); }}
        onMouseEnter={() => setHoveredBtn('ul')}
        onMouseLeave={() => setHoveredBtn(null)}
        title="글머리 기호"
      >
        <ULIcon />
      </button>
      <button
        style={btnStyle('ol')}
        onMouseDown={(e) => { prevent(e); editorRef.current?.exec('insertOrderedList'); }}
        onMouseEnter={() => setHoveredBtn('ol')}
        onMouseLeave={() => setHoveredBtn(null)}
        title="번호 매기기"
      >
        <OLIcon />
      </button>

      <div style={dividerStyle} />

      {/* ═══ 9. Line Spacing Dropdown ═══ */}
      <div ref={lineSpacingRef} style={{ position: 'relative' }}>
        <button
          style={btnStyle('lineSpacing')}
          onMouseDown={prevent}
          onClick={() => toggleDropdown('lineSpacing')}
          onMouseEnter={() => setHoveredBtn('lineSpacing')}
          onMouseLeave={() => setHoveredBtn(null)}
          title="줄간격"
        >
          <span style={{ fontSize: 12 }}>줄간격</span>
          <ChevronDown />
        </button>
        {openDropdown === 'lineSpacing' && (
          <div style={{ ...dropdownStyle, minWidth: 80 }}>
            {LINE_SPACING_OPTIONS.map((ls) => (
              <div
                key={ls}
                style={dropdownItemStyle}
                onMouseDown={(e) => {
                  e.preventDefault();
                  const sel = window.getSelection();
                  if (sel && sel.rangeCount > 0) {
                    const block = findBlockAncestor(sel.anchorNode);
                    if (block) {
                      block.style.lineHeight = String(ls);
                      editorRef.current?.syncContent();
                    }
                  }
                  setOpenDropdown(null);
                }}
              >
                {ls.toFixed(1)}
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={dividerStyle} />

      {/* ═══ 10. Superscript / Subscript ═══ */}
      <button
        style={btnStyle('superscript')}
        onMouseDown={(e) => { prevent(e); editorRef.current?.exec('superscript'); }}
        onMouseEnter={() => setHoveredBtn('superscript')}
        onMouseLeave={() => setHoveredBtn(null)}
        title="위 첨자"
      >
        <span style={{ fontSize: 13 }}>T</span>
        <span style={{ fontSize: 9, verticalAlign: 'super', lineHeight: 1 }}>&#8593;</span>
      </button>
      <button
        style={btnStyle('subscript')}
        onMouseDown={(e) => { prevent(e); editorRef.current?.exec('subscript'); }}
        onMouseEnter={() => setHoveredBtn('subscript')}
        onMouseLeave={() => setHoveredBtn(null)}
        title="아래 첨자"
      >
        <span style={{ fontSize: 13 }}>T</span>
        <span style={{ fontSize: 9, verticalAlign: 'sub', lineHeight: 1 }}>&#8595;</span>
      </button>

      <div style={dividerStyle} />

      {/* ═══ 11. Link Button ═══ */}
      <button
        style={btnStyle('link')}
        onMouseDown={(e) => {
          e.preventDefault();
          const url = prompt('링크 URL을 입력하세요:');
          if (url) {
            editorRef.current?.exec('createLink', url);
          }
        }}
        onMouseEnter={() => setHoveredBtn('link')}
        onMouseLeave={() => setHoveredBtn(null)}
        title="링크"
      >
        <LinkIcon />
      </button>

      <div style={dividerStyle} />

      {/* ═══ 12. Decoration Dropdown ═══ */}
      <div ref={decorationRef} style={{ position: 'relative' }}>
        <button
          style={btnStyle('decoration')}
          onMouseDown={prevent}
          onClick={() => toggleDropdown('decoration')}
          onMouseEnter={() => setHoveredBtn('decoration')}
          onMouseLeave={() => setHoveredBtn(null)}
          title="꾸미기"
        >
          <span style={{ fontSize: 14 }}>&#10022;</span>
        </button>
        {openDropdown === 'decoration' && (
          <div style={dropdownStyle}>
            {DECORATION_OPTIONS.map((opt) => (
              <div
                key={opt.style}
                style={{
                  ...dropdownItemStyle,
                  textDecoration: opt.style === 'none' ? 'none' : opt.style,
                }}
                onMouseDown={(e) => {
                  e.preventDefault();
                  if (opt.style === 'none') {
                    editorRef.current?.insertStyledSpan({
                      textDecoration: 'none',
                    } as Partial<CSSStyleDeclaration>);
                  } else {
                    editorRef.current?.insertStyledSpan({
                      textDecoration: opt.style,
                    } as Partial<CSSStyleDeclaration>);
                  }
                  setOpenDropdown(null);
                }}
              >
                {opt.label}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
