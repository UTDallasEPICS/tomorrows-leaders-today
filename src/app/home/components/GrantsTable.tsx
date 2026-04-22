'use client';
import { useEffect, useState, useMemo } from "react";
import { ChevronDown, ChevronUp, Info, X } from "lucide-react";
import { SearchBar, FilterState } from "../SearchBar";

type GrantRow = {
  id: number;
  title: string;
  agency: string;
  release: string;
  deadline: string;
  fund: string;
  status: string;
  applicationLink: string | null;
  logs: {
    id: number;
    updatedAt: string;
    newStatus: string;
    originalStatus: string | null;
    user: { name: string };
  }[];
};

type SortField = "title" | "agency" | "release" | "deadline" | "fund" | "status";

const STATUS_COLORS: Record<string, string> = {
  "Accepted":    "bg-green-100 text-green-800",
  "Rejected":    "bg-red-100 text-red-800",
  "Applied":     "bg-blue-100 text-blue-800",
  "Not Applied": "bg-gray-100 text-gray-600",
};

const PAGE_SIZE = 10;

export default function GrantsTable() {
  const [grants, setGrants]           = useState<GrantRow[]>([]);
  const [loading, setLoading]         = useState(true);
  const [activeSort, setActiveSort]   = useState<SortField | null>(null);
  const [sortDir, setSortDir]         = useState<"asc" | "desc">("asc");
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);
  const [modalIdx, setModalIdx]       = useState<number | null>(null);
  const [filters, setFilters]         = useState<FilterState>({ search: "", status: "all", agency: "all" });
  const [page, setPage]               = useState(1);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res  = await fetch("/api/grants");
        const data = await res.json();
        const mapped: GrantRow[] = data.map((g: any) => ({
          id:              g.id,
          title:           g.title,
          agency:          g.agency ?? "N/A",
          release:         g.openingDate ? new Date(g.openingDate).toLocaleDateString() : "N/A",
          deadline:        g.closingDate ? new Date(g.closingDate).toLocaleDateString() : "N/A",
          fund:            g.totalFundingAmount ? `$${g.totalFundingAmount.toLocaleString()}` : "N/A",
          status:          g.logs?.[0]?.newStatus ?? "Not Applied",
          applicationLink: g.applicationLink ?? null,
          logs:            g.logs ?? [],
        }));
        setGrants(mapped);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // Unique agencies for filter dropdown
  const agencies = useMemo(
    () => [...new Set(grants.map((g) => g.agency).filter((a) => a !== "N/A"))].sort(),
    [grants]
  );

  // Filter
  const filtered = useMemo(() => {
    return grants.filter((g) => {
      const q = filters.search.toLowerCase();
      if (q && !g.title.toLowerCase().includes(q) && !g.agency.toLowerCase().includes(q)) return false;
      if (filters.status !== "all" && g.status !== filters.status) return false;
      if (filters.agency !== "all" && g.agency !== filters.agency) return false;
      return true;
    });
  }, [grants, filters]);

  // Sort
  const sorted = useMemo(() => {
    if (!activeSort) return filtered;
    return [...filtered].sort((a, b) => {
      let cmp = 0;
      if (activeSort === "release" || activeSort === "deadline") {
        const ta = a[activeSort] === "N/A" ? 0 : new Date(a[activeSort]).getTime();
        const tb = b[activeSort] === "N/A" ? 0 : new Date(b[activeSort]).getTime();
        cmp = ta - tb;
      } else if (activeSort === "fund") {
        cmp = Number(a.fund.replace(/[$,]/g, "") || 0) - Number(b.fund.replace(/[$,]/g, "") || 0);
      } else {
        cmp = String(a[activeSort]).localeCompare(String(b[activeSort]));
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [filtered, activeSort, sortDir]);

  // Pagination
  const totalPages  = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const paginated   = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleSort = (key: SortField) => {
    if (activeSort === key) setSortDir(sortDir === "asc" ? "desc" : "asc");
    else { setActiveSort(key); setSortDir("asc"); }
    setPage(1);
  };

  const handleFilter = (f: FilterState) => {
    setFilters(f);
    setPage(1);
    setExpandedIdx(null);
  };

  const columns: { key: SortField; label: string }[] = [
    { key: "title",    label: "Grant"    },
    { key: "agency",   label: "Agency"   },
    { key: "release",  label: "Release"  },
    { key: "deadline", label: "Deadline" },
    { key: "fund",     label: "Fund"     },
    { key: "status",   label: "Status"   },
  ];

  if (loading) {
    return (
      <div className="bg-[#E8DCC8] rounded-lg shadow p-12 flex items-center justify-center">
        <div className="flex items-center gap-3 text-gray-500">
          <div className="w-5 h-5 border-2 border-[#B89A49] border-t-transparent rounded-full animate-spin" />
          Loading grants…
        </div>
      </div>
    );
  }

  return (
    <div>
      <SearchBar onFilterChange={handleFilter} agencies={agencies} />

      {/* Results count */}
      <p className="text-sm text-gray-500 mb-2">
        Showing {sorted.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, sorted.length)} of {sorted.length} grants
      </p>

      <div className="bg-[#E8DCC8] rounded-lg shadow overflow-hidden">
        {/* Header — hidden on mobile, shown on md+ */}
        <div className="hidden md:grid md:grid-cols-6 bg-[#B89A49] text-white">
          {columns.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => handleSort(key)}
              className="p-3 text-left flex items-center justify-between hover:bg-[#A08940] transition-colors"
            >
              <span className={`text-sm font-medium ${activeSort === key ? "font-bold" : ""}`}>{label}</span>
              {activeSort === key
                ? sortDir === "asc" ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />
                : <ChevronDown className="w-4 h-4 opacity-40" />}
            </button>
          ))}
        </div>

        {/* Rows */}
        <div className="divide-y divide-gray-200">
          {paginated.length === 0 ? (
            <div className="p-10 text-center text-gray-400 text-sm">No grants match your filters.</div>
          ) : (
            paginated.map((grant, idx) => {
              const isExpanded = expandedIdx === idx;
              const statusClass = STATUS_COLORS[grant.status] ?? "bg-gray-100 text-gray-600";
              return (
                <div key={grant.id}>
                  {/* Desktop row */}
                  <div
                    className={`hidden md:grid md:grid-cols-6 cursor-pointer transition-colors ${
                      isExpanded ? "bg-[#E8DCC8]" : "bg-white hover:bg-gray-50"
                    }`}
                    onClick={() => setExpandedIdx(isExpanded ? null : idx)}
                  >
                    <div className="p-3 text-sm font-medium">{grant.title}</div>
                    <div className="p-3 text-sm text-gray-600">{grant.agency}</div>
                    <div className="p-3 text-sm text-gray-600">{grant.release}</div>
                    <div className="p-3 text-sm text-gray-600">{grant.deadline}</div>
                    <div className="p-3 text-sm text-gray-600">{grant.fund}</div>
                    <div className="p-3">
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${statusClass}`}>
                        {grant.status}
                      </span>
                    </div>
                  </div>

                  {/* Mobile card */}
                  <div
                    className={`md:hidden p-4 cursor-pointer transition-colors ${
                      isExpanded ? "bg-[#E8DCC8]" : "bg-white hover:bg-gray-50"
                    }`}
                    onClick={() => setExpandedIdx(isExpanded ? null : idx)}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <p className="text-sm font-semibold text-gray-800">{grant.title}</p>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusClass}`}>
                        {grant.status}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">{grant.agency}</p>
                    <div className="flex gap-4 mt-2 text-xs text-gray-500">
                      <span>Due: {grant.deadline}</span>
                      <span>{grant.fund}</span>
                    </div>
                  </div>

                  {/* Expanded panel */}
                  {isExpanded && (
                    <div className="bg-[#E8DCC8] px-6 py-4 shadow-inner border-t border-[#D4C18F]">
                      <div className="flex gap-3 items-center">
                        <button
                          className="px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50 transition-colors"
                          onClick={(e) => { e.stopPropagation(); setModalIdx(idx); }}
                        >
                          More Information
                        </button>
                        {grant.applicationLink && (
                          <button
                            className="px-4 py-2 bg-[#B89A49] text-white text-sm rounded-lg hover:bg-[#A08940] transition-colors"
                            onClick={(e) => { e.stopPropagation(); window.open(grant.applicationLink!, "_blank"); }}
                          >
                            Apply →
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Info modal */}
                  {modalIdx === idx && (
                    <div
                      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
                      onClick={() => setModalIdx(null)}
                    >
                      <div
                        className="bg-white rounded-xl p-6 max-w-md w-full shadow-xl"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex justify-between items-center mb-4">
                          <h3 className="text-base font-semibold">Status Update History</h3>
                          <button onClick={() => setModalIdx(null)} className="text-gray-400 hover:text-gray-600">
                            <X className="w-5 h-5" />
                          </button>
                        </div>
                        <div className="space-y-3 max-h-72 overflow-y-auto">
                          {grant.logs.length === 0 ? (
                            <p className="text-sm text-gray-400">No status updates yet.</p>
                          ) : (
                            grant.logs.map((log, i) => (
                              <div key={i} className="border-l-2 border-[#B89A49] pl-4">
                                <p className="text-xs text-gray-400">{new Date(log.updatedAt).toLocaleString()}</p>
                                <p className="text-sm text-gray-700">
                                  <span className="font-medium">{log.user.name}</span> changed status from{" "}
                                  <span className="font-medium">{log.originalStatus ?? "None"}</span> to{" "}
                                  <span className="font-medium">{log.newStatus}</span>
                                </p>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 bg-white border-t border-gray-200">
            <button
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
              className="px-3 py-1.5 text-sm rounded border border-gray-200 disabled:opacity-40 hover:bg-gray-50 transition-colors"
            >
              ← Previous
            </button>
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                .reduce<(number | "…")[]>((acc, p, i, arr) => {
                  if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push("…");
                  acc.push(p);
                  return acc;
                }, [])
                .map((p, i) =>
                  p === "…" ? (
                    <span key={`ellipsis-${i}`} className="px-2 text-gray-400 text-sm">…</span>
                  ) : (
                    <button
                      key={p}
                      onClick={() => setPage(p as number)}
                      className={`w-8 h-8 text-sm rounded transition-colors ${
                        page === p ? "bg-[#B89A49] text-white font-bold" : "hover:bg-gray-100 text-gray-700"
                      }`}
                    >
                      {p}
                    </button>
                  )
                )}
            </div>
            <button
              disabled={page === totalPages}
              onClick={() => setPage(page + 1)}
              className="px-3 py-1.5 text-sm rounded border border-gray-200 disabled:opacity-40 hover:bg-gray-50 transition-colors"
            >
              Next →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}