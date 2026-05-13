"use client";

import { useState, useEffect, useRef } from "react";
import { Search, X } from "lucide-react";

const DEBOUNCE_MS = 400;

export function SearchBar({
  onSearch = () => {},
}: {
  onSearch?: (term: string) => void;
}) {
  const [value, setValue] = useState("");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      onSearch(value);
    }, DEBOUNCE_MS);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [value]);

  const handleClear = () => {
    setValue("");
    if (timerRef.current) clearTimeout(timerRef.current);
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
          onChange={(e) => setValue(e.target.value)}
          className="flex-1 bg-transparent outline-none border-none text-sm text-gray-800 placeholder:text-gray-400"
          aria-label="Search grants"
        />
        {value && (
          <button
            onClick={handleClear}
            className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
            aria-label="Clear search"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
