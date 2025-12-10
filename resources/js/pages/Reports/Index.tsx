import AppLayout from '@/layouts/app-layout';
import { Head, Link } from '@inertiajs/react';
import { type BreadcrumbItem } from '@/types';
import { useState } from 'react';
import { 
  FileText, 
  Download, 
  Eye, 
  Edit, 
  Filter, 
  Search, 
  Calendar, 
  Users, 
  BarChart3,
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle,
  MoreVertical,
  ChevronRight,
  Plus
} from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Reports',
        href: '/reports',
    },
];

interface Report {
    id: string;
    title: string;
    equipment: string;
    equipmentTag: string;
    status: 'draft' | 'submitted' | 'in_review' | 'approved' | 'rejected';
    priority: 'low' | 'medium' | 'high' | 'critical';
    createdBy: string;
    createdAt: string;
    lastUpdated: string;
    reviewer: string;
    dueDate: string;
}

export default function Report() {
    const [activeTab, setActiveTab] = useState<'all' | 'draft' | 'in_review' | 'approved' | 'rejected'>('all');
    const [searchQuery, setSearchQuery] = useState('');
    
    const reports: Report[] = [
        {
            id: 'RPT-2025-001',
            title: 'Pressure Vessel Inspection - V-101',
            equipment: 'Pressure Vessel',
            equipmentTag: 'V-101',
            status: 'approved',
            priority: 'high',
            createdBy: 'John Doe',
            createdAt: '2025-01-15',
            lastUpdated: '2 hours ago',
            reviewer: 'Jane Smith',
            dueDate: '2025-01-20',
        },
        {
            id: 'RPT-2025-002',
            title: 'Heat Exchanger Maintenance Report',
            equipment: 'Heat Exchanger',
            equipmentTag: 'HE-205',
            status: 'in_review',
            priority: 'medium',
            createdBy: 'Mike Johnson',
            createdAt: '2025-01-14',
            lastUpdated: '5 hours ago',
            reviewer: 'Sarah Lee',
            dueDate: '2025-01-18',
        },
        {
            id: 'RPT-2025-003',
            title: 'Reactor Safety Inspection',
            equipment: 'Reactor',
            equipmentTag: 'R-301',
            status: 'draft',
            priority: 'critical',
            createdBy: 'Emily Wong',
            createdAt: '2025-01-13',
            lastUpdated: '1 day ago',
            reviewer: 'David Chen',
            dueDate: '2025-01-17',
        },
        {
            id: 'RPT-2025-004',
            title: 'Separator Performance Analysis',
            equipment: 'Separator',
            equipmentTag: 'S-110',
            status: 'rejected',
            priority: 'medium',
            createdBy: 'Robert Kim',
            createdAt: '2025-01-12',
            lastUpdated: '2 days ago',
            reviewer: 'Lisa Wang',
            dueDate: '2025-01-16',
        },
        {
            id: 'RPT-2025-005',
            title: 'Accumulator Pressure Test',
            equipment: 'Accumulator',
            equipmentTag: 'A-402',
            status: 'submitted',
            priority: 'low',
            createdBy: 'Alex Turner',
            createdAt: '2025-01-11',
            lastUpdated: '3 days ago',
            reviewer: 'Mark Davis',
            dueDate: '2025-01-15',
        },
    ];

    const filteredReports = reports.filter(report => {
        if (activeTab !== 'all' && report.status !== activeTab) return false;
        if (searchQuery) {
            return report.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                   report.equipment.toLowerCase().includes(searchQuery.toLowerCase()) ||
                   report.equipmentTag.toLowerCase().includes(searchQuery.toLowerCase()) ||
                   report.createdBy.toLowerCase().includes(searchQuery.toLowerCase());
        }
        return true;
    });

    const stats = {
        total: reports.length,
        draft: reports.filter(r => r.status === 'draft').length,
        in_review: reports.filter(r => r.status === 'in_review').length,
        approved: reports.filter(r => r.status === 'approved').length,
        rejected: reports.filter(r => r.status === 'rejected').length,
    };

    const getStatusColor = (status: Report['status']) => {
        switch (status) {
            case 'draft': return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
            case 'submitted': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
            case 'in_review': return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300';
            case 'approved': return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300';
            case 'rejected': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
            default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
        }
    };

    const getPriorityColor = (priority: Report['priority']) => {
        switch (priority) {
            case 'low': return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
            case 'medium': return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300';
            case 'high': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300';
            case 'critical': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
            default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Reports Management" />

            <div className="space-y-6 px-10 py-6 bg-gradient-to-b from-transparent to-gray-50 dark:to-gray-900">
                {/* Header Section */}
                <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
                            Reports Management
                        </h1>
                        <p className="mt-1 text-gray-600 dark:text-gray-400">
                            View, edit, and manage all inspection reports
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                        <Link
                            href="/reports/create"
                            className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-red-600 to-red-700 px-4 py-2.5 text-sm font-semibold text-white transition-all hover:from-red-700 hover:to-red-800 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                        >
                            <Plus className="h-4 w-4" />
                            Create New Report
                        </Link>
                    </div>
                </div>

                {/* Stats Overview */}
                <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
                    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Total Reports</p>
                                <p className="text-2xl font-bold text-gray-800 dark:text-white">{stats.total}</p>
                            </div>
                            <FileText className="h-8 w-8 text-gray-400" />
                        </div>
                    </div>
                    
                    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">In Draft</p>
                                <p className="text-2xl font-bold text-gray-800 dark:text-white">{stats.draft}</p>
                            </div>
                            <Edit className="h-8 w-8 text-gray-400" />
                        </div>
                    </div>
                    
                    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">In Review</p>
                                <p className="text-2xl font-bold text-gray-800 dark:text-white">{stats.in_review}</p>
                            </div>
                            <Eye className="h-8 w-8 text-amber-500" />
                        </div>
                    </div>
                    
                    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Approved</p>
                                <p className="text-2xl font-bold text-gray-800 dark:text-white">{stats.approved}</p>
                            </div>
                            <CheckCircle className="h-8 w-8 text-emerald-500" />
                        </div>
                    </div>
                    
                    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Rejected</p>
                                <p className="text-2xl font-bold text-gray-800 dark:text-white">{stats.rejected}</p>
                            </div>
                            <XCircle className="h-8 w-8 text-red-500" />
                        </div>
                    </div>
                </div>

                {/* Filters and Search */}
                <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
                    <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                        {/* Status Tabs */}
                        <div className="flex flex-wrap gap-2">
                            <button
                                onClick={() => setActiveTab('all')}
                                className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                                    activeTab === 'all'
                                        ? 'bg-red-600 text-white'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
                                }`}
                            >
                                All ({stats.total})
                            </button>
                            <button
                                onClick={() => setActiveTab('draft')}
                                className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                                    activeTab === 'draft'
                                        ? 'bg-gray-600 text-white dark:bg-gray-700'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
                                }`}
                            >
                                Draft ({stats.draft})
                            </button>
                            <button
                                onClick={() => setActiveTab('in_review')}
                                className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                                    activeTab === 'in_review'
                                        ? 'bg-amber-600 text-white'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
                                }`}
                            >
                                In Review ({stats.in_review})
                            </button>
                            <button
                                onClick={() => setActiveTab('approved')}
                                className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                                    activeTab === 'approved'
                                        ? 'bg-emerald-600 text-white'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
                                }`}
                            >
                                Approved ({stats.approved})
                            </button>
                            <button
                                onClick={() => setActiveTab('rejected')}
                                className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                                    activeTab === 'rejected'
                                        ? 'bg-red-600 text-white'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
                                }`}
                            >
                                Rejected ({stats.rejected})
                            </button>
                        </div>

                        {/* Search and Filters */}
                        <div className="flex flex-col gap-3 sm:flex-row">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search reports..."
                                    className="w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-10 pr-4 text-sm focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                            <button className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700">
                                <Filter className="h-4 w-4" />
                                More Filters
                            </button>
                        </div>
                    </div>
                </div>

                {/* Reports Table */}
                <div className="rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 dark:bg-gray-800">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-700 dark:text-gray-300">
                                        Report Details
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-700 dark:text-gray-300">
                                        Status
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-700 dark:text-gray-300">
                                        Priority
                                    </th>
                                    <th className="px6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-700 dark:text-gray-300">
                                        Created
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-700 dark:text-gray-300">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-800 dark:bg-gray-900">
                                {filteredReports.map((report) => (
                                    <tr key={report.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <FileText className="h-4 w-4 text-gray-400" />
                                                    <div>
                                                        <h4 className="font-semibold text-gray-900 dark:text-white">
                                                            {report.title}
                                                        </h4>
                                                        <div className="mt-1 flex flex-wrap items-center gap-3 text-sm">
                                                            <span className="text-gray-600 dark:text-gray-400">
                                                                {report.equipment} • {report.equipmentTag}
                                                            </span>
                                                            <span className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
                                                                <Users className="h-3 w-3" />
                                                                {report.createdBy}
                                                            </span>
                                                            <span className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
                                                                <Calendar className="h-3 w-3" />
                                                                Due: {report.dueDate}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="mt-2 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                                                    <Clock className="h-3 w-3" />
                                                    Last updated {report.lastUpdated} • Reviewer: {report.reviewer}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium ${getStatusColor(report.status)}`}>
                                                {report.status === 'in_review' && <Eye className="h-3 w-3" />}
                                                {report.status === 'approved' && <CheckCircle className="h-3 w-3" />}
                                                {report.status === 'rejected' && <XCircle className="h-3 w-3" />}
                                                {report.status === 'draft' && <Edit className="h-3 w-3" />}
                                                {report.status.charAt(0).toUpperCase() + report.status.slice(1)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium ${getPriorityColor(report.priority)}`}>
                                                {report.priority === 'critical' && <AlertCircle className="h-3 w-3" />}
                                                {report.priority.charAt(0).toUpperCase() + report.priority.slice(1)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                                            {report.createdAt}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <Link
                                                    href={`/reports/${report.id}`}
                                                    className="inline-flex items-center gap-1 rounded-lg bg-red-50 px-3 py-1.5 text-sm font-medium text-red-700 transition-colors hover:bg-red-100 dark:bg-red-900/30 dark:text-red-300 dark:hover:bg-red-900/50"
                                                >
                                                    <Eye className="h-3 w-3" />
                                                    View
                                                </Link>
                                                <Link
                                                    href={`/reports/${report.id}/edit`}
                                                    className="inline-flex items-center gap-1 rounded-lg bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                                                >
                                                    <Edit className="h-3 w-3" />
                                                    Edit
                                                </Link>
                                                <button className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300">
                                                    <MoreVertical className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Empty State */}
                    {filteredReports.length === 0 && (
                        <div className="p-12 text-center">
                            <FileText className="mx-auto h-12 w-12 text-gray-400" />
                            <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
                                No reports found
                            </h3>
                            <p className="mt-2 text-gray-600 dark:text-gray-400">
                                {searchQuery ? 'Try a different search term' : 'Create your first report to get started'}
                            </p>
                            {!searchQuery && (
                                <Link
                                    href="/reports/create"
                                    className="mt-4 inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-700"
                                >
                                    <Plus className="h-4 w-4" />
                                    Create New Report
                                </Link>
                            )}
                        </div>
                    )}

                    {/* Pagination */}
                    <div className="border-t border-gray-200 px-6 py-4 dark:border-gray-800">
                        <div className="flex items-center justify-between">
                            <div className="text-sm text-gray-700 dark:text-gray-400">
                                Showing {filteredReports.length} of {reports.length} reports
                            </div>
                            <div className="flex gap-2">
                                <button className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700">
                                    Previous
                                </button>
                                <button className="rounded-lg bg-red-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700">
                                    1
                                </button>
                                <button className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700">
                                    2
                                </button>
                                <button className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700">
                                    Next
                                    <ChevronRight className="ml-1 inline h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Quick Stats & Recent Activity */}
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    {/* Recent Activity */}
                    <div className="lg:col-span-2 rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
                        <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
                            Recent Activity
                        </h3>
                        <div className="space-y-4">
                            {[
                                { action: 'John Doe created report RPT-2025-001', time: '2 hours ago', icon: Plus },
                                { action: 'Jane Smith reviewed report RPT-2025-002', time: '5 hours ago', icon: Eye },
                                { action: 'Mike Johnson submitted report RPT-2025-003', time: '1 day ago', icon: CheckCircle },
                                { action: 'Report RPT-2025-004 was rejected by Lisa Wang', time: '2 days ago', icon: XCircle },
                            ].map((activity, index) => (
                                <div key={index} className="flex items-center gap-3 border-b border-gray-100 pb-4 last:border-0 dark:border-gray-800">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800">
                                        <activity.icon className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm text-gray-900 dark:text-white">{activity.action}</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">{activity.time}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
                        <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
                            Quick Actions
                        </h3>
                        <div className="space-y-3">
                            <Link
                                href="/reports/templates"
                                className="flex w-full items-center justify-between rounded-lg border border-gray-200 bg-white p-3 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700"
                            >
                                <span className="text-sm font-medium text-gray-900 dark:text-white">
                                    Browse Templates
                                </span>
                                <ChevronRight className="h-4 w-4 text-gray-400" />
                            </Link>
                            <button className="flex w-full items-center justify-between rounded-lg border border-gray-200 bg-white p-3 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700">
                                <span className="text-sm font-medium text-gray-900 dark:text-white">
                                    Generate Analytics
                                </span>
                                <BarChart3 className="h-4 w-4 text-gray-400" />
                            </button>
                            <button className="flex w-full items-center justify-between rounded-lg border border-gray-200 bg-white p-3 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700">
                                <span className="text-sm font-medium text-gray-900 dark:text-white">
                                    Bulk Operations
                                </span>
                                <ChevronRight className="h-4 w-4 text-gray-400" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}