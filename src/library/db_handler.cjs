const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');



// Find project root by looking for prisma folder
function findProjectRoot() {
  let dir = __dirname;
  // Walk up directory tree looking for prisma folder
  for (let i = 0; i < 10; i++) {
    if (fs.existsSync(path.join(dir, 'prisma', 'dev.db'))) {
      return dir;
    }
    const parent = path.dirname(dir);
    if (parent === dir) break; // Reached filesystem root
    dir = parent;
  }
  // Fallback: assume prisma is sibling to scraper's parent
  return path.join(__dirname, '..');
}

const PROJECT_ROOT = findProjectRoot();

const CONFIG = {
  dbPath: path.join(PROJECT_ROOT, 'prisma', 'dev.db'),
  outputDir: path.join(__dirname, 'output'),
};

// Generate hash from string (for opportunityNumber generation)
function generateHash(str) {
  return crypto.createHash('md5').update(str).digest('hex').substring(0, 8);
}

// Parse date string to ISO format
function parseDate(dateStr) {
  if (!dateStr || dateStr === '' || dateStr.toLowerCase() === 'ongoing') {
    return null;
  }
  
  // Handle various date formats
  const formats = [
    // MM/DD/YYYY or MM/DD/YY
    /^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/,
    // Month DD, YYYY
    /^([A-Za-z]+)\s+(\d{1,2}),?\s+(\d{4})$/,
    // YYYY-MM-DD
    /^(\d{4})-(\d{2})-(\d{2})$/,
  ];
  
  const months = {
    'january': 1, 'february': 2, 'march': 3, 'april': 4, 'may': 5, 'june': 6,
    'july': 7, 'august': 8, 'september': 9, 'october': 10, 'november': 11, 'december': 12
  };
  
  // Try MM/DD/YYYY format
  let match = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
  if (match) {
    let year = parseInt(match[3]);
    if (year < 100) year += 2000;
    const month = parseInt(match[1]);
    const day = parseInt(match[2]);
    return new Date(year, month - 1, day).toISOString();
  }
  
  // Try Month DD, YYYY format
  match = dateStr.match(/^([A-Za-z]+)\s+(\d{1,2}),?\s+(\d{4})$/);
  if (match) {
    const month = months[match[1].toLowerCase()];
    if (month) {
      const day = parseInt(match[2]);
      const year = parseInt(match[3]);
      return new Date(year, month - 1, day).toISOString();
    }
  }
  
  // Try ISO format
  match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) {
    return new Date(dateStr).toISOString();
  }
  
  // Try native Date parsing as fallback
  try {
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
      return date.toISOString();
    }
  } catch (e) {}
  
  return null;
}

// Parse amount string to float
function parseAmount(amountStr) {
  if (!amountStr || amountStr === '') return null;
  
  // Remove currency symbols, commas, and extract number
  const cleaned = amountStr.replace(/[$,]/g, '');
  const match = cleaned.match(/[\d.]+/);
  
  if (match) {
    const value = parseFloat(match[0]);
    return isNaN(value) ? null : value;
  }
  
  return null;
}

// Parse grant period to extract start/end dates
function parseGrantPeriod(periodStr) {
  if (!periodStr) return { start: null, end: null };
  
  // Format: "Month DD, YYYY–Month DD, YYYY" or similar
  const parts = periodStr.split(/[–\-]/);
  
  return {
    start: parts[0] ? parseDate(parts[0].trim()) : null,
    end: parts[1] ? parseDate(parts[1].trim()) : null,
  };
}

// Map Texas Grant Portal data to DB schema
function mapTexasGrantPortal(grant) {
  const amount = parseAmount(grant.amount);
  return {
    opportunityNumber: `TGP-${generateHash(grant.link || grant.title)}`,
    title: grant.title,
    agency: null,
    openingDate: null,
    closingDate: parseDate(grant.deadline),
    applicationType: null,
    category: grant.keyword || null,
    applicationLink: grant.link || null,
    awardFloor: null,
    awardCeiling: amount,
    totalFundingAmount: amount,
    scrapedAt: grant.scrapedAt,
  };
}

// Map Grants.gov data to DB schema
function mapGrantsGov(grant) {
  return {
    opportunityNumber: grant.opportunityNumber || `GOV-${grant.opportunityId}`,
    title: grant.title,
    agency: grant.agency || null,
    openingDate: parseDate(grant.openDate),
    closingDate: parseDate(grant.deadline),
    applicationType: grant.status || null,
    category: grant.cfda || grant.keyword || null,
    applicationLink: grant.link || null,
    awardFloor: null,
    awardCeiling: null,
    totalFundingAmount: null,
    scrapedAt: grant.scrapedAt,
  };
}

