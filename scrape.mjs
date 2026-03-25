/**
 * ============================================================
 *  GRANT SCRAPE RUNNER
 * ============================================================
 *  Scrapes grants, then validates and inserts into DB.
 *
 *  Pipeline before DB insertion:
 *   1. Deduplicate by opportunityNumber
 *   2. Filter out expired grants (closeDate in the past)
 *   3. Validate that each grant URL is reachable
 *   4. Upsert surviving grants into Prisma DB
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

// ─── CONFIGURATION ──────────────────────────────────────────

const KEYWORDS = [
  "leadership training",
  "leadership development",
  "leadership development program",
  "leadership program",
  "leadership training program",
  "leadership development training",
  "online leadership training",
  "youth leadership program",
  // "summer leadership program",
  // "leadership training courses",
  // "leadership skills training",
  // "women leadership training",
  // "leadership professional development",
  // "nonprofit leadership training",
  // "leadership development courses",
  // "youth leadership development program",
  // "youth leadership training",
  // "leadership training certificate",
  // "virtual leadership training",
  // "leadership training and development",
  // "leadership training activities teens",
  // "leadership courses for teens",
  // "leadership training and consulting",
  // "academic leadership development",
  // "youth leadership development",
];

const LINK_VALIDATION_TIMEOUT = 10_000; // ms
const LINK_VALIDATION_DELAY = 300;      // ms between requests (rate-limit)
const LINK_VALIDATION_CONCURRENCY = 5;  // parallel checks at once

// ─── HELPERS ────────────────────────────────────────────────

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Deduplicate grants by opportunityNumber (or title as fallback).
 * Keeps the first occurrence encountered.
 */
function deduplicateGrants(grants) {
  const seen = new Map();
  for (const g of grants) {
    const key = g.number || g.title || JSON.stringify(g);
    if (!seen.has(key)) {
      seen.set(key, g);
    }
  }
  return [...seen.values()];
}

/**
 * Returns true if the grant's closing date is today or in the future.
 * Grants with no close date are kept (assumed open-ended).
 */
function isNotExpired(grant) {
  const raw = grant.closeDate || grant.close_date;
  if (!raw || String(raw).trim() === "") return true; // no date → keep

  const parsed = new Date(raw);
  if (isNaN(parsed.getTime())) return true; // unparseable → keep

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  parsed.setHours(0, 0, 0, 0);

  return parsed >= today;
}

/**
 * Check whether a URL is reachable.
 *  • Tries HEAD first (lightweight).
 *  • Falls back to GET if the server rejects HEAD.
 *  • Returns true for any 2xx / 3xx status.
 */
async function isLinkValid(url) {
  if (!url) return false;

  try {
    const resp = await axios.head(url, {
      timeout: LINK_VALIDATION_TIMEOUT,
      maxRedirects: 5,
      validateStatus: () => true, // don't throw on non-2xx
    });
    if (resp.status >= 200 && resp.status < 400) return true;
  } catch {
    // HEAD failed entirely — try GET
  }

  try {
    const resp = await axios.get(url, {
      timeout: LINK_VALIDATION_TIMEOUT,
      maxRedirects: 5,
      headers: { Range: "bytes=0-0" },
      validateStatus: () => true,
    });
    return resp.status >= 200 && resp.status < 400;
  } catch {
    return false;
  }
}

/**
 * Validate links for an array of grants, processing in batches
 * to stay polite and avoid hammering servers.
 */
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
      if (ok) {
        valid.push(grant);
      } else {
        invalid.push(grant);
        console.warn(`   ⛔ Invalid link, skipping: "${grant.title}" → ${url}`);
      }
    }

    // Brief pause between batches
    if (i + LINK_VALIDATION_CONCURRENCY < grants.length) {
      await sleep(LINK_VALIDATION_DELAY);
    }
  }

  return { valid, invalid };
}

// ─── DATABASE UPSERT ────────────────────────────────────────

/**
 * Upsert a single grant into Prisma. Uses a sequential for-of loop
 * so each upsert is properly awaited (unlike forEach + async).
 */
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
    };

    // Skip grants without a usable unique key
    if (!entry.opportunityNumber) {
      console.warn(`   ⚠ Skipping grant with no opportunityNumber: "${g.title}"`);
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
        },
        create: entry,
      });
      succeeded++;
    } catch (err) {
      console.error(`   ❌ Upsert failed for ${entry.opportunityNumber}: ${err.message}`);
      failed++;
    }
  }

  return { succeeded, failed };
}

// ─── MAIN ───────────────────────────────────────────────────

async function run() {
  const timeStart = Date.now();

  // ── Step 0: Scrape from all sources ──────────────────────
  const keyword = "";
  console.log(`\n🔍 Running scrape with keyword: "${keyword}"`);

  const rawGrants = [];

  for (const src in grantScraper) {
    console.log(`   Scraping from ${src}...`);
    try {
      const res = await grantScraper[src](keyword);
      console.log(`   Found ${res.length} opportunities from ${src}.`);
      rawGrants.push(...res);
    } catch (err) {
      console.error(`   ❌ Error scraping ${src}: ${err.message}`);
    }
  }

  console.log(`\n📦 Raw grants collected: ${rawGrants.length}`);

  // ── Step 1: Deduplicate ──────────────────────────────────
  const unique = deduplicateGrants(rawGrants);
  console.log(`🧹 After deduplication: ${unique.length}  (removed ${rawGrants.length - unique.length} duplicates)`);

  // ── Step 2: Remove expired grants ────────────────────────
  const active = unique.filter(isNotExpired);
  console.log(`📅 After expiry filter:  ${active.length}  (removed ${unique.length - active.length} expired)`);

  // ── Step 3: Validate links ───────────────────────────────
  console.log(`\n🔗 Validating ${active.length} grant links (this may take a moment)...`);
  const { valid: validated, invalid } = await validateLinks(active);
  console.log(`✅ Valid links:   ${validated.length}`);
  console.log(`⛔ Invalid links: ${invalid.length}`);

  // ── Step 4: Upsert into database ─────────────────────────
  console.log(`\n💾 Upserting ${validated.length} grants into database...`);
  const { succeeded, failed } = await upsertGrants(validated);

  // ── Summary ──────────────────────────────────────────────
  const elapsed = ((Date.now() - timeStart) / 1000).toFixed(1);

  console.log("\n" + "═".repeat(60));
  console.log("  SCRAPE PIPELINE COMPLETE");
  console.log("═".repeat(60));
  console.log(`  Raw scraped:        ${rawGrants.length}`);
  console.log(`  After dedup:        ${unique.length}`);
  console.log(`  After expiry check: ${active.length}`);
  console.log(`  After link check:   ${validated.length}`);
  console.log(`  DB upserted:        ${succeeded}`);
  console.log(`  DB upsert failed:   ${failed}`);
  console.log(`  Time elapsed:       ${elapsed}s`);
  console.log("═".repeat(60) + "\n");

  await prisma.$disconnect();
}

run().catch(async (err) => {
  console.error("Fatal error:", err.message);
  await prisma.$disconnect();
  process.exit(1);
});
