import axios from 'axios';
import * as cheerio from 'cheerio';
import { delay, fetchWithRetry, cleanText, KEYWORDS, ANTI_KEYWORDS, simpleHash } from '../utils.js';

function filterAntiKeywords(grants) {
  return grants.filter(g => {
    const title = (g.title || '').toLowerCase();
    return !ANTI_KEYWORDS.some(kw => title.includes(kw));
  });
}

export async function theGrantPortalScraper(keywords = KEYWORDS, rows = 100) {
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
        const response = await fetchWithRetry(searchUrl, { headers: { Cookie: sessionCookie } });

        if (!response) continue;
        if (response.data.includes('Sign In') && response.data.includes('login')) {
            console.log('[thegrantportal.com] Session expired — update TGP_SESSION_COOKIE and retry');
            break;
        }

        const $ = cheerio.load(response.data);

        $('.grant-item, .grant-card, .listing-item, article').each((_, el) => {
            if (grants.length >= rows) return false;
            const $el = $(el);
            const title = cleanText($el.find('h2, h3, .title, .grant-title').first().text());
            if (!title || title.length < 5) return;

            let link = $el.find('a').first().attr('href') || '';
            if (link && !link.startsWith('http')) link = `${TGP_BASE}${link}`;

            const num = `TGP-${simpleHash(link || title)}`;
            if (seen.has(num)) return;
            seen.add(num);

            const deadline = cleanText($el.find('.deadline, .due-date').first().text()) || null;
            const amount = cleanText($el.find('.amount, .funding').first().text()) || null;

            grants.push({ number: num, title, agency: null, url: link, postedDate: null, closeDate: deadline, amount });
        });

        await delay(1500);
    }

    return filterAntiKeywords(grants.slice(0, rows));
}
