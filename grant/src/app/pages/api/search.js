import axois from 'axios';
import cheerio from 'cheerio';
import { grantScraper } from '../../library/grantScraper';

/*
* @returns {Promise<string[]>} A list of URLs from the search results.
*/

async function searchGrants() {
    const query = 'grant';
    const searchURL = 'https://www.google.com/search?q=${encodeURIComponent(query)}';

    try {
        const { data: html } = await axois.get(searchURL);
        const $ = cheerio.load(html);
        const urls = [];

        $('a.result_a').each((index, element) => {
            const link = $(element).attr('href');
            if (link) {
                urls.push(link);
            }
    });

    return urls;
    }

    catch (error) {
        console.error('Error:', error);
        return [];
    }
}

async function main() {
    // Search for websites containing keywords like 'grant'
    const urls = await searchGrants();

    // For each URL, call the scrape function
    for (const url of urls) {
        try {
            const grants = await grantScraper(url);
            console.log('Scraped data from ${url};', grants);
        }

        catch (error) {
            console.error('Error scraping ${url}:', error);
        }
    }
}

main();