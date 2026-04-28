"use client";

import { useEffect, useState } from "react";
import { ChevronDown, ChevronUp, Info, X } from "lucide-react";
import Pagination from "@mui/material/Pagination";
import Stack from "@mui/material/Stack";

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

const PAGE_SIZE = 25;

type GrantsTableProps = {
  searchTerm?: string;
  includedKeywords?: string[];
  excludedKeywords?: string[];
};

export default function GrantsTable({
  searchTerm = "",
  includedKeywords = [],
  excludedKeywords = [],
}: GrantsTableProps) {
  const [grants, setGrants] = useState<GrantRow[]>([]);
  const [activeSort, setActiveSort] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [showInfoModal, setShowInfoModal] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  // Fetch grants from database
  useEffect(() => {
    async function load() {
      const res = await fetch("/api/grants");
      const data = await res.json();

      const mapped: GrantRow[] = data.map((g: any) => ({
        id: g.id,
        title: g.title,
        agency: g.agency ?? "N/A",
        release: g.openingDate
          ? new Date(g.openingDate).toLocaleDateString()
          : "N/A",
        deadline: g.closingDate
          ? new Date(g.closingDate).toLocaleDateString()
          : "N/A",
        fund: g.opportunityNumber ?? "N/A",
        status: g.logs?.[0]?.newStatus ?? "Not Applied",
        applicationLink: g.applicationLink ?? null,
        logs: g.logs ?? [],
      }));

      setGrants(mapped);
    }

    load();
  }, []);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
    setExpandedIndex(null);
  }, [searchTerm, activeSort, sortDirection, includedKeywords, excludedKeywords]);

  const categories = [
    { key: "title", label: "Grant" },
    { key: "agency", label: "Agency" },
    { key: "release", label: "Release" },
    { key: "deadline", label: "Deadline" },
    { key: "fund", label: "Opportunity #" },
    { key: "status", label: "Status" },
  ] as { key: SortField; label: string }[];

  // ─── FILTERING PIPELINE ──────────────────────────────────
  // 1. Search bar filter
  let filtered = searchTerm
    ? grants.filter((g) => {
        const term = searchTerm.toLowerCase();
        return (
          g.title.toLowerCase().includes(term) ||
          g.agency.toLowerCase().includes(term)
        );
      })
    : grants;

  // 2. Include filter — keep only grants matching at least one included keyword
  if (includedKeywords.length > 0) {
    filtered = filtered.filter((g) => {
      const text = `${g.title} ${g.agency}`.toLowerCase();
      return includedKeywords.some((kw) => text.includes(kw.toLowerCase()));
    });
  }

  // 3. Exclude filter — remove grants matching any excluded keyword
  if (excludedKeywords.length > 0) {
    filtered = filtered.filter((g) => {
      const text = `${g.title} ${g.agency}`.toLowerCase();
      return !excludedKeywords.some((kw) => text.includes(kw.toLowerCase()));
    });
  }

  // ─── SORTING ─────────────────────────────────────────────
  const sortedGrants = [...filtered].sort((a, b) => {
    if (!activeSort) return 0;

    let valA: string = String(a[activeSort] ?? "");
    let valB: string = String(b[activeSort] ?? "");

    if (activeSort === "release" || activeSort === "deadline") {
      const numA = valA === "N/A" ? 0 : new Date(valA).getTime();
      const numB = valB === "N/A" ? 0 : new Date(valB).getTime();
      return sortDirection === "asc" ? numA - numB : numB - numA;
    }

    if (activeSort === "fund") {
      const numA = valA === "N/A" ? 0 : Number(valA.replace(/[$,]/g, ""));
      const numB = valB === "N/A" ? 0 : Number(valB.replace(/[$,]/g, ""));
      return sortDirection === "asc" ? numA - numB : numB - numA;
    }

    const cmp = valA.localeCompare(valB);
    return sortDirection === "asc" ? cmp : -cmp;
  });

  // ─── PAGINATION ──────────────────────────────────────────
  const totalPages = Math.ceil(sortedGrants.length / PAGE_SIZE);
  const paginatedGrants = sortedGrants.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  const handlePageChange = (_event: React.ChangeEvent<unknown>, page: number) => {
    setCurrentPage(page);
    setExpandedIndex(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="bg-[#E8DCC8] rounded-lg shadow overflow-hidden">
      <div className="grid grid-cols-6 bg-[#B89A49] text-white">
        {categories.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => {
              if (activeSort === key) {
                setSortDirection(sortDirection === "asc" ? "desc" : "asc");
              } else {
                setActiveSort(key);
                setSortDirection("asc");
              }
            }}
            className="p-3 text-left flex items-center justify-between hover:bg-opacity-80"
          >
            <span className={activeSort === key ? "font-bold" : ""}>
              {label}
            </span>
            {activeSort === key ? (
              sortDirection === "asc" ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronUp className="w-4 h-4" />
              )
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>
        ))}
      </div>

      <div className="divide-y divide-gray-300">
        {paginatedGrants.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            No grants match the current filters.
          </div>
        )}

        {paginatedGrants.map((grant, index) => {
          const isExpanded = expandedIndex === index;

          return (
            <div key={grant.id}>
              <div
                className={`grid grid-cols-6 cursor-pointer ${
                  isExpanded
                    ? "bg-[#E8DCC8] border-b border-gray-300 shadow-sm relative z-10"
                    : "bg-white hover:bg-gray-50"
                }`}
                onClick={() => setExpandedIndex(isExpanded ? null : index)}
              >
                <div className="p-3">{grant.title}</div>
                <div className="p-3">{grant.agency}</div>
                <div className="p-3">{grant.release}</div>
                <div className="p-3">{grant.deadline}</div>
                <div className="p-3">{grant.fund}</div>
                <div className="p-3">{grant.status}</div>
              </div>

              {isExpanded && (
                <div className="bg-[#E8DCC8] p-6 relative shadow-inner">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowInfoModal(index);
                    }}
                    className="absolute top-4 right-4 hover:text-gray-800 transition-colors"
                  >
                    <Info className="w-5 h-5 text-gray-600" />
                  </button>

                  <div className="flex gap-4">
                    <button
                      className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowInfoModal(index);
                      }}
                    >
                      More Information
                    </button>

                    <button
                      className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (grant.applicationLink)
                          window.open(grant.applicationLink, "_blank");
                      }}
                    >
                      Website
                    </button>
                  </div>
                </div>
              )}

              {showInfoModal === index && (
                <div
                  className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
                  onClick={() => setShowInfoModal(null)}
                >
                  <div
                    className="bg-white rounded-lg p-6 max-w-md w-full m-4"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-semibold">
                        Status Update History
                      </h3>
                      <button
                        onClick={() => setShowInfoModal(null)}
                        className="text-gray-500 hover:text-gray-700"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    <div className="space-y-4">
                      {grant.logs.length === 0 && (
                        <p className="text-gray-500">
                          No status updates yet.
                        </p>
                      )}

                      {grant.logs.map((log, i) => (
                        <div key={i} className="border-l-2 border-gray-200 pl-4">
                          <p className="text-sm text-gray-500">
                            {new Date(log.updatedAt).toLocaleString()}
                          </p>
                          <p className="text-gray-700">
                            {log.user.name} changed status from{" "}
                            <span className="font-medium">
                              {log.originalStatus ?? "None"}
                            </span>{" "}
                            to{" "}
                            <span className="font-medium">{log.newStatus}</span>
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 bg-white border-t border-gray-300">
          <span className="text-sm text-gray-600">
            Showing {(currentPage - 1) * PAGE_SIZE + 1}–
            {Math.min(currentPage * PAGE_SIZE, sortedGrants.length)} of{" "}
            {sortedGrants.length} grants
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
                  fontSize: "1.1rem",
                  minWidth: "48px",
                  height: "48px",
                  margin: "0 6px",
                  "&.Mui-selected": {
                    backgroundColor: "#B89A49",
                    color: "white",
                    "&:hover": {
                      backgroundColor: "#a08640",
                    },
                  },
                },
              }}
            />
          </Stack>
        </div>
      )}
    </div>
  );
}