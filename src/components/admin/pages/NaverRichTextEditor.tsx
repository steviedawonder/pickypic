import React, {
  useRef,
  useState,
  useEffect,
  useCallback,
  useImperativeHandle,
  forwardRef,
} from 'react';
import { uploadImage, uploadFile } from '../adminClient';
import ImageLayoutPickerModal from './ImageLayoutPickerModal';
import {
  buildCollageHtml,
  buildFigureHtml,
  measureAspectRatio,
  COLLAGE_CSS,
  type CollageImage,
} from '../shared/collageLayout';

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
.img-collage-wrapper, .img-figure-wrapper { position: relative; }
.img-collage { overflow: hidden; }
.img-collage img { display: block; }
.img-collage-wrapper img, .img-figure-wrapper img { cursor: pointer; }
.img-caption { text-align: center; font-size: 13px; color: #888; padding: 8px 4px; min-height: 1em; }
.img-caption:empty::before { content: attr(data-placeholder); color: #bbb; pointer-events: none; }
.img-caption:focus { outline: none; color: #555; }
.naver-img-toolbar button:hover { background: #f3f4f6 !important; }
.naver-img-toolbar button[aria-pressed="true"] { background: #e0e7ff !important; color: #3b82f6 !important; }
.naver-img-toolbar button[aria-pressed="true"]:hover { background: #c7d2fe !important; }
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
  const selectedImgRef = useRef<HTMLImageElement | null>(null);
  useEffect(() => { selectedImgRef.current = selectedImg; }, [selectedImg]);
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

  // Image layout picker modal (multi-image upload)
  const [showLayoutPicker, setShowLayoutPicker] = useState(false);
  const [pendingImages, setPendingImages] = useState<CollageImage[]>([]);

  // Drag reorder
  const dragRef = useRef<{
    img: HTMLImageElement;
    ghost: HTMLDivElement | null;
    indicator: HTMLDivElement | null;
    startX: number;
    startY: number;
    dragging: boolean;
    lastClientX: number;
    lastClientY: number;
    scroller: HTMLElement | Window;
    autoScrollRaf: number;
    autoScrollDir: number; // -1 up, 0 none, 1 down
  } | null>(null);

  // Latest syncContent/refreshOverlay refs (mount-only drag effect reads from these)
  const syncContentRef = useRef<() => void>(() => {});
  const refreshOverlayRef = useRef<() => void>(() => {});

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

  /* ── Keep latest refs in sync (for mount-only drag effect) ── */
  useEffect(() => {
    syncContentRef.current = syncContent;
    refreshOverlayRef.current = refreshOverlay;
  });

  /* ── Find the nearest scrollable ancestor (or window) ── */
  const findScrollable = useCallback((node: HTMLElement | null): HTMLElement | Window => {
    let el: HTMLElement | null = node;
    while (el) {
      const cs = getComputedStyle(el);
      const oy = cs.overflowY;
      if ((oy === 'auto' || oy === 'scroll') && el.scrollHeight > el.clientHeight + 1) {
        return el;
      }
      el = el.parentElement;
    }
    return window;
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
    // Clean up any stray ghost/indicator from a previous aborted drag
    document
      .querySelectorAll<HTMLElement>('[data-dnd-ghost="1"],[data-dnd-indicator="1"]')
      .forEach((n) => n.remove());
    dragRef.current = {
      img,
      ghost: null,
      indicator: null,
      startX: e.clientX,
      startY: e.clientY,
      dragging: false,
      lastClientX: e.clientX,
      lastClientY: e.clientY,
      scroller: findScrollable(img.parentElement),
      autoScrollRaf: 0,
      autoScrollDir: 0,
    };
  }, [findScrollable]);

  /* ── Global mouse move / up for drag reorder (mount-only, refs for state) ── */
  useEffect(() => {
    const AUTO_SCROLL_EDGE = 60; // px from viewport edge that triggers auto-scroll
    const AUTO_SCROLL_SPEED = 14; // px per frame

    const stopAutoScroll = () => {
      const drag = dragRef.current;
      if (!drag) return;
      if (drag.autoScrollRaf) {
        cancelAnimationFrame(drag.autoScrollRaf);
        drag.autoScrollRaf = 0;
      }
      drag.autoScrollDir = 0;
    };

    const startAutoScroll = (dir: number) => {
      const drag = dragRef.current;
      if (!drag) return;
      if (drag.autoScrollDir === dir) return;
      stopAutoScroll();
      drag.autoScrollDir = dir;
      const tick = () => {
        const d = dragRef.current;
        if (!d || d.autoScrollDir === 0) return;
        const sc = d.scroller;
        if (sc === window) {
          window.scrollBy(0, AUTO_SCROLL_SPEED * d.autoScrollDir);
        } else {
          (sc as HTMLElement).scrollTop += AUTO_SCROLL_SPEED * d.autoScrollDir;
        }
        // After scrolling, recompute indicator at the unchanged cursor viewport position
        updateGhostAndIndicator(d.lastClientX, d.lastClientY);
        d.autoScrollRaf = requestAnimationFrame(tick);
      };
      drag.autoScrollRaf = requestAnimationFrame(tick);
    };

    const updateGhostAndIndicator = (clientX: number, clientY: number) => {
      const drag = dragRef.current;
      if (!drag || !drag.dragging) return;
      if (drag.ghost) {
        drag.ghost.style.left = `${clientX + 12}px`;
        drag.ghost.style.top = `${clientY + 12}px`;
      }
      if (drag.indicator && editorRef.current) {
        drag.indicator.style.display = 'none';
        const imgs = editorRef.current.querySelectorAll('img');
        for (const img of imgs) {
          if (img === drag.img) continue;
          const r = img.getBoundingClientRect();
          if (clientY >= r.top && clientY <= r.bottom) {
            if (Math.abs(clientX - r.left) < 40) {
              drag.indicator.style.cssText = `position:fixed;pointer-events:none;z-index:9998;background:#3b82f6;border-radius:2px;display:block;width:3px;height:${r.height}px;left:${r.left - 4}px;top:${r.top}px;`;
              drag.indicator.setAttribute('data-dnd-indicator', '1');
              break;
            }
            if (Math.abs(clientX - r.right) < 40) {
              drag.indicator.style.cssText = `position:fixed;pointer-events:none;z-index:9998;background:#3b82f6;border-radius:2px;display:block;width:3px;height:${r.height}px;left:${r.right + 1}px;top:${r.top}px;`;
              drag.indicator.setAttribute('data-dnd-indicator', '1');
              break;
            }
          }
          if (clientX >= r.left && clientX <= r.right) {
            if (Math.abs(clientY - r.top) < 16) {
              drag.indicator.style.cssText = `position:fixed;pointer-events:none;z-index:9998;background:#d4a017;border-radius:2px;display:block;width:${r.width}px;height:3px;left:${r.left}px;top:${r.top - 4}px;`;
              drag.indicator.setAttribute('data-dnd-indicator', '1');
              break;
            }
            if (Math.abs(clientY - r.bottom) < 16) {
              drag.indicator.style.cssText = `position:fixed;pointer-events:none;z-index:9998;background:#d4a017;border-radius:2px;display:block;width:${r.width}px;height:3px;left:${r.left}px;top:${r.bottom + 1}px;`;
              drag.indicator.setAttribute('data-dnd-indicator', '1');
              break;
            }
          }
        }
      }
    };

    const handleScrollDuringDrag = () => {
      const drag = dragRef.current;
      if (!drag || !drag.dragging) return;
      // Cursor stayed at same viewport position; recompute indicator vs new target rects
      updateGhostAndIndicator(drag.lastClientX, drag.lastClientY);
    };

    const handleMouseMove = (e: MouseEvent) => {
      // Text overlay drag
      if (overlayDragRef.current) {
        const { el, startX, startY, origLeft, origTop } = overlayDragRef.current;
        el.style.left = `${origLeft + (e.clientX - startX)}px`;
        el.style.top = `${origTop + (e.clientY - startY)}px`;
        return;
      }

      // Image resize
      const selectedImgNow = selectedImgRef.current;
      if (resizingRef.current && selectedImgNow) {
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

        selectedImgNow.style.width = `${Math.round(newW)}px`;
        selectedImgNow.style.height = `${Math.round(newH)}px`;
        selectedImgNow.removeAttribute('width');
        selectedImgNow.removeAttribute('height');
        refreshOverlayRef.current();
        return;
      }

      // Image drag reorder
      if (!dragRef.current) return;
      const drag = dragRef.current;
      drag.lastClientX = e.clientX;
      drag.lastClientY = e.clientY;
      const dist = Math.hypot(e.clientX - drag.startX, e.clientY - drag.startY);
      if (!drag.dragging && dist < 8) return;

      if (!drag.dragging) {
        drag.dragging = true;
        // Create ghost
        const ghost = document.createElement('div');
        ghost.setAttribute('data-dnd-ghost', '1');
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
        ind.setAttribute('data-dnd-indicator', '1');
        ind.style.cssText =
          'position:fixed;pointer-events:none;z-index:9998;background:#3b82f6;border-radius:2px;display:none;';
        document.body.appendChild(ind);
        drag.indicator = ind;
      }

      updateGhostAndIndicator(e.clientX, e.clientY);

      // Auto-scroll when near viewport edges
      const winH = window.innerHeight;
      if (e.clientY < AUTO_SCROLL_EDGE) {
        startAutoScroll(-1);
      } else if (e.clientY > winH - AUTO_SCROLL_EDGE) {
        startAutoScroll(1);
      } else {
        stopAutoScroll();
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      // Text overlay drag end
      if (overlayDragRef.current) {
        overlayDragRef.current = null;
        syncContentRef.current();
        return;
      }

      // Resize end
      if (resizingRef.current) {
        resizingRef.current = null;
        syncContentRef.current();
        return;
      }

      // Drag reorder end
      if (!dragRef.current) return;
      const drag = dragRef.current;
      stopAutoScroll();

      if (drag.ghost && drag.ghost.parentNode) {
        drag.ghost.parentNode.removeChild(drag.ghost);
      }
      if (drag.indicator && drag.indicator.parentNode) {
        drag.indicator.parentNode.removeChild(drag.indicator);
      }

      if (drag.dragging && editorRef.current) {
        // Find drop target
        const imgs = editorRef.current.querySelectorAll('img');
        for (const img of imgs) {
          if (img === drag.img) continue;
          const r = img.getBoundingClientRect();

          // Drop beside → create flex row
          if (e.clientY >= r.top && e.clientY <= r.bottom) {
            const nearLeft = Math.abs(e.clientX - r.left) < 40;
            const nearRight = Math.abs(e.clientX - r.right) < 40;
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
              syncContentRef.current();
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
              syncContentRef.current();
              break;
            }
          }
        }
      }

      dragRef.current = null;
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    // Listen to scroll on both window and any intermediate scrollable ancestor
    window.addEventListener('scroll', handleScrollDuringDrag, true);
    // Abort drag if user presses Escape
    const handleKey = (ev: KeyboardEvent) => {
      if (ev.key !== 'Escape') return;
      const d = dragRef.current;
      if (!d) return;
      stopAutoScroll();
      if (d.ghost?.parentNode) d.ghost.parentNode.removeChild(d.ghost);
      if (d.indicator?.parentNode) d.indicator.parentNode.removeChild(d.indicator);
      dragRef.current = null;
    };
    document.addEventListener('keydown', handleKey);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('scroll', handleScrollDuringDrag, true);
      document.removeEventListener('keydown', handleKey);
      // Cleanup any leaked drag elements (defensive — by attribute, not by dragRef)
      if (dragRef.current) {
        stopAutoScroll();
        dragRef.current = null;
      }
      document
        .querySelectorAll<HTMLElement>('[data-dnd-ghost="1"],[data-dnd-indicator="1"]')
        .forEach((n) => n.remove());
    };
  }, []);

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

  /* ── Insert HTML reliably — uses current selection if inside editor, else appends at end ── */
  const insertHtmlReliably = useCallback((html: string) => {
    const editor = editorRef.current;
    if (!editor) return;
    editor.focus();
    const sel = window.getSelection();
    const range =
      sel && sel.rangeCount > 0 ? sel.getRangeAt(0) : null;
    const inEditor =
      range && editor.contains(range.commonAncestorContainer);

    if (inEditor) {
      const ok = document.execCommand('insertHTML', false, html);
      if (ok) return;
    }

    // Fallback: append at end
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    const frag = document.createDocumentFragment();
    while (tmp.firstChild) frag.appendChild(tmp.firstChild);
    editor.appendChild(frag);

    // Place caret at end
    const endRange = document.createRange();
    endRange.selectNodeContents(editor);
    endRange.collapse(false);
    const s = window.getSelection();
    if (s) {
      s.removeAllRanges();
      s.addRange(endRange);
    }
  }, []);

  /* ── Insert individual images (each as figure + caption) ── */
  const insertIndividualImages = useCallback(
    (images: CollageImage[]) => {
      if (!images.length) return;
      const html = images
        .map((img) => buildFigureHtml(img.url, img.alt || '', '', true))
        .join('');
      insertHtmlReliably(html + '<p><br/></p>');
      syncContent();
    },
    [syncContent, insertHtmlReliably],
  );

  /* ── Insert images as collage ── */
  const insertCollage = useCallback(
    async (images: CollageImage[]) => {
      if (!images.length) return;
      // Enrich with aspectRatio (measure any missing)
      const enriched = await Promise.all(
        images.map(async (img) => {
          if (img.aspectRatio && img.aspectRatio > 0) return img;
          const ar = await measureAspectRatio(img.url);
          return { ...img, aspectRatio: ar };
        }),
      );
      const html = buildCollageHtml(enriched, { editable: true });
      insertHtmlReliably(html + '<p><br/></p>');
      syncContent();
    },
    [syncContent, insertHtmlReliably],
  );

  /* ── Image file input change ── */
  const handleImageFiles = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files || files.length === 0) return;
      const fileArr = Array.from(files);
      e.target.value = '';

      try {
        // Parallel upload (4 at a time) for much faster multi-image uploads
        const CONCURRENCY = 4;
        let completed = 0;
        setUploadStatus(`이미지 업로드 중... (0/${fileArr.length})`);
        const results: (CollageImage | null)[] = new Array(fileArr.length).fill(null);

        const uploadOne = async (file: File, index: number) => {
          const result = await uploadImage(file).catch(() => null);
          completed++;
          setUploadStatus(`이미지 업로드 중... (${completed}/${fileArr.length})`);
          if (result?.url) {
            results[index] = {
              url: result.url,
              alt: file.name.replace(/\.[^/.]+$/, ''),
            };
          }
        };

        // Pool of concurrent uploads, preserving input order in results[]
        let cursor = 0;
        const workers = Array.from({ length: Math.min(CONCURRENCY, fileArr.length) }, async () => {
          while (cursor < fileArr.length) {
            const i = cursor++;
            await uploadOne(fileArr[i], i);
          }
        });
        await Promise.all(workers);
        const uploads = results.filter((r): r is CollageImage => r !== null);

        if (uploads.length === 0) {
          setUploadStatus('');
          return;
        }

        if (uploads.length === 1) {
          // Single image → figure + caption, no modal
          insertIndividualImages(uploads);
          setUploadStatus('');
          return;
        }

        // Multiple → show layout picker
        setPendingImages(uploads);
        setShowLayoutPicker(true);
        setUploadStatus('');
      } catch (err) {
        console.error('Image upload failed:', err);
        setUploadStatus('');
      }
    },
    [insertIndividualImages],
  );

  /* ── Layout picker handler ── */
  const handleLayoutSelect = useCallback(
    (mode: 'individual' | 'collage') => {
      const imgs = pendingImages;
      setShowLayoutPicker(false);
      setPendingImages([]);
      if (imgs.length === 0) return;
      // Wait a tick for the modal to unmount / focus to be releasable
      setTimeout(() => {
        if (mode === 'individual') {
          insertIndividualImages(imgs);
        } else {
          void insertCollage(imgs);
        }
      }, 0);
    },
    [pendingImages, insertIndividualImages, insertCollage],
  );

  const handleLayoutClose = useCallback(() => {
    const imgs = pendingImages;
    setShowLayoutPicker(false);
    setPendingImages([]);
    if (imgs.length > 0) {
      setTimeout(() => insertIndividualImages(imgs), 0);
    }
  }, [pendingImages, insertIndividualImages]);

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
  // Editor contenteditable 의 좌우 padding (라인 1740: padding: '24px 48px')
  // 옆트임 모드에서 이미지를 에디터 박스 좌우 끝까지 늘리기 위한 네거티브 마진 값
  const EDITOR_H_PADDING = 48;

  const setImageSize = useCallback(
    (mode: 'small' | 'document' | 'fullbleed') => {
      if (!selectedImg) return;

      const collageWrapper = selectedImg.closest('.img-collage-wrapper') as HTMLElement | null;
      const figureWrapper = selectedImg.closest('.img-figure-wrapper') as HTMLElement | null;
      const overlayWrapper = selectedImg.closest('.text-overlay-wrapper') as HTMLElement | null;
      const target = (collageWrapper || figureWrapper || overlayWrapper || selectedImg) as HTMLElement;

      // 기존 크기/정렬 스타일 초기화
      target.style.width = '';
      target.style.maxWidth = '';
      target.style.marginLeft = '';
      target.style.marginRight = '';
      target.style.textAlign = '';

      if (mode === 'small') {
        // 65% 폭, 좌측 정렬
        target.style.display = 'block';
        target.style.width = '65%';
        target.style.maxWidth = '65%';
        target.style.marginLeft = '0';
        target.style.marginRight = 'auto';
      } else if (mode === 'document') {
        // 글 영역(본문) 100%, 가운데
        target.style.display = 'block';
        target.style.width = '100%';
        target.style.maxWidth = '100%';
        target.style.marginLeft = '0';
        target.style.marginRight = '0';
      } else {
        // 옆트임: 에디터 박스 좌우 끝까지 (본문 패딩만큼 네거티브 마진)
        target.style.display = 'block';
        target.style.width = `calc(100% + ${EDITOR_H_PADDING * 2}px)`;
        target.style.maxWidth = 'none';
        target.style.marginLeft = `-${EDITOR_H_PADDING}px`;
        target.style.marginRight = `-${EDITOR_H_PADDING}px`;
      }

      // img 자체를 타겟으로 할 때 비율 유지
      if (target === selectedImg) {
        target.style.height = 'auto';
      }

      target.dataset.size = mode;

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

    // Individual figure wrapper — delete image + its caption together
    const figureWrapper = selectedImg.closest('.img-figure-wrapper');
    if (figureWrapper) {
      figureWrapper.remove();
      setSelectedImg(null);
      onImageSelect?.(null);
      syncContent();
      return;
    }

    // Collage — toolbar "콜라주 전체 삭제"는 래퍼 전체 삭제 (단일 이미지 제거는 X 버튼이 담당)
    const collageWrapper = selectedImg.closest('.img-collage-wrapper');
    if (collageWrapper) {
      collageWrapper.remove();
      setSelectedImg(null);
      onImageSelect?.(null);
      syncContent();
      return;
    }

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

  /* ── Collage helpers ── */
  const removeCollageImage = useCallback(
    (img: HTMLImageElement) => {
      const collageWrapper = img.closest('.img-collage-wrapper');
      if (!collageWrapper) return;
      const grid = collageWrapper.querySelector('.img-collage');
      img.remove();
      const remaining = grid ? grid.querySelectorAll('img').length : 0;
      if (remaining === 0) {
        collageWrapper.remove();
      }
      setSelectedImg(null);
      onImageSelect?.(null);
      syncContent();
    },
    [onImageSelect, syncContent],
  );

  const toggleRepresentative = useCallback(
    (img: HTMLImageElement) => {
      const collageWrapper = img.closest('.img-collage-wrapper');
      if (!collageWrapper) return;
      const isCurrentlyRep = img.dataset.representative === 'true';
      // Unset on all images within the collage
      collageWrapper.querySelectorAll('img[data-representative]').forEach((el) => {
        (el as HTMLImageElement).removeAttribute('data-representative');
      });
      if (!isCurrentlyRep) {
        img.setAttribute('data-representative', 'true');
      }
      forceRender((n) => n + 1);
      syncContent();
    },
    [syncContent],
  );

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

    const collageWrapperEl = selectedImg.closest('.img-collage-wrapper') as HTMLElement | null;
    const figureWrapperEl = selectedImg.closest('.img-figure-wrapper') as HTMLElement | null;
    const isInCollage = !!collageWrapperEl;
    const isRepresentative = selectedImg.dataset.representative === 'true';

    // Detect current size mode from data-size attribute
    const sizeTarget = (collageWrapperEl ||
      figureWrapperEl ||
      (selectedImg.closest('.text-overlay-wrapper') as HTMLElement | null) ||
      selectedImg) as HTMLElement;
    const currentSize: 'small' | 'document' | 'fullbleed' | null =
      (sizeTarget.dataset.size as 'small' | 'document' | 'fullbleed' | undefined) || null;
    const activeBtn: React.CSSProperties = { background: '#e0e7ff', color: '#3b82f6' };

    // Toolbar top: always keep it inside the editor's visible area
    const baseToolbarTop = isInCollage && collageWrapperEl
      ? collageWrapperEl.getBoundingClientRect().top - 44
      : top - 44;
    const clampedToolbarTop = Math.max(baseToolbarTop, editorR.top + 8);
    const toolbarLeftCenter = isInCollage && collageWrapperEl
      ? collageWrapperEl.getBoundingClientRect().left + collageWrapperEl.getBoundingClientRect().width / 2
      : left + w / 2;

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

        {/* Representative badge (top-left) — collage only */}
        {isInCollage && (
          <button
            type="button"
            onClick={() => toggleRepresentative(selectedImg)}
            title={isRepresentative ? '대표 이미지 해제 — 블로그 목록의 썸네일로 사용됩니다' : '대표 이미지로 지정 — 블로그 목록의 썸네일로 사용됩니다'}
            aria-label={isRepresentative ? '대표 이미지 해제' : '대표 이미지로 지정'}
            aria-pressed={isRepresentative}
            onMouseEnter={(e) => {
              const t = e.currentTarget as HTMLButtonElement;
              t.style.background = isRepresentative ? '#16a34a' : '#fff';
              t.style.boxShadow = '0 2px 6px rgba(0,0,0,0.2)';
            }}
            onMouseLeave={(e) => {
              const t = e.currentTarget as HTMLButtonElement;
              t.style.background = isRepresentative ? '#22c55e' : 'rgba(255,255,255,0.9)';
              t.style.boxShadow = 'none';
            }}
            style={{
              position: 'absolute',
              left: left + 6,
              top: top + 6,
              padding: '5px 10px',
              minHeight: 28,
              background: isRepresentative ? '#22c55e' : 'rgba(255,255,255,0.95)',
              color: isRepresentative ? '#fff' : '#333',
              border: isRepresentative ? 'none' : '1px solid #d1d5db',
              borderRadius: 4,
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              pointerEvents: 'auto',
              zIndex: 53,
              display: 'flex',
              alignItems: 'center',
              gap: 3,
              transition: 'background 0.15s, box-shadow 0.15s',
            }}
          >
            {isRepresentative ? '✓ 대표' : '대표'}
          </button>
        )}

        {/* X button (top-right) — collage only, removes single image */}
        {isInCollage && (
          <button
            type="button"
            onClick={() => removeCollageImage(selectedImg)}
            title="이미지 삭제"
            aria-label="이미지 삭제"
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(0,0,0,0.85)'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(0,0,0,0.6)'; }}
            style={{
              position: 'absolute',
              left: left + w - 34,
              top: top + 6,
              width: 28,
              height: 28,
              background: 'rgba(0,0,0,0.6)',
              color: '#fff',
              border: 'none',
              borderRadius: '50%',
              fontSize: 18,
              cursor: 'pointer',
              pointerEvents: 'auto',
              zIndex: 53,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              lineHeight: 1,
              transition: 'background 0.15s',
            }}
          >
            <span aria-hidden="true">×</span>
          </button>
        )}

        {/* Resize handles — hide for collage (grid controls sizing) */}
        {!isInCollage && HANDLES.map(({ pos: hPos, cursor }) => {
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
          className="naver-img-toolbar"
          style={{
            position: 'absolute',
            left: toolbarLeftCenter,
            top: clampedToolbarTop,
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
            onClick={() => setImageSize('small')}
            title="작게"
            aria-pressed={currentSize === 'small'}
            style={currentSize === 'small' ? { ...toolBtnStyle, ...activeBtn } : toolBtnStyle}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="9" width="8" height="6" rx="1" fill="currentColor"/></svg>
          </button>
          <button
            onClick={() => setImageSize('document')}
            title="문서 너비"
            aria-pressed={currentSize === 'document'}
            style={currentSize === 'document' ? { ...toolBtnStyle, ...activeBtn } : toolBtnStyle}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="5" y="7" width="14" height="10" rx="1" fill="currentColor"/></svg>
          </button>
          <button
            onClick={() => setImageSize('fullbleed')}
            title="옆트임"
            aria-pressed={currentSize === 'fullbleed'}
            style={currentSize === 'fullbleed' ? { ...toolBtnStyle, ...activeBtn } : toolBtnStyle}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="6" width="22" height="12" rx="1" fill="currentColor"/></svg>
          </button>

          {!isInCollage && (
            <>
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
            </>
          )}

          <div style={{ width: 1, height: 20, background: '#e0e0e0', margin: '0 4px' }} />
          <button
            onClick={() => {
              if (isInCollage) {
                const count = collageWrapperEl?.querySelectorAll('img').length || 0;
                if (!window.confirm(`콜라주 전체(${count}장)를 삭제하시겠습니까?`)) return;
              }
              deleteImage();
            }}
            title={isInCollage ? '콜라주 전체 삭제' : '삭제'}
            aria-label={isInCollage ? '콜라주 전체 삭제' : '이미지 삭제'}
            style={{ ...toolBtnStyle, color: '#ef4444' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
          </button>
        </div>

        {/* Size display below image — 콜라주는 리사이즈 불가이므로 숨김 */}
        {!isInCollage && (
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
        )}
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
      <div ref={wrapperRef} style={{ position: 'relative', flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
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

      {/* Image layout picker modal */}
      <ImageLayoutPickerModal
        isOpen={showLayoutPicker}
        imageCount={pendingImages.length}
        previewUrls={pendingImages.map((p) => p.url)}
        onSelect={handleLayoutSelect}
        onClose={handleLayoutClose}
      />
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
