// build-site.js
// Rebuilds index.html and best-casinos.html from all published reviews

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

function loadJSON(f) { return JSON.parse(fs.readFileSync(f, 'utf8')); }

function starRating(r) {
  const full = Math.floor(r), half = r % 1 >= 0.5 ? 1 : 0, empty = 5 - full - half;
  return '★'.repeat(full) + (half ? '½' : '') + '☆'.repeat(empty);
}

function casinoCard(casino) {
  const feats = [];
  if (casino.slots)       feats.push('🎰 Slots');
  if (casino.live_casino) feats.push('🎥 Live Casino');
  if (casino.sports)      feats.push('⚽ Sports');
  if (casino.mobile)      feats.push('📱 Mobile');

  return `
  <article class="casino-card" data-rating="${casino.rating}" data-tags="${casino.tags?.join(',') || ''}">
    <div class="card-logo">${casino.name.charAt(0)}</div>
    <div class="card-body">
      <h2 class="card-title">
        <a href="reviews/${casino.slug}.html">${casino.name}</a>
      </h2>
      <div class="card-stars">
        <span class="stars">${starRating(casino.rating)}</span>
        <strong>${casino.rating}/5</strong>
      </div>
      <div class="card-bonus">🎁 ${casino.bonus}</div>
      <div class="card-features">${feats.join(' · ')}</div>
    </div>
    <div class="card-cta">
      <a href="reviews/${casino.slug}.html" class="btn-review">Read Review</a>
      <a href="${casino.url}" target="_blank" rel="noopener nofollow" class="btn-visit">Visit Casino →</a>
    </div>
  </article>`;
}

function buildIndex(casinos) {
  const cards = casinos
    .sort((a, b) => b.rating - a.rating)
    .map(casinoCard)
    .join('\n');

  const year = new Date().getFullYear();
  const topBonus = casinos.sort((a,b)=>b.rating-a.rating)[0];

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Best Online Casinos ${year} – Honest AI-Powered Reviews</title>
  <meta name="description" content="Find the best online casinos of ${year}. Expert reviews, exclusive bonuses, and unbiased ratings. Updated daily with AI-powered insights." />
  <link rel="stylesheet" href="assets/style.css" />
  <link rel="canonical" href="/" />
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "AI Casinos Review",
    "url": "https://zlatev.elegance.bg/ai-casinos-discord/"
  }
  </script>
</head>
<body>
  <header class="site-header">
    <div class="container">
      <a href="index.html" class="logo">🎰 AI Casinos Review</a>
      <nav>
        <a href="index.html" class="active">Home</a>
        <a href="best-casinos.html">Best Casinos</a>
        <a href="bonuses.html">Bonuses</a>
      </nav>
    </div>
  </header>

  <section class="hero">
    <div class="container">
      <h1>Best Online Casinos ${year}</h1>
      <p class="hero-sub">Honest, AI-powered reviews. Updated daily. No fluff.</p>
      <div class="hero-stats">
        <div class="stat"><strong>${casinos.length}</strong><span>Reviews</span></div>
        <div class="stat"><strong>Daily</strong><span>Updated</span></div>
        <div class="stat"><strong>100%</strong><span>Independent</span></div>
      </div>
    </div>
  </section>

  <!-- Filter bar -->
  <div class="filter-bar container">
    <button class="filter-btn active" data-filter="all">All Casinos</button>
    <button class="filter-btn" data-filter="live-casino">Live Casino</button>
    <button class="filter-btn" data-filter="sports">Sports Betting</button>
    <button class="filter-btn" data-filter="mobile">Mobile</button>
    <button class="filter-btn" data-filter="slots">Slots</button>
  </div>

  <main class="container casino-list" id="casinoList">
    ${cards}
  </main>

  <section class="info-section container">
    <h2>Why Trust Our Reviews?</h2>
    <div class="info-grid">
      <div class="info-card">
        <span class="info-icon">🤖</span>
        <h3>AI-Powered Analysis</h3>
        <p>Every review is generated and fact-checked using advanced AI, ensuring consistency and depth.</p>
      </div>
      <div class="info-card">
        <span class="info-icon">📅</span>
        <h3>Updated Daily</h3>
        <p>New casino reviews published every day. Our database is always current.</p>
      </div>
      <div class="info-card">
        <span class="info-icon">🔍</span>
        <h3>Independent</h3>
        <p>No paid placements. Ratings are based purely on objective criteria.</p>
      </div>
    </div>
  </section>

  <footer class="site-footer">
    <div class="container">
      <p>© ${year} AI Casinos Review. For entertainment purposes only. 18+ only.</p>
      <p>
        <a href="responsible-gambling.html">Responsible Gambling</a> |
        <a href="privacy.html">Privacy Policy</a> |
        <a href="sitemap.xml">Sitemap</a>
      </p>
    </div>
  </footer>

  <script>
    // Filter functionality
    document.querySelectorAll('.filter-btn').forEach(btn => {
      btn.addEventListener('click', function() {
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        const filter = this.dataset.filter;
        document.querySelectorAll('.casino-card').forEach(card => {
          if (filter === 'all') {
            card.style.display = '';
          } else {
            const tags = card.dataset.tags || '';
            card.style.display = tags.includes(filter) ? '' : 'none';
          }
        });
      });
    });
  </script>
</body>
</html>`;
}

function buildSitemap(casinos) {
  const base = 'https://zlatev.elegance.bg/ai-casinos-discord';
  const today = new Date().toISOString().split('T')[0];
  const urls = casinos.map(c => `
  <url>
    <loc>${base}/reviews/${c.slug}.html</loc>
    <lastmod>${c.publishedDate ? c.publishedDate.split('T')[0] : today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>`).join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${base}/index.html</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>${urls}
</urlset>`;
}

// ── Main ───────────────────────────────────────────────────────────────────

async function main() {
  const dataDir = path.join(ROOT, 'data');
  const siteDir = path.join(ROOT, 'site');

  // Load all published casino meta files
  const metaFiles = fs.readdirSync(dataDir).filter(f => f.endsWith('.meta.json'));

  if (metaFiles.length === 0) {
    console.log('⚠️  No published reviews yet. Run generate-review.js first.');
    // Still build empty index
  }

  const casinos = metaFiles.map(f => loadJSON(path.join(dataDir, f)));
  console.log(`📋 Building site with ${casinos.length} casino(s)…`);

  // index.html
  fs.writeFileSync(path.join(siteDir, 'index.html'), buildIndex(casinos));
  console.log('✅ index.html built');

  // sitemap.xml
  fs.writeFileSync(path.join(siteDir, 'sitemap.xml'), buildSitemap(casinos));
  console.log('✅ sitemap.xml built');
}

main().catch(err => { console.error(err); process.exit(1); });
