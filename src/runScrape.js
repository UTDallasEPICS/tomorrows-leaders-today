// npm run scrape in terminal to launch scraping script.
import grantScraper from './library/grantScraper.js';
import { PrismaClient, Prisma } from "@prisma/client";
const prisma = new PrismaClient();

const KEYWORDS = [ // Keywords that scraping will filter results by
  "leadership training",
  "leadership development",
  "leadership development program",
  "leadership program",
  "leadership training program",
  "leadership development training",
  "online leadership training",
  "youth leadership programi",
  // "summer leadership program",
  // "leadership training courses",
  // "leadership skills training",
  // "women leadership training",
  // "leadership professional development",
  // "nonprofit leadership training",
  // "leadership development courses",
  // "youth leadership development program",
  // "youth leadership training",
  // "leadership training certificate",
  // "virtual leadership training",
  // "leadership training and development",
  // "leadership training activities teens",
  // "leadership courses for teens",
  // "leadership training and consulting",
  // "academic leadership development",
  // "youth leadership development"
]

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
  // const keyword = "" + KEYWORDS.join(" ") + "";

  // Loop over all supported websites and run scrapers

  const keyword = "";
  console.log(`Running scrape with keyword: "${keyword}"`);

  const grants = [];

  for (let src in grantScraper) {
    console.log(`Scraping from ${src}...`);
    const res = await grantScraper[src](keyword);
    console.log(`Found ${res.length} opportunities from ${src}.`);
    grants.push(...res);
  }
  console.log(`Inserting ${grants.length} total opportunities into database...`);

  // Iteratively create grants in database
  try {
    const newEntries = grants.map((g, i) => {
      return {
        opportunityNumber: g.number,
        title: g.title,
        agency: g.agency,
        applicationLink: g.url,
        applicationType: "Application",
        openingDate: new Date(g.postedDate),
        closingDate: new Date(g.closeDate)
      };
    });

    newEntries.forEach(async e => {
      try {
        await prisma.grant.upsert({
          where: { opportunityNumber: e.opportunityNumber },
          update: {
            title: e.title,
            agency: e.agency,
            applicationLink: e.applicationLink,
            applicationType: e.applicationType,
            openingDate: e.openingDate,
            closingDate: e.closingDate
          },
          create: e
        });
        // console.log("Upserted grant:", e.opportunityNumber);
      } catch (err) {
        return;
        // console.error(`Error upserting grant ${e.opportunityNumber}:`, err.message);
      }
    });
    console.log("Finished processing all grants.");

    // For batched requests
    // const newEntries = grants.map((g, i) => {
    //   return [g.number, g.title, g.agency, g.url, "Application", new Date(g.postedDate), new Date(g.closeDate), new Date(Date.now())];
    // }).map(e => Prisma.sql`(${Prisma.join(e)})`);

    // // Raw SQL because Prisma createMany does not support ON CONFLICT DO NOTHING
    // await prisma.$executeRaw`INSERT INTO Grant (opportunityNumber, title, agency, applicationLink, applicationType, openingDate, closingDate, updatedAt) VALUES ${Prisma.join(newEntries, ",\n")} ON CONFLICT (opportunityNumber) DO NOTHING;`;

  } catch (e) {
    console.warn(e);
  }

}

run();