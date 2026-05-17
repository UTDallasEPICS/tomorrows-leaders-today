import { protect } from "@/library/auth";
import Navbar from "../components/Navbar";

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

type ScrapeRun = { at: string; meta: ScrapeRunMeta | null };
type CleanupRun = { at: string; meta: CleanupMeta | null };

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
  const mins = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days = Math.floor(diff / 86_400_000);
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

function pct(part: number, total: number): number {
  return total > 0 ? Math.round((part / total) * 100) : 0;
}

export default async function StatsPage() {
  await protect();

  const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/stats`, {
    cache: "no-store",
  });
  const s: Stats = await res.json();

  const haveDeadline = s.totalGrants - s.noDeadline;
  const haveLink = s.totalGrants - s.noApplicationLink;

  return (
    <>
      <Navbar />
      <main className="bg-white min-h-screen">
        <div className="max-w-5xl mx-auto px-6 py-10">
          <header className="mb-10">
            <h1 className="text-2xl font-semibold text-gray-900">STATS</h1>
            <p className="text-sm text-gray-500 mt-1">
              Scraper activity and data health.
            </p>
          </header>

          {/* Stat row */}
          <section className="grid grid-cols-2 md:grid-cols-4 gap-px bg-gray-200 border border-gray-200 rounded-lg overflow-hidden mb-10">
            {[
              { label: "Total grants", value: s.totalGrants.toLocaleString() },
              {
                label: "Updated this week",
                value: s.addedThisWeek.toLocaleString(),
              },
              {
                label: "Closing in 30 days",
                value: s.expiringIn30Days.toLocaleString(),
              },
              {
                label: "Closing in 7 days",
                value: s.expiringIn7Days.toLocaleString(),
                warn: s.expiringIn7Days > 0,
              },
            ].map(({ label, value, warn }) => (
              <div key={label} className="bg-white px-5 py-4">
                <p className="text-xs text-gray-500">{label}</p>
                <p
                  className={`text-2xl font-semibold tabular-nums mt-1 ${warn ? "text-amber-700" : "text-gray-900"}`}
                >
                  {value}
                </p>
              </div>
            ))}
          </section>

          <section className="mb-10">
            <h2 className="text-sm font-semibold text-gray-900 mb-3">
              Activity
            </h2>
            <div className="border border-gray-200 rounded-lg divide-y divide-gray-200">
              {[
                {
                  label: "Last scrape",
                  log: s.lastScrape,
                  detail:
                    s.lastScrape?.meta &&
                    `+${s.lastScrape.meta.inserted} new, ${s.lastScrape.meta.updated} updated${s.lastScrape.meta.errors > 0 ? `, ${s.lastScrape.meta.errors} errors` : ""}`,
                },
                {
                  label: "Last cleanup",
                  log: s.lastCleanup,
                  detail:
                    s.lastCleanup?.meta &&
                    `${s.lastCleanup.meta.deleted} removed`,
                },
              ].map(({ label, log, detail }) => (
                <div
                  key={label}
                  className="px-5 py-3 flex items-center justify-between gap-4"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900">{label}</p>
                    {detail && (
                      <p className="text-xs text-gray-500 mt-0.5 tabular-nums">
                        {detail}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    {log ? (
                      <>
                        <p className="text-sm text-gray-900 tabular-nums">
                          {timeAgo(log.at)}
                        </p>
                        <p className="text-xs text-gray-400 tabular-nums">
                          {formatDate(log.at)}
                        </p>
                      </>
                    ) : (
                      <p className="text-sm text-gray-400">Never</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="grid md:grid-cols-2 gap-6 mb-10">
            <div>
              <h2 className="text-sm font-semibold text-gray-900 mb-3">
                By source
              </h2>
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                {s.grantsBySource.length === 0 ? (
                  <p className="px-5 py-4 text-sm text-gray-400">
                    No data yet.
                  </p>
                ) : (
                  <ul className="divide-y divide-gray-200">
                    {s.grantsBySource.map(({ source, count }) => (
                      <li
                        key={source}
                        className="px-5 py-2.5 flex items-center justify-between text-sm"
                      >
                        <span className="text-gray-700 truncate pr-3">
                          {source}
                        </span>
                        <span className="text-gray-900 tabular-nums flex-shrink-0">
                          {count.toLocaleString()}
                          <span className="text-gray-400 ml-2 text-xs">
                            {pct(count, s.totalGrants)}%
                          </span>
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            <div>
              <h2 className="text-sm font-semibold text-gray-900 mb-3">
                Data completeness
              </h2>
              <div className="border border-gray-200 rounded-lg overflow-hidden divide-y divide-gray-200">
                {[
                  {
                    label: "Has a deadline",
                    have: haveDeadline,
                    missing: s.noDeadline,
                  },
                  {
                    label: "Has an application link",
                    have: haveLink,
                    missing: s.noApplicationLink,
                  },
                ].map(({ label, have, missing }) => {
                  const p = pct(have, s.totalGrants);
                  return (
                    <div key={label} className="px-5 py-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-700">{label}</span>
                        <span className="text-gray-900 tabular-nums font-medium">
                          {p}%
                        </span>
                      </div>
                      <div className="h-1 bg-gray-100 rounded-full mt-2 overflow-hidden">
                        <div
                          className="h-full bg-[#B89A49] rounded-full"
                          style={{ width: `${p}%` }}
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-1.5 tabular-nums">
                        {have.toLocaleString()} of{" "}
                        {s.totalGrants.toLocaleString()}
                        {missing > 0 && (
                          <span className="text-gray-400">
                            {" "}
                            — {missing.toLocaleString()} missing
                          </span>
                        )}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          <section className="mb-10">
            <div className="flex items-baseline justify-between mb-3">
              <h2 className="text-sm font-semibold text-gray-900">
                Scrape history
              </h2>
              <span className="text-xs text-gray-400">
                Last {s.scrapeHistory.length}
              </span>
            </div>
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              {s.scrapeHistory.length === 0 ? (
                <p className="px-5 py-4 text-sm text-gray-400">No runs yet.</p>
              ) : (
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-xs text-gray-500">
                    <tr>
                      <th className="px-5 py-2 text-left font-medium">When</th>
                      <th className="px-5 py-2 text-right font-medium">New</th>
                      <th className="px-5 py-2 text-right font-medium">
                        Updated
                      </th>
                      <th className="px-5 py-2 text-right font-medium">
                        Skipped
                      </th>
                      <th className="px-5 py-2 text-right font-medium">
                        Errors
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {s.scrapeHistory.map((run, i) => (
                      <tr key={i}>
                        <td className="px-5 py-2.5 text-gray-700">
                          {formatDate(run.at)}
                          <span className="text-gray-400 ml-2 text-xs">
                            {timeAgo(run.at)}
                          </span>
                        </td>
                        <td className="px-5 py-2.5 text-right tabular-nums text-gray-900">
                          {run.meta?.inserted ?? "—"}
                        </td>
                        <td className="px-5 py-2.5 text-right tabular-nums text-gray-700">
                          {run.meta?.updated ?? "—"}
                        </td>
                        <td className="px-5 py-2.5 text-right tabular-nums text-gray-500">
                          {run.meta?.skipped ?? "—"}
                        </td>
                        <td className="px-5 py-2.5 text-right tabular-nums">
                          {run.meta?.errors ? (
                            <span className="text-red-600">
                              {run.meta.errors}
                            </span>
                          ) : (
                            <span className="text-gray-400">0</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </section>
          <section>
            <div className="flex items-baseline justify-between mb-3">
              <h2 className="text-sm font-semibold text-gray-900">
                Cleanup history
              </h2>
              <span className="text-xs text-gray-400">
                Last {s.cleanupHistory?.length ?? 0}
              </span>
            </div>
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              {!s.cleanupHistory || s.cleanupHistory.length === 0 ? (
                <p className="px-5 py-4 text-sm text-gray-400">No runs yet.</p>
              ) : (
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-xs text-gray-500">
                    <tr>
                      <th className="px-5 py-2 text-left  font-medium">When</th>
                      <th className="px-5 py-2 text-right font-medium">
                        Removed
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {s.cleanupHistory.map((run, i) => (
                      <tr key={i}>
                        <td className="px-5 py-2.5 text-gray-700">
                          {formatDate(run.at)}
                          <span className="text-gray-400 ml-2 text-xs">
                            {timeAgo(run.at)}
                          </span>
                        </td>
                        <td className="px-5 py-2.5 text-right tabular-nums text-gray-900">
                          {run.meta?.deleted ?? 0}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
