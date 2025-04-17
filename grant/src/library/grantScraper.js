// npm install axios cheerio
// to activate the webscraper type in 'npm run scrape' to the terminal

import { load } from 'cheerio';
import axios from 'axios';
import { sourceMapsEnabled } from 'process';

/** Scrapes given URLs for grant data
* @param {string} url - URL of the page to scrape
* @returns {Promise<Array>} - Array for grant objects
*/

export async function grantScraper(url) {
    const { data: html } = await axios.get(url);
    const $ = load(html);
    const grants = [];

    $('.grant-item').each((i, el) => {
        grants.push({
            grantName: $(el).find('.grant-name').text().trim(),
            launchDate: $(el).find('.launch-date').text().trim(),
            deadline: $(el).find('deadline').text().trim(),
            amount: $(el).find('.amount').text().trim(),
            link: $(el).find('.link').attr('href'),
            description: $(el).find('.description').text().trim(),
        });
    });

    return grants;
}