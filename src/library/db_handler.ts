import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Types

type RawGrant = Record<string, unknown>;

type MappedGrant = {
  opportunityNumber: string;
  title: string;
  agency?: string | null;
  openingDate?: Date | null;
  closingDate?: Date | null;
  applicationType?: string | null;
  category?: string | null;
  applicationLink?: string | null;
  awardFloor?: number | null;
  awardCeiling?: number | null;
  totalFundingAmount?: number | null;
  source?: string | null;
};

type ImportResult = {
  inserted: number;
  updated: number;
  skipped: number;
  errors: number;
  skippedLog: SkippedEntry[];
  errorLog: ErrorEntry[];
};

type SkippedEntry = {
  raw: RawGrant;
  reason: string;
};

type ErrorEntry = {
  opportunityNumber?: string;
  reason: string;
};

// Validation

const URL_REGEX = /^https?:\/\/.+/;

type ValidationResult =
  | { valid: true; data: MappedGrant }
  | { valid: false; reason: string };

function validate(mapped: Partial<MappedGrant>): ValidationResult {
  if (!mapped.opportunityNumber?.trim()) {
    return { valid: false, reason: "Missing opportunityNumber" };
  }
  if (!mapped.title?.trim()) {
    return { valid: false, reason: "Missing title" };
  }
  if (mapped.opportunityNumber.length > 200) {
    return { valid: false, reason: "opportunityNumber exceeds 200 characters" };
  }
  if (mapped.applicationLink && !URL_REGEX.test(mapped.applicationLink)) {
    return { valid: false, reason: `Invalid applicationLink: ${mapped.applicationLink}` };
  }
  if (
    mapped.openingDate instanceof Date && isNaN(mapped.openingDate.getTime()) ||
    mapped.closingDate instanceof Date && isNaN(mapped.closingDate.getTime())
  ) {
    return { valid: false, reason: "Invalid date value" };
  }
  if (
    mapped.awardFloor != null && mapped.awardCeiling != null &&
    mapped.awardFloor > mapped.awardCeiling
  ) {
    return { valid: false, reason: `awardFloor (${mapped.awardFloor}) exceeds awardCeiling (${mapped.awardCeiling})` };
  }

  return { valid: true, data: mapped as MappedGrant };
}

// Parsing Helpers

function parseDate(value: unknown): Date | null {
  if (!value || typeof value !== "string") return null;
  const str = value.trim();
  if (!str || str.toLowerCase() === "ongoing") return null;

  // MM/DD/YYYY or MM/DD/YY
  let m = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
  if (m) {
    let year = parseInt(m[3]);
    if (year < 100) year += 2000;
    const d = new Date(year, parseInt(m[1]) - 1, parseInt(m[2]));
    return isNaN(d.getTime()) ? null : d;
  }

  // Month DD, YYYY
  m = str.match(/^([A-Za-z]+)\s+(\d{1,2}),?\s+(\d{4})$/);
  if (m) {
    const d = new Date(`${m[1]} ${m[2]}, ${m[3]}`);
    return isNaN(d.getTime()) ? null : d;
  }

  // ISO or anything else — let Date handle it
  const d = new Date(str);
  return isNaN(d.getTime()) ? null : d;
}

function parseAmount(value: unknown): number | null {
  if (value == null) return null;
  if (typeof value === "number") return isNaN(value) ? null : value;
  if (typeof value === "string") {
    const cleaned = value.replace(/[$,\s]/g, "");
    const num = parseFloat(cleaned);
    return isNaN(num) ? null : num;
  }
  return null;
}

function parseGrantPeriod(value: unknown): { start: Date | null; end: Date | null } {
  if (!value || typeof value !== "string") return { start: null, end: null };
  const parts = value.split(/[–\-]/);
  return {
    start: parseDate(parts[0]?.trim()),
    end:   parseDate(parts[1]?.trim()),
  };
}

function generateHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString(16).padStart(8, "0");
}

function str(value: unknown): string | null {
  if (value == null) return null;
  const s = String(value).trim();
  return s || null;
}

// Source Mappers

