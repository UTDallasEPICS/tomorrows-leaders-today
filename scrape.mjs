/**
 * ============================================================
 *  GRANT SCRAPE RUNNER
 * ============================================================
 *  Scrapes grants, then validates and inserts into DB.
 *
 *  Pipeline before DB insertion:
 *   1. Deduplicate by opportunityNumber
 *   2. Filter out grants with no deadline or an expired deadline
 *   3. Filter out grants with missing or malformed titles
 *   4. Validate that each grant URL is reachable
 *   5. Upsert surviving grants into Prisma DB
 *
 *  Usage:
 *   npm run scrape
 *
 *  Dependencies:
 *   npm install axios @prisma/client
 * ============================================================
 */

import axios from "axios";
import grantScraper from "./src/library/grantScraper.js";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// --- CONFIGURATION ------------------------------------------

const KEYWORDS = [
  "leadership training",
  "leadership development",
  "leadership development program",
  "leadership program",
  "leadership training program",
  "leadership development training",
  "online leadership training",
  "youth leadership program",
];

const LINK_VALIDATION_TIMEOUT = 10_000;
const LINK_VALIDATION_DELAY = 300;
const LINK_VALIDATION_CONCURRENCY = 5;

// --- HELPERS ------------------------------------------------

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function deduplicateGrants(grants) {
  const seen = new Map();
  for (const g of grants) {
    const key = g.number || g.title || JSON.stringify(g);
    if (!seen.has(key)) seen.set(key, g);
  }
  return [...seen.values()];
}

function isNotExpired(grant) {
  const raw = grant.closeDate || grant.close_date;
  if (!raw || String(raw).trim() === "") return false;
  const parsed = new Date(raw);
  if (isNaN(parsed.getTime())) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  parsed.setHours(0, 0, 0, 0);
  return parsed >= today;
}

function hasValidTitle(grant) {
  const title = grant.title;
  if (!title || String(title).trim() === "") return false;
  const t = String(title).trim();
  if (t.length < 8) return false;
  const words = t.split(/\s+/).filter((w) => /[a-zA-Z]{2,}/.test(w));
  if (words.length < 2) return false;
  const letterCount = (t.match(/[a-zA-Z]/g) || []).length;
  if (letterCount / t.length < 0.4) return false;
  return true;
}

async function isLinkValid(url) {
  if (!url) return false;
  try {
    const resp = await axios.head(url, { timeout: LINK_VALIDATION_TIMEOUT, maxRedirects: 5, validateStatus: () => true });
    if (resp.status >= 200 && resp.status < 400) return true;
  } catch {}
  try {
    const resp = await axios.get(url, { timeout: LINK_VALIDATION_TIMEOUT, maxRedirects: 5, headers: { Range: "bytes=0-0" }, validateStatus: () => true });
    return resp.status >= 200 && resp.status < 400;
  } catch {
    return false;
  }
}

async function validateLinks(grants) {
  const valid = [];
  const invalid = [];
  for (let i = 0; i < grants.length; i += LINK_VALIDATION_CONCURRENCY) {
    const batch = grants.slice(i, i + LINK_VALIDATION_CONCURRENCY);
    const results = await Promise.all(
      batch.map(async (g) => {
        const url = g.url || g.opportunity_url || g.applicationLink;
        const ok = await isLinkValid(url);
        return { grant: g, ok, url };
      })
    );
    for (const { grant, ok, url } of results) {
      if (ok) { valid.push(grant); }
      else { invalid.push(grant); console.warn(`   Invalid link, skipping: "${grant.title}" -> ${url}`); }
    }
    if (i + LINK_VALIDATION_CONCURRENCY < grants.length) await sleep(LINK_VALIDATION_DELAY);
  }
  return { valid, invalid };
}
// --- AWARD DETAIL FETCH -------------------------------------

const AWARD_CAP = 200;
const DETAIL_DELAY = 300;

async function fetchGrantsWithAwards(grants, cap = AWARD_CAP) {
  const result = [];
  let checked = 0;

  for (const g of grants) {
    if (result.length >= cap) break;
    checked++;

    try {
      const resp = await axios.get(
        `https://api.grants.gov/v1/api/fetchOpportunity?oppId=${g.id}`,
        { timeout: 15000 }
      );
      const detail = resp.data?.data || {};
       // Log first response to see available fields
      if (checked === 1) console.log("Detail response sample:", JSON.stringify(detail, null, 2));
      const floor = detail.awardFloor ?? null;
      const ceiling = detail.awardCeiling ?? null;

      if (floor || ceiling) {
        result.push({ ...g, awardFloor: floor, awardCeiling: ceiling });
        console.log(`   [${result.length}/${cap}] Award data found: ${g.title.substring(0, 60)}`);
      }
    } catch (err) {
      console.warn(`   Detail fetch failed for ${g.id}: ${err.message}`);
    }

    await sleep(DETAIL_DELAY);
  }

  console.log(`   Checked ${checked} grants, found ${result.length} with award data.`);
  return result;
}


