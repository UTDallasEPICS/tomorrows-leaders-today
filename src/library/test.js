import grantScraper from './grantScraper.js';
import axios from 'axios';
import puppeteer from 'puppeteer';
import * as cheerio from 'cheerio';

async function test() {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    
    const searchUrl = "https://www.txsmartbuy.gov/esbd-grants";
    await page.goto(searchUrl);
    await page.waitForSelector(".global-views-pagination-count");
    
    const html1 = await page.content();
    // console.log("FIRST:");
    // console.log(html);
    // console.log();

    // Click on next button
    await Promise.all([
        page.waitForNavigation({waitUntil: 'networkidle0'}),
        page.click("#Next"),
    ]);
    const html2 = await page.content();
    
    console.log(html2)
    
    // Close browser
    await browser.close();
}

async function test2() {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    
    const url = "https://www.txsmartbuy.gov/esbd-grants/320-32026-00081";
    await page.goto(url);
    await page.waitForSelector("div.esbd-result-body-columns");
    
    const html = await page.content();
    await browser.close();
    const $ = cheerio.load(html);

    // There are four columns to get information from
    let columns = $(".esbd-result-column.egrant-column");
    let topLeft = columns.eq(0);
    let topRight = columns.eq(1);
    let bottomLeft = columns.eq(2);
    let bottomRight = columns.eq(3);

    let topLeftChildren = topLeft.children(".esbd-result-cell");
    console.log("tlc:", topLeftChildren.eq(0).text())
}

async function testScrape() {
    let grants = await grantScraper["txsmartbuy.gov"]();

    console.log(grants);
}

test2();