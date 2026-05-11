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
import puppeteer from 'puppeteer';

// Stores URL-function pairs, detailing ways to specifically scrape websites.
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
scraper["grants.gov"] = async (query, rows = 500) => {
    const endpoint = 'https://api.grants.gov/v1/api/search2';

    const body = {
        keyword: query,
        oppStatuses: "forecasted|posted",
        rows: rows,
        startRecordNum: 0,
    };

    const resp = await axios.post(endpoint, body, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 30000,
    });

    if (resp.data?.errorcode !== 0) {
        throw new Error(`API error: ${resp.data?.msg || 'unknown'}`);
    }

    const data = resp.data.data;
    const list = data.oppHits || [];
    console.log("Total matching grants:", data.hitCount);
    console.log("Number of grants in this page:", list.length);

    const withAwards = list.filter(o => o.awardFloor || o.awardCeiling);
    console.log(`Grants with award data: ${withAwards.length} / ${list.length}`);
    if (withAwards[0]) console.log("Sample with awards:", JSON.stringify(withAwards[0], null, 2));

    return list.map(opp => ({
        id: opp.id,
        number: opp.number,
        title: opp.title,
        agency: opp.agencyName || opp.agencyCode || null,
        status: opp.oppStatus,
        postedDate: opp.openDate,
        closeDate: opp.closeDate,
        awardFloor: opp.awardFloor ?? null,
        awardCeiling: opp.awardCeiling ?? null,
        url: 'https://grants.gov/search-results-detail/' + opp.id,
    }));
}

