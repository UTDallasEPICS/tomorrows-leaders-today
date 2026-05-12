const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

// Import DB handler for automatic database insertion
const dbHandler = require('./db_handler.cjs');
// Keywords for grant scraping (INCLUDE these)
const KEYWORDS = [
  "youth workforce", 
  "workforce development", 
  "workforce", 
  "Workforce", 
  "youth development", 
  "leadership", 
  "veteran", 
  "veterans", 
  "military", 
  "Youth", 
  "youth", 
  "Young", 
  "young", 
  "Children",
  "Minors",
  "minors", 
  "Education", 
  "education", 
  "Foster youth", 
  "foster", 
  "Veterans", 
  "Military", 
  "Wounded warriors", 
  "Disabled veterans", 
  "disabled", 
  "Housing", 
  "housing", 
  "Elderly", 
  "elderly",
  "Leader", 
  "leader", 
  "Leadership", 
  "Community leadership", 
  "Executive training", 
  "executive", 
  "Professional development", 
  "professional", 
  "Development", 
  "development",
  "Texas",
  "TX",
  "Tx"
];

// Anti-Keywords (EXCLUDE grants where the TITLE contains these terms)
// NOTE: Only applied to title to avoid false positives from org names and program areas.
// State names and abbreviations removed — they match common substrings ("IN" → "training",
// "OR" → "workforce") and Mott is a national funder whose grantees span all states.
const ANTI_KEYWORDS = [
  "early childhood",
  "preschool",
  "pre-school",
  "special needs",
  "physical therapy",
  "animal",
  "wildlife",
  "environmental",
  "climate",
  "agriculture",
  "arts endowment",
];

// Configuration
const CONFIG = {
  baseUrl: 'https://www.mott.org',
  searchUrl: 'https://www.mott.org/grants/',
  outputDir: path.join(__dirname, 'output'),
  resultsPerPage: 10,
  maxPages: 2, // Limit pages per keyword for faster results
};

// Ensure output directory exists
if (!fs.existsSync(CONFIG.outputDir)) {
  fs.mkdirSync(CONFIG.outputDir, { recursive: true });
}

// Delay helper
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// HTTP client with retry logic
async function fetchWithRetry(url, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
        },
        timeout: 30000,
      });
      return response;
    } catch (error) {
      console.log(`    Attempt ${i + 1} failed: ${error.message}`);
      if (i < retries - 1) await delay(2000 * (i + 1));
    }
  }
  return null;
}

// Clean text
function cleanText(text) {
  return (text || '').replace(/\s+/g, ' ').trim();
}

// Parse amount string to number for sorting
function parseAmount(amountStr) {
  if (!amountStr) return 0;
  const match = amountStr.replace(/,/g, '').match(/\d+/);
  return match ? parseInt(match[0]) : 0;
}

