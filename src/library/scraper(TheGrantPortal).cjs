const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

// Keywords for grant scraping
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
  "Early childhood",
  "Childhood",
  "Education",
  "education",
  "Childcare",
  "Pediatric",
  "pediatric",
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
  "development"
];

// Configuration
const CONFIG = {
  texasGrantPortal: {
    baseUrl: 'https://texas.thegrantportal.com',
    // Set your session cookie here if you have a subscription
    sessionCookie: process.env.TGP_SESSION_COOKIE || null,
  },
  grantsGov: {
    apiUrl: 'https://api.grants.gov/v1/api/search2',
  },
  outputDir: path.join(__dirname, 'output'),
};

// Ensure output directory exists
if (!fs.existsSync(CONFIG.outputDir)) {
  fs.mkdirSync(CONFIG.outputDir, { recursive: true });
}

// Delay helper
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// HTTP client
async function fetchWithRetry(url, options = {}, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await axios({
        url,
        method: options.method || 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'application/json, text/html',
          ...options.headers,
        },
        data: options.data,
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

// ===========================================
// GRANTS.GOV (Federal Grants - Public API)
// ===========================================
async function scrapeGrantsGov() {
  console.log('\n  Grants.gov (Federal Grants API)');
  const grants = [];
  
  for (const keyword of KEYWORDS) {
    console.log(`  Searching: "${keyword}"`);
    
    try {
      const response = await fetchWithRetry(CONFIG.grantsGov.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        data: {
          keyword: keyword,
          oppStatus: 'posted',
          rows: 50,
          sortBy: 'openDate|desc',
        },
      });
      
      // API returns data.data.oppHits
      const oppHits = response?.data?.data?.oppHits || response?.data?.oppHits || [];
      console.log(`    Found ${oppHits.length} opportunities`);
      
      oppHits.forEach(opp => {
        // Clean HTML entities from title
        const title = (opp.title || '').replace(/&ndash;/g, '–').replace(/&amp;/g, '&');
        
        grants.push({
          title,
          opportunityNumber: opp.number || '',
          opportunityId: opp.id || '',
          link: `https://www.grants.gov/search-results-detail/${opp.id}`,
          description: '',
          deadline: opp.closeDate || '',
          openDate: opp.openDate || '',
          status: opp.oppStatus || '',
          agency: opp.agency || '',
          cfda: (opp.cfdaList || []).join(', '),
          source: 'Grants.gov',
          keyword,
          scrapedAt: new Date().toISOString(),
        });
      });
    } catch (error) {
      console.log(`    Error: ${error.message}`);
    }
    
    await delay(1000);
  }
  
  console.log(`  Total: ${grants.length} grants`);
  return grants;
}

// ===========================================
// TEXAS GRANT PORTAL (Requires Authentication)
// ===========================================
async function scrapeTexasGrantPortal() {
  console.log('\n Texas Grant Portal');
  
  if (!CONFIG.texasGrantPortal.sessionCookie) {
    console.log('    Authentication required for this source.');
    console.log('    To enable: Set TGP_SESSION_COOKIE environment variable');
    console.log('     or update CONFIG.texasGrantPortal.sessionCookie in this file.');
    console.log('  ℹ  Steps to get cookie:');
    console.log('     1. Login to texas.thegrantportal.com in your browser');
    console.log('     2. Open DevTools (F12) → Application → Cookies');
    console.log('     3. Copy the session cookie value');
    return [];
  }
  
  console.log(' Using authenticated session...');
  const grants = [];
  
  for (const keyword of KEYWORDS) {
    console.log(`  Searching: "${keyword}"`);
    
    const searchUrl = `${CONFIG.texasGrantPortal.baseUrl}/grants?search=${encodeURIComponent(keyword)}`;
    
    const response = await fetchWithRetry(searchUrl, {
      headers: {
        Cookie: CONFIG.texasGrantPortal.sessionCookie,
      },
    });
    
    if (!response) continue;
    
    // Check if redirected to login
    if (response.data.includes('Sign In') && response.data.includes('login')) {
      console.log('     Session expired - please update cookie');
      break;
    }
    
    const $ = cheerio.load(response.data);
    
    // Parse grant results (adjust selectors based on actual structure)
    $('.grant-item, .grant-card, .listing-item, article').each((_, el) => {
      const $el = $(el);
      const title = cleanText($el.find('h2, h3, .title, .grant-title').first().text());
      let link = $el.find('a').first().attr('href');
      
      if (!title || title.length < 5) return;
      
      if (link && !link.startsWith('http')) {
        link = `${CONFIG.texasGrantPortal.baseUrl}${link}`;
      }
      
      grants.push({
        title,
        link: link || '',
        description: cleanText($el.find('p, .description, .summary').first().text()),
        deadline: cleanText($el.find('.deadline, .due-date').first().text()),
        amount: cleanText($el.find('.amount, .funding').first().text()),
        source: 'Texas Grant Portal',
        keyword,
        scrapedAt: new Date().toISOString(),
      });
    });
    
    await delay(1500);
  }
  
  console.log(`  Total: ${grants.length} grants`);
  return grants;
}

// Remove duplicates
function deduplicateGrants(grants) {
  const seen = new Set();
  return grants.filter(grant => {
    // Use opportunityId for Grants.gov, link for others
    const key = grant.opportunityId || grant.link || grant.title.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// Filter by Texas relevance (for federal grants)
function filterTexasRelevant(grants) {
  const texasTerms = ['texas', 'tx', 'regional', 'national', 'all states'];
  
  return grants.filter(grant => {
    // Keep all Texas Grant Portal results
    if (grant.source === 'Texas Grant Portal') return true;
    
    // For federal grants, check if open to Texas
    const text = `${grant.title} ${grant.description} ${grant.eligibility}`.toLowerCase();
    return !grant.eligibility || 
           texasTerms.some(term => text.includes(term)) ||
           !text.includes('restricted');
  });
}

// Export to JSON
function exportToJSON(grants, filename) {
  const filepath = path.join(CONFIG.outputDir, filename);
  fs.writeFileSync(filepath, JSON.stringify(grants, null, 2));
  console.log(`  ${filename} (${grants.length} grants)`);
}

// Export to CSV
function exportToCSV(grants, filename) {
  if (grants.length === 0) {
    console.log(`   ${filename} (empty - no grants)`);
    return;
  }
  
  const headers = ['title', 'opportunityId', 'link', 'description', 'deadline', 'openDate', 'amount', 'agency', 'category', 'source', 'keyword', 'scrapedAt'];
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
  console.log(`  ${filename} (${grants.length} grants)`);
}

// Print sample grants
function printSample(grants, count = 5) {
  console.log(`\n Sample Grants (first ${Math.min(count, grants.length)}):`);
  console.log('─'.repeat(60));
  
  grants.slice(0, count).forEach((grant, i) => {
    console.log(`\n${i + 1}. ${grant.title}`);
    if (grant.agency) console.log(`   Agency: ${grant.agency}`);
    if (grant.amount) console.log(`   Amount: ${grant.amount}`);
    if (grant.deadline) console.log(`   Deadline: ${grant.deadline}`);
    console.log(`   Source: ${grant.source}`);
    console.log(`   Link: ${grant.link}`);
  });
}

// Main
async function main() {
  console.log('═'.repeat(60));
  console.log('  GRANT SCRAPER');
  console.log('  Leadership Training & Development Grants');
  console.log('═'.repeat(60));
  console.log(`\n Keywords (${KEYWORDS.length}):`);
  KEYWORDS.forEach(kw => console.log(`   • ${kw}`));
  console.log('─'.repeat(60));
  
  let allGrants = [];
  
  // Scrape from sources
  const texasGrants = await scrapeTexasGrantPortal();
  const federalGrants = await scrapeGrantsGov();
  
  allGrants = [...texasGrants, ...federalGrants];
  
  // Process results
  const uniqueGrants = deduplicateGrants(allGrants);
  const relevantGrants = filterTexasRelevant(uniqueGrants);
  
  // Generate timestamp
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  
  console.log('\n' + '═'.repeat(60));
  console.log('  RESULTS SUMMARY');
  console.log('═'.repeat(60));
  console.log(`Total scraped: ${allGrants.length}`);
  console.log(`After deduplication: ${uniqueGrants.length}`);
  console.log(`Texas-relevant: ${relevantGrants.length}`);
  
  // By source
  const bySource = {};
  relevantGrants.forEach(g => {
    bySource[g.source] = (bySource[g.source] || 0) + 1;
  });
  console.log('\nBy Source:');
  Object.entries(bySource).forEach(([source, count]) => {
    console.log(`   ${source}: ${count}`);
  });
  
  // Export
  console.log('\n Exporting:');
  exportToJSON(relevantGrants, `grants_${timestamp}.json`);
  exportToCSV(relevantGrants, `grants_${timestamp}.csv`);
  exportToJSON(relevantGrants, 'grants_latest.json');
  exportToCSV(relevantGrants, 'grants_latest.csv');
  
  // Print sample
  if (relevantGrants.length > 0) {
    printSample(relevantGrants);
  }
  
  console.log('\n' + '═'.repeat(60));
  console.log('  COMPLETE');
  console.log(`  Output: ${CONFIG.outputDir}`);
  console.log('═'.repeat(60));
}

main().catch(console.error);