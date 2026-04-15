// Internal helper: auto-rows justified layout (mirrors collageLayout.ts buildCollageHtml)
function distributeRows(n: number): number[] {
  if (n <= 0) return [];
  if (n === 1) return [1];
  if (n <= 4) return [n];
  for (let b = Math.floor(n / 4); b >= 0; b--) {
    const rest = n - 4 * b;
    if (rest >= 0 && rest % 3 === 0) {
      const a = rest / 3;
      const rows: number[] = [];
      for (let i = 0; i < a; i++) rows.push(3);
      for (let i = 0; i < b; i++) rows.push(4);
      return rows;
    }
  }
  return [2, 3];
}

function buildAutoRowsCollageHtml(
  imgs: Array<{ url: string; alt?: string; aspectRatio?: number }>,
  caption: string,
): string {
  const count = imgs.length;
  if (count === 0) return '';
  const enriched = imgs.map(i => ({ ...i, aspectRatio: i.aspectRatio && i.aspectRatio > 0 ? i.aspectRatio : 1 }));
  let inner = '';
  if (count === 1) {
    const im = enriched[0];
    inner = `<div class="img-collage" data-layout="auto-rows" style="width:100%;"><img src="${escapeAttr(im.url)}" alt="${escapeAttr(im.alt || '')}" data-aspect="${im.aspectRatio}" style="display:block;width:100%;height:auto;border-radius:2px;" loading="lazy" /></div>`;
  } else {
    const rows = distributeRows(count);
    let rowsHtml = '';
    let idx = 0;
    for (const rowSize of rows) {
      const rowImgs = enriched.slice(idx, idx + rowSize);
      idx += rowSize;
      const sum = rowImgs.reduce((a, b) => a + b.aspectRatio!, 0);
      let rowInner = '';
      for (const im of rowImgs) {
        const a = im.aspectRatio!;
        rowInner += `<img src="${escapeAttr(im.url)}" alt="${escapeAttr(im.alt || '')}" data-aspect="${a}" style="flex:${a.toFixed(4)} ${a.toFixed(4)} 0;min-width:0;width:100%;height:100%;object-fit:cover;border-radius:2px;display:block;" loading="lazy" />`;
      }
      rowsHtml += `<div class="img-collage-row" style="display:flex;gap:6px;aspect-ratio:${sum.toFixed(4)} / 1;width:100%;">${rowInner}</div>`;
    }
    inner = `<div class="img-collage" data-layout="auto-rows" style="display:flex;flex-direction:column;gap:6px;width:100%;">${rowsHtml}</div>`;
  }
  const capHtml = `<div class="img-caption" contenteditable="true" data-placeholder="사진 설명을 입력하세요.">${escapeAttr(caption)}</div>`;
  return `<div class="img-collage-wrapper" contenteditable="false" style="margin:12px 0;">${inner}${capHtml}</div>`;
}

// ── HTML to Portable Text converter ──

// Extract Sanity asset ID from CDN URL
// e.g. "https://cdn.sanity.io/images/proj/prod/abc123-381x441.png" -> "image-abc123-381x441-png"
export function sanityUrlToAssetId(url: string): string | null {
  try {
    const match = url.match(/\/images\/[^/]+\/[^/]+\/([^?]+)/);
    if (match) {
      const filename = match[1];
      const dotIdx = filename.lastIndexOf('.');
      const name = filename.substring(0, dotIdx);
      const ext = filename.substring(dotIdx + 1);
      return `image-${name}-${ext}`;
    }
    const fileMatch = url.match(/\/files\/[^/]+\/[^/]+\/([^?]+)/);
    if (fileMatch) {
      const filename = fileMatch[1];
      const dotIdx = filename.lastIndexOf('.');
      const name = filename.substring(0, dotIdx);
      const ext = filename.substring(dotIdx + 1);
      return `file-${name}-${ext}`;
    }
  } catch {}
  return null;
}