// --- DATABASE UPSERT ----------------------------------------

async function upsertGrants(grants) {
  let succeeded = 0;
  let failed = 0;
  for (const g of grants) {
    const entry = {
      opportunityNumber: g.number,
      title: g.title,
      agency: g.agency || g.agency_name || null,
      applicationLink: g.url || g.opportunity_url || null,
      applicationType: "Application",
      openingDate: g.postedDate || g.open_date ? new Date(g.postedDate || g.open_date) : null,
      closingDate: g.closeDate || g.close_date ? new Date(g.closeDate || g.close_date) : null,
      awardFloor: g.awardFloor ?? null,
      awardCeiling: g.awardCeiling ?? null,
    };
    if (!entry.opportunityNumber) {
      console.warn(`   Skipping grant with no opportunityNumber: "${g.title}"`);
      failed++;
      continue;
    }
    try {
      await prisma.grant.upsert({
        where: { opportunityNumber: entry.opportunityNumber },
        update: {
          title: entry.title,
          agency: entry.agency,
          applicationLink: entry.applicationLink,
          applicationType: entry.applicationType,
          openingDate: entry.openingDate,
          closingDate: entry.closingDate,
          awardFloor: entry.awardFloor,
          awardCeiling: entry.awardCeiling,
        },
        create: entry,
      });
      succeeded++;
    } catch (err) {
      console.error(`   Upsert failed for ${entry.opportunityNumber}: ${err.message}`);
      failed++;
    }
  }
  return { succeeded, failed };
}

// --- MAIN ---------------------------------------------------

async function run() {
  const timeStart = Date.now();
  const keyword = "";
  console.log(`Running scrape with keyword: "${keyword}"`);

  const rawGrants = [];
  for (const src in grantScraper) {
    console.log(`   Scraping from ${src}...`);
    try {
      const res = await grantScraper[src](keyword);
      console.log(`   Found ${res.length} opportunities from ${src}.`);
      rawGrants.push(...res);
    } catch (err) {
      console.error(`   Error scraping ${src}: ${err.message}`);
    }
  }

  console.log(`\nRaw grants collected: ${rawGrants.length}`);

  const unique = deduplicateGrants(rawGrants);
  console.log(`After deduplication: ${unique.length}  (removed ${rawGrants.length - unique.length} duplicates)`);

  const active = unique.filter(isNotExpired).filter(hasValidTitle);
  console.log(`After expiry filter:  ${active.length}  (removed ${unique.length - active.length} expired, no-deadline, or invalid title)`);

  console.log(`\nValidating ${active.length} grant links (this may take a moment)...`);
  const { valid: validated, invalid } = await validateLinks(active);
  console.log(`Valid links:   ${validated.length}`);
  console.log(`Invalid links: ${invalid.length}`);

  console.log(`\nUpserting ${validated.length} grants into database...`);
  const { succeeded, failed } = await upsertGrants(validated);

  const elapsed = ((Date.now() - timeStart) / 1000).toFixed(1);
  console.log("\n" + "=".repeat(60));
  console.log("  SCRAPE PIPELINE COMPLETE");
  console.log("=".repeat(60));
  console.log(`  Raw scraped:        ${rawGrants.length}`);
  console.log(`  After dedup:        ${unique.length}`);
  console.log(`  After expiry check: ${active.length}`);
  console.log(`  After link check:   ${validated.length}`);
  console.log(`  DB upserted:        ${succeeded}`);
  console.log(`  DB upsert failed:   ${failed}`);
  console.log(`  Time elapsed:       ${elapsed}s`);
  console.log("=".repeat(60) + "\n");

  await prisma.$disconnect();
}

run().catch(async (err) => {
    console.log(`\nFetching award details (capped at ${AWARD_CAP} grants with award data)...`);
    const withAwards = await fetchGrantsWithAwards(active, AWARD_CAP);
    console.log(`Grants with award data: ${withAwards.length}`);

    console.log(`\nValidating ${withAwards.length} grant links (this may take a moment)...`);
    const { valid: validated, invalid } = await validateLinks(withAwards);
});