scraper["mott.org"] = async (query, rows = 100) => {
    try {
        const searchUrl = `https://www.mott.org/grants/?location=Texas&query=${encodeURIComponent(query)}`;
        const results = await axios.get(searchUrl);

        const $ = cheerio.load(results.data);
        const pageCount = parseInt($('div.paging1 > ul > li:nth-last-of-type(2) > a').text());

        const grants = [];
        let page = 1;
        while (grants.length < rows && page <= pageCount) {
            const data = await axios.get(`${searchUrl}&pg=${page}`);
            const $ = cheerio.load(data.data);

            $('.card6').each((_, el) => {
                if (grants.length >= rows) return false;
                const title = $(el).find('a > span').text().trim();
                let url = $(el).find('a').attr('href');
                url = url.substring(0, url.length - 1);

                const opp = url.substring(url.lastIndexOf('/') + 1).replaceAll("-", "");
                const sponsor = $(el).find('div > p.card6-subtitle').text().trim();
                const amount = parseInt($(el).find('div > p.card6-amount').text().trim().replaceAll(",", "").substring(1));
                let postedDate = '';
                let closeDate = '';
                $(el).find('li').each((__, li) => {
                    if ($(li).text().includes('Grant Period')) {
                        const dates = $(li).find('span').text().trim().split('–');
                        postedDate = new Date(dates[0].trim());
                        closeDate = new Date(dates[1].trim());
                    }
                });

                grants.push({
                    number: `mott${opp}`,
                    title: title,
                    agency: sponsor,
                    amount: amount,
                    status: 'open',
                    postedDate: postedDate,
                    closeDate: closeDate,
                    url: url,
                });
            });
            page++;
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

scraper["txsmartbuy.gov"] = async (rows = 100) => {   
    /**
     * Scrapes for grants from "txsmartbuy.gov" and returns an array of grants in .json form.
     * 
     * SCHEMA FOR GRANTS: see return statement for inner function 'scrapeAt' 
     * 
     * @param {Number} rows the max number of grants to scrape from this url
     * @returns an array of all grants scraped from this URL, expressed in json.
     */

    const scrapeAt = async (url, page) => {
        /**
         * Goes to a grant's url to scrape specific information form there
         * 
         * @param {String} url to the specific grant
         *      PRECONDITION: the url is absolute and will correctly lead to the 
         *                      grant if directly pasted into a search bar.
         * @param {Page} page the headless browser instance that can scrape through
         *                      the page
         * @returns a json object depicting information about a grant (see return statement)
         */
    
        try {
            // Headless browser to get the grants at a PAGE NUMBER
            console.log("\n\nLINK:", url);
            await page.goto(url, {waitUntil: 'networkidle0'});
            await page.waitForSelector("div.esbd-result-body-columns");

            const html = await page.content();
            const $ = cheerio.load(html);

            // There are four columns to get information from
            let columns = $(".esbd-result-column.egrant-column");
            const topLeft = columns.eq(0);
            const topRight = columns.eq(1);
            const bottomLeft = columns.eq(2);
            const bottomRight = columns.eq(3);
            
            // Scrape general information
            const title       = $(".egrant-details-container > .esbd-result-title > h4").text();
            const topLeftChildren = topLeft.children(".esbd-result-cell");
            const agency      = topLeftChildren.eq(0).children("p").text();
            const grantNumber = topLeftChildren.eq(2).children("p").text();
            
            // Scrape opening/closing dates and format them
            const topRightChildren = topRight.children(".esbd-result-cell");
            let openingDate = topRightChildren.eq(2).children("p").text(); // In the form mm/dd/yyyy
            let closingDate = topRightChildren.eq(4).children("p").text();
            const [openingMonth, openingDay, openingYear] = openingDate.split("/");
            const [closingMonth, closingDay, closingYear] = closingDate.split("/");
            openingDate = new Date(openingYear, openingMonth - 1, openingDay);
            closingDate = new Date(closingYear, closingMonth - 1, closingDay);
            
            // Scrape categories
            const bottomLeftChildren = bottomLeft.children(".esbd-result-cell");
            const category = bottomLeftChildren
                .children("ul")
                .children("li")
                .eq(0).text(); // There can be multiple categories; stick with the first for now

            // Scrape min/max amount and application link
            const bottomRightChildren   = bottomRight.children(".esbd-result-cell");
            let totalFundingAmount      = bottomRightChildren.eq(0).children("p").text();
            let awardFloor              = bottomRightChildren.eq(2).children("p").text();
            let awardCeiling            = bottomRightChildren.eq(3).children("p").text();
            let applicationLink         = bottomRightChildren.eq(4).children("a").attr("href");
            
            return {
                title,
                agency,
                grantNumber,
                openingDate,
                closingDate,
                category,
                applicationLink,
                totalFundingAmount,
                awardFloor,
                awardCeiling,
            };
        } catch (e) {
            console.warn("Error fetching grant at url:", url, " due to error:", e);
        }
        
        return [];
    }

    //----Headless browser to get HTML (website is dynamic)
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    
    const searchUrl = "https://www.txsmartbuy.gov/esbd-grants";
    await page.goto(searchUrl);
    await page.waitForSelector(".global-views-pagination-count");
    
    let html = await page.content();
    //----END headless browser to get HTML
    
    try { 
        //----Get page count
        const $ = cheerio.load(html);
        
        let pageCount = $("p.global-views-pagination-count"); 
        if (pageCount.length === 0) { // No page selector means there's only one page
            pageCount = 1;
        } else {
            const tokens = pageCount.first().text().match(/\S+/g); // There are two of these "page selectors", so get the text of one
            pageCount = parseInt(tokens[tokens.length - 2]);
        }
        //----END Get page count
        
        // Fetch the grants
        const grants = [];
        let pageNum = 1;
        
        do {
            //----Fetch page at current page number
            
            // Query page using Cheerio 
            const $ = cheerio.load(html);
            let grantEntries = $(".esbd-result-row"); // Get all grants on the page
            
            if (grantEntries.length === 0) { 
                break; // No entries to scrape
            }
            //----END Fetch page at current page number
            
            // Scrape information from each grant entry's page
            for (let i = 0; i < grantEntries.length; i++) {
                if (grants.length > rows) {
                    break;
                }
                let el = grantEntries.eq(i);
                let grantUrl = `https://www.txsmartbuy.gov${$(el).find("div.esbd-result-title > a").attr("href")}`; // Url to detailed information about grant
                let grantInfo = await scrapeAt(grantUrl, page);
                grants.push(grantInfo);
            }

            // Navigate to next page of grants
            pageNum++; 
            await page.goto(`https://www.txsmartbuy.gov/esbd-grants?page=${pageNum}`, { waitUntil: 'networkidle0' });
            
            html = await page.content();
        } while (pageNum <= pageCount);
        
        await browser.close();

        return grants;
    } catch (e) {
        console.warn("Error fetching txsmartbuy.gov grants:", e);
    }
    
    await browser.close();
    
    return [];
}

scraper["tgrc.hogg.utexas.edu"] = async () => {
  const SOURCE_URL = "https://tgrc.hogg.utexas.edu/statewide-opportunities/";
  const HTTP_CONFIG = {
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; TGRCScraper/1.0; research use)",
      Accept: "text/html,application/xhtml+xml",
    },
    timeout: 20000,
  };

  const FOCUS_KEYWORDS = [
    "youth workforce", "workforce development", "workforce", "youth development",
    "leadership", "veteran", "veterans", "military", "youth", "young", "children",
    "minors", "early childhood", "childhood", "education", "childcare", "pediatric",
    "foster youth", "foster", "housing", "elderly", "leader", "community leadership",
    "executive training", "executive", "professional development", "professional", "development",
  ];

  function parseDate(raw) {
    if (!raw) return null;
    const s = raw.trim();
    const longMatch = s.match(/^(january|february|march|april|may|june|july|august|september|october|november|december)\s+(\d{1,2}),?\s+(\d{4})/i);
    if (longMatch) {
      const months = { january:"01", february:"02", march:"03", april:"04", may:"05", june:"06", july:"07", august:"08", september:"09", october:"10", november:"11", december:"12" };
      const [, mon, day, year] = longMatch;
      return new Date(`${year}-${months[mon.toLowerCase()]}-${day.padStart(2,"0")}T00:00:00.000Z`);
    }
    const mdyMatch = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
    if (mdyMatch) {
      const [, m, d, y] = mdyMatch;
      return new Date(`${y}-${m.padStart(2,"0")}-${d.padStart(2,"0")}T00:00:00.000Z`);
    }
    if (/^\d{4}-\d{2}-\d{2}/.test(s)) return new Date(`${s.slice(0,10)}T00:00:00.000Z`);
    return null;
  }

  function detectCategory(text) {
    const lower = text.toLowerCase();
    const cats = [];
    if (lower.includes("veteran") || lower.includes("military")) cats.push("Veterans");
    if (lower.includes("workforce")) cats.push("Workforce Development");
    if (lower.includes("youth")) cats.push("Youth Development");
    if (lower.includes("leadership")) cats.push("Leadership");
    return cats.length > 0 ? cats.join(", ") : "General Nonprofit";
  }

  const res = await axios.get(SOURCE_URL, HTTP_CONFIG);
  const $ = cheerio.load(res.data);
  const grants = [];
  let inGrantsSection = false;
  let stopProcessing = false;
  let grantIndex = 1;

  $(".entry-content").children().each((_, el) => {
    if (stopProcessing) return;
    const tag = el.tagName.toLowerCase();
    const text = $(el).text().toLowerCase();
    if (tag.match(/^h[1-6]$/) && text.includes("upcoming grant opportunities")) { inGrantsSection = true; return; }
    if (inGrantsSection && tag.match(/^h[1-6]$/) && !text.includes("upcoming grant opportunities")) { stopProcessing = true; return; }
    if (!inGrantsSection || tag !== "ul") return;
    const $li = $(el).children("li").first();
    if (!$li.length) return;
    const titleEl = $li.find("> a > strong, > strong > a, > a, > strong").first();
    const title = titleEl.text().trim();
    if (!title) return;
    const applicationLink = $li.find("> a").first().attr("href") || null;
    const subItems = $li.find("> ul > li").map((__, sub) => $(sub).text().trim()).get();
    const agency = subItems[0] || null;
    let closeDate = null;
    for (const item of subItems) {
      const m = item.match(/^Deadline:\s*(.+)/i);
      if (m) { closeDate = parseDate(m[1]); break; }
    }
    const combined = `${title} ${subItems.join(" ")}`;
    if (!FOCUS_KEYWORDS.some(kw => combined.toLowerCase().includes(kw.toLowerCase()))) return;
    grants.push({
      number: `TGRC-${String(grantIndex++).padStart(4,"0")}`,
      title,
      agency,
      status: "open",
      postedDate: null,
      closeDate,
      amount: null,
      url: applicationLink,
      category: detectCategory(combined),
      applicationType: "Grant",
    });
  });

  return grants;
};

// WARNING: Untested and may need to be debugged
scraper["tealprod.tea.state.tx.us"] = async () => {
    const TEA_URL = 'https://tealprod.tea.state.tx.us/GrantOpportunities/forms/GrantProgramSearch.aspx';

    function extractAspNetFields($) {
      const fields = {};
      ['__VIEWSTATE','__VIEWSTATEGENERATOR','__EVENTVALIDATION','__EVENTTARGET','__EVENTARGUMENT','__LASTFOCUS','__SCROLLPOSITIONX','__SCROLLPOSITIONY']
        .forEach(name => {
          const val = $(`input[name="${name}"]`).val();
          if (val !== undefined) fields[name] = val;
        });
      return fields;
    }

    function buildPostBody(aspNetFields, extraFields = {}) {
      const params = new URLSearchParams();
      Object.entries(aspNetFields).forEach(([k, v]) => params.append(k, v));
      Object.entries(extraFields).forEach(([k, v]) => params.append(k, v));
      return params;
    }

    function findNextPagePostback($, currentPage) {
      const pattern = new RegExp(`__doPostBack\\('([^']+)','Page\\$${currentPage + 1}'\\)`);
      let target = null, argument = null;
      $('a').each((_, el) => {
        const match = ($(el).attr('href') || '').match(pattern);
        if (match) { target = match[1]; argument = `Page$${currentPage + 1}`; return false; }
      });
      return target ? { __EVENTTARGET: target, __EVENTARGUMENT: argument } : null;
    }

    // TEA Repeater columns:
    //   0: View icon (<a> with title = grant name)
    //   1: Grant Name (plain text)
    //   2: Availability / Opening Date
    //   3: Due / Closing Date
    //   4: Application Type
    //   5: Submission Type
    function parseGrantRow($, row, index) {
      const cells = $(row).find('td');
      if (cells.length < 4) return null;

      const title = $(cells[1]).text().trim()
        || $(cells[0]).find('a').attr('title')?.trim()
        || null;
      if (!title) return null;

      const rawId = $(cells[0]).find('a').attr('title')?.trim() || title;
      const opportunityNumber = rawId.replace(/[^a-zA-Z0-9 \-]/g, '').trim().substring(0, 100)
        || `TEA-${index}-${Date.now()}`;

      const openingDate  = $(cells[2])?.text().trim() || null;
      const closingDate  = $(cells[3])?.text().trim() || null;
      const category     = $(cells[4])?.text().trim() || null;

      return {
        opportunityNumber,
        title,
        agency: 'Texas Education Agency',
        category,
        applicationLink: TEA_URL,
        openingDate,
        closingDate,
        applicationType: 'Grant',
      };
    }

    async function scrapeAllGrants(maxRows = 9999) {
      const cookieJar = {};
      const session = axios.create({
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
        },
        maxRedirects: 5,
      });

      session.interceptors.response.use(res => {
        (res.headers['set-cookie'] || []).forEach(c => {
          const [kv] = c.split(';');
          const [k, v] = kv.split('=');
          cookieJar[k.trim()] = v?.trim() || '';
        });
        return res;
      });
      session.interceptors.request.use(config => {
        const str = Object.entries(cookieJar).map(([k, v]) => `${k}=${v}`).join('; ');
        if (str) config.headers['Cookie'] = str;
        return config;
      });

      // GET page to harvest hidden fields
      const initialRes = await session.get(TEA_URL);
      let $ = cheerio.load(initialRes.data);
      let aspFields = extractAspNetFields($);

      const searchInputName = $('input[type="text"]').first().attr('name') || 'ctl00$ContentPlaceHolder1$txtKeyword';
      const submitBtnName   = $('input[type="submit"]').first().attr('name') || 'ctl00$ContentPlaceHolder1$btnSearch';

      // POST blank search — returns all grants
      const searchRes = await session.post(
        TEA_URL,
        buildPostBody(aspFields, {
          [searchInputName]: '',
          [submitBtnName]: 'Search',
          __EVENTTARGET: '',
          __EVENTARGUMENT: '',
        }),
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded', Referer: TEA_URL } }
      );

      $ = cheerio.load(searchRes.data);
      aspFields = extractAspNetFields($);

      const grants = [];

      const collectFromPage = () => {
        const tableSelectors = ['table#Searchresults table', 'table[id*="Grid"]', 'table.gridView', 'table'];
        let table = null;
        for (const sel of tableSelectors) {
          const t = $(sel).filter((_, el) => $(el).find('tr').length > 1);
          if (t.length) { table = t.first(); break; }
        }
        if (!table) return false;
        let added = 0;
        table.find('tr').filter((_, row) => {
          return ($(row).find('td').first().attr('class') || '').includes('tabledata');
        }).each((_, row) => {
          if (grants.length >= maxRows) return false;
          const grant = parseGrantRow($, row, grants.length);
          if (grant) { grants.push(grant); added++; }
        });
        return added > 0;
      };

      collectFromPage();

      // Paginate
      let currentPage = 1;
      while (grants.length < maxRows) {
        const next = findNextPagePostback($, currentPage);
        if (!next) break;
        const pageRes = await session.post(
          TEA_URL,
          buildPostBody(aspFields, { ...next, [searchInputName]: '' }),
          { headers: { 'Content-Type': 'application/x-www-form-urlencoded', Referer: TEA_URL } }
        );
        $ = cheerio.load(pageRes.data);
        aspFields = extractAspNetFields($);
        if (!collectFromPage()) break;
        currentPage++;
      }

      return grants;
    }

    return await scrapeAllGrants();
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
export default scraper;
