"use client";

import { useState } from "react";
import { Search, X } from "lucide-react";

const KEYWORDS = [
  "Youth",
  "Children",
  "Early Childhood",
  "Education",
  "Foster Youth",
  "Underserved Youth",
  "Summer Program",
  "Teen Development",
  "Veterans",
  "Military",
  "Disabled Veterans",
  "Elderly",
  "Housing",
  "Leadership Training",
  "Professional Development",
  "Civic Leadership",
  "Community Engagement",
  "Nonprofit",
  "Women",
  "Social Workers",
  "Workforce Development",
  "STEM",
  "Small Business",
  "Mental Health",
  "Poverty",
];

type KeywordPickerProps = {
  onFilterChange: (included: string[], excluded: string[]) => void;
};

export default function KeywordPicker({ onFilterChange }: KeywordPickerProps) {
  const [includeSearch, setIncludeSearch] = useState("");
  const [excludeSearch, setExcludeSearch] = useState("");
  const [included, setIncluded] = useState<string[]>([]);
  const [excluded, setExcluded] = useState<string[]>([]);

  function addToInclude(keyword: string) {
    const newExcluded = excluded.filter((k) => k !== keyword);
    const newIncluded = [...included, keyword];
    setIncluded(newIncluded);
    setExcluded(newExcluded);
    onFilterChange(newIncluded, newExcluded);
  }

  function addToExclude(keyword: string) {
    const newIncluded = included.filter((k) => k !== keyword);
    const newExcluded = [...excluded, keyword];
    setIncluded(newIncluded);
    setExcluded(newExcluded);
    onFilterChange(newIncluded, newExcluded);
  }

  function removeFromInclude(keyword: string) {
    const newIncluded = included.filter((k) => k !== keyword);
    setIncluded(newIncluded);
    onFilterChange(newIncluded, excluded);
  }

  function removeFromExclude(keyword: string) {
    const newExcluded = excluded.filter((k) => k !== keyword);
    setExcluded(newExcluded);
    onFilterChange(included, newExcluded);
  }

  function clearAll() {
    setIncluded([]);
    setExcluded([]);
    setIncludeSearch("");
    setExcludeSearch("");
    onFilterChange([], []);
  }

  const availableForInclude = KEYWORDS.filter(
    (kw) =>
      !included.includes(kw) &&
      kw.toLowerCase().includes(includeSearch.toLowerCase())
  );

  const availableForExclude = KEYWORDS.filter(
    (kw) =>
      !excluded.includes(kw) &&
      kw.toLowerCase().includes(excludeSearch.toLowerCase())
  );

  const activeCount = included.length + excluded.length;

  return (
    <div className="w-[320px] flex-shrink-0">
      <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-[#B89A49] px-4 py-3 flex items-center justify-between">
          <h2 className="text-white font-semibold text-sm tracking-wide">
            Keyword Picker
          </h2>
          {activeCount > 0 && (
            <button
              onClick={clearAll}
              className="text-white/80 text-xs hover:text-white transition-colors underline"
            >
              Clear all
            </button>
          )}
        </div>

        <div>
          {/* ═══ INCLUDE CARD ═══ */}
          <div className="px-4 pt-4">
            <div className="rounded-lg border-2 border-green-400 bg-green-50/30 overflow-hidden">
              <div className="px-3 pt-3 pb-2">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-green-700">
                  Include
                </span>
              </div>

              <div className="px-3 pb-2">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search keywords..."
                    value={includeSearch}
                    onChange={(e) => setIncludeSearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-green-200 rounded-md
                               outline-none focus:border-green-400 focus:ring-1 focus:ring-green-300/40
                               placeholder:text-gray-400 transition-all"
                  />
                </div>
              </div>

              {included.length > 0 && (
                <div className="px-3 pb-2">
                  <p className="text-[10px] uppercase tracking-wider text-green-600 font-semibold mb-1.5">
                    Selected
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {included.map((kw) => (
                      <span
                        key={kw}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium
                                   bg-green-200 text-green-900 rounded-full
                                   hover:bg-green-300 transition-all group cursor-default"
                      >
                        {kw}
                        <button
                          onClick={() => removeFromInclude(kw)}
                          className="opacity-50 group-hover:opacity-100"
                        >
                          <X className="w-2.5 h-2.5" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="px-3 pb-3">
                <p className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold mb-1.5">
                  Available
                </p>
                {availableForInclude.length === 0 ? (
                  <p className="text-[11px] text-gray-400 italic py-1">
                    {includeSearch ? "No matches" : "All keywords selected"}
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {availableForInclude.map((kw) => (
                      <button
                        key={kw}
                        onClick={() => addToInclude(kw)}
                        className="px-2.5 py-1 text-[11px] font-medium rounded-full border
                                   bg-white border-gray-200 text-gray-600
                                   hover:bg-green-100 hover:border-green-300 hover:text-green-800
                                   active:scale-95 transition-all"
                      >
                        {kw}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ═══ EXCLUDE CARD ═══ */}
          <div className="px-4 pt-3 pb-4">
            <div className="rounded-lg border-2 border-red-300 bg-red-50/30 overflow-hidden">
              <div className="px-3 pt-3 pb-2">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-red-700">
                  Exclude
                </span>
              </div>

              <div className="px-3 pb-2">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search keywords..."
                    value={excludeSearch}
                    onChange={(e) => setExcludeSearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-red-200 rounded-md
                               outline-none focus:border-red-400 focus:ring-1 focus:ring-red-300/40
                               placeholder:text-gray-400 transition-all"
                  />
                </div>
              </div>

              {excluded.length > 0 && (
                <div className="px-3 pb-2">
                  <p className="text-[10px] uppercase tracking-wider text-red-600 font-semibold mb-1.5">
                    Selected
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {excluded.map((kw) => (
                      <span
                        key={kw}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium
                                   bg-red-200 text-red-900 rounded-full
                                   hover:bg-red-300 transition-all group cursor-default"
                      >
                        {kw}
                        <button
                          onClick={() => removeFromExclude(kw)}
                          className="opacity-50 group-hover:opacity-100"
                        >
                          <X className="w-2.5 h-2.5" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="px-3 pb-3">
                <p className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold mb-1.5">
                  Available
                </p>
                {availableForExclude.length === 0 ? (
                  <p className="text-[11px] text-gray-400 italic py-1">
                    {excludeSearch ? "No matches" : "All keywords selected"}
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {availableForExclude.map((kw) => (
                      <button
                        key={kw}
                        onClick={() => addToExclude(kw)}
                        className="px-2.5 py-1 text-[11px] font-medium rounded-full border
                                   bg-white border-gray-200 text-gray-600
                                   hover:bg-red-100 hover:border-red-300 hover:text-red-800
                                   active:scale-95 transition-all"
                      >
                        {kw}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}