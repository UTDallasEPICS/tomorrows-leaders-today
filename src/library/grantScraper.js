// npm install axios cheerio
// run directly: node src/library/grantScraper.js

import axios from 'axios';
import * as cheerio from 'cheerio';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);
const _require   = createRequire(import.meta.url);

// Shared helpers
const _delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

function _simpleHash(str) {
  let h = 0;
  for (let i = 0; i < (str || '').length; i++) { h = Math.imul(31, h) + str.charCodeAt(i) | 0; }
  return Math.abs(h).toString(16).padStart(8, '0').substring(0, 8);
}

function _cleanText(text) {
  return (text || '').replace(/\s+/g, ' ').trim();
}

async function _fetchWithRetry(url, options = {}, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await axios({
        url,
        method: options.method || 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          ...options.headers,
        },
        data: options.data,
        timeout: 30000,
      });
      return response;
    } catch (error) {
      if (i < retries - 1) await _delay(2000 * (i + 1));
    }
  }
  return null;
}

const KEYWORDS = [
  "youth workforce",
  "workforce development",
  "workforce",
  "youth development",
  "leadership",
  "veteran",
  "veterans",
  "military",
  "Youth",
  "youth",
  "Young",
  "young",
  "Children",
  "Minors",
  "minors",
  "Education",
  "education",
  "Foster youth",
  "foster",
  "Wounded warriors",
  "Disabled veterans",
  "disabled",
  "Housing",
  "housing",
  "Elderly",
  "elderly",
  "Leader",
  "leader",
  "Leadership",
  "Community leadership",
  "Executive training",
  "executive",
  "Professional development",
  "professional",
  "Development",
  "development",
  "Texas",
  "Southern Region",
  "West South Central Division",
  "Gulf States",
];

// Titles containing any of these terms are excluded from all scrapers
const ANTI_KEYWORDS = [
  "early childhood",
  "preschool",
  "pre-school",
  "special needs",
  "physical therapy",
  "animal",
  "wildlife",
  "environmental",
  "climate",
  "agriculture",
  "arts endowment",
];

function _filterAntiKeywords(grants) {
  return grants.filter(g => {
    const title = (g.title || '').toLowerCase();
    return !ANTI_KEYWORDS.some(kw => title.includes(kw));
  });
}

const scraper = {};

scraper["grants.gov"] = async (keywords = KEYWORDS, rows = 500) => {
    const kwList = Array.isArray(keywords) ? keywords : [keywords];
    const API_URL = "https://api.grants.gov/v1/api/search2";
    const PAGE_SIZE = 100;

    async function fetchPage(keyword, startRecord = 0) {
        const resp = await _fetchWithRetry(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            data: { keyword, oppStatuses: "forecasted|posted", rows: PAGE_SIZE, startRecordNum: startRecord },
        });
        if (!resp || resp.data?.errorcode !== 0) return null;
        return resp.data.data;
    }

    const grants = [];
    const seen = new Set();

    for (const kw of kwList) {
        const firstPage = await fetchPage(kw, 0);
        if (!firstPage) continue;

        const totalHits = firstPage.hitCount || 0;
        console.log(`[grants.gov] ${totalHits} results for "${kw}"`);

        let allHits = [...(firstPage.oppHits || [])];
        let fetched = allHits.length;

        while (fetched < totalHits) {
            await _delay(500);
            const page = await fetchPage(kw, fetched);
            if (!page) break;
            const hits = page.oppHits || [];
            if (hits.length === 0) break;
            allHits.push(...hits);
            fetched += hits.length;
        }

        for (const raw of allHits) {
            const num = raw.number || `GOV-${raw.id}`;
            if (seen.has(num)) continue;
            seen.add(num);
            grants.push({
                number: num,
                title: raw.title || null,
                agency: raw.agencyName || null,
                status: raw.oppStatus || null,
                postedDate: raw.openDate || null,
                closeDate: raw.closeDate || null,
                url: `https://grants.gov/search-results-detail/${raw.id}`,
            });
        }

        await _delay(500);
    }

    return _filterAntiKeywords(grants).slice(0, rows);
}

