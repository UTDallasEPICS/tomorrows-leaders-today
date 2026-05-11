"use client";

import { useState } from "react";
import { SearchBar } from "../SearchBar";
import GrantsTable from "./GrantsTable";
import KeywordPicker from "./KeywordPicker";
import { SlidersHorizontal, X } from "lucide-react";

export default function GrantsView() {
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [includedKeywords, setIncludedKeywords] = useState<string[]>([]);
  const [excludedKeywords, setExcludedKeywords] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  function handleFilterChange(included: string[], excluded: string[]) {
    setIncludedKeywords(included);
    setExcludedKeywords(excluded);
  }

  const activeFilterCount = includedKeywords.length + excludedKeywords.length;

  return (
    <div className="flex flex-col gap-4">
      {/* Search row */}
      <div className="flex items-center gap-2">
        <SearchBar onSearch={setSearchTerm} />
        {/* Filter toggle — mobile only */}
        <button
          onClick={() => setShowFilters((s) => !s)}
          className="md:hidden flex-shrink-0 flex items-center justify-center gap-1.5 h-[42px] px-3 bg-[#B89A49] text-white text-sm font-medium rounded-md"
          aria-label="Toggle keyword filters"
        >
          {showFilters ? (
            <X className="w-4 h-4" />
          ) : (
            <SlidersHorizontal className="w-4 h-4" />
          )}
          {!showFilters && activeFilterCount > 0 && (
            <span className="bg-white text-[#B89A49] text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      {/* Mobile keyword picker */}
      {showFilters && (
        <div className="md:hidden">
          <KeywordPicker onFilterChange={handleFilterChange} />
        </div>
      )}

      {/* Main content */}
      <div className="flex gap-6 items-start">
        <div className="hidden md:block">
          <KeywordPicker onFilterChange={handleFilterChange} />
        </div>
        <div className="flex-1 min-w-0">
          <GrantsTable
            searchTerm={searchTerm}
            includedKeywords={includedKeywords}
            excludedKeywords={excludedKeywords}
          />
        </div>
      </div>
    </div>
  );
}
