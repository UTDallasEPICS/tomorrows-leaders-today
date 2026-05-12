import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/library/db";

const PAGE_SIZE = 25;

const ALLOWED_FIELDS = new Set([
  "applicationLink",
  "closingDate",
  "openingDate",
  "agency",
  "description",
  "category",
  "applicationType",
  "awardFloor",
  "awardCeiling",
  "totalFundingAmount",
]);

function parseDate(value: string | null): Date | null {
  if (!value) return null;
  const d = new Date(value);
  return isNaN(d.getTime()) ? null : d;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;

    const page     = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
    const search   = searchParams.get("search")?.trim() ?? "";
    const included = searchParams.getAll("include");
    const excluded = searchParams.getAll("exclude");

    const requiredFields = searchParams
      .getAll("requireField")
      .filter((f) => ALLOWED_FIELDS.has(f));

    const openFrom  = parseDate(searchParams.get("openFrom"));
    const openTo    = parseDate(searchParams.get("openTo"));
    const closeFrom = parseDate(searchParams.get("closeFrom"));
    const closeTo   = parseDate(searchParams.get("closeTo"));

    // ── Keyword filters ────────────────────────────────────────────────────────

    const searchFilter = search
      ? { OR: [{ title: { contains: search } }, { agency: { contains: search } }] }
      : undefined;

    const includeFilter =
      included.length > 0
        ? { OR: included.map((kw) => ({ OR: [{ title: { contains: kw } }, { agency: { contains: kw } }] })) }
        : undefined;

    const excludeFilter =
      excluded.length > 0
        ? { NOT: { OR: excluded.map((kw) => ({ OR: [{ title: { contains: kw } }, { agency: { contains: kw } }] })) } }
        : undefined;


    const requiredFieldFilters = requiredFields.map((field) => ({
      [field]: { not: null },
    }));

    const dateFilters: object[] = [];

    if (openFrom || openTo) {
      // Swap if inverted
      const [lo, hi] =
        openFrom && openTo && openFrom > openTo
          ? [openTo, openFrom]
          : [openFrom, openTo];

      const condition: Record<string, unknown> = { not: null };
      if (lo) condition.gte = lo;
      if (hi) condition.lte = hi;
      dateFilters.push({ openingDate: condition });
    }

    if (closeFrom || closeTo) {
      const [lo, hi] =
        closeFrom && closeTo && closeFrom > closeTo
          ? [closeTo, closeFrom]
          : [closeFrom, closeTo];

      const condition: Record<string, unknown> = { not: null };
      if (lo) condition.gte = lo;
      if (hi) condition.lte = hi;
      dateFilters.push({ closingDate: condition });
    }

    const where = {
      AND: [
        ...(searchFilter  ? [searchFilter]  : []),
        ...(includeFilter ? [includeFilter] : []),
        ...(excludeFilter ? [excludeFilter] : []),
        ...requiredFieldFilters,
        ...dateFilters,
      ],
    };

    const [total, grants] = await Promise.all([
      prisma.grant.count({ where }),
      prisma.grant.findMany({
        where,
        include: {
          logs:               { include: { user: true }, orderBy: { updatedAt: "desc" } },
          contacts:           true,
          assistanceListings: true,
        },
        orderBy: { id: "asc" },
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
      }),
    ]);

    return NextResponse.json({
      grants,
      total,
      page,
      pageSize: PAGE_SIZE,
      totalPages: Math.ceil(total / PAGE_SIZE),
    });
  } catch (error) {
    console.error("Error fetching grants:", error);
    return NextResponse.json({ error: "Failed to fetch grants." }, { status: 500 });
  }
}