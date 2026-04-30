// npm install axios cheerio

import axios from 'axios';
import * as cheerio from 'cheerio';

const scraper = {};

scraper["grants.gov"] = async (query, rows = 500) => {
    /** 
     * Get up to <rows> unique grants from grants.gov that match <query>
     * 
     * @param query keyword to search by
     * @param rows maximum number of resulting grants
     * 
     * @returns list of grant entries [{
     *  id: id of grant
     *  number: opportunity #
     *  title: name of grant
     *  agency: agency that gives the grant
     *  status: closed|open|archived
     *  postedDate: date that grant application opens
     *  closeDate: date that grant application closes
     *  url: link to grant
     * }]
    */
    const endpoint = 'https://apply07.grants.gov/grantsws/rest/opportunities/search';

    // Capture exact body shape from your browser's DevTools that matches request payloads.
    const body = {
        "keyword": "department of education", // e.g. "leadership"
        "keywordEncoded": true,
        "resultType": "application",
        "searchOnly": false,
        "oppNum": "",
        "cfda": null,
        "sortBy": "", // "" for default sort
        "dateRange": "", // "" for all dates
        "oppStatuses": "forecasted|posted",
        "startRecordNum": 0,
        "eligibilities": null,
        "fundingInstruments": "G", // "G" for grants
        "fundingCategories": null,
        "agencies": null,
        "rows": rows,
    };

    const { data } = await axios.post(endpoint, body, {
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        },
    });

    const list = data.oppHits || [];
    console.log("Total matching grants:", data.hitCount);
    console.log("Number of grants in this page:", data.oppHits.length);

    // Map each grant to include the detail page URL
    // list.forEach(opp => console.log(opp));
    // list.forEach(opp => console.log(opp));
    return list.map(opp => ({
        id: opp.id,
        number: opp.number,
        title: opp.title,
        agency: opp.agency,
        status: opp.oppStatus,
        postedDate: opp.openDate,
        closeDate: opp.closeDate,
        url: 'https://grants.gov/search-results-detail/' + opp.id,
    }));
}

scraper["mott.org"] = async (query, rows = 100) => {
    /** 
     * Get up to <rows> unique grants from mott.org that match <query>
     * 
     * @param query keyword to search by
     * @param rows maximum number of resulting grants
     * 
     * @returns list of grant entries [{
     *  number: opportunity #
     *  title: name of grant
     *  agency: agency that gives the grant
     *  status: closed|open|archived
     *  postedDate: date that grant application opens
     *  closeDate: date that grant application closes
     *  amount: funding amount of grant per recipient
     *  url: link to grant
     * }]
    */

    try {
        const searchUrl = `https://www.mott.org/grants/?location=Texas&query=${encodeURIComponent(query)}`;
        const results = await axios.get(searchUrl);

        // Get page count
        const $ = cheerio.load(results.data);
        const pageCount = parseInt($('div.paging1 > ul > li:nth-last-of-type(2) > a').text());

        // While current count < rows and page <= pageCount, fetch more pages
        const grants = [];
        let page = 1;
        while (grants.length < rows && page <= pageCount) {
            const data = await axios.get(`${searchUrl}&pg=${page}`);
            const $ = cheerio.load(data.data);

            $('.card6').each((_, el) => {
                if (grants.length >= rows) return false;
                const title = $(el).find('a > span').text().trim();
                let url = $(el).find('a').attr('href');
                url = url.substring(0, url.length - 1); // remove trailing slash
                // Get opportunity number from URL

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
                })

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
        return grants;
    } catch (e) {
        console.warn("Error fetching mott.org grants:", e);
    }
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

export default scraper;