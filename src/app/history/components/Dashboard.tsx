"use client"

import { useEffect, useRef, useState } from 'react';
import * as echarts from 'echarts';

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
    statusUpdates: {
        timestamp: string;
        userId: string;
        fromStatus: string;
        toStatus: string;
    }[];
}

interface DashboardProps {
    grants: Grant[];
}

export default function Dashboard({ grants }: DashboardProps) {
    const applicationChartRef = useRef<HTMLDivElement>(null);
    const outcomeChartRef = useRef<HTMLDivElement>(null);
    const [startDate, setStartDate] = useState<string>('');
    const [endDate, setEndDate] = useState<string>('');
    const [lastUpdated] = useState<string>(new Date().toLocaleString('en-US', {
        month: '2-digit',
        day: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    }).replace(',', ' at'));

    // Filter grants based on date range
    const filteredGrants = grants.filter(grant => {
        const grantDate = new Date(grant.deadline);
        const start = startDate ? new Date(startDate) : null;
        const end = endDate ? new Date(endDate) : null;

        if (start && grantDate < start) return false;
        if (end && grantDate > end) return false;
        return true;
    });

    // Calculate data from filtered grants
    const applicationData = [
        { value: filteredGrants.filter(g => g.status === 'Applied' || g.status === 'Accepted' || g.status === 'Rejected').length, name: 'COMPLETED' },
        { value: filteredGrants.filter(g => g.status === 'Applied').length, name: 'IN-PROGRESS' },
        { value: 0, name: 'NEW' }
    ];

    const outcomeData = [
        { value: filteredGrants.filter(g => g.status === 'Accepted').length, name: 'ACCEPTED' },
        { value: filteredGrants.filter(g => g.status === 'Rejected').length, name: 'REJECTED' },
        { value: filteredGrants.filter(g => g.status === 'Applied').length, name: 'PENDING' }
    ];

    const totalApplications = filteredGrants.length;
    const acceptedCount = filteredGrants.filter(g => g.status === 'Accepted').length;
    const acceptanceRate = totalApplications > 0 ? Math.round((acceptedCount / totalApplications) * 100) : 0;
    const rejectionRate = totalApplications > 0 ? Math.round((filteredGrants.filter(g => g.status === 'Rejected').length / totalApplications) * 100) : 0;

    useEffect(() => {
        if (applicationChartRef.current) {
            const chart = echarts.init(applicationChartRef.current);
            const option = {
                tooltip: {
                    trigger: 'item'
                },
                graphic: [
                    {
                        type: 'text',
                        left: 'center',
                        top: '40%',
                        style: {
                            text: `${acceptanceRate}% Acceptance`,
                            fontSize: 14,
                            fontWeight: 'bold',
                            fill: '#000'
                        }
                    },
                    {
                        type: 'text',
                        left: 'center',
                        top: '50%',
                        style: {
                            text: `${rejectionRate}% Rejection`,
                            fontSize: 12,
                            fill: '#666'
                        }
                    }
                ],
                series: [
                    {
                        type: 'pie',
                        radius: ['60%', '80%'],
                        avoidLabelOverlap: false,
                        label: {
                            show: false
                        },
                        labelLine: {
                            show: false
                        },
                        data: applicationData,
                        color: ['#B89A49', '#D4C18F', '#E8DCC8']
                    }
                ]
            };
            chart.setOption(option);

            return () => chart.dispose();
        }
    }, [filteredGrants, acceptanceRate, rejectionRate]);

    useEffect(() => {
        if (outcomeChartRef.current) {
            const chart = echarts.init(outcomeChartRef.current);
            const option = {
                tooltip: {
                    trigger: 'item'
                },
                graphic: [
                    {
                        type: 'text',
                        left: 'center',
                        top: '40%',
                        style: {
                            text: `${acceptanceRate}% Acceptance`,
                            fontSize: 14,
                            fontWeight: 'bold',
                            fill: '#000'
                        }
                    },
                    {
                        type: 'text',
                        left: 'center',
                        top: '50%',
                        style: {
                            text: `${rejectionRate}% Rejection`,
                            fontSize: 12,
                            fill: '#666'
                        }
                    }
                ],
                series: [
                    {
                        type: 'pie',
                        radius: ['60%', '80%'],
                        avoidLabelOverlap: false,
                        label: {
                            show: false
                        },
                        labelLine: {
                            show: false
                        },
                        data: outcomeData,
                        color: ['#B89A49', '#D4C18F', '#E8DCC8']
                    }
                ]
            };
            chart.setOption(option);

            return () => chart.dispose();
        }
    }, [filteredGrants, acceptanceRate, rejectionRate]);

    return (
        <div className="bg-[#F0EAD9] rounded-lg p-6 mb-8">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Dashboard</h2>
                <span className="text-xs text-gray-600">Last Updated: {lastUpdated}</span>
            </div>

            {/* Date Range Filter */}
            <div className="flex gap-4 mb-6">
                <div className="flex items-center gap-2">
                    <label className="text-sm font-medium">Start Date:</label>
                    <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="px-3 py-1 text-sm border border-gray-300 rounded"
                    />
                </div>
                <div className="flex items-center gap-2">
                    <label className="text-sm font-medium">End Date:</label>
                    <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="px-3 py-1 text-sm border border-gray-300 rounded"
                    />
                </div>
                {(startDate || endDate) && (
                    <button
                        onClick={() => {
                            setStartDate('');
                            setEndDate('');
                        }}
                        className="px-3 py-1 text-sm bg-gray-200 hover:bg-gray-300 rounded"
                    >
                        Clear Filters
                    </button>
                )}
            </div>

            <div className="grid grid-cols-2 gap-6">
                {/* Application Count Section */}
                <div className="flex items-center gap-4">
                    <div ref={applicationChartRef} style={{ width: '200px', height: '200px' }}></div>
                    <div>
                        <h3 className="text-lg font-bold mb-3 underline">Application Count</h3>
                        <div className="space-y-1">
                            {applicationData.map((item, index) => (
                                <div key={index} className="flex items-center gap-3">
                                    <span className="text-[#B89A49] text-2xl font-bold w-16 text-right">
                                        {item.value}
                                    </span>
                                    <span className="text-sm font-medium">{item.name}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Outcome Section */}
                <div className="flex items-center gap-4">
                    <div ref={outcomeChartRef} style={{ width: '200px', height: '200px' }}></div>
                    <div>
                        <h3 className="text-lg font-bold mb-3 underline">Outcome</h3>
                        <div className="space-y-1">
                            {outcomeData.map((item, index) => (
                                <div key={index} className="flex items-center gap-3">
                                    <span className="text-[#B89A49] text-2xl font-bold w-16 text-right">
                                        {item.value}
                                    </span>
                                    <span className="text-sm font-medium">{item.name}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}