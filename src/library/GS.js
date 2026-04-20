// npm install axios cheerio

import axios from 'axios';
import * as cheerio from 'cheerio';

/**
 * Scrapes grant opportunities from the Texas Education Agency (TEA) grant search page.
 *
 * The TEA site is an ASP.NET Web Forms (.aspx) page. These pages use hidden fields
 * (__VIEWSTATE, __EVENTVALIDATION, etc.) that must be extracted from a GET request
 * and re-submitted with every POST request (a pattern called the "postback" lifecycle).
 *
 * Strategy:
 *  1. GET the page → extract hidden ASP.NET fields + any default form values.
 *  2. POST back with the search keyword + hidden fields → get results.
 *  3. If results are paginated, repeat step 2 for each page by clicking the "next" link
 *     (another postback), collecting grants until we hit the `rows` limit.
 *
 * @param {string} query  - keyword to filter grants (passed to the search field)
 * @param {number} rows   - maximum number of grants to return (default 500)
 *
 * @returns {Promise<Array<{
 *   grantName:  string,   // Grant Name
 *   grantId:    string,   // Grant ID
 *   agency:     string,   // Agency / Sponsor
 *   category:   string,   // Category / Topic
 *   dueDate:    string,   // Due Date (close date)
 *   url:        string,   // Link to grant detail page
 * }>>}
 */

const BASE_URL = 'https://tealprod.tea.state.tx.us/GrantOpportunities/forms/GrantProgramSearch.aspx';

// ---------------------------------------------------------------------------
// Helper: extract all ASP.NET hidden / infrastructure fields from a loaded page
// ---------------------------------------------------------------------------
function extractAspNetFields($) {
    const fields = {};
    const hiddenNames = [
        '__VIEWSTATE',
        '__VIEWSTATEGENERATOR',
        '__EVENTVALIDATION',
        '__EVENTTARGET',
        '__EVENTARGUMENT',
        '__LASTFOCUS',
        '__SCROLLPOSITIONX',
        '__SCROLLPOSITIONY',
    ];
    hiddenNames.forEach(name => {
        const val = $(`input[name="${name}"]`).val();
        if (val !== undefined) fields[name] = val;
    });
    return fields;
}

// ---------------------------------------------------------------------------
// Helper: build URLSearchParams for a postback
// ---------------------------------------------------------------------------
function buildPostBody(aspNetFields, extraFields = {}) {
    const params = new URLSearchParams();
    // ASP.NET infrastructure first
    Object.entries(aspNetFields).forEach(([k, v]) => params.append(k, v));
    // Form-specific fields
    Object.entries(extraFields).forEach(([k, v]) => params.append(k, v));
    return params;
}

// ---------------------------------------------------------------------------
// Helper: parse a results table row into a grant object
// ---------------------------------------------------------------------------
function parseGrantRow($, row, index) {
    const cells = $(row).find('td');
    if (cells.length === 0) return null;

    // TEA table columns (verify against live page if columns shift):
    //   0: Grant ID
    //   1: Grant Name  (contains <a> link to detail page)
    //   2: Agency / Sponsor
    //   3: Category / Topic
    //   4: Open / Posted Date  (not returned, used internally)
    //   5: Due Date (close date)
    const grantId  = $(cells[0]).text().trim();
    const nameEl   = $(cells[1]).find('a');
    const grantName = nameEl.length ? nameEl.text().trim() : $(cells[1]).text().trim();
    const relUrl   = nameEl.attr('href') || '';
    const url      = relUrl.startsWith('http')
        ? relUrl
        : relUrl
            ? new URL(relUrl, BASE_URL).href
            : BASE_URL;
    const agency   = $(cells[2])?.text().trim() || 'Texas Education Agency';
    const category = $(cells[3])?.text().trim() || '';
    const dueDate  = $(cells[5])?.text().trim() || $(cells[4])?.text().trim() || '';

    if (!grantName) return null; // skip empty / header rows

    return {
        grantName,
        grantId:  grantId || `tea-${index}`,
        agency,
        category,
        dueDate,
        url,
    };
}

// ---------------------------------------------------------------------------
// Helper: collect grants from a loaded cheerio page
// ---------------------------------------------------------------------------
function collectGrantsFromPage($, grants, maxRows) {
    // The results table on the TEA page – adjust the selector if needed.
    // Common patterns: table.gridView, table#GridView1, table[id*="Grid"]
    const tableSelectors = [
        'table[id*="Grid"]',
        'table.gridView',
        'table#ctl00_ContentPlaceHolder1_GridView1',
        'table',
    ];

    let resultsTable = null;
    for (const sel of tableSelectors) {
        const t = $(sel).filter((_, el) => $(el).find('tr').length > 1);
        if (t.length) { resultsTable = t.first(); break; }
    }

    if (!resultsTable) return false; // no table found

    let added = 0;
    resultsTable.find('tr').each((i, row) => {
        if (grants.length >= maxRows) return false; // break
        if (i === 0) return; // skip header row
        const grant = parseGrantRow($, row, grants.length);
        if (grant) { grants.push(grant); added++; }
    });
    return added > 0;
}

// ---------------------------------------------------------------------------
// Helper: detect if a "next page" pager link exists and return its __doPostBack args
// ---------------------------------------------------------------------------
function findNextPagePostback($, currentPage) {
    // ASP.NET GridView pagers emit links like: javascript:__doPostBack('GridView1','Page$2')
    const nextPage = currentPage + 1;
    const pattern  = new RegExp(`__doPostBack\\('([^']+)','Page\\$${nextPage}'\\)`);
    let target = null, argument = null;

    $('a').each((_, el) => {
        const href = $(el).attr('href') || '';
        const match = href.match(pattern);
        if (match) {
            target   = match[1];
            argument = `Page$${nextPage}`;
            return false; // break
        }
    });

    return target ? { __EVENTTARGET: target, __EVENTARGUMENT: argument } : null;
}