export function htmlToPortableText(html: string): any[] {
  if (!html || !html.trim()) return [];

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const blocks: any[] = [];
  let blockKeyCounter = 0;

  const genKey = () => {
    blockKeyCounter++;
    return `block_${blockKeyCounter}_${Date.now().toString(36)}`;
  };

  const extractMarks = (node: Node): string[] => {
    const marks: string[] = [];
    let el = node.parentElement;
    while (el && el !== doc.body) {
      const tag = el.tagName.toLowerCase();
      if (tag === 'strong' || tag === 'b') marks.push('strong');
      if (tag === 'em' || tag === 'i') marks.push('em');
      if (tag === 'u') marks.push('underline');
      if (tag === 'code') marks.push('code');
      el = el.parentElement;
    }
    return [...new Set(marks)];
  };

  const processInlineChildren = (parent: Element): any[] => {
    const spans: any[] = [];
    const walk = (node: Node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent || '';
        if (text) {
          spans.push({ _type: 'span', _key: genKey(), text, marks: extractMarks(node) });
        }
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        const el = node as Element;
        const tag = el.tagName.toLowerCase();
        if (tag === 'img') {
          const src = el.getAttribute('src') || '';
          if (src) {
            spans.push({ _type: 'span', _key: genKey(), text: '', marks: [] });
          }
        } else if (tag === 'a') {
          const href = el.getAttribute('href') || '';
          const linkKey = genKey();
          const childSpans: any[] = [];
          el.childNodes.forEach(child => {
            if (child.nodeType === Node.TEXT_NODE) {
              childSpans.push({
                _type: 'span', _key: genKey(),
                text: child.textContent || '',
                marks: [...extractMarks(child), linkKey],
              });
            }
          });
          if (childSpans.length === 0) {
            childSpans.push({ _type: 'span', _key: genKey(), text: el.textContent || href, marks: [linkKey] });
          }
          spans.push({ _markDef: { _type: 'link', _key: linkKey, href }, children: childSpans });
        } else if (tag === 'br') {
          spans.push({ _type: 'span', _key: genKey(), text: '\n', marks: [] });
        } else {
          el.childNodes.forEach(child => walk(child));
        }
      }
    };
    parent.childNodes.forEach(child => walk(child));
    return spans;
  };

  const processElement = (el: Element) => {
    const tag = el.tagName.toLowerCase();

    // ── Collage wrapper ──
    if (tag === 'div' && el.classList.contains('img-collage-wrapper')) {
      const collageEl = el.querySelector('.img-collage');
      const captionEl = el.querySelector(':scope > .img-caption');
      const layout = (collageEl?.getAttribute('data-layout') || '') as string;
      const imgs: any[] = [];
      collageEl?.querySelectorAll('img').forEach((img) => {
        const src = img.getAttribute('src') || '';
        if (!src) return;
        const assetId = sanityUrlToAssetId(src);
        const alt = img.getAttribute('alt') || '';
        const aspectStr = img.getAttribute('data-aspect');
        const aspectRatio = aspectStr ? parseFloat(aspectStr) : undefined;
        const entry: any = { _key: genKey(), alt };
        if (aspectRatio && !isNaN(aspectRatio)) entry.aspectRatio = aspectRatio;
        if (assetId) {
          entry.asset = { _type: 'image', asset: { _type: 'reference', _ref: assetId } };
        } else {
          entry.url = src;
        }
        imgs.push(entry);
      });
      if (imgs.length > 0) {
        blocks.push({
          _type: 'collage',
          _key: genKey(),
          layout: layout || undefined,
          images: imgs,
          caption: (captionEl?.textContent || '').trim(),
        });
      }
      return;
    }

    // ── Figure wrapper (single image with caption) ──
    if (tag === 'div' && el.classList.contains('img-figure-wrapper')) {
      const img = el.querySelector('img');
      const captionEl = el.querySelector(':scope > .img-caption');
      if (img) {
        const src = img.getAttribute('src') || '';
        const alt = img.getAttribute('alt') || '';
        const caption = (captionEl?.textContent || '').trim();
        if (src) {
          const assetId = sanityUrlToAssetId(src);
          const block: any = { _type: 'image', _key: genKey() };
          if (assetId) {
            block.asset = { _type: 'reference', _ref: assetId };
          } else {
            block.url = src;
          }
          if (alt) block.alt = alt;
          if (caption) block.caption = caption;
          blocks.push(block);
        }
      }
      return;
    }

    // ── Legacy img-row (flex row of images from drag-drop) ──
    if (tag === 'div' && el.classList.contains('img-row')) {
      const imgs: any[] = [];
      el.querySelectorAll('img').forEach((img) => {
        const src = img.getAttribute('src') || '';
        if (!src) return;
        const assetId = sanityUrlToAssetId(src);
        const alt = img.getAttribute('alt') || '';
        const entry: any = { _key: genKey(), alt };
        if (assetId) {
          entry.asset = { _type: 'image', asset: { _type: 'reference', _ref: assetId } };
        } else {
          entry.url = src;
        }
        imgs.push(entry);
      });
      if (imgs.length >= 2) {
        blocks.push({
          _type: 'collage',
          _key: genKey(),
          layout: imgs.length === 2 ? 'grid-2' : imgs.length === 3 ? 'grid-3-1L2R' : imgs.length === 4 ? 'grid-4-2x2' : 'bento-5plus',
          images: imgs,
          caption: '',
        });
      } else if (imgs.length === 1) {
        const one = imgs[0];
        const block: any = { _type: 'image', _key: genKey() };
        if (one.asset) block.asset = one.asset.asset;
        else if (one.url) block.url = one.url;
        if (one.alt) block.alt = one.alt;
        blocks.push(block);
      }
      return;
    }

    // Images become image blocks
    if (tag === 'img') {
      const src = el.getAttribute('src') || '';
      if (src) {
        const assetId = sanityUrlToAssetId(src);
        if (assetId) {
          blocks.push({ _type: 'image', _key: genKey(), asset: { _type: 'reference', _ref: assetId } });
        } else {
          blocks.push({ _type: 'image', _key: genKey(), url: src });
        }
      }
      return;
    }

    // Headings
    if (['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(tag)) {
      const inlines = processInlineChildren(el);
      const markDefs: any[] = [];
      const children: any[] = [];
      inlines.forEach(item => {
        if (item._markDef) {
          markDefs.push(item._markDef);
          children.push(...item.children);
        } else {
          children.push(item);
        }
      });
      blocks.push({
        _type: 'block', _key: genKey(), style: tag, markDefs,
        children: children.length > 0 ? children : [{ _type: 'span', _key: genKey(), text: '', marks: [] }],
      });
      return;
    }

    // Lists (ul / ol)
    if (tag === 'ul' || tag === 'ol') {
      const listItem = tag === 'ul' ? 'bullet' : 'number';
      el.querySelectorAll(':scope > li').forEach(li => {
        const inlines = processInlineChildren(li);
        const markDefs: any[] = [];
        const children: any[] = [];
        inlines.forEach(item => {
          if (item._markDef) {
            markDefs.push(item._markDef);
            children.push(...item.children);
          } else {
            children.push(item);
          }
        });
        blocks.push({
          _type: 'block', _key: genKey(), style: 'normal', listItem, level: 1, markDefs,
          children: children.length > 0 ? children : [{ _type: 'span', _key: genKey(), text: li.textContent || '', marks: [] }],
        });
      });
      return;
    }

    // Blockquote
    if (tag === 'blockquote') {
      const inlines = processInlineChildren(el);
      const markDefs: any[] = [];
      const children: any[] = [];
      inlines.forEach(item => {
        if (item._markDef) {
          markDefs.push(item._markDef);
          children.push(...item.children);
        } else {
          children.push(item);
        }
      });
      blocks.push({
        _type: 'block', _key: genKey(), style: 'blockquote', markDefs,
        children: children.length > 0 ? children : [{ _type: 'span', _key: genKey(), text: el.textContent || '', marks: [] }],
      });
      return;
    }

    // Code block (pre)
    if (tag === 'pre') {
      blocks.push({
        _type: 'block', _key: genKey(), style: 'normal', markDefs: [],
        children: [{ _type: 'span', _key: genKey(), text: el.textContent || '', marks: ['code'] }],
      });
      return;
    }

    // Regular paragraphs / divs / other block elements
    if (['p', 'div', 'section', 'article'].includes(tag) || tag === 'span') {
      const imgs = el.querySelectorAll('img');
      imgs.forEach(img => {
        const src = img.getAttribute('src') || '';
        if (src) {
          const assetId = sanityUrlToAssetId(src);
          if (assetId) {
            blocks.push({ _type: 'image', _key: genKey(), asset: { _type: 'reference', _ref: assetId } });
          } else {
            blocks.push({ _type: 'image', _key: genKey(), url: src });
          }
        }
      });

      const inlines = processInlineChildren(el);
      const markDefs: any[] = [];
      const children: any[] = [];
      inlines.forEach(item => {
        if (item._markDef) {
          markDefs.push(item._markDef);
          children.push(...item.children);
        } else if (item.text !== '' || children.length === 0) {
          children.push(item);
        }
      });

      const hasText = children.some(c => c.text && c.text.trim());
      if (hasText) {
        blocks.push({
          _type: 'block', _key: genKey(), style: 'normal', markDefs,
          children: children.length > 0 ? children : [{ _type: 'span', _key: genKey(), text: '', marks: [] }],
        });
      }
      return;
    }
  };

  // Process top-level nodes
  doc.body.childNodes.forEach(node => {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = (node.textContent || '').trim();
      if (text) {
        blocks.push({
          _type: 'block', _key: genKey(), style: 'normal', markDefs: [],
          children: [{ _type: 'span', _key: genKey(), text, marks: [] }],
        });
      }
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      processElement(node as Element);
    }
  });

  return blocks.length > 0 ? blocks : [{ _type: 'block', _key: genKey(), style: 'normal', markDefs: [], children: [{ _type: 'span', _key: genKey(), text: '', marks: [] }] }];
}

