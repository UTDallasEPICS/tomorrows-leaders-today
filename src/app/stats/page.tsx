import { protect } from "@/library/auth";
import Navbar from "../components/Navbar";
import {
  Database,
  Clock,
  Trash2,
  AlertTriangle,
  Link,
  Calendar,
  RefreshCw,
} from "lucide-react";

type SourceBreakdown = { source: string; count: number };

type ScrapeRunMeta = {
  inserted: number;
  updated: number;
  skipped: number;
  errors: number;
  totalScraped: number;
  scrapeErrors: string[];
};

type CleanupMeta = { deleted: number };

type ScrapeRun = {
  at: string;
  meta: ScrapeRunMeta | null;
};

type CleanupRun = {
  at: string;
  meta: CleanupMeta | null;
};

type Stats = {
  totalGrants: number;
  grantsBySource: SourceBreakdown[];
  expiringIn30Days: number;
  expiringIn7Days: number;
  noDeadline: number;
  noApplicationLink: number;
  addedThisWeek: number;
  lastScrape: { at: string; meta: ScrapeRunMeta | null } | null;
  lastCleanup: { at: string; meta: CleanupMeta | null } | null;
  scrapeHistory: ScrapeRun[];
  cleanupHistory: CleanupRun[];
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  accent = false,
  warn = false,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  sub?: string;
  accent?: boolean;
  warn?: boolean;
}) {
  return (
    <div
      className={`bg-white rounded-xl border p-5 flex flex-col gap-3 shadow-sm ${warn ? "border-amber-200" : "border-gray-200"}`}
    >
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400">
          {label}
        </p>
        <div
          className={`w-8 h-8 rounded-lg flex items-center justify-center ${accent ? "bg-[#B89A49]/10" : warn ? "bg-amber-50" : "bg-gray-50"}`}
        >
          <Icon
            className={`w-4 h-4 ${accent ? "text-[#B89A49]" : warn ? "text-amber-500" : "text-gray-400"}`}
          />
        </div>
      </div>
      <div>
        <p
          className={`text-3xl font-bold tracking-tight ${accent ? "text-[#B89A49]" : warn ? "text-amber-600" : "text-gray-900"}`}
        >
          {value}
        </p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

function RunBadge({ errors }: { errors: number }) {
  return errors > 0 ? (
    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-200">
      {errors} error{errors !== 1 ? "s" : ""}
    </span>
  ) : (
    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-green-50 text-green-700 border border-green-200">
      clean
    </span>
  );
}

export default async function StatsPage() {
  await protect();

  const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/stats`, {
    cache: "no-store",
  });
  const s: Stats = await res.json();

  const withDeadlinePct =
    s.totalGrants > 0
      ? Math.round(((s.totalGrants - s.noDeadline) / s.totalGrants) * 100)
      : 0;
  const withLinkPct =
    s.totalGrants > 0
      ? Math.round(
          ((s.totalGrants - s.noApplicationLink) / s.totalGrants) * 100,
        )
      : 0;

  return (
    <>
      <Navbar />
      <div className="bg-gray-100 min-h-screen">
        <div className="bg-white border-b border-gray-200">
          <div className="px-6 py-5 flex items-end gap-4">
            <h1 className="text-2xl font-bold text-gray-900 leading-none">
              Scraper Stats
            </h1>
            <div className="flex-1 h-px bg-gradient-to-r from-[#B89A49]/40 to-transparent mb-1" />
          </div>
        </div>

        <div className="px-6 py-6 flex flex-col gap-8 max-w-6xl mx-auto">
          {/* Summary cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard
              icon={Database}
              label="Total Grants"
              value={s.totalGrants.toLocaleString()}
              sub={`${s.addedThisWeek.toLocaleString()} refreshed this week`}
              accent
            />
            <StatCard
              icon={Clock}
              label="Last Scraped"
              value={s.lastScrape ? timeAgo(s.lastScrape.at) : "Never"}
              sub={
                s.lastScrape ? formatDate(s.lastScrape.at) : "No runs recorded"
              }
            />
            <StatCard
              icon={Trash2}
              label="Last Cleanup"
              value={s.lastCleanup ? timeAgo(s.lastCleanup.at) : "Never"}
              sub={
                s.lastCleanup?.meta
                  ? `${s.lastCleanup.meta.deleted} deleted`
                  : "No runs recorded"
              }
            />
            <StatCard
              icon={AlertTriangle}
              label="Expiring Soon"
              value={s.expiringIn30Days.toLocaleString()}
              sub={`${s.expiringIn7Days} within 7 days`}
              warn={s.expiringIn7Days > 0}
            />
          </div>

          {/* Data quality + source breakdown */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100">
                <h2 className="text-sm font-bold text-gray-700">
                  Data Quality
                </h2>
              </div>
              <div className="px-5 py-4 flex flex-col gap-5">
                {[
                  {
                    icon: Calendar,
                    label: "Have a deadline",
                    have: s.totalGrants - s.noDeadline,
                    pct: withDeadlinePct,
                  },
                  {
                    icon: Link,
                    label: "Have an application link",
                    have: s.totalGrants - s.noApplicationLink,
                    pct: withLinkPct,
                  },
                ].map(({ icon: Icon, label, have, pct }) => (
                  <div key={label}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <Icon className="w-3.5 h-3.5 text-gray-400" />
                        <span className="text-xs text-gray-600">{label}</span>
                      </div>
                      <span className="text-xs font-bold text-gray-800">
                        {have.toLocaleString()}
                        <span className="text-gray-400 font-normal">
                          {" "}
                          / {s.totalGrants.toLocaleString()}
                        </span>
                      </span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#B89A49] rounded-full"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-gray-400 mt-1">{pct}%</p>
                  </div>
                ))}

                <div className="pt-2 border-t border-gray-100 grid grid-cols-2 gap-4">
                  {[
                    { label: "No Deadline", value: s.noDeadline },
                    { label: "No Link", value: s.noApplicationLink },
                  ].map(({ label, value }) => (
                    <div key={label}>
                      <p className="text-[10px] uppercase tracking-wider text-gray-400 font-bold mb-0.5">
                        {label}
                      </p>
                      <p className="text-xl font-bold text-gray-800">
                        {value.toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100">
                <h2 className="text-sm font-bold text-gray-700">
                  Grants by Source
                </h2>
              </div>
              <div className="divide-y divide-gray-50">
                {s.grantsBySource.length === 0 ? (
                  <p className="px-5 py-6 text-sm text-gray-400 italic">
                    No data yet.
                  </p>
                ) : (
                  s.grantsBySource.map(({ source, count }) => {
                    const pct =
                      s.totalGrants > 0
                        ? Math.round((count / s.totalGrants) * 100)
                        : 0;
                    return (
                      <div
                        key={source}
                        className="px-5 py-3 flex items-center gap-3"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-gray-700 truncate">
                            {source}
                          </p>
                          <div className="h-1 bg-gray-100 rounded-full mt-1.5 overflow-hidden">
                            <div
                              className="h-full bg-[#B89A49]/60 rounded-full"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-sm font-bold text-gray-800">
                            {count.toLocaleString()}
                          </p>
                          <p className="text-[10px] text-gray-400">{pct}%</p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Scrape history */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-gray-400" />
              <h2 className="text-sm font-bold text-gray-700">
                Recent Scrape Runs
              </h2>
            </div>
            {s.scrapeHistory.length === 0 ? (
              <p className="px-5 py-6 text-sm text-gray-400 italic">
                No scrape runs recorded yet.
              </p>
            ) : (
              <div className="divide-y divide-gray-50">
                {s.scrapeHistory.map((run, i) => (
                  <div
                    key={i}
                    className="px-5 py-3 flex items-center gap-4 flex-wrap"
                  >
                    <div className="flex-shrink-0 w-32">
                      <p className="text-xs font-semibold text-gray-700">
                        {timeAgo(run.at)}
                      </p>
                      <p className="text-[10px] text-gray-400">
                        {formatDate(run.at)}
                      </p>
                    </div>
                    {run.meta ? (
                      <>
                        <div className="flex gap-4 flex-wrap text-xs">
                          <span className="text-green-700 font-medium">
                            +{run.meta.inserted} new
                          </span>
                          <span className="text-blue-600 font-medium">
                            {run.meta.updated} updated
                          </span>
                          <span className="text-gray-400">
                            {run.meta.skipped} skipped
                          </span>
                          <span className="text-gray-500">
                            {run.meta.totalScraped} scraped
                          </span>
                        </div>
                        <div className="ml-auto flex-shrink-0">
                          <RunBadge errors={run.meta.errors} />
                        </div>
                      </>
                    ) : (
                      <span className="text-xs text-gray-400 italic">
                        No metadata
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Cleanup history */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
              <Trash2 className="w-4 h-4 text-gray-400" />
              <h2 className="text-sm font-bold text-gray-700">
                Recent Cleanup Runs
              </h2>
            </div>
            {!s.cleanupHistory || s.cleanupHistory.length === 0 ? (
              <p className="px-5 py-6 text-sm text-gray-400 italic">
                No cleanup runs recorded yet.
              </p>
            ) : (
              <div className="divide-y divide-gray-50">
                {s.cleanupHistory.map((run, i) => (
                  <div
                    key={i}
                    className="px-5 py-3 flex items-center gap-4 flex-wrap"
                  >
                    <div className="flex-shrink-0 w-32">
                      <p className="text-xs font-semibold text-gray-700">
                        {timeAgo(run.at)}
                      </p>
                      <p className="text-[10px] text-gray-400">
                        {formatDate(run.at)}
                      </p>
                    </div>
                    {run.meta ? (
                      <div className="flex gap-4 text-xs">
                        {run.meta.deleted > 0 ? (
                          <span className="text-red-600 font-medium">
                            {run.meta.deleted} deleted
                          </span>
                        ) : (
                          <span className="text-gray-400">
                            nothing to delete
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400 italic">
                        No metadata
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
