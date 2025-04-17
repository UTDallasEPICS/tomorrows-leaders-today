// npm run scrape in terminal to launch scraping script.
import axios from 'axios';
import { load } from 'cheerio';
import { grantScraper } from './src/library/grantScraper.js';

async function searchGrantSites(query = 'grant', maxResults = 5) { // 5 results daily ideally

    // Do a Google HTML search for keywords such as 'grant' and return up to 'maxResults' result URLs.
    const searchUrl = `https://www.google.com/search?hl=en&q=${encodeURIComponent(query)}`;

    const { data: html } = await axios.get(searchUrl, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3',
            Accept: 'text/html',   
        }
    });

    const $ = load(html);
    const urls = [];

    // Google wraps each result link in <div class="yuRUbf"><a href="...">
    $('div.yuRUbf > a').each((i, el) => {
        if (i >= maxResults) return false; // limit to maxResults and stop once there are enough results
        const href = $(el).attr('href');

        if (href) linkSync.push(href);
    });

    return [...new Set(urls)]; // Remove duplicates
}

async function run() {
    try {
        console.log('Searching Google for grant sites...');
        const sites = await searchGrantSites('grant', 5); // 5 results daily ideally 
        console.log(
            `Found ${sites.length} websites fitting this keyword:\n` +
            sites.join('\n')
          );

        for (const url of sites) {
            try {
                console.log('\n Scraping ${url}.');
                const grants = await grantScraper(url);
                console.log('Scraped ${grants.length} grants from ${url}.');
            }

            catch (err) {
                console.warn('Failed to scrape ${url}:', err.message);
            }
        }
    }

    catch (err) {
        console.error('Error:', err.message);
    }
}

run();