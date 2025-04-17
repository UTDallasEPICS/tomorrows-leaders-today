// npm install axios cheerio

import axios from 'axios';

/**
 * Fetches grants from grants.gov's JSON API instead of HTML parsing due to technical issues.
 * @param {string} query - The search keyword(s), e.g. "education".
 * @param {number} rows - How many rows to return (max 5000).
 */

export async function grantScraper(query, rows = 5000) {
    const endpoint = 'https://apply07.grants.gov/grantsws/rest/opportunities/search';

    // Capture exact body shape from your browser's DevTools that matches request payloads.
    const body = {

        keyword: query, // e.g. "Mind, Machine and Motor Nexus"
        cfda: null,
        agency: null,
        fundingCategories: null,
        fundingInstruments: null,
        eligibilities: null,
        oppStatuses: "forecased|posted", // includes both forecasted and posted
        sortBy: "openDate|desc", //default sort
        rows, // up to 5000
        dateRange: "" // leave empty for no date filter
    };

    const { data } = await axios.post(endpoint, body, {
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        },
    });

    // Debugging
    console.log("Grant Scraper Response's top-level keys:", Object.keys(data));
    console.log("Sample payload:", JSON.stringify(data, null, 2).slice(0, 500), "...");

    console.log("Total matching grants:", data.hitCount);
    console.log("Number of grants in this page:", data.oppHits.length);

    // List the first 5 titles
    data.oppHits.slice(0,5).forEach((o,i) => {
        console.log(`${i+1}. [${o.number}] ${o.title}`);
      });

    // Depending on base URL, array might live under data.oppoortunities or data._embedded.opportunities or any variant that's similar.
    const list =
    data.oppHits ||
    data._embedded?.oppHits ||
    data._embedded?.searchResultList?.oppHits ||
    [];

  return list.map((opp) => ({
    number:     opp.number,
    title:      opp.title,
    agency:     opp.agency,
    status:     opp.oppStatus,
    postedDate: opp.openDate,
    closeDate:  opp.closeDate,
    url:        opp.link,
    synopsis:   opp.synopsis,
  }));
}