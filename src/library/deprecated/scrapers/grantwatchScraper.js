import axios from 'axios';
import * as cheerio from 'cheerio';
import { delay, fetchWithRetry, cleanText, KEYWORDS, ANTI_KEYWORDS, simpleHash } from '../utils.js';

const CONFIG = {
  baseUrl: 'https://www.grantwatch.com',
  searchUrl: 'https://www.grantwatch.com/grant-search.php',
  sessionCookie: process.env.GRANTWATCH_SESSION_COOKIE || null,
};

function extractGrantId(url) {
  const match = url.match(/\/grant\/(\d+)\//);
  return match ? match[1] : '';
}

function filterAntiKeywords(grants) {
  return grants.filter(g => {
    const title = (g.title || '').toLowerCase();
    return !ANTI_KEYWORDS.some(kw => title.includes(kw));
  });
}

export async function grantwatchScraper(keywords = KEYWORDS, rows = 200) {
  const kwList = Array.isArray(keywords) ? keywords : [keywords];
  const grants = [];
  const seen = new Set();

  if (!CONFIG.sessionCookie) {
    console.log('[grantwatch.com] No GRANTWATCH_SESSION_COOKIE — collecting public previews only ($199/yr for full access)');
  }

  const fetchGW = (url) => fetchWithRetry(url, {
    headers: {
      'Referer': CONFIG.baseUrl + '/',
      ...(CONFIG.sessionCookie ? { Cookie: CONFIG.sessionCookie } : {}),
    },
  });

  const parseGrants = ($, requireRelevance = false) => {
    $('a[href*="/grant/"]').each((_, el) => {
      if (grants.length >= rows) return false;
      const $el = $(el);
      const href = $el.attr('href');
      if (!href || !href.includes('/grant/')) return;

      const title = cleanText($el.text());
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
      const deadline = deadlineMatch ? cleanText(deadlineMatch[1]) : null;

      const amountMatch = containerText.match(/\$[\d,]+(?:\s*(?:to|-)?\s*\$[\d,]+)?/);
      const amount = amountMatch ? amountMatch[0] : null;

      const description = cleanText($container.find('p, .description, .summary').first().text()).slice(0, 300) || null;

      const grantId = extractGrantId(href);
      const link = href.startsWith('http') ? href : `${CONFIG.baseUrl}${href}`;
      const num = `GW-${grantId || simpleHash(link)}`;
      if (seen.has(num)) return;
      seen.add(num);

      grants.push({ number: num, title, agency: null, url: link, postedDate: null, closeDate: deadline, amount, description });
    });
  };

  for (const kw of kwList) {
    if (grants.length >= rows) break;
    await delay(2000);
    const searchRes = await fetchGW(`${CONFIG.searchUrl}?keyword=${encodeURIComponent(kw)}`);
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
      await delay(1500);
      const catRes = await fetchGW(`${CONFIG.baseUrl}${cat}`);
      if (catRes) parseGrants(cheerio.load(catRes.data), true);
    }
  }

  return filterAntiKeywords(grants.slice(0, rows));
}
