/**
 * Texas Grant Resource Center — Statewide Opportunities Scraper
 * Source: https://tgrc.hogg.utexas.edu/statewide-opportunities/

 */

"use strict";

const axios   = require("axios");
const cheerio = require("cheerio");
const fs      = require("fs");
const path    = require("path");

const SOURCE_URL  = "https://tgrc.hogg.utexas.edu/statewide-opportunities/";
const OUTPUT_FILE = path.join(__dirname, "grants_output.json");

const FOCUS_KEYWORDS = [
  "youth workforce",
  "workforce development",
  "workforce",
  "Workforce",
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
  "Early childhood",
  "Childhood",
  "Education",
  "education",
  "Childcare",
  "Pediatric",
  "pediatric",
  "Foster youth",
  "foster", 
  "Veterans",
  "Military",
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
  "development"

];

const HTTP_CONFIG = {
  headers: {
    "User-Agent": "Mozilla/5.0 (compatible; TGRCScraper/1.0; research use)",
    Accept: "text/html,application/xhtml+xml",
  },
  timeout: 20000,
};

function nowISO() {
  return new Date().toISOString();
}

function parseDate(raw) {
  if (!raw) return null;
  const s = raw.trim();

  const longMatch = s.match(
    /^(january|february|march|april|may|june|july|august|september|october|november|december)\s+(\d{1,2}),?\s+(\d{4})/i
  );
  if (longMatch) {
    const months = {
      january:"01", february:"02", march:"03",    april:"04",
      may:"05",     june:"06",     july:"07",      august:"08",
      september:"09", october:"10", november:"11", december:"12",
    };
    const [, mon, day, year] = longMatch;
    return `${year}-${months[mon.toLowerCase()]}-${day.padStart(2, "0")}T00:00:00.000Z`;
  }

  const mdyMatch = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (mdyMatch) {
    const [, m, d, y] = mdyMatch;
    return `${y}-${m.padStart(2,"0")}-${d.padStart(2,"0")}T00:00:00.000Z`;
  }

  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return `${s.slice(0, 10)}T00:00:00.000Z`;
  return null;
}

function matchesFocus(text) {
  const lower = text.toLowerCase();
  return FOCUS_KEYWORDS.some((kw) => lower.includes(kw));
}

/**
 * Guess a category based on keywords in the grant text.
 * Maps to your focus areas.
 */
function detectCategory(text) {
  const lower = text.toLowerCase();
  const cats  = [];
  if (lower.includes("veteran") || lower.includes("military") || lower.includes("wounded warrior")) cats.push("Veterans");
  if (lower.includes("workforce") || lower.includes("workforce development")) cats.push("Workforce Development");
  if (lower.includes("youth") || lower.includes("youth development")) cats.push("Youth Development");
  if (lower.includes("leadership")) cats.push("Leadership");
  return cats.length > 0 ? cats.join(", ") : "General Nonprofit";
}

function mergeGrants(existing, incoming) {
  const existingMap = new Map(
    existing.map((g) => [g.title.trim().toLowerCase(), g])
  );
  const newGrants = [];

  for (const grant of incoming) {
    const key = grant.title.trim().toLowerCase();
    if (existingMap.has(key)) {
      existingMap.get(key).updatedAt = grant.createdAt;
    } else {
      existingMap.set(key, grant);
      newGrants.push(grant);
    }
  }

  return { all: [...existingMap.values()], newGrants };
}