// Search Mott Foundation grants
async function searchMottGrants(keyword) {
  console.log(`  Searching: "${keyword}"`);
  const grants = [];
  
  // Search with the keyword
  const searchUrl = `${CONFIG.searchUrl}?query=${encodeURIComponent(keyword)}`;
  
  let currentPage = 1;
  let hasMorePages = true;
  
  while (hasMorePages && currentPage <= CONFIG.maxPages) {
    const pageUrl = currentPage === 1 ? searchUrl : `${searchUrl}&pg=${currentPage}`;
    
    const response = await fetchWithRetry(pageUrl);
    if (!response) {
      console.log(`    Failed to fetch page ${currentPage}`);
      break;
    }
    
    const $ = cheerio.load(response.data);
    let grantsOnPage = 0;
    
    // Parse grant listings - Mott uses article/card structure
    $('a[href*="/grants/"]').each((_, el) => {
      const $el = $(el);
      const href = $el.attr('href');
      
      // Skip navigation links
      if (!href || href === '/grants/' || href.includes('?') || href.includes('#')) return;
      
      // Get the parent container for more context
      const $container = $el.closest('article, .grant-item, div').first();
      
      // Extract title
      let title = cleanText($el.find('h2, h3, h4, h5').first().text()) || 
                  cleanText($el.text());
      
      if (!title || title.length < 5) return;
      
      // Extract amount
      const amountText = $container.text();
      const amountMatch = amountText.match(/\$[\d,]+/);
      const amount = amountMatch ? amountMatch[0] : '';
      
      // Extract organization
      const orgElements = $container.find('p, .organization, .grantee').toArray();
      let organization = '';
      for (const orgEl of orgElements) {
        const text = cleanText($(orgEl).text());
        if (text && !text.startsWith('$') && !text.includes('Location') && text.length > 3) {
          organization = text;
          break;
        }
      }
      
      // Extract location
      const locationMatch = amountText.match(/Location[:\s]+([^•\n]+)/i);
      const location = locationMatch ? cleanText(locationMatch[1]) : '';
      
      // Extract program area
      const programMatch = amountText.match(/Program[:\s]+([^•\n]+)/i);
      const program = programMatch ? cleanText(programMatch[1]) : '';
      
      // Extract grant period
      const periodMatch = amountText.match(/Grant Period[:\s]+([^•\n]+)/i);
      const grantPeriod = periodMatch ? cleanText(periodMatch[1]) : '';
      
      // Build full link
      const link = href.startsWith('http') ? href : `${CONFIG.baseUrl}${href}`;
      
      grants.push({
        title,
        link,
        amount,
        amountValue: parseAmount(amount),
        organization,
        location,
        program,
        grantPeriod,
        source: 'Mott Foundation',
        keyword,
        scrapedAt: new Date().toISOString(),
      });
      
      grantsOnPage++;
    });
    
    console.log(`    Page ${currentPage}: ${grantsOnPage} grants`);
    
    // Check if there are more pages
    const nextPageLink = $(`a[href*="pg=${currentPage + 1}"]`).length > 0;
    hasMorePages = nextPageLink && grantsOnPage > 0;
    currentPage++;
    
    if (hasMorePages) {
      await delay(1500); // Be polite between pages
    }
  }
  
  return grants;
}

// Also scrape the Youth Leadership program specifically
async function scrapeYouthLeadershipProgram() {
  console.log(`  Scraping Youth Leadership program page...`);
  const grants = [];
  
  // Mott has a specific Youth Leadership program
  const programUrl = `${CONFIG.searchUrl}?programs%5B%5D=29`; // Youth Leadership program ID
  
  const response = await fetchWithRetry(programUrl);
  if (!response) return grants;
  
  const $ = cheerio.load(response.data);
  
  $('a[href*="/grants/"]').each((_, el) => {
    const $el = $(el);
    const href = $el.attr('href');
    
    if (!href || href === '/grants/' || href.includes('?')) return;
    
    const $container = $el.closest('article, .grant-item, div').first();
    const title = cleanText($el.find('h2, h3, h4, h5').first().text()) || cleanText($el.text());
    
    if (!title || title.length < 5) return;
    
    const amountText = $container.text();
    const amountMatch = amountText.match(/\$[\d,]+/);
    const amount = amountMatch ? amountMatch[0] : '';
    
    const link = href.startsWith('http') ? href : `${CONFIG.baseUrl}${href}`;
    
    grants.push({
      title,
      link,
      amount,
      amountValue: parseAmount(amount),
      organization: '',
      location: '',
      program: 'Youth Leadership',
      grantPeriod: '',
      source: 'Mott Foundation',
      keyword: 'youth_leadership_program',
      scrapedAt: new Date().toISOString(),
    });
  });
  
  console.log(`    Found ${grants.length} Youth Leadership grants`);
  return grants;
}