function mapGrantsGov(raw: RawGrant): Partial<MappedGrant> {
  return {
    opportunityNumber: str(raw.number) ?? `GOV-${generateHash(str(raw.url) ?? str(raw.title) ?? "")}`,
    title:             str(raw.title) ?? undefined,
    agency:            str(raw.agency),
    openingDate:       parseDate(raw.postedDate),
    closingDate:       parseDate(raw.closeDate),
    applicationType:   str(raw.status),
    category:          str(raw.cfda) ?? str(raw.keyword),
    applicationLink:   str(raw.url),
  };
}

function mapTheGrantPortal(raw: RawGrant): Partial<MappedGrant> {
  const amount = parseAmount(raw.amount);
  return {
    opportunityNumber:  `TGP-${generateHash(str(raw.url) ?? str(raw.title) ?? "")}`,
    title:              str(raw.title) ?? undefined,
    closingDate:        parseDate(raw.closeDate),
    category:           str(raw.keyword),
    applicationLink:    str(raw.url),
    awardCeiling:       amount,
    totalFundingAmount: amount,
  };
}

function mapTxSmartBuy(raw: RawGrant): Partial<MappedGrant> {
  return {
    opportunityNumber:  str(raw.grantNumber) ?? `TSB-${generateHash(str(raw.applicationLink) ?? str(raw.title) ?? "")}`,
    title:              str(raw.title) ?? undefined,
    agency:             str(raw.agency),
    openingDate:        parseDate(raw.openingDate),
    closingDate:        parseDate(raw.closingDate),
    category:           str(raw.category),
    applicationLink:    str(raw.applicationLink),
    awardFloor:         parseAmount(raw.awardFloor),
    awardCeiling:       parseAmount(raw.awardCeiling),
    totalFundingAmount: parseAmount(raw.totalFundingAmount),
  };
}

function mapTGRC(raw: RawGrant): Partial<MappedGrant> {
  return {
    opportunityNumber: str(raw.number) ?? `TGRC-${generateHash(str(raw.url) ?? str(raw.title) ?? "")}`,
    title:             str(raw.title) ?? undefined,
    agency:            str(raw.agency),
    openingDate:       parseDate(raw.postedDate),
    closingDate:       parseDate(raw.closeDate),
    applicationType:   str(raw.applicationType),
    category:          str(raw.category),
    applicationLink:   str(raw.url),
  };
}

function mapTEA(raw: RawGrant): Partial<MappedGrant> {
  return {
    opportunityNumber: str(raw.opportunityNumber) ?? `TEA-${generateHash(str(raw.applicationLink) ?? str(raw.title) ?? "")}`,
    title:             str(raw.title) ?? undefined,
    agency:            str(raw.agency),
    openingDate:       parseDate(raw.openingDate),
    closingDate:       parseDate(raw.closingDate),
    applicationType:   str(raw.applicationType),
    category:          str(raw.category),
    applicationLink:   str(raw.applicationLink),
  };
}

function mapMott(raw: RawGrant): Partial<MappedGrant> {
  const period = parseGrantPeriod(raw.grantPeriod);
  const amount = typeof raw.amountValue === "number"
    ? raw.amountValue
    : parseAmount(raw.amount);
  return {
    opportunityNumber:  str(raw.number) ?? `MOTT-${generateHash(str(raw.url) ?? "")}`,
    title:              str(raw.title) ?? undefined,
    agency:             str(raw.organization),
    openingDate:        period.start,
    closingDate:        period.end,
    category:           str(raw.program),
    applicationLink:    str(raw.url),
    awardCeiling:       amount,
    totalFundingAmount: amount,
  };
}

function mapGrantWatch(raw: RawGrant): Partial<MappedGrant> {
  const amount = parseAmount(raw.amount);
  return {
    opportunityNumber:  str(raw.number) ?? `GW-${generateHash(str(raw.url) ?? "")}`,
    title:              str(raw.title) ?? undefined,
    closingDate:        parseDate(raw.closeDate),
    category:           str(raw.keyword),
    applicationLink:    str(raw.url),
    awardCeiling:       amount,
    totalFundingAmount: amount,
  };
}

