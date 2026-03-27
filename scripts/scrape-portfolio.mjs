#!/usr/bin/env node
/**
 * Scrape portfolio data from picky-pic.com
 */

const BASE = 'https://picky-pic.com/bbs/board.php';

async function fetchHTML(url) {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)' }
  });
  return res.text();
}

// Step 1: Get all wr_ids from list pages
async function getAllIds() {
  const ids = new Set();
  for (let page = 1; page <= 6; page++) {
    const url = `${BASE}?bo_table=portfolio&page=${page}`;
    console.log(`Fetching list page ${page}...`);
    const html = await fetchHTML(url);
    const regex = /wr_id=(\d+)/g;
    let match;
    while ((match = regex.exec(html)) !== null) {
      ids.add(parseInt(match[1]));
    }
  }
  return [...ids].sort((a, b) => b - a);
}

// Step 2: Scrape detail page
async function scrapeDetail(wrId) {
  const url = `${BASE}?bo_table=portfolio&wr_id=${wrId}`;
  const html = await fetchHTML(url);

  // Title from <title>
  const titleMatch = html.match(/<title>([^<]+)<\/title>/);
  const fullTitle = titleMatch ? titleMatch[1].trim() : '';
  const title = fullTitle.split('>')[0].trim();

  // Category from head_title
  const catKoMatch = html.match(/<div class="head_title">\s*<h3>([^<]+)<\/h3>\s*<h4>([^<]+)<\/h4>/);
  const categoryKo = catKoMatch ? catKoMatch[1].trim() : '';
  const categoryEn = catKoMatch ? catKoMatch[2].trim() : '';

  // Images from bo_v_img - look for thumb images
  const imgRegex = /src="(https?:\/\/picky-pic\.com\/data\/file\/portfolio\/thumb-[^"]+)"/g;
  const images = [];
  let imgMatch;
  while ((imgMatch = imgRegex.exec(html)) !== null) {
    images.push(imgMatch[1]);
  }

  // Also check for images without thumb prefix (some items may have different format)
  if (images.length === 0) {
    const imgRegex2 = /src="(https?:\/\/picky-pic\.com\/data\/file\/portfolio\/[^"]+)"/g;
    while ((imgMatch = imgRegex2.exec(html)) !== null) {
      if (!images.includes(imgMatch[1])) {
        images.push(imgMatch[1]);
      }
    }
  }

  // Also check for relative src paths
  if (images.length === 0) {
    const imgRegex3 = /src="(\/data\/file\/portfolio\/[^"]+)"/g;
    while ((imgMatch = imgRegex3.exec(html)) !== null) {
      images.push('https://picky-pic.com' + imgMatch[1]);
    }
  }

  // Description from view-content
  const viewContentMatch = html.match(/<div class="view-content">([\s\S]*?)<\/div>\s*<\/div>/);
  let description = '';
  let rentalDevice = '';
  if (viewContentMatch) {
    const text = viewContentMatch[1].replace(/<[^>]+>/g, '\n').replace(/&nbsp;/g, ' ').replace(/\n{2,}/g, '\n').trim();
    const lines = text.split('\n').filter(l => l.trim());
    // First line is usually "브랜드 x 피키픽"
    description = lines[0]?.trim() || '';
    // Look for rental device info
    for (const line of lines) {
      if (line.includes('렌탈 기기') || line.includes('렌탈기기')) {
        rentalDevice = line.trim();
        break;
      }
    }
  }

  // Get the thumbnail image from list page (og:image)
  const ogImageMatch = html.match(/property="og:image"\s+content="([^"]+)"/);
  const thumbnail = ogImageMatch ? ogImageMatch[1] : '';

  return {
    wrId,
    title,
    categoryKo,
    categoryEn,
    images,
    description,
    rentalDevice,
    thumbnail,
  };
}

// Step 3: Download image
async function downloadImage(url, filepath) {
  const fs = await import('fs');
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)' }
  });
  if (!res.ok) {
    console.error(`  Failed: ${url} (${res.status})`);
    return false;
  }
  const buffer = await res.arrayBuffer();
  fs.writeFileSync(filepath, Buffer.from(buffer));
  return true;
}

async function main() {
  const fs = await import('fs');
  const path = await import('path');

  console.log('=== Scraping Portfolio Data ===\n');

  const allIds = await getAllIds();
  console.log(`\nFound ${allIds.length} items\n`);

  const portfolioData = [];
  for (const id of allIds) {
    process.stdout.write(`Scraping ${id}...`);
    try {
      const data = await scrapeDetail(id);
      portfolioData.push(data);
      console.log(` ${data.title} | ${data.categoryKo}/${data.categoryEn} | ${data.images.length} imgs`);
    } catch (e) {
      console.error(` Error: ${e.message}`);
    }
    await new Promise(r => setTimeout(r, 150));
  }

  // Download detail images
  const detailDir = path.resolve('public/images/portfolio/detail');
  console.log(`\nDownloading images to ${detailDir}...`);

  for (const item of portfolioData) {
    const localImages = [];
    for (let i = 0; i < item.images.length; i++) {
      const ext = item.images[i].match(/\.(jpg|jpeg|png|gif|webp)/i)?.[1] || 'jpg';
      const filename = `${item.wrId}-${i + 1}.${ext}`;
      const filepath = path.join(detailDir, filename);
      const localPath = `/images/portfolio/detail/${filename}`;

      if (fs.existsSync(filepath)) {
        localImages.push(localPath);
        continue;
      }

      const success = await downloadImage(item.images[i], filepath);
      if (success) {
        localImages.push(localPath);
        process.stdout.write('.');
      }
      await new Promise(r => setTimeout(r, 50));
    }
    item.localImages = localImages;
    if (localImages.length > 0) process.stdout.write(`[${item.wrId}:${localImages.length}]`);
  }
  console.log('\n');

  // Save data
  const outputPath = path.resolve('scripts/portfolio-data.json');
  fs.writeFileSync(outputPath, JSON.stringify(portfolioData, null, 2));
  console.log(`Saved to ${outputPath}`);
  console.log(`Total: ${portfolioData.length} items, ${portfolioData.reduce((s, i) => s + i.localImages.length, 0)} images`);
}

main().catch(console.error);