// ---------------------------------------------------------------------------
// Main scraper
// ---------------------------------------------------------------------------
const teaScraper = async (query = '', rows = 500) => {
    const session = axios.create({
        baseURL: BASE_URL,
        headers: {
            'User-Agent':
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
                '(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
            'Accept':
                'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9',
        },
        withCredentials: true,
        maxRedirects: 5,
    });

    // Persist cookies across requests
    const cookieJar = {};
    session.interceptors.response.use(response => {
        const setCookie = response.headers['set-cookie'];
        if (setCookie) {
            setCookie.forEach(c => {
                const [kv] = c.split(';');
                const [k, v] = kv.split('=');
                cookieJar[k.trim()] = v?.trim() || '';
            });
        }
        return response;
    });
    session.interceptors.request.use(config => {
        const cookieStr = Object.entries(cookieJar)
            .map(([k, v]) => `${k}=${v}`)
            .join('; ');
        if (cookieStr) config.headers['Cookie'] = cookieStr;
        return config;
    });

    // ── Step 1: GET the page to harvest ASP.NET hidden fields ────────────────
    console.log('[TEA] Fetching initial page...');
    const initialRes = await session.get(BASE_URL);
    let $ = cheerio.load(initialRes.data);
    let aspFields = extractAspNetFields($);

    // ── Step 2: POST the search form ─────────────────────────────────────────
    // Identify the search textbox and submit button names from the page.
    // Fallback names are common TEA patterns; override if the live page differs.
    const searchInputName =
        $('input[type="text"]').first().attr('name') ||
        'ctl00$ContentPlaceHolder1$txtKeyword';
    const submitBtnName =
        $('input[type="submit"]').first().attr('name') ||
        'ctl00$ContentPlaceHolder1$btnSearch';

    console.log(`[TEA] Submitting search for: "${query}"`);
    const searchRes = await session.post(
        BASE_URL,
        buildPostBody(aspFields, {
            [searchInputName]: query,
            [submitBtnName]:   'Search',
            __EVENTTARGET:     '',
            __EVENTARGUMENT:   '',
        }),
        {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                Referer: BASE_URL,
            },
        }
    );

    $ = cheerio.load(searchRes.data);
    aspFields = extractAspNetFields($);

    const grants = [];
    collectGrantsFromPage($, grants, rows);
    console.log(`[TEA] Page 1: collected ${grants.length} grants so far.`);

    // ── Step 3: Paginate through remaining pages ──────────────────────────────
    let currentPage = 1;
    while (grants.length < rows) {
        const nextPostback = findNextPagePostback($, currentPage);
        if (!nextPostback) {
            console.log('[TEA] No more pages found.');
            break;
        }

        const pageRes = await session.post(
            BASE_URL,
            buildPostBody(aspFields, {
                ...nextPostback,
                [searchInputName]: query, // keep the search term in view state
            }),
            {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    Referer: BASE_URL,
                },
            }
        );

        $ = cheerio.load(pageRes.data);
        aspFields = extractAspNetFields($);

        const before = grants.length;
        const found  = collectGrantsFromPage($, grants, rows);
        console.log(`[TEA] Page ${currentPage + 1}: collected ${grants.length - before} new grants.`);

        if (!found) break; // empty page → stop
        currentPage++;
    }

    console.log(`[TEA] Total grants collected: ${grants.length}`);
    return grants.slice(0, rows);
};

export default teaScraper;


// ---------------------------------------------------------------------------
// Target audience keywords — broad and varied
// ---------------------------------------------------------------------------
const TARGETED_KEYWORDS = [
    // Parents of young teens or adults
    'family engagement',
    'teen programs',
    // Current college students
    'higher education',
    'college access',
    // Businesses looking to train employees
    'workforce',
    'career training',
    // Women seeking leadership skills
    'women',
    'girls education',
    // Online learning
    'technology education',
    'digital literacy',
    // Schools / universities — leadership development
    'leadership',
    'mentoring',
    // General online course topics
    'professional development',
    'adult education',
];

// ---------------------------------------------------------------------------
// Helper: check if a grant is still open/recent (due date is in the future)
// ---------------------------------------------------------------------------
function isOpenAndRecent(grant) {
    if (!grant.dueDate) return true; // no date = include it
    const due = new Date(grant.dueDate);
    if (isNaN(due)) return true;     // unparseable date = include it
    return due >= new Date();        // only future due dates
}

// ---------------------------------------------------------------------------
// Run directly: node GS.js
// ---------------------------------------------------------------------------
(async () => {
    const allGrants = [];
    const seenIds = new Set();

    for (const keyword of TARGETED_KEYWORDS) {
        console.log(`\n🔍 Searching: "${keyword}"`);
        const results = await teaScraper(keyword, 50); // 50 per keyword for variety
        let addedForKeyword = 0;

        for (const grant of results) {
            // Deduplicate + only open/recent grants
            if (!seenIds.has(grant.grantId) && isOpenAndRecent(grant)) {
                seenIds.add(grant.grantId);
                allGrants.push({ ...grant, matchedKeyword: keyword });
                addedForKeyword++;
            }
        }
        console.log(`   → ${addedForKeyword} open grants added`);
    }

    // Sort by soonest due date first
    allGrants.sort((a, b) => {
        const da = new Date(a.dueDate), db = new Date(b.dueDate);
        if (isNaN(da)) return 1;
        if (isNaN(db)) return -1;
        return da - db;
    });

    console.log(`\n✅ Total unique open grants found: ${allGrants.length}`);
    console.log(JSON.stringify(allGrants, null, 2));
})().catch(err => console.error('Error:', err.message));