function mapStandard(raw: RawGrant): Partial<MappedGrant> {
  return {
    opportunityNumber: str(raw.number) ?? `STD-${generateHash(str(raw.url) ?? str(raw.title) ?? "")}`,
    title:             str(raw.title) ?? undefined,
    agency:            str(raw.agency),
    openingDate:       parseDate(raw.postedDate),
    closingDate:       parseDate(raw.closeDate),
    applicationLink:   str(raw.url),
  };
}

export const SOURCE_MAPPERS: Record<string, (raw: RawGrant) => Partial<MappedGrant>> = {
  "grants.gov":               mapGrantsGov,
  "thegrantportal.com":       mapTheGrantPortal,
  "txsmartbuy.gov":           mapTxSmartBuy,
  "tgrc.hogg.utexas.edu":     mapTGRC,
  "tealprod.tea.state.tx.us": mapTEA,
  "mott.org":                 mapMott,
  "grantwatch.com":           mapGrantWatch,
  "AllScrapersCombined":      mapStandard,
};


async function ensureSystemUser(): Promise<void> {
  await prisma.user.upsert({
    where: { id: "SYSTEM" },
    update: {},
    create: {
      id:            "SYSTEM",
      name:          "System",
      email:         "system@tlt.internal",
      emailVerified: true,
    },
  });
}

type ExistingGrant = {
  id:                 number;
  agency:             string | null;
  openingDate:        Date | null;
  closingDate:        Date | null;
  applicationType:    string | null;
  category:           string | null;
  applicationLink:    string | null;
  awardFloor:         number | null;
  awardCeiling:       number | null;
  totalFundingAmount: number | null;
  opportunityNumber:  string;
};

type WriteOp =
  | { op: "insert"; data: MappedGrant }
  | { op: "update"; id: number; data: MappedGrant; existing: ExistingGrant };

// Three phases per source batch:
//   1. Validate all — map + validate every record, collect skips, no DB calls
//   2. Lookup all  — determine insert vs update for each valid grant
//   3. Write all   — execute all inserts/updates in a single transaction
//
// A transaction failure rolls back the entire source batch without
// affecting other sources already committed.

