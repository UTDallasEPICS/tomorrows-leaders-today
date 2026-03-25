// npm install axios cheerio

import axios from 'axios';
import * as cheerio from 'cheerio';
import puppeteer from 'puppeteer';

// Stores URL-function pairs, detailing ways to specifically scrape websites.
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

            // What does this function do for each ".card6"-class element?
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

scraper["txsmartbuy.gov"] = async (query = "", rows = 100) => {   
    /**
     * Scrapes for grants from "txsmartbuy.gov" and returns an array of grants in .json form.
     * 
     * SCHEMA FOR GRANTS: see return statement for inner function 'scrapeAt' 
     * 
     * @param {String} query the keyword to query by
     * @param {Number} rows the max number of grants to scrape from this url
     * @returns an array of all grants scraped from this URL, expressed in json.
     */

    const scrapeAt = async (url, page) => {
        /**
         * Goes to a grant's url to scrape specific information form there
         * 
         * @param {String} url to the specific grant
         *      PRECONDITION: the url is absolute and will correctly lead to the 
         *                      grant if directly pasted into a search bar.
         * @param {Page} page the headless browser instance that can scrape through
         *                      the page
         * @returns a json object with the grants information per the schema
         */
    
        try {
            // Headless browser to get the grants at a PAGE NUMBER
            console.log("\n\nLINK:", url);
            await page.goto(url, {waitUntil: 'networkidle0'});
            await page.waitForSelector("div.esbd-result-body-columns");

            const html = await page.content();
            const $ = cheerio.load(html);

            // There are four columns to get information from
            let columns = $(".esbd-result-column.egrant-column");
            const topLeft = columns.eq(0);
            const topRight = columns.eq(1);
            const bottomLeft = columns.eq(2);
            const bottomRight = columns.eq(3);
            
            // Scrape general information
            const title       = $(".egrant-details-container > .esbd-result-title > h4").text();
            const topLeftChildren = topLeft.children(".esbd-result-cell");
            const agency      = topLeftChildren.eq(0).children("p").text();
            const grantNumber = topLeftChildren.eq(2).children("p").text();
            
            // Scrape opening/closing dates and format them
            const topRightChildren = topRight.children(".esbd-result-cell");
            let openingDate = topRightChildren.eq(2).children("p").text(); // In the form mm/dd/yyyy
            let closingDate = topRightChildren.eq(4).children("p").text();
            const [openingMonth, openingDay, openingYear] = openingDate.split("/");
            const [closingMonth, closingDay, closingYear] = closingDate.split("/");
            openingDate = new Date(openingYear, openingMonth - 1, openingDay);
            closingDate = new Date(closingYear, closingMonth - 1, closingDay);
            
            // Scrape categories
            const bottomLeftChildren = bottomLeft.children(".esbd-result-cell");
            const category = bottomLeftChildren
                .children("ul")
                .children("li")
                .eq(0).text(); // There can be multiple categories; stick with the first for now

            // Scrape min/max amount and application link
            const bottomRightChildren   = bottomRight.children(".esbd-result-cell");
            let totalFundingAmount      = bottomRightChildren.eq(0).children("p").text();
            let awardFloor              = bottomRightChildren.eq(2).children("p").text();
            let awardCeiling            = bottomRightChildren.eq(3).children("p").text();
            let applicationLink         = bottomRightChildren.eq(4).children("a").attr("href");
            
            return {
                title,
                agency,
                grantNumber,
                openingDate,
                closingDate,
                category,
                applicationLink,
                totalFundingAmount,
                awardFloor,
                awardCeiling,
            };
        } catch (e) {
            console.warn("Error fetching grant at url:", url, " due to error:", e);
        }
        
        return [];
    }

    //----Headless browser to get HTML (website is dynamic)
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    
    const searchUrl = "https://www.txsmartbuy.gov/esbd-grants";
    await page.goto(searchUrl);
    await page.waitForSelector(".global-views-pagination-count");
    
    let html = await page.content();
    //----END headless browser to get HTML
    
    try {
        
        //----Get page count
        const $ = cheerio.load(html);
        
        let pageCount = $("p.global-views-pagination-count"); 
        if (pageCount.length === 0) { // No page selector means there's only one page
            pageCount = 1;
        } else {
            const tokens = pageCount.first().text().match(/\S+/g); // There are two of these "page selectors", so get the text of one
            pageCount = parseInt(tokens[tokens.length - 2]);
        }
        //----END Get page count
        
        // Fetch the grants
        const grants = [];
        let pageNum = 1;
        
        do {
            //----Fetch page at current page number
            
            // Query page using Cheerio 
            const $ = cheerio.load(html);
            let grantEntries = $(".esbd-result-row"); // Get all grants on the page
            
            if (grantEntries.length === 0) { 
                break; // No entries to scrape
            }
            //----END Fetch page at current page number
            
            // Scrape information from each grant entry's page
            for (let i = 0; i < grantEntries.length; i++) {
                if (grants.length > rows) {
                    return false;
                }
                let el = grantEntries.eq(i);
                let grantUrl = `https://www.txsmartbuy.gov${$(el).find("div.esbd-result-title > a").attr("href")}`; // Url to detailed information about grant
                let grantInfo = await scrapeAt(grantUrl, page);
                grants.push(grantInfo);
            }

            // Navigate to next page of grants
            pageNum++; 
            await page.goto(`https://www.txsmartbuy.gov/esbd-grants?page=${pageNum}`, { waitUntil: 'networkidle0' });
            
            html = await page.content();
        } while (pageNum <= pageCount);
        
        await browser.close();

        return grants;
    } catch (e) {
        console.warn("Error fetching txsmartbuy.gov grants:", e);
    }
    
    await browser.close();
    
    return [];
}

export default scraper;