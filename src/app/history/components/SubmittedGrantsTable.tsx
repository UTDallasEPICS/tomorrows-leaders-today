"use client";

import { useState, useMemo } from "react";
import { ChevronDown, ChevronUp, X, ExternalLink, History } from "lucide-react";
import { HistoryGrant } from "../page";

type SortField =
  | "grant"
  | "agency"
  | "release"
  | "deadline"
  | "fund"
  | "status";

interface SubmittedGrantsTableProps {
  grants: HistoryGrant[];
}

const STATUS_STYLES: Record<string, { background: string; color: string }> = {
  APPROVED: { background: "#1a3a1a", color: "#7ec87e" },
  APPLIED: { background: "#2a2000", color: "#e8b820" },
  IN_PROGRESS: { background: "#2a2000", color: "#e8b820" },
  LOI: { background: "#1a2a3a", color: "#7eaec8" },
  DECLINED: { background: "#3a1a1a", color: "#c87e7e" },
  NOT_QUALIFIED: { background: "#3a1a1a", color: "#c87e7e" },
  NOT_APPLIED: { background: "#2a2a2a", color: "#aaaaaa" },
  WAITING_FOR_FEEDBACK: { background: "#1a1a3a", color: "#9e9edc" },
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

export default function SubmittedGrantsTable({
  grants,
}: SubmittedGrantsTableProps) {
  const [activeSort, setActiveSort] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [showLogsFor, setShowLogsFor] = useState<number | null>(null);

  const handleSort = (field: SortField) => {
    if (activeSort === field) {
      if (sortDirection === "asc") {
        setSortDirection("desc");
      } else {
        setActiveSort(null);
        setSortDirection("asc");
      }
    } else {
      setActiveSort(field);
      setSortDirection("asc");
    }
  };

  const sorted = useMemo(() => {
    if (!activeSort) return grants;
    return [...grants].sort((a, b) => {
      let cmp = 0;
      if (activeSort === "release" || activeSort === "deadline") {
        cmp =
          new Date(a[activeSort]).getTime() - new Date(b[activeSort]).getTime();
      } else if (activeSort === "fund") {
        cmp =
          parseFloat(a.fund.replace(/[$,]/g, "")) -
          parseFloat(b.fund.replace(/[$,]/g, ""));
      } else {
        cmp = String(a[activeSort]).localeCompare(String(b[activeSort]));
      }
      return sortDirection === "asc" ? cmp : -cmp;
    });
  }, [grants, activeSort, sortDirection]);

  const categories: { key: SortField; label: string }[] = [
    { key: "grant", label: "Grant" },
    { key: "agency", label: "Agency" },
    { key: "release", label: "Release" },
    { key: "deadline", label: "Deadline" },
    { key: "fund", label: "Fund" },
    { key: "status", label: "Status" },
  ];

  const modalGrant =
    showLogsFor !== null ? grants.find((g) => g.id === showLogsFor) : null;

  if (grants.length === 0) {
    return (
      <div className="bg-[#E8DCC8] rounded-lg p-12 text-center text-gray-500 text-sm">
        No application history found.
      </div>
    );
  }

  return (
    <>
      <div className="bg-[#E8DCC8] rounded-lg shadow overflow-hidden">
        {/* Desktop header */}
        <div className="hidden md:grid grid-cols-6 bg-[#B89A49] text-white">
          {categories.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => handleSort(key)}
              className="p-3 text-left flex items-center justify-between hover:bg-black/10 transition-colors"
            >
              <span
                className={`text-sm ${activeSort === key ? "font-bold" : "font-medium"}`}
              >
                {label}
              </span>
              {activeSort === key ? (
                sortDirection === "asc" ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )
              ) : (
                <ChevronDown className="w-4 h-4 opacity-40" />
              )}
            </button>
          ))}
        </div>

        <div className="divide-y divide-gray-300">
          {sorted.map((grant) => {
            const isExpanded = expandedId === grant.id;
            return (
              <div key={grant.id}>
                {/* Desktop row */}
                <div
                  className={`hidden md:grid grid-cols-6 cursor-pointer transition-colors ${isExpanded ? "bg-[#E8DCC8]" : "bg-white hover:bg-gray-50"}`}
                  onClick={() => setExpandedId(isExpanded ? null : grant.id)}
                >
                  <div className="p-3 text-sm truncate" title={grant.grant}>
                    {grant.grant}
                  </div>
                  <div className="p-3 text-sm truncate" title={grant.agency}>
                    {grant.agency}
                  </div>
                  <div className="p-3 text-sm">{grant.release}</div>
                  <div className="p-3 text-sm">{grant.deadline}</div>
                  <div className="p-3 text-sm">{grant.fund}</div>
                  <div className="p-3 text-sm">
                    <StatusBadge status={grant.status} />
                  </div>
                </div>

                {/* Mobile card */}
                <div
                  className={`md:hidden cursor-pointer transition-colors ${isExpanded ? "bg-[#E8DCC8]" : "bg-white"}`}
                  onClick={() => setExpandedId(isExpanded ? null : grant.id)}
                >
                  <div className="p-4 flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">
                        {grant.grant}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {grant.agency}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        Due: {grant.deadline} · {grant.fund}
                      </p>
                    </div>
                    <div className="flex-shrink-0">
                      <StatusBadge status={grant.status} />
                    </div>
                  </div>
                </div>

                {/* Expanded panel */}
                {isExpanded && (
                  <div className="bg-[#E8DCC8] px-4 md:px-6 py-4 border-t border-[#d4c5a0]">
                    {grant.description && (
                      <p className="text-sm text-gray-700 mb-3">
                        {grant.description}
                      </p>
                    )}
                    <div className="flex items-center gap-3 flex-wrap">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowLogsFor(grant.id);
                        }}
                        className="flex items-center gap-2 px-3 py-2 text-sm bg-white border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors"
                      >
                        <History className="w-4 h-4" />
                        Status History
                      </button>
                      {grant.website ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            window.open(
                              grant.website,
                              "_blank",
                              "noopener,noreferrer",
                            );
                          }}
                          className="flex items-center gap-2 px-3 py-2 text-sm bg-[#B89A49] text-white rounded hover:bg-[#a08640] transition-colors"
                        >
                          <ExternalLink className="w-4 h-4" />
                          Website
                        </button>
                      ) : (
                        <span className="text-sm text-gray-400 italic">
                          No website
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Status history modal */}
      {modalGrant && (
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
                <p style={{ margin: "4px 0 0", fontSize: 12, color: "#888" }}>
                  {modalGrant.grant}
                </p>
              </div>
              <button
                onClick={() => setShowLogsFor(null)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "#888",
                }}
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {modalGrant.statusUpdates.length === 0 ? (
              <p style={{ color: "#888", fontSize: 14 }}>
                No status updates yet.
              </p>
            ) : (
              <div
                style={{ display: "flex", flexDirection: "column", gap: 12 }}
              >
                {modalGrant.statusUpdates.map((update, i) => (
                  <div
                    key={i}
                    style={{ borderLeft: "2px solid #B89A49", paddingLeft: 12 }}
                  >
                    <p style={{ margin: 0, fontSize: 12, color: "#888" }}>
                      {update.timestamp}
                    </p>
                    <p
                      style={{ margin: "4px 0 0", fontSize: 14, color: "#333" }}
                    >
                      <strong>{update.userId}</strong> changed status from{" "}
                      <strong>{update.fromStatus.replace(/_/g, " ")}</strong> to{" "}
                      <strong>{update.toStatus.replace(/_/g, " ")}</strong>
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
