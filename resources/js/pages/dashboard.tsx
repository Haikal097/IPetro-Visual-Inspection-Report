// app/Pages/Dashboard.tsx
import { useState, useEffect } from 'react';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import { type BreadcrumbItem } from '@/types';
import { Head, usePage, router } from '@inertiajs/react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { Link } from '@inertiajs/react';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: dashboard().url,
    },
];

interface Report {
    id: string;
    equipment: {
        name: string;
        tag: string;
    };
    createdBy: string;
    status: 'pending' | 'in_review' | 'completed' | 'rejected';
    createdAt: string;
    lastActivity: {
        action: string;
        time: string;
    };
}

interface DashboardStats {
    totalReports: number;
    pendingReview: number;
    completed: number;
    thisWeek: number;
}

export default function Dashboard() {
    const { auth } = usePage().props as any;
    const [reports, setReports] = useState<Report[]>([
        {
            id: 'RPT-2025-001',
            equipment: { name: 'Pressure Vessel V-101', tag: 'PMT-12345' },
            createdBy: 'John Doe',
            status: 'pending',
            createdAt: '2025-11-10',
            lastActivity: { action: 'Report Created', time: '2 hours ago' },
        },
        {
            id: 'RPT-2025-002',
            equipment: { name: 'Heat Exchanger HE-205', tag: 'PMT-12346' },
            createdBy: 'Jane Smith',
            status: 'in_review',
            createdAt: '2025-11-09',
            lastActivity: { action: 'Reviewer Added Comments', time: '5 hours ago' },
        },
        {
            id: 'RPT-2025-003',
            equipment: { name: 'Reactor R-301', tag: 'PMT-12347' },
            createdBy: 'Mike Johnson',
            status: 'completed',
            createdAt: '2025-11-08',
            lastActivity: { action: 'Report Approved', time: '1 day ago' },
        },
        {
            id: 'RPT-2025-004',
            equipment: { name: 'Separator S-110', tag: 'PMT-12348' },
            createdBy: 'Sarah Lee',
            status: 'pending',
            createdAt: '2025-11-10',
            lastActivity: { action: 'Photos Uploaded', time: '3 hours ago' },
        },
        {
            id: 'RPT-2025-005',
            equipment: { name: 'Accumulator A-402', tag: 'PMT-12349' },
            createdBy: 'David Chen',
            status: 'rejected',
            createdAt: '2025-11-07',
            lastActivity: { action: 'Revision Requested', time: '2 days ago' },
        },
        {
            id: 'RPT-2025-006',
            equipment: { name: 'Condenser C-201', tag: 'PMT-12350' },
            createdBy: 'Emily Wong',
            status: 'completed',
            createdAt: '2025-11-06',
            lastActivity: { action: 'Report Finalized', time: '3 days ago' },
        },
    ]);

    const [filteredReports, setFilteredReports] = useState<Report[]>(reports);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [chartFilter, setChartFilter] = useState<'week' | 'month'>('week');

    const stats: DashboardStats = {
        totalReports: 247,
        pendingReview: 18,
        completed: 215,
        thisWeek: 12,
    };

    const chartData = {
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        datasets: [
            {
                label: 'Reports Created',
                data: [5, 8, 12, 7, 9, 4, 6],
                backgroundColor: 'rgba(220, 38, 38, 0.8)', // Red-600
                borderColor: 'rgb(185, 28, 28)', // Red-700
                borderWidth: 1,
            },
            {
                label: 'Reports Completed',
                data: [3, 6, 8, 5, 7, 3, 4],
                backgroundColor: 'rgba(107, 114, 128, 0.8)', // Gray-500
                borderColor: 'rgb(75, 85, 99)', // Gray-600
                borderWidth: 1,
            },
        ],
    };

    const chartOptions = {
        responsive: true,
        plugins: {
            legend: {
                position: 'top' as const,
                labels: {
                    color: '#374151', // Gray-700 for light mode
                },
            },
            title: {
                display: true,
                text: 'Report Activity - Last 7 Days',
                color: '#ffffff', // Pure white
                font: {
                    size: 16,
                    weight: '600' as const,
                },
            },
        },
        scales: {
            y: {
                beginAtZero: true,
                ticks: {
                    stepSize: 2,
                    color: '#6B7280', // Gray-500
                },
                grid: {
                    color: 'rgba(229, 231, 235, 0.5)', // Gray-200
                },
            },
            x: {
                ticks: {
                    color: '#6B7280', // Gray-500
                },
                grid: {
                    color: 'rgba(229, 231, 235, 0.5)', // Gray-200
                },
            },
        },
    };

    const getStatusBadge = (status: Report['status']) => {
        const baseClasses = "px-2 py-1 rounded-full text-xs font-semibold";
        switch (status) {
            case 'pending':
                return `${baseClasses} bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300`;
            case 'in_review':
                return `${baseClasses} bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300`;
            case 'completed':
                return `${baseClasses} bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300`;
            case 'rejected':
                return `${baseClasses} bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300`;
            default:
                return `${baseClasses} bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300`;
        }
    };

    const getStatusText = (status: Report['status']) => {
        switch (status) {
            case 'pending':
                return 'Pending Review';
            case 'in_review':
                return 'In Review';
            case 'completed':
                return 'Completed';
            case 'rejected':
                return 'Rejected';
            default:
                return 'Unknown';
        }
    };

    const filterReports = () => {
        let filtered = [...reports];
        
        if (searchTerm) {
            filtered = filtered.filter(report => 
                report.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                report.equipment.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                report.createdBy.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }
        
        if (statusFilter !== 'all') {
            filtered = filtered.filter(report => report.status === statusFilter);
        }
        
        setFilteredReports(filtered);
    };

    useEffect(() => {
        filterReports();
    }, [searchTerm, statusFilter]);

    const viewReport = (id: string) => {
        console.log(`View report ${id}`);
    };

    const editReport = (id: string) => {
        console.log(`Edit report ${id}`);
    };

    const downloadReport = (id: string) => {
        console.log(`Download report ${id}`);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />
            
            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl p-6 bg-gradient-to-b from-transparent to-gray-50 dark:to-gray-900"> {/*bg-gradient-to-b from-transparent to-gray-50 dark:to-gray-900* or bg-gray-50 dark:bg-gray-900 /}
                {/* Welcome Message */}
                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                        Welcome back, <span className="text-red-600 dark:text-red-500">{auth.user.name}</span>!
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400">
                        Welcome to iPetro Report System
                    </p>
                </div>

                {/* Statistics Dashboard */}
                <div className="mb-8">
                    <h2 className="mb-4 text-xl font-semibold text-gray-800 dark:text-white">
                        Statistics Overview
                    </h2>
                    
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        {/* Total Reports Card */}
                        <div className="rounded-xl bg-gradient-to-br from-red-600 to-red-700 p-5 text-white shadow-lg transition-transform duration-200 hover:scale-[1.02]">
                            <div className="flex items-center gap-4">
                                <div className="rounded-lg bg-white/20 p-3 backdrop-blur-sm">
                                    <span className="text-2xl">📊</span>
                                </div>
                                <div>
                                    <h3 className="text-3xl font-bold">{stats.totalReports}</h3>
                                    <p className="text-red-100">Total Reports</p>
                                </div>
                            </div>
                        </div>

                        {/* Pending Reports Card */}
                        <div className="rounded-xl bg-gradient-to-br from-gray-600 to-gray-700 p-5 text-white shadow-lg transition-transform duration-200 hover:scale-[1.02]">
                            <div className="flex items-center gap-4">
                                <div className="rounded-lg bg-white/20 p-3 backdrop-blur-sm">
                                    <span className="text-2xl">⏳</span>
                                </div>
                                <div>
                                    <h3 className="text-3xl font-bold">{stats.pendingReview}</h3>
                                    <p className="text-gray-100">Pending Review</p>
                                </div>
                            </div>
                        </div>

                        {/* Completed Reports Card */}
                        <div className="rounded-xl bg-gradient-to-br from-red-500 to-red-600 p-5 text-white shadow-lg transition-transform duration-200 hover:scale-[1.02]">
                            <div className="flex items-center gap-4">
                                <div className="rounded-lg bg-white/20 p-3 backdrop-blur-sm">
                                    <span className="text-2xl">✅</span>
                                </div>
                                <div>
                                    <h3 className="text-3xl font-bold">{stats.completed}</h3>
                                    <p className="text-red-100">Completed</p>
                                </div>
                            </div>
                        </div>

                        {/* This Week Card */}
                        <div className="rounded-xl bg-gradient-to-br from-gray-500 to-gray-600 p-5 text-white shadow-lg transition-transform duration-200 hover:scale-[1.02]">
                            <div className="flex items-center gap-4">
                                <div className="rounded-lg bg-white/20 p-3 backdrop-blur-sm">
                                    <span className="text-2xl">📅</span>
                                </div>
                                <div>
                                    <h3 className="text-3xl font-bold">{stats.thisWeek}</h3>
                                    <p className="text-gray-100">This Week</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Activity Chart */}
                <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
                    {/* --- LEFT: ACTIVITY CHART --- */}
                    <div className="col-span-2">
                        <div className="h-full rounded-2xl border border-gray-200 bg-gradient-to-br from-white to-gray-50 p-6 shadow-xl dark:border-gray-800 dark:from-gray-900 dark:to-gray-950 flex flex-col">
                            {/* Header with title and controls */}
                            <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center mb-6">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <div className="h-2 w-2 rounded-full bg-red-500"></div>
                                        <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                                            Report Activity Analytics
                                        </h3>
                                    </div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        Track report creation and completion trends over time
                                    </p>
                                </div>

                                <div className="flex items-center gap-3">
                                    {/* Time filter buttons */}
                                    <div className="flex rounded-lg bg-gray-100 p-1 dark:bg-gray-800">
                                        <button
                                            onClick={() => setChartFilter('week')}
                                            className={`rounded-md px-4 py-2 text-sm font-medium transition-all ${
                                                chartFilter === 'week'
                                                    ? 'bg-white text-red-600 shadow-sm dark:bg-gray-700 dark:text-red-400'
                                                    : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300'
                                            }`}
                                        >
                                            Week
                                        </button>
                                        <button
                                            onClick={() => setChartFilter('month')}
                                            className={`rounded-md px-4 py-2 text-sm font-medium transition-all ${
                                                chartFilter === 'month'
                                                    ? 'bg-white text-red-600 shadow-sm dark:bg-gray-700 dark:text-red-400'
                                                    : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300'
                                            }`}
                                        >
                                            Month
                                        </button>
                                    </div>
                                    
                                    {/* Chart stats summary */}
                                    <div className="hidden rounded-lg border border-gray-200 bg-white px-4 py-2 dark:border-gray-700 dark:bg-gray-800 md:block">
                                        <div className="flex items-center gap-4 text-sm">
                                            <div className="flex items-center gap-2">
                                                <div className="h-3 w-3 rounded-full bg-red-500"></div>
                                                <span className="text-gray-600 dark:text-gray-400">Created</span>
                                                <span className="font-semibold text-gray-900 dark:text-white">48</span>
                                            </div>
                                            <div className="h-4 w-px bg-gray-200 dark:bg-gray-700"></div>
                                            <div className="flex items-center gap-2">
                                                <div className="h-3 w-3 rounded-full bg-gray-500"></div>
                                                <span className="text-gray-600 dark:text-gray-400">Completed</span>
                                                <span className="font-semibold text-gray-900 dark:text-white">36</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Chart container - flex-grow to fill remaining space */}
                            <div className="flex-1 relative min-h-[280px]">
                                <div className="absolute inset-0">
                                    <Bar 
                                        data={chartData} 
                                        options={{
                                            ...chartOptions,
                                            maintainAspectRatio: false,
                                            plugins: {
                                                ...chartOptions.plugins,
                                                tooltip: {
                                                    backgroundColor: 'rgba(15, 23, 42, 0.95)',
                                                    titleColor: '#e5e7eb',
                                                    bodyColor: '#e5e7eb',
                                                    borderColor: '#374151',
                                                    borderWidth: 1,
                                                    padding: 12,
                                                    cornerRadius: 8,
                                                },
                                            },
                                        }} 
                                    />
                                </div>
                            </div>
                            
                            {/* Legend */}
                            <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                                <div className="flex flex-wrap items-center justify-center gap-4">
                                    <div className="flex items-center gap-2">
                                        <div className="h-3 w-3 rounded-full bg-red-500"></div>
                                        <span className="text-sm text-gray-600 dark:text-gray-400">Reports Created</span>
                                        <span className="text-sm font-medium text-gray-900 dark:text-white">(Avg: 7/day)</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="h-3 w-3 rounded-full bg-gray-500"></div>
                                        <span className="text-sm text-gray-600 dark:text-gray-400">Reports Completed</span>
                                        <span className="text-sm font-medium text-gray-900 dark:text-white">(Avg: 5/day)</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* --- RIGHT: QUICK ACTIONS --- */}
                    <div>
                        <div className="h-full rounded-2xl border border-gray-200 bg-gradient-to-b from-white to-gray-50 p-6 shadow-xl dark:border-gray-800 dark:from-gray-900 dark:to-gray-950 flex flex-col">
                            {/* Header */}
                            <div className="mb-6">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-500/10">
                                            <svg className="h-4 w-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                            </svg>
                                        </div>
                                        <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                                            Quick Actions
                                        </h3>
                                    </div>
                                </div>
                                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                                    Perform common tasks quickly
                                </p>
                            </div>

                            {/* Action buttons - flex-grow to fill space */}
                            <div className="flex-1 space-y-4">
                            <Link
                                href="/pv-report"
                                className="group flex items-center justify-between rounded-xl border border-red-200/50 bg-white p-4 transition-all hover:border-red-300 hover:bg-red-50/50 hover:shadow-md hover:shadow-red-200/30 dark:border-red-900/30 dark:bg-gray-800 dark:hover:border-red-800 dark:hover:bg-red-900/20 dark:hover:shadow-red-900/20"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-red-500 to-red-600 text-white group-hover:from-red-600 group-hover:to-red-700 transition-all">
                                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-gray-900 dark:text-white">Create New Report</h4>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">Start a new inspection report</p>
                                    </div>
                                </div>
                                <svg className="h-5 w-5 text-gray-400 group-hover:text-red-500 dark:group-hover:text-red-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </Link>

                            {/* View Templates Button */}
                            <Link className="group flex w-full items-center justify-between rounded-xl border border-blue-200/50 bg-white p-4 transition-all hover:border-blue-300 hover:bg-blue-50/50 hover:shadow-md hover:shadow-blue-200/30 dark:border-blue-900/30 dark:bg-gray-800 dark:hover:border-blue-800 dark:hover:bg-blue-900/20 dark:hover:shadow-blue-900/20">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white group-hover:from-blue-600 group-hover:to-blue-700 transition-all">
                                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-gray-900 dark:text-white">View Templates</h4>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">Browse report templates</p>
                                    </div>
                                </div>
                                <svg className="h-5 w-5 text-gray-400 group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </Link>

                            {/* View Analytics Button */}
                            <Link className="group flex w-full items-center justify-between rounded-xl border border-amber-200/50 bg-white p-4 transition-all hover:border-amber-300 hover:bg-amber-50/50 hover:shadow-md hover:shadow-amber-200/30 dark:border-amber-900/30 dark:bg-gray-800 dark:hover:border-amber-800 dark:hover:bg-amber-900/20 dark:hover:shadow-amber-900/20">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-amber-500 to-amber-600 text-white group-hover:from-amber-600 group-hover:to-amber-700 transition-all">
                                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-gray-900 dark:text-white">View Analytics</h4>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">Detailed performance insights</p>
                                    </div>
                                </div>
                                <svg className="h-5 w-5 text-gray-400 group-hover:text-amber-500 dark:group-hover:text-amber-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </Link>

                            {/* Export Data Button */}
                            <Link className="group flex w-full items-center justify-between rounded-xl border border-emerald-200/50 bg-white p-4 transition-all hover:border-emerald-300 hover:bg-emerald-50/50 hover:shadow-md hover:shadow-emerald-200/30 dark:border-emerald-900/30 dark:bg-gray-800 dark:hover:border-emerald-800 dark:hover:bg-emerald-900/20 dark:hover:shadow-emerald-900/20">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 text-white group-hover:from-emerald-600 group-hover:to-emerald-700 transition-all">
                                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-gray-900 dark:text-white">Export Data</h4>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">Download reports & metrics</p>
                                    </div>
                                </div>
                                <svg className="h-5 w-5 text-gray-400 group-hover:text-emerald-500 dark:group-hover:text-emerald-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </Link>
                            </div>
                            
                            {/* Help text */}
                            <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-800">
                                <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-800/50">
                                    <div className="flex items-start gap-2">
                                        <svg className="mt-0.5 h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                            <span className="font-medium">Tip:</span> Use keyboard shortcuts for faster navigation
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>


                {/* Recent Reports Table */}
                <div className="rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
                    <div className="border-b border-gray-200 p-6 dark:border-gray-800">
                        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                            <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
                                Recent Reports & Activity
                            </h2>
                            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                                <div className="flex gap-3">
                                    <div className="relative">
                                        <input
                                            type="text"
                                            placeholder="Search by report ID, equipment, or user..."
                                            className="w-full rounded-lg border border-gray-300 bg-gray-50 py-2.5 pl-10 pr-4 text-sm focus:border-red-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:focus:border-red-500 dark:focus:bg-gray-900"
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                        />
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500">
                                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                            </svg>
                                        </span>
                                    </div>
                                    <select
                                        className="rounded-lg border border-gray-300 bg-gray-50 px-4 py-2.5 text-sm focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:focus:border-red-500"
                                        value={statusFilter}
                                        onChange={(e) => setStatusFilter(e.target.value)}
                                    >
                                        <option value="all">All Status</option>
                                        <option value="pending">Pending</option>
                                        <option value="in_review">In Review</option>
                                        <option value="completed">Completed</option>
                                        <option value="rejected">Rejected</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 dark:bg-gray-800">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-700 dark:text-gray-300">
                                        Report ID
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-700 dark:text-gray-300">
                                        Equipment
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-700 dark:text-gray-300">
                                        Created By
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-700 dark:text-gray-300">
                                        Status
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-700 dark:text-gray-300">
                                        Created Date
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-700 dark:text-gray-300">
                                        Last Activity
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-700 dark:text-gray-300">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-800 dark:bg-gray-900">
                                {filteredReports.map((report) => (
                                    <tr key={report.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                        <td className="whitespace-nowrap px-6 py-4">
                                            <strong className="font-semibold text-gray-900 dark:text-white">
                                                {report.id}
                                            </strong>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <strong className="text-gray-900 dark:text-white">
                                                    {report.equipment.name}
                                                </strong>
                                                <span className="text-sm text-gray-500 dark:text-gray-400">
                                                    {report.equipment.tag}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="whitespace-nowrap px-6 py-4 text-gray-900 dark:text-white">
                                            {report.createdBy}
                                        </td>
                                        <td className="whitespace-nowrap px-6 py-4">
                                            <span className={getStatusBadge(report.status)}>
                                                {getStatusText(report.status)}
                                            </span>
                                        </td>
                                        <td className="whitespace-nowrap px-6 py-4 text-gray-900 dark:text-white">
                                            {report.createdAt}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="text-gray-900 dark:text-white">
                                                    {report.lastActivity.action}
                                                </span>
                                                <span className="text-sm text-gray-500 dark:text-gray-400">
                                                    {report.lastActivity.time}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="whitespace-nowrap px-6 py-4">
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => viewReport(report.id)}
                                                    className="rounded-lg bg-red-50 px-3 py-1.5 text-sm font-medium text-red-700 transition-colors hover:bg-red-100 dark:bg-red-900/30 dark:text-red-300 dark:hover:bg-red-900/50"
                                                >
                                                    View
                                                </button>
                                                {(report.status === 'pending' || report.status === 'rejected') && (
                                                    <button
                                                        onClick={() => editReport(report.id)}
                                                        className="rounded-lg bg-gray-50 px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                                                    >
                                                        Edit
                                                    </button>
                                                )}
                                                {report.status === 'completed' && (
                                                    <button
                                                        onClick={() => downloadReport(report.id)}
                                                        className="rounded-lg bg-red-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800"
                                                    >
                                                        Download
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    <div className="border-t border-gray-200 px-6 py-4 dark:border-gray-800">
                        <div className="flex items-center justify-between">
                            <div className="text-sm text-gray-700 dark:text-gray-400">
                                Showing 1 to 6 of {reports.length} entries
                            </div>
                            <div className="flex gap-1">
                                <button className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700">
                                    &laquo; Previous
                                </button>
                                <button className="rounded-lg bg-red-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700">
                                    1
                                </button>
                                <button className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700">
                                    2
                                </button>
                                <button className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700">
                                    3
                                </button>
                                <button className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700">
                                    Next &raquo;
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}