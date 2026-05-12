import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import { db_handler } from './library/db_handler.js';
import { KEYWORDS } from './library/utils.js';

import {
  grantsGovScraper,
  theGrantPortalScraper,
  txSmartBuyScraper,
  tgrcScraper,
  teaScraper,
  grantwatchScraper,
  mottScraper,
} from './library/grantScraper.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = path.join(__dirname, 'library', 'output');

const allScrapers: Record<string, () => Promise<unknown[]>> = {
  "grants.gov":               () => grantsGovScraper(KEYWORDS),
  "thegrantportal.com":       () => theGrantPortalScraper(KEYWORDS),
  "txsmartbuy.gov":           () => txSmartBuyScraper(),
  "tgrc.hogg.utexas.edu":     () => tgrcScraper(),
  "tealprod.tea.state.tx.us": () => teaScraper(),
  "grantwatch.com":           () => grantwatchScraper(KEYWORDS),
  "mott.org":                 () => mottScraper(KEYWORDS),
};

async function run() {
  const grants: unknown[] = [];

  for (const [sourceName, scraperFn] of Object.entries(allScrapers)) {
    console.log(`Scraping from ${sourceName}...`);
    try {
      const results = await scraperFn();
      console.log(`Found ${results.length} opportunities from ${sourceName}.`);
      grants.push(...results.map(g => ({ ...(g as Record<string, unknown>), source: sourceName })));
    } catch (error) {
      console.error(`Error scraping ${sourceName}:`, error);
    }
  }

  console.log(`\nCollected ${grants.length} total opportunities.`);

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  const timestamp       = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const latestPath      = path.join(OUTPUT_DIR, 'all_grants_latest.json');
  const timestampedPath = path.join(OUTPUT_DIR, `all_grants_${timestamp}.json`);
  fs.writeFileSync(latestPath,      JSON.stringify(grants, null, 2));
  fs.writeFileSync(timestampedPath, JSON.stringify(grants, null, 2));
  console.log(`Saved to ${latestPath}`);

  console.log(`\nInserting into database...`);
  let totalInserted = 0, totalUpdated = 0, totalSkipped = 0, totalErrors = 0;
  const allErrorLog: unknown[] = [], allSkippedLog: unknown[] = [];

  // Group grants by source so each batch uses the correct mapper
  const bySource = new Map<string, Record<string, unknown>[]>();
  for (const g of grants as Record<string, unknown>[]) {
    const src = (g.source as string) ?? "AllScrapersCombined";
    if (!bySource.has(src)) bySource.set(src, []);
    bySource.get(src)!.push(g);
  }

  for (const [src, batch] of bySource) {
    const dbResult = await db_handler(batch, src);
    totalInserted += dbResult.inserted;
    totalUpdated  += dbResult.updated;
    totalSkipped  += dbResult.skipped;
    totalErrors   += dbResult.errors;
    allErrorLog.push(...dbResult.errorLog);
    allSkippedLog.push(...dbResult.skippedLog);
  }

  console.log(`Done — Inserted: ${totalInserted} | Updated: ${totalUpdated} | Skipped: ${totalSkipped} | Errors: ${totalErrors}`);
  if (allErrorLog.length > 0)   console.error("Import errors:",  allErrorLog);
  if (allSkippedLog.length > 0) console.warn("Skipped grants:", allSkippedLog);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});