scraper["mott.org"] = async (keywords = KEYWORDS, rows = 100) => {
    const kwList = Array.isArray(keywords) ? keywords : [keywords];
    const MOTT_BASE = 'https://www.mott.org';
    const MAX_PAGES = 2;
    const grants = [];
    const seen = new Set();

    const parseMottAmount = (text) => {
        const match = (text || '').replace(/,/g, '').match(/\d+/);
        return match ? parseInt(match[0]) : 0;
    };

    const parsePage = ($) => {
        $('a[href*="/grants/"]').each((_, el) => {
            if (grants.length >= rows) return false;
            const $el = $(el);
            const href = $el.attr('href');
            if (!href || href === '/grants/' || href.includes('?') || href.includes('#')) return;

            const title = _cleanText($el.find('h2, h3, h4, h5').first().text()) || _cleanText($el.text());
            if (!title || title.length < 5) return;

            const link = href.startsWith('http') ? href : `${MOTT_BASE}${href}`;
            const slug = href.replace(/\/$/, '').split('/').pop().replaceAll('-', '');
            const num = `mott${slug}`;
            if (seen.has(num)) return;
            seen.add(num);

            const containerText = $el.closest('article, .grant-item, div').first().text();
            const amountMatch = containerText.match(/\$[\d,]+/);
            const amount = amountMatch ? amountMatch[0] : null;

            const orgEl = $el.closest('article, .grant-item, div').first().find('p, .organization, .grantee').toArray()
                .find(el => { const t = _cleanText($(el).text()); return t && !t.startsWith('$') && !t.includes('Location') && t.length > 3; });
            const organization = orgEl ? _cleanText($(orgEl).text()) : null;

            const locationMatch = containerText.match(/Location[:\s]+([^•\n]+)/i);
            const programMatch  = containerText.match(/Program[:\s]+([^•\n]+)/i);
            const periodMatch   = containerText.match(/Grant Period[:\s]+([^•\n]+)/i);

            grants.push({
                number: num,
                title,
                agency: organization,
                amount,
                amountValue: parseMottAmount(amount),
                location: locationMatch ? _cleanText(locationMatch[1]) : null,
                program: programMatch  ? _cleanText(programMatch[1])  : null,
                grantPeriod: periodMatch ? _cleanText(periodMatch[1]) : null,
                status: 'open',
                postedDate: null,
                closeDate: null,
                url: link,
            });
        });
    };

    try {
        for (const kw of kwList) {
            if (grants.length >= rows) break;
            const searchUrl = `${MOTT_BASE}/grants/?query=${encodeURIComponent(kw)}`;

            for (let page = 1; page <= MAX_PAGES; page++) {
                if (grants.length >= rows) break;
                const pageUrl = page === 1 ? searchUrl : `${searchUrl}&pg=${page}`;
                const resp = await _fetchWithRetry(pageUrl);
                if (!resp) break;

                const $ = cheerio.load(resp.data);
                const before = grants.length;
                parsePage($);

                const hasNext = $(`a[href*="pg=${page + 1}"]`).length > 0;
                if (!hasNext || grants.length === before) break;
                await _delay(1500);
            }
            await _delay(1000);
        }

        // Fetch Mott's Youth Leadership program page directly
        const youthResp = await _fetchWithRetry(`${MOTT_BASE}/grants/?programs%5B%5D=29`);
        if (youthResp) parsePage(cheerio.load(youthResp.data));

    } catch (e) {
        console.warn('[mott.org] Error:', e.message);
    }

    grants.sort((a, b) => b.amountValue - a.amountValue);
    return _filterAntiKeywords(grants.slice(0, rows));
}

