// npm install axios cheerio

import axios from 'axios';

/**
 * Fetches grants from grants.gov's JSON API instead of HTML parsing due to technical issues.
 * @param {string} query - The search keyword(s), e.g. "education".
 * @param {number} rows - How many rows to return (max 5000).
 * @returns {Promise<Array>} - Array of grant objects with summary info and detail URL.
 */

export async function grantScraper(query, rows = 500) {
    /** 
     * Get up to <rows> unique grants that match <query>
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
        "oppStatuses": "forecasted|posted|closed|archived",
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