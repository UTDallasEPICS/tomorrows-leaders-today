// TEA Grant Scraper → Database Seeder
// Usage: node scripts/seedTEAGrants.mjs
//
// This script scrapes TEA grants and upserts them into your SQLite
// database via Prisma, mapping scraped fields to your Grant model.
//
// npm install axios cheerio @prisma/client

import axios from 'axios';
import * as cheerio from 'cheerio';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const BASE_URL = 'https://tealprod.tea.state.tx.us/GrantOpportunities/forms/GrantProgramSearch.aspx';

// ---------------------------------------------------------------------------
// Targeted keywords mapped to TLT audience groups
// ---------------------------------------------------------------------------
const TARGETED_KEYWORDS = [
  'family engagement',       // Parents of young teens or adults
  'teen programs',
  'higher education',        // Current college students
  'college access',
  'workforce',               // Businesses looking to train employees
  'career training',
  'women',                   // Women seeking leadership skills
  'girls education',
  'technology education',    // Online learning
  'digital literacy',
  'leadership',              // Schools / universities
  'mentoring',
  'professional development',// General online course topics
  'adult education',
];

// ---------------------------------------------------------------------------
// ASP.NET helpers
// ---------------------------------------------------------------------------
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

function isOpenAndRecent(dueDate) {
  if (!dueDate) return true;
  const due = new Date(dueDate);
  if (isNaN(due)) return true;
  return due >= new Date();
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

// ---------------------------------------------------------------------------
// Parse a single table row into a grant object matching the Prisma schema
//
// Actual TEA Repeater columns:
//   0: View icon — <a> with title="Grant Name" and __doPostBack href
//   1: Grant Name (plain text)
//   2: Availability Date (opening date)
//   3: Due Date (closing date)
//   4: Application Type
//   5: Submission Type
// ---------------------------------------------------------------------------
function parseGrantRow($, row, index) {
  const cells = $(row).find('td');
  if (cells.length < 4) return null;

  // Title from column 1 text, fallback to <a> title attribute in column 0
  const title = $(cells[1]).text().trim()
    || $(cells[0]).find('a').attr('title')?.trim()
    || null;

  if (!title) return null;

  // Use the <a> title in col 0 as the opportunityNumber (unique per grant name)
  // Strip out special chars to make a clean key
  const rawId          = $(cells[0]).find('a').attr('title')?.trim() || title;
  const opportunityNumber = rawId.replace(/[^a-zA-Z0-9 \-]/g, '').trim().substring(0, 100)
    || `TEA-${index}-${Date.now()}`;

  // No application link on this page — TEA uses __doPostBack, not a real URL
  const applicationLink = BASE_URL;

  const agency       = 'Texas Education Agency';
  const category     = $(cells[4])?.text().trim() || null; // Application Type
  const openDateRaw  = $(cells[2])?.text().trim();
  const closeDateRaw = $(cells[3])?.text().trim();

  // Parse dates safely
  const openingDate = openDateRaw  && openDateRaw  !== 'N/A' ? new Date(openDateRaw)  : null;
  const closingDate = closeDateRaw && closeDateRaw !== 'N/A' ? new Date(closeDateRaw) : null;

  return {
    opportunityNumber: opportunityNumber || `TEA-${index}-${Date.now()}`,
    title,
    agency,
    category,
    applicationLink,
    openingDate:  openingDate  && !isNaN(openingDate)  ? openingDate  : null,
    closingDate:  closingDate  && !isNaN(closingDate)  ? closingDate  : null,
    applicationType: 'Grant',
  };
}

// ---------------------------------------------------------------------------
// Scrape one keyword
// ---------------------------------------------------------------------------
async function scrapeKeyword(session, cookieJar, query, maxRows = 50) {
  // Step 1: GET page
  const initialRes = await session.get(BASE_URL);
  let $ = cheerio.load(initialRes.data);
  let aspFields = extractAspNetFields($);

  const searchInputName = $('input[type="text"]').first().attr('name') || 'ctl00$ContentPlaceHolder1$txtKeyword';
  const submitBtnName   = $('input[type="submit"]').first().attr('name') || 'ctl00$ContentPlaceHolder1$btnSearch';

  // Step 2: POST search
  const searchRes = await session.post(BASE_URL,
    buildPostBody(aspFields, { [searchInputName]: query, [submitBtnName]: 'Search', __EVENTTARGET: '', __EVENTARGUMENT: '' }),
    { headers: { 'Content-Type': 'application/x-www-form-urlencoded', Referer: BASE_URL } }
  );

  $ = cheerio.load(searchRes.data);
  aspFields = extractAspNetFields($);

  const grants = [];

  const collectFromPage = () => {
    // TEA uses a Repeater inside table#Searchresults > tbody > tr > td > table
    // Rows have class "tabledata" or "tabledata1"
    const tableSelectors = [
      'table#Searchresults table',   // inner results table
      'table[id*="Grid"]',
      'table.gridView',
      'table',
    ];
    let table = null;
    for (const sel of tableSelectors) {
      const t = $(sel).filter((_, el) => $(el).find('tr').length > 1);
      if (t.length) { table = t.first(); break; }
    }
    if (!table) return false;
    let added = 0;
    // Only grab data rows (class tabledata or tabledata1), skip header rows
    table.find('tr').filter((_, row) => {
      const cls = $(row).find('td').first().attr('class') || '';
      return cls.includes('tabledata');
    }).each((i, row) => {
      if (grants.length >= maxRows) return false;  // important
      const grant = parseGrantRow($, row, grants.length);
      if (grant) {        
        grants.push(grant);
        added++;
      }
    });
    return added > 0;
  };

  collectFromPage();

  // Step 3: Paginate
  let currentPage = 1;
  while (grants.length < maxRows) {
    const next = findNextPagePostback($, currentPage);
    if (!next) break;
    const pageRes = await session.post(BASE_URL,
      buildPostBody(aspFields, { ...next, [searchInputName]: query }),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded', Referer: BASE_URL } }
    );
    $ = cheerio.load(pageRes.data);
    aspFields = extractAspNetFields($);
    if (!collectFromPage()) break;
    currentPage++;
  }

  return grants;
}

// ---------------------------------------------------------------------------
// Main: scrape all keywords → upsert into DB
// ---------------------------------------------------------------------------
async function main() {
  console.log('🚀 Starting TEA grant scrape...\n');

  const cookieJar = {};
  const session = axios.create({
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
    },
    maxRedirects: 5,
  });

  // Cookie persistence
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

  // Blank search returns ALL grants on the TEA site at once
  // (keyword search is too literal and misses most grants)
  console.log('🔍 Fetching all grants with blank search...');
  const allGrants = new Map();
  try {
    const results = await scrapeKeyword(session, cookieJar, '', 9999);
    for (const grant of results) {
      if (!allGrants.has(grant.opportunityNumber)) {
        allGrants.set(grant.opportunityNumber, grant);
      }
    }
    console.log(`   → ${allGrants.size} unique grants found`);
  } catch (err) {
    console.error('❌ Scrape failed:', err.message);
  }

  console.log(`\n📊 Total unique grants to upsert: ${allGrants.size}`);

  // Upsert into database
  let upserted = 0;
  let skipped  = 0;

  for (const grant of allGrants.values()) {
    try {
      await prisma.grant.upsert({
        where:  { opportunityNumber: grant.opportunityNumber },
        update: {
          title:           grant.title,
          agency:          grant.agency,
          category:        grant.category,
          applicationLink: grant.applicationLink,
          openingDate:     grant.openingDate,
          closingDate:     grant.closingDate,
          applicationType: grant.applicationType,
          updatedAt:       new Date(),
        },
        create: {
          opportunityNumber: grant.opportunityNumber,
          title:             grant.title,
          agency:            grant.agency,
          category:          grant.category,
          applicationLink:   grant.applicationLink,
          openingDate:       grant.openingDate,
          closingDate:       grant.closingDate,
          applicationType:   grant.applicationType,
        },
      });
      upserted++;
    } catch (err) {
      console.warn(`   ⚠️  Skipped "${grant.title}":`, err.message);
      skipped++;
    }
  }

  console.log(`\n✅ Done! ${upserted} grants upserted, ${skipped} skipped.`);
  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error('❌ Fatal error:', err);
  await prisma.$disconnect();
  process.exit(1);
});
