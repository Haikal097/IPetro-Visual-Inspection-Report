import AppLayout from '@/layouts/app-layout';
import { Head, router } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import {
  FileText,
  CheckCircle,
  XCircle,
  Calendar,
  User,
  Eye,
  HardHat,
  Tag,
  MapPin,
  FileCheck,
  AlertCircle,
  ShieldCheck,
  Wrench,
  MessageSquare
} from 'lucide-react';

export default function ShowReview({ report }: { report: any }) {
  console.log("REPORT FROM DB:", report);
  console.log("PHOTO_REPORTS ROWS:", report.photo_reports);
  console.log("PHOTO ITEMS:", report.photo_report_items);

  // ✅ IMPORTANT: some payloads use report_id instead of id
  const reportId = report?.id ?? report?.report_id;

  const [activeTab, setActiveTab] = useState<'overview' | 'findings' | 'photo-items' | 'details'>('overview');

  const breadcrumbs = [
    { title: 'Reports', href: '/review' },
    { title: report.report_number || 'Report Details', href: '#' },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
      case 'submitted': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      case 'in_review': return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300';
      case 'approved': return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300';
      case 'rejected': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      case 'revisions_requested': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  const handleViewPhotoReport = () => {
    if (!reportId) return alert('Missing reportId from backend (report.id/report.report_id is null)');
    router.get(`/reports/photo-report?report_id=${reportId}`);
  };

  const validPhotoItems = report.photo_report_items?.filter((item: any) =>
    item.title || item.findings || item.image || item.requirements
  );

  const [currentStatus, setCurrentStatus] = useState(report.status);

  const canReview = ['submitted', 'in_review'].includes(report.status);


  // ✅ REVIEW ACTIONS (routes match web.php: /review/{report}/...)
  const approveReport = () => {
  if (!reportId) return alert("Missing reportId from backend (report.id/report.report_id is null)");
  router.post(`/review/${reportId}/approve`);
};

const rejectReport = () => {
  if (!reportId) return alert("Missing reportId from backend (report.id/report.report_id is null)");
  const message = prompt("Reason for rejection? (optional)") || "";
  router.post(`/review/${reportId}/reject`, { message });
};

const requestRevision = () => {
  if (!reportId) return alert("Missing reportId from backend (report.id/report.report_id is null)");
  const message = prompt("What needs to be fixed? (required)");
  if (!message || !message.trim()) return;
  router.post(`/review/${reportId}/request-revision`, { message });
};


  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title={`${report.report_number} - Report Details - iPETRO`} />

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
                      {report.title || report.report_data?.title || 'Untitled Report'}
                    </h1>

                    {/* ✅ use currentStatus so UI updates after action */}
                    <div className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium ${getStatusColor(currentStatus)}`}>
                      {String(currentStatus).toUpperCase()}
                    </div>
                  </div>
                  <p className="mt-1.5 text-gray-600 dark:text-gray-400 text-lg">
                    Report No: {report.report_number || report.report_data?.reportNo || 'N/A'} •
                    Created: {report.created_at?.split(' ')[0] || 'N/A'}
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
                    onClick={() => setActiveTab('findings')}
                    className={`px-6 py-4 text-sm font-medium transition-colors whitespace-nowrap ${activeTab === 'findings' ? 'text-red-600 border-b-2 border-red-600 dark:text-red-400 dark:border-red-400' : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300'}`}
                  >
                    Inspection Findings
                  </button>
                  <button
                    onClick={() => setActiveTab('photo-items')}
                    className={`px-6 py-4 text-sm font-medium transition-colors whitespace-nowrap ${activeTab === 'photo-items' ? 'text-red-600 border-b-2 border-red-600 dark:text-red-400 dark:border-red-400' : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300'}`}
                  >
                    Photo Items ({validPhotoItems?.length || 0})
                  </button>
                  <button
                    onClick={() => setActiveTab('details')}
                    className={`px-6 py-4 text-sm font-medium transition-colors whitespace-nowrap ${activeTab === 'details' ? 'text-red-600 border-b-2 border-red-600 dark:text-red-400 dark:border-red-400' : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300'}`}
                  >
                    Report Details
                  </button>
                </div>
              </div>

              {/* Tab Content */}
              <div className="p-6">
                {/* OVERVIEW TAB */}
                {activeTab === 'overview' && (
                  <div className="space-y-6">
                    {/* Basic Information */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Basic Information</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Report Date</p>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {report.report_data?.reportDate || report.inspection_date || 'N/A'}
                          </p>
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Inspection Date</p>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {report.report_data?.inspectionDate || 'N/A'}
                          </p>
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Publish Date</p>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {report.report_data?.publishDate || 'N/A'}
                          </p>
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Submission Date</p>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {report.submission_date || 'Not Submitted'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Equipment Information */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Equipment Information</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Equipment Type</p>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {report.report_data?.equipmentType || 'N/A'}
                          </p>
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Equipment Tag</p>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {report.report_data?.equipmentTag || 'N/A'}
                          </p>
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Plant Unit / Area</p>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {report.report_data?.plantUnitArea || report.plant_unit || 'N/A'}
                          </p>
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">DOSH Registration</p>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {report.report_data?.doshRegistration || 'N/A'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Quick Stats */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Stats</h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <p className="text-2xl font-bold text-gray-900 dark:text-white">
                            {report.photo_report_items?.length || 0}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Photo Items</p>
                        </div>
                        <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <p className="text-2xl font-bold text-gray-900 dark:text-white">
                            {report.photo_report_items?.filter((item: any) => item.image).length || 0}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Photos</p>
                        </div>
                        <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <p className="text-2xl font-bold text-gray-900 dark:text-white">
                            {report.photo_reports?.length || 0}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Photo Reports</p>
                        </div>
                        <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <p className="text-2xl font-bold text-gray-900 dark:text-white">
                            {report.signed_at ? 'Signed' : 'Not Signed'}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Signature Status</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* FINDINGS TAB */}
                {activeTab === 'findings' && (
                  <div className="space-y-6">
                    {report.report_data?.initialFinding && (
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                          <FileCheck className="h-5 w-5 text-blue-600" />
                          Initial Findings / Pre-inspection
                        </h3>
                        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800/30 whitespace-pre-line">
                          {report.report_data.initialFinding}
                        </div>
                      </div>
                    )}

                    {report.report_data?.externalFinding && (
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                          <Eye className="h-5 w-5 text-amber-600" />
                          External Findings
                        </h3>
                        <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-4 border border-amber-200 dark:border-amber-800/30 whitespace-pre-line">
                          {report.report_data.externalFinding}
                        </div>
                      </div>
                    )}

                    {report.report_data?.internalFinding && (
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                          <Wrench className="h-5 w-5 text-emerald-600" />
                          Internal Findings
                        </h3>
                        <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-4 border border-emerald-200 dark:border-emerald-800/30 whitespace-pre-line">
                          {report.report_data.internalFinding}
                        </div>
                      </div>
                    )}

                    {report.report_data?.ndt && (
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                          <ShieldCheck className="h-5 w-5 text-purple-600" />
                          NDT Results
                        </h3>
                        <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 border border-purple-200 dark:border-purple-800/30 whitespace-pre-line">
                          {report.report_data.ndt}
                        </div>
                      </div>
                    )}

                    {report.report_data?.recommendations && (
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                          <AlertCircle className="h-5 w-5 text-red-600" />
                          Recommendations
                        </h3>
                        <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 border border-red-200 dark:border-red-800/30 whitespace-pre-line">
                          {report.report_data.recommendations}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* PHOTO ITEMS TAB */}
                {activeTab === 'photo-items' && (
                  <div className="space-y-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                      Photo Report Items ({validPhotoItems?.length || 0})
                    </h3>

                    {validPhotoItems?.length > 0 ? (
                      <div className="space-y-4">
                        {validPhotoItems.map((item: any, index: number) => (
                          <div key={item.id} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                            <div className="flex items-start gap-4">
                              {item.image && (
                                <div className="flex-shrink-0">
                                  <img
                                    src={item.image}
                                    alt={item.title || `Photo ${index + 1}`}
                                    className="w-32 h-32 object-cover rounded-lg"
                                  />
                                </div>
                              )}

                              <div className="flex-1">
                                <div className="flex items-start justify-between mb-2">
                                  <h4 className="font-medium text-gray-900 dark:text-white">
                                    {item.title || `Item ${index + 1}`}
                                  </h4>
                                  <span className="text-xs text-gray-500">ID: {item.id}</span>
                                </div>

                                {item.findings && (
                                  <div className="mb-3">
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Findings:</p>
                                    <p className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-line">
                                      {item.findings.length > 200 ? `${item.findings.substring(0, 200)}...` : item.findings}
                                    </p>
                                  </div>
                                )}

                                {item.requirements && (
                                  <div>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Requirements:</p>
                                    <p className="text-sm text-gray-800 dark:text-gray-200">
                                      {item.requirements}
                                    </p>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-gray-500 dark:text-gray-400">No photo items available</p>
                      </div>
                    )}
                  </div>
                )}

                {/* DETAILS TAB */}
                {activeTab === 'details' && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Report Metadata</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Report ID</p>
                          <p className="font-medium text-gray-900 dark:text-white">{reportId ?? 'N/A'}</p>
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Report Number</p>
                          <p className="font-medium text-gray-900 dark:text-white">{report.report_number}</p>
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Status</p>
                          <p className="font-medium text-gray-900 dark:text-white">{currentStatus}</p>
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Last Updated</p>
                          <p className="font-medium text-gray-900 dark:text-white">{report.updated_at}</p>
                        </div>
                      </div>
                    </div>

                    {report.photo_reports && report.photo_reports.length > 0 && (
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Photo Reports</h3>
                        <div className="space-y-4">
                          {report.photo_reports.map((photoReport: any) => (
                            <div key={photoReport.id} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Report Title</p>
                                  <p className="font-medium text-gray-900 dark:text-white">{photoReport.report_title}</p>
                                </div>
                                <div>
                                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Report Number</p>
                                  <p className="font-medium text-gray-900 dark:text-white">{photoReport.report_number}</p>
                                </div>
                                <div>
                                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Plant Unit</p>
                                  <p className="font-medium text-gray-900 dark:text-white">{photoReport.plant_unit}</p>
                                </div>
                                <div>
                                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Tag</p>
                                  <p className="font-medium text-gray-900 dark:text-white">{photoReport.tag}</p>
                                </div>
                                <div>
                                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">PMT</p>
                                  <p className="font-medium text-gray-900 dark:text-white">{photoReport.pmt || 'N/A'}</p>
                                </div>
                                <div>
                                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Inspection Date</p>
                                  <p className="font-medium text-gray-900 dark:text-white">
                                    {photoReport.inspection_date?.split('T')[0] || 'N/A'}
                                  </p>
                                </div>
                              </div>
                              {photoReport.description && (
                                <div className="mt-3">
                                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Description</p>
                                  <p className="text-sm text-gray-800 dark:text-gray-200">{photoReport.description}</p>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Raw Report Data</h3>
                      <div className="bg-gray-900 rounded-lg p-4 overflow-auto max-h-96">
                        <pre className="text-sm text-gray-300 whitespace-pre-wrap">
                          {JSON.stringify(report.report_data, null, 2)}
                        </pre>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-8">
            {/* Creator/Inspector Panel */}
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Report Creator</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                      <User className="h-5 w-5 text-red-600 dark:text-red-400" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {report.creator?.name || report.report_data?.inspectorName || 'Unknown'}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {report.creator?.email || 'N/A'}
                      </p>
                      {report.creator?.phone && (
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Phone: {report.creator.phone}
                        </p>
                      )}
                      <div className="mt-2">
                        <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 rounded-full">
                          Creator ID: {report.creator_id || 'N/A'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Status Panel */}
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Report Status</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Current Status</p>
                  <span className={`px-3 py-1 text-xs rounded-full ${getStatusColor(currentStatus)}`}>
                    {String(currentStatus).toUpperCase()}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Reviewer ID</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {report.reviewer_id || 'Not Assigned'}
                  </p>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Inspector ID</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {report.inspector_id || 'N/A'}
                  </p>
                </div>
                <div className="pt-3 border-t border-gray-200 dark:border-gray-800">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Signed At</p>
                    <p className={`text-sm font-medium ${report.signed_at ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-500'}`}>
                      {report.signed_at || 'Not Signed'}
                    </p>
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
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {report.created_at?.split(' ')[0] || 'N/A'}
                  </p>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Last Updated</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {report.updated_at?.split(' ')[0] || 'N/A'}
                  </p>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Submission Date</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {report.submission_date?.split(' ')[0] || 'Not Submitted'}
                  </p>
                </div>
              </div>
            </div>

            {/* Actions Panel */}
            {canReview && (
              <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Review Actions</h3>
                <div className="space-y-3">
                  <button
                    onClick={approveReport}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-emerald-600 to-emerald-700 px-4 py-3 text-sm font-semibold text-white transition-all hover:from-emerald-700 hover:to-emerald-800"
                  >
                    <CheckCircle className="h-4 w-4" />
                    Approve Report
                  </button>
                  <button
                    onClick={rejectReport}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-red-600 to-red-700 px-4 py-3 text-sm font-semibold text-white transition-all hover:from-red-700 hover:to-red-800"
                  >
                    <XCircle className="h-4 w-4" />
                    Reject Report
                  </button>
                  <button
                    onClick={requestRevision}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white dark:bg-gray-800 dark:border-gray-700 px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <MessageSquare className="h-4 w-4" />
                    Request Revision
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
