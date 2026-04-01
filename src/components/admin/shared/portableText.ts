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

// ── Portable Text to HTML (for loading existing posts) ──
export function portableTextToHtml(blocks: any[]): string {
  if (!blocks || !Array.isArray(blocks)) return '';
  return blocks.map(block => {
    if (block._type === 'image') {
      let url = block.url || block.asset?.url || '';
      if (!url && block.asset?._ref) {
        const ref = block.asset._ref;
        const match = ref.match(/^image-(.+)-(\w+)$/);
        if (match) {
          url = `https://cdn.sanity.io/images/7b9lcco4/production/${match[1]}.${match[2]}`;
        }
      }
      return url ? `<img src="${url}" alt="" style="max-width:100%;height:auto;margin:8px 0;" />` : '';
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
