import AppLayout from '@/layouts/app-layout';
import { Head, Link, router } from '@inertiajs/react';
import { type BreadcrumbItem } from '@/types';
import { useState, useEffect } from 'react';
import { 
  FileText, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertCircle,
  User,
  Download,
  MoreVertical,
  Calendar,
  Shield,
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  Paperclip,
  History,
  Eye,
  Edit,
  Send,
  Printer,
  Share2,
  Archive,
  Tag,
  HardHat,
  Wrench,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Search,
  Filter,
  BarChart3,
  Lock,
  Unlock,
  Users,
  Flag,
  Star,
  Award,
  FileCheck,
  FileX,
  FileSearch,
  Settings,
  Bell,
  Mail,
  Phone,
  MapPin,
  Globe,
  Database,
  ShieldCheck,
  Zap,
  Battery,
  Thermometer,
  Gauge,
  Activity,
  TrendingUp,
  TrendingDown
} from 'lucide-react';

interface Report {
  id: number;
  reportNumber: string;
  title: string;
  status: 'draft' | 'submitted' | 'in_review' | 'approved' | 'rejected' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'critical';
  inspector: {
    id: number;
    name: string;
    email: string;
    phone: string;
    role: string;
    avatar?: string;
  };
  reviewer?: {
    id: number;
    name: string;
    email: string;
    phone: string;
    role: string;
    avatar?: string;
  };
  equipment: {
    type: string;
    tag: string;
    description: string;
    location: string;
    plantUnit: string;
    manufacturer: string;
    model: string;
    serialNumber: string;
    installationDate: string;
    lastInspectionDate: string;
  };
  inspection: {
    date: string;
    type: string;
    method: string;
    temperature: string;
    pressure: string;
    humidity: string;
    findingsSummary: string;
    recommendations: string;
  };
  dates: {
    created: string;
    submitted: string;
    reviewed: string;
    approved: string;
    dueDate: string;
  };
  attachments: {
    id: number;
    name: string;
    type: 'image' | 'pdf' | 'document' | 'spreadsheet' | 'video';
    size: string;
    uploadedBy: string;
    uploadedAt: string;
    url: string;
  }[];
  comments: {
    id: number;
    user: {
      id: number;
      name: string;
      role: string;
      avatar?: string;
    };
    content: string;
    timestamp: string;
    type: 'comment' | 'question' | 'approval' | 'rejection' | 'revision';
    attachments?: string[];
  }[];
  history: {
    id: number;
    action: string;
    user: string;
    role: string;
    timestamp: string;
    details?: string;
  }[];
  metrics: {
    riskScore: number;
    integrityScore: number;
    complianceScore: number;
    estimatedCost: number;
    estimatedTime: string;
  };
  relatedReports: {
    id: number;
    reportNumber: string;
    title: string;
    status: string;
    date: string;
  }[];
}

