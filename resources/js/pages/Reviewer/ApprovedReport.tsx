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
        title: 'Approved Reports',
        href: '/review/approved',
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

export default function ApprovedReports({ reviews, stats, filters }: Props) {
    console.log('Raw reviews data from props:', reviews);
    console.log('Total reviews fetched:', reviews.length);

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
            const submissionDate = new Date(item.submission_date || item.created_at);
            const inspectionDate = new Date(item.inspection_date || item.created_at);
            
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
                submittedDate: submissionDate.toISOString().split('T')[0],
                inspectionDate: inspectionDate.toISOString().split('T')[0],
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
    
    // Use transformed database data and filter only approved reports
    const allReviewItems: ReviewItem[] = transformDatabaseData(reviews);
    const approvedReviewItems = allReviewItems.filter(item => item.status === 'approved');

    // Filter based on search and time filter
    const filteredReviews = approvedReviewItems.filter(item => {
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
        if (filterType === 'timeframe') {
            setTimeFilter(value as any);
        }
        
        // Optional: Make an Inertia visit to reload with filters
        // router.get('/review/approved', { [filterType]: value !== 'all' ? value : undefined }, { preserveState: true });
    };

    // Handle refresh
    const handleRefresh = () => {
        router.reload({ only: ['reviews', 'stats'] });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Approved Reports - iPETRO" />

            <div className="px-6 py-6 bg-gradient-to-br from-gray-50 via-white to-gray-50/50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900/50 min-h-screen">
                {/* Header Section */}
                <div className="mb-8">
                    <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
                        <div>
                            <div className="flex items-center gap-3 mb-3">
                                <div className="p-3 bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-xl shadow-lg">
                                    <CheckSquare className="h-6 w-6 text-white" />
                                </div>
                                <div>
                                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
                                        Approved Reports
                                    </h1>
                                    <p className="mt-1.5 text-gray-600 dark:text-gray-400 text-lg">
                                        View all approved inspection reports
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Approved Reports Card */}
                <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-lg overflow-hidden mb-8">
                    {/* Header with Filters */}
                    <div className="border-b border-gray-200 dark:border-gray-800 p-6">
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                            {/* Approved Reports Title */}
                            <div className="flex items-center gap-3">
                                <div className="inline-flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium bg-gradient-to-r from-emerald-600 to-emerald-700 text-white shadow-md shadow-emerald-500/25">
                                    <CheckSquare className="h-4 w-4" />
                                    Approved Reports
                                    <span className="ml-1.5 rounded-full bg-white/20 px-2 py-0.5 text-xs font-semibold">
                                        {approvedReviewItems.length}
                                    </span>
                                </div>
                                <div className="text-sm text-gray-600 dark:text-gray-400">
                                    Total approved reports: {approvedReviewItems.length}
                                </div>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-3">
                                <div className="relative w-full sm:w-80 lg:w-96">
                                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="Search approved reports, inspectors, equipment..."
                                        className="w-full rounded-xl border border-gray-300 bg-gray-50 dark:bg-gray-800 dark:border-gray-700 py-2.5 pl-10 pr-4 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:focus:ring-emerald-500/30 dark:text-white transition-colors"
                                        value={searchQuery}
                                        onChange={handleSearch}
                                    />
                                </div>
                                <select 
                                    className="rounded-xl border border-gray-300 bg-white dark:bg-gray-800 dark:border-gray-700 py-2.5 px-4 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:focus:ring-emerald-500/30 dark:text-white"
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

                    {/* Approved Reports List */}
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
                                            Status & Date
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
                                                                <span>Inspection: {item.inspectionDate}</span>
                                                            </div>
                                                            <div className="flex items-center gap-1">
                                                                <Clock className="h-3.5 w-3.5" />
                                                                <span>Submitted: {item.submittedDate}</span>
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
                                                        APPROVED
                                                    </div>
                                                    <div className="text-sm text-gray-600 dark:text-gray-400">
                                                        Last updated: {item.lastActivity}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <Link
                                                        href={`/review/report/${item.dbId}`}
                                                        className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 px-3 py-1.5 text-sm font-medium text-emerald-700 dark:text-emerald-300 transition-colors hover:bg-emerald-100 dark:hover:bg-emerald-900/40"
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                        View Report
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
                                    <div className="inline-flex p-4 bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-900/10 rounded-2xl mb-4 border border-emerald-200 dark:border-emerald-800/30">
                                        <Award className="h-12 w-12 text-emerald-500" />
                                    </div>
                                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                                        {searchQuery || timeFilter !== 'all' ? 'No matching approved reports found' : 'No approved reports yet'}
                                    </h3>
                                    <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
                                        {searchQuery 
                                            ? 'No approved reports match your search criteria.' 
                                            : timeFilter !== 'all'
                                                ? 'No approved reports found for the selected time period.'
                                                : 'No reports have been approved yet. Approved reports will appear here.'
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
                        Showing {filteredReviews.length} of {approvedReviewItems.length} approved reports
                    </div>
                    <div className="flex items-center gap-3">
                        <button 
                            onClick={handleRefresh}
                            className="inline-flex items-center gap-2 rounded-xl border border-gray-300 bg-white dark:bg-gray-800 dark:border-gray-700 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 transition-all hover:bg-gray-50 dark:hover:bg-gray-700"
                        >
                            <RefreshCw className="h-4 w-4" />
                            Refresh List
                        </button>
                        <Link
                            href="/review"
                            className="inline-flex items-center gap-2 rounded-xl border border-gray-300 bg-white dark:bg-gray-800 dark:border-gray-700 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 transition-all hover:bg-gray-50 dark:hover:bg-gray-700"
                        >
                            <FileText className="h-4 w-4" />
                            Back to Review Dashboard
                        </Link>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}