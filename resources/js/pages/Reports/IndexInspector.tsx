import AppLayout from '@/layouts/app-layout';

import { Head, Link, router } from '@inertiajs/react';
import { type BreadcrumbItem } from '@/types';
import { useMemo, useState, useEffect } from 'react';
import {
  FileText,
  Eye,
  Edit,
  Search,
  Calendar,
  User,
  Clock,
  CheckCircle,
  XCircle,
  MoreVertical,
  Plus,
  Upload,
  HardHat,
  FolderOpen,
  RefreshCw,
  Grid3x3,
  List,
  MessageSquareText,
  X,
} from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
  {
    title: 'My Reports',
    href: '/reports',
  },
];

// ✅ added missing statuses to match your DB enum
type Status =
  | 'draft'
  | 'submitted'
  | 'in_review'
  | 'revisions_requested'
  | 'approved'
  | 'rejected';

// ✅ ADDED (necessary): support showing reviewer reason from ReportReviewLog
type ReviewLog = {
  id?: number;
  action: string;
  message: string | null;
  created_at?: string | null;
};

interface Report {
  id: number;
  title: string;
  equipment?: string | null; // ✅ backend sends "equipment"
  equipmentTag?: string | null;
  equipmentType?: string | null;

  status: Status;

  createdBy: string;
  createdAt: string; // "Y-m-d"
  lastUpdated: string; // "diffForHumans" string

  reviewer: string;

  // optional (if you map later)
  dueDate?: string | null;
  attachments?: number | null;

  hasPhotoReport?: boolean;
  photoReportId?: number | null;

  // ✅ ADDED (necessary): backend can send this (recommended)
  review_logs?: ReviewLog[];
  // ✅ OPTIONAL fallback fields (if you prefer to send only latest)
  review_reason?: string | null;
  review_reason_at?: string | null;
}

interface Stats {
  total: number;
  draft: number;
  inReview: number;
  submitted: number;
  approved: number;
  rejected: number;
}

interface Filters {
  status?: string;
  search?: string;
}

interface Pagination {
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
  from: number;
  to: number;
  links: Array<{
    url: string | null;
    label: string;
    active: boolean;
  }>;
}

