"use client";

import { useState, useCallback } from "react";
import { Search, X, Plus } from "lucide-react";

// ─── Preset keywords ──────────────────────────────────────────────────────────

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

export const FILTERABLE_FIELDS: { value: string; label: string }[] = [
  { value: "applicationLink", label: "Application Link" },
  { value: "closingDate", label: "Deadline" },
  { value: "openingDate", label: "Release Date" },
  { value: "agency", label: "Agency" },
  { value: "description", label: "Description" },
  { value: "category", label: "Category" },
  { value: "applicationType", label: "Application Type" },
  { value: "awardFloor", label: "Award Floor" },
  { value: "awardCeiling", label: "Award Ceiling" },
  { value: "totalFundingAmount", label: "Total Funding" },
  { value: "source", label: "Source" },
];

export type KeywordPickerProps = {
  onFilterChange: (
    included: string[],
    excluded: string[],
    requiredFields: string[],
  ) => void;
};

export default function KeywordPicker({ onFilterChange }: KeywordPickerProps) {
  const [includeSearch, setIncludeSearch] = useState("");
  const [excludeSearch, setExcludeSearch] = useState("");
  const [included, setIncluded] = useState<string[]>([]);
  const [excluded, setExcluded] = useState<string[]>([]);

  const [requiredFields, setRequiredFields] = useState<string[]>([]);
  const [selectedField, setSelectedField] = useState(
    FILTERABLE_FIELDS[0].value,
  );

  const emit = (inc: string[], exc: string[], rf: string[]) =>
    onFilterChange(inc, exc, rf);

  const addToInclude = useCallback(
    (keyword: string) => {
      if (included.includes(keyword)) return;
      const newExcluded = excluded.filter((k) => k !== keyword);
      const newIncluded = [...included, keyword];
      setIncluded(newIncluded);
      setExcluded(newExcluded);
      emit(newIncluded, newExcluded, requiredFields);
    },
    [included, excluded, requiredFields],
  );

  const addToExclude = useCallback(
    (keyword: string) => {
      if (excluded.includes(keyword)) return;
      const newIncluded = included.filter((k) => k !== keyword);
      const newExcluded = [...excluded, keyword];
      setIncluded(newIncluded);
      setExcluded(newExcluded);
      emit(newIncluded, newExcluded, requiredFields);
    },
    [included, excluded, requiredFields],
  );

  const removeFromInclude = useCallback(
    (keyword: string) => {
      const next = included.filter((k) => k !== keyword);
      setIncluded(next);
      emit(next, excluded, requiredFields);
    },
    [included, excluded, requiredFields],
  );

  const removeFromExclude = useCallback(
    (keyword: string) => {
      const next = excluded.filter((k) => k !== keyword);
      setExcluded(next);
      emit(included, next, requiredFields);
    },
    [included, excluded, requiredFields],
  );

  const addRequiredField = useCallback(() => {
    if (requiredFields.includes(selectedField)) return;
    const next = [...requiredFields, selectedField];
    setRequiredFields(next);
    emit(included, excluded, next);
  }, [requiredFields, selectedField, included, excluded]);

  const removeRequiredField = useCallback(
    (field: string) => {
      const next = requiredFields.filter((f) => f !== field);
      setRequiredFields(next);
      emit(included, excluded, next);
    },
    [requiredFields, included, excluded],
  );

  const clearAll = useCallback(() => {
    setIncluded([]);
    setExcluded([]);
    setIncludeSearch("");
    setExcludeSearch("");
    setRequiredFields([]);
    emit([], [], []);
  }, []);

  const availableForInclude = KEYWORDS.filter(
    (kw) =>
      !included.includes(kw) &&
      kw.toLowerCase().includes(includeSearch.toLowerCase()),
  );

  const availableForExclude = KEYWORDS.filter(
    (kw) =>
      !excluded.includes(kw) &&
      kw.toLowerCase().includes(excludeSearch.toLowerCase()),
  );

  const availableFields = FILTERABLE_FIELDS.filter(
    (f) => !requiredFields.includes(f.value),
  );

  const fieldLabel = (value: string) =>
    FILTERABLE_FIELDS.find((f) => f.value === value)?.label ?? value;

  const activeCount = included.length + excluded.length + requiredFields.length;

  return (
    <div className="w-[320px] flex-shrink-0">
      <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden flex flex-col">
        <div className="bg-[#B89A49] px-4 py-3 flex items-center justify-between">
          <h2 className="text-white font-semibold text-sm tracking-wide">
            Keyword Filter
          </h2>
          {activeCount > 0 && (
            <button
              onClick={clearAll}
              className="text-white/80 text-xs hover:text-white transition-colors underline"
            >
              Clear all ({activeCount})
            </button>
          )}
        </div>

        <div>
          <div className="px-4 pt-4 pb-1">
            <div className="rounded-lg border-2 border-[#B89A49]/50 bg-[#fdf8ee] overflow-hidden">
              <div className="px-3 pt-3 pb-2 flex items-center justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[#7a5c10]">
                  Required Fields
                </span>
                {requiredFields.length > 0 && (
                  <span className="text-[10px] text-[#7a5c10]/60 font-medium">
                    ALL must be present
                  </span>
                )}
              </div>

              <div className="px-3 pb-3 flex flex-col gap-2">
                {/* Active required fields */}
                {requiredFields.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-1">
                    {requiredFields.map((field) => (
                      <span
                        key={field}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium bg-[#B89A49]/15 text-[#7a5c10] border border-[#B89A49]/30 rounded-full group cursor-default"
                      >
                        {fieldLabel(field)}
                        <button
                          onClick={() => removeRequiredField(field)}
                          aria-label={`Remove ${fieldLabel(field)} requirement`}
                          className="opacity-50 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-2.5 h-2.5" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                {availableFields.length > 0 ? (
                  <div className="flex gap-2">
                    <select
                      value={selectedField}
                      onChange={(e) => {
                        setSelectedField(e.target.value);
                      }}
                      ref={(el) => {
                        if (
                          el &&
                          availableFields.length > 0 &&
                          !availableFields.find(
                            (f) => f.value === selectedField,
                          )
                        ) {
                          setSelectedField(availableFields[0].value);
                        }
                      }}
                      className="flex-1 border border-[#B89A49]/30 rounded-md px-2.5 py-1.5 text-xs bg-white text-gray-700 focus:outline-none focus:border-[#B89A49]"
                    >
                      {availableFields.map((f) => (
                        <option key={f.value} value={f.value}>
                          {f.label}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={addRequiredField}
                      className="flex-shrink-0 flex items-center justify-center w-8 h-8 bg-gray-800 text-white rounded-md hover:bg-black active:scale-95 transition-all shadow-sm"
                      aria-label="Add required field"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <p className="text-[11px] text-[#7a5c10]/50 italic">
                    All fields added
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="px-4 pt-3">
            <div className="rounded-lg border-2 border-green-400 bg-green-50/30 overflow-hidden">
              <div className="px-3 pt-3 pb-2">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-green-700">
                  Include
                </span>
              </div>

              <div className="px-3 pb-2">
                <div className="relative">
                  <Search
                    className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400"
                    aria-hidden="true"
                  />
                  <input
                    type="text"
                    placeholder="Search keywords..."
                    value={includeSearch}
                    onChange={(e) => setIncludeSearch(e.target.value)}
                    aria-label="Search include keywords"
                    className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-green-200 rounded-md outline-none focus:border-green-400 focus:ring-1 focus:ring-green-300/40 placeholder:text-gray-400 transition-all"
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
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium bg-green-200 text-green-900 rounded-full hover:bg-green-300 transition-all group cursor-default"
                      >
                        {kw}
                        <button
                          onClick={() => removeFromInclude(kw)}
                          aria-label={`Remove ${kw} from include`}
                          className="opacity-50 group-hover:opacity-100 transition-opacity"
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
                        aria-label={`Include ${kw}`}
                        className="px-2.5 py-1 text-[11px] font-medium rounded-full border bg-white border-gray-200 text-gray-600 hover:bg-green-100 hover:border-green-300 hover:text-green-800 active:scale-95 transition-all"
                      >
                        {kw}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="px-4 pt-3 pb-4">
            <div className="rounded-lg border-2 border-red-300 bg-red-50/30 overflow-hidden">
              <div className="px-3 pt-3 pb-2">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-red-700">
                  Exclude
                </span>
              </div>

              <div className="px-3 pb-2">
                <div className="relative">
                  <Search
                    className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400"
                    aria-hidden="true"
                  />
                  <input
                    type="text"
                    placeholder="Search keywords..."
                    value={excludeSearch}
                    onChange={(e) => setExcludeSearch(e.target.value)}
                    aria-label="Search exclude keywords"
                    className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-red-200 rounded-md outline-none focus:border-red-400 focus:ring-1 focus:ring-red-300/40 placeholder:text-gray-400 transition-all"
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
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium bg-red-200 text-red-900 rounded-full hover:bg-red-300 transition-all group cursor-default"
                      >
                        {kw}
                        <button
                          onClick={() => removeFromExclude(kw)}
                          aria-label={`Remove ${kw} from exclude`}
                          className="opacity-50 group-hover:opacity-100 transition-opacity"
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
                        aria-label={`Exclude ${kw}`}
                        className="px-2.5 py-1 text-[11px] font-medium rounded-full border bg-white border-gray-200 text-gray-600 hover:bg-red-100 hover:border-red-300 hover:text-red-800 active:scale-95 transition-all"
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