export async function db_handler(
  grants: RawGrant[],
  source: string
): Promise<ImportResult> {
  const result: ImportResult = {
    inserted: 0,
    updated:  0,
    skipped:  0,
    errors:   0,
    skippedLog: [],
    errorLog:   [],
  };

  if (!grants || grants.length === 0) {
    console.log(`[import] No grants to process for source: ${source}`);
    return result;
  }

  const mapFn = SOURCE_MAPPERS[source];
  if (!mapFn) {
    console.error(`[import] No mapper registered for source: "${source}"`);
    result.skipped = grants.length;
    result.skippedLog = grants.map((raw) => ({ raw, reason: `Unknown source: ${source}` }));
    return result;
  }

  await ensureSystemUser();

  const now = new Date();

  // Validate all 
  // Map and validate every record up front. No DB calls yet.
  // Collect valid grants for the next phase; log skips immediately.

  const valid: MappedGrant[] = [];

  for (const raw of grants) {
    try {
      const mapped = mapFn(raw);
      mapped.source = source;

      const validation = validate(mapped);
      if (!validation.valid) {
        result.skipped++;
        result.skippedLog.push({ raw, reason: validation.reason });
        console.warn(`[import] Skipped — ${validation.reason}`, { opportunityNumber: mapped.opportunityNumber });
        continue;
      }

      valid.push(validation.data);
    } catch (err) {
      result.errors++;
      result.errorLog.push({ reason: err instanceof Error ? err.message : String(err) });
    }
  }

  if (valid.length === 0) return result;

  // Lookup all
  // For each valid grant, determine whether it's an insert or update.
  // Lookups run outside the transaction (reads don't need to be atomic).
  //
  // Lookup order:
  //   1. opportunityNumber (exact, fast)
  //   2. applicationLink   (catches cross-source dupes and hash-changed records)

  const ops: WriteOp[] = [];

  for (const data of valid) {
    try {
      let existing = await prisma.grant.findUnique({
        where: { opportunityNumber: data.opportunityNumber },
      });

      if (!existing && data.applicationLink) {
        existing = await prisma.grant.findFirst({
          where: { applicationLink: data.applicationLink },
        }) ?? null;

        if (existing) {
          console.log(
            `[import] Matched by applicationLink — updating opportunityNumber ` +
            `"${existing.opportunityNumber}" → "${data.opportunityNumber}"`
          );
        }
      }

      if (existing) {
        ops.push({ op: "update", id: existing.id, data, existing });
      } else {
        ops.push({ op: "insert", data });
      }
    } catch (err) {
      result.errors++;
      result.errorLog.push({
        opportunityNumber: data.opportunityNumber,
        reason: err instanceof Error ? err.message : String(err),
      });
    }
  }

  if (ops.length === 0) return result;

  // Write all in one transaction
  // All inserts and updates for this source execute atomically.
  // If anything fails the entire batch rolls back — no partial imports.
  //
  // Inserts use createMany (single batched DB call) instead of N individual
  // create()s, which is essential for Neon/Postgres where each round-trip
  // costs ~50ms. Updates still loop since each needs unique where + merge logic.
  //
  // Generous timeout: large source batches over a remote DB can take time.

  const inserts = ops.filter((o) => o.op === "insert");
  const updates = ops.filter((o) => o.op === "update");

  try {
    await prisma.$transaction(async (tx) => {
      // Batched insert
      if (inserts.length > 0) {
        await tx.grant.createMany({
          data: inserts.map((op) => ({
            opportunityNumber:  op.data.opportunityNumber,
            title:              op.data.title,
            source:             source,
            lastSeenAt:         now,
            agency:             op.data.agency             ?? null,
            openingDate:        op.data.openingDate        ?? null,
            closingDate:        op.data.closingDate        ?? null,
            applicationType:    op.data.applicationType    ?? null,
            category:           op.data.category           ?? null,
            applicationLink:    op.data.applicationLink    ?? null,
            awardFloor:         op.data.awardFloor         ?? null,
            awardCeiling:       op.data.awardCeiling       ?? null,
            totalFundingAmount: op.data.totalFundingAmount ?? null,
          })),
        });
        result.inserted += inserts.length;
      }

      // Loop updates — each needs unique merge logic with its existing record
      for (const op of updates) {
        if (op.op !== "update") continue;
        const { data, existing } = op;
        await tx.grant.update({
          where: { id: op.id },
          data: {
            opportunityNumber:  data.opportunityNumber,
            title:              data.title,
            source:             source,
            lastSeenAt:         now,
            agency:             data.agency             ?? existing.agency,
            openingDate:        data.openingDate        ?? existing.openingDate,
            closingDate:        data.closingDate        ?? existing.closingDate,
            applicationType:    data.applicationType    ?? existing.applicationType,
            category:           data.category           ?? existing.category,
            applicationLink:    data.applicationLink    ?? existing.applicationLink,
            awardFloor:         data.awardFloor         ?? existing.awardFloor,
            awardCeiling:       data.awardCeiling       ?? existing.awardCeiling,
            totalFundingAmount: data.totalFundingAmount ?? existing.totalFundingAmount,
          },
        });
        result.updated++;
      }
    }, {
      maxWait: 30_000,   // wait up to 30s to acquire the transaction
      timeout: 300_000,  // allow 5 minutes for the whole batch to complete
    });
  } catch (err) {
    // Entire batch rolled back — credit all ops as errors
    const reason = err instanceof Error ? err.message : String(err);
    console.error(`[import] Transaction failed for source "${source}", batch rolled back: ${reason}`);
    result.errors  += ops.length;
    result.inserted = 0;
    result.updated  = 0;
    result.errorLog.push({ reason: `Transaction failed: ${reason}` });
  }

  return result;
}

//  Stale Grant Cleanup
// Deletes grants that are clearly expired or abandoned:
//
// 1. closingDate passed 30+ days ago → definitely expired
// 2. No closingDate and not seen in 60+ days → probably gone
// 3. No closingDate and openingDate was 2+ years ago → clearly stale
// 4. Never delete if openingDate is in the future

