import React, { useEffect, useMemo, useState } from "react";
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

function makeReportNumber(): string {
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
}) {
  const {
    value,
    onChange,
    placeholder,
    className = "",
    uppercase,
    bold,
    center,
  } = props;

  return (
    <textarea
      rows={1}
      value={value}
      placeholder={placeholder}
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
  
  useEffect(() => {
    const styleId = "ipetro-photo-report-css";
    if (document.getElementById(styleId)) return;

    const css = document.createElement("style");
    css.id = styleId;
    css.textContent = `
      .report-input{
        width:100%;
        background-color:#F9FAFB;
        border:1px solid #D1D5DB;
        border-radius:4px;
        padding:6px 8px;
        outline:none;
        transition:all .2s;
        color:#1F2937;
      }
      .report-input:hover{ background-color:#F3F4F6; border-color:#9CA3AF; }
      .report-input:focus{ background-color:#FFFFFF; border-color:#CD202C; box-shadow:0 0 0 2px rgba(205,32,44,.1); }
      .report-input::placeholder{ color:#9CA3AF; font-style:italic; font-weight:normal; }

      .report-table{ width:100%; border-collapse:collapse; border:2px solid #000; }
      .report-table th, .report-table td{ border:1px solid #000; padding:6px 8px; vertical-align:middle; }
      .report-header-bg{ background-color:#e5e7eb; font-weight:800; color:#000; font-size:.9rem; }

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
              
              if (response.data.data?.photo_report) {
                photoReport = response.data.data.photo_report;
              } else if (response.data.data) {
                const data = response.data.data;
                if (data.id && data.report_id) {
                  photoReport = data;
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
                    alert(`✅ Loaded photo report from database (ID: ${photoReport.id})`);
                    return;
                  }
                }
                
                // If report_data is empty but other fields exist, populate the form
                const initData: ReportData = {
                  reportTitle: photoReport.report_title || 
                            mainReportData?.title || 
                            "VISUAL INTERNAL INSPECTION",
                  reportNumber: photoReport.report_number || 
                              mainReportData?.reportNo || 
                              makeReportNumber(),
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
                
                alert(`📝 Created new photo report template from database record (ID: ${photoReport.id})`);
                
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
              alert('🆕 Creating new photo report (none exists in database)');
              
              // Auto-save the new photo report
              setTimeout(() => {
                saveToBackend(initData);
              }, 1000);
              
              setIsLoading(false);
              return;
            } else {
              alert('❌ Failed to connect to database. Please check your connection.');
              setIsLoading(false);
              return;
            }
          }
        } catch (error) {
          console.error('Backend load failed:', error);
          alert('❌ Failed to load data. Please try again.');
          setIsLoading(false);
          return;
        }
        
      } catch (error) {
        console.error('Failed to load report:', error);
        alert('❌ Error loading report data. Please refresh.');
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
      alert("❌ Failed to save photo report. Check console/network.");
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveToDB = async () => {
    if (!data) return;
    const ok = await saveToBackend(data, photoReportId || undefined);
    if (ok) alert("✅ Photo report saved to database!");
  };


  const handleHeaderChange = (field: keyof Omit<ReportData, "items">, value: string) => {
    if (!data) return;
    saveData({ ...data, [field]: value });
  };

  const handleItemChange = (id: ItemId, field: keyof Omit<ReportItem, "id">, value: string) => {
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
    const newId = Date.now();
    const newItem: ReportItem = { id: newId, title: "", findings: "", requirements: "", image: null };
    saveData({ ...data, items: [...data.items, newItem] });
  };

  const deleteItem = (id: ItemId) => {
    if (!data) return;
    if (!window.confirm("Delete this item row?")) return;
    saveData({ ...data, items: data.items.filter((i) => i.id !== id) });
  };

  useEffect(() => {
    if (!data) return;

    const params = new URLSearchParams(window.location.search);
    const itemId = params.get("itemId");
    const image = params.get("image");

    if (!itemId || !image) return;

    const id = Number(itemId);
    const nextItems = data.items.map((it) => (it.id === id ? { ...it, image } : it));
    saveData({ ...data, items: nextItems });

    params.delete("itemId");
    params.delete("image");
    const clean = `${window.location.pathname}${params.toString() ? `?${params.toString()}` : ""}`;
    window.history.replaceState({}, "", clean);
  }, [data]);

  const handleEditImage = (id: ItemId) => {
    router.get("/photo", {
      picker: 1,
      itemId: id,
      return: "/reports/photo-report",
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

  const handlePrint = () => window.print();

  if (isLoading || !data) {
    return (
      <AppLayout breadcrumbs={[{ title: "Photo Report", href: "/reports/photo-report" }]}>
        <Head title="Photo Report" />
        <div className="p-10 text-center text-gray-500">Loading report data...</div>
      </AppLayout>
    );
  }

  return (
    <AppLayout breadcrumbs={[{ title: "Photo Report", href: "/reports/photo-report" }]}>
      <Head title="Photo Report" />

      <div className="bg-gray-100">
        <div className="max-w-[210mm] mx-auto p-8 bg-white shadow-lg my-4 min-h-screen">
            {/* ===== TOP CONTROLS ===== */}
            <div className="no-print mb-10 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={handleReset}
                  className="text-sm font-medium text-red-600 hover:text-red-700 hover:underline"
                  type="button"
                >
                  Start New Report
                </button>
                
                <button
                  onClick={handleGenerateJSON}
                  className="inline-flex items-center gap-2 rounded-md bg-green-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-green-700"
                  type="button"
                  title="Download JSON file of the current report data"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Generate JSON
                </button>
              </div>

              {/* Show IDs if available */}
              <div className="text-sm text-gray-600 space-x-4">
                {reportId && (
                  <span>PV Report ID: <span className="font-mono font-bold">{reportId}</span></span>
                )}
                {photoReportId && (
                  <span>Photo Report ID: <span className="font-mono font-bold">{photoReportId}</span></span>
                )}
                {isSaving && (
                  <span className="text-amber-600">
                    <span className="animate-pulse">●</span> Saving...
                  </span>
                )}
              </div>

              <button
                onClick={handlePrint}
                type="button"
                className="inline-flex items-center gap-2 rounded-md bg-[#77787B] px-5 py-2.5 text-sm font-semibold text-white shadow hover:bg-[#545454]"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 9V2h12v7M6 18H5a3 3 0 01-3-3v-4a3 3 0 013-3h14a3 3 0 013 3v4a3 3 0 01-3 3h-1M6 14h12v8H6v-8z"
                  />
                </svg>
                Print / Save PDF
              </button>
              <button
                onClick={handleSaveToDB}
                disabled={isSaving}
                className={`inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-semibold text-white shadow ${
                  isSaving ? "bg-blue-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
                }`}
                type="button"
                title="Save report into database"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M17 16v2a2 2 0 01-2 2H7a2 2 0 01-2-2V6a2 2 0 012-2h8l4 4v4M9 13h6" />
                </svg>

                {photoReportId ? "Update to DB" : "Upload to DB"}
              </button>
            </div>

            {/* ===== HEADER (logo + titles) ===== */}
            <div className="mb-10 flex items-center gap-6">
            {/* Logo */}
            <div className="flex h-[90px] w-[90px] items-center justify-center">
                {!logoError ? (
                <img
                    src={ipetroLogo}
                    alt="iPETRO Logo"
                    className="h-[90px] w-[90px] object-contain"
                    onError={() => setLogoError(true)}
                />
                ) : (
                <span className="text-2xl font-extrabold text-[#CD202C]">iPETRO</span>
                )}
            </div>

            {/* Text */}
            <div>
                <div className="text-sm font-bold tracking-[0.25em] text-gray-500 uppercase">
                Asset Integrity Management Department
                </div>

                <div className="mt-2 text-4xl font-black text-gray-900">
                Photo Inspection Report
                </div>
            </div>
            </div>

          {/* Header Table */}
          <table className="report-table mb-6">
            <tbody>
              <tr>
                <td className="report-header-bg w-32 text-center">Title</td>
                <td colSpan={3} className="font-bold text-lg p-1">
                  <input
                    type="text"
                    className="report-input font-bold uppercase w-full text-center border-0 bg-transparent"
                    value={data.reportTitle}
                    onChange={(e) => handleHeaderChange("reportTitle", e.target.value)}
                    placeholder="ENTER REPORT TITLE..."
                  />
                </td>
              </tr>
              <tr>
                <td className="report-header-bg w-32 text-center">Report Number</td>
                <td className="w-1/3 bg-gray-50 font-mono text-gray-700 p-2">{data.reportNumber}</td>
                <td className="report-header-bg w-32 text-center">Inspection Date</td>
                <td className="w-1/3 p-1">
                  <input
                    type="date"
                    className="report-input w-full cursor-pointer text-center"
                    value={data.inspectionDate}
                    onChange={(e) => handleHeaderChange("inspectionDate", e.target.value)}
                  />
                </td>
              </tr>
              <tr>
                <td className="report-header-bg text-center w-[15%]">PMT</td>
                <td className="report-header-bg text-center w-[20%]">Tag</td>
                <td className="report-header-bg text-center w-[45%]">Description</td>
                <td className="report-header-bg text-center w-[20%]">Plant &amp; Unit</td>
              </tr>
              <tr>
                <td className="p-1">
                  <ExpandableInput
                    value={data.pmt}
                    onChange={(v) => handleHeaderChange("pmt", v)}
                    placeholder="Enter PMT"
                    center
                  />
                </td>
                <td className="p-1">
                  <ExpandableInput
                    value={data.tag}
                    onChange={(v) => handleHeaderChange("tag", v)}
                    placeholder="Enter Tag No."
                    center
                  />
                </td>
                <td className="p-1">
                  <ExpandableInput
                    value={data.description}
                    onChange={(v) => handleHeaderChange("description", v)}
                    placeholder="Enter Equipment Description"
                    center
                  />
                </td>
                <td className="p-1">
                  <ExpandableInput
                    value={data.plantUnit}
                    onChange={(v) => handleHeaderChange("plantUnit", v)}
                    placeholder="Enter Plant/Unit"
                    center
                  />
                </td>
              </tr>
            </tbody>
          </table>

          {/* Items Table */}
          <table className="report-table">
            <thead>
              <tr className="report-header-bg text-center">
                <th className="w-[40%]">ITEM</th>
                <th className="w-[35%]">FINDINGS</th>
                <th className="w-[25%]">REQUIREMENTS</th>
              </tr>
            </thead>

            <tbody>
              {data.items.map((item, index) => (
                <tr key={item.id} className="align-top group">
                  {/* ITEM */}
                  <td className="p-4 relative">
                    <div className="flex items-start mb-2 gap-2">
                      <span className="font-bold text-black mt-[6px]">{index + 1}.</span>
                      <ExpandableInput
                        value={item.title}
                        onChange={(v) => handleItemChange(item.id, "title", v)}
                        placeholder="Enter item title..."
                        bold
                        className="text-[#545454] w-full"
                      />
                      <button
                        onClick={() => deleteItem(item.id)}
                        className="no-print text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition px-2 mt-1"
                        title="Delete Row"
                        type="button"
                      >
                        ✕
                      </button>
                    </div>

                    <div className="aspect-[4/3] bg-white border-2 border-dashed border-gray-300 flex flex-col items-center justify-center relative group/img overflow-hidden transition hover:border-[#CD202C] mx-auto w-[95%] rounded-lg">
                      {item.image ? (
                        <>
                          <img src={item.image} className="object-contain w-full h-full" alt="" />
                          <button
                            type="button"
                            onClick={() => handleEditImage(item.id)}
                            className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex flex-col items-center justify-center text-white font-bold cursor-pointer no-print"
                          >
                            Edit / Annotate
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleEditImage(item.id)}
                          className="flex flex-col items-center text-gray-400 hover:text-[#CD202C] transition w-full h-full justify-center"
                        >
                          <span className="font-medium text-xs">Add Photo</span>
                        </button>
                      )}
                    </div>
                  </td>

                  {/* FINDINGS */}
                  <td className="p-2">
                    <div className="flex flex-col h-full">
                      <select
                        className="mb-2 text-[10px] border rounded p-1 text-gray-500 no-print w-full bg-white hover:bg-gray-50 cursor-pointer"
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

                      <textarea
                        className="report-input w-full resize-none text-sm min-h-[192px] overflow-hidden"
                        value={item.findings}
                        onChange={(e) => handleItemChange(item.id, "findings", e.target.value)}
                        onInput={(e) => autoGrow(e.currentTarget)}
                        onFocus={(e) => autoGrow(e.currentTarget)}
                        ref={(el) => autoGrow(el)}
                        placeholder="Type findings here..."
                      />

                    </div>
                  </td>

                  {/* REQUIREMENTS */}
                  <td className="p-2">
                    <div className="flex flex-col h-full">
                      <select
                        className="mb-2 text-[10px] border rounded p-1 text-gray-500 no-print w-full bg-white hover:bg-gray-50 cursor-pointer"
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

                      <textarea
                          className="report-input w-full resize-none text-sm min-h-[192px] overflow-hidden"
                          value={item.requirements}
                          onChange={(e) => handleItemChange(item.id, "requirements", e.target.value)}
                          onInput={(e) => autoGrow(e.currentTarget)}
                          onFocus={(e) => autoGrow(e.currentTarget)}
                          ref={(el) => autoGrow(el)}
                          placeholder="Type requirements..."
                        />

                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Add row */}
          <div className="text-center mt-4 mb-12 no-print">
            <button
              onClick={addItem}
              className="border-2 border-dashed border-gray-300 text-gray-500 font-bold py-2 px-6 rounded hover:border-[#CD202C] hover:text-[#CD202C] transition flex items-center gap-2 mx-auto bg-white shadow-sm hover:shadow-md"
              type="button"
            >
              Add New Item Row
            </button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}