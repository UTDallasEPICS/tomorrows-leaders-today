"use client";

import { useState } from "react";
import { SearchBar } from "../SearchBar";
import GrantsTable from "./GrantsTable";
import KeywordPicker from "./KeywordPicker";

export default function GrantsView() {
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [includedKeywords, setIncludedKeywords] = useState<string[]>([]);
  const [excludedKeywords, setExcludedKeywords] = useState<string[]>([]);

  function handleFilterChange(included: string[], excluded: string[]) {
    setIncludedKeywords(included);
    setExcludedKeywords(excluded);
  }

  return (
    <>
      <SearchBar onSearch={setSearchTerm} />
      <div className="flex gap-6">
        <KeywordPicker onFilterChange={handleFilterChange} />
        <div className="flex-1 min-w-0">
          <GrantsTable
            searchTerm={searchTerm}
            includedKeywords={includedKeywords}
            excludedKeywords={excludedKeywords}
          />
        </div>
      </div>
    </>
  );
}