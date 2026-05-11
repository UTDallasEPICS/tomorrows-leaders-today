import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/library/db";

const PAGE_SIZE = 25;

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;

    const page     = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
    const search   = searchParams.get("search")?.trim() ?? "";
    const included = searchParams.getAll("include");
    const excluded = searchParams.getAll("exclude");

    const searchFilter = search
      ? {
          OR: [
            { title:  { contains: search } },
            { agency: { contains: search } },
          ],
        }
      : undefined;

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
        ...(searchFilter  ? [searchFilter]  : []),
        ...(includeFilter ? [includeFilter] : []),
        ...(excludeFilter ? [excludeFilter] : []),
      ],
    };

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