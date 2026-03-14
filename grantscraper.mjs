/**
 * ============================================================
 *  GRANT SCRAPER — grants.gov search2 API
 * ============================================================
 *  Features:
 *   • Paginates through ALL result pages per keyword
 *   • Flags grants closing within 10 days (⚠ EXPIRING SOON)
 *   • Iterates through a configurable keyword list
 *   • Groups results by keyword
 *   • Sorts each group by award_max descending
 *   • Outputs JSON + CSV
 *
 *  Usage:
 *   node grantscraper.mjs
 *
 *  Dependencies:
 *   npm install axios
 *
 *  The grants.gov search2 API requires NO authentication.
 * ============================================================
 */

import axios from "axios";
import fs from "fs";

// ─── CONFIGURATION ──────────────────────────────────────────
const KEYWORDS = [
  "leadership training",
  "STEM education",
  "workforce development",
  "community health",
  "small business",
];

const API_URL = "https://api.grants.gov/v1/api/search2";
const PAGE_SIZE = 100;                // max rows per request (API caps at ~1000)
const EXPIRY_WINDOW_DAYS = 10;        // flag grants closing within this many days
const DELAY_MS = 500;                 // polite delay between requests
const OPP_STATUSES = "forecasted|posted";   // only open opportunities

// ─── HELPERS ────────────────────────────────────────────────

/** Pause execution for ms milliseconds */
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Parse grants.gov date strings like "10/11/2023" or "" into Date | null */
function parseGrantDate(dateStr) {
  if (!dateStr || dateStr.trim() === "") return null;
  // grants.gov uses MM/DD/YYYY
  const parts = dateStr.trim().split("/");
  if (parts.length !== 3) return null;
  const [month, day, year] = parts.map(Number);
  return new Date(year, month - 1, day);
}

