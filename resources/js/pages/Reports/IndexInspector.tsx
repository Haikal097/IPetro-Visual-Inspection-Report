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
  User, 
  BarChart3,
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle,
  MoreVertical,
  ChevronRight,
  Plus,
  Printer,
  FileJson,
  Database,
  Upload,
  HardHat,
  FolderOpen,
  Archive,
  Share2,
  Copy,
  Trash2,
  Save,
  RefreshCw,
  Layers
} from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'My Reports',
        href: '/reports',
    },
];

interface Report {
    id: string;
    title: string;
    equipment: string;
    equipmentTag: string;
    status: 'draft' | 'submitted' | 'in_review' | 'approved' | 'rejected' | 'archived';
    priority: 'low' | 'medium' | 'high' | 'critical';
    createdBy: string;
    createdAt: string;
    lastUpdated: string;
    reviewer: string;
    dueDate: string;
    progress: number; // Progress percentage (0-100)
    wordCount: number;
    attachments: number;
}

export default function Report() {
    const [activeTab, setActiveTab] = useState<'all' | 'draft' | 'submitted' | 'in_review' | 'approved' | 'archived'>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
    
    const reports: Report[] = [
        {
            id: 'RPT-2025-001',
            title: 'Pressure Vessel Inspection - V-101',
            equipment: 'Pressure Vessel',
            equipmentTag: 'V-101',
            status: 'approved',
            priority: 'high',
            createdBy: 'You',
            createdAt: '2025-01-15',
            lastUpdated: '2 hours ago',
            reviewer: 'Jane Smith',
            dueDate: '2025-01-20',
            progress: 100,
            wordCount: 2450,
            attachments: 3,
        },
        {
            id: 'RPT-2025-002',
            title: 'Heat Exchanger Maintenance Report',
            equipment: 'Heat Exchanger',
            equipmentTag: 'HE-205',
            status: 'in_review',
            priority: 'medium',
            createdBy: 'You',
            createdAt: '2025-01-14',
            lastUpdated: '5 hours ago',
            reviewer: 'Sarah Lee',
            dueDate: '2025-01-18',
            progress: 85,
            wordCount: 3200,
            attachments: 5,
        },
        {
            id: 'RPT-2025-003',
            title: 'Reactor Safety Inspection',
            equipment: 'Reactor',
            equipmentTag: 'R-301',
            status: 'draft',
            priority: 'critical',
            createdBy: 'You',
            createdAt: '2025-01-13',
            lastUpdated: '1 day ago',
            reviewer: 'Not Assigned',
            dueDate: '2025-01-17',
            progress: 45,
            wordCount: 1200,
            attachments: 2,
        },
        {
            id: 'RPT-2025-004',
            title: 'Separator Performance Analysis',
            equipment: 'Separator',
            equipmentTag: 'S-110',
            status: 'rejected',
            priority: 'medium',
            createdBy: 'You',
            createdAt: '2025-01-12',
            lastUpdated: '2 days ago',
            reviewer: 'Lisa Wang',
            dueDate: '2025-01-16',
            progress: 100,
            wordCount: 2800,
            attachments: 4,
        },
        {
            id: 'RPT-2025-005',
            title: 'Accumulator Pressure Test',
            equipment: 'Accumulator',
            equipmentTag: 'A-402',
            status: 'submitted',
            priority: 'low',
            createdBy: 'You',
            createdAt: '2025-01-11',
            lastUpdated: '3 days ago',
            reviewer: 'Mark Davis',
            dueDate: '2025-01-15',
            progress: 100,
            wordCount: 1800,
            attachments: 3,
        },
        {
            id: 'RPT-2025-006',
            title: 'Nitrogen Vessel Inspection',
            equipment: 'Storage Vessel',
            equipmentTag: 'N-550',
            status: 'archived',
            priority: 'medium',
            createdBy: 'You',
            createdAt: '2024-12-20',
            lastUpdated: '2 weeks ago',
            reviewer: 'John Doe',
            dueDate: '2024-12-30',
            progress: 100,
            wordCount: 2100,
            attachments: 6,
        },
    ];

    const filteredReports = reports.filter(report => {
        if (activeTab !== 'all' && report.status !== activeTab) return false;
        if (searchQuery) {
            return report.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                   report.equipment.toLowerCase().includes(searchQuery.toLowerCase()) ||
                   report.equipmentTag.toLowerCase().includes(searchQuery.toLowerCase());
        }
        return true;
    });

    const stats = {
        total: reports.length,
        draft: reports.filter(r => r.status === 'draft').length,
        submitted: reports.filter(r => r.status === 'submitted').length,
        in_review: reports.filter(r => r.status === 'in_review').length,
        approved: reports.filter(r => r.status === 'approved').length,
        rejected: reports.filter(r => r.status === 'rejected').length,
        archived: reports.filter(r => r.status === 'archived').length,
    };

    const getStatusColor = (status: Report['status']) => {
        switch (status) {
            case 'draft': return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
            case 'submitted': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
            case 'in_review': return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300';
            case 'approved': return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300';
            case 'rejected': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
            case 'archived': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300';
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

    const getStatusIcon = (status: Report['status']) => {
        switch (status) {
            case 'draft': return <Edit className="h-3 w-3" />;
            case 'submitted': return <Upload className="h-3 w-3" />;
            case 'in_review': return <Eye className="h-3 w-3" />;
            case 'approved': return <CheckCircle className="h-3 w-3" />;
            case 'rejected': return <XCircle className="h-3 w-3" />;
            case 'archived': return <Archive className="h-3 w-3" />;
            default: return <FileText className="h-3 w-3" />;
        }
    };

    const handleExportAll = () => {
        // Export all reports as ZIP or JSON
    };

    const handleDuplicate = (reportId: string) => {
        // Duplicate report logic
    };

    const handleArchive = (reportId: string) => {
        // Archive report logic
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="My Reports - iPETRO" />

            <div className="space-y-6 px-10 py-6 bg-gradient-to-b from-transparent to-gray-50/50 dark:to-gray-900/50">
                {/* Header Section */}
                <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-3">
                            <HardHat className="h-7 w-7 text-red-600" />
                            My Inspection Reports
                        </h1>
                        <p className="mt-1 text-gray-600 dark:text-gray-400">
                            Create, manage, and track all your inspection reports
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                        <button
                            onClick={() => setViewMode(viewMode === 'list' ? 'grid' : 'list')}
                            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition-all hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                        >
                            {viewMode === 'list' ? (
                                <>
                                    <Layers className="h-4 w-4" />
                                    Grid View
                                </>
                            ) : (
                                <>
                                    <FileText className="h-4 w-4" />
                                    List View
                                </>
                            )}
                        </button>
                        <button
                            onClick={handleExportAll}
                            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition-all hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                        >
                            <Download className="h-4 w-4" />
                            Export All
                        </button>
                        <Link
                            href="/pv-report"
                            className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-red-600 to-red-700 px-4 py-2.5 text-sm font-semibold text-white transition-all hover:from-red-700 hover:to-red-800 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                        >
                            <Plus className="h-4 w-4" />
                            New Report
                        </Link>
                    </div>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-2 gap-4 md:grid-cols-7">
                    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Total</p>
                                <p className="text-2xl font-bold text-gray-800 dark:text-white">{stats.total}</p>
                            </div>
                            <FileText className="h-8 w-8 text-gray-400" />
                        </div>
                    </div>
                    
                    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Drafts</p>
                                <p className="text-2xl font-bold text-gray-800 dark:text-white">{stats.draft}</p>
                            </div>
                            <Edit className="h-8 w-8 text-gray-500" />
                        </div>
                    </div>
                    
                    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Submitted</p>
                                <p className="text-2xl font-bold text-gray-800 dark:text-white">{stats.submitted}</p>
                            </div>
                            <Upload className="h-8 w-8 text-blue-500" />
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
                    
                    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Archived</p>
                                <p className="text-2xl font-bold text-gray-800 dark:text-white">{stats.archived}</p>
                            </div>
                            <Archive className="h-8 w-8 text-purple-500" />
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
                                className={`inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                                    activeTab === 'all'
                                        ? 'bg-red-600 text-white'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
                                }`}
                            >
                                <FileText className="h-3.5 w-3.5" />
                                All ({stats.total})
                            </button>
                            <button
                                onClick={() => setActiveTab('draft')}
                                className={`inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                                    activeTab === 'draft'
                                        ? 'bg-gray-600 text-white dark:bg-gray-700'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
                                }`}
                            >
                                <Edit className="h-3.5 w-3.5" />
                                Drafts ({stats.draft})
                            </button>
                            <button
                                onClick={() => setActiveTab('submitted')}
                                className={`inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                                    activeTab === 'submitted'
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
                                }`}
                            >
                                <Upload className="h-3.5 w-3.5" />
                                Submitted ({stats.submitted})
                            </button>
                            <button
                                onClick={() => setActiveTab('in_review')}
                                className={`inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                                    activeTab === 'in_review'
                                        ? 'bg-amber-600 text-white'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
                                }`}
                            >
                                <Eye className="h-3.5 w-3.5" />
                                In Review ({stats.in_review})
                            </button>
                            <button
                                onClick={() => setActiveTab('approved')}
                                className={`inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                                    activeTab === 'approved'
                                        ? 'bg-emerald-600 text-white'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
                                }`}
                            >
                                <CheckCircle className="h-3.5 w-3.5" />
                                Approved ({stats.approved})
                            </button>
                            <button
                                onClick={() => setActiveTab('archived')}
                                className={`inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                                    activeTab === 'archived'
                                        ? 'bg-purple-600 text-white'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
                                }`}
                            >
                                <Archive className="h-3.5 w-3.5" />
                                Archived ({stats.archived})
                            </button>
                        </div>

                        {/* Search and Filters */}
                        <div className="flex flex-col gap-3 sm:flex-row">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search my reports..."
                                    className="w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-10 pr-4 text-sm focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                            <button className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700">
                                <Filter className="h-4 w-4" />
                                Filter
                            </button>
                        </div>
                    </div>
                </div>

                {/* Reports Grid/List View */}
                {viewMode === 'grid' ? (
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {filteredReports.map((report) => (
                            <div key={report.id} className="group rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-all hover:shadow-md dark:border-gray-800 dark:bg-gray-900">
                                {/* Header */}
                                <div className="flex items-start justify-between">
                                    <div>
                                        <div className="mb-2 flex items-center gap-2">
                                            <HardHat className="h-5 w-5 text-red-600" />
                                            <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusColor(report.status)}`}>
                                                {getStatusIcon(report.status)}
                                                {report.status.charAt(0).toUpperCase() + report.status.slice(1)}
                                            </span>
                                        </div>
                                        <h4 className="font-semibold text-gray-900 dark:text-white line-clamp-1">
                                            {report.title}
                                        </h4>
                                        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                                            {report.equipment} • {report.equipmentTag}
                                        </p>
                                    </div>
                                    <button className="rounded-lg p-1 text-gray-400 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300">
                                        <MoreVertical className="h-4 w-4" />
                                    </button>
                                </div>

                                {/* Progress Bar */}
                                <div className="mt-4">
                                    <div className="mb-1 flex justify-between text-xs">
                                        <span className="text-gray-600 dark:text-gray-400">Progress</span>
                                        <span className="font-medium text-gray-900 dark:text-white">{report.progress}%</span>
                                    </div>
                                    <div className="h-2 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-800">
                                        <div 
                                            className="h-full rounded-full bg-gradient-to-r from-red-500 to-red-600 transition-all duration-300"
                                            style={{ width: `${report.progress}%` }}
                                        />
                                    </div>
                                </div>

                                {/* Stats */}
                                <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                                    <div className="rounded-lg bg-gray-50 p-2 dark:bg-gray-800">
                                        <div className="text-sm font-medium text-gray-900 dark:text-white">{report.wordCount}</div>
                                        <div className="text-xs text-gray-600 dark:text-gray-400">Words</div>
                                    </div>
                                    <div className="rounded-lg bg-gray-50 p-2 dark:bg-gray-800">
                                        <div className="text-sm font-medium text-gray-900 dark:text-white">{report.attachments}</div>
                                        <div className="text-xs text-gray-600 dark:text-gray-400">Files</div>
                                    </div>
                                    <div className="rounded-lg bg-gray-50 p-2 dark:bg-gray-800">
                                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                                            <span className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs ${getPriorityColor(report.priority)}`}>
                                                {report.priority === 'critical' && <AlertCircle className="h-2.5 w-2.5" />}
                                                {report.priority.charAt(0).toUpperCase() + report.priority.slice(1)}
                                            </span>
                                        </div>
                                        <div className="text-xs text-gray-600 dark:text-gray-400">Priority</div>
                                    </div>
                                </div>

                                {/* Footer */}
                                <div className="mt-5 flex items-center justify-between">
                                    <div className="text-xs text-gray-500 dark:text-gray-400">
                                        <div className="flex items-center gap-1">
                                            <Calendar className="h-3 w-3" />
                                            Due: {report.dueDate}
                                        </div>
                                        <div className="mt-1 flex items-center gap-1">
                                            <Clock className="h-3 w-3" />
                                            Updated {report.lastUpdated}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Link
                                            href={`/reports/${report.id}`}
                                            className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300"
                                            title="View"
                                        >
                                            <Eye className="h-4 w-4" />
                                        </Link>
                                        <Link
                                            href={`/reports/${report.id}/edit`}
                                            className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300"
                                            title="Edit"
                                        >
                                            <Edit className="h-4 w-4" />
                                        </Link>
                                        <button
                                            onClick={() => handleDuplicate(report.id)}
                                            className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300"
                                            title="Duplicate"
                                        >
                                            <Copy className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    /* List View */
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
                                        <th className="px6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-700 dark:text-gray-300">
                                            Progress
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
                                                <div className="flex items-start gap-3">
                                                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-50 dark:bg-red-900/20">
                                                        <HardHat className="h-5 w-5 text-red-600" />
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2">
                                                            <h4 className="font-semibold text-gray-900 dark:text-white">
                                                                {report.title}
                                                            </h4>
                                                            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${getPriorityColor(report.priority)}`}>
                                                                {report.priority === 'critical' && <AlertCircle className="h-2.5 w-2.5" />}
                                                                {report.priority}
                                                            </span>
                                                        </div>
                                                        <div className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                                                            {report.equipment} • {report.equipmentTag}
                                                        </div>
                                                        <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                                                            <span className="flex items-center gap-1">
                                                                <User className="h-3 w-3" />
                                                                {report.createdBy}
                                                            </span>
                                                            <span className="flex items-center gap-1">
                                                                <Calendar className="h-3 w-3" />
                                                                Due: {report.dueDate}
                                                            </span>
                                                            <span className="flex items-center gap-1">
                                                                <FileText className="h-3 w-3" />
                                                                {report.wordCount} words
                                                            </span>
                                                            <span className="flex items-center gap-1">
                                                                <FolderOpen className="h-3 w-3" />
                                                                {report.attachments} files
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium ${getStatusColor(report.status)}`}>
                                                    {getStatusIcon(report.status)}
                                                    {report.status.charAt(0).toUpperCase() + report.status.slice(1)}
                                                </span>
                                                <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                                    Reviewer: {report.reviewer}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="w-32">
                                                    <div className="mb-1 flex justify-between text-xs">
                                                        <span className="text-gray-600 dark:text-gray-400">{report.progress}%</span>
                                                    </div>
                                                    <div className="h-2 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-800">
                                                        <div 
                                                            className="h-full rounded-full bg-gradient-to-r from-red-500 to-red-600 transition-all duration-300"
                                                            style={{ width: `${report.progress}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                                                {report.createdAt}
                                                <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-1">
                                                    <Clock className="h-3 w-3" />
                                                    Updated {report.lastUpdated}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-wrap items-center gap-1">
                                                    <Link
                                                        href={`/reports/${report.id}`}
                                                        className="inline-flex items-center gap-1 rounded-lg bg-red-50 px-2.5 py-1.5 text-xs font-medium text-red-700 transition-colors hover:bg-red-100 dark:bg-red-900/30 dark:text-red-300 dark:hover:bg-red-900/50"
                                                        title="View Report"
                                                    >
                                                        <Eye className="h-3 w-3" />
                                                    </Link>
                                                    <Link
                                                        href={`/reports/${report.id}/edit`}
                                                        className="inline-flex items-center gap-1 rounded-lg bg-gray-100 px-2.5 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                                                        title="Edit Report"
                                                    >
                                                        <Edit className="h-3 w-3" />
                                                    </Link>
                                                    <button
                                                        onClick={() => handleDuplicate(report.id)}
                                                        className="inline-flex items-center gap-1 rounded-lg bg-gray-100 px-2.5 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                                                        title="Duplicate"
                                                    >
                                                        <Copy className="h-3 w-3" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleArchive(report.id)}
                                                        className="inline-flex items-center gap-1 rounded-lg bg-gray-100 px-2.5 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                                                        title="Archive"
                                                    >
                                                        <Archive className="h-3 w-3" />
                                                    </button>
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
                                    {searchQuery ? 'Try a different search term' : 'Create your first inspection report to get started'}
                                </p>
                                {!searchQuery && (
                                    <Link
                                        href="/pv-report"
                                        className="mt-4 inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-700"
                                    >
                                        <Plus className="h-4 w-4" />
                                        Create New Report
                                    </Link>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* Creator Tools */}
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    {/* Quick Actions */}
                    <div className="lg:col-span-2 rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
                        <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                            <HardHat className="h-5 w-5 text-red-600" />
                            Report Tools
                        </h3>
                        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                            <Link
                                href="/reports/templates"
                                className="flex flex-col items-center justify-center rounded-xl border border-gray-200 bg-white p-4 transition-all hover:border-red-300 hover:bg-red-50 dark:border-gray-700 dark:bg-gray-800 dark:hover:border-red-800 dark:hover:bg-red-900/20"
                            >
                                <FileText className="h-6 w-6 text-gray-600 dark:text-gray-400 mb-2" />
                                <span className="text-sm font-medium text-gray-900 dark:text-white">Templates</span>
                                <span className="text-xs text-gray-500 dark:text-gray-400">Start from template</span>
                            </Link>
                            <button
                                onClick={handleExportAll}
                                className="flex flex-col items-center justify-center rounded-xl border border-gray-200 bg-white p-4 transition-all hover:border-blue-300 hover:bg-blue-50 dark:border-gray-700 dark:bg-gray-800 dark:hover:border-blue-800 dark:hover:bg-blue-900/20"
                            >
                                <Download className="h-6 w-6 text-gray-600 dark:text-gray-400 mb-2" />
                                <span className="text-sm font-medium text-gray-900 dark:text-white">Export All</span>
                                <span className="text-xs text-gray-500 dark:text-gray-400">JSON/PDF/ZIP</span>
                            </button>
                            <button className="flex flex-col items-center justify-center rounded-xl border border-gray-200 bg-white p-4 transition-all hover:border-green-300 hover:bg-green-50 dark:border-gray-700 dark:bg-gray-800 dark:hover:border-green-800 dark:hover:bg-green-900/20">
                                <Database className="h-6 w-6 text-gray-600 dark:text-gray-400 mb-2" />
                                <span className="text-sm font-medium text-gray-900 dark:text-white">Backup</span>
                                <span className="text-xs text-gray-500 dark:text-gray-400">Save to database</span>
                            </button>
                            <button className="flex flex-col items-center justify-center rounded-xl border border-gray-200 bg-white p-4 transition-all hover:border-purple-300 hover:bg-purple-50 dark:border-gray-700 dark:bg-gray-800 dark:hover:border-purple-800 dark:hover:bg-purple-900/20">
                                <Archive className="h-6 w-6 text-gray-600 dark:text-gray-400 mb-2" />
                                <span className="text-sm font-medium text-gray-900 dark:text-white">Archive</span>
                                <span className="text-xs text-gray-500 dark:text-gray-400">Manage archives</span>
                            </button>
                        </div>
                    </div>

                    {/* Recent Activity */}
                    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
                        <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
                            Recent Activity
                        </h3>
                        <div className="space-y-4">
                            {[
                                { action: 'You saved draft of RPT-2025-003', time: '1 day ago', icon: Save, color: 'text-blue-500' },
                                { action: 'Submitted RPT-2025-005 for review', time: '3 days ago', icon: Upload, color: 'text-green-500' },
                                { action: 'Report RPT-2025-001 was approved', time: '2 hours ago', icon: CheckCircle, color: 'text-emerald-500' },
                                { action: 'Feedback received on RPT-2025-004', time: '2 days ago', icon: AlertCircle, color: 'text-amber-500' },
                            ].map((activity, index) => (
                                <div key={index} className="flex items-center gap-3 border-b border-gray-100 pb-4 last:border-0 dark:border-gray-800">
                                    <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${activity.color} bg-opacity-10`}>
                                        <activity.icon className="h-4 w-4" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm text-gray-900 dark:text-white">{activity.action}</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">{activity.time}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}