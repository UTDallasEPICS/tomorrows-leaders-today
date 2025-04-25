// npm run scrape in terminal to launch scraping script.
import { grantScraper } from './src/library/grantScraper.js';

 /*
 import axios from 'axios';
import { load } from 'cheerio';

 async function searchGrantSites(query = 'grant', maxResults = 5) {
    const searchUrl = `https://www.bing.com/search?q=${encodeURIComponent(query)}`;
    const { data: html } = await axios.get(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        Accept: 'text/html',
      }
    });
  
    const $ = load(html);
    const urls = [];

    // Debugging
    console.log('Total <a> tags:', $('a').length);
    $('a').slice(0, 10).each((i, el) => {
        console.log('[${i}]:', $(el).attr('href'));
    });

  // Bing puts each result in <li class="b_algo"><h2><a href="…">
  $('li.b_algo h2 > a').each((i, el) => {
    if (i >= maxResults) return false;
    const href = $(el).attr('href');
    if (href) urls.push(href);
  });

  return urls;
} 

Not currently needed but could be useful if attempting to search for websites that contain keywords.  
*/ 

async function run() {
    const keyword = '';
    console.log(`Running scrape with keyword: "${keyword}"`);
    const grants = await grantScraper(keyword, 5);
    console.log(`Found ${grants.length} opportunities:`);

    try {
    grants.forEach((g, i) => {
        console.log(`${i + 1}. ID: [${g.id}]`);
        console.log(`   Title: ${g.title}`);
        console.log(`   Agency: ${g.agency}`);
        console.log(`   Status: ${g.status}`);
        console.log(`   Posted: ${g.postedDate}`);
        console.log(`   Closes: ${g.closeDate}`);
        console.log(`   URL: ${g.url}\n`);
     });
    }

    catch (err) {
        console.error('Error fetching grants:', err.message);
    }
  }
  
  run();