// Resolve Sanity image ref to CDN URL
function refToUrl(ref: string | undefined | null): string {
  if (!ref) return '';
  const match = ref.match(/^image-(.+)-(\w+)$/);
  if (match) return `https://cdn.sanity.io/images/7b9lcco4/production/${match[1]}.${match[2]}`;
  return '';
}

function escapeAttr(s: string): string {
  return (s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// ── Portable Text to HTML (for loading existing posts) ──
export function portableTextToHtml(blocks: any[]): string {
  if (!blocks || !Array.isArray(blocks)) return '';
  return blocks.map(block => {
    if (block._type === 'collage') {
      const imgs = (block.images || []).map((entry: any) => {
        let url = entry.url || entry.asset?.asset?.url || entry.asset?.url || '';
        if (!url) {
          const ref = entry.asset?.asset?._ref || entry.asset?._ref;
          url = refToUrl(ref);
        }
        return { url, alt: entry.alt || '', aspectRatio: entry.aspectRatio };
      }).filter((i: any) => !!i.url);
      if (imgs.length === 0) return '';
      const caption = block.caption || '';
      return buildAutoRowsCollageHtml(imgs, caption);
    }
    if (block._type === 'image') {
      let url = block.url || block.asset?.url || '';
      if (!url && block.asset?._ref) {
        url = refToUrl(block.asset._ref);
      }
      if (!url) return '';
      const alt = block.alt || '';
      const caption = block.caption || '';
      // Wrap in figure for consistency (so re-saving preserves caption)
      return `<div class="img-figure-wrapper" contenteditable="false" style="margin:12px 0;"><img src="${escapeAttr(url)}" alt="${escapeAttr(alt)}" style="max-width:100%;height:auto;display:block;margin:0 auto;border-radius:4px;" /><div class="img-caption" contenteditable="true" data-placeholder="사진 설명을 입력하세요.">${escapeAttr(caption)}</div></div>`;
    }
    if (block._type !== 'block') return '';
    const children = (block.children || []).map((span: any) => {
      let text = (span.text || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      const marks = span.marks || [];
      if (marks.includes('strong')) text = `<strong>${text}</strong>`;
      if (marks.includes('em')) text = `<em>${text}</em>`;
      if (marks.includes('underline')) text = `<u>${text}</u>`;
      if (marks.includes('code')) text = `<code>${text}</code>`;
      const linkMark = marks.find((m: string) => {
        return (block.markDefs || []).some((md: any) => md._key === m && md._type === 'link');
      });
      if (linkMark) {
        const def = (block.markDefs || []).find((md: any) => md._key === linkMark);
        if (def) text = `<a href="${def.href}">${text}</a>`;
      }
      return text;
    }).join('');

    const style = block.style || 'normal';
    if (block.listItem === 'bullet') return `<li>${children}</li>`;
    if (block.listItem === 'number') return `<li>${children}</li>`;
    if (style === 'blockquote') return `<blockquote>${children}</blockquote>`;
    if (['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(style)) return `<${style}>${children}</${style}>`;
    return `<p>${children}</p>`;
  }).join('\n');
}