// Map Mott Foundation data to DB schema
function mapMott(grant) {
  const period = parseGrantPeriod(grant.grantPeriod);
  const amount = grant.amountValue || parseAmount(grant.amount);
  
  return {
    opportunityNumber: `MOTT-${generateHash(grant.link)}`,
    title: grant.title,
    agency: grant.organization || null,
    openingDate: period.start,
    closingDate: period.end,
    applicationType: null,
    category: grant.program || null,
    applicationLink: grant.link || null,
    awardFloor: null,
    awardCeiling: amount,
    totalFundingAmount: amount,
    scrapedAt: grant.scrapedAt,
  };
}

// Map GrantWatch data to DB schema
function mapGrantWatch(grant) {
  const amount = parseAmount(grant.amount);
  
  return {
    opportunityNumber: `GW-${grant.grantId || generateHash(grant.link)}`,
    title: grant.title,
    agency: null,
    openingDate: null,
    closingDate: parseDate(grant.deadline),
    applicationType: null,
    category: grant.keyword || null,
    applicationLink: grant.link || null,
    awardFloor: null,
    awardCeiling: amount,
    totalFundingAmount: amount,
    scrapedAt: grant.scrapedAt,
  };
}

// Mapper lookup by source name
const SOURCE_MAPPERS = {
  'Grants.gov': mapGrantsGov,
  'Texas Grant Portal': mapTexasGrantPortal,
  'Mott Foundation': mapMott,
  'GrantWatch': mapGrantWatch,
};

// Save an in-memory grants array directly to the DB (auto-dispatches mapper by source field)
function saveGrants(grants) {
  if (!grants || grants.length === 0) {
    return { inserted: 0, updated: 0, skipped: 0, errors: 0 };
  }

  if (!fs.existsSync(CONFIG.dbPath)) {
    console.log(`   [!] Database not found: ${CONFIG.dbPath}`);
    return { inserted: 0, updated: 0, skipped: 0, errors: 0 };
  }

  const db = new Database(CONFIG.dbPath);
  db.pragma('foreign_keys = ON');

  const totals = { inserted: 0, updated: 0, skipped: 0, errors: 0 };

  // Group by source so each source uses its own mapper
  const bySource = {};
  for (const grant of grants) {
    const src = grant.source || 'Unknown';
    if (!bySource[src]) bySource[src] = [];
    bySource[src].push(grant);
  }

  try {
    for (const [source, sourceGrants] of Object.entries(bySource)) {
      const mapFn = SOURCE_MAPPERS[source];
      if (!mapFn) {
        console.log(`   [!] No mapper for source "${source}" — skipping ${sourceGrants.length} grants`);
        totals.skipped += sourceGrants.length;
        continue;
      }

      const run = db.transaction(() => processGrants(db, sourceGrants, source, mapFn));
      const result = run();
      totals.inserted += result.inserted;
      totals.updated += result.updated;
      totals.skipped += result.skipped;
      totals.errors += result.errors;
    }
  } finally {
    db.close();
  }

  return totals;
}

// Process grants and insert into database
function processGrants(db, grants, source, mapFn) {
  let inserted = 0;
  let updated = 0;
  let skipped = 0;
  let errors = 0;
  
  // Prepare statements
  const selectStmt = db.prepare(`
    SELECT id, opportunityNumber FROM Grant WHERE opportunityNumber = ?
  `);
  
  const insertStmt = db.prepare(`
    INSERT INTO Grant (
      opportunityNumber, title, agency, openingDate, closingDate,
      applicationType, category, applicationLink, awardFloor, awardCeiling, totalFundingAmount,
      updatedAt
    ) VALUES (
      @opportunityNumber, @title, @agency, @openingDate, @closingDate,
      @applicationType, @category, @applicationLink, @awardFloor, @awardCeiling, @totalFundingAmount,
      @updatedAt
    )
  `);

  const updateStmt = db.prepare(`
    UPDATE Grant SET
      title = @title,
      agency = COALESCE(@agency, agency),
      openingDate = COALESCE(@openingDate, openingDate),
      closingDate = COALESCE(@closingDate, closingDate),
      applicationType = COALESCE(@applicationType, applicationType),
      category = COALESCE(@category, category),
      applicationLink = COALESCE(@applicationLink, applicationLink),
      awardFloor = COALESCE(@awardFloor, awardFloor),
      awardCeiling = COALESCE(@awardCeiling, awardCeiling),
      totalFundingAmount = COALESCE(@totalFundingAmount, totalFundingAmount),
      updatedAt = @updatedAt
    WHERE opportunityNumber = @opportunityNumber
  `);
  
  for (const grant of grants) {
    try {
      const mapped = { ...mapFn(grant), updatedAt: new Date().toISOString() };

      // Skip if no opportunityNumber or title
      if (!mapped.opportunityNumber || !mapped.title) {
        skipped++;
        continue;
      }
      
      // Check if exists
      const existing = selectStmt.get(mapped.opportunityNumber);
      
      if (existing) {
        // Update only if we have newer data (based on scrapedAt)
        // Since we're running right after scraping, new data is always "newer"
        updateStmt.run(mapped);
        updated++;
      } else {
        // Insert new record
        insertStmt.run(mapped);
        inserted++;
      }
    } catch (err) {
      errors++;
      console.error(`    Error processing grant: ${err.message}`);
    }
  }
  
  return { inserted, updated, skipped, errors };
}

