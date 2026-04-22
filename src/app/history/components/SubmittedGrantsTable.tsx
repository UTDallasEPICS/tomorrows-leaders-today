'use client';
import { useState, useMemo } from 'react';
import { ChevronDown, ChevronUp, X } from 'lucide-react';

type StatusUpdate = {
  timestamp: string;
  userId: string;
  fromStatus: string;
  toStatus: string;
};

type Grant = {
  grant: string;
  agency: string;
  release: string;
  deadline: string;
  fund: string;
  status: 'Applied' | 'Rejected' | 'Accepted';
  company: string;
  description: string;
  website?: string;
  statusUpdates: StatusUpdate[];
};

type SortField = 'grant' | 'agency' | 'release' | 'deadline' | 'fund' | 'status';

interface SubmittedGrantsTableProps {
  grants: Grant[];
  searchQuery?: string;
  statusFilter?: string;
}

const STATUS_STYLES: Record<string, string> = {
  Accepted: 'bg-green-100 text-green-800',
  Rejected: 'bg-red-100 text-red-800',
  Applied:  'bg-blue-100 text-blue-800',
};

const PAGE_SIZE = 10;

export default function SubmittedGrantsTable({ grants, searchQuery = '', statusFilter = 'all' }: SubmittedGrantsTableProps) {
  const [activeSort, setActiveSort]   = useState<SortField | null>(null);
  const [sortDir, setSortDir]         = useState<'asc' | 'desc'>('asc');
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);
  const [modalIdx, setModalIdx]       = useState<number | null>(null);
  const [page, setPage]               = useState(1);

  const handleSort = (field: SortField) => {
    if (activeSort === field) {
      if (sortDir === 'asc') setSortDir('desc');
      else { setActiveSort(null); setSortDir('asc'); }
    } else {
      setActiveSort(field);
      setSortDir('asc');
    }
    setPage(1);
  };

  // Filter
  const filtered = useMemo(() => {
    return grants.filter((g) => {
      const q = searchQuery.toLowerCase();
      if (q && !g.grant.toLowerCase().includes(q) && !g.agency.toLowerCase().includes(q)) return false;
      if (statusFilter !== 'all' && g.status !== statusFilter) return false;
      return true;
    });
  }, [grants, searchQuery, statusFilter]);

  // Sort
  const sorted = useMemo(() => {
    if (!activeSort) return filtered;
    return [...filtered].sort((a, b) => {
      let cmp = 0;
      switch (activeSort) {
        case 'grant':    cmp = a.grant.localeCompare(b.grant); break;
        case 'agency':   cmp = a.agency.localeCompare(b.agency); break;
        case 'release':  cmp = new Date(a.release).getTime() - new Date(b.release).getTime(); break;
        case 'deadline': cmp = new Date(a.deadline).getTime() - new Date(b.deadline).getTime(); break;
        case 'fund':     cmp = parseFloat(a.fund.replace(/[$,]/g, '')) - parseFloat(b.fund.replace(/[$,]/g, '')); break;
        case 'status':   cmp = a.status.localeCompare(b.status); break;
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [filtered, activeSort, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const paginated  = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const columns: { key: SortField; label: string }[] = [
    { key: 'grant',    label: 'Grant'    },
    { key: 'agency',   label: 'Agency'   },
    { key: 'release',  label: 'Release'  },
    { key: 'deadline', label: 'Deadline' },
    { key: 'fund',     label: 'Fund'     },
    { key: 'status',   label: 'Status'   },
  ];

  return (
    <div>
      <p className="text-sm text-gray-500 mb-2">
        Showing {sorted.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, sorted.length)} of {sorted.length} applications
      </p>

      <div className="bg-[#E8DCC8] rounded-lg shadow overflow-hidden">
        {/* Desktop header */}
        <div className="hidden md:grid md:grid-cols-6 bg-[#B89A49] text-white">
          {columns.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => handleSort(key)}
              className="p-3 text-left flex items-center justify-between hover:bg-[#A08940] transition-colors"
            >
              <span className={`text-sm font-medium ${activeSort === key ? 'font-bold' : ''}`}>{label}</span>
              {activeSort === key
                ? sortDir === 'asc' ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />
                : <ChevronDown className="w-4 h-4 opacity-40" />}
            </button>
          ))}
        </div>

        <div className="divide-y divide-gray-200">
          {paginated.length === 0 ? (
            <div className="p-10 text-center text-gray-400 text-sm">No applications match your filters.</div>
          ) : (
            paginated.map((grant, idx) => {
              const isExpanded = expandedIdx === idx;
              const statusStyle = STATUS_STYLES[grant.status] ?? 'bg-gray-100 text-gray-600';
              return (
                <div key={idx}>
                  {/* Desktop row */}
                  <div
                    className={`hidden md:grid md:grid-cols-6 cursor-pointer transition-colors ${
                      isExpanded ? 'bg-[#E8DCC8]' : 'bg-white hover:bg-gray-50'
                    }`}
                    onClick={() => setExpandedIdx(isExpanded ? null : idx)}
                  >
                    <div className="p-3 text-sm font-medium">{grant.grant}</div>
                    <div className="p-3 text-sm text-gray-600">{grant.agency}</div>
                    <div className="p-3 text-sm text-gray-600">{grant.release}</div>
                    <div className="p-3 text-sm text-gray-600">{grant.deadline}</div>
                    <div className="p-3 text-sm text-gray-600">{grant.fund}</div>
                    <div className="p-3">
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${statusStyle}`}>
                        {grant.status}
                      </span>
                    </div>
                  </div>

                  {/* Mobile card */}
                  <div
                    className={`md:hidden p-4 cursor-pointer transition-colors ${
                      isExpanded ? 'bg-[#E8DCC8]' : 'bg-white hover:bg-gray-50'
                    }`}
                    onClick={() => setExpandedIdx(isExpanded ? null : idx)}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <p className="text-sm font-semibold text-gray-800">{grant.grant}</p>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusStyle}`}>
                        {grant.status}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">{grant.agency}</p>
                    <div className="flex gap-4 mt-1 text-xs text-gray-400">
                      <span>Due: {grant.deadline}</span>
                      <span>{grant.fund}</span>
                    </div>
                  </div>

                  {/* Expanded panel */}
                  {isExpanded && (
                    <div className="bg-[#E8DCC8] px-6 py-4 border-t border-[#D4C18F] shadow-inner">
                      <p className="text-sm font-semibold text-gray-800 mb-1">{grant.company}</p>
                      <p className="text-sm text-gray-600 mb-4">{grant.description}</p>
                      <div className="flex gap-3">
                        {grant.website && (
                          <button
                            className="px-4 py-2 bg-[#B89A49] text-white text-sm rounded-lg hover:bg-[#A08940] transition-colors"
                            onClick={(e) => { e.stopPropagation(); window.open(grant.website, '_blank'); }}
                          >
                            Visit Website →
                          </button>
                        )}
                        <button
                          className="px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50 transition-colors"
                          onClick={(e) => { e.stopPropagation(); setModalIdx(idx); }}
                        >
                          Status History
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Status history modal */}
                  {modalIdx === idx && (
                    <div
                      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
                      onClick={() => setModalIdx(null)}
                    >
                      <div
                        className="bg-white rounded-xl p-6 max-w-md w-full shadow-xl"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex justify-between items-center mb-4">
                          <h3 className="text-base font-semibold">Status Update History</h3>
                          <button onClick={() => setModalIdx(null)} className="text-gray-400 hover:text-gray-600">
                            <X className="w-5 h-5" />
                          </button>
                        </div>
                        <div className="space-y-3 max-h-72 overflow-y-auto">
                          {grant.statusUpdates.map((update, i) => (
                            <div key={i} className="border-l-2 border-[#B89A49] pl-4">
                              <p className="text-xs text-gray-400">{update.timestamp}</p>
                              <p className="text-sm text-gray-700">
                                User <span className="font-medium">{update.userId}</span> changed status from{' '}
                                <span className="font-medium">{update.fromStatus}</span> to{' '}
                                <span className="font-medium">{update.toStatus}</span>
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 bg-white border-t border-gray-200">
            <button
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
              className="px-3 py-1.5 text-sm rounded border border-gray-200 disabled:opacity-40 hover:bg-gray-50 transition-colors"
            >
              ← Previous
            </button>
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                .reduce<(number | '…')[]>((acc, p, i, arr) => {
                  if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push('…');
                  acc.push(p);
                  return acc;
                }, [])
                .map((p, i) =>
                  p === '…' ? (
                    <span key={`ellipsis-${i}`} className="px-2 text-gray-400 text-sm">…</span>
                  ) : (
                    <button
                      key={p}
                      onClick={() => setPage(p as number)}
                      className={`w-8 h-8 text-sm rounded transition-colors ${
                        page === p ? 'bg-[#B89A49] text-white font-bold' : 'hover:bg-gray-100 text-gray-700'
                      }`}
                    >
                      {p}
                    </button>
                  )
                )}
            </div>
            <button
              disabled={page === totalPages}
              onClick={() => setPage(page + 1)}
              className="px-3 py-1.5 text-sm rounded border border-gray-200 disabled:opacity-40 hover:bg-gray-50 transition-colors"
            >
              Next →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}