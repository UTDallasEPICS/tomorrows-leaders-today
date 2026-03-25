import grantScraper from './grantScraper.js';
import axios from 'axios';
import puppeteer from 'puppeteer';
import * as cheerio from 'cheerio';

async function test() {
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
                .eq(0); // There can be multiple categories; stick with the first for now

            // Scrape min/max amount and application link
            const bottomRightChildren   = bottomRight.children(".esbd-result-cell");
            let totalFundingAmount      = bottomRightChildren.eq(0).children("p").text();
            let awardFloor              = bottomRightChildren.eq(2).children("p").text();
            let awardCeiling            = bottomRightChildren.eq(3).children("p").text();
            let applicationLink         = bottomRightChildren.eq(4).children("p").text();
            
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
    const $ = cheerio.load(html);
    let grantEntries = $(".esbd-result-row");

    for (let i = 0; i < grantEntries.length; i++) {
        let el = grantEntries.eq(i);
        let grantUrl = `https://www.txsmartbuy.gov${$(el).find("div.esbd-result-title > a").attr("href")}`; // Url to detailed information about grant
        let grantInfo = await scrapeAt(grantUrl, page);
        console.log(grantInfo);
    }
    
    browser.close();
}

async function test1() {
    /**
     * Scrapes for grants from "txsmartbuy.gov" and returns an array of grants in .json form.
     * 
     * SCHEMA FOR GRANTS: see return statement for inner function 'scrapeAt' 
     * 
     * @param {String} query the keyword to query by
     * @param {Number} rows the max number of grants to scrape from this url
     * @returns an array of all grants scraped from this URL, expressed in json.
     */

    //----Headless browser to get HTML (website is dynamic)
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    
    const searchUrl = "https://www.txsmartbuy.gov/esbd-grants";
    await page.goto(searchUrl);
    await page.waitForSelector(".global-views-pagination-count");
    
    let html = await page.content();
    //----END headless browser to get HTML
    
    let pageNum = 1;
    try { 
        console.log("BEFORE:",html,"\n\n")
        await page.goto(`https://www.txsmartbuy.gov/esbd-grants?page=${pageNum}`, { waitUntil: 'networkidle0' });
        
        // Navigate to the next page
        await page.goto(`https://www.txsmartbuy.gov/esbd-grants?page=${pageNum + 1}`);
        await page.waitForSelector(".esbd-title");
        html = await page.content();
        console.log("AFTER:",html,"\n\n")
    } catch (e) {
        console.log("ERROR NAV:", e);
    }
    
    await browser.close();
    
    return [];
}

async function testScrape() {
    let grants = await grantScraper["txsmartbuy.gov"]();
    console.log(grants);
}

testScrape();
// test1();
// test();