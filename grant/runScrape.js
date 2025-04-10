// npm run scrape in terminal to launch scraping script.
import { grantScraper } from './src/library/grantScraper.js';

async function run() {

    try {
        const url = 'https://example.com/grants';
        const grants = await grantScraper(url);
        console.log('Scraped Data: ', grants);
    }

    catch (error) {

        console.error('Error scraping data: ', error);
    }
}

run();