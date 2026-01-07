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
    id: number;
    title: string;
    creator_id: number;
    reviewer_id: number | null;
    status: 'draft' | 'submitted' | 'in_review' | 'approved' | 'rejected' | 'closed';
    creation_date: string;
    submission_date: string | null;
    json_data: any;
    inspector_id: number | null;
    signed_at: string | null;
}

interface DashboardStats {
    totalReports: number;
    pendingReview: number;
    completed: number;
    thisWeek: number;
    inReview: number;
    draft: number;
}

export default function Dashboard() {
    const { auth, reports: initialReports = [] } = usePage().props as any;
    const [reports, setReports] = useState<Report[]>(initialReports);
    const [filteredReports, setFilteredReports] = useState<Report[]>(initialReports);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [chartFilter, setChartFilter] = useState<'week' | 'month'>('week');

    // ✅ FIX: keep state synced when Inertia sends new props
    useEffect(() => {
        setReports(initialReports);
        setFilteredReports(initialReports);
    }, [initialReports]);

    // Calculate statistics from actual data
    const calculateStats = (reports: Report[]): DashboardStats => {
        const totalReports = reports.length;
        const pendingReview = reports.filter(r => r.status === 'submitted').length;
        const inReview = reports.filter(r => r.status === 'in_review').length;
        const draft = reports.filter(r => r.status === 'draft').length;
        const completed = reports.filter(r => ['approved', 'closed'].includes(r.status)).length;
        
        // Calculate this week's reports
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        const thisWeek = reports.filter(r => {
            const reportDate = new Date(r.creation_date);
            return reportDate >= oneWeekAgo;
        }).length;

        return {
            totalReports,
            pendingReview,
            inReview,
            draft,
            completed,
            thisWeek
        };
    };

    const stats = calculateStats(reports);

    // ✅ FIX: real chart data (no random)
    const isCompleted = (r: Report) => ['approved', 'closed'].includes(r.status);

    const getCompletedDate = (r: Report) => {
        // if you store completion moment in signed_at, use it; else fallback
        return r.signed_at ?? r.creation_date;
    };

    const startOfDay = (d: Date) => {
        const x = new Date(d);
        x.setHours(0, 0, 0, 0);
        return x;
    };

    const sameDay = (a: Date, b: Date) =>
        a.getFullYear() === b.getFullYear() &&
        a.getMonth() === b.getMonth() &&
        a.getDate() === b.getDate();

    // Prepare chart data based on actual report dates
    const prepareChartData = () => {
        const today = startOfDay(new Date());
        const days = chartFilter === 'week' ? 7 : 30;

        const rangeDates = Array.from({ length: days }, (_, i) => {
            const d = new Date(today);
            d.setDate(d.getDate() - (days - 1 - i));
            return d;
        });

        const labels = rangeDates.map(d =>
            chartFilter === 'week'
                ? d.toLocaleDateString('en-US', { weekday: 'short' })
                : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        );

        const reportsCreated = rangeDates.map(d =>
            reports.filter(r => sameDay(startOfDay(new Date(r.creation_date)), d)).length
        );

        const reportsCompleted = rangeDates.map(d =>
            reports.filter(r => isCompleted(r) && sameDay(startOfDay(new Date(getCompletedDate(r))), d)).length
        );

        return {
            labels,
            datasets: [
                {
                    label: 'Reports Created',
                    data: reportsCreated,
                    backgroundColor: 'rgba(220, 38, 38, 0.8)', // Red-600
                    borderColor: 'rgb(185, 28, 28)', // Red-700
                    borderWidth: 1,
                },
                {
                    label: 'Reports Completed',
                    data: reportsCompleted,
                    backgroundColor: 'rgba(107, 114, 128, 0.8)', // Gray-500
                    borderColor: 'rgb(75, 85, 99)', // Gray-600
                    borderWidth: 1,
                },
            ],
        };
    };

    const chartData = prepareChartData();

    // ✅ FIX: real totals for the mini summary (no *0.7)
    const createdTotalInRange = (chartData.datasets?.[0]?.data || []).reduce((a: number, b: any) => a + Number(b), 0);
    const completedTotalInRange = (chartData.datasets?.[1]?.data || []).reduce((a: number, b: any) => a + Number(b), 0);

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
                text: chartFilter === 'week' ? 'Report Activity - Last 7 Days' : 'Report Activity - Last 30 Days',
                color: '#ffffff',
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
                    color: '#6B7280',
                },
                grid: {
                    color: 'rgba(229, 231, 235, 0.5)',
                },
            },
            x: {
                ticks: {
                    color: '#6B7280',
                },
                grid: {
                    color: 'rgba(229, 231, 235, 0.5)',
                },
            },
        },
    };

    const getStatusBadge = (status: Report['status']) => {
        const baseClasses = "px-2 py-1 rounded-full text-xs font-semibold";
        switch (status) {
            case 'draft':
                return `${baseClasses} bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300`;
            case 'submitted':
                return `${baseClasses} bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300`;
            case 'in_review':
                return `${baseClasses} bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300`;
            case 'approved':
                return `${baseClasses} bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300`;
            case 'rejected':
                return `${baseClasses} bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300`;
            case 'closed':
                return `${baseClasses} bg-gray-800 text-white dark:bg-gray-900 dark:text-gray-100`;
            default:
                return `${baseClasses} bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300`;
        }
    };

    const getStatusText = (status: Report['status']) => {
        switch (status) {
            case 'draft':
                return 'Draft';
            case 'submitted':
                return 'Submitted';
            case 'in_review':
                return 'In Review';
            case 'approved':
                return 'Approved';
            case 'rejected':
                return 'Rejected';
            case 'closed':
                return 'Closed';
            default:
                return 'Unknown';
        }
    };

    const filterReports = () => {
        let filtered = [...reports];
        
        if (searchTerm) {
            filtered = filtered.filter(report => 
                report.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                report.id.toString().includes(searchTerm)
            );
        }
        
        if (statusFilter !== 'all') {
            filtered = filtered.filter(report => report.status === statusFilter);
        }
        
        setFilteredReports(filtered);
    };

    useEffect(() => {
        filterReports();
    }, [searchTerm, statusFilter, reports]);

    const formatDate = (dateString: string) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    // Get a short preview of the report title
    const getShortTitle = (title: string) => {
        return title.length > 50 ? title.substring(0, 50) + '...' : title;
    };

    // Get equipment info from JSON data
    const getEquipmentInfo = (report: Report) => {
        try {
            const jsonData = JSON.parse(report.json_data);
            return {
                name: jsonData.equipmentType || 'Equipment',
                tag: jsonData.equipmentTag || 'N/A'
            };
        } catch {
            return {
                name: 'Equipment',
                tag: 'N/A'
            };
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />
            
            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl p-6 bg-gradient-to-b from-transparent to-gray-50 dark:to-gray-900">
                {/* Welcome Message */}
                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                        Welcome back, <span className="text-red-600 dark:text-red-500">{auth.user.name}</span>!
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400">
                        {reports.length > 0 
                            ? `You have ${reports.length} reports in the system`
                            : 'No reports found. Create your first report to get started.'}
                    </p>
                </div>

                {/* Statistics Dashboard */}
                <div className="mb-8">
                    <h2 className="mb-4 text-xl font-semibold text-gray-800 dark:text-white">
                        Statistics Overview
                    </h2>
                    
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
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

                        {/* Draft Reports Card */}
                        <div className="rounded-xl bg-gradient-to-br from-gray-600 to-gray-700 p-5 text-white shadow-lg transition-transform duration-200 hover:scale-[1.02]">
                            <div className="flex items-center gap-4">
                                <div className="rounded-lg bg-white/20 p-3 backdrop-blur-sm">
                                    <span className="text-2xl">📝</span>
                                </div>
                                <div>
                                    <h3 className="text-3xl font-bold">{stats.draft}</h3>
                                    <p className="text-gray-100">Draft Reports</p>
                                </div>
                            </div>
                        </div>

                        {/* Pending Review Card */}
                        <div className="rounded-xl bg-gradient-to-br from-amber-600 to-amber-700 p-5 text-white shadow-lg transition-transform duration-200 hover:scale-[1.02]">
                            <div className="flex items-center gap-4">
                                <div className="rounded-lg bg-white/20 p-3 backdrop-blur-sm">
                                    <span className="text-2xl">⏳</span>
                                </div>
                                <div>
                                    <h3 className="text-3xl font-bold">{stats.pendingReview}</h3>
                                    <p className="text-amber-100">Submitted</p>
                                </div>
                            </div>
                        </div>

                        {/* In Review Card */}
                        <div className="rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 p-5 text-white shadow-lg transition-transform duration-200 hover:scale-[1.02]">
                            <div className="flex items-center gap-4">
                                <div className="rounded-lg bg-white/20 p-3 backdrop-blur-sm">
                                    <span className="text-2xl">👁️</span>
                                </div>
                                <div>
                                    <h3 className="text-3xl font-bold">{stats.inReview}</h3>
                                    <p className="text-blue-100">In Review</p>
                                </div>
                            </div>
                        </div>

                        {/* Completed Reports Card */}
                        <div className="rounded-xl bg-gradient-to-br from-emerald-600 to-emerald-700 p-5 text-white shadow-lg transition-transform duration-200 hover:scale-[1.02]">
                            <div className="flex items-center gap-4">
                                <div className="rounded-lg bg-white/20 p-3 backdrop-blur-sm">
                                    <span className="text-2xl">✅</span>
                                </div>
                                <div>
                                    <h3 className="text-3xl font-bold">{stats.completed}</h3>
                                    <p className="text-emerald-100">Completed</p>
                                </div>
                            </div>
                        </div>

                        {/* This Week Card */}
                        <div className="rounded-xl bg-gradient-to-br from-purple-600 to-purple-700 p-5 text-white shadow-lg transition-transform duration-200 hover:scale-[1.02]">
                            <div className="flex items-center gap-4">
                                <div className="rounded-lg bg-white/20 p-3 backdrop-blur-sm">
                                    <span className="text-2xl">📅</span>
                                </div>
                                <div>
                                    <h3 className="text-3xl font-bold">{stats.thisWeek}</h3>
                                    <p className="text-purple-100">This Week</p>
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
                                                <span className="font-semibold text-gray-900 dark:text-white">
                                                    {createdTotalInRange}
                                                </span>
                                            </div>
                                            <div className="h-4 w-px bg-gray-200 dark:bg-gray-700"></div>
                                            <div className="flex items-center gap-2">
                                                <div className="h-3 w-3 rounded-full bg-gray-500"></div>
                                                <span className="text-gray-600 dark:text-gray-400">Completed</span>
                                                <span className="font-semibold text-gray-900 dark:text-white">
                                                    {completedTotalInRange}
                                                </span>
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
                                        <span className="text-sm font-medium text-gray-900 dark:text-white">(Total: {stats.totalReports})</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="h-3 w-3 rounded-full bg-gray-500"></div>
                                        <span className="text-sm text-gray-600 dark:text-gray-400">Reports Completed</span>
                                        <span className="text-sm font-medium text-gray-900 dark:text-white">(Total: {stats.completed})</span>
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

                                <Link 
                                    href="/reports"
                                    className="group flex w-full items-center justify-between rounded-xl border border-blue-200/50 bg-white p-4 transition-all hover:border-blue-300 hover:bg-blue-50/50 hover:shadow-md hover:shadow-blue-200/30 dark:border-blue-900/30 dark:bg-gray-800 dark:hover:border-blue-800 dark:hover:bg-blue-900/20 dark:hover:shadow-blue-900/20"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white group-hover:from-blue-600 group-hover:to-blue-700 transition-all">
                                            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                            </svg>
                                        </div>
                                        <div>
                                            <h4 className="font-semibold text-gray-900 dark:text-white">View All Reports</h4>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">Browse all inspection reports</p>
                                        </div>
                                    </div>
                                    <svg className="h-5 w-5 text-gray-400 group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                </Link>

                                <Link 
                                    href="/reports?status=in_review"
                                    className="group flex w-full items-center justify-between rounded-xl border border-amber-200/50 bg-white p-4 transition-all hover:border-amber-300 hover:bg-amber-50/50 hover:shadow-md hover:shadow-amber-200/30 dark:border-amber-900/30 dark:bg-gray-800 dark:hover:border-amber-800 dark:hover:bg-amber-900/20 dark:hover:shadow-amber-900/20"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-amber-500 to-amber-600 text-white group-hover:from-amber-600 group-hover:to-amber-700 transition-all">
                                            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                            </svg>
                                        </div>
                                        <div>
                                            <h4 className="font-semibold text-gray-900 dark:text-white">Pending Review ({stats.inReview + stats.pendingReview})</h4>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">Review pending reports</p>
                                        </div>
                                    </div>
                                    <svg className="h-5 w-5 text-gray-400 group-hover:text-amber-500 dark:group-hover:text-amber-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                </Link>

                                <Link 
                                    href="/export"
                                    className="group flex w-full items-center justify-between rounded-xl border border-emerald-200/50 bg-white p-4 transition-all hover:border-emerald-300 hover:bg-emerald-50/50 hover:shadow-md hover:shadow-emerald-200/30 dark:border-emerald-900/30 dark:bg-gray-800 dark:hover:border-emerald-800 dark:hover:bg-emerald-900/20 dark:hover:shadow-emerald-900/20"
                                >
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
                                            <span className="font-medium">Tip:</span> You have {stats.pendingReview} reports submitted and {stats.inReview} reports in review
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Recent Reports Table */}
                <div className="rounded-2xl border border-gray-200 bg-gradient-to-b from-white to-gray-50 p-6 shadow-xl dark:border-gray-800 dark:from-gray-900 dark:to-gray-950">
                    <div className="mb-6 flex items-center justify-between">
                        <div>
                            <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Recent Reports</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Latest inspection reports in the system</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <input
                                type="text"
                                placeholder="Search reports..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                            />
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                            >
                                <option value="all">All Status</option>
                                <option value="draft">Draft</option>
                                <option value="submitted">Submitted</option>
                                <option value="in_review">In Review</option>
                                <option value="approved">Approved</option>
                                <option value="rejected">Rejected</option>
                                <option value="closed">Closed</option>
                            </select>
                        </div>
                    </div>

                    {filteredReports.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-gray-200 dark:border-gray-800">
                                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600 dark:text-gray-400">Report ID</th>
                                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600 dark:text-gray-400">Title</th>
                                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600 dark:text-gray-400">Equipment</th>
                                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600 dark:text-gray-400">Status</th>
                                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600 dark:text-gray-400">Created</th>
                                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600 dark:text-gray-400">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredReports.slice(0, 10).map((report) => {
                                        const equipment = getEquipmentInfo(report);
                                        return (
                                            <tr key={report.id} className="border-b border-gray-100 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-800/50">
                                                <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                                                    RPT-{new Date(report.creation_date).getFullYear()}-{report.id}
                                                </td>
                                                <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                                                    {getShortTitle(report.title)}
                                                </td>
                                                <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                                                    <div>{equipment.name}</div>
                                                    <div className="text-xs text-gray-500 dark:text-gray-400">Tag: {equipment.tag}</div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className={getStatusBadge(report.status)}>
                                                        {getStatusText(report.status)}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                                                    {formatDate(report.creation_date)}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <Link 
                                                        href={`/reports/${report.id}`}
                                                        className="rounded-lg bg-red-600 px-3 py-1 text-xs font-semibold text-white hover:bg-red-700"
                                                    >
                                                        View
                                                    </Link>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="py-12 text-center">
                            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
                                <svg className="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                            </div>
                            <h4 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">No Reports Found</h4>
                            <p className="text-gray-600 dark:text-gray-400">
                                {searchTerm || statusFilter !== 'all' 
                                    ? 'Try adjusting your search or filter criteria'
                                    : 'Create your first report to get started'}
                            </p>
                        </div>
                    )}

                    {filteredReports.length > 10 && (
                        <div className="mt-6 text-center">
                            <Link 
                                href="/reports" 
                                className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                            >
                                View All Reports
                                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
