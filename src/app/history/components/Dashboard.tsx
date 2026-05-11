"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import * as echarts from "echarts";
import { HistoryGrant } from "../page";

interface DashboardProps {
  grants: HistoryGrant[];
}

export default function Dashboard({ grants }: DashboardProps) {
  const applicationChartRef = useRef<HTMLDivElement>(null);
  const outcomeChartRef = useRef<HTMLDivElement>(null);
  const appChartInstance = useRef<echarts.ECharts | null>(null);
  const outcomeChartInstance = useRef<echarts.ECharts | null>(null);

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const dateError = useMemo(() => {
    if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
      return "Start date cannot be after end date";
    }
    return "";
  }, [startDate, endDate]);

  const filteredGrants = useMemo(() => {
    if (dateError) return grants;
    return grants.filter((g) => {
      const d = new Date(g.deadline);
      if (startDate && d < new Date(startDate)) return false;
      if (endDate && d > new Date(endDate)) return false;
      return true;
    });
  }, [grants, startDate, endDate, dateError]);

  // Counts — aligned to DB enum values
  const counts = useMemo(() => {
    const approved = filteredGrants.filter(
      (g) => g.status === "APPROVED",
    ).length;
    const declined = filteredGrants.filter(
      (g) => g.status === "DECLINED",
    ).length;
    const applied = filteredGrants.filter((g) => g.status === "APPLIED").length;
    const inProgress = filteredGrants.filter(
      (g) => g.status === "IN_PROGRESS",
    ).length;
    const total = filteredGrants.length;

    return { approved, declined, applied, inProgress, total };
  }, [filteredGrants]);

  const pct = (n: number) =>
    counts.total > 0 ? Math.round((n / counts.total) * 100) : 0;

  const lastUpdated = useMemo(
    () =>
      new Date()
        .toLocaleString("en-US", {
          month: "2-digit",
          day: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        })
        .replace(",", " at"),
    [],
  );

  // Init charts
  useEffect(() => {
    if (applicationChartRef.current) {
      appChartInstance.current = echarts.init(applicationChartRef.current);
    }
    if (outcomeChartRef.current) {
      outcomeChartInstance.current = echarts.init(outcomeChartRef.current);
    }

    const handleResize = () => {
      appChartInstance.current?.resize();
      outcomeChartInstance.current?.resize();
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      appChartInstance.current?.dispose();
      outcomeChartInstance.current?.dispose();
    };
  }, []);

  // Update application chart
  useEffect(() => {
    if (!appChartInstance.current) return;
    appChartInstance.current.setOption({
      tooltip: { trigger: "item", formatter: "{b}: {c} ({d}%)", confine: true },
      graphic: [
        {
          type: "text",
          left: "center",
          top: "38%",
          style: {
            text: `${pct(counts.applied + counts.inProgress)}% In Progress`,
            fontSize: 12,
            fontWeight: "bold",
            fill: "#1a1200",
          },
        },
        {
          type: "text",
          left: "center",
          top: "50%",
          style: {
            text: `${pct(counts.approved + counts.declined)}% Completed`,
            fontSize: 11,
            fill: "#666",
          },
        },
      ],
      series: [
        {
          type: "pie",
          radius: ["60%", "80%"],
          avoidLabelOverlap: false,
          label: { show: false },
          labelLine: { show: false },
          data: [
            { value: counts.applied + counts.inProgress, name: "IN PROGRESS" },
            { value: counts.approved + counts.declined, name: "COMPLETED" },
          ],
          color: ["#B89A49", "#E8DCC8"],
        },
      ],
    });
  }, [counts]);

  // Update outcome chart
  useEffect(() => {
    if (!outcomeChartInstance.current) return;
    outcomeChartInstance.current.setOption({
      tooltip: { trigger: "item", formatter: "{b}: {c} ({d}%)", confine: true },
      graphic: [
        {
          type: "text",
          left: "center",
          top: "38%",
          style: {
            text: `${pct(counts.approved)}% Approved`,
            fontSize: 12,
            fontWeight: "bold",
            fill: "#1a1200",
          },
        },
        {
          type: "text",
          left: "center",
          top: "50%",
          style: {
            text: `${pct(counts.declined)}% Declined`,
            fontSize: 11,
            fill: "#666",
          },
        },
        {
          type: "text",
          left: "center",
          top: "60%",
          style: {
            text: `${pct(counts.applied)}% Pending`,
            fontSize: 11,
            fill: "#666",
          },
        },
      ],
      series: [
        {
          type: "pie",
          radius: ["60%", "80%"],
          avoidLabelOverlap: false,
          label: { show: false },
          labelLine: { show: false },
          data: [
            { value: counts.approved, name: "APPROVED" },
            { value: counts.declined, name: "DECLINED" },
            { value: counts.applied, name: "PENDING" },
          ],
          color: ["#B89A49", "#D4C18F", "#E8DCC8"],
        },
      ],
    });
  }, [counts]);

  return (
    <div className="bg-[#F0EAD9] rounded-lg p-6 mb-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Dashboard</h2>
        <span className="text-xs text-gray-600">
          Last Updated: {lastUpdated}
        </span>
      </div>

      {/* Date filter */}
      <div className="mb-6">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">Start:</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              max={endDate || undefined}
              className={`px-3 py-1 text-sm border rounded ${dateError ? "border-red-500 bg-red-50" : "border-gray-300"}`}
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">End:</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              min={startDate || undefined}
              className={`px-3 py-1 text-sm border rounded ${dateError ? "border-red-500 bg-red-50" : "border-gray-300"}`}
            />
          </div>
          {(startDate || endDate) && (
            <button
              onClick={() => {
                setStartDate("");
                setEndDate("");
              }}
              className="px-3 py-1 text-sm bg-gray-200 hover:bg-gray-300 rounded"
            >
              Clear
            </button>
          )}
        </div>
        {dateError && (
          <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
            <svg
              className="w-4 h-4 flex-shrink-0"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            {dateError}
          </p>
        )}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="flex items-center gap-4">
          <div
            ref={applicationChartRef}
            style={{ width: 200, height: 200, flexShrink: 0 }}
          />
          <div>
            <h3 className="text-lg font-bold mb-3 underline">
              Application Count
            </h3>
            <div className="space-y-1">
              {[
                {
                  label: "IN PROGRESS",
                  value: counts.inProgress + counts.applied,
                },
                {
                  label: "COMPLETED",
                  value: counts.approved + counts.declined,
                },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-center gap-3">
                  <span className="text-[#B89A49] text-2xl font-bold w-12 text-right">
                    {value}
                  </span>
                  <span className="text-sm font-medium">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div
            ref={outcomeChartRef}
            style={{ width: 200, height: 200, flexShrink: 0 }}
          />
          <div>
            <h3 className="text-lg font-bold mb-3 underline">Outcome</h3>
            <div className="space-y-1">
              {[
                { label: "APPROVED", value: counts.approved },
                { label: "DECLINED", value: counts.declined },
                { label: "PENDING", value: counts.applied },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-center gap-3">
                  <span className="text-[#B89A49] text-2xl font-bold w-12 text-right">
                    {value}
                  </span>
                  <span className="text-sm font-medium">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
