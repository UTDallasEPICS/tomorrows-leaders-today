"use client";

import { useEffect, useState, useRef } from "react";
import { ChevronDown, ChevronUp, X, ExternalLink, History } from "lucide-react";
import Pagination from "@mui/material/Pagination";
import Stack from "@mui/material/Stack";
import type { DateRange } from "./DateRangePicker";

type GrantLog = {
  id: number;
  updatedAt: string;
  newStatus: string;
  originalStatus: string | null;
  user: { name: string };
};

type GrantContact = {
  id: number;
  name: string | null;
  email: string | null;
  phone: string | null;
};

type AssistanceListing = {
  id: number;
  code: string;
  name: string;
  link: string | null;
};

type GrantRow = {
  id: number;
  title: string;
  agency: string;
  release: string;
  deadline: string;
  fund: string;
  status: string;
  source: string | null;
  applicationLink: string | null;
  logs: GrantLog[];
  description: string | null;
  applicationType: string | null;
  category: string | null;
  awardFloor: number | null;
  awardCeiling: number | null;
  totalFundingAmount: number | null;
  contacts: GrantContact[];
  assistanceListings: AssistanceListing[];
};

// Sort fields map to actual DB column names
type SortField =
  | "title"
  | "agency"
  | "openingDate"
  | "closingDate"
  | "opportunityNumber";
type SortDir = "asc" | "desc";

type GrantsTableProps = {
  searchTerm?: string;
  includedKeywords?: string[];
  excludedKeywords?: string[];
  requiredFields?: string[];
  openingRange?: DateRange;
  closingRange?: DateRange;
};

const STATUS_STYLES: Record<string, { background: string; color: string }> = {
  APPLIED: { background: "#1a3a1a", color: "#7ec87e" },
  APPROVED: { background: "#1a3a1a", color: "#7ec87e" },
  WAITING_FOR_FEEDBACK: { background: "#2a2000", color: "#e8b820" },
  IN_PROGRESS: { background: "#2a2000", color: "#e8b820" },
  LOI: { background: "#1a2a3a", color: "#7eaec8" },
  DECLINED: { background: "#3a1a1a", color: "#c87e7e" },
  NOT_QUALIFIED: { background: "#3a1a1a", color: "#c87e7e" },
  NOT_APPLIED: { background: "#2a2a2a", color: "#aaaaaa" },
  AVAILABLE: { background: "#2a2a2a", color: "#aaaaaa" },
};

function StatusBadge({ status }: { status: string }) {
  const style = STATUS_STYLES[status] ?? {
    background: "#2a2a2a",
    color: "#aaaaaa",
  };
  return (
    <span
      style={{
        ...style,
        fontSize: 11,
        fontWeight: 600,
        padding: "3px 8px",
        letterSpacing: "0.04em",
        display: "inline-block",
      }}
    >
      {status.replace(/_/g, " ")}
    </span>
  );
}

