import { NextResponse } from "next/server";
import { prisma } from "@/library/db";
import { parseSystemLogMeta } from "@/library/db_handler";

export async function GET() {
  try {
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const sevenDaysFromNow  = new Date(now.getTime() +  7 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo      = new Date(now.getTime() -  7 * 24 * 60 * 60 * 1000);

    const [
      totalGrants,
      grantsBySource,
      expiringIn30Days,
      expiringIn7Days,
      noDeadline,
      noApplicationLink,
      addedThisWeek,
      lastScrapeLog,
      lastCleanupLog,
      recentScrapeLogs,
    ] = await Promise.all([
      prisma.grant.count(),

      prisma.grant.groupBy({
        by: ["source"],
        _count: { id: true },
        orderBy: { _count: { id: "desc" } },
      }),

      prisma.grant.count({
        where: { closingDate: { gte: now, lte: thirtyDaysFromNow } },
      }),

      prisma.grant.count({
        where: { closingDate: { gte: now, lte: sevenDaysFromNow } },
      }),

      prisma.grant.count({ where: { closingDate: null } }),

      prisma.grant.count({ where: { applicationLink: null } }),

      prisma.grant.count({ where: { lastSeenAt: { gte: sevenDaysAgo } } }),

      prisma.systemLog.findFirst({
        where: { event: "scrape" },
        orderBy: { createdAt: "desc" },
      }),

      prisma.systemLog.findFirst({
        where: { event: "cleanup" },
        orderBy: { createdAt: "desc" },
      }),

      prisma.systemLog.findMany({
        where: { event: "scrape" },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
    ]);

    return NextResponse.json({
      totalGrants,
      grantsBySource: grantsBySource.map((g) => ({
        source: g.source ?? "unknown",
        count:  g._count.id,
      })),
      expiringIn30Days,
      expiringIn7Days,
      noDeadline,
      noApplicationLink,
      addedThisWeek,
      lastScrape: lastScrapeLog
        ? { at: lastScrapeLog.createdAt, meta: parseSystemLogMeta(lastScrapeLog.meta) }
        : null,
      lastCleanup: lastCleanupLog
        ? { at: lastCleanupLog.createdAt, meta: parseSystemLogMeta(lastCleanupLog.meta) }
        : null,
      scrapeHistory: recentScrapeLogs.map((log) => ({
        at:   log.createdAt,
        meta: parseSystemLogMeta(log.meta),
      })),
    });
  } catch (error) {
    console.error("Error fetching stats:", error);
    return NextResponse.json({ error: "Failed to fetch stats." }, { status: 500 });
  }
}