export default function Report({
  reports,
  stats,
  filters,
  pagination, // ✅ ADD THIS
}: {
  reports: Report[];
  stats: Stats;
  filters?: Filters;
  pagination?: Pagination; // ✅ ADD THIS
}) {
  type TabKey = 'all' | 'draft' | 'in_review' | 'approved' | 'rejected' | 'revisions_requested';
  const [activeTab, setActiveTab] = useState<TabKey>((filters?.status as TabKey) || 'all');

  const [searchQuery, setSearchQuery] = useState(filters?.search || '');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

  // ✅ ADDED (necessary): modal state for showing reason
  const [reasonOpen, setReasonOpen] = useState(false);
  const [reasonReport, setReasonReport] = useState<Report | null>(null);

  const openReason = (report: Report) => {
    setReasonReport(report);
    setReasonOpen(true);
  };

  const closeReason = () => {
    setReasonOpen(false);
    setReasonReport(null);
  };

  // ✅ IMPORTANT ADD: compute counts from reports (fixes in_review counting)
  const counts = useMemo(() => {
    const base = {
      total: reports?.length ?? 0,
      draft: 0,
      in_review: 0,
      revisions_requested: 0,
      approved: 0,
      rejected: 0,
      submitted: 0,
    };

    for (const r of reports || []) {
      const s = r.status;
      if (s in base) (base as any)[s] += 1;
    }

    return base;
  }, [reports]);

  // ADD THIS DEBUG CODE
  useEffect(() => {
    console.log('🔍 REPORTS DATA:', reports);
    console.log('🔍 Type of reports:', typeof reports);
    console.log('🔍 Is reports an array?', Array.isArray(reports));

    if (reports && Array.isArray(reports)) {
      console.log('🔍 Number of reports:', reports.length);

      reports.forEach((report, index) => {
        console.log(`🔍 Report ${index}:`, report);
        console.log(`🔍 Report ${index} id:`, report.id);
        console.log(`🔍 Report ${index} has id?`, 'id' in report);
        console.log(`🔍 Report ${index} keys:`, Object.keys(report));
      });
    }

    console.log('✅ COUNTS:', counts);
  }, [reports, counts]);

  const filteredReports = useMemo(() => {
    return (reports || []).filter((report) => {
      if (activeTab !== 'all' && report.status !== activeTab) return false;

      if (searchQuery) {
        const q = searchQuery.toLowerCase();

        return (
          (report.title || '').toLowerCase().includes(q) ||
          (report.equipmentType || '').toLowerCase().includes(q) ||
          (report.equipmentTag || '').toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [reports, activeTab, searchQuery]);

  // ✅ added: format status for UI
  const formatStatus = (status: Status) =>
    status
      .split('_')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');

  const getStatusColor = (status: Status) => {
    switch (status) {
      case 'draft':
        return 'bg-gray-50 text-gray-700 border border-gray-200 dark:bg-gray-800/50 dark:text-gray-300 dark:border-gray-700';
      case 'submitted':
        return 'bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800/30';
      case 'in_review':
        return 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-800/30';
      case 'approved':
        return 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-800/30';
      case 'rejected':
        return 'bg-red-50 text-red-700 border border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800/30';
      case 'revisions_requested':
        return 'bg-orange-50 text-orange-700 border border-orange-200 dark:bg-orange-900/20 dark:text-orange-300 dark:border-orange-800/30';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  const getStatusIcon = (status: Status) => {
    switch (status) {
      case 'draft':
        return <Edit className="h-3.5 w-3.5" />;
      case 'submitted':
        return <Upload className="h-3.5 w-3.5" />;
      case 'in_review':
        return <FileText className="h-3.5 w-3.5" />;
      case 'approved':
        return <CheckCircle className="h-3.5 w-3.5" />;
      case 'rejected':
        return <XCircle className="h-3.5 w-3.5" />;
      case 'revisions_requested':
        return <FileText className="h-3.5 w-3.5" />;
      default:
        return <FileText className="h-3.5 w-3.5" />;
    }
  };

  const getStatusBg = (status: Status) => {
    switch (status) {
      case 'draft':
        return 'bg-gray-500';
      case 'submitted':
        return 'bg-blue-500';
      case 'in_review':
        return 'bg-amber-500';
      case 'approved':
        return 'bg-emerald-500';
      case 'rejected':
        return 'bg-red-500';
      case 'revisions_requested':
        return 'bg-orange-500';
      default:
        return 'bg-gray-500';
    }
  };

  const resubmitReport = (reportId: number) => {
    router.post(`/reports/${reportId}/resubmit`, {}, { preserveScroll: true });
  };

  // ✅ draft + revisions_requested can edit
  const canEdit = (status: Status) => status === 'draft' || status === 'revisions_requested';

  // ✅ ADDED (necessary): only these statuses should show reason button
  const hasReason = (report: Report) =>
    report.status === 'rejected' || report.status === 'revisions_requested';

  // ✅ ADDED (necessary): pick latest meaningful message (works if you pass review_logs OR review_reason)
  const getLatestReason = (report: Report) => {
    // Prefer logs if provided
    const logs = Array.isArray(report.review_logs) ? report.review_logs : [];
    const latestWithMessage =
      logs.find((l) => !!(l?.message && String(l.message).trim().length > 0)) || null;

    const actionFromLog = latestWithMessage?.action || null;
    const messageFromLog = latestWithMessage?.message || null;
    const createdAtFromLog = latestWithMessage?.created_at || null;

    // fallback to report fields (if backend sends only latest reason)
    const fallbackMessage = report.review_reason ?? null;
    const fallbackAt = report.review_reason_at ?? null;

    return {
      action: actionFromLog ?? report.status,
      message: messageFromLog ?? fallbackMessage,
      created_at: createdAtFromLog ?? fallbackAt,
    };
  };

  const [currentPage, setCurrentPage] = useState(pagination?.current_page || 1);
  const [perPage, setPerPage] = useState(pagination?.per_page || 15);

  // Function to handle page change
  const handlePageChange = (page: number) => {
    if (page < 1 || page > (pagination?.last_page || 1)) return;
    
    setCurrentPage(page);
    router.get('/reports', {
      status: activeTab === 'all' ? undefined : activeTab,
      search: searchQuery || undefined,
      page,
      per_page: perPage,
    }, {
      preserveScroll: true,
      preserveState: true,
    });
  };

  // Function to handle per page change
  const handlePerPageChange = (value: number) => {
    setPerPage(value);
    setCurrentPage(1);
    router.get('/reports', {
      status: activeTab !== 'all' ? activeTab : undefined,
      search: searchQuery || undefined,
      page: 1,
      per_page: value,
    }, {
      preserveScroll: true,
      preserveState: true,
    });
  };

  // Function to handle search with pagination
  useEffect(() => {
    const handler = setTimeout(() => {
      if (searchQuery !== (filters?.search || '')) {
        setCurrentPage(1);
        router.get('/reports', {
          status: activeTab !== 'all' ? activeTab : undefined,
          search: searchQuery || undefined,
          page: 1,
          per_page: perPage,
        }, {
          preserveScroll: true,
          preserveState: true,
        });
      }
    }, 500);

    return () => clearTimeout(handler);
  }, [searchQuery, activeTab, perPage]);

  // Function to handle tab change with pagination
  const handleTabChange = (tab: TabKey) => {
    setActiveTab(tab);
    setCurrentPage(1);
    router.get('/reports', {
      status: tab !== 'all' ? tab : undefined,
      search: searchQuery || undefined,
      page: 1,
      per_page: perPage,
    }, {
      preserveScroll: true,
      preserveState: true,
    });
  };

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="My Reports - iPETRO" />

      <div className="px-6 py-6 bg-gradient-to-br from-gray-50 via-white to-gray-50/50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900/50 min-h-screen">
        {/* ✅ ADDED (necessary): Reason Modal */}
        {reasonOpen && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
            role="dialog"
            aria-modal="true"
            onMouseDown={(e) => {
              // close when clicking outside
              if (e.target === e.currentTarget) closeReason();
            }}
          >
            <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-xl">
              <div className="flex items-start justify-between gap-4 px-5 py-4 border-b border-gray-200 dark:border-gray-800">
                <div>
                  <div className="flex items-center gap-2">
                    <MessageSquareText className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Review Reason
                    </h3>
                  </div>
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                    {reasonReport?.title ?? 'Report'}
                  </p>
                </div>

                <button
                  onClick={closeReason}
                  className="rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  aria-label="Close"
                >
                  <X className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                </button>
              </div>

              <div className="px-5 py-4">
                {reasonReport ? (
                  (() => {
                    const latest = getLatestReason(reasonReport);

                    return (
                      <div className="space-y-4">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium ${getStatusColor(
                              reasonReport.status
                            )}`}
                          >
                            {getStatusIcon(reasonReport.status)}
                            {formatStatus(reasonReport.status)}
                          </span>

                          {latest?.created_at && (
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              ({latest.created_at})
                            </span>
                          )}
                        </div>

                        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/40 p-4">
                          {latest?.message ? (
                            <p className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
                              {latest.message}
                            </p>
                          ) : (
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              No comment provided by reviewer.
                            </p>
                          )}
                        </div>

                        {/* Optional: show history if you passed review_logs */}
                        {Array.isArray(reasonReport.review_logs) && reasonReport.review_logs.length > 1 && (
                          <div className="pt-2">
                            <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-2">
                              History
                            </div>
                            <div className="space-y-2 max-h-48 overflow-auto pr-1">
                              {reasonReport.review_logs.map((log, idx) => (
                                <div
                                  key={(log.id ?? idx) as any}
                                  className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-3"
                                >
                                  <div className="flex items-center justify-between gap-3">
                                    <div className="text-xs font-medium text-gray-700 dark:text-gray-300">
                                      {String(log.action || '').replaceAll('_', ' ')}
                                    </div>
                                    {log.created_at && (
                                      <div className="text-[11px] text-gray-500 dark:text-gray-400">
                                        {log.created_at}
                                      </div>
                                    )}
                                  </div>
                                  <div className="mt-1 text-sm text-gray-700 dark:text-gray-200 whitespace-pre-wrap">
                                    {log.message || '—'}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })()
                ) : null}
              </div>

              <div className="px-5 py-4 border-t border-gray-200 dark:border-gray-800 flex justify-end">
                <button
                  onClick={closeReason}
                  className="inline-flex items-center justify-center rounded-xl bg-gray-900 text-white dark:bg-gray-800 px-4 py-2 text-sm font-semibold hover:opacity-95 transition-opacity"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
                    Inspection Reports
                  </h1>
                  <p className="mt-1.5 text-gray-600 dark:text-gray-400 text-lg">
                    Create, manage, and track all your inspection reports
                  </p>
                </div>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex gap-2">
                <button
                  onClick={() => setViewMode('list')}
                  className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-2.5 text-sm font-medium transition-all ${
                    viewMode === 'list'
                      ? 'bg-gray-900 text-white dark:bg-gray-800'
                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-700'
                  }`}
                >
                  <List className="h-4 w-4" />
                  List
                </button>
                <button
                  onClick={() => setViewMode('grid')}
                  className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-2.5 text-sm font-medium transition-all ${
                    viewMode === 'grid'
                      ? 'bg-gray-900 text-white dark:bg-gray-800'
                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-700'
                  }`}
                >
                  <Grid3x3 className="h-4 w-4" />
                  Grid
                </button>
              </div>
              <Link
                href="/pv-report"
                className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-red-600 to-red-700 px-4 py-2.5 text-sm font-semibold text-white transition-all hover:from-red-700 hover:to-red-800 hover:shadow-lg hover:shadow-red-500/25 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 shadow-md"
              >
                <Plus className="h-4 w-4" />
                New Report
              </Link>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <div className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Total Reports</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{counts.total}</p>
              </div>
              <div className="p-2.5 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Drafts</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{counts.draft}</p>
              </div>
              {/* ✅ Draft icon now grey */}
              <div className="p-2.5 bg-gray-100 dark:bg-gray-800 rounded-lg">
                <Edit className="h-5 w-5 text-gray-700 dark:text-gray-300" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">On Review</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{counts.in_review}</p>
              </div>
              <div className="p-2.5 bg-yellow-50 dark:bg-yellow-900/30 rounded-lg">
                <Upload className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Approved</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{counts.approved}</p>
              </div>
              <div className="p-2.5 bg-emerald-50 dark:bg-emerald-900/30 rounded-lg">
                <CheckCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
          </div>

          {/* ✅ ADDED: Rejected stats card */}
          <div className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Rejected</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{counts.rejected || 0}</p>
              </div>
              <div className="p-2.5 bg-red-50 dark:bg-red-900/30 rounded-lg">
                <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Card */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-lg overflow-hidden mb-8">
          {/* Header with Filters */}
          <div className="border-b border-gray-200 dark:border-gray-800 p-6">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              {/* Status Tabs on Left */}
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setActiveTab('all')}
                  className={`inline-flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium transition-all ${
                    activeTab === 'all'
                      ? 'bg-gradient-to-r from-red-600 to-red-700 text-white shadow-md shadow-red-500/25'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
                  }`}
                >
                  <FileText className="h-4 w-4" />
                  All Reports
                  <span className="ml-1.5 rounded-full bg-white/20 px-2 py-0.5 text-xs font-semibold">
                    {counts.total}
                  </span>
                </button>

                <button
                  onClick={() => setActiveTab('draft')}
                  className={`inline-flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium transition-all ${
                    activeTab === 'draft'
                      ? 'bg-gradient-to-r from-gray-700 to-gray-800 text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
                  }`}
                >
                  <Edit className="h-4 w-4" />
                  Drafts
                  <span className="ml-1.5 rounded-full bg-white/20 px-2 py-0.5 text-xs font-semibold">
                    {counts.draft}
                  </span>
                </button>

                <button
                  onClick={() => setActiveTab('in_review')}
                  className={`inline-flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium transition-all ${
                    activeTab === 'in_review'
                      ? 'bg-gradient-to-r from-yellow-600 to-yellow-700 text-white shadow-md shadow-yellow-500/25'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
                  }`}
                >
                  <Upload className="h-4 w-4" />
                  In Review
                  <span className="ml-1.5 rounded-full bg-white/20 px-2 py-0.5 text-xs font-semibold">
                    {counts.in_review}
                  </span>
                </button>

                <button
                  onClick={() => setActiveTab('approved')}
                  className={`inline-flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium transition-all ${
                    activeTab === 'approved'
                      ? 'bg-gradient-to-r from-emerald-600 to-emerald-700 text-white shadow-md shadow-emerald-500/25'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
                  }`}
                >
                  <CheckCircle className="h-4 w-4" />
                  Approved
                  <span className="ml-1.5 rounded-full bg-white/20 px-2 py-0.5 text-xs font-semibold">
                    {counts.approved}
                  </span>
                </button>

                {/* ✅ ADDED: Rejected tab */}
                <button
                  onClick={() => setActiveTab('rejected')}
                  className={`inline-flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium transition-all ${
                    activeTab === 'rejected'
                      ? 'bg-gradient-to-r from-red-600 to-red-700 text-white shadow-md shadow-red-500/25'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
                  }`}
                >
                  <XCircle className="h-4 w-4" />
                  Rejected
                  <span className="ml-1.5 rounded-full bg-white/20 px-2 py-0.5 text-xs font-semibold">
                    {counts.rejected || 0}
                  </span>
                </button>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative w-full sm:w-80 lg:w-96">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search reports..."
                    className="w-full rounded-xl border border-gray-300 bg-gray-50 dark:bg-gray-800 dark:border-gray-700 py-2.5 pl-10 pr-4 text-sm focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/20 dark:focus:ring-red-500/30 dark:text-white transition-colors"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Reports List/Grid View */}
          <div className="p-6">
            {viewMode === 'grid' ? (
              /* Grid View */
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredReports.map((report) => (
                  <div
                    key={report.id}
                    className="group bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5 shadow-sm hover:shadow-lg hover:border-gray-300 dark:hover:border-gray-700 transition-all duration-200"
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div
                        className={`h-10 w-10 rounded-lg flex items-center justify-center ${getStatusBg(
                          report.status
                        )}`}
                      >
                        {getStatusIcon(report.status)}
                      </div>
                      <button className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                        <MoreVertical className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                      </button>
                    </div>

                    {/* Report Details */}
                    <div className="mb-5">
                      <h4 className="font-semibold text-gray-900 dark:text-white line-clamp-2 mb-2">
                        {report.title}
                      </h4>

                      <div className="flex items-center gap-2 mb-3">
                        <HardHat className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {report.equipment ?? '-'} • {report.equipmentTag ?? '-'}
                        </span>
                      </div>

                      {/* ✅ CHANGED (necessary): status becomes clickable for rejected/revisions_requested */}
                      {hasReason(report) ? (
                        <button
                          type="button"
                          onClick={() => openReason(report)}
                          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium ${getStatusColor(
                            report.status
                          )} hover:opacity-90 transition-opacity`}
                          title="Click to view reason"
                        >
                          {getStatusIcon(report.status)}
                          {formatStatus(report.status)}
                          <MessageSquareText className="h-3.5 w-3.5 ml-0.5" />
                        </button>
                      ) : (
                        <div
                          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium ${getStatusColor(
                            report.status
                          )}`}
                        >
                          {getStatusIcon(report.status)}
                          {formatStatus(report.status)}
                        </div>
                      )}
                    </div>

                    {/* Metadata */}
                    <div className="space-y-3 mb-6">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                          <User className="h-3.5 w-3.5" />
                          <span>{report.createdBy}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                          <FolderOpen className="h-3.5 w-3.5" />
                          <span>{report.attachments ?? 0} files</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                          <Calendar className="h-3.5 w-3.5" />
                          <span>
                            Date: {report.createdAt 
                              ? new Date(report.createdAt).toLocaleDateString('en-GB', {
                                  day: '2-digit',
                                  month: '2-digit',
                                  year: 'numeric'
                                })
                              : '-'
                            }
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                          <Clock className="h-3.5 w-3.5" />
                          <span>{report.lastUpdated ?? '—'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 pt-4 border-t border-gray-100 dark:border-gray-800">
                      {/* View Button with dynamic route based on status */}
                      {(() => {
                        // Determine the route based on status
                        let viewRoute = `/pv-report/${report.id}`; // Default for draft/revisions_requested

                        if (['approved', 'rejected', 'submitted', 'in_review'].includes(report.status)) {
                          viewRoute = `/report/show/${report.id}`;
                        }

                        return (
                          <Link
                            href={viewRoute}
                            onClick={() => {
                              console.log('🔗 Link clicked - ID:', report.id);
                              console.log('🔗 Status:', report.status);
                              console.log('🔗 Full href:', viewRoute);
                            }}
                            className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-gray-100 dark:bg-gray-800 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 transition-colors hover:bg-gray-200 dark:hover:bg-gray-700"
                          >
                            <Eye className="h-4 w-4" />
                            View
                          </Link>
                        );
                      })()}

                      {/*canEdit(report.status) && ( UNUSED EDIT BUTTON
                        <Link
                          href={`/reports/${report.id}/edit`}
                          className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-red-50 dark:bg-red-900/30 px-3 py-2 text-sm font-medium text-red-700 dark:text-red-300 transition-colors hover:bg-red-100 dark:hover:bg-red-900/50"
                        >
                          <Edit className="h-4 w-4" />
                          Edit
                        </Link>
                      )*/}

                      {report.status === 'revisions_requested' && (
                        <button
                          onClick={() => resubmitReport(report.id)}
                          className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-blue-50 dark:bg-blue-900/30 px-3 py-2 text-sm font-medium text-blue-700 dark:text-blue-300 transition-colors hover:bg-blue-100 dark:hover:bg-blue-900/50"
                        >
                          <Upload className="h-4 w-4" />
                          Resubmit
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* List View */
              <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-800/50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                        Report Details
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                        Status
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                        Date
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {filteredReports.map((report) => (
                      <tr key={report.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-start gap-4">
                            <div className={`h-12 w-12 rounded-lg flex items-center justify-center ${getStatusBg(report.status)}`}>
                              {getStatusIcon(report.status)}
                            </div>

                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-semibold text-gray-900 dark:text-white">{report.title}</h4>
                              </div>

                              <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                                <div className="flex items-center gap-1">
                                  <HardHat className="h-3.5 w-3.5" />
                                  <span>
                                    {report.equipment ?? '-'} • {report.equipmentTag ?? '-'}
                                  </span>
                                </div>

                                <div className="flex items-center gap-1">
                                  <User className="h-3.5 w-3.5" />
                                  <span>{report.createdBy}</span>
                                </div>

                                <div className="flex items-center gap-1">
                                  <FolderOpen className="h-3.5 w-3.5" />
                                  <span>{report.attachments ?? 0} files</span>
                                </div>
                              </div>

                              <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">Reviewer: {report.reviewer}</div>
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          {/* ✅ CHANGED (necessary): status becomes clickable for rejected/revisions_requested */}
                          {hasReason(report) ? (
                            <button
                              type="button"
                              onClick={() => openReason(report)}
                              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium ${getStatusColor(
                                report.status
                              )} hover:opacity-90 transition-opacity`}
                              title="Click to view reason"
                            >
                              {getStatusIcon(report.status)}
                              {formatStatus(report.status)}
                              <MessageSquareText className="h-3.5 w-3.5 ml-0.5" />
                            </button>
                          ) : (
                            <div
                              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium ${getStatusColor(
                                report.status
                              )}`}
                            >
                              {getStatusIcon(report.status)}
                              {formatStatus(report.status)}
                            </div>
                          )}
                        </td>

                        <td className="px-6 py-4">
                          <div className="space-y-1">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {report.createdAt 
                              ? new Date(report.createdAt).toLocaleDateString('en-GB', {
                                    day: '2-digit',
                                    month: '2-digit',
                                    year: 'numeric'
                                  })
                                : '—'
                              }
                            </div>
                            <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                              <Clock className="h-3 w-3" />
                              Updated {report.lastUpdated ?? '—'}
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1">
                            {/* ✅ UPDATED: Use dynamic routing for List View too */}
                            {(() => {
                              // Determine the route based on status
                              let viewRoute = `/pv-report/${report.id}`; // Default for draft/revisions_requested

                              if (['approved', 'rejected', 'submitted', 'in_review'].includes(report.status)) {
                                viewRoute = `/report/show/${report.id}`;
                              }

                              return (
                                <Link
                                  href={viewRoute}
                                  className="inline-flex items-center gap-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 transition-colors hover:bg-gray-200 dark:hover:bg-gray-700"
                                >
                                  <Eye className="h-3.5 w-3.5" />
                                  View
                                </Link>
                              );
                            })()}

                            {/*canEdit(report.status) && ( UNUSED EDIT BUTTON
                              <Link
                                href={`/reports/${report.id}/edit`}
                                className="inline-flex items-center gap-1.5 rounded-lg bg-red-50 dark:bg-red-900/30 px-3 py-1.5 text-xs font-medium text-red-700 dark:text-red-300 transition-colors hover:bg-red-100 dark:hover:bg-red-900/50"
                              >
                                <Edit className="h-3.5 w-3.5" />
                                Edit
                              </Link>
                            )*/}

                            {/* ✅ ADDED: Resubmit button in List View */}
                            {report.status === 'revisions_requested' && (
                              <button
                                onClick={() => resubmitReport(report.id)}
                                className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 dark:bg-blue-900/30 px-3 py-1.5 text-xs font-medium text-blue-700 dark:text-blue-300 transition-colors hover:bg-blue-100 dark:hover:bg-blue-900/50"
                              >
                                <Upload className="h-3.5 w-3.5" />
                                Resubmit
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Empty State */}
                {filteredReports.length === 0 && (
                  <div className="p-16 text-center">
                    <div className="inline-flex p-4 bg-gray-100 dark:bg-gray-800 rounded-2xl mb-4">
                      <FileText className="h-12 w-12 text-gray-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No reports found</h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
                      {searchQuery
                        ? "Try adjusting your search terms to find what you're looking for."
                        : 'Get started by creating your first inspection report.'}
                    </p>
                    {!searchQuery && (
                      <Link
                        href="/pv-report"
                        className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-red-700 px-5 py-3 text-sm font-semibold text-white transition-all hover:from-red-700 hover:to-red-800 hover:shadow-lg hover:shadow-red-500/25"
                      >
                        <Plus className="h-4 w-4" />
                        Create New Report
                      </Link>
                    )}
                  </div>
                )}
              </div>
            )}
            {/* Pagination Component */}
{pagination && (
  <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-6 pt-6 border-t border-gray-200 dark:border-gray-800">
    <div className="text-sm text-gray-600 dark:text-gray-400">
      Showing <span className="font-semibold">{pagination.from}</span> to{' '}
      <span className="font-semibold">{pagination.to}</span> of{' '}
      <span className="font-semibold">{pagination.total}</span> reports
    </div>
    
    <div className="flex items-center gap-4">
      {/* Items per page selector */}
      <div className="flex items-center gap-2">
        <label className="text-sm text-gray-600 dark:text-gray-400">Show:</label>
        <select
          value={perPage}
          onChange={(e) => handlePerPageChange(Number(e.target.value))}
          className="rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-1.5 text-sm focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/20 dark:text-white"
        >
          <option value="10">10</option>
          <option value="15">15</option>
          <option value="25">25</option>
          <option value="50">50</option>
        </select>
        <span className="text-sm text-gray-600 dark:text-gray-400">per page</span>
      </div>
      
      {/* Pagination buttons */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="inline-flex items-center justify-center h-9 w-9 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          <span className="sr-only">Previous</span>
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        
        {/* Page numbers */}
        {pagination.links.slice(1, -1).map((link, index) => (
          <button
            key={index}
            onClick={() => handlePageChange(parseInt(link.label))}
            className={`inline-flex items-center justify-center h-9 min-w-9 px-2 rounded-lg border transition-colors ${
              link.active
                ? 'bg-red-600 border-red-600 text-white'
                : 'border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            {link.label}
          </button>
        ))}
        
        <button
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === pagination.last_page}
          className="inline-flex items-center justify-center h-9 w-9 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          <span className="sr-only">Next</span>
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  </div>
)}
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Showing {filteredReports.length} of {reports.length} reports
          </div>
          <div className="flex items-center gap-3">
            <button className="inline-flex items-center gap-2 rounded-xl border border-gray-300 bg-white dark:bg-gray-800 dark:border-gray-700 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 transition-all hover:bg-gray-50 dark:hover:bg-gray-700">
              <RefreshCw className="h-4 w-4" />
              Refresh
            </button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
