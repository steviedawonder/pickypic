import React, {
  useRef,
  useState,
  useEffect,
  useCallback,
  useImperativeHandle,
  forwardRef,
} from 'react';
import { uploadImage, uploadFile } from '../adminClient';

/* ──────────────────────────────────────────────
   Types
   ────────────────────────────────────────────── */
export interface NaverEditorRef {
  getEditorElement: () => HTMLDivElement | null;
  syncContent: () => void;
  exec: (command: string, val?: string) => void;
  insertStyledSpan: (styles: Partial<CSSStyleDeclaration>) => void;
  handleHeading: (tag: string) => void;
  insertHTML: (html: string) => void;
  focus: () => void;
}

interface Props {
  value: string;
  onChange: (html: string) => void;
  onImageSelect?: (img: HTMLImageElement | null) => void;
}

/* ──────────────────────────────────────────────
   Constants
   ────────────────────────────────────────────── */
const HANDLE_SIZE = 10;
const HANDLE_COLOR = '#3b82f6';

type HandlePosition =
  | 'nw' | 'n' | 'ne'
  | 'w'  |       'e'
  | 'sw' | 's' | 'se';

const HANDLES: { pos: HandlePosition; cursor: string }[] = [
  { pos: 'nw', cursor: 'nwse-resize' },
  { pos: 'n',  cursor: 'ns-resize' },
  { pos: 'ne', cursor: 'nesw-resize' },
  { pos: 'w',  cursor: 'ew-resize' },
  { pos: 'e',  cursor: 'ew-resize' },
  { pos: 'sw', cursor: 'nesw-resize' },
  { pos: 's',  cursor: 'ns-resize' },
  { pos: 'se', cursor: 'nwse-resize' },
];

const CORNER_HANDLES: HandlePosition[] = ['nw', 'ne', 'sw', 'se'];

/* ──────────────────────────────────────────────
   Styles
   ────────────────────────────────────────────── */
const EDITOR_CSS = `
[contenteditable] { caret-color: #1a1a1a !important; cursor: text; overflow-wrap: break-word; word-wrap: break-word; }
[contenteditable] img { cursor: pointer; transition: outline 0.15s; border-radius: 4px; max-width: 100%; height: auto; }
[contenteditable] * { max-width: 100%; box-sizing: border-box; }
[contenteditable] img:hover { outline: 2px solid #3b82f6; outline-offset: 2px; }
[contenteditable] div[contenteditable="false"] { cursor: pointer; transition: outline 0.15s; border-radius: 4px; }
[contenteditable] div[contenteditable="false"]:hover { outline: 2px solid #3b82f6; outline-offset: 2px; }
[contenteditable]:empty::before { content: '글감과 함께 나의 일상을 기록해보세요!'; color: #c0c5ca; pointer-events: none; }
@keyframes spin { to { transform: rotate(360deg); } }
.img-row { display: flex; gap: 8px; align-items: flex-start; flex-wrap: wrap; margin: 8px 0; }
.img-row img { flex: 1 1 auto; min-width: 80px; }
.text-overlay-wrapper { position: relative; display: inline-block; }
.text-overlay { position: absolute; padding: 4px 8px; cursor: move; user-select: none; background: rgba(0,0,0,0.45); color: #fff; border-radius: 4px; font-size: 16px; min-width: 40px; min-height: 24px; }
.text-overlay:focus { outline: 2px solid #3b82f6; }
.text-overlay-toolbar { position: absolute; display: flex; gap: 4px; background: #222; border-radius: 6px; padding: 4px 8px; z-index: 100; }
.text-overlay-toolbar button { background: none; border: none; color: #fff; cursor: pointer; font-size: 13px; padding: 2px 6px; border-radius: 4px; }
.text-overlay-toolbar button:hover { background: #444; }
`;

const GOOGLE_FONTS_URL =
  'https://fonts.googleapis.com/css2?family=Nanum+Gothic:wght@400;700&family=Nanum+Myeongjo:wght@400;700&family=Gothic+A1:wght@400;700&family=Noto+Sans+KR:wght@400;700&family=Noto+Serif+KR:wght@400;700&display=swap';

/* ──────────────────────────────────────────────
   Helpers
   ────────────────────────────────────────────── */
function extractYoutubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
    /^([a-zA-Z0-9_-]{11})$/,
  ];
  for (const p of patterns) {
    const m = url.trim().match(p);
    if (m) return m[1];
  }
  return null;
}

function getHandleXY(
  pos: HandlePosition,
  imgLeft: number,
  imgTop: number,
  w: number,
  h: number,
) {
  const half = HANDLE_SIZE / 2;
  const map: Record<HandlePosition, { x: number; y: number }> = {
    nw: { x: imgLeft - half, y: imgTop - half },
    n:  { x: imgLeft + w / 2 - half, y: imgTop - half },
    ne: { x: imgLeft + w - half, y: imgTop - half },
    w:  { x: imgLeft - half, y: imgTop + h / 2 - half },
    e:  { x: imgLeft + w - half, y: imgTop + h / 2 - half },
    sw: { x: imgLeft - half, y: imgTop + h - half },
    s:  { x: imgLeft + w / 2 - half, y: imgTop + h - half },
    se: { x: imgLeft + w - half, y: imgTop + h - half },
  };
  return map[pos];
}

