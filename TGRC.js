/**
 * Texas Grant Resource Center — Statewide Opportunities Scraper
 * Source: https://tgrc.hogg.utexas.edu/statewide-opportunities/
 *
 */

import axios from "axios";
import * as cheerio from "cheerio";

const SOURCE_URL = "https://tgrc.hogg.utexas.edu/statewide-opportunities/";

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
  "development",
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
      january: "01", february: "02", march: "03",    april: "04",
      may: "05",     june: "06",     july: "07",      august: "08",
      september: "09", october: "10", november: "11", december: "12",
    };
    const [, mon, day, year] = longMatch;
    return new Date(`${year}-${months[mon.toLowerCase()]}-${day.padStart(2, "0")}T00:00:00.000Z`);
  }

  const mdyMatch = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (mdyMatch) {
    const [, m, d, y] = mdyMatch;
    return new Date(`${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}T00:00:00.000Z`);
  }

  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return new Date(`${s.slice(0, 10)}T00:00:00.000Z`);
  return null;
}

function matchesFocus(text) {
  const lower = text.toLowerCase();
  return FOCUS_KEYWORDS.some((kw) => lower.includes(kw.toLowerCase()));
}

function detectCategory(text) {
  const lower = text.toLowerCase();
  const cats  = [];
  if (lower.includes("veteran") || lower.includes("military") || lower.includes("wounded warrior")) cats.push("Veterans");
  if (lower.includes("workforce") || lower.includes("workforce development")) cats.push("Workforce Development");
  if (lower.includes("youth") || lower.includes("youth development")) cats.push("Youth Development");
  if (lower.includes("leadership")) cats.push("Leadership");
  return cats.length > 0 ? cats.join(", ") : "General Nonprofit";
}

function parseGrants(html) {
  const $      = cheerio.load(html);
  const grants = [];

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

    const titleEl = $li.find("> a > strong, > strong > a, > a, > strong").first();
    const title   = titleEl.text().trim();
    if (!title) return;

    const applicationLink = $li.find("> a").first().attr("href") || null;

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

    const category          = detectCategory(combined);
    const opportunityNumber = `TGRC-${String(grantIndex).padStart(4, "0")}`;
    grantIndex++;

    grants.push({
      opportunityNumber,
      title,
      agency,
      openingDate:        null,
      closingDate,
      applicationType:    "Grant",
      category,
      applicationLink,
      awardFloor:         null,
      awardCeiling:       null,
      totalFundingAmount: null,
    });
  });

  return grants;
}

// Sends each grant to the Next.js API instead of writing to DB directly
// Change API_URL to your deployed app URL when running on Google Cloud
const API_URL = process.env.API_URL || "http://localhost:3001/api/grants";

async function saveViaAPI(grants) {
  let created = 0;
  let failed  = 0;

  for (const grant of grants) {
    try {
      await axios.post(API_URL, grant, {
        headers: { "Content-Type": "application/json" },
      });
      created++;
    } catch (err) {
      console.error(`   Failed to save "${grant.title}": ${err.message}`);
      failed++;
    }
  }

  return { created, failed };
}

async function main() {
  const runTime = nowISO();
  console.log(`\n  TGRC Grant Scraper`);
  console.log(`    Run time : ${runTime}`);
  console.log(`    Source   : ${SOURCE_URL}\n`);

  let html;
  try {
    console.log("  Fetching page...");
    const res = await axios.get(SOURCE_URL, HTTP_CONFIG);
    html = res.data;
    console.log("   Page fetched.");
  } catch (err) {
    console.error(`   HTTP error: ${err.message}`);
    process.exit(1);
  }

  console.log("  Parsing grants...");
  const scraped = parseGrants(html);
  console.log(`   Found ${scraped.length} matching grant(s).`);

  if (scraped.length === 0) {
    console.log("\n  No grants matched — nothing saved.");
    return;
  }

  console.log(`  Sending to API: ${API_URL}`);
  const { created, failed } = await saveViaAPI(scraped);
  console.log(`   Done — ${created} grant(s) saved, ${failed} failed.`);

  console.log("\n── Grants saved ─────────────────────────────────────────────");
  scraped.forEach((g, i) => {
    console.log(`\n  [${i + 1}] ${g.title}`);
    console.log(`       Agency   : ${g.agency ?? "N/A"}`);
    console.log(`       Category : ${g.category}`);
    console.log(`       Closes   : ${g.closingDate ? g.closingDate.toISOString() : "N/A"}`);
    console.log(`       Link     : ${g.applicationLink ?? "N/A"}`);
    console.log(`       Opp #    : ${g.opportunityNumber}`);
  });
  console.log("\n─────────────────────────────────────────────────────────────\n");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});