// Remove duplicates
function deduplicateGrants(grants) {
  const seen = new Set();
  return grants.filter(grant => {
    const key = grant.link || grant.title.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// Filter out grants containing anti-keywords
function filterAntiKeywords(grants) {
  const beforeCount = grants.length;
  
  const filtered = grants.filter(grant => {
    const text = (grant.title || '').toLowerCase();
    const hasAntiKeyword = ANTI_KEYWORDS.some(antiKw => text.includes(antiKw.toLowerCase()));
    return !hasAntiKeyword;
  });
  
  const removedCount = beforeCount - filtered.length;
  if (removedCount > 0) {
    console.log(`   Filtered out ${removedCount} grants (anti-keywords)`);
  }
  
  return filtered;
}

// Export to JSON
function exportToJSON(grants, filename) {
  const filepath = path.join(CONFIG.outputDir, filename);
  fs.writeFileSync(filepath, JSON.stringify(grants, null, 2));
  console.log(`   ${filename} (${grants.length} grants)`);
}

// Export to CSV
function exportToCSV(grants, filename) {
  if (grants.length === 0) {
    console.log(`   ${filename} (empty - no grants)`);
    return;
  }
  
  const headers = ['title', 'link', 'amount', 'organization', 'location', 'program', 'grantPeriod', 'source', 'keyword', 'scrapedAt'];
  const csvRows = [headers.join(',')];
  
  grants.forEach(grant => {
    const row = headers.map(header => {
      let value = grant[header] || '';
      value = String(value).replace(/"/g, '""').replace(/\n/g, ' ');
      if (value.includes(',') || value.includes('"')) {
        value = `"${value}"`;
      }
      return value;
    });
    csvRows.push(row.join(','));
  });
  
  const filepath = path.join(CONFIG.outputDir, filename);
  fs.writeFileSync(filepath, csvRows.join('\n'));
  console.log(`   ${filename} (${grants.length} grants)`);
}

// Print sample grants
function printSample(grants, count = 5) {
  console.log(`\n Sample Grants (first ${Math.min(count, grants.length)}):`);
  console.log('-'.repeat(60));
  
  grants.slice(0, count).forEach((grant, i) => {
    console.log(`\n${i + 1}. ${grant.title}`);
    if (grant.amount) console.log(`   Amount: ${grant.amount}`);
    if (grant.organization) console.log(`   Organization: ${grant.organization}`);
    if (grant.program) console.log(`   Program: ${grant.program}`);
    if (grant.location) console.log(`   Location: ${grant.location}`);
    console.log(`   Link: ${grant.link}`);
  });
}

// Main
async function main() {
  console.log('='.repeat(60));
  console.log('  MOTT FOUNDATION GRANT SCRAPER');
  console.log('  https://www.mott.org/grants/');
  console.log('='.repeat(60));
  console.log(`\n Keywords (${KEYWORDS.length}):`);
  KEYWORDS.forEach(kw => console.log(`    ${kw}`));
  console.log(`\n Anti-Keywords (${ANTI_KEYWORDS.length}):`);
  ANTI_KEYWORDS.forEach(kw => console.log(`    ${kw}`));
  console.log('-'.repeat(60));
  
  let allGrants = [];
  
  // Search each keyword
  console.log('\n Searching Mott Foundation Grants Database...');
  
  for (const keyword of KEYWORDS) {
    await delay(1500);
    const grants = await searchMottGrants(keyword);
    allGrants = allGrants.concat(grants);
  }
  
  // Also get Youth Leadership specific grants
  await delay(1500);
  const youthGrants = await scrapeYouthLeadershipProgram();
  allGrants = allGrants.concat(youthGrants);
  
  // Process results
  const uniqueGrants = deduplicateGrants(allGrants);
  const finalGrants = filterAntiKeywords(uniqueGrants);
  
  // Sort by amount (highest first)
  finalGrants.sort((a, b) => b.amountValue - a.amountValue);
  
  // Generate timestamp
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  
  console.log('\n' + '='.repeat(60));
  console.log('  RESULTS SUMMARY');
  console.log('='.repeat(60));
  console.log(`Total scraped: ${allGrants.length}`);
  console.log(`After deduplication: ${uniqueGrants.length}`);
  console.log(`After anti-keyword filter: ${finalGrants.length}`);
  
  // Export
  console.log('\n Exporting:');
  exportToJSON(finalGrants, `mott_grants_${timestamp}.json`);
  exportToCSV(finalGrants, `mott_grants_${timestamp}.csv`);
  exportToJSON(finalGrants, 'mott_grants_latest.json');
  exportToCSV(finalGrants, 'mott_grants_latest.csv');
  
  // Print sample
  if (finalGrants.length > 0) {
    printSample(finalGrants);
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('  COMPLETE');
  console.log(`  Output: ${CONFIG.outputDir}`);
  console.log('='.repeat(60));
  
  // Save to database
  console.log('\nSaving to database...');
  const dbResult = dbHandler.saveGrants(finalGrants);
  console.log(`   Inserted: ${dbResult.inserted} | Updated: ${dbResult.updated} | Skipped: ${dbResult.skipped}`);
}

main().catch(console.error);