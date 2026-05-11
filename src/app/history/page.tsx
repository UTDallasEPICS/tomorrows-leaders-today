"use client";

import React, { useEffect, useState, useCallback } from "react";
import Navbar from "../components/Navbar";
import SubmittedGrantsTable from "./components/SubmittedGrantsTable";
import Dashboard from "./components/Dashboard";
import { protect } from "@/library/auth";

export type StatusUpdate = {
  timestamp: string;
  userId: string;
  fromStatus: string;
  toStatus: string;
};

export type HistoryGrant = {
  id: number;
  grant: string;
  agency: string;
  release: string;
  deadline: string;
  fund: string;
  status: string;
  company: string;
  description: string;
  website?: string;
  statusUpdates: StatusUpdate[];
};

export default function HistoryPage() {
  const [grants, setGrants] = useState<HistoryGrant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/grants?history=true");
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      const data = await res.json();

      const mapped: HistoryGrant[] = data.map((g: any) => ({
        id: g.id,
        grant: g.title ?? "Untitled",
        agency: g.agency ?? "N/A",
        release: g.openingDate
          ? new Date(g.openingDate).toLocaleDateString()
          : "N/A",
        deadline: g.closingDate
          ? new Date(g.closingDate).toLocaleDateString()
          : "N/A",
        fund: g.opportunityNumber ?? "N/A",
        status: g.logs?.[0]?.newStatus ?? "NOT_APPLIED",
        company: g.agency ?? "N/A",
        description: g.title ?? "",
        website: g.applicationLink ?? undefined,
        statusUpdates: (g.logs ?? []).map((log: any) => ({
          timestamp: new Date(log.updatedAt).toLocaleString(),
          userId: log.user?.name ?? "Unknown",
          fromStatus: log.originalStatus ?? "None",
          toStatus: log.newStatus,
        })),
      }));

      setGrants(mapped);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load history.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleExportPDF = async () => {
    // Dynamic import to avoid SSR issues
    const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([
      import("jspdf"),
      import("jspdf-autotable"),
    ]);

    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text("Application History Report", 14, 20);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(
      `Generated on: ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}`,
      14,
      28,
    );

    autoTable(doc, {
      head: [["Grant Name", "Agency", "Deadline", "Funding", "Status"]],
      body: grants.map((g) => [
        g.grant,
        g.agency,
        g.deadline,
        g.fund,
        g.status.replace(/_/g, " "),
      ]),
      startY: 35,
      theme: "grid",
      headStyles: {
        fillColor: [184, 154, 73],
        textColor: [255, 255, 255],
        fontSize: 10,
        fontStyle: "bold",
      },
      bodyStyles: { fontSize: 9, cellPadding: 4 },
      alternateRowStyles: { fillColor: [245, 245, 245] },
    });

    const finalY = (doc as any).lastAutoTable.finalY ?? 35;
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Summary", 14, finalY + 15);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Total: ${grants.length}`, 14, finalY + 23);
    doc.text(
      `Accepted: ${grants.filter((g) => g.status === "APPROVED").length}`,
      14,
      finalY + 30,
    );
    doc.text(
      `Rejected: ${grants.filter((g) => g.status === "DECLINED").length}`,
      14,
      finalY + 37,
    );
    doc.text(
      `Pending: ${grants.filter((g) => g.status === "APPLIED").length}`,
      14,
      finalY + 44,
    );

    doc.save(
      `Application_History_${new Date().toISOString().split("T")[0]}.pdf`,
    );
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="p-6 bg-gray-100 min-h-screen flex items-center justify-center">
          <div className="text-center">
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
            <p className="text-sm text-gray-500">Loading history...</p>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Navbar />
        <div className="p-6 bg-gray-100 min-h-screen flex items-center justify-center">
          <div className="text-center">
            <p className="text-sm font-semibold text-red-600 mb-2">
              Failed to load history
            </p>
            <p className="text-xs text-gray-500 mb-4">{error}</p>
            <button
              onClick={load}
              className="px-4 py-2 text-sm bg-[#B89A49] text-white rounded hover:bg-[#a08640]"
            >
              Retry
            </button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="p-6 bg-gray-100 min-h-screen">
        <section className="mt-8">
          <Dashboard grants={grants} />
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-3xl font-bold">Application History</h1>
            <button
              onClick={handleExportPDF}
              className="flex items-center gap-2 px-4 py-2 bg-[#B89A49] hover:bg-[#A08940] text-white font-medium rounded-lg transition-colors"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              Export PDF
            </button>
          </div>
          <SubmittedGrantsTable grants={grants} />
        </section>
      </div>
    </>
  );
}
