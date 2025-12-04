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
    const [dateError, setDateError] = useState<string>('');
    const [lastUpdated] = useState<string>(new Date().toLocaleString('en-US', {
        month: '2-digit',
        day: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    }).replace(',', ' at'));

    // Validate date range
    useEffect(() => {
        if (startDate && endDate) {
            const start = new Date(startDate);
            const end = new Date(endDate);
            
            if (start > end) {
                setDateError('Start date cannot be after end date');
            } else {
                setDateError('');
            }
        } else {
            setDateError('');
        }
    }, [startDate, endDate]);

    // Filter grants based on date range (only apply if valid)
    const filteredGrants = grants.filter(grant => {
        // Don't apply filter if there's a date error
        if (dateError) return true;
        
        const grantDate = new Date(grant.deadline);
        const start = startDate ? new Date(startDate) : null;
        const end = endDate ? new Date(endDate) : null;

        if (start && grantDate < start) return false;
        if (end && grantDate > end) return false;
        return true;
    });

    // Handle start date change
    const handleStartDateChange = (value: string) => {
        setStartDate(value);
        // If end date exists and new start date is after it, clear the error
        if (endDate && value) {
            const start = new Date(value);
            const end = new Date(endDate);
            if (start > end) {
                setDateError('Start date cannot be after end date');
            }
        }
    };

    // Handle end date change
    const handleEndDateChange = (value: string) => {
        setEndDate(value);
        // If start date exists and new end date is before it, clear the error
        if (startDate && value) {
            const start = new Date(startDate);
            const end = new Date(value);
            if (start > end) {
                setDateError('Start date cannot be after end date');
            }
        }
    };

    // Calculate application count data
    const completedCount = filteredGrants.filter(g => g.status === 'Accepted' || g.status === 'Rejected').length;
    const inProgressCount = filteredGrants.filter(g => g.status === 'Applied').length;
    const newCount = 0; // Assuming new applications aren't tracked in current data
    const totalApplicationCount = completedCount + inProgressCount + newCount;

    const applicationData = [
        { value: completedCount, name: 'COMPLETED' },
        { value: inProgressCount, name: 'IN-PROGRESS' },
        { value: newCount, name: 'NEW' }
    ];

    // Calculate percentages for Application Count
    const completedPercentage = totalApplicationCount > 0 ? Math.round((completedCount / totalApplicationCount) * 100) : 0;
    const inProgressPercentage = totalApplicationCount > 0 ? Math.round((inProgressCount / totalApplicationCount) * 100) : 0;
    const newPercentage = totalApplicationCount > 0 ? Math.round((newCount / totalApplicationCount) * 100) : 0;

    // Calculate outcome data
    const acceptedCount = filteredGrants.filter(g => g.status === 'Accepted').length;
    const rejectedCount = filteredGrants.filter(g => g.status === 'Rejected').length;
    const pendingCount = filteredGrants.filter(g => g.status === 'Applied').length;
    const totalOutcomeCount = acceptedCount + rejectedCount + pendingCount;

    const outcomeData = [
        { value: acceptedCount, name: 'ACCEPTED' },
        { value: rejectedCount, name: 'REJECTED' },
        { value: pendingCount, name: 'PENDING' }
    ];

    // Calculate percentages for Outcome
    const acceptedPercentage = totalOutcomeCount > 0 ? Math.round((acceptedCount / totalOutcomeCount) * 100) : 0;
    const rejectedPercentage = totalOutcomeCount > 0 ? Math.round((rejectedCount / totalOutcomeCount) * 100) : 0;
    const pendingPercentage = totalOutcomeCount > 0 ? Math.round((pendingCount / totalOutcomeCount) * 100) : 0;

    useEffect(() => {
        if (applicationChartRef.current) {
            const chart = echarts.init(applicationChartRef.current);
            const option = {
                tooltip: {
                    trigger: 'item',
                    formatter: '{b}: {c} ({d}%)',
                    confine: true,
                    position: function (point: number[], params: any, dom: HTMLElement, rect: any, size: any) {
                        // Ensure tooltip stays within bounds
                        const x = point[0] < size.viewSize[0] / 2 ? point[0] + 10 : point[0] - size.contentSize[0] - 10;
                        const y = point[1] < size.viewSize[1] / 2 ? point[1] + 10 : point[1] - size.contentSize[1] - 10;
                        return [x, y];
                    }
                },
                graphic: [
                    {
                        type: 'text',
                        left: 'center',
                        top: '35%',
                        style: {
                            text: `${completedPercentage}% Completed`,
                            fontSize: 12,
                            fontWeight: 'bold',
                            fill: '#000'
                        }
                    },
                    {
                        type: 'text',
                        left: 'center',
                        top: '45%',
                        style: {
                            text: `${inProgressPercentage}% In-Progress`,
                            fontSize: 11,
                            fill: '#666'
                        }
                    },
                    {
                        type: 'text',
                        left: 'center',
                        top: '55%',
                        style: {
                            text: `${newPercentage}% New`,
                            fontSize: 11,
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
    }, [filteredGrants, completedPercentage, inProgressPercentage, newPercentage, applicationData]);

    useEffect(() => {
        if (outcomeChartRef.current) {
            const chart = echarts.init(outcomeChartRef.current);
            const option = {
                tooltip: {
                    trigger: 'item',
                    formatter: '{b}: {c} ({d}%)',
                    confine: true,
                    position: function (point: number[], params: any, dom: HTMLElement, rect: any, size: any) {
                        // Ensure tooltip stays within bounds
                        const x = point[0] < size.viewSize[0] / 2 ? point[0] + 10 : point[0] - size.contentSize[0] - 10;
                        const y = point[1] < size.viewSize[1] / 2 ? point[1] + 10 : point[1] - size.contentSize[1] - 10;
                        return [x, y];
                    }
                },
                graphic: [
                    {
                        type: 'text',
                        left: 'center',
                        top: '35%',
                        style: {
                            text: `${acceptedPercentage}% Accepted`,
                            fontSize: 12,
                            fontWeight: 'bold',
                            fill: '#000'
                        }
                    },
                    {
                        type: 'text',
                        left: 'center',
                        top: '45%',
                        style: {
                            text: `${rejectedPercentage}% Rejected`,
                            fontSize: 11,
                            fill: '#666'
                        }
                    },
                    {
                        type: 'text',
                        left: 'center',
                        top: '55%',
                        style: {
                            text: `${pendingPercentage}% Pending`,
                            fontSize: 11,
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
    }, [filteredGrants, acceptedPercentage, rejectedPercentage, pendingPercentage, outcomeData]);

    return (
        <div className="bg-[#F0EAD9] rounded-lg p-6 mb-8">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Dashboard</h2>
                <span className="text-xs text-gray-600">Last Updated: {lastUpdated}</span>
            </div>

            {/* Date Range Filter */}
            <div className="mb-6">
                <div className="flex gap-4 items-start">
                    <div className="flex items-center gap-2">
                        <label className="text-sm font-medium">Start Date:</label>
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => handleStartDateChange(e.target.value)}
                            max={endDate || undefined}
                            className={`px-3 py-1 text-sm border rounded ${
                                dateError ? 'border-red-500 bg-red-50' : 'border-gray-300'
                            }`}
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <label className="text-sm font-medium">End Date:</label>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => handleEndDateChange(e.target.value)}
                            min={startDate || undefined}
                            className={`px-3 py-1 text-sm border rounded ${
                                dateError ? 'border-red-500 bg-red-50' : 'border-gray-300'
                            }`}
                        />
                    </div>
                    {(startDate || endDate) && (
                        <button
                            onClick={() => {
                                setStartDate('');
                                setEndDate('');
                                setDateError('');
                            }}
                            className="px-3 py-1 text-sm bg-gray-200 hover:bg-gray-300 rounded"
                        >
                            Clear Filters
                        </button>
                    )}
                </div>
                {dateError && (
                    <div className="mt-2 text-sm text-red-600 flex items-center gap-1">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        <span>{dateError}</span>
                    </div>
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