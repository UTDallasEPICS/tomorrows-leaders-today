import axios from 'axios';
import * as cheerio from 'cheerio';
import { delay, fetchWithRetry, cleanText, KEYWORDS, ANTI_KEYWORDS, simpleHash } from '../utils.js';

function filterAntiKeywords(grants) {
  return grants.filter(g => {
    const title = (g.title || '').toLowerCase();
    return !ANTI_KEYWORDS.some(kw => title.includes(kw));
  });
}

export async function tgrcScraper() {
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

  return filterAntiKeywords(grants);
};
