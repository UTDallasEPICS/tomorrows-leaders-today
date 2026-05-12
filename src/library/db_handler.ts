import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

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

  for (const raw of grants) {
    let opportunityNumber: string | undefined;

    try {
      const mapped = mapFn(raw);
      mapped.source = source;
      opportunityNumber = mapped.opportunityNumber;

      const validation = validate(mapped);
      if (!validation.valid) {
        result.skipped++;
        result.skippedLog.push({ raw, reason: validation.reason });
        console.warn(`[import] Skipped — ${validation.reason}`, { opportunityNumber });
        continue;
      }

      const { data } = validation;

      const existing = await prisma.grant.findUnique({
        where: { opportunityNumber: data.opportunityNumber },
      });

      if (existing) {
        await prisma.grant.update({
          where: { opportunityNumber: data.opportunityNumber },
          data: {
            title:              data.title,
            source:             source, // always refresh source on update
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
      } else {
        const created = await prisma.grant.create({
          data: {
            opportunityNumber:  data.opportunityNumber,
            title:              data.title,
            source:             source,
            agency:             data.agency,
            openingDate:        data.openingDate,
            closingDate:        data.closingDate,
            applicationType:    data.applicationType,
            category:           data.category,
            applicationLink:    data.applicationLink,
            awardFloor:         data.awardFloor,
            awardCeiling:       data.awardCeiling,
            totalFundingAmount: data.totalFundingAmount,
          },
        });

        result.inserted++;
      }
    } catch (err) {
      result.errors++;
      const reason = err instanceof Error ? err.message : String(err);
      result.errorLog.push({ opportunityNumber, reason });
      console.error(`[import] Error processing grant (${opportunityNumber ?? "unknown"}): ${reason}`);
    }
  }

  return result;
}