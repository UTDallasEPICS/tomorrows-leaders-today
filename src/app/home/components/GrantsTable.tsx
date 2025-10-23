"use client"

import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

type Grant = {
    grant: string;
    agency: string;
    release: string;
    deadline: string;
    fund: string;
    status: string;
    company: string;
    description: string;
    website?: string;
}

type SortField = 'grant' | 'agency' | 'release' | 'deadline' | 'fund' | 'status';

export default function GrantsTable() {
    const [activeSort, setActiveSort] = useState<SortField | null>(null);
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
    const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

    // Sample data
    const [grants] = useState<Grant[]>([
        {
            grant: "Educational Innovation Grant",
            agency: "Gates Foundation",
            release: "10/02/2025",
            deadline: "10/02/2025",
            fund: "$250,000",
            status: "Start",
            company: "Abcde: Abcde Abcde...",
            description: "Description:",
            website: "https://example.com"
        },
        {
            grant: "Community Development Fund",
            agency: "Dell Foundation",
            release: "10/02/2025",
            deadline: "10/02/2025",
            fund: "$175,000",
            status: "Applied",
            company: "Abcde: Abcde Abcde...",
            description: "Description:",
        },
        {
            grant: "Technology Integration Project",
            agency: "Google.org",
            release: "10/02/2025",
            deadline: "10/02/2025",
            fund: "$300,000",
            status: "Start",
            company: "Abcde: Abcde Abcde...",
            description: "Description:",
            website: "https://example.com"
        }
    ]);

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
                                className={`grid grid-cols-6 cursor-pointer ${isExpanded ? 'bg-[#E8DCC8]' : 'bg-white hover:bg-gray-50'}`}
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
                                <div className="bg-[#E8DCC8] p-6">
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
                                            className={`px-4 py-2 rounded ${
                                                grant.status !== "Available"
                                                    ? "bg-gray-400 text-gray-600 cursor-not-allowed"
                                                    : "bg-gray-600 text-white hover:bg-gray-700"
                                            }`}
                                            disabled={grant.status !== "Available"}
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            {grant.status}
                                        </button>
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