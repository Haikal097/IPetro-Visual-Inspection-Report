import AppLayout from '@/layouts/app-layout';
import { Head, Link } from '@inertiajs/react';
import { type BreadcrumbItem } from '@/types';
import { useState } from 'react';
import { 
  FileText, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertCircle,
  User,
  Search, 
  Filter,
  BarChart3,
  Eye,
  MessageSquare,
  Download,
  MoreVertical,
  ChevronDown,
  Calendar,
  Shield,
  ThumbsUp,
  ThumbsDown,
  RefreshCw,
  Grid3x3,
  List,
  Award,
  Percent,
  Users,
  Target,
  Flag,
  AlertTriangle,
  FileCheck,
  Timer,
  CalendarDays,
  TrendingUp,
  CheckSquare
} from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Review Dashboard',
        href: '/reviews',
    },
];

interface ReviewItem {
    id: string;
    reportId: string;
    title: string;
    inspector: string;
    inspectorRole: string;
    equipment: string;
    equipmentTag: string;
    submittedDate: string;
    daysPending: number;
    status: 'pending' | 'in-review' | 'approved' | 'revisions-requested' | 'rejected';
    attachments: number;
    lastActivity: string;
}

export default function ReviewDashboard() {
    const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'in-review' | 'revisions'>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
    const [timeFilter, setTimeFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');
    
    const reviewItems: ReviewItem[] = [
        {
            id: 'REV-2025-001',
            reportId: 'RPT-2025-045',
            title: 'Pressure Vessel Internal Inspection - V-101',
            inspector: 'Michael Chen',
            inspectorRole: 'Senior Inspector',
            equipment: 'Pressure Vessel',
            equipmentTag: 'V-101',
            submittedDate: '2025-01-20',
            daysPending: 2,
            status: 'pending',
            attachments: 8,
            lastActivity: '2 hours ago',
        },
        {
            id: 'REV-2025-002',
            reportId: 'RPT-2025-046',
            title: 'Heat Exchanger Tube Bundle Analysis',
            inspector: 'Sarah Johnson',
            inspectorRole: 'Lead Engineer',
            equipment: 'Heat Exchanger',
            equipmentTag: 'HE-205',
            submittedDate: '2025-01-19',
            daysPending: 3,
            status: 'in-review',
            attachments: 12,
            lastActivity: 'Yesterday',
        },
        {
            id: 'REV-2025-003',
            reportId: 'RPT-2025-047',
            title: 'Reactor Vessel Weld Inspection Report',
            inspector: 'Robert Williams',
            inspectorRole: 'Welding Specialist',
            equipment: 'Reactor',
            equipmentTag: 'R-301',
            submittedDate: '2025-01-18',
            daysPending: 4,
            status: 'revisions-requested',
            attachments: 6,
            lastActivity: '2 days ago',
        },
        {
            id: 'REV-2025-004',
            reportId: 'RPT-2025-048',
            title: 'Separator Performance & Integrity Assessment',
            inspector: 'Lisa Wang',
            inspectorRole: 'Process Engineer',
            equipment: 'Separator',
            equipmentTag: 'S-110',
            submittedDate: '2025-01-17',
            daysPending: 5,
            status: 'pending',
            attachments: 7,
            lastActivity: '3 days ago',
        },
        {
            id: 'REV-2025-005',
            reportId: 'RPT-2025-049',
            title: 'Accumulator Safety Valve Testing',
            inspector: 'David Kim',
            inspectorRole: 'Safety Officer',
            equipment: 'Accumulator',
            equipmentTag: 'A-402',
            submittedDate: '2025-01-16',
            daysPending: 6,
            status: 'approved',
            attachments: 4,
            lastActivity: '1 week ago',
        },
        {
            id: 'REV-2025-006',
            reportId: 'RPT-2025-050',
            title: 'Nitrogen Vessel External Corrosion Assessment',
            inspector: 'James Miller',
            inspectorRole: 'Corrosion Engineer',
            equipment: 'Storage Vessel',
            equipmentTag: 'N-550',
            submittedDate: '2025-01-15',
            daysPending: 7,
            status: 'rejected',
            attachments: 5,
            lastActivity: '1 week ago',
        },
    ];

    const filteredReviews = reviewItems.filter(item => {
        if (activeTab !== 'all') {
            if (activeTab === 'pending' && item.status !== 'pending') return false;
            if (activeTab === 'in-review' && item.status !== 'in-review') return false;
            if (activeTab === 'revisions' && item.status !== 'revisions-requested') return false;
        }
        if (searchQuery) {
            return item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                   item.inspector.toLowerCase().includes(searchQuery.toLowerCase()) ||
                   item.equipmentTag.toLowerCase().includes(searchQuery.toLowerCase());
        }
        return true;
    });

    const stats = {
        totalPending: reviewItems.filter(r => r.status === 'pending').length,
        inReview: reviewItems.filter(r => r.status === 'in-review').length,
        revisionsNeeded: reviewItems.filter(r => r.status === 'revisions-requested').length,
        completedToday: 3,
        avgReviewTime: '1.5',
        approvalRate: '82',
    };

    const getStatusColor = (status: ReviewItem['status']) => {
        switch (status) {
            case 'pending': return 'bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700';
            case 'in-review': return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800';
            case 'approved': return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-800';
            case 'revisions-requested': return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-800';
            case 'rejected': return 'bg-gray-800 text-white border-gray-900 dark:bg-gray-900 dark:text-gray-100 dark:border-gray-800';
        }
    };

    const getStatusIcon = (status: ReviewItem['status']) => {
        switch (status) {
            case 'pending': return <Clock className="h-3.5 w-3.5" />;
            case 'in-review': return <Eye className="h-3.5 w-3.5" />;
            case 'approved': return <ThumbsUp className="h-3.5 w-3.5" />;
            case 'revisions-requested': return <MessageSquare className="h-3.5 w-3.5" />;
            case 'rejected': return <ThumbsDown className="h-3.5 w-3.5" />;
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Review Dashboard - iPETRO" />

            <div className="px-6 py-6 bg-gradient-to-br from-gray-50 via-white to-gray-50/50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900/50 min-h-screen">
                {/* Header Section */}
                <div className="mb-8">
                    <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
                        <div>
                            <div className="flex items-center gap-3 mb-3">
                                <div className="p-3 bg-gradient-to-br from-red-600 to-red-700 rounded-xl shadow-lg">
                                    <Shield className="h-6 w-6 text-white" />
                                </div>
                                <div>
                                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
                                        Review Dashboard
                                    </h1>
                                    <p className="mt-1.5 text-gray-600 dark:text-gray-400 text-lg">
                                        Review and approve inspection reports from inspectors
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-3">
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setViewMode('list')}
                                    className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-2.5 text-sm font-medium transition-all ${viewMode === 'list' ? 'bg-gray-900 text-white dark:bg-gray-800' : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-700'}`}
                                >
                                    <List className="h-4 w-4" />
                                    List
                                </button>
                                <button
                                    onClick={() => setViewMode('grid')}
                                    className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-2.5 text-sm font-medium transition-all ${viewMode === 'grid' ? 'bg-gray-900 text-white dark:bg-gray-800' : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-700'}`}
                                >
                                    <Grid3x3 className="h-4 w-4" />
                                    Grid
                                </button>
                            </div>
                            <div className="flex gap-2">
                                <button className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white dark:bg-gray-800 dark:border-gray-700 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 transition-all hover:bg-gray-50 dark:hover:bg-gray-700">
                                    <Download className="h-4 w-4" />
                                    Export
                                </button>
                                <button className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-red-600 to-red-700 px-4 py-2.5 text-sm font-semibold text-white transition-all hover:from-red-700 hover:to-red-800 hover:shadow-lg hover:shadow-red-500/25 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 shadow-md">
                                    <Filter className="h-4 w-4" />
                                    Advanced Filters
                                    <ChevronDown className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Reviewer Stats Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    {/* Awaiting Review - Blue Theme */}
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-900/10 rounded-2xl border border-blue-200 dark:border-blue-800/30 p-5 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-blue-600 dark:text-blue-400 mb-1">Awaiting Review</p>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalPending}</p>
                                <p className="text-xs text-blue-500 dark:text-blue-400 mt-1">Reports pending initial review</p>
                            </div>
                            <div className="p-2.5 bg-white dark:bg-blue-900/40 rounded-lg">
                                <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                            </div>
                        </div>
                    </div>
                    
                    {/* In Review - Red Theme */}
                    <div className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-900/10 rounded-2xl border border-red-200 dark:border-red-800/30 p-5 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-red-600 dark:text-red-400 mb-1">In Review</p>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.inReview}</p>
                                <p className="text-xs text-red-500 dark:text-red-400 mt-1">Currently being reviewed</p>
                            </div>
                            <div className="p-2.5 bg-white dark:bg-red-900/40 rounded-lg">
                                <Eye className="h-5 w-5 text-red-600 dark:text-red-400" />
                            </div>
                        </div>
                    </div>
                    
                    {/* Revisions Needed - Amber Theme */}
                    <div className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-900/10 rounded-2xl border border-amber-200 dark:border-amber-800/30 p-5 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-amber-600 dark:text-amber-400 mb-1">Revisions Needed</p>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.revisionsNeeded}</p>
                                <p className="text-xs text-amber-500 dark:text-amber-400 mt-1">Awaiting inspector revisions</p>
                            </div>
                            <div className="p-2.5 bg-white dark:bg-amber-900/40 rounded-lg">
                                <MessageSquare className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                            </div>
                        </div>
                    </div>
                    
                    {/* Approval Rate - Emerald Theme */}
                    <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-900/10 rounded-2xl border border-emerald-200 dark:border-emerald-800/30 p-5 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400 mb-1">Approval Rate</p>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.approvalRate}%</p>
                                <p className="text-xs text-emerald-500 dark:text-emerald-400 mt-1">Average approval rate</p>
                            </div>
                            <div className="p-2.5 bg-white dark:bg-emerald-900/40 rounded-lg">
                                <TrendingUp className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Secondary Metrics - Enhanced Design */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                    {/* Avg Review Time - Purple Theme */}
                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-900/10 rounded-xl border border-purple-200 dark:border-purple-800/30 p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-purple-600 dark:text-purple-400">Avg. Review Time</p>
                                <p className="text-xl font-bold text-gray-900 dark:text-white mt-1">{stats.avgReviewTime} days</p>
                            </div>
                            <div className="p-2 bg-white dark:bg-purple-900/40 rounded-lg">
                                <Timer className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                            </div>
                        </div>
                    </div>
                    
                    {/* Completed Today - Emerald Theme */}
                    <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-900/10 rounded-xl border border-emerald-200 dark:border-emerald-800/30 p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">Completed Today</p>
                                <p className="text-xl font-bold text-gray-900 dark:text-white mt-1">{stats.completedToday} reports</p>
                            </div>
                            <div className="p-2 bg-white dark:bg-emerald-900/40 rounded-lg">
                                <CheckSquare className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                            </div>
                        </div>
                    </div>
                    
                    {/* High Priority Items - Red Theme */}
                    <div className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-900/10 rounded-xl border border-red-200 dark:border-red-800/30 p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-red-600 dark:text-red-400">Overdue Reviews</p>
                                <p className="text-xl font-bold text-gray-900 dark:text-white mt-1">
                                    2
                                </p>
                            </div>
                            <div className="p-2 bg-white dark:bg-red-900/40 rounded-lg">
                                <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
                            </div>
                        </div>
                    </div>
                    
                    {/* Total Reviews - Blue Theme */}
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-900/10 rounded-xl border border-blue-200 dark:border-blue-800/30 p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Total Reviews</p>
                                <p className="text-xl font-bold text-gray-900 dark:text-white mt-1">
                                    {reviewItems.length}
                                </p>
                            </div>
                            <div className="p-2 bg-white dark:bg-blue-900/40 rounded-lg">
                                <FileText className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Review Queue Card */}
                <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-lg overflow-hidden mb-8">
                    {/* Header with Filters */}
                    <div className="border-b border-gray-200 dark:border-gray-800 p-6">
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                            {/* Review Status Tabs */}
                            <div className="flex flex-wrap gap-2">
                                <button
                                    onClick={() => setActiveTab('all')}
                                    className={`inline-flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium transition-all ${activeTab === 'all'
                                            ? 'bg-gradient-to-r from-red-600 to-red-700 text-white shadow-md shadow-red-500/25'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
                                        }`}
                                >
                                    <FileText className="h-4 w-4" />
                                    All Reviews
                                    <span className="ml-1.5 rounded-full bg-white/20 px-2 py-0.5 text-xs font-semibold">
                                        {reviewItems.length}
                                    </span>
                                </button>
                                <button
                                    onClick={() => setActiveTab('pending')}
                                    className={`inline-flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium transition-all ${activeTab === 'pending'
                                            ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md shadow-blue-500/25'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
                                        }`}
                                >
                                    <Clock className="h-4 w-4" />
                                    Pending Review
                                    <span className="ml-1.5 rounded-full bg-white/20 px-2 py-0.5 text-xs font-semibold">
                                        {stats.totalPending}
                                    </span>
                                </button>
                                <button
                                    onClick={() => setActiveTab('in-review')}
                                    className={`inline-flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium transition-all ${activeTab === 'in-review'
                                            ? 'bg-gradient-to-r from-red-600 to-red-700 text-white shadow-md shadow-red-500/25'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
                                        }`}
                                >
                                    <Eye className="h-4 w-4" />
                                    In Review
                                    <span className="ml-1.5 rounded-full bg-white/20 px-2 py-0.5 text-xs font-semibold">
                                        {stats.inReview}
                                    </span>
                                </button>
                                <button
                                    onClick={() => setActiveTab('revisions')}
                                    className={`inline-flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium transition-all ${activeTab === 'revisions'
                                            ? 'bg-gradient-to-r from-amber-600 to-amber-700 text-white shadow-md shadow-amber-500/25'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
                                        }`}
                                >
                                    <MessageSquare className="h-4 w-4" />
                                    Revisions Needed
                                    <span className="ml-1.5 rounded-full bg-white/20 px-2 py-0.5 text-xs font-semibold">
                                        {stats.revisionsNeeded}
                                    </span>
                                </button>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-3">
                                <div className="relative w-full sm:w-80 lg:w-96">
                                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="Search reports, inspectors, equipment..."
                                        className="w-full rounded-xl border border-gray-300 bg-gray-50 dark:bg-gray-800 dark:border-gray-700 py-2.5 pl-10 pr-4 text-sm focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/20 dark:focus:ring-red-500/30 dark:text-white transition-colors"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                </div>
                                <select 
                                    className="rounded-xl border border-gray-300 bg-white dark:bg-gray-800 dark:border-gray-700 py-2.5 px-4 text-sm focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/20 dark:focus:ring-red-500/30 dark:text-white"
                                    value={timeFilter}
                                    onChange={(e) => setTimeFilter(e.target.value as any)}
                                >
                                    <option value="all">All Time</option>
                                    <option value="today">Today</option>
                                    <option value="week">This Week</option>
                                    <option value="month">This Month</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Reviews List/Grid View */}
                    <div className="p-6">
                        {viewMode === 'grid' ? (
                            /* Grid View - Cleaned up without priority/risk indicators */
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {filteredReviews.map((item) => (
                                    <div key={item.id} className="group bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800 rounded-xl border border-gray-200 dark:border-gray-800 p-5 shadow-sm hover:shadow-lg hover:border-gray-300 dark:hover:border-gray-700 transition-all duration-200">
                                        {/* Header - Simplified without priority */}
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs font-medium text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                                                    {item.reportId}
                                                </span>
                                            </div>
                                            <button className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                                                <MoreVertical className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                                            </button>
                                        </div>

                                        {/* Report Details */}
                                        <div className="mb-5">
                                            <h4 className="font-semibold text-gray-900 dark:text-white line-clamp-2 mb-3">
                                                {item.title}
                                            </h4>
                                            <div className="flex items-center gap-3 mb-3">
                                                <div className="flex items-center gap-2">
                                                    <User className="h-4 w-4 text-gray-400" />
                                                    <span className="text-sm text-gray-600 dark:text-gray-400">
                                                        {item.inspector}
                                                    </span>
                                                </div>
                                                <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                                                    {item.inspectorRole}
                                                </span>
                                            </div>
                                            <div className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium ${getStatusColor(item.status)}`}>
                                                {getStatusIcon(item.status)}
                                                {item.status.replace('-', ' ').toUpperCase()}
                                            </div>
                                        </div>

                                        {/* Metadata */}
                                        <div className="space-y-3 mb-6">
                                            <div className="flex items-center justify-between text-sm">
                                                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                                                    <Calendar className="h-3.5 w-3.5" />
                                                    <span>Submitted: {item.submittedDate}</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                                                    <Clock className="h-3.5 w-3.5" />
                                                    <span>{item.daysPending} days</span>
                                                </div>
                                            </div>
                                            <div className="flex items-center justify-between text-sm">
                                                <div className="text-gray-600 dark:text-gray-400">
                                                    Equipment: {item.equipmentTag}
                                                </div>
                                                <div className="text-gray-600 dark:text-gray-400">
                                                    {item.attachments} files
                                                </div>
                                            </div>
                                        </div>

                                        {/* Action Buttons */}
                                        <div className="flex items-center gap-2 pt-4 border-t border-gray-100 dark:border-gray-800">
                                            <Link
                                                href={`/reviews/${item.id}`}
                                                className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-red-50 dark:bg-red-900/20 px-3 py-2 text-sm font-medium text-red-700 dark:text-red-300 transition-colors hover:bg-red-100 dark:hover:bg-red-900/40"
                                            >
                                                <Eye className="h-4 w-4" />
                                                Review
                                            </Link>
                                            <Link
                                                href={`/reviews/${item.id}/compare`}
                                                className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-gray-100 dark:bg-gray-800 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 transition-colors hover:bg-gray-200 dark:hover:bg-gray-700"
                                            >
                                                <FileText className="h-4 w-4" />
                                                Compare
                                            </Link>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            /* List View - Cleaned up without priority/risk indicators */
                            <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800">
                                <table className="w-full">
                                    <thead className="bg-gray-50 dark:bg-gray-800/50">
                                        <tr>
                                            <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                                                Report Details
                                            </th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                                                Inspector
                                            </th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                                                Status
                                            </th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                        {filteredReviews.map((item) => (
                                            <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-start gap-4">
                                                        <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${getStatusColor(item.status)}`}>
                                                            {getStatusIcon(item.status)}
                                                        </div>
                                                        <div>
                                                            <div className="mb-1">
                                                                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                                                    {item.reportId}
                                                                </span>
                                                            </div>
                                                            <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                                                                {item.title}
                                                            </h4>
                                                            <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                                                                <div className="flex items-center gap-1">
                                                                    <Calendar className="h-3.5 w-3.5" />
                                                                    <span>{item.submittedDate}</span>
                                                                </div>
                                                                <div className="flex items-center gap-1">
                                                                    <Clock className="h-3.5 w-3.5" />
                                                                    <span>{item.daysPending} days pending</span>
                                                                </div>
                                                                <div className="flex items-center gap-1">
                                                                    <FileText className="h-3.5 w-3.5" />
                                                                    <span>{item.attachments} files</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="space-y-1">
                                                        <div className="font-medium text-gray-900 dark:text-white">
                                                            {item.inspector}
                                                        </div>
                                                        <div className="text-sm text-gray-600 dark:text-gray-400">
                                                            {item.inspectorRole}
                                                        </div>
                                                        <div className="text-xs text-gray-500 dark:text-gray-400">
                                                            {item.equipment} • {item.equipmentTag}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="space-y-2">
                                                        <div className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium ${getStatusColor(item.status)}`}>
                                                            {getStatusIcon(item.status)}
                                                            {item.status.replace('-', ' ').toUpperCase()}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <Link
                                                            href={`/reviews/${item.id}`}
                                                            className="inline-flex items-center gap-1.5 rounded-lg bg-red-50 dark:bg-red-900/20 px-3 py-1.5 text-sm font-medium text-red-700 dark:text-red-300 transition-colors hover:bg-red-100 dark:hover:bg-red-900/40"
                                                        >
                                                            <Eye className="h-4 w-4" />
                                                            Review
                                                        </Link>
                                                        <Link
                                                            href={`/reviews/${item.id}/comments`}
                                                            className="inline-flex items-center gap-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 transition-colors hover:bg-gray-200 dark:hover:bg-gray-700"
                                                        >
                                                            <MessageSquare className="h-4 w-4" />
                                                            Comments
                                                        </Link>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>

                                {/* Empty State */}
                                {filteredReviews.length === 0 && (
                                    <div className="p-16 text-center">
                                        <div className="inline-flex p-4 bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-900/10 rounded-2xl mb-4 border border-red-200 dark:border-red-800/30">
                                            <Award className="h-12 w-12 text-red-500" />
                                        </div>
                                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                                            No reviews pending
                                        </h3>
                                        <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
                                            {searchQuery ? 'No reviews match your search criteria.' : 'Great job! All reports have been reviewed.'}
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Bottom Actions & Summary */}
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                        Showing {filteredReviews.length} of {reviewItems.length} reviews in queue
                    </div>
                    <div className="flex items-center gap-3">
                        <button className="inline-flex items-center gap-2 rounded-xl border border-gray-300 bg-white dark:bg-gray-800 dark:border-gray-700 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 transition-all hover:bg-gray-50 dark:hover:bg-gray-700">
                            <RefreshCw className="h-4 w-4" />
                            Refresh Queue
                        </button>
                        <Link
                            href="/reviews/analytics"
                            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-red-700 px-4 py-2.5 text-sm font-semibold text-white transition-all hover:from-red-700 hover:to-red-800 hover:shadow-lg hover:shadow-red-500/25"
                        >
                            <BarChart3 className="h-4 w-4" />
                            View Analytics
                        </Link>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}