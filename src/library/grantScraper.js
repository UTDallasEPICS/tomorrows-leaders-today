// npm install axios cheerio

import axios from 'axios';
import prismaClient from './db.js';
/**
 * Fetches grants from grants.gov's JSON API instead of HTML parsing due to technical issues.
 * @param {string} query - The search keyword(s), e.g. "education".
 * @param {number} rows - How many rows to return (max 5000).
 * @returns {Promise<Array>} - Array of grant objects with summary info and detail URL.
 */

export async function grantScraper(query, rows = 20) {
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

    const list = data.oppHits || [];
    for (const opp of list) {
    try {
      await prismaClient.grant.upsert({
        where: { externalId: opp.id.toString() },
        update: {
          title: opp.title,
          description: opp.synopsis,
          status: opp.oppStatus,
          website: `https://grants.gov/search-results-detail/${opp.id}`,
          updatedAt: new Date(),
        },
        create: {
          externalId: opp.id.toString(),
          title: opp.title,
          description: opp.synopsis,
          status: opp.oppStatus,
          website: `https://grants.gov/search-results-detail/${opp.id}`,
          createdAt: new Date(),
        },
      });
    } catch (err) {
      console.error("Error: could not add or update grant:", opp.id, err.message);
    }
  }

    console.log("Total matching grants:", data.hitCount);
    console.log("Number of grants in this page:", data.oppHits.length);

    // Map each grant to include the detail page URL
    return list.map(opp => ({
        id: opp.id,
        number: opp.number,
        title: opp.title,
        agency: opp.agency,
        status: opp.oppStatus,
        postedDate: opp.openDate,
        closeDate: opp.closeDate,
        synopsis: opp.synopsis,
        url: 'https://grants.gov/search-results-detail/' + opp.id,
    }));
}
