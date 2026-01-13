import AppLayout from '@/layouts/app-layout';
import { Head, Link } from '@inertiajs/react';
import { router } from '@inertiajs/react';
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
  MoreVertical,
  ChevronDown,
  Calendar,
  Shield,
  ThumbsUp,
  ThumbsDown,
  RefreshCw,
  Award,
  AlertTriangle,
  Timer,
  TrendingUp,
  CheckSquare
} from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Review Dashboard',
        href: '/review',
    },
];

interface DatabaseReviewItem {
    id: number;
    report_id: number;
    report_number: string;
    title: string;
    json_data?: any;
    submission_date: string;
    inspection_date: string;
    status: string;
    db_status: string; // Original status from database
    created_at: string;
    updated_at: string;
    inspector_name: string;
    inspector_role: string;
    equipment: string;
    equipment_tag: string;
    pmt?: string;
    plant_unit?: string;
    description?: string;
    has_photo_report: boolean;
    photo_report_id?: number;
    reviewer_id?: number;
    creator_id?: number;
    inspector_id?: number;
}

interface ReviewItem {
    id: string;
    reportId: string;
    title: string;
    inspector: string;
    inspectorRole: string;
    equipment: string;
    equipmentTag: string;
    submittedDate: string;
    inspectionDate: string;
    daysPending: number;
    status: 'pending' | 'in-review' | 'approved' | 'revisions-requested' | 'rejected';
    lastActivity: string;
    pmt?: string;
    plantUnit?: string;
    description?: string;
    hasPhotoReport: boolean;
    // Add this for the actual database ID
    dbId: number;
}

interface Props {
    reviews: DatabaseReviewItem[];
    stats: {
        total_pending: number;
        in_review: number;
        revisions_needed: number;
        completed_today: number;
        avg_review_time: string;
        approval_rate: string;
        overdue_reviews: number;
        total_reviews: number;
    };
    filters?: {
        search?: string;
        status?: string;
        timeframe?: string;
    };
}

