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
// NOTE: Only applied to title to avoid false positives from descriptions.
// State names and abbreviations removed — they match common substrings ("IN" → "training",
// "OR" → "workforce") and national grants shouldn't be excluded for mentioning other states.
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
  baseUrl: 'https://www.grantwatch.com',
  searchUrl: 'https://www.grantwatch.com/grant-search.php',
  outputDir: path.join(__dirname, 'output'),
  // GrantWatch subscription cookie (optional - for authenticated access)
  sessionCookie: process.env.GRANTWATCH_SESSION_COOKIE || null,
};

// Ensure output directory exists
if (!fs.existsSync(CONFIG.outputDir)) {
  fs.mkdirSync(CONFIG.outputDir, { recursive: true });
}

// Delay helper
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// HTTP client with retry logic
async function fetchWithRetry(url, options = {}, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Referer': 'https://www.grantwatch.com/',
        ...options.headers,
      };
      
      if (CONFIG.sessionCookie) {
        headers['Cookie'] = CONFIG.sessionCookie;
      }
      
      const response = await axios({
        url,
        method: options.method || 'GET',
        headers,
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

// Extract grant ID from URL
function extractGrantId(url) {
  const match = url.match(/\/grant\/(\d+)\//);
  return match ? match[1] : '';
}

// Search GrantWatch grants
async function searchGrantWatch(keyword) {
  console.log(`  Searching: "${keyword}"`);
  const grants = [];
  
  // GrantWatch uses POST for search or URL parameters
  const searchUrl = `${CONFIG.searchUrl}?keyword=${encodeURIComponent(keyword)}`;
  
  const response = await fetchWithRetry(searchUrl);
  if (!response) {
    console.log(`    Failed to fetch results`);
    return grants;
  }
  
  const $ = cheerio.load(response.data);
  
  // Check if we're blocked or need subscription
  if (response.data.includes('Please login') || response.data.includes('subscription')) {
    console.log(`    [!] Subscription required for full access`);
  }
  
  // Parse grant listings from the page
  // GrantWatch shows grant previews with ID, title, deadline, and partial description
  
  // Look for grant links
  $('a[href*="/grant/"]').each((_, el) => {
    const $el = $(el);
    const href = $el.attr('href');
    
    // Skip non-grant links
    if (!href || !href.includes('/grant/')) return;
    
    // Get title from the link text or nearby heading
    let title = cleanText($el.text());
    
    // Skip very short or navigation-like titles
    if (!title || title.length < 10 || title === 'View' || title === 'View Grant') return;
    
    // Get parent container for more context
    const $container = $el.closest('div, article, li').first();
    const containerText = $container.text();
    
    // Extract deadline
    const deadlineMatch = containerText.match(/Deadline[:\s]*([^\n]+)/i) ||
                          containerText.match(/(\d{2}\/\d{2}\/\d{2,4})/);
    const deadline = deadlineMatch ? cleanText(deadlineMatch[1]) : '';
    
    // Extract grant ID
    const grantId = extractGrantId(href);
    
    // Extract description (usually truncated preview)
    let description = '';
    const $desc = $container.find('p, .description, .summary').first();
    if ($desc.length) {
      description = cleanText($desc.text()).slice(0, 300);
    }
    
    // Extract amount if mentioned
    const amountMatch = containerText.match(/\$[\d,]+(?:\s*(?:to|-)?\s*\$[\d,]+)?/);
    const amount = amountMatch ? amountMatch[0] : '';
    
    // Build full link
    const link = href.startsWith('http') ? href : `${CONFIG.baseUrl}${href}`;
    
    grants.push({
      title,
      grantId,
      link,
      description,
      deadline,
      amount,
      source: 'GrantWatch',
      keyword,
      scrapedAt: new Date().toISOString(),
    });
  });
  
  console.log(`    Found ${grants.length} grants`);
  return grants;
}

// Scrape category pages for leadership-related grants
async function scrapeCategoryPages() {
  console.log(`\n  Scraping relevant category pages...`);
  const grants = [];
  
  // Relevant GrantWatch categories
  const categories = [
    { url: '/cat/40/workforce-grants.html', name: 'Workforce' },
    { url: '/cat/41/youth-and-at-risk-youth-grants.html', name: 'Youth' },
    { url: '/cat/59/education-grants.html', name: 'Education' },
    { url: '/cat/5/community-services-grants.html', name: 'Community Services' },
  ];
  
  for (const category of categories) {
    console.log(`    Category: ${category.name}`);
    
    const response = await fetchWithRetry(`${CONFIG.baseUrl}${category.url}`);
    if (!response) continue;
    
    const $ = cheerio.load(response.data);
    
    $('a[href*="/grant/"]').each((_, el) => {
      const $el = $(el);
      const href = $el.attr('href');
      
      if (!href || !href.includes('/grant/')) return;
      
      let title = cleanText($el.text());
      if (!title || title.length < 10 || title === 'View' || title === 'View Grant') return;
      
      // Check if title contains leadership-related terms
      const titleLower = title.toLowerCase();
      const isRelevant = KEYWORDS.some(kw => 
        kw.split(' ').some(word => titleLower.includes(word.toLowerCase()))
      ) || titleLower.includes('leader') || titleLower.includes('training') || 
         titleLower.includes('development') || titleLower.includes('professional');
      
      if (!isRelevant) return;
      
      const $container = $el.closest('div, article, li').first();
      const containerText = $container.text();
      
      const deadlineMatch = containerText.match(/(\d{2}\/\d{2}\/\d{2,4})/);
      const deadline = deadlineMatch ? deadlineMatch[1] : '';
      
      const grantId = extractGrantId(href);
      const link = href.startsWith('http') ? href : `${CONFIG.baseUrl}${href}`;
      
      grants.push({
        title,
        grantId,
        link,
        description: '',
        deadline,
        amount: '',
        source: 'GrantWatch',
        keyword: `category_${category.name.toLowerCase().replace(' ', '_')}`,
        scrapedAt: new Date().toISOString(),
      });
    });
    
    await delay(1500);
  }
  
  console.log(`    Total from categories: ${grants.length} relevant grants`);
  return grants;
}

// Remove duplicates
function deduplicateGrants(grants) {
  const seen = new Set();
  return grants.filter(grant => {
    const key = grant.grantId || grant.link || grant.title.toLowerCase();
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
    console.log(`  Filtered out ${removedCount} grants (anti-keywords)`);
  }
  
  return filtered;
}

// Export to JSON
function exportToJSON(grants, filename) {
  const filepath = path.join(CONFIG.outputDir, filename);
  fs.writeFileSync(filepath, JSON.stringify(grants, null, 2));
  console.log(`  [JSON] ${filename} (${grants.length} grants)`);
}

// Export to CSV
function exportToCSV(grants, filename) {
  if (grants.length === 0) {
    console.log(`  [CSV] ${filename} (empty - no grants)`);
    return;
  }
  
  const headers = ['title', 'grantId', 'link', 'description', 'deadline', 'amount', 'source', 'keyword', 'scrapedAt'];
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
  console.log(`  [CSV] ${filename} (${grants.length} grants)`);
}

// Print sample grants
function printSample(grants, count = 5) {
  console.log(`\nSample Grants (first ${Math.min(count, grants.length)}):`);
  console.log('-'.repeat(60));
  
  grants.slice(0, count).forEach((grant, i) => {
    console.log(`\n${i + 1}. ${grant.title}`);
    if (grant.grantId) console.log(`   Grant ID: #${grant.grantId}`);
    if (grant.deadline) console.log(`   Deadline: ${grant.deadline}`);
    if (grant.amount) console.log(`   Amount: ${grant.amount}`);
    console.log(`   Link: ${grant.link}`);
  });
}

// Main
async function main() {
  console.log('='.repeat(60));
  console.log('  GRANTWATCH.COM SCRAPER');
  console.log('  https://www.grantwatch.com/');
  console.log('='.repeat(60));
  
  if (!CONFIG.sessionCookie) {
    console.log('\n[!] NOTE: GrantWatch requires a subscription ($199/year)');
    console.log('   for full grant details. This scraper collects publicly');
    console.log('   visible grant previews only.');
    console.log('\n[i] To enable full access:');
    console.log('   Set GRANTWATCH_SESSION_COOKIE environment variable');
  }
  
  console.log(`\nKeywords (${KEYWORDS.length}):`);
  KEYWORDS.forEach(kw => console.log(`   [+] ${kw}`));
  console.log(`\nAnti-Keywords (${ANTI_KEYWORDS.length}):`);
  ANTI_KEYWORDS.forEach(kw => console.log(`   [-] ${kw}`));
  console.log('-'.repeat(60));
  
  let allGrants = [];
  
  // Search each keyword
  console.log('\nSearching GrantWatch...');
  
  for (const keyword of KEYWORDS) {
    await delay(2000); // GrantWatch may have stricter rate limiting
    const grants = await searchGrantWatch(keyword);
    allGrants = allGrants.concat(grants);
  }
  
  // Also scrape relevant category pages
  const categoryGrants = await scrapeCategoryPages();
  allGrants = allGrants.concat(categoryGrants);
  
  // Process results
  const uniqueGrants = deduplicateGrants(allGrants);
  const finalGrants = filterAntiKeywords(uniqueGrants);
  
  // Generate timestamp
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  
  console.log('\n' + '='.repeat(60));
  console.log('  RESULTS SUMMARY');
  console.log('='.repeat(60));
  console.log(`Total scraped: ${allGrants.length}`);
  console.log(`After deduplication: ${uniqueGrants.length}`);
  console.log(`After anti-keyword filter: ${finalGrants.length}`);
  
  // Export
  console.log('\nExporting:');
  exportToJSON(finalGrants, `grantwatch_grants_${timestamp}.json`);
  exportToCSV(finalGrants, `grantwatch_grants_${timestamp}.csv`);
  exportToJSON(finalGrants, 'grantwatch_grants_latest.json');
  exportToCSV(finalGrants, 'grantwatch_grants_latest.csv');
  
  // Print sample
  if (finalGrants.length > 0) {
    printSample(finalGrants);
  } else {
    console.log('\n[!] No grants found. This may be due to:');
    console.log('   1. GrantWatch requiring subscription for search');
    console.log('   2. No matching grants currently available');
    console.log('   3. Rate limiting by the website');
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