// Main function to process all JSON files
function processAllFiles() {
  console.log('='.repeat(60));
  console.log('  DATABASE INPUT HANDLER');
  console.log('='.repeat(60));
  console.log(`\nDatabase: ${CONFIG.dbPath}`);
  console.log(`Output dir: ${CONFIG.outputDir}`);
  
  // Check if database exists
  if (!fs.existsSync(CONFIG.dbPath)) {
    console.error(`\n Database not found: ${CONFIG.dbPath}`);
    process.exit(1);
  }
  
  // Open database
  const db = new Database(CONFIG.dbPath);
  
  // Enable foreign keys
  db.pragma('foreign_keys = ON');
  
  const results = {
    total: { inserted: 0, updated: 0, skipped: 0, errors: 0 },
    sources: {},
  };
  
  // Process each source
  const sources = [
    {
      name: 'Grants.gov',
      file: 'grants_latest.json',
      mapper: mapGrantsGov,
    },
    {
      name: 'Mott Foundation',
      file: 'mott_grants_latest.json',
      mapper: mapMott,
    },
    {
      name: 'GrantWatch',
      file: 'grantwatch_grants_latest.json',
      mapper: mapGrantWatch,
    },
  ];
  
  console.log('\n' + '-'.repeat(60));
  
  for (const source of sources) {
    const filePath = path.join(CONFIG.outputDir, source.file);
    
    console.log(`\n Processing: ${source.name}`);
    console.log(`   File: ${source.file}`);
    
    if (!fs.existsSync(filePath)) {
      console.log(`   [!]  File not found - skipping`);
      continue;
    }
    
    try {
      const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      console.log(`   Records in file: ${data.length}`);
      
      // Process in a transaction for better performance
      const processInTransaction = db.transaction(() => {
        return processGrants(db, data, source.name, source.mapper);
      });
      
      const result = processInTransaction();
      
      results.sources[source.name] = result;
      results.total.inserted += result.inserted;
      results.total.updated += result.updated;
      results.total.skipped += result.skipped;
      results.total.errors += result.errors;
      
      console.log(`    Inserted: ${result.inserted}`);
      console.log(`    Updated: ${result.updated}`);
      console.log(`     Skipped: ${result.skipped}`);
      if (result.errors > 0) {
        console.log(`    Errors: ${result.errors}`);
      }
      
    } catch (err) {
      console.error(`    Error processing file: ${err.message}`);
    }
  }
  
  // Close database
  db.close();
  
  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('  SUMMARY');
  console.log('='.repeat(60));
  console.log(`Total inserted: ${results.total.inserted}`);
  console.log(`Total updated: ${results.total.updated}`);
  console.log(`Total skipped: ${results.total.skipped}`);
  console.log(`Total errors: ${results.total.errors}`);
  console.log('='.repeat(60));
  
  return results;
}

// Process a single file (for use by scrapers)
function processSingleFile(filename, source, mapper) {
  const filePath = path.join(CONFIG.outputDir, filename);
  
  if (!fs.existsSync(filePath)) {
    console.log(`   [!]  File not found: ${filename}`);
    return { inserted: 0, updated: 0, skipped: 0, errors: 0 };
  }
  
  if (!fs.existsSync(CONFIG.dbPath)) {
    console.log(`   [!]  Database not found: ${CONFIG.dbPath}`);
    return { inserted: 0, updated: 0, skipped: 0, errors: 0 };
  }
  
  const db = new Database(CONFIG.dbPath);
  db.pragma('foreign_keys = ON');
  
  try {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    
    const processInTransaction = db.transaction(() => {
      return processGrants(db, data, source, mapper);
    });
    
    const result = processInTransaction();
    db.close();
    
    return result;
  } catch (err) {
    console.error(`    Error: ${err.message}`);
    db.close();
    return { inserted: 0, updated: 0, skipped: 0, errors: 0 };
  }
}

// Export functions for use by scrapers
module.exports = {
  processAllFiles,
  processSingleFile,
  saveGrants,
  mapGrantsGov,
  mapTexasGrantPortal,
  mapMott,
  mapGrantWatch,
  CONFIG,
};

// Run if called directly
if (require.main === module) {
  processAllFiles();
}
