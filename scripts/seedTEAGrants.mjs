// TEA Grant Scraper
// Usage: node scripts/seedTEAGrants.mjs
//
// Scrapes all grants from the TEA grants portal and returns them
// as a JSON array. No database logic — just scrape and return.
//
// npm install axios cheerio

import axios from 'axios';
import * as cheerio from 'cheerio';

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

// Run and print JSON
scrapeAllGrants()
  .then(grants => {
    console.log(`✅ Found ${grants.length} grants`);
    console.log(JSON.stringify(grants, null, 2));
  })
  .catch(err => console.error('❌ Error:', err.message));

export default scrapeAllGrants;
