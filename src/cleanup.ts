// Run directly:
//   npx tsx src/cleanup.ts            ← deletes stale grants
//   npx tsx src/cleanup.ts --dry-run  ← preview only, nothing deleted

import { deleteStaleGrants, writeSystemLog } from './library/db_handler.js';

const dryRun = process.argv.includes('--dry-run');

async function main() {
  if (dryRun) {
    console.log('--- DRY RUN MODE — no grants will be deleted ---\n');
  }

  const count = await deleteStaleGrants(dryRun);

  if (!dryRun) {
    console.log(`\nDone — ${count} grants deleted.`);

    await writeSystemLog("cleanup", { deleted: count });
  }
}

main()
  .catch((e) => { console.error('Cleanup failed:', e); process.exit(1); });