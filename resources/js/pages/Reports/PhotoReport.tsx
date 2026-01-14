import React, { useEffect, useMemo, useState } from "react";
import { ImageOff } from "lucide-react";
import AppLayout from "@/layouts/app-layout";
import { Head, router } from "@inertiajs/react";
import ipetroLogo from '@/assets/logo.png';
import axios from 'axios';

type ItemId = number;

type ReportStatusUI = "pending" | "in_review" | "completed" | "rejected";

type PresetGroup = "findings" | "requirements";

type ReportItem = {
  id: ItemId;
  title: string;
  findings: string;
  requirements: string;
  image: string | null;
};

type ReportData = {
  reportTitle: string;
  reportNumber: string;
  inspectionDate: string;
  pmt: string;
  tag: string;
  description: string;
  plantUnit: string;
  items: ReportItem[];
};

type MainReportInfo = {
  id: number;
  status: string;
  title?: string;
  report_no?: string;
  submitted_at?: string;
  submitted_by?: number;
};

const PRESETS: Record<PresetGroup, string[]> = {
  findings: [
    "Select standard finding...",
    "Nil.",
    "View of equipment after cleaning.",
    "Minor corrosion detected.",
    "Hard scale noted on internal surface.",
    "Coating damage observed.",
    "Distributor pipe intact and good condition.",
    "Pitting corrosion observed.",
  ],
  requirements: [
    "Select standard requirement...",
    "Visual Inspection.",
    "Nil.",
    "Specification: Nil.",
    "Inspection & Test: Visual Inspection.",
    "Repair required.",
    "Monitor for further degradation.",
  ],
};

function todayISO(): string {
  return new Date().toISOString().split("T")[0];
}

  function makeReportNumber(mainReportData?: any): string {
    // If mainReportData is provided and has reportNo, use it
    if (mainReportData?.reportNo) {
      return mainReportData.reportNo;
    }
    
    // If we're creating a new photo report but have report_data from backend
    if (mainReportData?.report_data?.reportNo) {
      return mainReportData.report_data.reportNo;
    }
    
    // Fallback: Use the current year with random ID
    const year = new Date().getFullYear();
    const randomID = Math.floor(1000 + Math.random() * 9000);
    return `RPT-${year}-${randomID}`;
  }

function ensureShape(input: any): ReportData | null {
  if (!input || typeof input !== "object") return null;
  if (!Array.isArray(input.items)) return null;

  const items: ReportItem[] = input.items.map((it: any, idx: number) => ({
    id: typeof it?.id === "number" ? it.id : Date.now() + idx,
    title: String(it?.title ?? ""),
    findings: String(it?.findings ?? ""),
    requirements: String(it?.requirements ?? ""),
    image: it?.image ? String(it.image) : null,
  }));

  return {
    reportTitle: String(input.reportTitle ?? "VISUAL INTERNAL INSPECTION"),
    reportNumber: String(input.reportNumber ?? makeReportNumber()),
    inspectionDate: String(input.inspectionDate ?? todayISO()),
    pmt: String(input.pmt ?? ""),
    tag: String(input.tag ?? ""),
    description: String(input.description ?? ""),
    plantUnit: String(input.plantUnit ?? ""),
    items,
  };
}

function autoGrowOneLine(el: HTMLTextAreaElement | null) {
  if (!el) return;
  el.style.height = "auto";
  el.style.height = `${el.scrollHeight}px`;
}

function autoGrow(el: HTMLTextAreaElement | null) {
  if (!el) return;
  el.style.height = "auto";
  el.style.height = `${el.scrollHeight}px`;
}

function ExpandableInput(props: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
  uppercase?: boolean;
  bold?: boolean;
  center?: boolean;
  disabled?: boolean;
}) {
  const {
    value,
    onChange,
    placeholder,
    className = "",
    uppercase,
    bold,
    center,
    disabled,
  } = props;

  return (
    <textarea
      rows={1}
      value={value}
      placeholder={placeholder}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value)}
      onInput={(e) => autoGrowOneLine(e.currentTarget)}
      onFocus={(e) => autoGrowOneLine(e.currentTarget)}
      ref={(el) => autoGrowOneLine(el)}
      className={[
        "report-input",
        "resize-none overflow-hidden",
        "leading-6",
        bold ? "font-bold" : "",
        uppercase ? "uppercase" : "",
        center ? "text-center" : "",
        className,
      ].join(" ")}
    />
  );
}

