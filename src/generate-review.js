// generate-review.js
// Reads next unpublished casino, calls Groq API, generates HTML review page

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_MODEL   = 'llama3-70b-8192';

// ── helpers ────────────────────────────────────────────────────────────────

function loadJSON(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function saveJSON(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

function starRating(rating) {
  const full  = Math.floor(rating);
  const half  = rating % 1 >= 0.5 ? 1 : 0;
  const empty = 5 - full - half;
  return '★'.repeat(full) + (half ? '½' : '') + '☆'.repeat(empty);
}

function featureBadge(value, label) {
  const cls = value ? 'badge-yes' : 'badge-no';
  const ico = value ? '✔' : '✘';
  return `<span class="badge ${cls}">${ico} ${label}</span>`;
}

// ── Groq API call ──────────────────────────────────────────────────────────

async function generateReviewText(casino) {
  const prompt = `
You are an expert online casino reviewer writing for an English-language casino review website.

Write a detailed, engaging, and honest review for the following casino. 
The review must be in English, professional, SEO-optimised, and around 600-800 words.
Structure it with these sections:
1. Introduction (2-3 sentences with the casino name and overall impression)
2. Welcome Bonus & Promotions (mention the bonus, bonus code if any, wagering requirements)
3. Game Selection (slots, table games, live casino, sports if applicable)
4. Payment Methods & Withdrawals (list methods, withdrawal time, min deposit)
5. Mobile Experience
6. Customer Support & Licensing
7. Verdict (summarise pros/cons, give final recommendation)

Casino Data:
${JSON.stringify(casino, null, 2)}

Return ONLY the review text. Use HTML paragraph tags (<p>) and heading tags (<h2>) for sections.
Do NOT include the casino name as an H1 – that is added by the template.
Do NOT include markdown. Only clean HTML paragraphs.
`;

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${GROQ_API_KEY}`
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 2048
    })
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Groq API error: ${response.status} – ${err}`);
  }

  const data = await response.json();
  return data.choices[0].message.content.trim();
}

// ── HTML builder ───────────────────────────────────────────────────────────

function buildReviewHTML(casino, reviewBody) {
  const publishedDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric'
  });
  const isoDate = new Date().toISOString().split('T')[0];

  const paymentIcons = casino.payment_methods
    .map(m => `<span class="payment-tag">${m}</span>`)
    .join('');

  const prosList = casino.pros.map(p => `<li>${p}</li>`).join('');
  const consList = casino.cons.map(c => `<li>${c}</li>`).join('');
  const tagsList = casino.tags.map(t => `<a href="/tag/${t.replace(/\s+/g,'-')}.html" class="tag">${t}</a>`).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${casino.name} Review ${new Date().getFullYear()} – Honest & Detailed</title>
  <meta name="description" content="Read our in-depth ${casino.name} review. Bonus: ${casino.bonus}. Rating: ${casino.rating}/5. Find out everything before you play." />
  <link rel="stylesheet" href="../assets/style.css" />
  <link rel="canonical" href="/reviews/${casino.slug}.html" />

  <!-- Open Graph -->
  <meta property="og:title" content="${casino.name} Review ${new Date().getFullYear()}" />
  <meta property="og:description" content="${casino.bonus} | Rating ${casino.rating}/5" />
  <meta property="og:type" content="article" />

  <!-- Schema.org -->
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "Review",
    "name": "${casino.name} Review",
    "reviewRating": {
      "@type": "Rating",
      "ratingValue": "${casino.rating}",
      "bestRating": "5"
    },
    "datePublished": "${isoDate}",
    "author": { "@type": "Organization", "name": "AI Casinos Review" },
    "itemReviewed": {
      "@type": "Organization",
      "name": "${casino.name}",
      "url": "${casino.url}"
    }
  }
  </script>
