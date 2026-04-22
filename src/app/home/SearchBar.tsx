'use client';
import { useState } from 'react';

export type FilterState = {
  search: string;
  status: string;
  agency: string;
};

interface SearchBarProps {
  onFilterChange?: (filters: FilterState) => void;
  agencies?: string[];
}

export function SearchBar({ onFilterChange, agencies = [] }: SearchBarProps) {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [agency, setAgency] = useState('all');
  const [showFilters, setShowFilters] = useState(false);

  const emit = (next: Partial<FilterState>) => {
    const updated = { search, status, agency, ...next };
    onFilterChange?.(updated);
  };

  const handleSearch = (val: string) => {
    setSearch(val);
    emit({ search: val });
  };

  const handleStatus = (val: string) => {
    setStatus(val);
    emit({ status: val });
  };

  const handleAgency = (val: string) => {
    setAgency(val);
    emit({ agency: val });
  };

  const clearAll = () => {
    setSearch('');
    setStatus('all');
    setAgency('all');
    onFilterChange?.({ search: '', status: 'all', agency: 'all' });
  };

  const hasFilters = search !== '' || status !== 'all' || agency !== 'all';

  return (
    <div className="mb-6 space-y-3">
      {/* Search row */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* Search input */}
        <div className="flex items-center gap-2 bg-white shadow rounded-md px-4 py-2.5 flex-1 min-w-[200px]">
          <svg className="w-4 h-4 text-gray-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search grants..."
            className="bg-transparent outline-none border-none flex-1 text-sm"
          />
          {search && (
            <button onClick={() => handleSearch('')} className="text-gray-400 hover:text-gray-600">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Filter toggle button */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-md shadow text-sm font-medium transition-colors ${
            showFilters || hasFilters
              ? 'bg-[#B89A49] text-white'
              : 'bg-white text-gray-700 hover:bg-gray-50'
          }`}
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="7" y1="12" x2="17" y2="12" />
            <line x1="10" y1="18" x2="14" y2="18" />
          </svg>
          Filters
          {hasFilters && (
            <span className="bg-white text-[#B89A49] text-xs font-bold rounded-full w-4 h-4 flex items-center justify-center">
              !
            </span>
          )}
        </button>

        {/* Clear all */}
        {hasFilters && (
          <button
            onClick={clearAll}
            className="text-sm text-gray-500 hover:text-gray-700 underline"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Filter dropdowns */}
      {showFilters && (
        <div className="flex flex-wrap gap-3 bg-white rounded-md shadow p-4">
          {/* Status filter */}
          <div className="flex flex-col gap-1 min-w-[160px]">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</label>
            <select
              value={status}
              onChange={(e) => handleStatus(e.target.value)}
              className="border border-gray-200 rounded px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-[#B89A49]"
            >
              <option value="all">All Statuses</option>
              <option value="Not Applied">Not Applied</option>
              <option value="Applied">Applied</option>
              <option value="Accepted">Accepted</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>

          {/* Agency filter */}
          {agencies.length > 0 && (
            <div className="flex flex-col gap-1 min-w-[160px]">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Agency</label>
              <select
                value={agency}
                onChange={(e) => handleAgency(e.target.value)}
                className="border border-gray-200 rounded px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-[#B89A49]"
              >
                <option value="all">All Agencies</option>
                {agencies.map((a) => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      )}
    </div>
  );
}