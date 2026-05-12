import axios from 'axios';
import * as cheerio from 'cheerio';
import { delay, fetchWithRetry, cleanText, KEYWORDS, ANTI_KEYWORDS, simpleHash } from '../utils.js';

const CONFIG = {
  baseUrl: 'https://www.mott.org',
  searchUrl: 'https://www.mott.org/grants/',
  maxPages: 2,
};

function parseAmount(amountStr) {
  if (!amountStr) return 0;
  const match = amountStr.replace(/,/g, '').match(/\d+/);
  return match ? parseInt(match[0]) : 0;
}

function filterAntiKeywords(grants) {
  return grants.filter(g => {
    const title = (g.title || '').toLowerCase();
    return !ANTI_KEYWORDS.some(kw => title.includes(kw));
  });
}

export async function mottScraper(keywords = KEYWORDS, rows = 100) {
  const kwList = Array.isArray(keywords) ? keywords : [keywords];
  const grants = [];
  const seen = new Set();

  const parsePage = ($) => {
    $('a[href*="/grants/"]').each((_, el) => {
      if (grants.length >= rows) return false;
      const $el = $(el);
      const href = $el.attr('href');
      if (!href || href === '/grants/' || href.includes('?') || href.includes('#')) return;

      const title = cleanText($el.find('h2, h3, h4, h5').first().text()) || cleanText($el.text());
      if (!title || title.length < 5) return;

      const link = href.startsWith('http') ? href : `${CONFIG.baseUrl}${href}`;
      const slug = href.replace(/\/$/, '').split('/').pop().replaceAll('-', '');
      const num = `mott${slug}`;
      if (seen.has(num)) return;
      seen.add(num);

      const containerText = $el.closest('article, .grant-item, div').first().text();
      const amountMatch = containerText.match(/\$[\d,]+/);
      const amount = amountMatch ? amountMatch[0] : null;

      const orgEl = $el.closest('article, .grant-item, div').first().find('p, .organization, .grantee').toArray()
          .find(el => { const t = cleanText($(el).text()); return t && !t.startsWith('$') && !t.includes('Location') && t.length > 3; });
      const organization = orgEl ? cleanText($(orgEl).text()) : null;

      const locationMatch = containerText.match(/Location[:\s]+([^•\n]+)/i);
      const programMatch  = containerText.match(/Program[:\s]+([^•\n]+)/i);
      const periodMatch   = containerText.match(/Grant Period[:\s]+([^•\n]+)/i);

      grants.push({
          number: num,
          title,
          agency: organization,
          amount,
          amountValue: parseAmount(amount),
          location: locationMatch ? cleanText(locationMatch[1]) : null,
          program: programMatch  ? cleanText(programMatch[1])  : null,
          grantPeriod: periodMatch ? cleanText(periodMatch[1]) : null,
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
      const searchUrl = `${CONFIG.baseUrl}/grants/?query=${encodeURIComponent(kw)}`;

      for (let page = 1; page <= CONFIG.maxPages; page++) {
        if (grants.length >= rows) break;
        const pageUrl = page === 1 ? searchUrl : `${searchUrl}&pg=${page}`;
        const resp = await fetchWithRetry(pageUrl);
        if (!resp) break;

        const $ = cheerio.load(resp.data);
        const before = grants.length;
        parsePage($);

        const hasNext = $(`a[href*="pg=${page + 1}"]`).length > 0;
        if (!hasNext || grants.length === before) break;
        await delay(1500);
      }
      await delay(1000);
    }

    const youthResp = await fetchWithRetry(`${CONFIG.baseUrl}/grants/?programs%5B%5D=29`);
    if (youthResp) parsePage(cheerio.load(youthResp.data));

  } catch (e) {
    console.warn('[mott.org] Error:', e.message);
  }

  grants.sort((a, b) => b.amountValue - a.amountValue);
  return filterAntiKeywords(grants.slice(0, rows));
}
