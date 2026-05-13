import axios from 'axios';
import { delay, fetchWithRetry, cleanText, KEYWORDS, ANTI_KEYWORDS, simpleHash } from '../utils.js';

function filterAntiKeywords(grants) {
  return grants.filter(g => {
    const title = (g.title || '').toLowerCase();
    return !ANTI_KEYWORDS.some(kw => title.includes(kw));
  });
}

export async function grantsGovScraper(keywords = KEYWORDS, rows = 500) {
    const kwList = Array.isArray(keywords) ? keywords : [keywords];
    const API_URL = "https://api.grants.gov/v1/api/search2";
    const PAGE_SIZE = 100;

    async function fetchPage(keyword, startRecord = 0) {
        const resp = await fetchWithRetry(API_URL, {
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
            await delay(500);
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

        await delay(500);
    }

    return filterAntiKeywords(grants).slice(0, rows);
}