function parseGrants(html, runTime) {
  const $      = cheerio.load(html);
  const grants = [];

  // Each grant on this site is its own <ul> inside .entry-content
  // We only process <ul> elements between the grants h3 and the next h3
  let inGrantsSection = false;
  let stopProcessing  = false;
  let grantIndex      = 1;

  $(".entry-content").children().each((_, el) => {
    if (stopProcessing) return;

    const tag  = el.tagName.toLowerCase();
    const text = $(el).text().toLowerCase();

    if (tag.match(/^h[1-6]$/) && text.includes("upcoming grant opportunities")) {
      inGrantsSection = true;
      return;
    }

    if (inGrantsSection && tag.match(/^h[1-6]$/) && !text.includes("upcoming grant opportunities")) {
      stopProcessing = true;
      return;
    }

    if (!inGrantsSection || tag !== "ul") return;

    const $li = $(el).children("li").first();
    if (!$li.length) return;

    // Title text
    const titleEl = $li.find("> a > strong, > strong > a, > a, > strong").first();
    const title   = titleEl.text().trim();
    if (!title) return;

    // Application link — the href on the anchor wrapping the title
    const applicationLink = $li.find("> a").first().attr("href") || null;

    // Sub-list: agency, deadline, description
    const subItems = $li.find("> ul > li")
      .map((__, sub) => $(sub).text().trim())
      .get();

    const agency = subItems[0] || null;

    let closingDate = null;
    for (const item of subItems) {
      const m = item.match(/^Deadline:\s*(.+)/i);
      if (m) { closingDate = parseDate(m[1]); break; }
    }

    const combined = `${title} ${subItems.join(" ")}`;
    if (!matchesFocus(combined)) return;

    const category = detectCategory(combined);

    // Generate a stable opportunityNumber since site doesn't provide one:
    // "TGRC-" + zero-padded index per scrape run
    const opportunityNumber = `TGRC-${String(grantIndex).padStart(4, "0")}`;
    grantIndex++;

    grants.push({
      opportunityNumber,
      title,
      agency,
      openingDate:          null,       // not published on this site
      closingDate,
      applicationType:      "Grant",
      category,
      applicationLink,
      awardFloor:           null,       // not published on this site
      awardCeiling:         null,       // not published on this site
      totalFundingAmount:   null,       // not published on this site
      createdAt:            runTime,
      updatedAt:            runTime,
    });
  });

  return grants;
}

async function main() {
  const runTime = nowISO();
  console.log(`\n🔍  TGRC Grant Scraper`);
  console.log(`    Run time : ${runTime}`);
  console.log(`    Source   : ${SOURCE_URL}\n`);

  let html;
  try {
    console.log("  Fetching page...");
    const res = await axios.get(SOURCE_URL, HTTP_CONFIG);
    html = res.data;
    console.log("     Page fetched.");
  } catch (err) {
    console.error(`     HTTP error: ${err.message}`);
    process.exit(1);
  }

  console.log("   Parsing grants...");
  const scraped = parseGrants(html, runTime);
  console.log(`    Found ${scraped.length} matching grant(s).`);

  let existing = [];
  if (fs.existsSync(OUTPUT_FILE)) {
    try {
      existing = JSON.parse(fs.readFileSync(OUTPUT_FILE, "utf-8"));
      console.log(`    Loaded ${existing.length} existing grant(s) from disk.`);
    } catch {
      console.warn("    ⚠  Could not parse existing file — starting fresh.");
    }
  }

  const { all, newGrants } = mergeGrants(existing, scraped);
  console.log(`    ${newGrants.length} new | ${scraped.length - newGrants.length} already existed (updatedAt refreshed).`);

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(all, null, 2), "utf-8");
  console.log(`\n  Saved ${all.length} total grant(s) → ${OUTPUT_FILE}`);

  if (newGrants.length > 0) {
    console.log("\n── New grants ──────────────────────────────────────────────");
    newGrants.forEach((g, i) => {
      console.log(`\n  [${i + 1}] ${g.title}`);
      console.log(`       Agency      : ${g.agency ?? "N/A"}`);
      console.log(`       Category    : ${g.category}`);
      console.log(`       Closes      : ${g.closingDate ?? "N/A"}`);
      console.log(`       Link        : ${g.applicationLink ?? "N/A"}`);
      console.log(`       Opp #       : ${g.opportunityNumber}`);
      console.log(`       Created     : ${g.createdAt}`);
    });
    console.log("\n────────────────────────────────────────────────────────────");
  } else {
    console.log("\n  No new grants this run — all already in the database.");
  }

  console.log("\n  Full output (JSON):\n");
  console.log(JSON.stringify(all, null, 2));
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});