scraper["grantwatch.com"] = async (keywords = KEYWORDS, rows = 200) => {
    const kwList = Array.isArray(keywords) ? keywords : [keywords];
    const GW_BASE = 'https://www.grantwatch.com';
    const sessionCookie = process.env.GRANTWATCH_SESSION_COOKIE || null;
    const grants = [];
    const seen = new Set();

    if (!sessionCookie) {
        console.log('[grantwatch.com] No GRANTWATCH_SESSION_COOKIE — collecting public previews only ($199/yr for full access)');
    }

    const fetchGW = (url) => _fetchWithRetry(url, {
        headers: {
            'Referer': GW_BASE + '/',
            ...(sessionCookie ? { Cookie: sessionCookie } : {}),
        },
    });

    const extractId = (href) => (href.match(/\/grant\/(\d+)\//) || [])[1] || '';

    // requireRelevance=true filters category pages down to keyword-matching titles only
    const parseGrants = ($, requireRelevance = false) => {
        $('a[href*="/grant/"]').each((_, el) => {
            if (grants.length >= rows) return false;
            const $el = $(el);
            const href = $el.attr('href');
            if (!href || !href.includes('/grant/')) return;

            const title = _cleanText($el.text());
            if (!title || title.length < 10 || title === 'View' || title === 'View Grant') return;

            if (requireRelevance) {
                const titleLower = title.toLowerCase();
                const isRelevant = kwList.some(kw =>
                    kw.split(' ').some(word => titleLower.includes(word.toLowerCase()))
                );
                if (!isRelevant) return;
            }

            const $container = $el.closest('div, article, li').first();
            const containerText = $container.text();

            const deadlineMatch = containerText.match(/Deadline[:\s]*([^\n]+)/i) ||
                                  containerText.match(/(\d{2}\/\d{2}\/\d{2,4})/);
            const deadline = deadlineMatch ? _cleanText(deadlineMatch[1]) : null;

            const amountMatch = containerText.match(/\$[\d,]+(?:\s*(?:to|-)?\s*\$[\d,]+)?/);
            const amount = amountMatch ? amountMatch[0] : null;

            const description = _cleanText($container.find('p, .description, .summary').first().text()).slice(0, 300) || null;

            const grantId = extractId(href);
            const link = href.startsWith('http') ? href : `${GW_BASE}${href}`;
            const num = `GW-${grantId || _simpleHash(link)}`;
            if (seen.has(num)) return;
            seen.add(num);

            grants.push({ number: num, title, agency: null, url: link, postedDate: null, closeDate: deadline, amount, description });
        });
    };

    for (const kw of kwList) {
        if (grants.length >= rows) break;
        await _delay(2000);
        const searchRes = await fetchGW(`${GW_BASE}/grant-search.php?keyword=${encodeURIComponent(kw)}`);
        if (!searchRes) continue;
        if (searchRes.data.includes('Please login') || searchRes.data.includes('subscription')) {
            console.log('[grantwatch.com] Subscription required for full search results');
        }
        parseGrants(cheerio.load(searchRes.data));
    }

    if (grants.length < rows) {
        const categories = [
            '/cat/40/workforce-grants.html',
            '/cat/41/youth-and-at-risk-youth-grants.html',
            '/cat/59/education-grants.html',
            '/cat/5/community-services-grants.html',
        ];
        for (const cat of categories) {
            if (grants.length >= rows) break;
            await _delay(1500);
            const catRes = await fetchGW(`${GW_BASE}${cat}`);
            if (catRes) parseGrants(cheerio.load(catRes.data), true);
        }
    }

    return _filterAntiKeywords(grants.slice(0, rows));
}

scraper["thegrantportal.com"] = async (keywords = KEYWORDS, rows = 100) => {
    const TGP_BASE = 'https://texas.thegrantportal.com';
    const sessionCookie = process.env.TGP_SESSION_COOKIE || null;

    if (!sessionCookie) {
        console.log('[thegrantportal.com] TGP_SESSION_COOKIE not set — skipping');
        console.log('  To enable:');
        console.log('  1. Login to texas.thegrantportal.com in your browser');
        console.log('  2. Open DevTools (F12) > Application > Cookies');
        console.log('  3. Copy the session cookie value');
        console.log('  4. Set it as: export TGP_SESSION_COOKIE="<value>"');
        return [];
    }

    const kwList = Array.isArray(keywords) ? keywords : [keywords];
    const grants = [];
    const seen = new Set();

    for (const kw of kwList) {
        if (grants.length >= rows) break;

        const searchUrl = `${TGP_BASE}/grants?search=${encodeURIComponent(kw)}`;
        const response = await _fetchWithRetry(searchUrl, { headers: { Cookie: sessionCookie } });

        if (!response) continue;
        if (response.data.includes('Sign In') && response.data.includes('login')) {
            console.log('[thegrantportal.com] Session expired — update TGP_SESSION_COOKIE and retry');
            break;
        }

        const $ = cheerio.load(response.data);

        $('.grant-item, .grant-card, .listing-item, article').each((_, el) => {
            if (grants.length >= rows) return false;
            const $el = $(el);
            const title = _cleanText($el.find('h2, h3, .title, .grant-title').first().text());
            if (!title || title.length < 5) return;

            let link = $el.find('a').first().attr('href') || '';
            if (link && !link.startsWith('http')) link = `${TGP_BASE}${link}`;

            const num = `TGP-${_simpleHash(link || title)}`;
            if (seen.has(num)) return;
            seen.add(num);

            const deadline = _cleanText($el.find('.deadline, .due-date').first().text()) || null;
            const amount = _cleanText($el.find('.amount, .funding').first().text()) || null;

            grants.push({ number: num, title, agency: null, url: link, postedDate: null, closeDate: deadline, amount });
        });

        await _delay(1500);
    }

    return _filterAntiKeywords(grants.slice(0, rows));
}

export default scraper;

// ─── RUN DIRECTLY ───────────────────────────────────────────
// node src/library/grantScraper.js

if (process.argv[1] === __filename) {
  const dbHandler = _require('./db_handler.cjs');
  const OUTPUT_DIR = path.join(__dirname, 'output');

  async function main() {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });

    const allGrants = [];

    for (const [source, fn] of Object.entries(scraper)) {
      console.log(`\nScraping ${source}...`);
      try {
        const results = await fn();
        console.log(`  ${results.length} grants from ${source}`);
        allGrants.push(...results.map(g => ({ ...g, source })));
      } catch (err) {
        console.error(`  Error scraping ${source}: ${err.message}`);
      }
    }

    console.log(`\nTotal: ${allGrants.length} grants`);

    // Write combined JSON
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const latestPath     = path.join(OUTPUT_DIR, 'all_grants_latest.json');
    const timestampedPath = path.join(OUTPUT_DIR, `all_grants_${timestamp}.json`);
    fs.writeFileSync(latestPath,      JSON.stringify(allGrants, null, 2));
    fs.writeFileSync(timestampedPath, JSON.stringify(allGrants, null, 2));
    console.log(`Saved: ${latestPath}`);

    // Save to DB
    const result = dbHandler.saveGrants(allGrants.map(g => ({ ...g, source: 'grantScraper' })));
    console.log(`DB — Inserted: ${result.inserted} | Updated: ${result.updated} | Skipped: ${result.skipped} | Errors: ${result.errors}`);
  }

  main().catch(err => {
    console.error('Fatal:', err.message);
    process.exit(1);
  });
}