/** Return the number of calendar days between now and a date (negative = past) */
function daysUntil(date) {
  if (!date) return null;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const diff = date.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

/** Parse dollar strings like "$50,000" or "N/A" → number | null */
function parseDollar(val) {
  if (!val || val === "N/A" || val === "") return null;
  const cleaned = String(val).replace(/[$,\s]/g, "");
  const num = Number(cleaned);
  return isNaN(num) ? null : num;
}

// ─── CORE: FETCH ONE PAGE ───────────────────────────────────

async function fetchPage(keyword, startRecord = 0) {
  const body = {
    keyword,
    oppStatuses: OPP_STATUSES,
    rows: PAGE_SIZE,
    startRecordNum: startRecord,
  };

  const resp = await axios.post(API_URL, body, {
    headers: { "Content-Type": "application/json" },
    timeout: 30000,
  });

  if (resp.data?.errorcode !== 0) {
    throw new Error(`API error: ${resp.data?.msg || "unknown"}`);
  }

  return resp.data.data;
}

// ─── CORE: FETCH ALL PAGES FOR ONE KEYWORD ──────────────────

async function fetchAllForKeyword(keyword) {
  console.log(`\n🔍  Searching: "${keyword}"`);

  const firstPage = await fetchPage(keyword, 0);
  const totalHits = firstPage.hitCount || 0;
  console.log(`   Found ${totalHits} total results`);

  let allHits = [...(firstPage.oppHits || [])];

  // Paginate through remaining pages
  let fetched = allHits.length;
  while (fetched < totalHits) {
    await sleep(DELAY_MS);
    const page = await fetchPage(keyword, fetched);
    const hits = page.oppHits || [];
    if (hits.length === 0) break;        // safety valve
    allHits.push(...hits);
    fetched += hits.length;
    console.log(`   Fetched ${fetched} / ${totalHits}`);
  }

  console.log(`   ✅ Collected ${allHits.length} grants for "${keyword}"`);
  return allHits;
}

// ─── CORE: NORMALIZE & ENRICH ONE RAW HIT ──────────────────

function normalizeHit(raw, keyword) {
  const closeDate = parseGrantDate(raw.closeDate);
  const remaining = daysUntil(closeDate);
  const expiringSoon = remaining !== null && remaining >= 0 && remaining <= EXPIRY_WINDOW_DAYS;

  // The search2 API doesn't return award amounts directly,
  // but some fields may be available in extended responses.
  // We capture what's available and mark the rest as null.
  const awardMax = parseDollar(raw.awardCeiling) ?? parseDollar(raw.award_ceiling) ?? null;
  const awardMin = parseDollar(raw.awardFloor) ?? parseDollar(raw.award_floor) ?? null;

  return {
    keyword,
    id: raw.id,
    number: raw.number || null,
    title: raw.title || null,
    agency_code: raw.agencyCode || null,
    agency_name: raw.agencyName || null,
    open_date: raw.openDate || null,
    close_date: raw.closeDate || null,
    days_until_close: remaining,
    expiring_soon: expiringSoon,
    status: raw.oppStatus || null,
    doc_type: raw.docType || null,
    aln: Array.isArray(raw.alnist) ? raw.alnist.join(", ") : raw.alnist || null,
    award_min: awardMin,
    award_max: awardMax,
    // For detailed award data, you can optionally call fetchOpportunity per ID
    opportunity_url: `https://grants.gov/search-results-detail/${raw.id}`,
    scraped_at: new Date().toISOString(),
  };
}

// ─── OPTIONAL: FETCH DETAILED AWARD DATA ────────────────────
// The search2 endpoint doesn't always include award amounts.
// Uncomment this section and call it per opportunity if you need
// award_min / award_max populated from the detail endpoint.

/*
async function fetchOpportunityDetail(oppId) {
  const resp = await axios.get(
    `https://api.grants.gov/v1/api/fetchOpportunity?oppId=${oppId}`,
    { timeout: 15000 }
  );
  return resp.data?.data || {};
}
*/

// ─── MAIN ───────────────────────────────────────────────────

async function main() {
  const timeStart = Date.now();
  const resultsByKeyword = {};
  const allGrants = [];

  for (const keyword of KEYWORDS) {
    try {
      const rawHits = await fetchAllForKeyword(keyword);
      const normalized = rawHits.map((h) => normalizeHit(h, keyword));

      // Sort by award_max descending (nulls go to the bottom)
      normalized.sort((a, b) => {
        if (a.award_max === null && b.award_max === null) return 0;
        if (a.award_max === null) return 1;
        if (b.award_max === null) return -1;
        return b.award_max - a.award_max;
      });

      resultsByKeyword[keyword] = normalized;
      allGrants.push(...normalized);
    } catch (err) {
      console.error(`   ❌ Error scraping "${keyword}": ${err.message}`);
      resultsByKeyword[keyword] = [];
    }

    await sleep(DELAY_MS);
  }

  // ─── SUMMARY ────────────────────────────────────────────

  console.log("\n" + "═".repeat(60));
  console.log("  SCRAPE COMPLETE");
  console.log("═".repeat(60));

  let totalExpiring = 0;
  for (const [kw, grants] of Object.entries(resultsByKeyword)) {
    const expiring = grants.filter((g) => g.expiring_soon);
    totalExpiring += expiring.length;
    console.log(`\n  📁 "${kw}": ${grants.length} grants (${expiring.length} expiring within ${EXPIRY_WINDOW_DAYS} days)`);

    if (expiring.length > 0) {
      console.log("     ⚠  EXPIRING SOON:");
      expiring.forEach((g) => {
        console.log(`        • [${g.days_until_close}d] ${g.title}`);
        console.log(`          Close: ${g.close_date}  |  ${g.opportunity_url}`);
      });
    }
  }

  console.log(`\n  Total grants: ${allGrants.length}`);
  console.log(`  Total expiring soon (≤${EXPIRY_WINDOW_DAYS} days): ${totalExpiring}`);
  console.log(`  Time elapsed: ${((Date.now() - timeStart) / 1000).toFixed(1)}s`);

  // ─── OUTPUT: JSON ───────────────────────────────────────

  const jsonOutput = {
    scraped_at: new Date().toISOString(),
    config: { keywords: KEYWORDS, expiry_window_days: EXPIRY_WINDOW_DAYS },
    summary: {
      total_grants: allGrants.length,
      total_expiring_soon: totalExpiring,
      by_keyword: Object.fromEntries(
        Object.entries(resultsByKeyword).map(([kw, g]) => [
          kw,
          { count: g.length, expiring: g.filter((x) => x.expiring_soon).length },
        ])
      ),
    },
    results_by_keyword: resultsByKeyword,
  };

  fs.writeFileSync("grants_results.json", JSON.stringify(jsonOutput, null, 2));
  console.log("\n  💾 Saved: grants_results.json");

  // ─── OUTPUT: CSV ────────────────────────────────────────

  const csvHeaders = [
    "keyword", "id", "number", "title", "agency_code", "agency_name",
    "open_date", "close_date", "days_until_close", "expiring_soon",
    "status", "doc_type", "aln", "award_min", "award_max",
    "opportunity_url", "scraped_at",
  ];

  const escCsv = (val) => {
    if (val === null || val === undefined) return "";
    const str = String(val);
    return str.includes(",") || str.includes('"') || str.includes("\n")
      ? `"${str.replace(/"/g, '""')}"`
      : str;
  };

  const csvRows = [csvHeaders.join(",")];
  for (const grant of allGrants) {
    csvRows.push(csvHeaders.map((h) => escCsv(grant[h])).join(","));
  }

  fs.writeFileSync("grants_results.csv", csvRows.join("\n"));
  console.log("  💾 Saved: grants_results.csv\n");
}

// ─── RUN ────────────────────────────────────────────────────
main().catch((err) => {
  console.error("Fatal error:", err.message);
  process.exit(1);
});