export async function deleteStaleGrants(dryRun = false): Promise<number> {
  const now = new Date();

  const closedCutoff = new Date();
  closedCutoff.setDate(closedCutoff.getDate() - 30);

  const unseenCutoff = new Date();
  unseenCutoff.setDate(unseenCutoff.getDate() - 60);

  const twoYearCutoff = new Date();
  twoYearCutoff.setFullYear(twoYearCutoff.getFullYear() - 2);

  const where = {
    OR: [
      // Rule 1: closing date passed 30+ days ago (only for grants already opened)
      {
        closingDate: { lt: closedCutoff },
        NOT: { openingDate: { gt: now } },
      },
      // Rule 2: no closing date, not seen in 60+ days
      {
        closingDate: null,
        NOT: { openingDate: { gt: now } },
        OR: [
          { lastSeenAt: { lt: unseenCutoff } },
          { lastSeenAt: null },
        ],
      },
      // Rule 3: no closing date, opened 2+ years ago — clearly abandoned
      {
        closingDate: null,
        openingDate: { lt: twoYearCutoff },
      },
    ],
  };

  // Always preview what will be deleted first
  const targets = await prisma.grant.findMany({
    where,
    select: {
      id:                true,
      opportunityNumber: true,
      title:             true,
      openingDate:       true,
      closingDate:       true,
      lastSeenAt:        true,
      source:            true,
    },
  });

  if (targets.length === 0) {
    console.log("[cleanup] No stale grants found.");
    return 0;
  }

  console.log(`[cleanup] ${dryRun ? "DRY RUN — " : ""}${targets.length} grants targeted for deletion:`);
  for (const g of targets) {
    console.log(
      `  [${g.source ?? "unknown"}] ${g.opportunityNumber} — "${g.title}" ` +
      `(opens: ${g.openingDate?.toLocaleDateString() ?? "none"}, ` +
      `closes: ${g.closingDate?.toLocaleDateString() ?? "none"}, ` +
      `last seen: ${g.lastSeenAt?.toLocaleDateString() ?? "never"})`
    );
  }

  if (dryRun) {
    console.log("[cleanup] Dry run complete — nothing deleted.");
    return targets.length;
  }

  // Delete inside a transaction so it either fully completes or fully rolls back
  const ids = targets.map((g) => g.id);
  const { count } = await prisma.$transaction(async (tx) => {
    return tx.grant.deleteMany({ where: { id: { in: ids } } });
  });

  console.log(`[cleanup] Deleted ${count} stale grants.`);
  return count;
}

// System Log
//
// Writes a log entry for the given event and trims the table to
// the most recent 20 entries for that event type.
//
// Handles both SQLite (where meta is a String field) and Postgres
// (where meta is a Json field) automatically. Detection is based
// on the DATABASE_URL — Postgres URLs start with "postgres".

const USES_NATIVE_JSON = (process.env.DATABASE_URL ?? "").startsWith("postgres");

/** Parse a meta value back into a plain object, whether it was stored as JSON or stringified. */
export function parseSystemLogMeta<T = Record<string, unknown>>(raw: unknown): T | null {
  if (raw == null) return null;
  if (typeof raw === "object") return raw as T;       // Postgres returned a Json object directly
  if (typeof raw === "string") {                       // SQLite returned a stringified JSON
    try { return JSON.parse(raw) as T; } catch { return null; }
  }
  return null;
}

export async function writeSystemLog(
  event: string,
  meta: Record<string, unknown>,
): Promise<void> {
  const MAX_LOGS = 20;

  // Postgres: pass the object directly so the Json column stores it natively.
  // SQLite:   stringify first since the String column can't hold an object.
  // The `as any` is needed because Prisma's generated types match whatever the
  // schema currently says — but we serve both shapes at runtime.
  const storedMeta = USES_NATIVE_JSON ? meta : JSON.stringify(meta);

  await prisma.systemLog.create({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: { event, meta: storedMeta as any },
  });

  // Trim to the most recent MAX_LOGS for this event type
  const keep = await prisma.systemLog.findMany({
    where:   { event },
    orderBy: { createdAt: "desc" },
    take:    MAX_LOGS,
    select:  { id: true },
  });

  const keepIds = keep.map((r) => r.id);

  await prisma.systemLog.deleteMany({
    where: {
      event,
      id: { notIn: keepIds },
    },
  });
}