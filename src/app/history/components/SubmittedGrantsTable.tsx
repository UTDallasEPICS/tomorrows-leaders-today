"use client"

import { useState } from 'react';
import { ChevronDown, ChevronUp, Info, X } from 'lucide-react';

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
}

type SortField = 'grant' | 'agency' | 'release' | 'deadline' | 'fund' | 'status';

interface SubmittedGrantsTableProps {
    grants: Grant[];
}

export default function SubmittedGrantsTable({ grants }: SubmittedGrantsTableProps) {
    const [activeSort, setActiveSort] = useState<SortField | null>(null);
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
    const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
    const [showInfoModal, setShowInfoModal] = useState<number | null>(null);

    const handleSort = (field: SortField) => {
        if (activeSort === field) {
            if (sortDirection === 'asc') {
                setSortDirection('desc');
            } else {
                // Reset when clicking again on descending
                setActiveSort(null);
                setSortDirection('asc');
            }
        } else {
            setActiveSort(field);
            setSortDirection('asc');
        }
    };

    const categories: { key: SortField; label: string }[] = [
        { key: 'grant', label: 'Grant' },
        { key: 'agency', label: 'Agency' },
        { key: 'release', label: 'Release' },
        { key: 'deadline', label: 'Deadline' },
        { key: 'fund', label: 'Fund' },
        { key: 'status', label: 'Status' }
    ];

    return (
        <div className="bg-[#E8DCC8] rounded-lg shadow overflow-hidden">
            <div className="grid grid-cols-6 bg-[#B89A49] text-white">
                {categories.map(({ key, label }) => (
                    <button
                        key={key}
                        onClick={() => handleSort(key)}
                        className="p-3 text-left flex items-center justify-between hover:bg-opacity-80"
                    >
                        <span className={activeSort === key ? 'font-bold' : ''}>
                            {label}
                        </span>
                        {activeSort === key ? (
                            sortDirection === 'asc' ? (
                                <ChevronDown className="w-4 h-4" />
                            ) : (
                                <ChevronUp className="w-4 h-4" />
                            )
                        ) : (
                            <ChevronDown className="w-4 h-4" />
                        )}
                    </button>
                ))}
            </div>
            <div className="divide-y divide-gray-300">
                {grants.map((grant, index) => {
                    const isExpanded = expandedIndex === index;
                    return (
                        <div key={index}>
                            <div
                                className={`grid grid-cols-6 cursor-pointer ${
                                    isExpanded 
                                        ? 'bg-[#E8DCC8] border-b border-gray-300 shadow-sm relative z-10' 
                                        : 'bg-white hover:bg-gray-50'
                                }`}
                                onClick={() => setExpandedIndex(isExpanded ? null : index)}
                            >
                                <div className="p-3">{grant.grant}</div>
                                <div className="p-3">{grant.agency}</div>
                                <div className="p-3">{grant.release}</div>
                                <div className="p-3">{grant.deadline}</div>
                                <div className="p-3">{grant.fund}</div>
                                <div className="p-3">{grant.status}</div>
                            </div>
                            {isExpanded && (
                                <div className="bg-[#E8DCC8] p-6 relative shadow-inner">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setShowInfoModal(index);
                                        }}
                                        className="absolute top-4 right-4 hover:text-gray-800 transition-colors"
                                    >
                                        <Info className="w-5 h-5 text-gray-600" />
                                    </button>
                                    <div className="mb-4">
                                        <p className="font-semibold">{grant.company}</p>
                                    </div>
                                    <div className="mb-6">
                                        <p>{grant.description}</p>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <button
                                            className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (grant.website) window.open(grant.website, '_blank');
                                            }}
                                        >
                                            Website
                                        </button>
                                        <button
                                            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            {grant.status}
                                        </button>
                                    </div>
                                </div>
                            )}
                            {showInfoModal === index && (
                                <div 
                                    className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
                                    onClick={() => setShowInfoModal(null)}
                                >
                                    <div 
                                        className="bg-white rounded-lg p-6 max-w-md w-full m-4"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <div className="flex justify-between items-center mb-4">
                                            <h3 className="text-lg font-semibold">Status Update History</h3>
                                            <button 
                                                onClick={() => setShowInfoModal(null)}
                                                className="text-gray-500 hover:text-gray-700"
                                            >
                                                <X className="w-5 h-5" />
                                            </button>
                                        </div>
                                        <div className="space-y-4">
                                            {grant.statusUpdates.map((update, i) => (
                                                <div key={i} className="border-l-2 border-gray-200 pl-4">
                                                    <p className="text-sm text-gray-500">{update.timestamp}</p>
                                                    <p className="text-gray-700">
                                                        User {update.userId} changed application status from{' '}
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
                })}
            </div>
        </div>
    );
}