export default function GrantsTable({
  searchTerm = "",
  includedKeywords = [],
  excludedKeywords = [],
  requiredFields = [],
  openingRange = { from: null, to: null },
  closingRange = { from: null, to: null },
}: GrantsTableProps) {
  const [grants, setGrants] = useState<GrantRow[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [retryCount, setRetryCount] = useState(0);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [showLogsFor, setShowLogsFor] = useState<number | null>(null);

  // Default: soonest deadline first
  const [sortField, setSortField] = useState<SortField>("closingDate");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const PAGE_SIZE = 25;

  const openFromISO = openingRange.from?.toISOString() ?? "";
  const openToISO = openingRange.to?.toISOString() ?? "";
  const closeFromISO = closingRange.from?.toISOString() ?? "";
  const closeToISO = closingRange.to?.toISOString() ?? "";
  const includedKey = includedKeywords.join(",");
  const excludedKey = excludedKeywords.join(",");
  const requiredKey = requiredFields.join(",");

  const filterKey = [
    searchTerm,
    includedKey,
    excludedKey,
    requiredKey,
    openFromISO,
    openToISO,
    closeFromISO,
    closeToISO,
    sortField,
    sortDir,
    retryCount,
  ].join("|");

  const prevFilterKey = useRef(filterKey);

  useEffect(() => {
    const isFilterChange = filterKey !== prevFilterKey.current;
    prevFilterKey.current = filterKey;
    const page = isFilterChange ? 1 : currentPage;
    if (isFilterChange) setCurrentPage(1);

    let cancelled = false;

    async function fetchGrants() {
      setLoading(true);
      setError(null);
      setExpandedId(null);

      try {
        const params = new URLSearchParams();
        params.set("page", String(page));
        params.set("sortField", sortField);
        params.set("sortDir", sortDir);
        if (searchTerm) params.set("search", searchTerm);
        includedKeywords.forEach((kw) => params.append("include", kw));
        excludedKeywords.forEach((kw) => params.append("exclude", kw));
        requiredFields.forEach((f) => params.append("requireField", f));
        if (openFromISO) params.set("openFrom", openFromISO);
        if (openToISO) params.set("openTo", openToISO);
        if (closeFromISO) params.set("closeFrom", closeFromISO);
        if (closeToISO) params.set("closeTo", closeToISO);

        const res = await fetch(`/api/grants?${params.toString()}`);
        if (!res.ok) throw new Error(`Server error: ${res.status}`);
        const data = await res.json();
        if (cancelled) return;

        const mapped: GrantRow[] = data.grants.map(
          (g: Record<string, unknown>) => ({
            id: g.id as number,
            title: (g.title as string) ?? "Untitled",
            agency: (g.agency as string) ?? "N/A",
            release: g.openingDate
              ? new Date(g.openingDate as string).toLocaleDateString()
              : "N/A",
            deadline: g.closingDate
              ? new Date(g.closingDate as string).toLocaleDateString()
              : "N/A",
            fund: (g.opportunityNumber as string) ?? "N/A",
            status: (g.logs as GrantLog[])?.[0]?.newStatus ?? "NOT_APPLIED",
            source: (g.source as string) ?? null,
            applicationLink: (g.applicationLink as string) ?? null,
            logs: (g.logs as GrantLog[]) ?? [],
            description: (g.description as string) ?? null,
            applicationType: (g.applicationType as string) ?? null,
            category: (g.category as string) ?? null,
            awardFloor: (g.awardFloor as number) ?? null,
            awardCeiling: (g.awardCeiling as number) ?? null,
            totalFundingAmount: (g.totalFundingAmount as number) ?? null,
            contacts: (g.contacts as GrantContact[]) ?? [],
            assistanceListings:
              (g.assistanceListings as AssistanceListing[]) ?? [],
          }),
        );

        setGrants(mapped);
        setTotalPages(data.totalPages);
        setTotal(data.total);
      } catch (err) {
        if (!cancelled)
          setError(
            err instanceof Error ? err.message : "Failed to load grants.",
          );
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchGrants();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterKey, currentPage]);

  function handleSort(field: SortField) {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("asc");
    }
    // filterKey change resets to page 1 automatically
  }

  const handlePageChange = (_: React.ChangeEvent<unknown>, page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const columns: { key: SortField; label: string }[] = [
    { key: "title", label: "Grant" },
    { key: "agency", label: "Agency" },
    { key: "openingDate", label: "Release" },
    { key: "closingDate", label: "Deadline" },
    { key: "opportunityNumber", label: "Opportunity #" },
  ];

  if (loading) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
        <div
          style={{
            width: 32,
            height: 32,
            border: "2px solid #B89A49",
            borderTopColor: "transparent",
            borderRadius: "50%",
            margin: "0 auto 12px",
            animation: "spin 0.8s linear infinite",
          }}
        />
        <p className="text-sm text-gray-500">Loading grants...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white border border-red-200 rounded-lg p-12 text-center">
        <p className="text-sm font-semibold text-red-600 mb-2">
          Failed to load grants
        </p>
        <p className="text-xs text-gray-500 mb-4">{error}</p>
        <button
          onClick={() => setRetryCount((c) => c + 1)}
          className="px-4 py-2 text-sm bg-[#B89A49] text-white rounded hover:bg-[#a08640] transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="bg-[#E8DCC8] rounded-lg shadow overflow-hidden">
        {/* Desktop header */}
        <div
          className="hidden md:grid bg-[#B89A49] text-white"
          style={{ gridTemplateColumns: "2fr 1.5fr 1fr 1fr 1.5fr" }}
        >
          {columns.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => handleSort(key)}
              className="p-3 text-left flex items-center justify-between hover:bg-black/10 transition-colors"
            >
              <span
                className={`text-sm ${sortField === key ? "font-bold" : "font-medium"}`}
              >
                {label}
              </span>
              {sortField === key ? (
                sortDir === "asc" ? (
                  <ChevronUp className="w-4 h-4 flex-shrink-0" />
                ) : (
                  <ChevronDown className="w-4 h-4 flex-shrink-0" />
                )
              ) : (
                <ChevronDown className="w-4 h-4 flex-shrink-0 opacity-40" />
              )}
            </button>
          ))}
        </div>

        {/* Rows */}
        <div className="divide-y divide-gray-300">
          {grants.length === 0 ? (
            <div className="p-12 text-center text-gray-500 text-sm">
              No grants match the current filters.
            </div>
          ) : (
            grants.map((grant) => {
              const isExpanded = expandedId === grant.id;
              return (
                <div key={grant.id}>
                  {/* Desktop row */}
                  <div
                    className={`hidden md:grid cursor-pointer transition-colors ${isExpanded ? "bg-[#E8DCC8]" : "bg-white hover:bg-gray-50"}`}
                    style={{ gridTemplateColumns: "2fr 1.5fr 1fr 1fr 1.5fr" }}
                    onClick={() => setExpandedId(isExpanded ? null : grant.id)}
                    role="row"
                    aria-expanded={isExpanded}
                  >
                    <div
                      className={`p-3 text-sm ${isExpanded ? "whitespace-normal break-words" : "truncate"}`}
                      title={grant.title}
                    >
                      {grant.title}
                    </div>
                    <div className="p-3 text-sm truncate" title={grant.agency}>
                      {grant.agency}
                    </div>
                    <div className="p-3 text-sm">{grant.release}</div>
                    <div className="p-3 text-sm">{grant.deadline}</div>
                    <div className="p-3 text-sm truncate">{grant.fund}</div>
                  </div>

                  {/* Mobile card */}
                  <div
                    className={`md:hidden cursor-pointer transition-colors border-b border-gray-200 ${isExpanded ? "bg-[#E8DCC8]" : "bg-white"}`}
                    onClick={() => setExpandedId(isExpanded ? null : grant.id)}
                  >
                    <div className="p-4 flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p
                          className={`text-sm font-semibold text-gray-900 ${isExpanded ? "whitespace-normal" : "truncate"}`}
                        >
                          {grant.title}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5 truncate">
                          {grant.agency}
                        </p>
                        <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                          <span>Due: {grant.deadline}</span>
                          <span>·</span>
                          <span>{grant.fund}</span>
                        </div>
                      </div>
                      <div className="flex-shrink-0 mt-0.5">
                        <StatusBadge status={grant.status} />
                      </div>
                    </div>
                  </div>

                  {/* Expanded panel */}
                  {isExpanded && (
                    <div className="bg-[#f5ede0] border-t border-[#d4c5a0]">
                      <div className="px-4 md:px-6 py-5 flex flex-col gap-5">
                        <p className="text-base font-semibold text-gray-900 leading-snug">
                          {grant.title}
                        </p>

                        {grant.description && (
                          <p className="text-sm text-gray-600 leading-relaxed border-l-2 border-[#B89A49] pl-3">
                            {grant.description}
                          </p>
                        )}

                        <div className="flex flex-wrap gap-x-8 gap-y-3">
                          {[
                            { label: "Opportunity #", value: grant.fund },
                            { label: "Type", value: grant.applicationType },
                            { label: "Category", value: grant.category },
                            { label: "Opens", value: grant.release },
                            { label: "Closes", value: grant.deadline },
                            { label: "Source", value: grant.source },
                          ]
                            .filter(({ value }) => value && value !== "N/A")
                            .map(({ label, value }) => (
                              <div key={label}>
                                <p className="text-[10px] font-bold uppercase tracking-wider text-[#8a7a4a]">
                                  {label}
                                </p>
                                <p className="text-sm text-gray-800 mt-0.5">
                                  {value}
                                </p>
                              </div>
                            ))}
                        </div>

                        {(grant.awardFloor != null ||
                          grant.awardCeiling != null ||
                          grant.totalFundingAmount != null) && (
                          <div>
                            <p className="text-[10px] font-bold uppercase tracking-wider text-[#8a7a4a] mb-2">
                              Funding
                            </p>
                            <div className="flex flex-wrap gap-3">
                              {[
                                { label: "Floor", value: grant.awardFloor },
                                { label: "Ceiling", value: grant.awardCeiling },
                                {
                                  label: "Total",
                                  value: grant.totalFundingAmount,
                                },
                              ]
                                .filter(({ value }) => value != null)
                                .map(({ label, value }) => (
                                  <div
                                    key={label}
                                    className="flex items-center gap-2 bg-white border border-[#e0d5c0] px-3 py-2"
                                  >
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#8a7a4a]">
                                      {label}
                                    </span>
                                    <span className="text-sm font-bold text-[#B89A49]">
                                      ${value!.toLocaleString()}
                                    </span>
                                  </div>
                                ))}
                            </div>
                          </div>
                        )}

                        {grant.contacts.length > 0 && (
                          <div>
                            <p className="text-[10px] font-bold uppercase tracking-wider text-[#8a7a4a] mb-2">
                              Contacts
                            </p>
                            <div className="flex flex-wrap gap-3">
                              {grant.contacts.map((c) => (
                                <div
                                  key={c.id}
                                  className="bg-white border border-[#e0d5c0] px-3 py-2 text-sm"
                                >
                                  {c.name && (
                                    <p className="font-semibold text-gray-800">
                                      {c.name}
                                    </p>
                                  )}
                                  {c.email && (
                                    <a
                                      href={`mailto:${c.email}`}
                                      className="text-[#B89A49] hover:underline text-xs block"
                                    >
                                      {c.email}
                                    </a>
                                  )}
                                  {c.phone && (
                                    <p className="text-gray-500 text-xs">
                                      {c.phone}
                                    </p>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {grant.assistanceListings.length > 0 && (
                          <div>
                            <p className="text-[10px] font-bold uppercase tracking-wider text-[#8a7a4a] mb-2">
                              Assistance Listings
                            </p>
                            <div className="flex flex-col gap-1.5">
                              {grant.assistanceListings.map((al) => (
                                <div
                                  key={al.id}
                                  className="flex items-center gap-2 text-sm"
                                >
                                  <span className="text-[10px] font-bold bg-[#B89A49] text-white px-2 py-0.5 flex-shrink-0">
                                    {al.code}
                                  </span>
                                  {al.link ? (
                                    <a
                                      href={al.link}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-[#B89A49] hover:underline"
                                    >
                                      {al.name}
                                    </a>
                                  ) : (
                                    <span className="text-gray-700">
                                      {al.name}
                                    </span>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="flex items-center gap-3 flex-wrap pt-1 border-t border-[#d4c5a0]">
                          <StatusBadge status={grant.status} />
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowLogsFor(grant.id);
                            }}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-white border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors"
                          >
                            <History className="w-3.5 h-3.5" />
                            Status History
                          </button>
                          {grant.applicationLink ? (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                window.open(
                                  grant.applicationLink!,
                                  "_blank",
                                  "noopener,noreferrer",
                                );
                              }}
                              className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-[#B89A49] text-white rounded hover:bg-[#a08640] transition-colors"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                              Apply
                            </button>
                          ) : (
                            <span className="text-sm text-gray-400 italic">
                              No application link
                            </span>
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

        {totalPages > 1 && (
          <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 bg-white border-t border-gray-300">
            <span className="text-sm text-gray-600">
              Showing {(currentPage - 1) * PAGE_SIZE + 1}–
              {Math.min(currentPage * PAGE_SIZE, total)} of {total} grants
            </span>
            <Stack spacing={2}>
              <Pagination
                count={totalPages}
                page={currentPage}
                onChange={handlePageChange}
                shape="rounded"
                size="large"
                sx={{
                  "& .MuiPaginationItem-root": {
                    fontSize: "1rem",
                    minWidth: "40px",
                    height: "40px",
                    "&.Mui-selected": {
                      backgroundColor: "#B89A49",
                      color: "white",
                      "&:hover": { backgroundColor: "#a08640" },
                    },
                  },
                }}
              />
            </Stack>
          </div>
        )}
      </div>

      {/* Status history modal */}
      {showLogsFor !== null &&
        (() => {
          const grant = grants.find((g) => g.id === showLogsFor);
          if (!grant) return null;
          return (
            <div
              style={{
                position: "fixed",
                inset: 0,
                background: "rgba(0,0,0,0.5)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 50,
              }}
              onClick={() => setShowLogsFor(null)}
            >
              <div
                style={{
                  background: "#fff",
                  borderRadius: 8,
                  padding: 24,
                  maxWidth: 480,
                  width: "100%",
                  margin: "0 16px",
                  maxHeight: "80vh",
                  overflowY: "auto",
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    marginBottom: 16,
                  }}
                >
                  <div>
                    <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>
                      Status History
                    </h3>
                    <p
                      style={{ margin: "4px 0 0", fontSize: 12, color: "#888" }}
                    >
                      {grant.title}
                    </p>
                  </div>
                  <button
                    onClick={() => setShowLogsFor(null)}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: "#888",
                      padding: 4,
                    }}
                    aria-label="Close"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                {grant.logs.length === 0 ? (
                  <p style={{ color: "#888", fontSize: 14 }}>
                    No status updates yet.
                  </p>
                ) : (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 12,
                    }}
                  >
                    {grant.logs.map((log, i) => (
                      <div
                        key={i}
                        style={{
                          borderLeft: "2px solid #B89A49",
                          paddingLeft: 12,
                        }}
                      >
                        <p style={{ margin: 0, fontSize: 12, color: "#888" }}>
                          {new Date(log.updatedAt).toLocaleString()}
                        </p>
                        <p
                          style={{
                            margin: "4px 0 0",
                            fontSize: 14,
                            color: "#333",
                          }}
                        >
                          <strong>{log.user?.name ?? "Unknown"}</strong> changed
                          status from{" "}
                          <strong>
                            {log.originalStatus?.replace(/_/g, " ") ?? "None"}
                          </strong>{" "}
                          to <strong>{log.newStatus.replace(/_/g, " ")}</strong>
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })()}
    </>
  );
}
