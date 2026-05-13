import puppeteer from 'puppeteer';
import * as cheerio from 'cheerio';
import { delay, fetchWithRetry, cleanText, KEYWORDS, ANTI_KEYWORDS, simpleHash } from '../utils.js';

function filterAntiKeywords(grants) {
  return grants.filter(g => {
    const title = (g.title || '').toLowerCase();
    return !ANTI_KEYWORDS.some(kw => title.includes(kw));
  });
}

export async function txSmartBuyScraper(rows = 100) {
    const scrapeAt = async (url, page) => {
        try {
            console.log("\n\nLINK:", url);
            await page.goto(url, {waitUntil: 'networkidle0'});
            await page.waitForSelector("div.esbd-result-body-columns");

            const html = await page.content();
            const $ = cheerio.load(html);

            let columns = $(".esbd-result-column.egrant-column");
            const topLeft = columns.eq(0);
            const topRight = columns.eq(1);
            const bottomLeft = columns.eq(2);
            const bottomRight = columns.eq(3);
            
            const title       = $(".egrant-details-container > .esbd-result-title > h4").text();
            const topLeftChildren = topLeft.children(".esbd-result-cell");
            const agency      = topLeftChildren.eq(0).children("p").text();
            const grantNumber = topLeftChildren.eq(2).children("p").text();
            
            const topRightChildren = topRight.children(".esbd-result-cell");
            let openingDate = topRightChildren.eq(2).children("p").text();
            let closingDate = topRightChildren.eq(4).children("p").text();
            const [openingMonth, openingDay, openingYear] = openingDate.split("/");
            const [closingMonth, closingDay, closingYear] = closingDate.split("/");
            openingDate = new Date(openingYear, openingMonth - 1, openingDay);
            closingDate = new Date(closingYear, closingMonth - 1, closingDay);
            
            const bottomLeftChildren = bottomLeft.children(".esbd-result-cell");
            const category = bottomLeftChildren
                .children("ul")
                .children("li")
                .eq(0).text();

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

    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    
    const searchUrl = "https://www.txsmartbuy.gov/esbd-grants";
    await page.goto(searchUrl);
    await page.waitForSelector(".global-views-pagination-count");
    
    let html = await page.content();
    
    try { 
        const $ = cheerio.load(html);
        
        let pageCount = $("p.global-views-pagination-count"); 
        if (pageCount.length === 0) {
            pageCount = 1;
        } else {
            const tokens = pageCount.first().text().match(/\S+/g);
            pageCount = parseInt(tokens[tokens.length - 2]);
        }
        
        const grants = [];
        let pageNum = 1;
        
        do {
            const $ = cheerio.load(html);
            let grantEntries = $(".esbd-result-row");
            
            if (grantEntries.length === 0) {
                break;
            }
            
            for (let i = 0; i < grantEntries.length; i++) {
                if (grants.length > rows) {
                    break;
                }
                let el = grantEntries.eq(i);
                let grantUrl = `https://www.txsmartbuy.gov${$(el).find("div.esbd-result-title > a").attr("href")}`; 
                let grantInfo = await scrapeAt(grantUrl, page);
                grants.push(grantInfo);
            }

            pageNum++; 
            await page.goto(`https://www.txsmartbuy.gov/esbd-grants?page=${pageNum}`, { waitUntil: 'networkidle0' });
            
            html = await page.content();
        } while (pageNum <= pageCount);
        
        await browser.close();

        return filterAntiKeywords(grants);
    } catch (e) {
        console.warn("Error fetching txsmartbuy.gov grants:", e);
    }
    
    await browser.close();
    
    return [];
}
