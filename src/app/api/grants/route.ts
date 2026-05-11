import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/library/db"; 

// Keywords matching TLT's target audience groups
const TARGET_KEYWORDS = [
  'family engagement',
  'teen',
  'higher education',
  'college',
  'workforce',
  'career',
  'women',
  'girls',
  'technology',
  'digital',
  'leadership',
  'mentoring',
  'professional development',
  'adult education',
  'training',
  'literacy',
  'education',
];

const PAGE_SIZE = 25;

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;

    const page     = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
    const search   = searchParams.get("search")?.trim() ?? "";
    const included = searchParams.getAll("include"); // ?include=Youth&include=STEM
    const excluded = searchParams.getAll("exclude");

    // Base keyword filter — always applied
    const keywordFilter = {
      OR: TARGET_KEYWORDS.map((kw) => ({
        title: { contains: kw },
      })),
    };

    // Search bar filter
    const searchFilter = search
      ? {
          OR: [
            { title:  { contains: search } },
            { agency: { contains: search } },
          ],
        }
      : undefined;

    // Include filter — grant must match at least one included keyword
    const includeFilter =
      included.length > 0
        ? {
            OR: included.map((kw) => ({
              OR: [
                { title:  { contains: kw } },
                { agency: { contains: kw } },
              ],
            })),
          }
        : undefined;

    // Exclude filter — grant must not match any excluded keyword
    const excludeFilter =
      excluded.length > 0
        ? {
            NOT: {
              OR: excluded.map((kw) => ({
                OR: [
                  { title:  { contains: kw } },
                  { agency: { contains: kw } },
                ],
              })),
            },
          }
        : undefined;

    const where = {
      AND: [
        keywordFilter,
        ...(searchFilter  ? [searchFilter]  : []),
        ...(includeFilter ? [includeFilter] : []),
        ...(excludeFilter ? [excludeFilter] : []),
      ],
    };

    // Run count and data fetch in parallel
    const [total, grants] = await Promise.all([
      prisma.grant.count({ where }),
      prisma.grant.findMany({
        where,
        include: {
          logs: {
            include: { user: true },
            orderBy: { updatedAt: "desc" },
          },
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
    return NextResponse.json(
      { error: "Failed to fetch grants." },
      { status: 500 }
    );
  }
}