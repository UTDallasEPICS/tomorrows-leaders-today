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

export default scraper;