export default function ShowReview({ report }: { report: any }) {

    console.log("REPORT FROM DB:", report);
  console.log("PHOTO_REPORTS ROWS:", report.photo_reports);
  console.log("PHOTO ITEMS:", report.photo_report_items);
  
  const [activeTab, setActiveTab] = useState<'overview' | 'details' | 'attachments' | 'comments' | 'history' | 'related'>('overview');
  const [newComment, setNewComment] = useState('');
  const [commentType, setCommentType] = useState<'comment' | 'question'>('comment');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reportData, setReportData] = useState<Report | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [selectedAttachment, setSelectedAttachment] = useState<number | null>(null);

  useEffect(() => {
    if (!report) return;

    setReportData({
      id: report.id,
      reportNumber: report.report_number ?? report.report_data?.reportNo ?? `RPT-${report.id}`,
      title: report.title ?? report.report_data?.title ?? 'Untitled Report',
      status: report.status ?? 'draft',
      priority: 'medium',

      // ✅ inspector follows report creator
      inspector: {
        id: report.creator?.id ?? report.creator_id ?? 0,
        name: report.creator?.name ?? report.report_data?.inspectorName ?? 'Unknown',
        email: report.creator?.email ?? '',
        phone: report.creator?.phone ?? '',
        role: 'Creator / Inspector',
      },

      equipment: {
        type: report.report_data?.equipmentType ?? '',
        tag: report.report_data?.equipmentTag ?? '',
        description: report.report_data?.equipmentDescription ?? '',
        location: report.report_data?.location ?? '',
        plantUnit: report.report_data?.plantUnitArea ?? '',
        manufacturer: report.report_data?.manufacturer ?? '',
        model: report.report_data?.model ?? '',
        serialNumber: report.report_data?.serialNumber ?? '',
        installationDate: report.report_data?.installationDate ?? '',
        lastInspectionDate: report.report_data?.lastInspectionDate ?? '',
      },

      inspection: {
        date: report.inspection_date ?? '',
        type: report.report_data?.inspectionType ?? '',
        method: report.report_data?.inspectionMethod ?? '',
        temperature: report.report_data?.temperature ?? '',
        pressure: report.report_data?.pressure ?? '',
        humidity: report.report_data?.humidity ?? '',
        findingsSummary: report.report_data?.findingsSummary ?? '',
        recommendations: report.report_data?.recommendations ?? '',
      },

      dates: {
        created: report.created_at?.split(' ')[0] ?? '',
        submitted: report.submission_date?.split(' ')[0] ?? '',
        reviewed: report.reviewed_at?.split(' ')[0] ?? '',
        approved: report.signed_at?.split(' ')[0] ?? '',
        dueDate: report.due_date ?? '',
      },

      attachments: [],   // map later if you have attachments table
      comments: [],      // map later if you have comments table
      history: [],       // map later if you have history table

      metrics: {
        riskScore: 0,
        integrityScore: 0,
        complianceScore: 0,
        estimatedCost: 0,
        estimatedTime: '',
      },

      relatedReports: [],
    });

    setIsLoading(false);
  }, [report]);

  const breadcrumbs: BreadcrumbItem[] = [
    {
      title: 'Reports',
      href: '/reports',
    },
    {
      title: reportData?.reportNumber || 'Report Details',
      href: '#',
    },
  ];

  const getStatusColor = (status: Report['status']) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
      case 'submitted': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      case 'in_review': return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300';
      case 'approved': return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300';
      case 'rejected': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      case 'closed': return 'bg-gray-800 text-white dark:bg-gray-900 dark:text-gray-100';
    }
  };

  const getPriorityColor = (priority: Report['priority']) => {
    switch (priority) {
      case 'low': return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
      case 'medium': return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300';
      case 'high': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      case 'critical': return 'bg-red-800 text-white dark:bg-red-900 dark:text-red-100';
    }
  };

  const getStatusIcon = (status: Report['status']) => {
    switch (status) {
      case 'draft': return <Edit className="h-4 w-4" />;
      case 'submitted': return <Send className="h-4 w-4" />;
      case 'in_review': return <Eye className="h-4 w-4" />;
      case 'approved': return <CheckCircle className="h-4 w-4" />;
      case 'rejected': return <XCircle className="h-4 w-4" />;
      case 'closed': return <Archive className="h-4 w-4" />;
    }
  };

  const getPriorityIcon = (priority: Report['priority']) => {
    switch (priority) {
      case 'low': return <Flag className="h-4 w-4" />;
      case 'medium': return <AlertTriangle className="h-4 w-4" />;
      case 'high': return <AlertCircle className="h-4 w-4" />;
      case 'critical': return <Zap className="h-4 w-4" />;
    }
  };

  const handleApprove = () => {
    setIsSubmitting(true);
    // API call to approve report
    setTimeout(() => {
      if (reportData) {
        setReportData({
          ...reportData,
          status: 'approved',
          dates: {
            ...reportData.dates,
            approved: new Date().toISOString().split('T')[0]
          }
        });
      }
      setShowApproveModal(false);
      setIsSubmitting(false);
    }, 1000);
  };

  const handleReject = () => {
    if (!rejectionReason.trim()) {
      alert('Please provide a reason for rejection');
      return;
    }
    
    setIsSubmitting(true);
    // API call to reject report
    setTimeout(() => {
      if (reportData) {
        setReportData({
          ...reportData,
          status: 'rejected'
        });
      }
      setShowRejectModal(false);
      setRejectionReason('');
      setIsSubmitting(false);
    }, 1000);
  };

  const handleSubmitComment = () => {
    if (!newComment.trim()) return;
    
    const newCommentObj = {
      id: Date.now(),
      user: {
        id: 201, // Current user ID
        name: 'Current User',
        role: 'Reviewer',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Current'
      },
      content: newComment,
      timestamp: new Date().toISOString(),
      type: commentType
    };
    
    if (reportData) {
      setReportData({
        ...reportData,
        comments: [newCommentObj, ...reportData.comments]
      });
    }
    
    setNewComment('');
  };

  const handleDownloadAttachment = (attachmentId: number) => {
    console.log('Downloading attachment:', attachmentId);
    // Implement download logic
  };

  const handleViewPhotoReport = () => {
    router.get(`/reports/photo-report?report_id=${reportData?.id}`);
  };

  if (isLoading || !reportData) {
    return (
      <AppLayout breadcrumbs={breadcrumbs}>
        <Head title="Report Details - iPETRO" />
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading report details...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title={`${reportData.reportNumber} - Report Details - iPETRO`} />

      <div className="px-6 py-6 bg-gradient-to-br from-gray-50 via-white to-gray-50/50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900/50 min-h-screen">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="p-3 bg-gradient-to-br from-red-600 to-red-700 rounded-xl shadow-lg">
                  <FileText className="h-6 w-6 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-3">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
                      {reportData.title}
                    </h1>
                    <div className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium ${getStatusColor(reportData.status)}`}>
                      {getStatusIcon(reportData.status)}
                      {reportData.status.replace('_', ' ').toUpperCase()}
                    </div>
                    <div className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium ${getPriorityColor(reportData.priority)}`}>
                      {getPriorityIcon(reportData.priority)}
                      {reportData.priority.toUpperCase()} PRIORITY
                    </div>
                  </div>
                  <p className="mt-1.5 text-gray-600 dark:text-gray-400 text-lg">
                    Report ID: {reportData.reportNumber} • Created: {reportData.dates.created}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={handleViewPhotoReport}
                className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-red-600 to-red-700 px-4 py-2.5 text-sm font-semibold text-white transition-all hover:from-red-700 hover:to-red-800 hover:shadow-lg hover:shadow-red-500/25 shadow-md"
              >
                <Eye className="h-4 w-4" />
                View Photo Report
              </button>
              <button className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white dark:bg-gray-800 dark:border-gray-700 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 transition-all hover:bg-gray-50 dark:hover:bg-gray-700">
                <Download className="h-4 w-4" />
                Export PDF
              </button>
              <button className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white dark:bg-gray-800 dark:border-gray-700 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 transition-all hover:bg-gray-50 dark:hover:bg-gray-700">
                <Printer className="h-4 w-4" />
                Print
              </button>
              <button className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white dark:bg-gray-800 dark:border-gray-700 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 transition-all hover:bg-gray-50 dark:hover:bg-gray-700">
                <MoreVertical className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Report Details */}
          <div className="lg:col-span-2">
            {/* Tabs */}
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 mb-8">
              <div className="border-b border-gray-200 dark:border-gray-800">
                <div className="flex overflow-x-auto">
                  <button
                    onClick={() => setActiveTab('overview')}
                    className={`px-6 py-4 text-sm font-medium transition-colors whitespace-nowrap ${activeTab === 'overview' ? 'text-red-600 border-b-2 border-red-600 dark:text-red-400 dark:border-red-400' : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300'}`}
                  >
                    Overview
                  </button>
                  <button
                    onClick={() => setActiveTab('details')}
                    className={`px-6 py-4 text-sm font-medium transition-colors whitespace-nowrap ${activeTab === 'details' ? 'text-red-600 border-b-2 border-red-600 dark:text-red-400 dark:border-red-400' : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300'}`}
                  >
                    Details
                  </button>
                  <button
                    onClick={() => setActiveTab('attachments')}
                    className={`px-6 py-4 text-sm font-medium transition-colors whitespace-nowrap ${activeTab === 'attachments' ? 'text-red-600 border-b-2 border-red-600 dark:text-red-400 dark:border-red-400' : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300'}`}
                  >
                    Attachments ({reportData.attachments.length})
                  </button>
                  <button
                    onClick={() => setActiveTab('history')}
                    className={`px-6 py-4 text-sm font-medium transition-colors whitespace-nowrap ${activeTab === 'history' ? 'text-red-600 border-b-2 border-red-600 dark:text-red-400 dark:border-red-400' : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300'}`}
                  >
                    History
                  </button>
                  <button
                    onClick={() => setActiveTab('related')}
                    className={`px-6 py-4 text-sm font-medium transition-colors whitespace-nowrap ${activeTab === 'related' ? 'text-red-600 border-b-2 border-red-600 dark:text-red-400 dark:border-red-400' : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300'}`}
                  >
                    Related Reports
                  </button>
                </div>
              </div>

              {/* Tab Content */}
              <div className="p-6">
                {activeTab === 'overview' && (
                  <div className="space-y-6">
                    {/* Inspection Overview */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Inspection Overview</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Inspection Date</p>
                          <p className="font-medium text-gray-900 dark:text-white">{reportData.inspection.date}</p>
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Inspection Type</p>
                          <p className="font-medium text-gray-900 dark:text-white">{reportData.inspection.type}</p>
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Method</p>
                          <p className="font-medium text-gray-900 dark:text-white">{reportData.inspection.method}</p>
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Environmental Conditions</p>
                          <div className="flex items-center gap-4">
                            <span className="text-sm text-gray-900 dark:text-white">{reportData.inspection.temperature}</span>
                            <span className="text-sm text-gray-900 dark:text-white">{reportData.inspection.pressure}</span>
                            <span className="text-sm text-gray-900 dark:text-white">{reportData.inspection.humidity}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Findings & Recommendations */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Key Findings</h3>
                        <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-4 border border-amber-200 dark:border-amber-800/30">
                          <p className="text-gray-700 dark:text-gray-300">{reportData.inspection.findingsSummary}</p>
                        </div>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Recommendations</h3>
                        <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-4 border border-emerald-200 dark:border-emerald-800/30">
                          <p className="text-gray-700 dark:text-gray-300">{reportData.inspection.recommendations}</p>
                        </div>
                      </div>
                    </div>

                    {/* Quick Stats */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Stats</h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <p className="text-2xl font-bold text-gray-900 dark:text-white">8</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Photos</p>
                        </div>
                        <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <p className="text-2xl font-bold text-gray-900 dark:text-white">3</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Documents</p>
                        </div>
                        <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <p className="text-2xl font-bold text-gray-900 dark:text-white">5</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Measurements</p>
                        </div>
                        <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <p className="text-2xl font-bold text-gray-900 dark:text-white">2</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Open Actions</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'details' && (
                  <div className="space-y-6">
                    {/* Equipment Details */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Equipment Details</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {Object.entries(reportData.equipment).map(([key, value]) => (
                          <div key={key} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                              {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                            </p>
                            <p className="font-medium text-gray-900 dark:text-white">{value}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'attachments' && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Attachments</h3>
                    <div className="space-y-3">
                      {reportData.attachments.map((attachment) => (
                        <div key={attachment.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${attachment.type === 'image' ? 'bg-blue-100 text-blue-600' : attachment.type === 'pdf' ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600'}`}>
                              {attachment.type === 'image' ? <Eye className="h-5 w-5" /> :
                               attachment.type === 'pdf' ? <FileText className="h-5 w-5" /> :
                               <FileText className="h-5 w-5" />}
                            </div>
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white">{attachment.name}</p>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {attachment.size} • Uploaded by {attachment.uploadedBy} on {attachment.uploadedAt}
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => handleDownloadAttachment(attachment.id)}
                            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                          >
                            <Download className="h-5 w-5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {activeTab === 'history' && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Report History</h3>
                    <div className="space-y-3">
                      {reportData.history.map((item, index) => (
                        <div key={item.id} className="flex items-start gap-4">
                          <div className="relative">
                            <div className="h-8 w-8 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                              <History className="h-4 w-4 text-red-600 dark:text-red-400" />
                            </div>
                            {index < reportData.history.length - 1 && (
                              <div className="absolute top-8 left-4 w-0.5 h-12 bg-gray-200 dark:bg-gray-700"></div>
                            )}
                          </div>
                          <div className="flex-1 pb-6">
                            <div className="flex items-center justify-between mb-1">
                              <p className="font-medium text-gray-900 dark:text-white">{item.action}</p>
                              <p className="text-sm text-gray-600 dark:text-gray-400">{item.timestamp}</p>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              By {item.user} ({item.role})
                            </p>
                            {item.details && (
                              <p className="mt-2 text-sm text-gray-700 dark:text-gray-300 italic">{item.details}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {activeTab === 'related' && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Related Reports</h3>
                    <div className="space-y-3">
                      {reportData.relatedReports.map((related) => (
                        <Link
                          key={related.id}
                          href={`/reports/${related.id}`}
                          className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        >
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">{related.reportNumber}</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{related.title}</p>
                          </div>
                          <div className="text-right">
                            <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full ${
                              related.status === 'approved' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300' :
                              related.status === 'closed' ? 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300' :
                              'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300'
                            }`}>
                              {related.status.toUpperCase()}
                            </span>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{related.date}</p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-8">
            {/* Actions Panel */}
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Actions</h3>
              <div className="space-y-3">
                {reportData.status === 'in_review' && (
                  <>
                    <button
                      onClick={() => setShowApproveModal(true)}
                      className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-emerald-600 to-emerald-700 px-4 py-3 text-sm font-semibold text-white transition-all hover:from-emerald-700 hover:to-emerald-800 hover:shadow-lg hover:shadow-emerald-500/25"
                    >
                      <CheckCircle className="h-4 w-4" />
                      Approve Report
                    </button>
                    <button
                      onClick={() => setShowRejectModal(true)}
                      className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-red-600 to-red-700 px-4 py-3 text-sm font-semibold text-white transition-all hover:from-red-700 hover:to-red-800 hover:shadow-lg hover:shadow-red-500/25"
                    >
                      <XCircle className="h-4 w-4" />
                      Reject Report
                    </button>
                    <button className="w-full inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white dark:bg-gray-800 dark:border-gray-700 px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 transition-all hover:bg-gray-50 dark:hover:bg-gray-700">
                      <MessageSquare className="h-4 w-4" />
                      Request Revision
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* People Panel */}
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Inspector</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                      <User className="h-5 w-5 text-red-600 dark:text-red-400" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{reportData.inspector.name}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{reportData.inspector.role}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Mail className="h-3 w-3 text-gray-400" />
                        <span className="text-xs text-gray-500">{reportData.inspector.email}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Timeline Panel */}
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Timeline</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Created</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{reportData.dates.created}</p>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Submitted</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{reportData.dates.submitted}</p>
                </div>
                {reportData.dates.reviewed && (
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Review Started</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{reportData.dates.reviewed}</p>
                  </div>
                )}
                {reportData.dates.approved && (
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Approved</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{reportData.dates.approved}</p>
                  </div>
                )}
                <div className="pt-3 border-t border-gray-200 dark:border-gray-800">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">Due Date</p>
                    <p className={`text-sm font-medium ${new Date(reportData.dates.dueDate) > new Date() ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                      {reportData.dates.dueDate}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Approve Modal */}
      {showApproveModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 max-w-md w-full">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                <CheckCircle className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Approve Report</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Are you sure you want to approve this report?</p>
              </div>
            </div>
            <div className="space-y-4">
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Report Details</p>
                <p className="font-medium text-gray-900 dark:text-white">{reportData.reportNumber}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">{reportData.title}</p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowApproveModal(false)}
                  className="flex-1 rounded-lg border border-gray-300 bg-white dark:bg-gray-800 dark:border-gray-700 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 transition-all hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  onClick={handleApprove}
                  disabled={isSubmitting}
                  className="flex-1 rounded-lg bg-gradient-to-r from-emerald-600 to-emerald-700 px-4 py-2.5 text-sm font-semibold text-white transition-all hover:from-emerald-700 hover:to-emerald-800 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Approving...' : 'Approve Report'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 max-w-md w-full">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                <XCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Reject Report</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Please provide a reason for rejection</p>
              </div>
            </div>
            <div className="space-y-4">
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Enter reason for rejection..."
                className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-3 text-sm focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/20 dark:text-white"
                rows={3}
              />
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowRejectModal(false);
                    setRejectionReason('');
                  }}
                  className="flex-1 rounded-lg border border-gray-300 bg-white dark:bg-gray-800 dark:border-gray-700 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 transition-all hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReject}
                  disabled={isSubmitting || !rejectionReason.trim()}
                  className="flex-1 rounded-lg bg-gradient-to-r from-red-600 to-red-700 px-4 py-2.5 text-sm font-semibold text-white transition-all hover:from-red-700 hover:to-red-800 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Rejecting...' : 'Reject Report'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}