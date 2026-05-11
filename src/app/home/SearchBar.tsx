"use client";

import { useState } from "react";
import { Search } from "lucide-react";

export function SearchBar({
  onSearch = () => {},
}: {
  onSearch?: (term: string) => void;
}) {
  const [value, setValue] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.value);
    onSearch(e.target.value);
  };

  const handleClear = () => {
    setValue("");
    onSearch("");
  };

  return (
    <div className="flex items-center gap-3 w-full">
      <div className="flex-1 flex items-center gap-2 bg-white border border-gray-300 rounded-md px-4 py-2.5 shadow-sm focus-within:ring-2 focus-within:ring-[#B89A49] focus-within:border-[#B89A49] transition-all">
        <Search
          className="w-4 h-4 text-gray-400 flex-shrink-0"
          aria-hidden="true"
        />
        <input
          type="text"
          placeholder="Search grants by title or agency..."
          value={value}
          onChange={handleChange}
          className="flex-1 bg-transparent outline-none border-none text-sm text-gray-800 placeholder:text-gray-400"
          aria-label="Search grants"
        />
        {value && (
          <button
            onClick={handleClear}
            className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
            aria-label="Clear search"
          >
            <svg
              className="w-4 h-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
