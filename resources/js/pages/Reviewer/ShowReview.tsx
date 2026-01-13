// Inspector and Reviewer - Show Single Report Details Page

import AppLayout from '@/layouts/app-layout';
import { Head, router, usePage } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import PhotoReportPrint from '@/components/printable/PhotoReportPrint';
import PVReportPrint from '@/components/printable/PVReportPrint';
import ReportReviewAssistantPanel from "@/components/ai/ReportReviewAssistantPanel";
import ReportReviewModal from "@/components/ai/ReportReviewModal";

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
  MessageSquare,
  Printer
} from 'lucide-react';

export default function ShowReview({ report }: { report: any }) {

  const { props } = usePage();
  const user = props.auth?.user;
  const canUserReview = ['reviewer', 'admin', 'supervisor'].includes(user?.role);
  const currentUserSignature = props.auth?.signatureUrl;

  // From report
  const inspectorSignature = report.inspector_signature_url; // Report creator (inspector)
  const reviewerSignature = report.reviewer_signature_url; // Reviewer signature

  // ✅ IMPORTANT: some payloads use report_id instead of id
  const reportId = report?.id ?? report?.report_id;

  const [activeTab, setActiveTab] = useState<'overview' | 'findings' | 'photo-items' | 'details'>('overview');
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const [printData, setPrintData] = useState<any>(null);

  const breadcrumbs = [
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

  const handlePrintPhotoReport = () => {
      const rd = report.report_data || {};
      const firstPhotoReport = report.photo_reports?.[0] ?? null;

      const printData = {
          title: report.title,
          reportNo: rd.reportNo || report.report_number,
          reportDate: rd.reportDate || report.created_at,

          equipmentTag: rd.equipmentTag,
          equipmentDescription: rd.equipmentDescription,
          equipmentType: rd.equipmentType,
          plantUnitArea: rd.plantUnitArea,
          doshRegistration: rd.doshRegistration,

          initialFinding: rd.initialFinding,
          externalFinding: rd.externalFinding,
          internalFinding: rd.internalFinding,

          ndt: rd.ndt,
          recommendations: rd.recommendations,

          inspectorName: rd.inspectorName || report.creator?.name,
          publishDate: rd.publishDate,

          // ✅ Inspector signature (report creator)
          inspectorSignatureUrl: report.inspector_signature_url || null,
          
          // ✅ Reviewer signature (current user - for approval section)
          reviewerSignatureUrl: report.reviewer_signature_url || null,
          
          reviewerName: user?.name || null, // Current user name

          photoReport: firstPhotoReport,

          items: report.photo_report_items?.map((item: any) => ({
              id: item.id,
              title: item.title,
              findings: item.findings,
              requirements: item.requirements,
              image: item.image,
          })) || [],
      };

      setPrintData(printData);
      setShowPrintPreview(true);
  };

  // Helper function to download images one by one (fallback)
const downloadImagesIndividually = (items: any[]) => {
  items.forEach((item, index) => {
    setTimeout(() => {
      const link = document.createElement('a');
      link.href = item.image;
      link.download = `${item.title || `photo-item-${index + 1}`}-${item.id}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }, index * 300); // Stagger downloads to avoid browser blocking
  });
  
  if (items.length > 1) {
    alert(`Started downloading ${items.length} images. They will download one by one.`);
  }
};

// Helper function to download images as ZIP (requires JSZip library)
const downloadImagesAsZip = async (items: any[]) => {
  try {
    // Dynamically import JSZip if not already loaded
    const JSZip = (window as any).JSZip;
    const zip = new JSZip();
    
    // Show loading message
    alert(`Preparing ZIP file with ${items.length} images...`);
    
    // Fetch and add each image to the ZIP
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      try {
        const response = await fetch(item.image);
        const blob = await response.blob();
        const filename = `${item.title || `photo-item-${i + 1}`}-${item.id}.jpg`;
        zip.file(filename, blob);
      } catch (error) {
        console.error(`Failed to fetch image ${i + 1}:`, error);
      }
    }
    
    // Generate ZIP file
    const content = await zip.generateAsync({ type: 'blob' });
    
    // Download the ZIP
    const link = document.createElement('a');
    link.href = URL.createObjectURL(content);
    link.download = `report-${reportId || 'images'}-photos.zip`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up
    URL.revokeObjectURL(link.href);
    
  } catch (error) {
    console.error('Failed to create ZIP file:', error);
    alert('Failed to create ZIP file. Falling back to individual downloads.');
    downloadImagesIndividually(items);
  }
};

  

    const formatDateTime = (dateString?: string | null) => {
    if (!dateString) return 'N/A';

    // Convert "YYYY-MM-DD HH:mm:ss" → ISO
    const isoString = dateString.replace(' ', 'T');

    const date = new Date(isoString);

    return `${date.toLocaleDateString('en-GB')} ${date.toLocaleTimeString('en-GB', {
        hour: '2-digit',
        minute: '2-digit',
    })}`;
    };


  const validPhotoItems = report.photo_report_items?.filter((item: any) =>
    item.title || item.findings || item.image || item.requirements
  );

  const [currentStatus, setCurrentStatus] = useState(report.status);
  const [isPrinting, setIsPrinting] = useState(false);

  const [selectedImage, setSelectedImage] = useState<{
    url: string;
    title: string;
    id: number;
    index: number;
  } | null>(null);

  const canReview = ['submitted', 'in_review'].includes(report.status);

  // ✅ REVIEW ACTIONS (routes match web.php: /review/{report}/...)
  const approveReport = () => {
    if (!reportId) return alert("Missing reportId from backend (report.id/report.report_id is null)");
    const message = prompt("Optional comment for approval? (press Cancel to skip)") || "";
    router.post(`/review/${reportId}/approve`, { message });
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

  //ai review
  const [showAiReview, setShowAiReview] = useState(false);

  //ai review modal
  const [openAiReview, setOpenAiReview] = useState(false);


  // Close print preview if open
  useEffect(() => {
    if (showPrintPreview) {
      // Add a listener for print dialog close
      const handleAfterPrint = () => {
        setShowPrintPreview(false);
      };
      
      window.addEventListener('afterprint', handleAfterPrint);
      return () => window.removeEventListener('afterprint', handleAfterPrint);
    }
  }, [showPrintPreview]);

  if (showPrintPreview && printData) {
    return <PVReportPrint data={printData} reportId={reportId} />;
  }

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
                    Created: {formatDateTime(report.created_at)}
                  </p>
                </div>
              </div>
            </div>
            {/* Not Used 
            <div className="flex flex-wrap gap-3">
              <button
                onClick={handleViewPhotoReport}
                className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-red-600 to-red-700 px-4 py-2.5 text-sm font-semibold text-white transition-all hover:from-red-700 hover:to-red-800 hover:shadow-lg hover:shadow-red-500/25 shadow-md"
              >
                <Eye className="h-4 w-4" />
                View Photo Report
              </button>
              <button
                onClick={handlePrintPhotoReport}
                className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-2.5 text-sm font-semibold text-white transition-all hover:from-blue-700 hover:to-blue-800 hover:shadow-lg hover:shadow-blue-500/25 shadow-md"
              >
                <Printer className="h-4 w-4" />
                Print Photo Report
              </button>
            </div>*/}
          </div>
        </div>

        {/* Image Modal for Magnification */}
        {selectedImage && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
            onClick={() => setSelectedImage(null)}
          >
            <div 
              className="relative max-w-4xl max-h-[90vh] w-full"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close button */}
              <button
                onClick={() => setSelectedImage(null)}
                className="absolute top-4 right-4 z-10 bg-black/70 text-white p-2 rounded-full hover:bg-black/90 transition-colors"
              >
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className="h-6 w-6" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M6 18L18 6M6 6l12 12" 
                  />
                </svg>
              </button>
              
              {/* Download button */}
              <button
                onClick={() => {
                  const link = document.createElement('a');
                  link.href = selectedImage.url;
                  link.download = `${selectedImage.title}-${selectedImage.id}.jpg`;
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                }}
                className="absolute top-4 left-4 z-10 bg-black/70 text-white p-2 rounded-lg hover:bg-black/90 transition-colors flex items-center gap-2"
              >
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className="h-5 w-5" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" 
                  />
                </svg>
                <span className="text-sm">Download</span>
              </button>
              
              {/* Image info */}
              <div className="absolute bottom-4 left-4 z-10 bg-black/70 text-white p-3 rounded-lg">
                <p className="font-medium">{selectedImage.title}</p>
                <p className="text-sm opacity-80">ID: {selectedImage.id} • Item {selectedImage.index + 1}</p>
              </div>
              
              {/* Magnified Image */}
              <img
                src={selectedImage.url}
                alt={selectedImage.title}
                className="w-full h-full object-contain max-h-[80vh] rounded-lg"
              />
              
              {/* Navigation buttons if you want to browse through images */}
              {validPhotoItems && validPhotoItems.length > 1 && (
                <>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      const prevIndex = selectedImage.index > 0 ? selectedImage.index - 1 : validPhotoItems.length - 1;
                      const prevItem = validPhotoItems[prevIndex];
                      if (prevItem?.image) {
                        setSelectedImage({
                          url: prevItem.image,
                          title: prevItem.title || `Item ${prevIndex + 1}`,
                          id: prevItem.id,
                          index: prevIndex
                        });
                      }
                    }}
                    className="absolute left-4 top-1/2 -translate-y-1/2 z-10 bg-black/70 text-white p-3 rounded-full hover:bg-black/90 transition-colors"
                  >
                    <svg 
                      xmlns="http://www.w3.org/2000/svg" 
                      className="h-6 w-6" 
                      fill="none" 
                      viewBox="0 0 24 24" 
                      stroke="currentColor"
                    >
                      <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth={2} 
                        d="M15 19l-7-7 7-7" 
                      />
                    </svg>
                  </button>
                  
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      const nextIndex = selectedImage.index < validPhotoItems.length - 1 ? selectedImage.index + 1 : 0;
                      const nextItem = validPhotoItems[nextIndex];
                      if (nextItem?.image) {
                        setSelectedImage({
                          url: nextItem.image,
                          title: nextItem.title || `Item ${nextIndex + 1}`,
                          id: nextItem.id,
                          index: nextIndex
                        });
                      }
                    }}
                    className="absolute right-4 top-1/2 -translate-y-1/2 z-10 bg-black/70 text-white p-3 rounded-full hover:bg-black/90 transition-colors"
                  >
                    <svg 
                      xmlns="http://www.w3.org/2000/svg" 
                      className="h-6 w-6" 
                      fill="none" 
                      viewBox="0 0 24 24" 
                      stroke="currentColor"
                    >
                      <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth={2} 
                        d="M9 5l7 7-7 7" 
                      />
                    </svg>
                  </button>
                </>
              )}
            </div>
          </div>
        )}

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
                            {formatDateTime(
                              report.report_data?.reportDate
                                ? `${report.report_data.reportDate} 00:00:00`
                                : report.inspection_date
                            )}
                          </p>
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Inspection Date</p>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {formatDateTime(report.report_data?.inspectionDate)}
                          </p>
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Publish Date</p>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {formatDateTime(report.report_data?.publishDate)}
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
                      <div className="flex justify-center">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max--2xl">
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
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        Photo Report Items ({validPhotoItems?.length || 0})
                      </h3>
                      
                      {/* Bulk Download Button */}
                      {validPhotoItems?.some((item: any) => item.image) && (
                        <button
                          onClick={() => {
                            // Get all items with images
                            const itemsWithImages = validPhotoItems.filter((item: any) => item.image);
                            
                            if (itemsWithImages.length === 0) {
                              alert('No images available to download.');
                              return;
                            }
                            
                            if (itemsWithImages.length > 10) {
                              const confirmDownload = confirm(
                                `You are about to download ${itemsWithImages.length} images. This may take a moment. Continue?`
                              );
                              if (!confirmDownload) return;
                            }
                            
                            // Create a ZIP file using JSZip library
                            // First, check if JSZip is available
                            if (typeof window !== 'undefined' && (window as any).JSZip) {
                              downloadImagesAsZip(itemsWithImages);
                            } else {
                              // Fallback: download images one by one
                              downloadImagesIndividually(itemsWithImages);
                            }
                          }}
                          className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-2.5 text-sm font-semibold text-white transition-all hover:from-blue-700 hover:to-blue-800 hover:shadow-lg hover:shadow-blue-500/25 shadow-md"
                          title="Download all images as ZIP"
                        >
                          <svg 
                            xmlns="http://www.w3.org/2000/svg" 
                            className="h-4 w-4" 
                            fill="none" 
                            viewBox="0 0 24 24" 
                            stroke="currentColor"
                          >
                            <path 
                              strokeLinecap="round" 
                              strokeLinejoin="round" 
                              strokeWidth={2} 
                              d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" 
                            />
                          </svg>
                          Download All Images ({validPhotoItems.filter((item: any) => item.image).length})
                        </button>
                      )}
                    </div>

                    {validPhotoItems?.length > 0 ? (
                      <div className="space-y-4">
                        {validPhotoItems.map((item: any, index: number) => (
                          <div key={item.id} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                            <div className="flex items-start gap-4">
                              {item.image && (
                                <div className="flex-shrink-0 relative">
                                  {/* Image container - click opens modal */}
                                  <div 
                                    className="w-32 h-32 overflow-hidden rounded-lg cursor-pointer relative group"
                                    onClick={() => {
                                      // Open modal with this image
                                      setSelectedImage({
                                        url: item.image,
                                        title: item.title || `Item ${index + 1}`,
                                        id: item.id,
                                        index: index
                                      });
                                    }}
                                  >
                                    <img
                                      src={item.image}
                                      alt={item.title || `Photo ${index + 1}`}
                                      className="w-full h-full object-cover"
                                    />
                                    
                                    {/* Magnify icon overlay (appears on hover) */}
                                    <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                      <div className="bg-white/90 p-2 rounded-full">
                                        <svg 
                                          xmlns="http://www.w3.org/2000/svg" 
                                          className="h-6 w-6 text-gray-800" 
                                          fill="none" 
                                          viewBox="0 0 24 24" 
                                          stroke="currentColor"
                                        >
                                          <path 
                                            strokeLinecap="round" 
                                            strokeLinejoin="round" 
                                            strokeWidth={2} 
                                            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" 
                                          />
                                        </svg>
                                      </div>
                                    </div>
                                  </div>
                                  
                                  {/* Download button - positioned separately, doesn't interfere with modal click */}
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation(); // Prevent opening modal when clicking download
                                      const link = document.createElement('a');
                                      link.href = item.image;
                                      link.download = `${item.title || `photo-item-${index + 1}`}-${item.id}.jpg`;
                                      document.body.appendChild(link);
                                      link.click();
                                      document.body.removeChild(link);
                                    }}
                                    className="absolute -bottom-2 -right-2 bg-red-600 text-white p-2 rounded-full shadow-lg hover:bg-red-700 transition-colors z-10"
                                    title="Download this image"
                                  >
                                    <svg 
                                      xmlns="http://www.w3.org/2000/svg" 
                                      className="h-4 w-4" 
                                      fill="none" 
                                      viewBox="0 0 24 24" 
                                      stroke="currentColor"
                                    >
                                      <path 
                                        strokeLinecap="round" 
                                        strokeLinejoin="round" 
                                        strokeWidth={2} 
                                        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" 
                                      />
                                    </svg>
                                  </button>
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
                    {/* Report Metadata - More Compact */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        Report Metadata
                      </h3>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                          <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Report ID</p>
                          <p className="font-medium text-sm text-gray-900 dark:text-white break-all">
                            {reportId ?? 'N/A'}
                          </p>
                        </div>

                        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                          <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Report Number</p>
                          <p className="font-medium text-sm text-gray-900 dark:text-white">
                            {report.report_number}
                          </p>
                        </div>

                        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                          <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Status</p>
                          <p className="font-medium text-sm text-gray-900 dark:text-white">
                            {currentStatus}
                          </p>
                        </div>

                        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                          <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Last Updated</p>
                          <p className="font-medium text-sm text-gray-900 dark:text-white">
                            {formatDateTime(report.updated_at)}
                          </p>
                        </div>

                        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                          <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Created</p>
                          <p className="font-medium text-sm text-gray-900 dark:text-white">
                            {formatDateTime(report.created_at)}
                          </p>
                        </div>

                        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                          <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Submitted</p>
                          <p className="font-medium text-sm text-gray-900 dark:text-white">
                            {report.submission_date
                              ? formatDateTime(report.submission_date)
                              : 'Not Submitted'}
                          </p>
                        </div>
                      </div>
                    </div>


                    {/* Photo Reports Summary */}
                    {report.photo_reports && report.photo_reports.length > 0 && (
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Photo Reports</h3>
                          <button
                            onClick={handlePrintPhotoReport}
                            className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-2 text-sm font-semibold text-white transition-all hover:from-blue-700 hover:to-blue-800"
                          >
                            <Printer className="h-4 w-4" />
                            Print Report
                          </button>
                        </div>
                        
                        <div className="space-y-4">
                          {report.photo_reports.map((photoReport: any, index: number) => (
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
                                    {formatDateTime(photoReport.inspection_date)}
                                  </p>
                                </div>
                              </div>
                              {photoReport.description && (
                                <div className="mt-3">
                                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Description</p>
                                  <p className="text-sm text-gray-800 dark:text-gray-200">{photoReport.description}</p>
                                </div>
                              )}
                              <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                                <p className="text-xs text-gray-500">
                                  Photo Report ID: {photoReport.id} • Created: {formatDateTime(photoReport.created_at)}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Photo Items Summary */}
                    {validPhotoItems && validPhotoItems.length > 0 && (
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Photo Items Summary</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                          {validPhotoItems.slice(0, 6).map((item: any, index: number) => (
                            <div key={item.id} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                              <div className="flex items-start gap-2">
                                {item.image && (
                                  <div className="flex-shrink-0">
                                    <img
                                      src={item.image}
                                      alt={item.title || `Item ${index + 1}`}
                                      className="w-16 h-16 object-cover rounded"
                                    />
                                  </div>
                                )}
                                <div className="flex-1">
                                  <h4 className="font-medium text-sm text-gray-900 dark:text-white truncate">
                                    {item.title || `Item ${index + 1}`}
                                  </h4>
                                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                                    {item.findings || 'No findings'}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                        {validPhotoItems.length > 6 && (
                          <div className="mt-3 text-center">
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              ...and {validPhotoItems.length - 6} more items
                            </p>
                          </div>
                        )}
                      </div>
                    )}
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

            {/*<div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">AI Tools</h3>

              <button
                onClick={() => setShowAiReview((v) => !v)}
                className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-3 text-sm font-semibold text-white hover:bg-indigo-700"
              >
                {showAiReview ? "Hide AI Review" : "AI Review"}
              </button>

              {showAiReview && (
                <div className="mt-4">
                  <ReportReviewAssistantPanel report={report} />
                </div>
              )}
            </div>*/}


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
              </div>
            </div>

            {/* Timeline Panel */}
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Timeline
              </h3>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Created</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {formatDateTime(report.created_at)}
                  </p>
                </div>

                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Submission Date</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {report.updated_at
                      ? formatDateTime(report.updated_at)
                      : 'Not Submitted'}
                  </p>
                </div>
              </div>
            </div>

            {/* AI Review Modal */}
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">AI Tools</h3>

              <button
                type="button"
                onClick={() => setOpenAiReview(true)}
                className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-3 text-sm font-semibold text-white hover:bg-indigo-700"
              >
                AI Review Assistant
              </button>

              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                Generates completeness checks + suggested reviewer comment template.
              </p>
            </div>


              {/* Actions Panel */}
              {canUserReview && canReview && report.status !== 'revisions_requested' && (
                <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Review Actions
                  </h3>

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

    <ReportReviewModal
      open={openAiReview}
      onClose={() => setOpenAiReview(false)}
      report={report}
    />
    </AppLayout>

  );
}