/* ──────────────────────────────────────────────
   Component
   ────────────────────────────────────────────── */
function NaverRichTextEditor(
  { value, onChange, onImageSelect }: Props,
  ref: React.Ref<NaverEditorRef>,
) {
  const editorRef = useRef<HTMLDivElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Image selection / resize
  const [selectedImg, setSelectedImg] = useState<HTMLImageElement | null>(null);
  const [, forceRender] = useState(0);
  const resizingRef = useRef<{
    handle: HandlePosition;
    startX: number;
    startY: number;
    origW: number;
    origH: number;
    aspect: number;
  } | null>(null);

  // Upload status
  const [uploadStatus, setUploadStatus] = useState('');

  // YouTube modal
  const [showYoutubeModal, setShowYoutubeModal] = useState(false);
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [youtubeError, setYoutubeError] = useState('');
  const [youtubePreviewId, setYoutubePreviewId] = useState<string | null>(null);

  // Drag reorder
  const dragRef = useRef<{
    img: HTMLImageElement;
    ghost: HTMLDivElement | null;
    indicator: HTMLDivElement | null;
    startX: number;
    startY: number;
    dragging: boolean;
  } | null>(null);

  // Text overlay drag
  const overlayDragRef = useRef<{
    el: HTMLElement;
    startX: number;
    startY: number;
    origLeft: number;
    origTop: number;
  } | null>(null);

  /* ── Internal change flag (prevents value→editor re-sync loop) ── */
  const isInternalChange = useRef(false);

  /* ── Sync content → parent ── */
  const syncContent = useCallback(() => {
    if (editorRef.current) {
      isInternalChange.current = true;
      onChange(editorRef.current.innerHTML);
    }
  }, [onChange]);

  /* ── Imperative handle ── */
  useImperativeHandle(ref, () => ({
    getEditorElement: () => editorRef.current,
    syncContent,
    exec: (command: string, val?: string) => {
      document.execCommand(command, false, val);
      syncContent();
    },
    insertStyledSpan: (styles: Partial<CSSStyleDeclaration>) => {
      const sel = window.getSelection();
      if (!sel || sel.rangeCount === 0) return;
      const range = sel.getRangeAt(0);
      const span = document.createElement('span');
      Object.assign(span.style, styles);
      try {
        range.surroundContents(span);
      } catch {
        span.appendChild(range.extractContents());
        range.insertNode(span);
      }
      sel.removeAllRanges();
      const newRange = document.createRange();
      newRange.selectNodeContents(span);
      newRange.collapse(false);
      sel.addRange(newRange);
      syncContent();
    },
    handleHeading: (tag: string) => {
      if (tag === 'p') {
        document.execCommand('formatBlock', false, 'p');
      } else {
        document.execCommand('formatBlock', false, tag);
      }
      syncContent();
    },
    insertHTML: (html: string) => {
      editorRef.current?.focus();
      document.execCommand('insertHTML', false, html);
      syncContent();
    },
    focus: () => {
      editorRef.current?.focus();
    },
  }));

  /* ── Sync external value into editor ── */
  useEffect(() => {
    if (isInternalChange.current) {
      isInternalChange.current = false;
      return;
    }
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value;
    }
  }, [value]);

  /* ── Force overlay re-render (used after resize/align/scroll) ── */
  const refreshOverlay = useCallback(() => {
    forceRender((n) => n + 1);
  }, []);

  /* ── Track overlay position with RAF loop while image is selected ── */
  const lastImgRectRef = useRef('');
  useEffect(() => {
    if (!selectedImg) return;
    let rafId = 0;
    const tick = () => {
      if (!selectedImg.isConnected) return;
      const r = selectedImg.getBoundingClientRect();
      const key = `${r.top.toFixed(0)},${r.left.toFixed(0)},${r.width.toFixed(0)},${r.height.toFixed(0)}`;
      if (key !== lastImgRectRef.current) {
        lastImgRectRef.current = key;
        forceRender((n) => n + 1);
      }
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [selectedImg]);

  /* ── Deselect image if it's removed from the DOM ── */
  useEffect(() => {
    if (!selectedImg || !editorRef.current) return;
    const observer = new MutationObserver(() => {
      if (!selectedImg.isConnected) {
        setSelectedImg(null);
        onImageSelect?.(null);
      }
    });
    observer.observe(editorRef.current, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [selectedImg, onImageSelect]);

  /* ── Click handler — image select / deselect ── */
  const handleEditorClick = useCallback(
    (e: React.MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'IMG') {
        const img = target as HTMLImageElement;
        setSelectedImg(img);
        onImageSelect?.(img);
      } else {
        if (selectedImg) {
          setSelectedImg(null);
          onImageSelect?.(null);
        }
      }
    },
    [selectedImg, onImageSelect],
  );

  /* ── Mouse down on editor for drag reorder ── */
  const handleEditorMouseDown = useCallback((e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.tagName !== 'IMG') return;
    const img = target as HTMLImageElement;
    dragRef.current = {
      img,
      ghost: null,
      indicator: null,
      startX: e.clientX,
      startY: e.clientY,
      dragging: false,
    };
  }, []);

  /* ── Global mouse move / up for drag reorder ── */
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      // Text overlay drag
      if (overlayDragRef.current) {
        const { el, startX, startY, origLeft, origTop } = overlayDragRef.current;
        el.style.left = `${origLeft + (e.clientX - startX)}px`;
        el.style.top = `${origTop + (e.clientY - startY)}px`;
        return;
      }

      // Image resize
      if (resizingRef.current && selectedImg) {
        const { handle, startX, startY, origW, origH, aspect } = resizingRef.current;
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
        let newW = origW;
        let newH = origH;

        const isCorner = CORNER_HANDLES.includes(handle);

        if (handle.includes('e')) newW = origW + dx;
        if (handle.includes('w')) newW = origW - dx;
        if (handle.includes('s')) newH = origH + dy;
        if (handle.includes('n')) newH = origH - dy;

        if (newW < 40) newW = 40;
        if (newH < 40) newH = 40;

        if (isCorner) {
          newH = newW / aspect;
        }

        selectedImg.style.width = `${Math.round(newW)}px`;
        selectedImg.style.height = `${Math.round(newH)}px`;
        selectedImg.removeAttribute('width');
        selectedImg.removeAttribute('height');
        refreshOverlay();
        return;
      }

      // Image drag reorder
      if (!dragRef.current) return;
      const drag = dragRef.current;
      const dist = Math.hypot(e.clientX - drag.startX, e.clientY - drag.startY);
      if (!drag.dragging && dist < 8) return;

      if (!drag.dragging) {
        drag.dragging = true;
        // Create ghost
        const ghost = document.createElement('div');
        ghost.style.cssText =
          'position:fixed;pointer-events:none;z-index:9999;opacity:0.7;border:2px solid #3b82f6;border-radius:4px;overflow:hidden;';
        const clone = drag.img.cloneNode(true) as HTMLImageElement;
        clone.style.width = '80px';
        clone.style.height = 'auto';
        ghost.appendChild(clone);
        document.body.appendChild(ghost);
        drag.ghost = ghost;

        // Create indicator
        const ind = document.createElement('div');
        ind.style.cssText =
          'position:fixed;pointer-events:none;z-index:9998;background:#3b82f6;border-radius:2px;display:none;';
        document.body.appendChild(ind);
        drag.indicator = ind;
      }

      // Move ghost
      if (drag.ghost) {
        drag.ghost.style.left = `${e.clientX + 12}px`;
        drag.ghost.style.top = `${e.clientY + 12}px`;
      }

      // Find drop target
      if (drag.indicator && editorRef.current) {
        drag.indicator.style.display = 'none';
        const imgs = editorRef.current.querySelectorAll('img');
        for (const img of imgs) {
          if (img === drag.img) continue;
          const r = img.getBoundingClientRect();
          // Beside image — vertical indicator
          if (
            e.clientY >= r.top &&
            e.clientY <= r.bottom
          ) {
            if (Math.abs(e.clientX - r.left) < 20) {
              drag.indicator.style.cssText = `position:fixed;pointer-events:none;z-index:9998;background:#3b82f6;border-radius:2px;display:block;width:3px;height:${r.height}px;left:${r.left - 4}px;top:${r.top}px;`;
              break;
            }
            if (Math.abs(e.clientX - r.right) < 20) {
              drag.indicator.style.cssText = `position:fixed;pointer-events:none;z-index:9998;background:#3b82f6;border-radius:2px;display:block;width:3px;height:${r.height}px;left:${r.right + 1}px;top:${r.top}px;`;
              break;
            }
          }
          // Between blocks — horizontal indicator
          if (e.clientX >= r.left && e.clientX <= r.right) {
            if (Math.abs(e.clientY - r.top) < 16) {
              drag.indicator.style.cssText = `position:fixed;pointer-events:none;z-index:9998;background:#d4a017;border-radius:2px;display:block;width:${r.width}px;height:3px;left:${r.left}px;top:${r.top - 4}px;`;
              break;
            }
            if (Math.abs(e.clientY - r.bottom) < 16) {
              drag.indicator.style.cssText = `position:fixed;pointer-events:none;z-index:9998;background:#d4a017;border-radius:2px;display:block;width:${r.width}px;height:3px;left:${r.left}px;top:${r.bottom + 1}px;`;
              break;
            }
          }
        }
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      // Text overlay drag end
      if (overlayDragRef.current) {
        overlayDragRef.current = null;
        syncContent();
        return;
      }

      // Resize end
      if (resizingRef.current) {
        resizingRef.current = null;
        syncContent();
        return;
      }

      // Drag reorder end
      if (!dragRef.current) return;
      const drag = dragRef.current;

      if (drag.ghost) {
        document.body.removeChild(drag.ghost);
      }
      if (drag.indicator) {
        document.body.removeChild(drag.indicator);
      }

      if (drag.dragging && editorRef.current) {
        // Find drop target
        const imgs = editorRef.current.querySelectorAll('img');
        for (const img of imgs) {
          if (img === drag.img) continue;
          const r = img.getBoundingClientRect();

          // Drop beside → create flex row
          if (e.clientY >= r.top && e.clientY <= r.bottom) {
            const nearLeft = Math.abs(e.clientX - r.left) < 20;
            const nearRight = Math.abs(e.clientX - r.right) < 20;
            if (nearLeft || nearRight) {
              drag.img.parentNode?.removeChild(drag.img);
              let row = img.parentElement;
              if (!row || !row.classList.contains('img-row')) {
                row = document.createElement('div');
                row.className = 'img-row';
                row.setAttribute('contenteditable', 'false');
                img.parentNode?.insertBefore(row, img);
                row.appendChild(img);
              }
              if (nearLeft) {
                row.insertBefore(drag.img, img);
              } else {
                if (img.nextSibling) {
                  row.insertBefore(drag.img, img.nextSibling);
                } else {
                  row.appendChild(drag.img);
                }
              }
              syncContent();
              break;
            }
          }

          // Drop above/below → reorder blocks
          if (e.clientX >= r.left && e.clientX <= r.right) {
            const above = Math.abs(e.clientY - r.top) < 16;
            const below = Math.abs(e.clientY - r.bottom) < 16;
            if (above || below) {
              drag.img.parentNode?.removeChild(drag.img);
              const target = img.closest('.img-row') || img;
              const parent = target.parentNode;
              if (above) {
                parent?.insertBefore(drag.img, target);
              } else {
                if (target.nextSibling) {
                  parent?.insertBefore(drag.img, target.nextSibling);
                } else {
                  parent?.appendChild(drag.img);
                }
              }
              syncContent();
              break;
            }
          }
        }
      }

      dragRef.current = null;
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      // Cleanup any leaked drag elements
      if (dragRef.current) {
        if (dragRef.current.ghost?.parentNode) dragRef.current.ghost.remove();
        if (dragRef.current.indicator?.parentNode) dragRef.current.indicator.remove();
        dragRef.current = null;
      }
    };
  }, [selectedImg, refreshOverlay, syncContent]);

  /* ── Paste handler ── */
  const handlePaste = useCallback(
    async (e: React.ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      // 1. Check for image file in clipboard (screenshot, copied file)
      for (const item of items) {
        if (item.type.startsWith('image/')) {
          e.preventDefault();
          const file = item.getAsFile();
          if (!file) continue;
          try {
            const result = await uploadImage(file, setUploadStatus);
            if (result?.url) {
              editorRef.current?.focus();
              document.execCommand(
                'insertHTML',
                false,
                `<img src="${result.url}" style="max-width:100%;border-radius:4px;" /><br/>`,
              );
              syncContent();
            }
          } catch (err) {
            console.error('Paste upload failed:', err);
            setUploadStatus('');
          }
          return;
        }
      }

      // 2. Check for HTML content with images (copy image from editor/browser)
      const html = e.clipboardData?.getData('text/html');
      if (html) {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = html;
        const imgs = tempDiv.querySelectorAll('img');
        if (imgs.length > 0) {
          e.preventDefault();
          // Re-upload external images, keep Sanity images as-is
          for (const img of imgs) {
            const src = img.getAttribute('src') || '';
            if (src.startsWith('data:')) {
              // Data URL → convert to blob and upload
              try {
                const res = await fetch(src);
                const blob = await res.blob();
                const file = new File([blob], 'pasted-image.png', { type: blob.type });
                const result = await uploadImage(file, setUploadStatus);
                if (result?.url) img.setAttribute('src', result.url);
              } catch { /* keep original */ }
            }
            // Ensure styling
            img.style.maxWidth = '100%';
            img.style.borderRadius = '4px';
            img.removeAttribute('width');
            img.removeAttribute('height');
            img.removeAttribute('class');
          }
          // Clean up: remove scripts, iframes (security), keep only safe content
          tempDiv.querySelectorAll('script,iframe,object,embed').forEach(el => el.remove());
          editorRef.current?.focus();
          document.execCommand('insertHTML', false, tempDiv.innerHTML);
          syncContent();
          return;
        }
      }
    },
    [syncContent],
  );

  /* ── Image file input change ── */
  const handleImageFiles = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files) return;
      for (const file of files) {
        try {
          const result = await uploadImage(file, setUploadStatus);
          if (result?.url) {
            editorRef.current?.focus();
            document.execCommand(
              'insertHTML',
              false,
              `<img src="${result.url}" style="max-width:100%;border-radius:4px;" /><br/>`,
            );
            syncContent();
          }
        } catch (err) {
          console.error('Image upload failed:', err);
          setUploadStatus('');
        }
      }
      e.target.value = '';
    },
    [syncContent],
  );

  /* ── Video file input change ── */
  const handleVideoFile = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      try {
        setUploadStatus('비디오 업로드 중...');
        const result = await uploadFile(file);
        if (result?.url) {
          editorRef.current?.focus();
          document.execCommand(
            'insertHTML',
            false,
            `<div contenteditable="false" style="margin:12px 0;"><video controls style="max-width:100%;border-radius:4px;" src="${result.url}"></video></div><br/>`,
          );
          syncContent();
        }
        setUploadStatus('');
      } catch (err) {
        console.error('Video upload failed:', err);
        setUploadStatus('');
      }
      e.target.value = '';
    },
    [syncContent],
  );

  /* ── File upload input change ── */
  const handleFileUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      try {
        setUploadStatus('파일 업로드 중...');
        const result = await uploadFile(file);
        if (result?.url) {
          editorRef.current?.focus();
          const sizeStr =
            file.size > 1024 * 1024
              ? `${(file.size / (1024 * 1024)).toFixed(1)}MB`
              : `${(file.size / 1024).toFixed(0)}KB`;
          document.execCommand(
            'insertHTML',
            false,
            `<div contenteditable="false" style="margin:8px 0;padding:12px 16px;background:#f8f9fa;border:1px solid #e0e0e0;border-radius:8px;display:inline-flex;align-items:center;gap:8px;">
              <span style="font-size:20px;">📎</span>
              <a href="${result.url}" target="_blank" rel="noopener noreferrer" style="color:#3b82f6;text-decoration:none;font-weight:500;">${file.name}</a>
              <span style="color:#999;font-size:13px;">(${sizeStr})</span>
            </div><br/>`,
          );
          syncContent();
        }
        setUploadStatus('');
      } catch (err) {
        console.error('File upload failed:', err);
        setUploadStatus('');
      }
      e.target.value = '';
    },
    [syncContent],
  );

  /* ── Image toolbar actions ── */
  const alignImage = useCallback(
    (align: 'left' | 'center' | 'right') => {
      if (!selectedImg) return;
      const wrapper = selectedImg.closest('.text-overlay-wrapper') || selectedImg;
      const parent = wrapper.parentElement;
      if (!parent) return;

      if (align === 'center') {
        (wrapper as HTMLElement).style.display = 'block';
        (wrapper as HTMLElement).style.marginLeft = 'auto';
        (wrapper as HTMLElement).style.marginRight = 'auto';
        (wrapper as HTMLElement).style.textAlign = 'center';
        if (wrapper === selectedImg) {
          selectedImg.style.display = 'block';
          selectedImg.style.marginLeft = 'auto';
          selectedImg.style.marginRight = 'auto';
        }
      } else if (align === 'left') {
        (wrapper as HTMLElement).style.display = '';
        (wrapper as HTMLElement).style.marginLeft = '';
        (wrapper as HTMLElement).style.marginRight = '';
        (wrapper as HTMLElement).style.textAlign = '';
        if (wrapper === selectedImg) {
          selectedImg.style.display = '';
          selectedImg.style.marginLeft = '';
          selectedImg.style.marginRight = '';
        }
      } else {
        (wrapper as HTMLElement).style.display = 'block';
        (wrapper as HTMLElement).style.marginLeft = 'auto';
        (wrapper as HTMLElement).style.marginRight = '0';
        (wrapper as HTMLElement).style.textAlign = 'right';
        if (wrapper === selectedImg) {
          selectedImg.style.display = 'block';
          selectedImg.style.marginLeft = 'auto';
          selectedImg.style.marginRight = '0';
        }
      }
      refreshOverlay();
      syncContent();
    },
    [selectedImg, syncContent, refreshOverlay],
  );

  const rotateImage = useCallback(
    (dir: 'left' | 'right') => {
      if (!selectedImg) return;
      const current = selectedImg.style.transform || '';
      const match = current.match(/rotate\((-?\d+)deg\)/);
      const currentDeg = match ? parseInt(match[1]) : 0;
      const newDeg = dir === 'left' ? currentDeg - 90 : currentDeg + 90;
      selectedImg.style.transform = `rotate(${newDeg}deg)`;
      refreshOverlay();
      syncContent();
    },
    [selectedImg, syncContent, refreshOverlay],
  );

  const deleteImage = useCallback(() => {
    if (!selectedImg) return;
    const wrapper = selectedImg.closest('.text-overlay-wrapper');
    const toRemove = wrapper || selectedImg;
    // If in img-row with only 2 images, unwrap the row
    const row = toRemove.parentElement;
    if (row && row.classList.contains('img-row')) {
      toRemove.remove();
      const remaining = row.querySelectorAll('img');
      if (remaining.length <= 1 && row.parentNode) {
        while (row.firstChild) {
          row.parentNode.insertBefore(row.firstChild, row);
        }
        row.remove();
      }
    } else {
      toRemove.remove();
    }
    setSelectedImg(null);
    onImageSelect?.(null);
    syncContent();
  }, [selectedImg, onImageSelect, syncContent]);

  /* ── Keyboard delete for selected image ── */
  useEffect(() => {
    if (!selectedImg) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        // Don't intercept if user is typing in an input/textarea
        const active = document.activeElement;
        if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA')) return;
        e.preventDefault();
        deleteImage();
      } else if (e.key === 'Escape') {
        setSelectedImg(null);
        onImageSelect?.(null);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectedImg, deleteImage, onImageSelect]);

  /* ── Clean up orphan img-row containers ── */
  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;
    const cleanup = () => {
      const rows = editor.querySelectorAll('.img-row');
      rows.forEach(row => {
        const imgs = row.querySelectorAll('img');
        if (imgs.length === 0) {
          // Empty row — remove it
          row.remove();
        } else if (imgs.length === 1) {
          // Single image in row — unwrap
          const parent = row.parentNode;
          if (parent) {
            while (row.firstChild) parent.insertBefore(row.firstChild, row);
            row.remove();
          }
        }
      });
    };
    const observer = new MutationObserver(cleanup);
    observer.observe(editor, { childList: true, subtree: true });
    // Run once on mount
    cleanup();
    return () => observer.disconnect();
  }, []);

  const addTextOverlay = useCallback(() => {
    if (!selectedImg) return;
    // Already wrapped?
    if (selectedImg.closest('.text-overlay-wrapper')) {
      // Add another overlay
      const wrapper = selectedImg.closest('.text-overlay-wrapper')!;
      const overlay = document.createElement('div');
      overlay.className = 'text-overlay';
      overlay.contentEditable = 'true';
      overlay.style.left = '20px';
      overlay.style.top = '20px';
      overlay.textContent = '텍스트 입력';
      wrapper.appendChild(overlay);
    } else {
      // Wrap image
      const wrapper = document.createElement('div');
      wrapper.className = 'text-overlay-wrapper';
      wrapper.contentEditable = 'false';
      selectedImg.parentNode?.insertBefore(wrapper, selectedImg);
      wrapper.appendChild(selectedImg);

      const overlay = document.createElement('div');
      overlay.className = 'text-overlay';
      overlay.contentEditable = 'true';
      overlay.style.left = '20px';
      overlay.style.top = '20px';
      overlay.textContent = '텍스트 입력';
      wrapper.appendChild(overlay);
    }
    syncContent();
  }, [selectedImg, syncContent]);

  /* ── Text overlay interactions ── */
  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;

    const handleOverlayMouseDown = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.classList.contains('text-overlay')) return;
      if ((e.target as HTMLElement).closest('.text-overlay-toolbar')) return;
      e.preventDefault();
      overlayDragRef.current = {
        el: target,
        startX: e.clientX,
        startY: e.clientY,
        origLeft: parseInt(target.style.left || '0'),
        origTop: parseInt(target.style.top || '0'),
      };
    };

    editor.addEventListener('mousedown', handleOverlayMouseDown);
    return () => {
      editor.removeEventListener('mousedown', handleOverlayMouseDown);
    };
  }, []);

  /* ── Resize handle mouse down ── */
  const handleResizeStart = useCallback(
    (handle: HandlePosition, e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (!selectedImg) return;
      resizingRef.current = {
        handle,
        startX: e.clientX,
        startY: e.clientY,
        origW: selectedImg.offsetWidth,
        origH: selectedImg.offsetHeight,
        aspect: selectedImg.offsetWidth / selectedImg.offsetHeight,
      };
    },
    [selectedImg],
  );

  /* ── YouTube modal ── */
  const handleYoutubeUrlChange = useCallback((url: string) => {
    setYoutubeUrl(url);
    setYoutubeError('');
    const id = extractYoutubeId(url);
    setYoutubePreviewId(id);
    if (url.trim() && !id) {
      setYoutubeError('유효한 YouTube URL을 입력하세요.');
    }
  }, []);

  const insertYoutube = useCallback(() => {
    if (!youtubePreviewId) {
      setYoutubeError('유효한 YouTube URL을 입력하세요.');
      return;
    }
    editorRef.current?.focus();
    document.execCommand(
      'insertHTML',
      false,
      `<div contenteditable="false" style="margin:16px 0;text-align:center;">
        <iframe width="560" height="315" src="https://www.youtube.com/embed/${youtubePreviewId}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen style="max-width:100%;border-radius:8px;"></iframe>
      </div><br/>`,
    );
    syncContent();
    setShowYoutubeModal(false);
    setYoutubeUrl('');
    setYoutubePreviewId(null);
    setYoutubeError('');
  }, [youtubePreviewId, syncContent]);

  /* ── Expose file input triggers on window (so toolbar can trigger) ── */
  useEffect(() => {
    (window as any).__naverEditorImageInput = imageInputRef.current;
    (window as any).__naverEditorVideoInput = videoInputRef.current;
    (window as any).__naverEditorFileInput = fileInputRef.current;
    (window as any).__naverEditorShowYoutube = () => setShowYoutubeModal(true);
    return () => {
      delete (window as any).__naverEditorImageInput;
      delete (window as any).__naverEditorVideoInput;
      delete (window as any).__naverEditorFileInput;
      delete (window as any).__naverEditorShowYoutube;
    };
  }, []);

  /* ── Render helpers ── */
  const renderResizeOverlay = () => {
    if (!selectedImg || !editorRef.current) return null;
    if (!selectedImg.isConnected) return null;

    // Use getBoundingClientRect for fixed positioning — always accurate
    const imgR = selectedImg.getBoundingClientRect();
    const editorR = editorRef.current.getBoundingClientRect();

    // If image is scrolled out of the editor viewport, hide overlay
    if (imgR.bottom < editorR.top || imgR.top > editorR.bottom) return null;

    const left = imgR.left;
    const top = imgR.top;
    const w = imgR.width;
    const h = imgR.height;

    return (
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 50 }}>
        {/* Selection border */}
        <div
          style={{
            position: 'absolute',
            left: left - 2,
            top: top - 2,
            width: w + 4,
            height: h + 4,
            border: `2px solid ${HANDLE_COLOR}`,
            borderRadius: 4,
            pointerEvents: 'none',
          }}
        />

        {/* Resize handles */}
        {HANDLES.map(({ pos: hPos, cursor }) => {
          const xy = getHandleXY(hPos, left, top, w, h);
          return (
            <div
              key={hPos}
              style={{
                position: 'absolute',
                left: xy.x,
                top: xy.y,
                width: HANDLE_SIZE,
                height: HANDLE_SIZE,
                background: '#fff',
                border: `2px solid ${HANDLE_COLOR}`,
                borderRadius: 2,
                cursor,
                pointerEvents: 'auto',
                zIndex: 51,
              }}
              onMouseDown={(e) => handleResizeStart(hPos, e)}
            />
          );
        })}

        {/* Floating toolbar above image */}
        <div
          style={{
            position: 'absolute',
            left: left + w / 2,
            top: top - 44,
            transform: 'translateX(-50%)',
            display: 'flex',
            gap: 2,
            background: '#fff',
            border: '1px solid #e0e0e0',
            borderRadius: 8,
            boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
            padding: '4px 6px',
            pointerEvents: 'auto',
            zIndex: 52,
          }}
        >
          <button
            onClick={() => alignImage('left')}
            title="왼쪽 정렬"
            style={toolBtnStyle}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="15" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
          </button>
          <button
            onClick={() => alignImage('center')}
            title="가운데 정렬"
            style={toolBtnStyle}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="6" y1="12" x2="18" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
          </button>
          <button
            onClick={() => alignImage('right')}
            title="오른쪽 정렬"
            style={toolBtnStyle}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="9" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
          </button>
          <div style={{ width: 1, height: 20, background: '#e0e0e0', margin: '0 4px' }} />
          <button
            onClick={() => rotateImage('left')}
            title="왼쪽 회전"
            style={toolBtnStyle}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>
          </button>
          <button
            onClick={() => rotateImage('right')}
            title="오른쪽 회전"
            style={toolBtnStyle}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.13-9.36L23 10"/></svg>
          </button>
          <div style={{ width: 1, height: 20, background: '#e0e0e0', margin: '0 4px' }} />
          <button
            onClick={addTextOverlay}
            title="텍스트 오버레이"
            style={toolBtnStyle}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
          </button>
          <button
            onClick={deleteImage}
            title="삭제"
            style={{ ...toolBtnStyle, color: '#ef4444' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
          </button>
        </div>

        {/* Size display below image */}
        <div
          style={{
            position: 'absolute',
            left: left + w / 2,
            top: top + h + 6,
            transform: 'translateX(-50%)',
            background: 'rgba(0,0,0,0.7)',
            color: '#fff',
            padding: '2px 8px',
            borderRadius: 4,
            fontSize: 11,
            pointerEvents: 'none',
            whiteSpace: 'nowrap',
            zIndex: 52,
          }}
        >
          {Math.round(selectedImg.offsetWidth)} x {Math.round(selectedImg.offsetHeight)}
        </div>
      </div>
    );
  };

  /* ── YouTube modal ── */
  const renderYoutubeModal = () => {
    if (!showYoutubeModal) return null;
    return (
      <div
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000,
        }}
        onClick={() => setShowYoutubeModal(false)}
      >
        <div
          style={{
            background: '#fff',
            borderRadius: 12,
            padding: 24,
            width: 480,
            maxWidth: '90vw',
            boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <h3 style={{ margin: '0 0 16px', fontSize: 18, fontWeight: 700, color: '#1a1a1a' }}>
            YouTube 영상 삽입
          </h3>
          <input
            type="text"
            value={youtubeUrl}
            onChange={(e) => handleYoutubeUrlChange(e.target.value)}
            placeholder="YouTube URL을 입력하세요"
            style={{
              width: '100%',
              padding: '10px 14px',
              border: '1px solid #ddd',
              borderRadius: 8,
              fontSize: 14,
              outline: 'none',
              boxSizing: 'border-box',
            }}
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') insertYoutube();
            }}
          />
          {youtubeError && (
            <p style={{ color: '#ef4444', fontSize: 13, margin: '8px 0 0' }}>{youtubeError}</p>
          )}
          {youtubePreviewId && (
            <div style={{ margin: '16px 0', textAlign: 'center' }}>
              <img
                src={`https://img.youtube.com/vi/${youtubePreviewId}/mqdefault.jpg`}
                alt="YouTube preview"
                style={{ borderRadius: 8, maxWidth: '100%' }}
              />
            </div>
          )}
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16 }}>
            <button
              onClick={() => {
                setShowYoutubeModal(false);
                setYoutubeUrl('');
                setYoutubePreviewId(null);
                setYoutubeError('');
              }}
              style={{
                padding: '8px 16px',
                border: '1px solid #ddd',
                borderRadius: 8,
                background: '#fff',
                cursor: 'pointer',
                fontSize: 14,
                color: '#666',
              }}
            >
              취소
            </button>
            <button
              onClick={insertYoutube}
              disabled={!youtubePreviewId}
              style={{
                padding: '8px 16px',
                border: 'none',
                borderRadius: 8,
                background: youtubePreviewId ? '#3b82f6' : '#ccc',
                color: '#fff',
                cursor: youtubePreviewId ? 'pointer' : 'default',
                fontSize: 14,
                fontWeight: 600,
              }}
            >
              삽입
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
      {/* Google Fonts */}
      <link rel="stylesheet" href={GOOGLE_FONTS_URL} />

      {/* Editor CSS */}
      <style>{EDITOR_CSS}</style>

      {/* Upload status indicator */}
      {uploadStatus && (
        <div
          style={{
            padding: '8px 16px',
            background: '#eff6ff',
            borderBottom: '1px solid #bfdbfe',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            fontSize: 13,
            color: '#1d4ed8',
          }}
        >
          <div
            style={{
              width: 16,
              height: 16,
              border: '2px solid #3b82f6',
              borderTopColor: 'transparent',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
            }}
          />
          {uploadStatus}
        </div>
      )}

      {/* Editor wrapper */}
      <div ref={wrapperRef} style={{ position: 'relative', flex: 1, minHeight: 0 }}>
        {/* Upload overlay */}
        {uploadStatus && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(255,255,255,0.6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 100,
              borderRadius: 4,
            }}
          >
            <div
              style={{
                background: '#fff',
                padding: '16px 24px',
                borderRadius: 12,
                boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
              }}
            >
              <div
                style={{
                  width: 24,
                  height: 24,
                  border: '3px solid #3b82f6',
                  borderTopColor: 'transparent',
                  borderRadius: '50%',
                  animation: 'spin 0.8s linear infinite',
                }}
              />
              <span style={{ fontSize: 14, color: '#333', fontWeight: 500 }}>{uploadStatus}</span>
            </div>
          </div>
        )}

        {/* ContentEditable div */}
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          onClick={handleEditorClick}
          onMouseDown={handleEditorMouseDown}
          onPaste={handlePaste}
          onInput={syncContent}
          onKeyUp={syncContent}
          style={{
            padding: '24px 48px',
            fontSize: 16,
            lineHeight: 1.8,
            fontFamily: '"Nanum Gothic", sans-serif',
            color: '#333',
            border: 'none',
            outline: 'none',
            flex: 1,
            overflowY: 'auto',
            minHeight: 400,
            wordBreak: 'break-word',
            maxWidth: '100%',
          }}
        />

        {/* Image resize overlay */}
        {renderResizeOverlay()}
      </div>

      {/* Hidden file inputs */}
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        multiple
        style={{ display: 'none' }}
        onChange={handleImageFiles}
      />
      <input
        ref={videoInputRef}
        type="file"
        accept="video/*"
        style={{ display: 'none' }}
        onChange={handleVideoFile}
      />
      <input
        ref={fileInputRef}
        type="file"
        style={{ display: 'none' }}
        onChange={handleFileUpload}
      />

      {/* YouTube modal */}
      {renderYoutubeModal()}
    </div>
  );
}

/* ── Toolbar button style ── */
const toolBtnStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  padding: '4px 6px',
  borderRadius: 4,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: '#555',
  transition: 'background 0.15s',
};

export default forwardRef<NaverEditorRef, Props>(NaverRichTextEditor);