export default function PhotoReport() {
  const [data, setData] = useState<ReportData | null>(null);
  const [logoError, setLogoError] = useState(false);
  const [reportId, setReportId] = useState<number | null>(null);
  const [photoReportId, setPhotoReportId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [isReadOnly, setIsReadOnly] = useState(false);

  const [mainReportInfo, setMainReportInfo] = useState<MainReportInfo | null>(null);

  useEffect(() => {
    const styleId = "ipetro-photo-report-css";
    if (document.getElementById(styleId)) return;

    const css = document.createElement("style");
    css.id = styleId;
    css.textContent = `
      .report-input{
        width:100%;
        background-color:#F9FAFB;
        border:1px solid #E5E7EB;
        border-radius:8px;
        padding:10px 12px;
        outline:none;
        transition:all .2s;
        color:#1F2937;
        font-size:0.875rem;
        line-height:1.5;
      }
      .report-input:hover{ background-color:#F3F4F6; border-color:#D1D5DB; }
      .report-input:focus{ background-color:#FFFFFF; border-color:#CD202C; box-shadow:0 0 0 3px rgba(205,32,44,.1); }
      .report-input::placeholder{ color:#9CA3AF; font-style:italic; font-weight:normal; }

      .report-table{ width:100%; border-collapse:separate; border-spacing:0; }
      .report-table th, .report-table td{ border:1px solid #E5E7EB; padding:12px; vertical-align:middle; }
      .report-header-bg{ background-color:#F3F4F6; font-weight:600; color:#374151; font-size:.875rem; }
      .report-table thead th { border-bottom:2px solid #111827; }
      .report-table tbody tr:hover { background-color:#F9FAFB; }

      @media print{
        .no-print{ display:none !important; }
        body{ background-color:white; }
        .report-input{ background:transparent !important; border:none !important; padding:2px !important; resize:none; }
        .report-input::placeholder{ color:transparent; }
        input[type="date"]::-webkit-calendar-picker-indicator{ display:none; }
        select{ display:none; }
      }
    `;
    document.head.appendChild(css);
  }, []);

  const handleGenerateJSON = () => {
    if (!data) {
      alert("No data available to generate JSON file.");
      return;
    }

    const jsonData = {
      photoReportId: photoReportId,
      mainReportId: reportId,
      generatedAt: new Date().toISOString(),
      data: data,
      metadata: {
        version: "1.0",
        generator: "iPETRO Photo Report Generator",
        relationship: "photo_report.report_id (foreign key) references report.id (primary key)"
      }
    };

    const jsonString = JSON.stringify(jsonData, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const fileName = `photo-report-${data.reportNumber || 'unnamed'}-${new Date().toISOString().slice(0, 10)}.json`;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    console.log("JSON file generated:", fileName);
  };

  const renumberItems = (items: ReportItem[]) =>
  items.map((it, idx) => ({ ...it, id: idx + 1 }));

  // Initialize/load from backend only
  useEffect(() => {
    const loadReportData = async () => {
      setIsLoading(true);
      
      try {
        const searchParams = new URLSearchParams(window.location.search);
        const urlReportId = searchParams.get('report_id');
        
        console.log('📥 Main Report ID from URL:', urlReportId);
        
        if (!urlReportId) {
          alert('❌ No report ID provided. Please access this page with a valid report_id.');
          setIsLoading(false);
          return;
        }
        
        const mainReportId = Number(urlReportId);
        setReportId(mainReportId);
        
        try {
          // Fetch main report data for reference
          let mainReportData = null;
          try {
            const mainReportResponse = await axios.get(`/reports/${mainReportId}`);
            if (mainReportResponse.data.success) {
              mainReportData = mainReportResponse.data.data;
              console.log('📋 Main report data:', mainReportData);
              
              // ✅ Store main report info
              setMainReportInfo({
                id: mainReportData.report_id,
                status: mainReportData.status,
                title: mainReportData.title,
                report_no: mainReportData.reportNo,
                submitted_at: mainReportData.submitted_at,
                submitted_by: mainReportData.submitted_by,
              });
              
              // ✅ Check if report is submitted/approved
              if (mainReportData.status === 'submitted' || mainReportData.status === 'approved') {
                setIsReadOnly(true);
                console.log(`⚠️ Report is ${mainReportData.status}, enabling read-only mode`);
              }
            }
          } catch (mainReportError) {
            console.log('Main report not found or error:', mainReportError);
          }
          
          // Fetch photo report using the correct endpoint
          try {
            const response = await axios.get(`/reports/${mainReportId}/photo-report`);
            console.log('📦 Photo report response:', response.data);
            
            if (response.data.success) {
              let photoReport = null;
              let returnedMainReportInfo = null;
              
              if (response.data.data?.photo_report) {
                photoReport = response.data.data.photo_report;
              } else if (response.data.data) {
                const data = response.data.data;
                if (data.id && data.report_id) {
                  photoReport = data;
                }
              }
              
              // ✅ Get main report info from response if available
              if (response.data.data?.main_report) {
                returnedMainReportInfo = response.data.data.main_report;
                setMainReportInfo(returnedMainReportInfo);
                
                // ✅ Check status
                if (returnedMainReportInfo.status === 'submitted' || returnedMainReportInfo.status === 'approved') {
                  setIsReadOnly(true);
                  console.log(`⚠️ Report is ${returnedMainReportInfo.status}, enabling read-only mode`);
                }
              }
              
              if (photoReport) {
                console.log('✅ Found photo report:', photoReport);
                
                // Store the photo_report_id
                setPhotoReportId(photoReport.id);
                
                // Check if photo report has data in report_data field
                if (photoReport.report_data) {
                  const restored = ensureShape(photoReport.report_data);
                  if (restored) {
                    setData(restored);
                    setIsLoading(false);
                    return;
                  }
                }
                
                // If report_data is empty but other fields exist, populate the form
                const initData: ReportData = {
                  reportTitle: photoReport.report_title || 
                            mainReportData?.title || 
                            "VISUAL INTERNAL INSPECTION",
                  reportNumber: makeReportNumber(mainReportData || response.data.data),
                  inspectionDate: photoReport.inspection_date || 
                                mainReportData?.reportDate || 
                                todayISO(),
                  pmt: photoReport.pmt || 
                      mainReportData?.equipmentType || 
                      "",
                  tag: photoReport.tag || 
                      mainReportData?.equipmentTag || 
                      "",
                  description: photoReport.description || 
                              mainReportData?.equipmentDescription || 
                              "",
                  plantUnit: photoReport.plant_unit || 
                            mainReportData?.plantUnitArea || 
                            "",
                  items: [
                    {
                      id: 1,
                      title: "General View of Equipment",
                      findings: "General View of Equipment.",
                      requirements: "Visual Inspection\nNil.",
                      image: null,
                    },
                    { id: 2, title: "", findings: "", requirements: "", image: null },
                  ],
                };
                
                setData(initData);
                                
                // Save the populated data back to the database
                saveToBackend(initData, photoReport.id);
                
                setIsLoading(false);
                return;
              }
            }
          } catch (photoReportError: any) {
            console.log('Error fetching photo report:', photoReportError.message);
            
            // If 404, create a new photo report
            if (photoReportError.response?.status === 404) {
              console.log('🆕 No photo report exists yet. Creating new one...');
              
              const initData: ReportData = {
                reportTitle: mainReportData?.title || "VISUAL INTERNAL INSPECTION",
                reportNumber: mainReportData?.reportNo || makeReportNumber(),
                inspectionDate: mainReportData?.reportDate || todayISO(),
                pmt: mainReportData?.equipmentType || "",
                tag: mainReportData?.equipmentTag || "",
                description: mainReportData?.equipmentDescription || "",
                plantUnit: mainReportData?.plantUnitArea || "",
                items: [
                  {
                    id: 1,
                    title: "General View of Equipment",
                    findings: "General View of Equipment.",
                    requirements: "Visual Inspection\nNil.",
                    image: null,
                  },
                  { id: 2, title: "", findings: "", requirements: "", image: null },
                ],
              };
              
              setData(initData);
              
              // Auto-save the new photo report
              setTimeout(() => {
                saveToBackend(initData);
              }, 1000);
              
              setIsLoading(false);
              return;
            } else {
              setIsLoading(false);
              return;
            }
          }
        } catch (error) {
          console.error('Backend load failed:', error);
          setIsLoading(false);
          return;
        }
        
      } catch (error) {
        console.error('Failed to load report:', error);
        setIsLoading(false);
      }
    };
    
    loadReportData();
  }, []);

  const saveData = useMemo(() => {
    let timeoutId: NodeJS.Timeout;
    
    return (next: ReportData) => {
      setData(next);
      
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        if (reportId) {
          saveToBackend(next, photoReportId || undefined);
        }
      }, 2000);
    };
  }, [reportId, photoReportId]);

  const saveToBackend = async (
    photoReportData: ReportData,
    existingPhotoReportId?: number
  ) => {
    if (!reportId) return;

    setIsSaving(true);

    try {
      const savePayload = {
        report_data: photoReportData,
        report_title: photoReportData.reportTitle,
        report_number: photoReportData.reportNumber,
        inspection_date: photoReportData.inspectionDate,
        pmt: photoReportData.pmt,
        tag: photoReportData.tag,
        description: photoReportData.description,
        plant_unit: photoReportData.plantUnit,
      };

      // ✅ If already exists -> PUT, else -> POST
      const response = existingPhotoReportId
        ? await axios.put(`/reports/${reportId}/photo-report`, savePayload)
        : await axios.post(`/reports/${reportId}/photo-report`, savePayload);

      console.log("✅ Save response:", response.data);

      // ✅ capture photo report id from backend if provided
      const returned =
        response.data?.data?.photo_report ||
        response.data?.data ||
        response.data?.photo_report ||
        null;

      const newId = returned?.id ?? returned?.photo_report_id ?? null;

      if (newId) {
        setPhotoReportId(Number(newId));
      }

      return true;
    } catch (err: any) {
      console.error("❌ Save failed:", err.response?.data || err.message);
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveToDB = async () => {
    if (!data) return;
    const ok = await saveToBackend(data, photoReportId || undefined);
  };


  const handleHeaderChange = (field: keyof Omit<ReportData, "items">, value: string) => {
    if (isReadOnly) return;
    if (!data) return;
    saveData({ ...data, [field]: value });
  };

  const handleItemChange = (id: ItemId, field: keyof Omit<ReportItem, "id">, value: string) => {
    if (isReadOnly) return;
    if (!data) return;
    const items = data.items.map((it) => (it.id === id ? { ...it, [field]: value } : it));
    saveData({ ...data, items });
  };

  const handleDropdownSelect = (id: ItemId, field: PresetGroup, value: string) => {
    if (!data) return;
    if (!value || value.startsWith("Select")) return;

    const current = data.items.find((i) => i.id === id)?.[field] ?? "";
    const next = current ? `${current}\n${value}` : value;
    handleItemChange(id, field, next);
  };

  const addItem = () => {
    if (!data) return;

    const newId = data.items.length + 1;

    const newItem: ReportItem = {
      id: newId,
      title: "",
      findings: "",
      requirements: "",
      image: null,
    };

    saveData({ ...data, items: [...data.items, newItem] });
  };


  const deleteItem = (id: ItemId) => {
    if (isReadOnly) return;
    if (!data) return;
    if (!window.confirm("Delete this item row?")) return;

    const filtered = data.items.filter((i) => i.id !== id);

    // ✅ re-number IDs to 1..N
    const renumbered = renumberItems(filtered);

    saveData({ ...data, items: renumbered });
  };

useEffect(() => {
  const handlePhotoSelection = async () => {
    if (!data) return;

    const params = new URLSearchParams(window.location.search);
    const itemId = params.get("itemId");
    const image = params.get("image");

    if (!itemId || !image) return;

    const id = Number(itemId);
    console.log('📸 Processing photo for item', id, image);

    // ✅ Update local state immediately so user sees the change
    const updatedItems = data.items.map(item =>
      item.id === id ? { ...item, image } : item
    );
    
    const updatedData = { ...data, items: updatedItems };
    setData(updatedData);

    // ✅ Clean the URL immediately (remove photo params)
    params.delete("itemId");
    params.delete("image");
    const cleanUrl = `${window.location.pathname}${params.toString() ? `?${params.toString()}` : ""}`;
    window.history.replaceState({}, "", cleanUrl);

    // ✅ Save to backend WITHOUT using debounced saveData
    if (reportId) {
      setIsSaving(true);
      try {
        const savePayload = {
          report_data: updatedData,
          report_title: updatedData.reportTitle,
          report_number: updatedData.reportNumber,
          inspection_date: updatedData.inspectionDate,
          pmt: updatedData.pmt,
          tag: updatedData.tag,
          description: updatedData.description,
          plant_unit: updatedData.plantUnit,
        };

        const endpoint = photoReportId
          ? `/reports/${reportId}/photo-report`
          : `/reports/${reportId}/photo-report`;

        const method = photoReportId ? 'put' : 'post';

        const response = await axios({
          method,
          url: endpoint,
          data: savePayload
        });

        console.log("✅ Photo saved successfully:", response.data);

        // ✅ AFTER successful save, reload the page
        setTimeout(() => {
          console.log('🔄 Reloading page to show saved photo...');
          window.location.reload();
        }, 800); // Small delay to show success message

      } catch (err: any) {
        console.error("❌ Failed to save photo:", err.response?.data || err.message);
        alert('Failed to save photo. Please try again.');
      } finally {
        setIsSaving(false);
      }
    }
  };

  handlePhotoSelection();
}, [data, reportId, photoReportId]); // Dependencies to re-run when data changes

  const handleSubmitReport = async () => {
    if (!data || !reportId) {
      return;
    }

    // Confirm with user
    if (!window.confirm("Are you sure you want to submit this photo report? Once submitted, it cannot be edited.")) {
      return;
    }

    setIsSubmitting(true);

    try {
      const submitPayload = {
        report_data: data,
        report_title: data.reportTitle,
        report_number: data.reportNumber,
        inspection_date: data.inspectionDate,
        pmt: data.pmt,
        tag: data.tag,
        description: data.description,
        plant_unit: data.plantUnit,
      };

      // Call the submit endpoint
      const response = await axios.post(
        `/reports/${reportId}/photo-report/submit`,
        submitPayload
      );

      console.log("✅ Submit response:", response.data);

      if (response.data.success) {
        // Update local state with new photo report ID if provided
        const returned = response.data.data?.photo_report;
        const newId = returned?.id ?? returned?.photo_report_id ?? null;
        
        if (newId) {
          setPhotoReportId(Number(newId));
        }
        
        // ✅ Update main report info in state
        if (response.data.data?.main_report_status) {
          setMainReportInfo(prev => prev ? {
            ...prev,
            status: 'submitted',
            submitted_at: new Date().toISOString(),
          } : {
            id: reportId,
            status: 'submitted',
            submitted_at: new Date().toISOString(),
          });
          
          // ✅ Enable read-only mode
          setIsReadOnly(true);
        }

        
      } else {
        alert("❌ Failed to submit: " + (response.data.message || "Unknown error"));
      }
    } catch (err: any) {
      console.error("❌ Submit failed:", err.response?.data || err.message);
      
      if (err.response?.status === 400) {
        alert(`❌ ${err.response.data.message || "Cannot submit report"}`);
      } else {
        alert("❌ Failed to submit photo report. Please check console/network.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditImage = (id: ItemId) => {
    const params = new URLSearchParams(window.location.search);
    const rid = params.get("report_id"); // keep current report_id

    router.get("/photo", {
      picker: 1,
      itemId: id,
      return: rid ? `/reports/photo-report?report_id=${rid}` : "/reports/photo-report",
    });
  };


  const handleReset = () => {
    if (!window.confirm("Create new report? All current data will be lost.")) return;
    setReportId(null);
    setPhotoReportId(null);
    
    const url = new URL(window.location.href);
    url.searchParams.delete('report_id');
    window.history.replaceState({}, '', url.toString());
    
    window.location.reload();
  };

  const handlePrint = () => {
    if (!data) return;
    
    // Save current state to localStorage or sessionStorage
    const printData = {
      data,
      reportId,
      photoReportId,
      timestamp: new Date().toISOString()
    };
    
    sessionStorage.setItem('printPhotoReport', JSON.stringify(printData));
    
    // Open print window
    const printWindow = window.open('/reports/photo-report/print', '_blank');
    if (printWindow) {
      printWindow.focus();
    } else {
      alert('Please allow pop-ups for print preview');
    }
  };
  if (isLoading) {
  return (
    <AppLayout breadcrumbs={[{ title: "Photo Report", href: "/reports/photo-report" }]}>
      <Head title="Photo Report" />
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading photo report...</p>
        </div>
      </div>
    </AppLayout>
  );
}

if (!data) {
  return (
    <AppLayout breadcrumbs={[{ title: "Photo Report", href: "/reports/photo-report" }]}>
      <Head title="Photo Report" />
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center text-red-600">
          <p>Failed to load report data. Please try again.</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Reload Page
          </button>
        </div>
      </div>
    </AppLayout>
  );
}

const renderStatusBadge = () => {
    if (!mainReportInfo) return null;
    
    const status = mainReportInfo.status?.toLowerCase();
    const submittedAt = mainReportInfo.submitted_at 
      ? new Date(mainReportInfo.submitted_at).toLocaleDateString()
      : null;
    
    const statusConfig: Record<string, { color: string; bg: string; text: string }> = {
      'draft': { color: 'text-yellow-700', bg: 'bg-yellow-50', text: 'Draft' },
      'submitted': { color: 'text-blue-700', bg: 'bg-blue-50', text: 'Submitted' },
      'approved': { color: 'text-green-700', bg: 'bg-green-50', text: 'Approved' },
      'rejected': { color: 'text-red-700', bg: 'bg-red-50', text: 'Rejected' },
    };
    
    const config = statusConfig[status] || { color: 'text-gray-700', bg: 'bg-gray-50', text: status || 'Unknown' };
    
    return (
      <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full ${config.bg} ${config.color} font-medium`}>
        <div className={`w-2 h-2 rounded-full ${config.color.replace('text-', 'bg-')}`}></div>
        <span>{config.text}</span>
        {submittedAt && status === 'submitted' && (
          <span className="text-xs opacity-75">on {submittedAt}</span>
        )}
      </div>
    );
  };

  return (
    <AppLayout breadcrumbs={[{ title: "Photo Report", href: "/reports/photo-report" }]}>
      <Head title="Photo Report" />

      <div className="bg-gray-50 min-h-screen">
        <div className="max-w-[210mm] mx-auto p-6 bg-white shadow-sm">
          {/* ===== COMPACT HEADER ===== */}
          <div className="no-print mb-8 p-4 bg-gradient-to-r from-gray-50 to-white border border-gray-200 rounded-xl shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-xl font-bold text-gray-800">Photo Report Editor</h1>
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  {/* ✅ Status Badge */}
                  {renderStatusBadge()}
                  
                  {/* Read-only indicator */}
                  {isReadOnly && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-gray-100 text-gray-700 rounded-full border border-gray-300">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                      Read-only
                    </span>
                  )}
                  
                  {/* Saving indicator */}
                  {isSaving && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-700 rounded-full border border-amber-200">
                      <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></span>
                      Saving...
                    </span>
                  )}
                  
                  {photoReportId && !isReadOnly && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-50 text-green-700 rounded-full border border-green-200">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Saved
                    </span>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                {/* Print button */}
                <button
                  onClick={handlePrint}
                  type="button"
                  className="flex-1 sm:flex-none group relative inline-flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium bg-white text-gray-700 shadow-sm border border-gray-300 hover:bg-gray-50 hover:border-gray-400 hover:shadow transition-all duration-200 min-w-[120px]"
                >
                  <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 9V2h12v7M6 18H5a3 3 0 01-3-3v-4a3 3 0 013-3h14a3 3 0 013 3v4a3 3 0 01-3 3h-1M6 14h12v8H6v-8z"
                    />
                  </svg>
                  <span>Print / PDF</span>
                </button>

                {/* Save button */}
                {!isReadOnly && (
                  <button
                    onClick={handleSaveToDB}
                    disabled={isSaving}
                    className={`flex-1 sm:flex-none group relative inline-flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all duration-200 min-w-[120px] ${
                      isSaving
                        ? "bg-blue-300 cursor-not-allowed text-white border border-blue-300"
                        : "bg-gradient-to-r from-blue-500 to-blue-600 text-white border border-blue-600 hover:from-blue-600 hover:to-blue-700 hover:shadow-lg hover:-translate-y-0.5 shadow-md"
                    }`}
                    type="button"
                  >
                    {isSaving ? (
                      <>
                        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M17 16v2a2 2 0 01-2 2H7a2 2 0 01-2-2V6a2 2 0 012-2h8l4 4v4M9 13h6" />
                        </svg>
                        <span>{photoReportId ? "Update" : "Save"}</span>
                      </>
                    )}
                  </button>
                )}

                {/* Submit button */}
                {mainReportInfo?.status === 'draft' && !isReadOnly && (
                  <button
                    onClick={handleSubmitReport}
                    disabled={isSubmitting || isSaving}
                    className={`flex-1 sm:flex-none group relative inline-flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all duration-200 min-w-[120px] ${
                      isSubmitting
                        ? "bg-gradient-to-r from-green-300 to-green-400 cursor-not-allowed text-white border border-green-400"
                        : "bg-gradient-to-r from-green-500 to-green-600 text-white border border-green-600 hover:from-green-600 hover:to-green-700 hover:shadow-lg hover:-translate-y-0.5 shadow-md"
                    }`}
                    type="button"
                  >
                    {isSubmitting ? (
                      <>
                        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        <span>Submitting...</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>Submit</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
          {/* ===== REPORT HEADER ===== */}
          <div className="mb-8 flex items-center gap-6 bg-gradient-to-r from-gray-50 to-white p-6 rounded-xl border border-gray-200">
            {/* Logo */}
            <div className="flex-shrink-0">
              {!logoError ? (
                <img
                  src={ipetroLogo}
                  alt="iPETRO Logo"
                  className="h-24 w-24 object-contain"
                  onError={() => setLogoError(true)}
                />
              ) : (
                <div className="h-24 w-24 flex items-center justify-center bg-gradient-to-br from-red-50 to-white border border-gray-200 rounded-xl">
                  <span className="text-2xl font-extrabold text-[#CD202C]">iPETRO</span>
                </div>
              )}
            </div>

            {/* Title */}
            <div className="flex-1">
              <div className="text-sm font-bold tracking-[0.25em] text-gray-500 uppercase mb-2">
                Asset Integrity Management Department
              </div>
              <div className="text-3xl font-black text-gray-900 mb-2">
                Photo Inspection Report
              </div>
              <div className="text-sm text-gray-600">
                Create and edit your photo inspection report with images, findings, and requirements
              </div>
            </div>
          </div>

          {/* Header Table */}
          <div className="mb-8 overflow-hidden rounded-xl border border-gray-200 shadow-sm">
            <table className="report-table">
              <tbody>
                <tr>
                  <td className="report-header-bg w-32 text-center font-semibold text-gray-700">Title</td>
                  <td colSpan={3} className="p-3">
                    <input
                      type="text"
                      className="report-input font-bold uppercase w-full text-lg text-center"
                      value={data.reportTitle}
                      onChange={(e) => handleHeaderChange("reportTitle", e.target.value)}
                      placeholder="ENTER REPORT TITLE..."
                      disabled={isReadOnly}
                    />
                  </td>
                </tr>
                <tr>
                  <td className="report-header-bg text-center font-semibold text-gray-700">Report Number</td>
                  <td className="w-1/3 bg-gray-50 p-3">
                    <div className="font-mono text-gray-800 font-medium px-2 py-1.5 bg-gray-100 rounded border border-gray-300">
                      {data.reportNumber}
                    </div>
                  </td>
                  <td className="report-header-bg text-center font-semibold text-gray-700">Inspection Date</td>
                  <td className="w-1/3 p-3">
                    <input
                      type="date"
                      className="report-input w-full cursor-pointer text-center"
                      value={data.inspectionDate}
                      onChange={(e) => handleHeaderChange("inspectionDate", e.target.value)}
                      disabled={isReadOnly}
                    />
                  </td>
                </tr>
                <tr>
                  <td className="report-header-bg text-center font-semibold text-gray-700 w-[15%]">PMT</td>
                  <td className="report-header-bg text-center font-semibold text-gray-700 w-[20%]">Tag</td>
                  <td className="report-header-bg text-center font-semibold text-gray-700 w-[45%]">Description</td>
                  <td className="report-header-bg text-center font-semibold text-gray-700 w-[20%]">Plant &amp; Unit</td>
                </tr>
                <tr>
                  <td className="p-3">
                    <ExpandableInput
                      value={data.pmt}
                      onChange={(v) => handleHeaderChange("pmt", v)}
                      placeholder="Enter PMT"
                      center
                      disabled={isReadOnly}
                    />
                  </td>
                  <td className="p-3">
                    <ExpandableInput
                      value={data.tag}
                      onChange={(v) => handleHeaderChange("tag", v)}
                      placeholder="Enter Tag No."
                      center
                      disabled={isReadOnly}
                    />
                  </td>
                  <td className="p-3">
                    <ExpandableInput
                      value={data.description}
                      onChange={(v) => handleHeaderChange("description", v)}
                      placeholder="Enter Equipment Description"
                      center
                      disabled={isReadOnly}
                    />
                  </td>
                  <td className="p-3">
                    <ExpandableInput
                      value={data.plantUnit}
                      onChange={(v) => handleHeaderChange("plantUnit", v)}
                      placeholder="Enter Plant/Unit"
                      center
                      disabled={isReadOnly}
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Items Table */}
          <div className="overflow-hidden rounded-xl border border-gray-200 shadow-sm mb-8">
            <table className="report-table">
              <thead>
                <tr className="report-header-bg">
                  <th className="w-[40%] p-4 text-left text-gray-700 font-semibold">ITEM</th>
                  <th className="w-[35%] p-4 text-left text-gray-700 font-semibold">FINDINGS</th>
                  <th className="w-[25%] p-4 text-left text-gray-700 font-semibold">REQUIREMENTS</th>
                </tr>
              </thead>

              <tbody>
                {data.items.map((item, index) => (
                  <tr key={item.id} className="align-top group hover:bg-gray-50/50 transition-colors">
                    {/* ITEM */}
                    <td className="p-4 relative border-r border-gray-200">
                      <div className="flex items-start mb-4 gap-3">
                        <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-gray-100 text-gray-700 font-bold rounded-full">
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <ExpandableInput
                            value={item.title}
                            onChange={(v) => handleItemChange(item.id, "title", v)}
                            placeholder="Enter item title..."
                            bold
                            className="text-gray-800 w-full text-base"
                            disabled={isReadOnly}
                          />
                        </div>
                        {!isReadOnly && (
                          <button
                            onClick={() => deleteItem(item.id)}
                            className="no-print flex-shrink-0 text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition p-2"
                            title="Delete Row"
                            type="button"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                              />
                            </svg>
                          </button>
                        )}
                      </div>
                      <div
                        className={`aspect-[4/3] bg-white border-2 border-dashed border-gray-300
                        flex flex-col items-center justify-center relative overflow-hidden
                        mx-auto w-full rounded-lg transition-all
                        ${
                          isReadOnly
                            ? "cursor-default pointer-events-none"
                            : "group/img cursor-pointer hover:border-[#CD202C] hover:shadow-md"
                        }`}
                      >
                        {item.image ? (
                          <>
                            <img
                              src={item.image}
                              className="object-contain w-full h-full p-2"
                              alt=""
                            />

                            {/* ✅ EDIT OVERLAY — ONLY WHEN NOT READ ONLY */}
                            {!isReadOnly && (
                              <button
                                type="button"
                                onClick={() => handleEditImage(item.id)}
                                className="absolute inset-0 bg-black/60 opacity-0 
                                group-hover/img:opacity-100 transition-opacity 
                                flex flex-col items-center justify-center 
                                text-white font-semibold cursor-pointer no-print"
                              >
                                <svg className="w-8 h-8 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5
                                      m-1.414-9.414a2 2 0 112.828 2.828
                                      L11.828 15H9v-2.828l8.586-8.586z"
                                  />
                                </svg>
                                Edit / Annotate Photo
                              </button>
                            )}
                          </>
                        ) : (
                          <>
                            {/* ✅ EMPTY STATE */}
                            {isReadOnly ? (
                              <div className="flex flex-col items-center justify-center text-gray-400 select-none">
                                <ImageOff className="w-12 h-12 mb-3" />
                                <span className="font-medium">No Image</span>
                                <span className="text-sm mt-1">Image not available</span>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleEditImage(item.id)}
                                className="flex flex-col items-center text-gray-400 
                                hover:text-[#CD202C] transition w-full h-full 
                                justify-center p-6"
                              >
                                <svg className="w-12 h-12 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                    d="M12 4v16m8-8H4"
                                  />
                                </svg>
                                <span className="font-medium">Add Photo</span>
                                <span className="text-sm mt-1">Click to upload or annotate</span>
                              </button>
                            )}
                          </>
                        )}
                      </div>

                    </td>

                    {/* FINDINGS */}
                    <td className="p-4 border-r border-gray-200">
                      <div className="flex flex-col h-full">
                        <div className="mb-3">
                        {!isReadOnly && (
                          <select
                            className="text-sm border border-gray-300 rounded-lg p-2 text-gray-600 no-print w-full bg-white hover:bg-gray-50 cursor-pointer transition focus:border-[#CD202C] focus:ring-2 focus:ring-red-100"
                            onChange={(e) => {
                              handleDropdownSelect(item.id, "findings", e.target.value);
                              e.currentTarget.value = "";
                            }}
                            defaultValue=""
                          >
                            <option value="" disabled>
                              Select standard finding...
                            </option>
                            {PRESETS.findings.map((opt, i) => (
                              <option key={i} value={opt}>
                                {opt}
                              </option>
                            ))}
                          </select>
                        )}
                        </div>

                        <textarea
                          className="report-input w-full resize-none text-sm min-h-[200px] overflow-hidden flex-1"
                          value={item.findings}
                          onChange={(e) => handleItemChange(item.id, "findings", e.target.value)}
                          onInput={(e) => autoGrow(e.currentTarget)}
                          onFocus={(e) => autoGrow(e.currentTarget)}
                          ref={(el) => autoGrow(el)}
                          placeholder="Type findings here..."
                          disabled={isReadOnly}
                        />
                      </div>
                    </td>

                    {/* REQUIREMENTS */}
                    <td className="p-4">
                      <div className="flex flex-col h-full">
                        <div className="mb-3">
                          
                        {!isReadOnly && (
                          <select
                            className="text-sm border border-gray-300 rounded-lg p-2 text-gray-600 no-print w-full bg-white hover:bg-gray-50 cursor-pointer transition focus:border-[#CD202C] focus:ring-2 focus:ring-red-100"
                            onChange={(e) => {
                              handleDropdownSelect(item.id, "requirements", e.target.value);
                              e.currentTarget.value = "";
                            }}
                            defaultValue=""
                          >
                            <option value="" disabled>
                              Select standard requirement...
                            </option>
                            {PRESETS.requirements.map((opt, i) => (
                              <option key={i} value={opt}>
                                {opt}
                              </option>
                            ))}
                          </select>
                        )}
                        </div>

                        <textarea
                          className="report-input w-full resize-none text-sm min-h-[200px] overflow-hidden flex-1"
                          value={item.requirements}
                          onChange={(e) => handleItemChange(item.id, "requirements", e.target.value)}
                          onInput={(e) => autoGrow(e.currentTarget)}
                          onFocus={(e) => autoGrow(e.currentTarget)}
                          ref={(el) => autoGrow(el)}
                          placeholder="Type requirements..."
                          disabled={isReadOnly}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Add row */}
          {!isReadOnly && (
            <div className="text-center mb-8 no-print">
              <button
                onClick={addItem}
                className="inline-flex items-center gap-2 border-2 border-dashed border-gray-300 text-gray-600 hover:text-[#CD202C] hover:border-[#CD202C] font-semibold py-3 px-6 rounded-xl transition-all hover:shadow-md bg-white"
                type="button"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add New Item Row
              </button>
            </div>
          )}

          {/* Footer Status */}
          <div className="no-print text-center text-sm text-gray-500 pt-4 border-t border-gray-200">
            <div className="flex items-center justify-center gap-6">
              <span>Report ID: {photoReportId || 'Not saved'}</span>
              <span>•</span>
              <span>Items: {data.items.length}</span>
              <span>•</span>
              <span>Last auto-save: {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}