"use client";

import { useState } from "react";
import { SearchBar } from "../SearchBar";
import GrantsTable from "./GrantsTable";
import KeywordPicker from "./KeywordPicker";
import DateRangePicker, { type DateRange } from "./DateRangePicker";
import { SlidersHorizontal, X } from "lucide-react";

export default function GrantsView() {
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [includedKeywords, setIncludedKeywords] = useState<string[]>([]);
  const [excludedKeywords, setExcludedKeywords] = useState<string[]>([]);
  const [requiredFields, setRequiredFields] = useState<string[]>([]);
  const [openingRange, setOpeningRange] = useState<DateRange>({
    from: null,
    to: null,
  });
  const [closingRange, setClosingRange] = useState<DateRange>({
    from: null,
    to: null,
  });
  const [showFilters, setShowFilters] = useState(false);

  function handleFilterChange(
    included: string[],
    excluded: string[],
    rf: string[],
  ) {
    setIncludedKeywords(included);
    setExcludedKeywords(excluded);
    setRequiredFields(rf);
  }

  const activeFilterCount =
    includedKeywords.length +
    excludedKeywords.length +
    requiredFields.length +
    (openingRange.from || openingRange.to ? 1 : 0) +
    (closingRange.from || closingRange.to ? 1 : 0);

  const datePickers = (
    <div className="w-full md:w-[320px] flex-shrink-0 bg-white rounded-lg shadow-md border border-gray-200 overflow-visible">
      <div className="bg-[#B89A49] px-4 py-3 rounded-t-lg">
        <h2 className="text-white font-semibold text-sm tracking-wide">
          Date Filters
        </h2>
      </div>
      <div className="flex flex-col gap-3 px-4 pt-3 pb-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1.5">
            Release Date
          </p>
          <DateRangePicker value={openingRange} onChange={setOpeningRange} />
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1.5">
            Deadline
          </p>
          <DateRangePicker value={closingRange} onChange={setClosingRange} />
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <SearchBar onSearch={setSearchTerm} />
        {/* Mobile filter toggle */}
        <button
          onClick={() => setShowFilters((s) => !s)}
          className="md:hidden flex-shrink-0 flex items-center justify-center gap-1.5 h-[42px] px-3 bg-[#B89A49] text-white text-sm font-medium rounded-md"
          aria-label="Toggle filters"
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

      {showFilters && (
        <div className="md:hidden flex flex-col gap-4">
          {datePickers}
          <KeywordPicker onFilterChange={handleFilterChange} />
        </div>
      )}

      {/* Desktop layout */}
      <div className="flex gap-6 items-start">
        <div className="hidden md:flex flex-col gap-4">
          {datePickers}
          <KeywordPicker onFilterChange={handleFilterChange} />
        </div>

        <div className="flex-1 min-w-0">
          <GrantsTable
            searchTerm={searchTerm}
            includedKeywords={includedKeywords}
            excludedKeywords={excludedKeywords}
            requiredFields={requiredFields}
            openingRange={openingRange}
            closingRange={closingRange}
          />
        </div>
      </div>
    </div>
  );
}