export default function ReviewDashboard({ reviews, stats, filters }: Props) {
        console.log('Raw reviews data from props:', reviews);
    console.log('Total reviews fetched:', reviews.length);

    const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'in-review' | 'revisions'>(
        (filters?.status as any) || 'all'
    );
    const [searchQuery, setSearchQuery] = useState(filters?.search || '');
    const [timeFilter, setTimeFilter] = useState<'all' | 'today' | 'week' | 'month'>(
        (filters?.timeframe as any) || 'all'
    );
    
    // Transform database data to match component interface
    const transformDatabaseData = (dbReviews: DatabaseReviewItem[]): ReviewItem[] => {
        return dbReviews.map(item => {
            // Use the id from the controller (which is now report_id)
            const dbId = item.id; // This should now be 78, etc.
            
            const jsonData = item.json_data || {};
            
            // Use the dates from the controller
            const submissionDate = new Date(item.updated_at);
            const inspectionDate = new Date(item.created_at);
            
            // Calculate days pending
            const daysPending = Math.floor((Date.now() - submissionDate.getTime()) / (1000 * 60 * 60 * 24));
            
            // Status mapping
            const statusMap: Record<string, ReviewItem['status']> = {
                'pending': 'pending',
                'draft': 'pending',
                'submitted': 'pending',
                'in_review': 'in-review',
                'reviewing': 'in-review',
                'approved': 'approved',
                'revisions_requested': 'revisions-requested',
                'revisions': 'revisions-requested',
                'rejected': 'rejected',
            };
            
            const status = statusMap[item.db_status] || item.status as ReviewItem['status'] || 'pending';
            
            // Calculate last activity
            const updatedAt = new Date(item.updated_at);
            const diffMs = Date.now() - updatedAt.getTime();
            const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
            const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
            
            let lastActivity = '';
            if (diffHours < 1) {
                lastActivity = 'Just now';
            } else if (diffHours < 24) {
                lastActivity = `${diffHours} hours ago`;
            } else if (diffDays === 1) {
                lastActivity = 'Yesterday';
            } else if (diffDays < 7) {
                lastActivity = `${diffDays} days ago`;
            } else {
                lastActivity = `${Math.floor(diffDays / 7)} weeks ago`;
            }
            
            return {
                id: `REV-${dbId}`, // Use the actual ID
                reportId: item.report_number || `RPT-${dbId}`,
                title: item.title,
                inspector: item.inspector_name,
                inspectorRole: item.inspector_role,
                equipment: item.equipment,
                equipmentTag: item.equipment_tag,
                submittedDate: submissionDate.toISOString(),
                inspectionDate: inspectionDate.toISOString(),
                daysPending: Math.max(0, daysPending),
                status,
                lastActivity,
                pmt: item.pmt,
                plantUnit: item.plant_unit,
                description: item.description,
                hasPhotoReport: item.has_photo_report,
                dbId: dbId, // This is the important one for the link
                reviewerId: item.reviewer_id,
                creatorId: item.creator_id,
                inspectorId: item.inspector_id,
            };
        });
    };
    
    // Use transformed database data
    const reviewItems: ReviewItem[] = transformDatabaseData(reviews);

    const filteredReviews = reviewItems.filter(item => {
        if (activeTab !== 'all') {
            if (activeTab === 'pending' && item.status !== 'pending') return false;
            if (activeTab === 'in-review' && item.status !== 'in-review') return false;
            if (activeTab === 'revisions' && item.status !== 'revisions-requested') return false;
        }
        
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            return item.title.toLowerCase().includes(query) ||
                   item.inspector.toLowerCase().includes(query) ||
                   item.equipmentTag.toLowerCase().includes(query) ||
                   item.reportId.toLowerCase().includes(query);
        }
        
        // Apply time filter
        if (timeFilter !== 'all') {
            const submittedDate = new Date(item.submittedDate);
            const now = new Date();
            
            switch (timeFilter) {
                case 'today':
                    return submittedDate.toDateString() === now.toDateString();
                case 'week':
                    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                    return submittedDate >= weekAgo;
                case 'month':
                    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                    return submittedDate >= monthAgo;
            }
        }
        
        return true;
    });

    // Use stats from props
    const dashboardStats = {
        totalPending: stats.total_pending,
        inReview: stats.in_review,
        revisionsNeeded: stats.revisions_needed,
        completedToday: stats.completed_today,
        avgReviewTime: stats.avg_review_time,
        approvalRate: stats.approval_rate,
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

    // Handle search
    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchQuery(e.target.value);
    };

    // Handle filter changes
    const handleFilterChange = (filterType: string, value: string) => {
        // Update local state
        if (filterType === 'status') {
            setActiveTab(value as any);
        } else if (filterType === 'timeframe') {
            setTimeFilter(value as any);
        }
        
        // Optional: Make an Inertia visit to reload with filters
        // router.get('/review', { [filterType]: value !== 'all' ? value : undefined }, { preserveState: true });
    };

    // Handle refresh
    const handleRefresh = () => {
        router.reload({ only: ['reviews', 'stats'] });
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
                    </div>
                </div>

                {/* Reviewer Stats Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    {/* Awaiting Review - Blue Theme */}
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-900/10 rounded-2xl border border-blue-200 dark:border-blue-800/30 p-5 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-blue-600 dark:text-blue-400 mb-1">Awaiting Review</p>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">{dashboardStats.totalPending}</p>
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
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">{dashboardStats.inReview}</p>
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
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">{dashboardStats.revisionsNeeded}</p>
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
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">{dashboardStats.approvalRate}%</p>
                                <p className="text-xs text-emerald-500 dark:text-emerald-400 mt-1">Average approval rate</p>
                            </div>
                            <div className="p-2.5 bg-white dark:bg-emerald-900/40 rounded-lg">
                                <TrendingUp className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
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
                                    onClick={() => handleFilterChange('status', 'all')}
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
                                    onClick={() => handleFilterChange('status', 'pending')}
                                    className={`inline-flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium transition-all ${activeTab === 'pending'
                                            ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md shadow-blue-500/25'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
                                        }`}
                                >
                                    <Clock className="h-4 w-4" />
                                    Pending Review
                                    <span className="ml-1.5 rounded-full bg-white/20 px-2 py-0.5 text-xs font-semibold">
                                        {dashboardStats.totalPending}
                                    </span>
                                </button>
                                <button
                                    onClick={() => handleFilterChange('status', 'in-review')}
                                    className={`inline-flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium transition-all ${activeTab === 'in-review'
                                            ? 'bg-gradient-to-r from-red-600 to-red-700 text-white shadow-md shadow-red-500/25'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
                                        }`}
                                >
                                    <Eye className="h-4 w-4" />
                                    In Review
                                    <span className="ml-1.5 rounded-full bg-white/20 px-2 py-0.5 text-xs font-semibold">
                                        {dashboardStats.inReview}
                                    </span>
                                </button>
                                <button
                                    onClick={() => handleFilterChange('status', 'revisions')}
                                    className={`inline-flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium transition-all ${activeTab === 'revisions'
                                            ? 'bg-gradient-to-r from-amber-600 to-amber-700 text-white shadow-md shadow-amber-500/25'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
                                        }`}
                                >
                                    <MessageSquare className="h-4 w-4" />
                                    Revisions Needed
                                    <span className="ml-1.5 rounded-full bg-white/20 px-2 py-0.5 text-xs font-semibold">
                                        {dashboardStats.revisionsNeeded}
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
                                        onChange={handleSearch}
                                    />
                                </div>
                                <select 
                                    className="rounded-xl border border-gray-300 bg-white dark:bg-gray-800 dark:border-gray-700 py-2.5 px-4 text-sm focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/20 dark:focus:ring-red-500/30 dark:text-white"
                                    value={timeFilter}
                                    onChange={(e) => handleFilterChange('timeframe', e.target.value)}
                                >
                                    <option value="all">All Time</option>
                                    <option value="today">Today</option>
                                    <option value="week">This Week</option>
                                    <option value="month">This Month</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Reviews List View (Grid view removed) */}
                    <div className="p-6">
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
                                                                <span>Submitted: {new Date(item.submittedDate).toLocaleDateString('en-GB')} {new Date(item.submittedDate).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</span>
                                                            </div>
                                                            <div className="flex items-center gap-1">
                                                                <Clock className="h-3.5 w-3.5" />
                                                                <span>{item.daysPending} days pending</span>
                                                            </div>
                                                            {item.pmt && (
                                                                <div className="flex items-center gap-1">
                                                                    <span>PMT: {item.pmt}</span>
                                                                </div>
                                                            )}
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
                                                        href={`/report/show/${item.dbId}`}
                                                        className="inline-flex items-center gap-1.5 rounded-lg bg-red-50 dark:bg-red-900/20 px-3 py-1.5 text-sm font-medium text-red-700 dark:text-red-300 transition-colors hover:bg-red-100 dark:hover:bg-red-900/40"
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                        Review
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
                                        {searchQuery || timeFilter !== 'all' ? 'No matching reviews found' : 'No reviews pending'}
                                    </h3>
                                    <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
                                        {searchQuery 
                                            ? 'No reviews match your search criteria.' 
                                            : timeFilter !== 'all'
                                                ? 'No reviews found for the selected time period.'
                                                : 'Great job! All reports have been reviewed.'
                                        }
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Bottom Actions & Summary */}
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                        Showing {filteredReviews.length} of {reviewItems.length} reviews in queue
                    </div>
                    <div className="flex items-center gap-3">
                        <button 
                            onClick={handleRefresh}
                            className="inline-flex items-center gap-2 rounded-xl border border-gray-300 bg-white dark:bg-gray-800 dark:border-gray-700 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 transition-all hover:bg-gray-50 dark:hover:bg-gray-700"
                        >
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