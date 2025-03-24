// npm install axios cheerio

import axios from 'axios';
import cheerio from 'cheerio';
import { sourceMapsEnabled } from 'process';

/** Scrapes given URLs for grant data
* @param {string} url - URL of the page to scrape
* @returns {Promise<Array>} - Array for grant objects
*/

export async function grantScraper(url) {
    try {
        const { data: html } = await axios.get(url);
        const $ = cheerio.load(html);
        const grants = [];

        // Iterate over each grant item
        $('.grant-item').each((i, element) => {
            const grantName = $(element).find('.grant-name').text().trim();
            const launchDate = $(element).find('.launch-date').text().trim();
            const deadline = $(element).find('.deadline').text().trim();
            const amount = $(element).find('.amount').text().trim();
            const link = $(element).find('.link').attr('href');
            const description = $(element).find('.description').text().trim();

            // Push grant data to the grants array
            grants.push({
                grantName,
                launchDate,
                deadline,
                amount,
                link,
                description
            });
        });

        return grants;
    }
    catch (error) {
        console.error('Error scraping ${url}:', error);
        throw error;
    }
}