</head>
<body>
  <header class="site-header">
    <div class="container">
      <a href="../index.html" class="logo">🎰 AI Casinos Review</a>
      <nav>
        <a href="../index.html">Home</a>
        <a href="../best-casinos.html">Best Casinos</a>
        <a href="../bonuses.html">Bonuses</a>
      </nav>
    </div>
  </header>

  <main class="container review-page">

    <!-- ── Hero ────────────────────────────── -->
    <section class="review-hero">
      <div class="review-hero-left">
        <div class="casino-logo-placeholder">${casino.name.charAt(0)}</div>
      </div>
      <div class="review-hero-right">
        <h1>${casino.name} Review</h1>
        <div class="star-row">
          <span class="stars">${starRating(casino.rating)}</span>
          <strong class="rating-num">${casino.rating} / 5</strong>
        </div>
        <p class="established">Established: ${casino.founded}</p>
        <a href="${casino.url}" target="_blank" rel="noopener nofollow" class="btn-visit">
          Visit ${casino.name} →
        </a>
        <p class="disclaimer">18+ | Gamble responsibly | T&amp;Cs apply</p>
      </div>
    </section>

    <!-- ── Quick-info bar ───────────────────── -->
    <section class="quick-info">
      <div class="qi-item">
        <span class="qi-label">Welcome Bonus</span>
        <span class="qi-value">${casino.bonus}</span>
        ${casino.bonus_code ? `<span class="bonus-code">Code: <strong>${casino.bonus_code}</strong></span>` : ''}
      </div>
      <div class="qi-item">
        <span class="qi-label">Min. Deposit</span>
        <span class="qi-value">$${casino.min_deposit}</span>
      </div>
      <div class="qi-item">
        <span class="qi-label">Wagering</span>
        <span class="qi-value">${casino.wagering}x</span>
      </div>
      <div class="qi-item">
        <span class="qi-label">Withdrawal</span>
        <span class="qi-value">${casino.withdrawal_time}</span>
      </div>
    </section>

    <!-- ── Feature badges ───────────────────── -->
    <section class="features-row">
      ${featureBadge(casino.slots,       'Slots')}
      ${featureBadge(casino.live_casino, 'Live Casino')}
      ${featureBadge(casino.table_games, 'Table Games')}
      ${featureBadge(casino.live_games,  'Live Games')}
      ${featureBadge(casino.sports,      'Sports Betting')}
      ${featureBadge(casino.mobile,      'Mobile')}
    </section>

    <!-- ── Review body (AI-generated) ──────── -->
    <article class="review-body">
      <p class="publish-date">Published: ${publishedDate}</p>
      ${reviewBody}
    </article>

    <!-- ── Pros & Cons ──────────────────────── -->
    <section class="pros-cons">
      <div class="pros">
        <h2>✅ Pros</h2>
        <ul>${prosList}</ul>
      </div>
      <div class="cons">
        <h2>❌ Cons</h2>
        <ul>${consList}</ul>
      </div>
    </section>

    <!-- ── Payment methods ──────────────────── -->
    <section class="payment-section">
      <h2>Payment Methods</h2>
      <div class="payment-tags">${paymentIcons}</div>
    </section>

    <!-- ── Languages ───────────────────────── -->
    <section class="languages-section">
      <h2>Supported Languages</h2>
      <p>${casino.languages.join(' · ')}</p>
    </section>

    <!-- ── Tags ────────────────────────────── -->
    <div class="tags-row">${tagsList}</div>

    <!-- ── CTA ─────────────────────────────── -->
    <section class="cta-box">
      <h2>Ready to Play at ${casino.name}?</h2>
      <p>${casino.bonus}</p>
      <a href="${casino.url}" target="_blank" rel="noopener nofollow" class="btn-visit large">
        Claim Your Bonus →
      </a>
      <p class="disclaimer">18+ | T&amp;Cs apply | Gamble responsibly | BeGambleAware.org</p>
    </section>

  </main>

  <footer class="site-footer">
    <div class="container">
      <p>© ${new Date().getFullYear()} AI Casinos Review. For entertainment purposes. 18+ only.</p>
      <p><a href="../responsible-gambling.html">Responsible Gambling</a> | <a href="../privacy.html">Privacy Policy</a></p>
    </div>
  </footer>
</body>
</html>`;
}

// ── Main ───────────────────────────────────────────────────────────────────

async function main() {
  const casinosPath   = path.join(ROOT, 'data', 'casinos.json');
  const publishedPath = path.join(ROOT, 'data', 'published.json');
  const reviewsDir    = path.join(ROOT, 'site', 'reviews');

  const casinos   = loadJSON(casinosPath);
  const published = loadJSON(publishedPath);

  // Support --casino "name" override from CLI
  const cliArg = process.argv[2];
  let casino;

  if (cliArg) {
    casino = casinos.find(c =>
      c.name.toLowerCase().includes(cliArg.toLowerCase()) ||
      c.slug === cliArg
    );
    if (!casino) throw new Error(`Casino not found: ${cliArg}`);
  } else {
    // Pick next unpublished casino
    const publishedSlugs = published.map(p => p.slug);
    casino = casinos.find(c => !publishedSlugs.includes(c.slug));
    if (!casino) {
      console.log('✅ All casinos already published. Resetting queue...');
      saveJSON(publishedPath, []);
      casino = casinos[0];
    }
  }

  console.log(`🎰 Generating review for: ${casino.name}`);

  if (!fs.existsSync(reviewsDir)) fs.mkdirSync(reviewsDir, { recursive: true });

  const reviewBody = await generateReviewText(casino);
  const html       = buildReviewHTML(casino, reviewBody);
  const outFile    = path.join(reviewsDir, `${casino.slug}.html`);

  fs.writeFileSync(outFile, html);
  console.log(`✅ Review saved: ${outFile}`);

  // Mark as published
  const entry = { slug: casino.slug, name: casino.name, date: new Date().toISOString() };
  if (!published.find(p => p.slug === casino.slug)) {
    published.push(entry);
    saveJSON(publishedPath, published);
  }

  // Write metadata for build-site.js
  const metaFile = path.join(ROOT, 'data', `${casino.slug}.meta.json`);
  fs.writeFileSync(metaFile, JSON.stringify({ ...casino, publishedDate: entry.date }, null, 2));

  console.log(`📋 Metadata saved: ${metaFile}`);
}

main().catch(err => { console.error(err); process.exit(1); });
