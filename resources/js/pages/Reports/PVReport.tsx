// resources/js/Pages/PVReport.tsx
import { useState, useRef, useEffect, ChangeEvent } from "react";
import axios from 'axios';
import AppLayout from "@/layouts/app-layout";
import { Head, useForm } from "@inertiajs/react";
import { 
    Printer, 
    Trash2, 
    Save, 
    Download, 
    FileText, 
    HardHat, 
    AlertCircle,
    Info,
    HelpCircle,
    Settings,
    ChevronDown,
    ChevronUp,
    Eye,
    EyeOff,
    Copy,
    Check,
    ChevronRight 
} from "lucide-react";
import { toast, Toaster } from "react-hot-toast";
import ipetroLogo from '@/assets/logo.png';
import { router } from '@inertiajs/react';
import { usePage } from "@inertiajs/react";
import { CheckCircle2, XCircle } from "lucide-react";

export interface FormState {
    title?: string; 
    equipmentTag: string;
    equipmentDescription: string;
    equipmentType: string;
    plantUnitArea: string;
    doshRegistration: string;
    reportNo: string;
    reportDate: string;
    initialFinding: string;
    externalFinding: string;
    internalFinding: string;
    ndt: string;
    recommendations: string;

    inspectorName: string;
    publishDate: string; // dd/mm/yyyy or yyyy-mm-dd (we’ll format)
    equipmentTemplateId?: number | null;


}

interface PresetItem {
    initial?: string; // Add this
    external: string;
    internal: string;
    ndt: string;
    recommendations: string;
}

interface TemplateInfo {
    id: string;
    name: string;
    description: string;
    icon: string;
    equipment: string;
}

export default function PVReport() {
    const [form, setForm] = useState<FormState>(getInitialFormState());
    const page = usePage().props as any;
    const { props } = usePage();
    const initialReportId = props.reportId;

    const user = page.auth?.user;

    

    useEffect(() => {
    setForm((prev) => {
        const next = { ...prev };

        // ✅ only fill if empty (don’t overwrite user edits)
        if (!next.inspectorName?.trim() && user?.name) {
        next.inspectorName = user.name;
        }

        // ✅ publishDate default: same as reportDate (or today)
        if (!next.publishDate) {
        next.publishDate = next.reportDate || new Date().toISOString().split("T")[0];
        }

        return next;
    });
    }, [user?.name]);


    // ✅ signature still from backend user/profile
        const signatureUrl =
    page.signatureUrl ??
    (page.auth?.user?.signature_path
        ? `/storage/${page.auth.user.signature_path}`
        : null);

    // ✅ checklist computed from form (frontend), not backend
    const checklist = {
    equipment: !!(
        form.equipmentTag?.trim() &&
        form.equipmentType?.trim() &&
        form.reportNo?.trim() &&
        form.plantUnitArea?.trim() &&
        form.doshRegistration?.trim()
    ),
    initial: !!form.initialFinding?.trim(),
    external: !!form.externalFinding?.trim(),
    internal: !!form.internalFinding?.trim(),
    ndt: !!form.ndt?.trim(),
    recommendations: !!form.recommendations?.trim(),
    signature: !!signatureUrl,
    };
    checklist.ready = Object.values(checklist).every(Boolean);

    type EquipmentTemplate = {
    id: number;
    equipment_type: string;
    title: string | null;
    initial_finding: string | null;
    external_finding: string | null;
    internal_finding: string | null;
    ndt: string | null;
    recommendations: string | null;
    };


// ✅ ready = all true
const ready = Object.values(checklist).every(Boolean);

    const [showPreview, setShowPreview] = useState(false);
    const [activeSection, setActiveSection] = useState<string>("details");
    const [copiedField, setCopiedField] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [wordCount, setWordCount] = useState<Record<string, number>>({});

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [reportId, setReportId] = useState<number | null>(null);
    const [reportStatus, setReportStatus] = useState<
  'draft' | 'submitted' | 'in_review' | 'revisions_requested' | 'approved' | 'rejected' | null
>(null);

    const printRef = useRef<HTMLDivElement>(null);

    const [aiLoading, setAiLoading] = useState(false);//ai
    const [aiError, setAiError] = useState<string | null>(null);//ai

    const [templates, setTemplates] = useState<EquipmentTemplate[]>([]);
    const [selectedTemplateId, setSelectedTemplateId] = useState<number | "">("");
    const readOnly = reportStatus && ['approved', 'rejected', 'submitted'].includes(reportStatus);
    


    // In your React component (PVReport.tsx)
    const api = axios.create({
        baseURL: '/api', // Use relative path
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        },
        withCredentials: true,
    });

    // Equipment options
    const EQUIPMENT_OPTIONS = [
        { value: "", label: "Select equipment type...", icon: "📋" },
        { value: "Plant Air Receiver Vessel", label: "Plant Air Receiver Vessel", icon: "🏭" },
        { value: "Reactor", label: "Reactor", icon: "⚗️" },
        { value: "Nitrogen Vessel", label: "Nitrogen Vessel", icon: "💨" },
        { value: "Custom / Manual", label: "Custom / Manual", icon: "✏️" },
    ];

    // Template information
    const TEMPLATE_INFO: Record<string, TemplateInfo> = {
        "Plant Air Receiver Vessel": {
            id: "template-1",
            name: "Air Receiver Template",
            description: "Standard template for air receiver vessel inspections",
            icon: "🏭",
            equipment: "Pressure Vessel"
        },
        "Reactor": {
            id: "template-2",
            name: "Reactor Template",
            description: "Specialized template for reactor vessel inspections",
            icon: "⚗️",
            equipment: "Reactor Vessel"
        },
        "Nitrogen Vessel": {
            id: "template-3",
            name: "Nitrogen Vessel Template",
            description: "Template for nitrogen storage vessel inspections",
            icon: "💨",
            equipment: "Storage Vessel"
        }
    };

    const getInputProps = (field: keyof FormState) => ({
        disabled: readOnly,
        className: `w-full rounded-lg border px-4 py-3 text-sm transition-all ${
            readOnly 
            ? 'bg-gray-100 border-gray-300 text-gray-500 cursor-not-allowed dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400' 
            : 'border-gray-300 bg-white focus:border-red-500 focus:ring-2 focus:ring-red-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white'
        }`,
        title: readOnly ? `Cannot edit - Report is ${reportStatus}` : '',
    });

    // Preset text templates
    const PRESET_TEXT: Record<string, PresetItem> = {
        "Nitrogen Vessel": {
            initial: `Pre-inspection: Equipment was properly isolated, cleaned, and prepared for inspection. 
    Previous inspection records reviewed. All safety protocols followed.`,
            external: `1.1 Generally, equipment was found fully painted. All associate parts noted securely intact in its position.
    1.2 Nameplate, PMT number and equipment number were found secured in its place and legible.
    1.3 Concrete foundation, support legs and anchor bolts observed in satisfactory condition with no sign of abnormalities.
    1.4 Bottom and top dish head noted in satisfactory condition. No significant abnormalities observed.
    1.5 Equipment shell externally noted in satisfactory condition with external coating noted intact properly on all equipment surfaces.
    1.6 Davit arm, manhole and its cover were noted in serviceable condition with no evidence of significant damage.
    1.7 All attachment nozzles, pressure gauge and lifting lug observed in satisfactory condition. No sign of anomaly seen.`,
            internal: `2.1 Manhole cover noted with evidence of scratch mark on gasket seat area at a 7 o'clock position.
    2.2 Manhole flange was found in serviceable condition except for evidence of mechanical mark on gasket seat area at position 1 o'clock with approx. 3mm of maximum radial projection. No further defect propagation compared to previous report.
    2.3 Evidence of mechanical mark with length approx. 40mm and <0.5mm depth on 6 o'clock and mechanical mark with length approx. 5mm and <0.5mm depth on 12 o'clock section of manhole neck.
    2.4 Top and bottom dish head observed in satisfactory condition with no sign of deterioration.
    2.5 Bottom internal shell wall observed in satisfactory condition with no sign of anomaly. All internal circumferential seam and longitudinal seam observed in good profile with no sign of relevant defect except for two locations of cluster porosity noted and accepted.
    2.6 Middle internal shell wall observed in satisfactory condition with no sign of anomaly (where seen and accessible).
    2.7 All attachment nozzles internally observed in serviceable condition. No sign of anomaly observed.`,
            ndt: `UTTM: No significant wall loss detected compared to nominal thickness. Please refer attachment report.`,
            recommendations: `2.2 To be monitored on next opportunity.
    2.5 To be monitored on next opportunity.`
        },
        // ... update other PRESET_TEXT objects similarly
    };

    // Get initial form state
    function getInitialFormState(): FormState {
        const today = new Date().toISOString().split("T")[0];
        return {
            equipmentTag: "",
            equipmentDescription: "",
            equipmentType: "",
            plantUnitArea: "",
            doshRegistration: "",
            reportNo: "",
            reportDate: today,
            initialFinding: "",
            externalFinding: "",
            internalFinding: "",
            ndt: "",
            recommendations: "",
            inspectorName: "",
            publishDate: today,
        };
    }

    // Calculate word count for text areas
    useEffect(() => {
        const counts: Record<string, number> = {};
        const fields = ['initialFinding', 'externalFinding', 'internalFinding', 'ndt', 'recommendations'];
        fields.forEach(field => {
            const text = form[field as keyof FormState];
            counts[field] = text.trim().split(/\s+/).filter(word => word.length > 0).length;
        });
        setWordCount(counts);
    }, [form]);

    useEffect(() => {
        if (initialReportId) {
            loadReportData(initialReportId);
        }
    }, [initialReportId]);

    useEffect(() => {
        const fetchTemplates = async () => {
            try {
            const res = await api.get("/equipment-templates");
            if (res.data?.success) setTemplates(res.data.data || []);
            } catch (e) {
            console.error(e);
            toast.error("Failed to load equipment templates");
            }
        };
        fetchTemplates();
        }, []);

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const templateIdStr = params.get("template_id");
        if (!templateIdStr) return;

        const templateId = Number(templateIdStr);
        if (!templateId || templates.length === 0) return;

        const t = templates.find((x) => x.id === templateId);
        if (!t) return;

        // Apply force (new report)
        applyTemplateToForm(t, true);

        // also set selected dropdown value
        setSelectedTemplateId(templateId);
        }, [templates]);



    const loadReportData = async (id: string | number) => {
        try {
            setIsSaving(true);
            console.log('Loading report with ID:', id);
            const response = await api.get(`/reports/${id}`);
            
            console.log('GET Response:', response.data); // DEBUG
            
            if (response.data.success) {
                const responseData = response.data;
                
                // Extract ID from multiple possible locations
                let extractedId = null;
                
                // Check your GET response structure
                if (responseData.data && responseData.data.id) {
                    extractedId = responseData.data.id;
                    console.log('Found ID at response.data.data.id:', extractedId);
                }
                else if (responseData.data && responseData.data.report_id) {
                    extractedId = responseData.data.report_id;
                    console.log('Found ID at response.data.data.report_id:', extractedId);
                }
                else if (responseData.data && responseData.data.report && responseData.data.report.report_id) {
                    extractedId = responseData.data.report.report_id;
                    console.log('Found ID at response.data.data.report.report_id:', extractedId);
                }
                else if (responseData.id) {
                    extractedId = responseData.id;
                    console.log('Found ID at response.data.id:', extractedId);
                }
                
                if (extractedId) {
                    setReportId(extractedId);
                    console.log('Set reportId to:', extractedId);
                } else {
                    // Fallback to the ID from URL
                    setReportId(Number(id));
                    console.log('Using URL ID as fallback:', id);
                }
                
                // Get the json_data - check multiple locations
                const jsonData = 
                    responseData.data?.json_data || 
                    responseData.data?.report?.json_data || 
                    responseData.json_data || 
                    {};
                
                console.log('Loaded json_data:', jsonData);
                
                // Populate form with existing data
                setForm({
                    title: jsonData.title || '',
                    equipmentTag: jsonData.equipmentTag || '',
                    equipmentDescription: jsonData.equipmentDescription || '',
                    equipmentType: jsonData.equipmentType || '',
                    plantUnitArea: jsonData.plantUnitArea || '',
                    doshRegistration: jsonData.doshRegistration || '',
                    reportNo: jsonData.reportNo || '',
                    reportDate: jsonData.reportDate || '',
                    initialFinding: jsonData.initialFinding || '',
                    externalFinding: jsonData.externalFinding || '',
                    internalFinding: jsonData.internalFinding || '',
                    ndt: jsonData.ndt || '',
                    recommendations: jsonData.recommendations || '',
                    inspectorName: jsonData.inspectorName || page.auth?.user?.name || '',
                    publishDate: jsonData.publishDate || jsonData.reportDate || new Date().toISOString().split("T")[0],
                });

                const dbStatus =
                    responseData.data?.status ||
                    responseData.data?.report?.status ||
                    null;

                    if (dbStatus) setReportStatus(dbStatus);

            }
        } catch (error) {
            console.error('Failed to load report:', error);
            toast.error('Failed to load report data. Starting new report.');
        } finally {
            setIsSaving(false);
        }
    };

    // Handle form changes
    const handleChange = (field: keyof FormState) => 
        (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
            setForm({ ...form, [field]: e.target.value });
        };

    // Handle equipment type change with preset loading
    const handleEquipmentTypeChange = (e: ChangeEvent<HTMLSelectElement>) => {
        const type = e.target.value;
        const preset = PRESET_TEXT[type];
        const templateInfo = TEMPLATE_INFO[type];

        const newForm = {
            ...form,
            equipmentType: type,
            equipmentDescription: type === "Custom / Manual" ? "" : type,
        };

        if (preset) {
            newForm.initialFinding = preset.initial || ""; // Add this line
            newForm.externalFinding = preset.external;
            newForm.internalFinding = preset.internal;
            newForm.ndt = preset.ndt;
            newForm.recommendations = preset.recommendations;
        }

        setForm(newForm);

        if (templateInfo) {
            toast.success(`Loaded ${templateInfo.name} template`, {
                icon: '📋',
                duration: 3000,
            });
        }
    };


    //Handle Ai
    const handleGenerateAI = async () => {
    setAiLoading(true);
    setAiError(null);

    try {
        const payload = {
        report_id: reportId, // ✅ link to the report
        equipmentTag: form.equipmentTag,
        equipmentType: form.equipmentType,
        plantUnitArea: form.plantUnitArea,
        doshRegistration: form.doshRegistration,
        reportNo: form.reportNo,
        reportDate: form.reportDate,
        initialFinding: form.initialFinding,
        externalFinding: form.externalFinding,
        internalFinding: form.internalFinding,
        ndt: form.ndt,
        recommendations: form.recommendations,
        };

        const csrf = document
        .querySelector('meta[name="csrf-token"]')
        ?.getAttribute("content");

        axios.defaults.headers.common["X-Requested-With"] = "XMLHttpRequest";
        if (csrf) axios.defaults.headers.common["X-CSRF-TOKEN"] = csrf;
        axios.defaults.withCredentials = true;

        // ✅ FIX: correct endpoint
        const res = await axios.post("/api/ai/pv-report-draft", payload);

        console.log("Saved AI draft id:", res.data.draft_id);

        if (!res.data.ok) {
        setAiError(res.data.error || "Failed to generate AI draft.");
        toast.error(res.data.error || "AI draft failed");
        return;
        }

        const d = res.data.draft || {};
        const ok = confirm(
        "Apply AI improvements? This will replace the text in those sections."
        );
        if (!ok) return;

        setForm((prev) => ({
        ...prev,
        initialFinding: d.initialFinding ?? prev.initialFinding,
        externalFinding: d.externalFinding ?? prev.externalFinding,
        internalFinding: d.internalFinding ?? prev.internalFinding,
        ndt: d.ndt ?? prev.ndt,
        recommendations: d.recommendations ?? prev.recommendations,
        }));

        toast.success("AI draft applied!", { icon: "🤖", duration: 2500 });
    } catch (e: any) {
        const msg =
        e?.response?.data?.message ||
        e?.response?.data?.error ||
        "Server error generating AI draft.";
        setAiError(msg);
        toast.error(msg);
    } finally {
        setAiLoading(false);
    }
    };



    // Copy field content to clipboard
    const copyToClipboard = async (field: keyof FormState, label: string) => {
        try {
            await navigator.clipboard.writeText(form[field]);
            setCopiedField(field);
            toast.success(`Copied ${label} to clipboard`, {
                icon: '📋',
                duration: 2000,
            });
            setTimeout(() => setCopiedField(null), 2000);
        } catch (err) {
            toast.error('Failed to copy to clipboard');
        }
    };

    // Handle submit for review
    const handleSubmit = async () => {
  if (!confirm('Submit this report for review?')) return;

  setIsSubmitting(true);

  try {
    // New report → POST submitted
    if (!reportId) {
      const result = await handleSave('submitted');
      if (result.success && result.reportId) {
        setReportStatus('submitted');
        toast.success('Report submitted!');
      }
      return;
    }

    // Existing report → submit endpoint
    const res = await api.post(`/reports/${reportId}/submit`);
    if (res.data?.success) {
      setReportStatus('submitted');
      toast.success('Report submitted for review!');
      localStorage.removeItem('ipetro_pv_report');
    }
  } catch (e: any) {
    toast.error(e?.response?.data?.message || 'Submit failed');
  } finally {
    setIsSubmitting(false);
  }
};


    // Handle save to database
    const handleSave = async (status: 'draft' | 'submitted' = 'draft', redirectAfterSave = false) => {
        setIsSaving(true);
        
        try {
            // Validate required fields
            if (!form.equipmentTag || !form.equipmentType || !form.reportNo) {
                toast.error('Please complete all required fields');
                setIsSaving(false);
                return { success: false, reportId: null };
            }

            // Auto-generate title if empty
            let title = form.title || '';
            if (!title.trim()) {
                title = generateAutoTitle(form);
            }

            let effectiveStatus = status;

                // Inspector editing revision → keep revisions_requested
                if (reportId && reportStatus === 'revisions_requested') {
                effectiveStatus = 'revisions_requested';
                }

                // Prevent PUT with submitted
                if (reportId && status === 'submitted') {
                effectiveStatus = 'draft';
                }


            // Prepare the data
            const reportData = {
                title: title,

                // ✅ DB column (new)
                equipment_template_id: form.equipmentTemplateId ?? null,

                json_data: {
                    title: title,
                    equipmentTag: form.equipmentTag,
                    equipmentDescription: form.equipmentDescription,
                    equipmentType: form.equipmentType,
                    plantUnitArea: form.plantUnitArea,
                    doshRegistration: form.doshRegistration,
                    reportNo: form.reportNo,
                    reportDate: form.reportDate,
                    initialFinding: form.initialFinding,
                    externalFinding: form.externalFinding,
                    internalFinding: form.internalFinding,
                    ndt: form.ndt,
                    recommendations: form.recommendations,
                    inspectorName: form.inspectorName,
                    publishDate: form.publishDate,

                    // ✅ OPTIONAL (keep inside json as well if you like)
                    equipmentTemplateId: form.equipmentTemplateId ?? null,
                },

                report_no: form.reportNo,
                status: effectiveStatus,
                };

            console.log('Sending report data:', reportData);

            let response;
            let savedReportId = reportId;
            
            if (savedReportId) {
                // Update existing report
                response = await api.put(`/reports/${savedReportId}`, reportData);
                console.log('Updated existing report:', savedReportId);
            } else {
                // Create new report
                console.log('Creating new report...');
                response = await api.post('/reports', reportData);
                
                // ✅ DEBUG: Log everything
                console.log('🔍 Full POST Response:', response);
                console.log('🔍 Response data:', response.data);
                console.log('🔍 Response data structure:', {
                    hasSuccess: 'success' in response.data,
                    hasData: 'data' in response.data,
                    hasReportInData: response.data.data && 'report' in response.data.data,
                    reportKeys: response.data.data?.report ? Object.keys(response.data.data.report) : 'no report'
                });
                
                // ✅ FIXED: Extract ID based on YOUR ACTUAL API RESPONSE STRUCTURE
                // Your structure: { success: true, message: "...", data: { report: { report_id: 67, ... } } }
                const responseData = response.data;
                let extractedId = null;
                
                // Pattern 1: Check YOUR actual structure first
                if (responseData.data && responseData.data.report && responseData.data.report.report_id) {
                    extractedId = responseData.data.report.report_id;
                    console.log('✅ Found ID at response.data.data.report.report_id:', extractedId);
                }
                // Pattern 2: Check if report has 'id' field instead of 'report_id'
                else if (responseData.data && responseData.data.report && responseData.data.report.id) {
                    extractedId = responseData.data.report.id;
                    console.log('✅ Found ID at response.data.data.report.id:', extractedId);
                }
                // Pattern 3: Maybe the report is directly in data
                else if (responseData.data && responseData.data.report_id) {
                    extractedId = responseData.data.report_id;
                    console.log('✅ Found ID at response.data.report_id:', extractedId);
                }
                // Pattern 4: Maybe it's at root level
                else if (responseData.report_id) {
                    extractedId = responseData.report_id;
                    console.log('✅ Found ID at response.data.report_id:', extractedId);
                }
                // Pattern 5: Direct ID field
                else if (responseData.id) {
                    extractedId = responseData.id;
                    console.log('✅ Found ID at response.data.id:', extractedId);
                }
                // Pattern 6: Check data.id
                else if (responseData.data && responseData.data.id) {
                    extractedId = responseData.data.id;
                    console.log('✅ Found ID at response.data.data.id:', extractedId);
                }
                
                savedReportId = extractedId;
                console.log('🎯 Final savedReportId:', savedReportId);
                
                if (savedReportId) {
                    setReportId(savedReportId);
                    console.log('✅ Updated reportId state to:', savedReportId);
                } else {
                    console.warn('⚠️ No ID found in POST response. Full response:');
                    console.log('Full response structure:', JSON.stringify(responseData, null, 2));
                }
            }

            // ✅ FIXED: Check if successful - YOUR API returns success: true
            const isSuccess = 
                response.data.success === true || 
                response.status === 200 || 
                response.status === 201;

            if (isSuccess) {
                
                const successMessage = status === 'draft' ? 'saved' : 'submitted';
                toast.success(`Report ${successMessage} successfully!`, {
                    icon: status === 'draft' ? '💾' : '📤',
                    duration: 3000,
                });
                
                if (status === 'submitted') {
                    setForm(getInitialFormState());
                    setReportId(null);
                }
                
                // Handle redirect
                if (redirectAfterSave && savedReportId) {
                    console.log('Will redirect to /pv-report/' + savedReportId);
                    // Don't redirect here, let the caller handle it
                }
                
                return { success: true, reportId: savedReportId };
            } else {
                console.error('API did not indicate success:', response.data);
                return { success: false, reportId: null };
            }
        } catch (error: any) {
            console.error('Save error:', error);
            
            if (error.response?.status === 422) {
                const errors = error.response.data.errors;
                Object.keys(errors).forEach(key => {
                    toast.error(errors[key][0]);
                });
            } else if (error.response?.status === 403) {
                toast.error('You are not authorized to perform this action');
            } else {
                toast.error('Failed to save report. Please try again.');
            }
            
            return { success: false, reportId: null };
        } finally {
            setIsSaving(false);
            if (status === 'submitted') setIsSubmitting(false);
        }

    };

    const handleOpenPhotoReport = async () => {
        console.log('=== handleOpenPhotoReport ===');
        
        // Always allow opening photo report if we have reportId
        if (reportId) {
            console.log('Navigating to photo report with ID:', reportId);
            router.visit(`/reports/photo-report?report_id=${reportId}`);
            return;
        }
        
        // Only save for new reports (no reportId)
        if (!readOnly) {
            // For editable reports without ID, save first
            const result = await handleSave('draft');
            console.log('Save result:', result);
            
            if (result.success && result.reportId) {
                console.log('✅ Navigate to photo report with ID:', result.reportId);
                setTimeout(() => {
                    router.visit(`/reports/photo-report?report_id=${result.reportId}`);
                }, 500);
            } else {
                console.error('Failed to save or get ID:', result);
                toast.error('Please save the report first using "Save Draft"');
            }
        } else {
            // This shouldn't happen (read-only report without ID), but handle it
            toast.error('Report not found or not saved yet');
        }
    };


    // Apply template to form
    const applyTemplateToForm = (t: EquipmentTemplate, force = false) => {
  setForm((prev) => {
    const next = { ...prev };

    // store the chosen template ID
    next.equipmentTemplateId = t.id;
    next.equipmentType = t.equipment_type;
    next.equipmentDescription = t.title || t.equipment_type;

    const canSet = (current: string) => force || !current?.trim();

    if (canSet(next.initialFinding)) next.initialFinding = t.initial_finding || "";
    if (canSet(next.externalFinding)) next.externalFinding = t.external_finding || "";
    if (canSet(next.internalFinding)) next.internalFinding = t.internal_finding || "";
    if (canSet(next.ndt)) next.ndt = t.ndt || "";
    if (canSet(next.recommendations)) next.recommendations = t.recommendations || "";

    return next;
  });


  toast.success(`Template applied: ${t.title || t.equipment_type}`, { icon: "✨" });
    };

    // Generate automatic title
    const generateAutoTitle = (formData: FormState): string => {
        const parts: string[] = [];
        
        // Only include equipment type if it's specific
        if (formData.equipmentType && 
            formData.equipmentType !== "Select equipment type..." && 
            formData.equipmentType !== "" &&
            formData.equipmentType !== "Custom / Manual") {
            parts.push(formData.equipmentType);
        }
        
        // Add equipment tag (simplified)
        if (formData.equipmentTag) {
            parts.push(formData.equipmentTag);
        }
        
        // Add date
        if (formData.reportDate) {
            try {
                const date = new Date(formData.reportDate);
                if (!isNaN(date.getTime())) {
                    const formattedDate = date.toLocaleDateString('en-US', {
                        month: 'short',
                        year: 'numeric'
                    });
                    parts.push(`${formattedDate} Inspection`);
                }
            } catch (e) {
                // Date parsing failed, skip date part
            }
        }
        
        // Join parts or return default
        if (parts.length > 0) {
            // If you want "Inspection Report" at the end instead of in the middle
            return parts.join(' - ');
        }
        
        // Default with timestamp if nothing available
        return `Pressure Vessel Inspection Report`;
    };
    // Handle print
    const handlePrint = () => {
        // Create a new window for printing
        const printWindow = window.open('', '_blank');
        if (!printWindow) {
            toast.error('Please allow popups to print');
            return;
        }

        // Helper function for formatting dates
        const formatDateForPrint = (dateString: string) => {
            const date = new Date(dateString);
            return date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        };

        

        // Generate the print HTML
        const printContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Pressure Vessel Inspection Report</title>
                <style>
                    @page {
                        size: A4;
                        margin: 25mm;
                    }
                    body {
                        font-family: 'Times New Roman', Times, serif;
                        color: #000000;
                        background: white;
                        margin: 0;
                        padding: 0;
                    }
                    .report-container {
                        width: 210mm;
                        min-height: 297mm;
                        padding: 25mm;
                        box-sizing: border-box;
                    }
                    table {
                        width: 100%;
                        border-collapse: collapse;
                        border: 1px solid #000;
                        font-size: 11pt;
                    }
                    th, td {
                        border: 1px solid #000;
                        padding: 6px 8px;
                        vertical-align: top;
                    }
                    th {
                        background-color: #f0f0f0;
                        font-weight: bold;
                    }
                    .signature-line {
                        border-bottom: 1px solid #000;
                        margin-top: 4px;
                        min-height: 20px;
                    }
                    /* Ensure all text is black */
                    * {
                        color: #000000 !important;
                    }
                </style>
            </head>
            <body>
                <div class="report-container">
                <!-- Report Header -->
                    <div style="margin-bottom: 20px; padding-bottom: 15px; border-bottom: 2px solid #000;">
                        <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                            <div>
                                <div style="margin-bottom: 10px;">
                                    <!-- Fixed: Removed duplicate div and fixed image styling -->
                                    <div class="logo-container" style="height: 100px; width: 100px; border-radius: 4px; display: flex; align-items: center; justify-content: center; margin-bottom: 5px; overflow: hidden;">
                                        <img 
                                            src="${window.location.origin}/images/logo.png" 
                                            alt="iPETRO Logo"
                                            style="height: 90px; width:90px; object-fit: contain;"
                                            onerror="this.style.display='none'; this.nextElementSibling.style.display='block';"
                                        />
                                        <span style="color: white; font-weight: bold; font-size: 16px; display: none;">iPETRO</span>
                                    </div>
                                    <p style="font-size: 9pt; font-weight: bold; margin: 0; text-transform: uppercase; letter-spacing: 1px;">
                                        Asset Integrity Management Department
                                    </p>
                                </div>
                                <h1 style="font-size: 20pt; font-weight: bold; margin: 10px 0 5px 0;">
                                    PRESSURE VESSEL INSPECTION REPORT
                                </h1>
                                <p style="font-size: 14pt; font-weight: bold; margin: 0;">
                                    Major Turnaround 2025
                                </p>
                            </div>
                            <div style="text-align: right;">
                                <div style="font-size: 10pt;">
                                    <div style="margin-bottom: 5px;">
                                        <span style="font-weight: bold;">Report No:</span>
                                        <span style="margin-left: 10px;">${form.reportNo || "________________"}</span>
                                    </div>
                                    <div style="margin-bottom: 5px;">
                                        <span style="font-weight: bold;">Date:</span>
                                        <span style="margin-left: 10px;">${formatDateForPrint(form.reportDate)}</span>
                                    </div>
                                    <div>
                                        <span style="font-weight: bold;">Revision:</span>
                                        <span style="margin-left: 10px;">1.0</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Equipment Details Table -->
                    <h2 style="font-size: 14pt; font-weight: bold; margin: 20px 0 10px 0; text-transform: uppercase;">
                        1. EQUIPMENT IDENTIFICATION
                    </h2>
                    <table>
                        <tr>
                            <th style="width: 20%; text-align: center;">Equipment Tag No.</th>
                            <td style="width: 30%;">${form.equipmentTag || "________________"}</td>
                            <th style="width: 20%; text-align: center;">Plant / Unit / Area</th>
                            <td style="width: 30%;">${form.plantUnitArea || "________________"}</td>
                        </tr>
                        <tr>
                            <th style="text-align: center;">Equipment Description</th>
                            <td>${form.equipmentDescription || "________________"}</td>
                            <th style="text-align: center;">DOSH Registration No.</th>
                            <td>${form.doshRegistration || "________________"}</td>
                        </tr>
                    </table>

                    <!-- Inspection Findings Table -->
                    <h2 style="font-size: 14pt; font-weight: bold; margin: 20px 0 10px 0; text-transform: uppercase;">
                        2. INSPECTION FINDINGS
                    </h2>
                    <table>
                        <tr>
                            <th style="width: 25%; text-align: center;">FINDINGS</th>
                            <td colspan="3" style="font-size: 9pt; line-height: 1.3;">
                                <strong>Condition:</strong> With respect to the internal surface, describe and state location of any scales,
                                oils or other deposits. Give location and extent of any corrosion and state whether
                                it is active or inactive. State location and extent of any erosion, grooving,
                                bulging, warping, cracking or similar condition. Report condition of tubes, coils,
                                linings, baffles, supports and any major changes or repairs made since last inspection.
                            </td>
                        </tr>
                        <tr>
                            <th style="text-align: center;">Initial / Pre-Inspection</th>
                            <td colspan="3" style="min-height: 40px; white-space: pre-wrap;">${form.initialFinding || "No initial observations recorded"}</td>
                        </tr>
                        <tr>
                            <th style="text-align: center;">Post / Final Inspection – External</th>
                            <td colspan="3" style="min-height: 60px; white-space: pre-wrap;">${form.externalFinding || "No external findings recorded"}</td>
                        </tr>
                        <tr>
                            <th style="text-align: center;">Post / Final Inspection – Internal</th>
                            <td colspan="3" style="min-height: 60px; white-space: pre-wrap;">${form.internalFinding || "No internal findings recorded"}</td>
                        </tr>
                    </table>

                    <!-- NDT Results -->
                    <h2 style="font-size: 14pt; font-weight: bold; margin: 20px 0 10px 0; text-transform: uppercase;">
                        3. NON-DESTRUCTIVE TESTINGS
                    </h2>
                    <table>
                        <tr>
                            <th style="width: 25%; text-align: center;">NDT Methods & Results</th>
                            <td style="min-height: 40px; white-space: pre-wrap;">${form.ndt || "No NDT results recorded"}</td>
                        </tr>
                    </table>

                    <!-- Recommendations -->
                    <h2 style="font-size: 14pt; font-weight: bold; margin: 20px 0 10px 0; text-transform: uppercase;">
                        4. RECOMMENDATIONS
                    </h2>
                    <table>
                        <tr>
                            <th style="width: 25%; text-align: center;">Recommended Actions</th>
                            <td style="min-height: 40px; white-space: pre-wrap;">${form.recommendations || "No recommendations provided"}</td>
                        </tr>
                    </table>

                   
                    <!-- Inspector Verification (Auto) -->
                        <h2 style="font-size: 14pt; font-weight: bold; margin: 20px 0 10px 0; text-transform: uppercase;">
                        5. INSPECTOR VERIFICATION
                        </h2>

                        <table>
                        <tr>
                            <th style="width: 25%; text-align: center;">Inspector Name</th>
                            <td>${form.inspectorName || (page?.auth?.user?.name ?? "________________")}</td>
                        </tr>

                        <tr>
                            <th style="width: 25%; text-align: center;">Inspector Signature</th>
                            <td style="height: 50px;">
                            ${
                                signatureUrl
                                ? `<img src="${window.location.origin}${signatureUrl}" style="height:40px; object-fit:contain;" />`
                                : "______________________"
                            }
                            </td>
                        </tr>

                        <tr>
                            <th style="width: 25%; text-align: center;">Publish Date</th>
                            <td>${formatDateForPrint(form.publishDate || form.reportDate)}</td>
                        </tr>
                        </table>



                    <!-- Signatures & Approvals -->
                    <div style="margin-top: 30px;">
                        <h3 style="font-size: 12pt; font-weight: bold; margin: 0 0 20px 0; padding-bottom: 5px; border-bottom: 1px solid #000;">
                            APPROVAL & VERIFICATION
                        </h3>
                        
                        <!-- DOSH Officer Section -->
                        <div style="margin-bottom: 30px;">
                            <h4 style="font-size: 11pt; font-weight: bold; margin: 0 0 15px 0; color: #333;">
                                Recommendation / Comment by DOSH Officer (if applicable):
                            </h4>
                            
                            <!-- Comments Box -->
                            <div style="margin-bottom: 20px; padding: 15px; border: 1px solid #ddd; background-color: #f9f9f9; border-radius: 4px; min-height: 80px;">
                                <p style="font-size: 10pt; margin: 0; color: #666; font-style: italic;">
                                    Enter DOSH officer comments or recommendations here...
                                </p>
                            </div>
                            
                            <!-- DOSH Officer Signature -->
                            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 25px;">
                                <div>
                                    <p style="font-size: 9pt; font-weight: 600; margin: 0 0 8px 0; color: #555;">Name</p>
                                    <div style="border-bottom: 1px solid #000; padding: 8px 0 4px 0; min-height: 20px;"></div>
                                    <p style="font-size: 8pt; margin: 4px 0 0 0; color: #777;">DOSH Officer Name</p>
                                </div>
                                <div>
                                    <p style="font-size: 9pt; font-weight: 600; margin: 0 0 8px 0; color: #555;">Signature</p>
                                    <div style="border-bottom: 1px solid #000; padding: 8px 0 4px 0; min-height: 20px;"></div>
                                    <p style="font-size: 8pt; margin: 4px 0 0 0; color: #777;">Officer Signature</p>
                                </div>
                                <div>
                                    <p style="font-size: 9pt; font-weight: 600; margin: 0 0 8px 0; color: #555;">Date</p>
                                    <div style="border-bottom: 1px solid #000; padding: 8px 0 4px 0; min-height: 20px;"></div>
                                    <p style="font-size: 8pt; margin: 4px 0 0 0; color: #777;">dd/mm/yyyy</p>
                                </div>
                            </div>
                        </div>

                        <!-- Plant Action Section -->
                        <div style="margin-bottom: 20px; padding-top: 20px; border-top: 1px dashed #ccc;">
                            <h4 style="font-size: 11pt; font-weight: bold; margin: 0 0 15px 0; color: #333;">
                                Action taken by Plant on recommendation (if applicable):
                            </h4>
                            
                            <!-- Action Taken Box -->
                            <div style="margin-bottom: 20px; padding: 15px; border: 1px solid #ddd; background-color: #f9f9f9; border-radius: 4px; min-height: 80px;">
                                <p style="font-size: 10pt; margin: 0; color: #666; font-style: italic;">
                                    Describe actions taken by plant management...
                                </p>
                            </div>
                            
                            <!-- Plant Management Signature -->
                            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 25px;">
                                <div>
                                    <p style="font-size: 9pt; font-weight: 600; margin: 0 0 8px 0; color: #555;">Name</p>
                                    <div style="border-bottom: 1px solid #000; padding: 8px 0 4px 0; min-height: 20px;"></div>
                                    <p style="font-size: 8pt; margin: 4px 0 0 0; color: #777;">Plant Manager Name</p>
                                </div>
                                <div>
                                    <p style="font-size: 9pt; font-weight: 600; margin: 0 0 8px 0; color: #555;">Signature</p>
                                    <div style="border-bottom: 1px solid #000; padding: 8px 0 4px 0; min-height: 20px;"></div>
                                    <p style="font-size: 8pt; margin: 4px 0 0 0; color: #777;">Manager Signature</p>
                                </div>
                                <div>
                                    <p style="font-size: 9pt; font-weight: 600; margin: 0 0 8px 0; color: #555;">Date</p>
                                    <div style="border-bottom: 1px solid #000; padding: 8px 0 4px 0; min-height: 20px;"></div>
                                    <p style="font-size: 8pt; margin: 4px 0 0 0; color: #777;">dd/mm/yyyy</p>
                                </div>
                            </div>                        </div>
                    </div>

                    <!-- Footer -->
                    <div style="margin-top: 30px; padding-top: 10px; border-top: 1px solid #000; font-size: 8pt;">
                        <div style="display: flex; justify-content: space-between;">
                            <div>
                                <p style="font-weight: bold; margin: 0;">iPETRO Asset Integrity Management</p>
                                <p style="margin: 2px 0 0 0;">Document No: PV-IR-2025-001</p>
                            </div>
                            <div style="text-align: right;">
                                <p style="margin: 0;">Page 1 of 1</p>
                                <p style="margin: 2px 0 0 0;">Confidential - For Internal Use Only</p>
                            </div>
                        </div>
                    </div>
                </div>
            </body>
            </html>
        `;

        // Write the content to the new window
        printWindow.document.write(printContent);
        printWindow.document.close();
        
        // Wait for content to load, then print
        printWindow.onload = () => {
            printWindow.focus();
            printWindow.print();
            printWindow.onafterprint = () => printWindow.close();
        };

        toast.success('Opening print preview...', {
            icon: '🖨️',
            duration: 2000,
        });
    };

    // Handle reset
    const handleReset = () => {
        if (confirm("Are you sure you want to clear the entire report? This cannot be undone.")) {
            setForm(getInitialFormState());
            toast.success('Report cleared', {
                icon: '🗑️',
                duration: 3000,
            });
        }
    };

    // Handle export as JSON
    const handleExportJSON = () => {
        const dataStr = JSON.stringify(form, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        const exportFileDefaultName = `pv-report-${form.reportNo || 'draft'}.json`;
        
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
        
        toast.success('Report exported as JSON', {
            icon: '📥',
            duration: 3000,
        });
    };

    // Navigation sections
    const sections = [
        { id: "details", label: "Equipment Details", icon: Settings },
        { id: "initial", label: "Initial Findings", icon: FileText }, // Added this
        { id: "external", label: "External Inspection", icon: Eye },
        { id: "internal", label: "Internal Inspection", icon: EyeOff },
        { id: "ndt", label: "NDT Results", icon: HardHat },
        { id: "recommendations", label: "Recommendations", icon: AlertCircle },
        { id: "preview", label: "Preview", icon: FileText },
    ];

    // Get current template info
    const currentTemplate = form.equipmentType ? TEMPLATE_INFO[form.equipmentType] : null;

    return (
        <AppLayout breadcrumbs={[{ title: "Pressure Vessel Report", href: "/pv-report" }]}>
            <Head title="Pressure Vessel Inspection Report - iPETRO" />
            <Toaster position="top-right" />

            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950">
                {/* Header */}
                <div className="bg-white dark:bg-gray-800 shadow-lg border-b border-gray-200 dark:border-gray-700">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                    <HardHat className="h-6 w-6 text-red-600" />
                                    Pressure Vessel Inspection Report
                                </h1>
                                <p className="text-gray-600 dark:text-gray-400 mt-1">
                                    Create comprehensive inspection reports for pressure vessels and storage tanks
                                </p>
                            </div>
                            
                            {/* Action Buttons 
                            <div className="flex flex-wrap gap-2">
                                {/* Update your existing Save button 
                                <button
                                    onClick={() => handleSave('draft')}
                                    disabled={isSaving}
                                    className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-green-600 to-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 transition-all"
                                >
                                    <Save className="h-4 w-4" />
                                    {isSaving ? 'Saving...' : reportId ? 'Update Draft' : 'Save Draft'}
                                </button>
                                <button
                                    onClick={handleExportJSON}
                                    className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 transition-all"
                                >
                                    <Download className="h-4 w-4" />
                                    Export JSON 
                                </button>
                            </div>*/}
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    
                {readOnly && reportStatus && (
                <div className="mb-6">
                    <div className={`p-4 rounded-lg border-l-4 ${
                    reportStatus === 'approved' 
                        ? 'bg-green-50 border-green-500 text-green-800 dark:bg-green-900/20 dark:text-green-300'
                        : reportStatus === 'rejected'
                        ? 'bg-red-50 border-red-500 text-red-800 dark:bg-red-900/20 dark:text-red-300'
                        : 'bg-blue-50 border-blue-500 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300'
                    }`}>
                    <div className="flex items-center gap-3">
                        {reportStatus === 'approved' ? (
                        <CheckCircle2 className="h-5 w-5" />
                        ) : reportStatus === 'rejected' ? (
                        <XCircle className="h-5 w-5" />
                        ) : (
                        <Info className="h-5 w-5" />
                        )}
                        <div>
                        <p className="font-semibold">
                            Report is {reportStatus.toUpperCase()}
                            {reportStatus === 'submitted' && ' for review'}
                        </p>
                        <p className="text-sm mt-1">
                            {reportStatus === 'approved' 
                            ? 'This report has been approved and cannot be edited.'
                            : reportStatus === 'rejected'
                            ? 'This report has been rejected. Contact administrator for revisions.'
                            : 'This report is currently under review and cannot be edited.'}
                        </p>
                        </div>
                    </div>
                    </div>
                </div>
                )}
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                        {/* Left Sidebar - Navigation */}
                        <div className="lg:col-span-1">
                            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 sticky top-6">
                                <div className="mb-6">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center">
                                            <FileText className="h-5 w-5 text-white" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-gray-900 dark:text-white">Report Builder</h3>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                                Step-by-step form
                                            </p>
                                        </div>
                                    </div>
                                    
                                    <div className="space-y-1">
                                        {sections.map((section) => {
                                            const Icon = section.icon;
                                            return (
                                                <button
                                                    key={section.id}
                                                    onClick={() => setActiveSection(section.id)}
                                                    className={`w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                                                        activeSection === section.id
                                                            ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border-l-4 border-red-500'
                                                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                                                    }`}
                                                >
                                                    <Icon className="h-4 w-4 flex-shrink-0" />
                                                    <span className="text-sm font-medium">{section.label}</span>
                                                    {activeSection === section.id && (
                                                        <ChevronRight className="h-4 w-4 ml-auto" />
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Template Info */}
                                {currentTemplate && (
                                    <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                                        <div className="flex items-start gap-3">
                                            <div className="h-8 w-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                                                <span className="text-lg">{currentTemplate.icon}</span>
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                                                    {currentTemplate.name}
                                                </h4>
                                                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                                    {currentTemplate.description}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Quick Stats */}
                                <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                                        Report Stats
                                    </h4>
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-gray-600 dark:text-gray-400">Initial</span>
                                            <span className="font-medium text-gray-900 dark:text-white">
                                                {wordCount.initialFinding || 0} words
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-gray-600 dark:text-gray-400">External</span>
                                            <span className="font-medium text-gray-900 dark:text-white">
                                                {wordCount.externalFinding || 0} words
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-gray-600 dark:text-gray-400">Internal</span>
                                            <span className="font-medium text-gray-900 dark:text-white">
                                                {wordCount.internalFinding || 0} words
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-gray-600 dark:text-gray-400">Recommendations</span>
                                            <span className="font-medium text-gray-900 dark:text-white">
                                                {wordCount.recommendations || 0} items
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Danger Zone */}
                                <div className="mt-6 pt-6 border-t border-red-200 dark:border-red-800">
                                    {/* Clear All Data button */}
                                    <button
                                    onClick={handleReset}
                                    disabled={readOnly}
                                    className={`w-full flex items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-all ${
                                        readOnly 
                                        ? 'border-gray-300 bg-gray-100 text-gray-400 cursor-not-allowed dark:border-gray-700 dark:bg-gray-800'
                                        : 'border-red-300 bg-red-50 text-red-700 hover:bg-red-100 dark:border-red-700 dark:bg-red-900/20 dark:text-red-300 dark:hover:bg-red-900/30'
                                    }`}
                                    >
                                    <Trash2 className="h-4 w-4" />
                                    Clear All Data
                                    </button>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
                                        This will permanently delete all entered data
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Main Form Area */}
                        <div className="lg:col-span-3 space-y-6">
                            {/* Equipment Details Section */}
                            {/* Equipment Details Section */}
                            {activeSection === "details" && (
                                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                                    <div className="flex items-center justify-between mb-6">
                                        <div>
                                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                                                Equipment Details
                                            </h2>
                                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                                Basic information about the pressure vessel
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Info className="h-5 w-5 text-blue-500" />
                                            <span className="text-xs text-gray-500 dark:text-gray-400">
                                                Required fields *
                                            </span>
                                        </div>
                                    </div>

                                    <div className="space-y-6">
                                        {/* Equipment Template Selection */}
                                        <div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                                                    Report Title (Optional)
                                                    <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">
                                                        - Auto-generated if empty
                                                    </span>
                                                </label>
                                                <input
                                                    type="text"
                                                    value={form.title || generateAutoTitle(form)}
                                                    onChange={handleChange("title")}
                                                    disabled={readOnly}
                                                    className={`w-full rounded-lg border px-4 py-3 text-sm transition-all ${
                                                        readOnly 
                                                            ? 'bg-gray-100 border-gray-300 text-gray-500 cursor-not-allowed dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400' 
                                                            : 'border-gray-300 bg-white focus:border-red-500 focus:ring-2 focus:ring-red-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white'
                                                    }`}
                                                    placeholder={generateAutoTitle(form)}
                                                />
                                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                                                    Leave empty to auto-generate: "{generateAutoTitle(form)}"
                                                </p>
                                            </div>
                                            <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                                                Equipment Template (auto-fill)
                                            </label>

                                            <div className="flex flex-col md:flex-row gap-2">
                                                <select
                                                    value={selectedTemplateId ?? ""}
                                                    onChange={(e) => {
                                                        if (readOnly) return; // Add this check
                                                        const val = e.target.value ? Number(e.target.value) : null;
                                                        setSelectedTemplateId(val);

                                                        if (!val) return;
                                                        const t = templates.find((x) => x.id === val);
                                                        if (!t) return;

                                                        const hasAnyText =
                                                            !!form.initialFinding.trim() ||
                                                            !!form.externalFinding.trim() ||
                                                            !!form.internalFinding.trim() ||
                                                            !!form.ndt.trim() ||
                                                            !!form.recommendations.trim();

                                                        if (hasAnyText) {
                                                            const ok = confirm(
                                                                "Apply template now?\n\nOK = Replace existing section texts\nCancel = Only fill empty fields"
                                                            );
                                                            applyTemplateToForm(t, ok);
                                                        } else {
                                                            applyTemplateToForm(t, true);
                                                        }
                                                    }}
                                                    disabled={readOnly}
                                                    className={`w-full rounded-lg border px-4 py-3 text-sm transition-all ${
                                                        readOnly 
                                                            ? 'bg-gray-100 border-gray-300 text-gray-500 cursor-not-allowed dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400' 
                                                            : 'border-gray-300 bg-white focus:border-red-500 focus:ring-2 focus:ring-red-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white'
                                                    }`}
                                                >
                                                    <option value="">Select template...</option>
                                                    {templates.map((t) => (
                                                        <option key={t.id} value={t.id}>
                                                            {t.equipment_type} - {t.title || "Untitled"}
                                                        </option>
                                                    ))}
                                                </select>

                                                {/* Manage Templates button */}
                                                <button
                                                    type="button"
                                                    onClick={() => router.visit("/equipment-templates")}
                                                    disabled={readOnly}
                                                    className={`rounded-lg border px-4 py-3 text-sm font-semibold transition-all ${
                                                        readOnly
                                                            ? 'border-gray-300 bg-gray-100 text-gray-400 cursor-not-allowed dark:border-gray-700 dark:bg-gray-800'
                                                            : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
                                                    }`}
                                                >
                                                    Manage Templates
                                                </button>
                                            </div>

                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                                                Selecting a template can auto-fill Initial / External / Internal / NDT / Recommendations.
                                            </p>
                                        </div>

                                        {/* Equipment Details Grid */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                                                    Equipment Tag Number *
                                                </label>
                                                <input
                                                    type="text"
                                                    value={form.equipmentTag}
                                                    onChange={handleChange("equipmentTag")}
                                                    disabled={readOnly}
                                                    className={`w-full rounded-lg border px-4 py-3 text-sm transition-all ${
                                                        readOnly 
                                                            ? 'bg-gray-100 border-gray-300 text-gray-500 cursor-not-allowed dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400' 
                                                            : 'border-gray-300 bg-white focus:border-red-500 focus:ring-2 focus:ring-red-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white'
                                                    }`}
                                                    placeholder="e.g., V-101, TK-205"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                                                    Plant / Unit / Area *
                                                </label>
                                                <input
                                                    type="text"
                                                    value={form.plantUnitArea}
                                                    onChange={handleChange("plantUnitArea")}
                                                    disabled={readOnly}
                                                    className={`w-full rounded-lg border px-4 py-3 text-sm transition-all ${
                                                        readOnly 
                                                            ? 'bg-gray-100 border-gray-300 text-gray-500 cursor-not-allowed dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400' 
                                                            : 'border-gray-300 bg-white focus:border-red-500 focus:ring-2 focus:ring-red-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white'
                                                    }`}
                                                    placeholder="e.g., Process Unit 1, Storage Area"
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                                                    DOSH Registration Number *
                                                </label>
                                                <input
                                                    type="text"
                                                    value={form.doshRegistration}
                                                    onChange={handleChange("doshRegistration")}
                                                    disabled={readOnly}
                                                    className={`w-full rounded-lg border px-4 py-3 text-sm transition-all ${
                                                        readOnly 
                                                            ? 'bg-gray-100 border-gray-300 text-gray-500 cursor-not-allowed dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400' 
                                                            : 'border-gray-300 bg-white focus:border-red-500 focus:ring-2 focus:ring-red-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white'
                                                    }`}
                                                    placeholder="Enter DOSH registration"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                                                    Report Number *
                                                </label>
                                                <input
                                                    type="text"
                                                    value={form.reportNo}
                                                    onChange={handleChange("reportNo")}
                                                    disabled={readOnly}
                                                    className={`w-full rounded-lg border px-4 py-3 text-sm transition-all ${
                                                        readOnly 
                                                            ? 'bg-gray-100 border-gray-300 text-gray-500 cursor-not-allowed dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400' 
                                                            : 'border-gray-300 bg-white focus:border-red-500 focus:ring-2 focus:ring-red-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white'
                                                    }`}
                                                    placeholder="e.g., PLANT1/V-001/TA2025"
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                                                Report Date *
                                            </label>
                                            <input
                                                type="date"
                                                value={form.reportDate}
                                                onChange={handleChange("reportDate")}
                                                disabled={readOnly}
                                                className={`w-full max-w-xs rounded-lg border px-4 py-3 text-sm transition-all ${
                                                    readOnly 
                                                        ? 'bg-gray-100 border-gray-300 text-gray-500 cursor-not-allowed dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400' 
                                                        : 'border-gray-300 bg-white focus:border-red-500 focus:ring-2 focus:ring-red-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white'
                                                }`}
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Initial Findings Section */}
                            {activeSection === "initial" && (
                                <TextAreaSection
                                    title="Initial / Pre-Inspection Findings"
                                    description="Document initial observations before detailed inspection"
                                    icon={FileText}
                                    value={form.initialFinding}
                                    onChange={handleChange("initialFinding")}
                                    placeholder="Describe any pre-inspection observations, initial conditions, or notable items from previous reports..."
                                    wordCount={wordCount.initialFinding}
                                    onCopy={() => copyToClipboard("initialFinding", "Initial Findings")}
                                    copied={copiedField === "initialFinding"}
                                    readOnly={readOnly}
                                />
                            )}

                            {/* External Inspection Section */}
                            {activeSection === "external" && (
                                <TextAreaSection
                                    title="External Inspection Findings"
                                    description="Document observations from the external visual inspection"
                                    icon={Eye}
                                    value={form.externalFinding}
                                    onChange={handleChange("externalFinding")}
                                    placeholder="Describe external findings including coating condition, structural integrity, signs of corrosion, etc."
                                    wordCount={wordCount.externalFinding}
                                    onCopy={() => copyToClipboard("externalFinding", "External Findings")}
                                    copied={copiedField === "externalFinding"}
                                    readOnly={readOnly}
                                />
                            )}

                            {/* Internal Inspection Section */}
                            {activeSection === "internal" && (
                                <TextAreaSection
                                    title="Internal Inspection Findings"
                                    description="Document observations from the internal visual inspection"
                                    icon={EyeOff}
                                    value={form.internalFinding}
                                    onChange={handleChange("internalFinding")}
                                    placeholder="Describe internal findings including corrosion patterns, weld conditions, lining integrity, etc."
                                    wordCount={wordCount.internalFinding}
                                    onCopy={() => copyToClipboard("internalFinding", "Internal Findings")}
                                    copied={copiedField === "internalFinding"}
                                    readOnly={readOnly}
                                />
                            )}

                            {/* NDT Results Section */}
                            {activeSection === "ndt" && (
                                <TextAreaSection
                                    title="Non-Destructive Testing Results"
                                    description="Document results from NDT methods (UTT, MPI, DPT, etc.)"
                                    icon={HardHat}
                                    value={form.ndt}
                                    onChange={handleChange("ndt")}
                                    placeholder="Enter NDT results including method, location, measurements, and findings"
                                    wordCount={wordCount.ndt}
                                    onCopy={() => copyToClipboard("ndt", "NDT Results")}
                                    copied={copiedField === "ndt"}
                                    readOnly={readOnly}
                                />
                            )}

                            {/* Recommendations Section */}
                            {activeSection === "recommendations" && (
                                <TextAreaSection
                                    title="Recommendations and Actions"
                                    description="List recommendations for maintenance, repair, or monitoring"
                                    icon={AlertCircle}
                                    value={form.recommendations}
                                    onChange={handleChange("recommendations")}
                                    placeholder="Enter recommendations including priority levels, required actions, and timelines"
                                    wordCount={wordCount.recommendations}
                                    onCopy={() => copyToClipboard("recommendations", "Recommendations")}
                                    copied={copiedField === "recommendations"}
                                    readOnly={readOnly}
                                />
                            )}

                            {/* Preview Section */}
                            {activeSection === "preview" && (
                                <div className="space-y-6">
                                    {/* ✅ Checklist UI */}
                                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                                        Report Checklist
                                    </h3>

                                    <div className="space-y-3 text-sm">
                                        <ChecklistRow label="Equipment details completed" ok={checklist.equipment} />
                                        <ChecklistRow label="Initial findings filled" ok={checklist.initial} />
                                        <ChecklistRow label="External findings filled" ok={checklist.external} />
                                        <ChecklistRow label="Internal findings filled" ok={checklist.internal} />
                                        <ChecklistRow label="NDT results filled" ok={checklist.ndt} />
                                        <ChecklistRow label="Recommendations filled" ok={checklist.recommendations} />
                                        <ChecklistRow label="Signature saved" ok={checklist.signature} />
                                    </div>

                                    {/* Signature preview */}
                                    <div className="mt-4">
                                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Inspector Signature Preview
                                        </p>

                                        {signatureUrl ? (
                                        <img
                                            src={signatureUrl}
                                            alt="Inspector signature"
                                            className="h-20 border rounded bg-white p-2"
                                        />
                                        ) : (
                                        <div className="text-sm text-red-600">
                                            No signature found. Please save your signature first at{" "}
                                            <button
                                            onClick={() => router.visit("/profile/signature")}
                                            className="underline font-semibold"
                                            >
                                            Signature Page
                                            </button>
                                        </div>
                                        )}
                                    </div>

                                    {/* Example: disable print if not ready */}
                                    {!checklist?.ready && (
                                        <div className="mt-4 p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-sm">
                                        ⚠️ Complete all required sections and save your signature before finalizing/printing.
                                        </div>
                                    )}
                                    </div>

                                    {/* Existing preview */}
                                    <PreviewSection
                                        form={form}
                                        handlePrint={handlePrint}
                                        signatureUrl={signatureUrl}
                                        onGenerateAI={handleGenerateAI}
                                        aiLoading={aiLoading}
                                        readOnly={readOnly}
                                        />

                                </div>
                                )}


                                {/* Navigation Footer */}
                                <div className="flex justify-between items-center pt-6 border-t border-gray-200 dark:border-gray-700">
                                    {/* LEFT SIDE: Previous button only */}
                                    <div className="flex items-center">
                                        {/* Previous button - only show if not on first section */}
                                        {sections.findIndex(s => s.id === activeSection) > 0 && (
                                            <button
                                                onClick={() => {
                                                    const currentIndex = sections.findIndex(s => s.id === activeSection);
                                                    setActiveSection(sections[currentIndex - 1].id);
                                                }}
                                                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white border border-gray-300 rounded-lg hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-700 transition-colors"
                                            >
                                                <ChevronRight className="h-4 w-4 rotate-180" />
                                                Previous
                                            </button>
                                        )}
                                    </div>

                                    {/* RIGHT SIDE: Page indicator and action buttons */}
                                    <div className="flex items-center gap-3">
                                        {/* Progress indicator */}
                                        <div className="hidden sm:block text-xs text-gray-500 dark:text-gray-400">
                                            {sections.findIndex(s => s.id === activeSection) + 1} of {sections.length}
                                        </div>
                                        
                                        <div className="flex gap-2">
                                            {/* Next/Complete button */}
                                            {sections.findIndex(s => s.id === activeSection) === sections.length - 1 ? (
                                                // Last section (Preview) - Show completion options
                                                <>
                                                    {/* Save Draft button */}
                                                    <button
                                                    onClick={async () => {
                                                        const result = await handleSave('draft', true);
                                                        console.log('Save result:', result);
                                                        
                                                        if (result.success && result.reportId) {
                                                        console.log('Redirecting to /pv-report/' + result.reportId);
                                                        setTimeout(() => {
                                                            router.visit(`/pv-report/${result.reportId}`);
                                                        }, 1000);
                                                        } else if (result.success) {
                                                        toast.success('Report saved!', { icon: '💾' });
                                                        }
                                                    }}
                                                    disabled={isSaving || readOnly}
                                                    className={`px-4 py-2 text-sm font-medium bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-colors flex items-center gap-2 ${
                                                        isSaving || readOnly ? 'opacity-50 cursor-not-allowed' : ''
                                                    }`}
                                                    >
                                                    {isSaving ? (
                                                        <>
                                                        <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                        </svg>
                                                        Saving...
                                                        </>
                                                    ) : (
                                                        <>
                                                        <Save className="h-4 w-4" />
                                                        {reportId ? 'Update Draft' : 'Save Draft'}
                                                        </>
                                                    )}
                                                    </button>
                                                    
                                                    {/* Open Photo Report button */}
                                                    <button
                                                        onClick={handleOpenPhotoReport}
                                                        disabled={isSaving} // Remove readOnly from disabled condition
                                                        className={`px-4 py-2 text-sm font-medium bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 transition-colors flex items-center gap-2 ${
                                                            isSaving ? 'opacity-50 cursor-not-allowed' : ''
                                                        }`}
                                                    >
                                                        {isSaving ? (
                                                            <>
                                                                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                                </svg>
                                                                Saving...
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Check className="h-4 w-4" />
                                                                Open Photo Report
                                                            </>
                                                        )}
                                                    </button>
                                                </>
                                            ) : (
                                                // Not last section - Show next section button
                                                <button
                                                    onClick={() => {
                                                        const currentIndex = sections.findIndex(s => s.id === activeSection);
                                                        const nextSection = sections[currentIndex + 1];
                                                        
                                                        // Optional: Validate current section before proceeding
                                                        if (activeSection === 'details') {
                                                            if (!form.equipmentTag || !form.equipmentType || !form.reportNo) {
                                                                toast.error('Please complete all required fields in Equipment Details', {
                                                                    icon: '⚠️',
                                                                    duration: 3000,
                                                                });
                                                                return;
                                                            }
                                                        }
                                                        
                                                        setActiveSection(nextSection.id);
                                                    }}
                                                    className="px-4 py-2 text-sm font-medium bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:from-red-700 hover:to-red-800 transition-colors flex items-center gap-2"
                                                >
                                                    Continue to {sections[sections.findIndex(s => s.id === activeSection) + 1]?.label}
                                                    <ChevronRight className="h-4 w-4" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}

function ChecklistRow({ label, ok }: { label: string; ok: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-gray-700 dark:text-gray-300">{label}</span>
      {ok ? (
        <span className="inline-flex items-center gap-1 text-green-600 font-semibold">
          <CheckCircle2 className="h-4 w-4" /> OK
        </span>
      ) : (
        <span className="inline-flex items-center gap-1 text-red-600 font-semibold">
          <XCircle className="h-4 w-4" /> Missing
        </span>
      )}
    </div>
  );
}

// Text Area Section Component
interface TextAreaSectionProps {
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  value: string;
  onChange: (e: ChangeEvent<HTMLTextAreaElement>) => void;
  placeholder: string;
  wordCount: number;
  onCopy: () => void;
  copied: boolean;
  readOnly?: boolean;
}

function TextAreaSection({
  title,
  description,
  icon: Icon,
  value,
  onChange,
  placeholder,
  wordCount,
  onCopy,
  copied,
  readOnly = false,
}: TextAreaSectionProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${
              readOnly 
                ? 'bg-gradient-to-br from-gray-400 to-gray-500' 
                : 'bg-gradient-to-br from-blue-500 to-blue-600'
            }`}>
              <Icon className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{description}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {readOnly && (
            <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300">
              <Eye className="h-3 w-3" />
              View Only
            </span>
          )}
          
          <button
            onClick={onCopy}
            disabled={readOnly}
            className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-all ${
              readOnly
                ? 'border-gray-300 bg-gray-100 text-gray-400 cursor-not-allowed dark:border-gray-700 dark:bg-gray-800'
                : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
            }`}
          >
            {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>
      </div>

      <div className="space-y-4">
        <div className="relative">
          <textarea
            value={value}
            onChange={onChange}
            disabled={readOnly}
            className={`w-full min-h-[200px] rounded-lg border px-4 py-3 text-sm resize-y transition-all ${
              readOnly 
                ? 'bg-gray-100 border-gray-300 text-gray-500 cursor-not-allowed dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400' 
                : 'border-gray-300 bg-white focus:border-red-500 focus:ring-2 focus:ring-red-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white'
            }`}
            placeholder={readOnly ? "No data" : placeholder}
            rows={10}
          />
          <div className="absolute bottom-3 right-3 flex items-center gap-2">
            <span className={`text-xs ${
              readOnly ? 'text-gray-400' : 'text-gray-500 dark:text-gray-400'
            }`}>
              {wordCount} words
            </span>
          </div>
        </div>

        {!readOnly && (
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-100 dark:border-blue-800">
            <div className="flex items-start gap-3">
              <HelpCircle className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-gray-900 dark:text-white">Formatting Tips</h4>
                <ul className="mt-2 space-y-1 text-xs text-gray-600 dark:text-gray-400">
                  <li>• Use bullet points or numbered lists for clarity</li>
                  <li>• Include specific locations and measurements</li>
                  <li>• Note any deviations from previous inspections</li>
                  <li>• Reference applicable standards (ASME, API, etc.)</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}



// Preview Section Component
interface PreviewSectionProps {
  form: FormState;
  handlePrint: () => void;
  signatureUrl: string | null; // ✅ add
  onGenerateAI: () => void;//ai
aiLoading: boolean;//ai
readOnly?: boolean;
}

function PreviewSection({ 
  form, 
  handlePrint, 
  signatureUrl, 
  onGenerateAI, 
  aiLoading,
  readOnly = false
}: PreviewSectionProps) {
    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    return (
        <div className="space-y-6">
            {/* Preview Controls */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    {/* Left side: Preview info */}
                    <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 dark:text-white">Document Preview</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            This is how your report will look when printed
                        </p>
                    </div>
                    
                    {/* Right side: Action buttons - Print on far right, AI to its left */}
                    <div className="flex items-center gap-3">
                        {/* AI Improve Draft button in PreviewSection */}
                        <button
                        onClick={onGenerateAI}
                        disabled={aiLoading || readOnly}
                        className={`inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 transition-all min-w-[140px] justify-center ${
                            aiLoading || readOnly ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                        >
                        <span className="text-base">🤖</span>
                        {aiLoading ? "Generating..." : "AI Improve Draft"}
                        </button>
                        
                        {/* Print Button - Primary action on far right */}
                        <button
                            onClick={handlePrint}
                            className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-red-600 to-red-700 px-4 py-2.5 text-sm font-semibold text-white hover:from-red-700 hover:to-red-800 transition-all shadow-sm hover:shadow-md min-w-[120px] justify-center"
                        >
                            <Printer className="h-4 w-4" />
                            Print / PDF
                        </button>
                    </div>
                </div>
            </div>

            {/* Document Paper Preview */}
            <div className="bg-white shadow-lg rounded-none print:shadow-none border border-gray-300 text-black [&_*]:text-black" 
                style={{
                    maxWidth: '210mm',
                    minHeight: '297mm',
                    margin: '0 auto',
                    padding: '25mm',
                    boxSizing: 'border-box',
                    position: 'relative',
                    backgroundColor: 'white',
                    fontFamily: "'Times New Roman', Times, serif"
                }}>
                
                {/* Watermark (Only in preview) */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none no-print">
                    <div className="text-gray-300 text-6xl font-bold opacity-10 transform -rotate-45">
                        DRAFT
                    </div>
                </div>

                {/* Report Header */}
                <div style={{ marginBottom: '20px', paddingBottom: '15px', borderBottom: '2px solid #000' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                            <div style={{ marginBottom: '10px' }}>
                                <div style={{ height: '100px', width: '100px', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '5px', overflow: 'hidden' }}>
                                    <img 
                                        src={ipetroLogo} 
                                        alt="iPETRO Logo"
                                        style={{ height: '90px', width: '90px', objectFit: 'contain' }}
                                        onError={(e) => {
                                            e.currentTarget.style.display = 'none';
                                            e.currentTarget.parentElement.innerHTML = `
                                                <span style="color: white; font-weight: bold; font-size: 32px;">iPETRO</span>
                                            `;
                                        }}
                                    />
                                </div>
                                <p style={{ fontSize: '9pt', fontWeight: 'bold', margin: '0', textTransform: 'uppercase', letterSpacing: '1px' }}>
                                    Asset Integrity Management Department
                                </p>
                            </div>
                            <h1 style={{ fontSize: '20pt', fontWeight: 'bold', margin: '10px 0 5px 0' }}>
                                PRESSURE VESSEL INSPECTION REPORT
                            </h1>
                            <p style={{ fontSize: '14pt', fontWeight: 'bold', margin: '0' }}>
                                Major Turnaround 2025
                            </p>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '10pt' }}>
                                <div style={{ marginBottom: '5px' }}>
                                    <span style={{ fontWeight: 'bold' }}>Report No:</span>
                                    <span style={{ marginLeft: '10px' }}>{form.reportNo || "________________"}</span>
                                </div>
                                <div style={{ marginBottom: '5px' }}>
                                    <span style={{ fontWeight: 'bold' }}>Date:</span>
                                    <span style={{ marginLeft: '10px' }}>{formatDate(form.reportDate)}</span>
                                </div>
                                <div>
                                    <span style={{ fontWeight: 'bold' }}>Revision:</span>
                                    <span style={{ marginLeft: '10px' }}>1.0</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Equipment Details Table */}
                <h2 style={{ fontSize: '14pt', fontWeight: 'bold', margin: '20px 0 10px 0', textTransform: 'uppercase' }}>
                    1. EQUIPMENT IDENTIFICATION
                </h2>
                <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #000', fontSize: '11pt' }}>
                    <tbody>
                        <tr>
                            <th style={{ width: '20%', textAlign: 'center', border: '1px solid #000', padding: '6px 8px', verticalAlign: 'top', backgroundColor: '#f0f0f0', fontWeight: 'bold' }}>
                                Equipment Tag No.
                            </th>
                            <td style={{ width: '30%', border: '1px solid #000', padding: '6px 8px', verticalAlign: 'top' }}>
                                {form.equipmentTag || "________________"}
                            </td>
                            <th style={{ width: '20%', textAlign: 'center', border: '1px solid #000', padding: '6px 8px', verticalAlign: 'top', backgroundColor: '#f0f0f0', fontWeight: 'bold' }}>
                                Plant / Unit / Area
                            </th>
                            <td style={{ width: '30%', border: '1px solid #000', padding: '6px 8px', verticalAlign: 'top' }}>
                                {form.plantUnitArea || "________________"}
                            </td>
                        </tr>
                        <tr>
                            <th style={{ textAlign: 'center', border: '1px solid #000', padding: '6px 8px', verticalAlign: 'top', backgroundColor: '#f0f0f0', fontWeight: 'bold' }}>
                                Equipment Description
                            </th>
                            <td style={{ border: '1px solid #000', padding: '6px 8px', verticalAlign: 'top' }}>
                                {form.equipmentDescription || "________________"}
                            </td>
                            <th style={{ textAlign: 'center', border: '1px solid #000', padding: '6px 8px', verticalAlign: 'top', backgroundColor: '#f0f0f0', fontWeight: 'bold' }}>
                                DOSH Registration No.
                            </th>
                            <td style={{ border: '1px solid #000', padding: '6px 8px', verticalAlign: 'top' }}>
                                {form.doshRegistration || "________________"}
                            </td>
                        </tr>
                    </tbody>
                </table>

                {/* Inspection Findings Table */}
                <h2 style={{ fontSize: '14pt', fontWeight: 'bold', margin: '20px 0 10px 0', textTransform: 'uppercase' }}>
                    2. INSPECTION FINDINGS
                </h2>
                <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #000', fontSize: '11pt' }}>
                    <tbody>
                        <tr>
                            <th style={{ width: '25%', textAlign: 'center', border: '1px solid #000', padding: '6px 8px', verticalAlign: 'top', backgroundColor: '#f0f0f0', fontWeight: 'bold' }}>
                                FINDINGS
                            </th>
                            <td colSpan={3} style={{ fontSize: '9pt', lineHeight: '1.3', border: '1px solid #000', padding: '6px 8px', verticalAlign: 'top' }}>
                                <strong>Condition:</strong> With respect to the internal surface, describe and state location of any scales,
                                oils or other deposits. Give location and extent of any corrosion and state whether
                                it is active or inactive. State location and extent of any erosion, grooving,
                                bulging, warping, cracking or similar condition. Report condition of tubes, coils,
                                linings, baffles, supports and any major changes or repairs made since last inspection.
                            </td>
                        </tr>
                        <tr>
                            <th style={{ textAlign: 'center', border: '1px solid #000', padding: '6px 8px', verticalAlign: 'top', backgroundColor: '#f0f0f0', fontWeight: 'bold' }}>
                                Initial / Pre-Inspection
                            </th>
                            <td colSpan={3} style={{ minHeight: '40px', whiteSpace: 'pre-wrap', border: '1px solid #000', padding: '6px 8px', verticalAlign: 'top' }}>
                                {form.initialFinding || "No initial observations recorded"}
                            </td>
                        </tr>
                        <tr>
                            <th style={{ textAlign: 'center', border: '1px solid #000', padding: '6px 8px', verticalAlign: 'top', backgroundColor: '#f0f0f0', fontWeight: 'bold' }}>
                                Post / Final Inspection – External
                            </th>
                            <td colSpan={3} style={{ minHeight: '60px', whiteSpace: 'pre-wrap', border: '1px solid #000', padding: '6px 8px', verticalAlign: 'top' }}>
                                {form.externalFinding || "No external findings recorded"}
                            </td>
                        </tr>
                        <tr>
                            <th style={{ textAlign: 'center', border: '1px solid #000', padding: '6px 8px', verticalAlign: 'top', backgroundColor: '#f0f0f0', fontWeight: 'bold' }}>
                                Post / Final Inspection – Internal
                            </th>
                            <td colSpan={3} style={{ minHeight: '60px', whiteSpace: 'pre-wrap', border: '1px solid #000', padding: '6px 8px', verticalAlign: 'top' }}>
                                {form.internalFinding || "No internal findings recorded"}
                            </td>
                        </tr>
                    </tbody>
                </table>

                {/* NDT Results */}
                <h2 style={{ fontSize: '14pt', fontWeight: 'bold', margin: '20px 0 10px 0', textTransform: 'uppercase' }}>
                    3. NON-DESTRUCTIVE TESTINGS
                </h2>
                <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #000', fontSize: '11pt' }}>
                    <tbody>
                        <tr>
                            <th style={{ width: '25%', textAlign: 'center', border: '1px solid #000', padding: '6px 8px', verticalAlign: 'top', backgroundColor: '#f0f0f0', fontWeight: 'bold' }}>
                                NDT Methods & Results
                            </th>
                            <td style={{ minHeight: '40px', whiteSpace: 'pre-wrap', border: '1px solid #000', padding: '6px 8px', verticalAlign: 'top' }}>
                                {form.ndt || "No NDT results recorded"}
                            </td>
                        </tr>
                    </tbody>
                </table>

                {/* Recommendations */}
                <h2 style={{ fontSize: '14pt', fontWeight: 'bold', margin: '20px 0 10px 0', textTransform: 'uppercase' }}>
                    4. RECOMMENDATIONS
                </h2>
                <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #000', fontSize: '11pt' }}>
                    <tbody>
                        <tr>
                            <th style={{ width: '25%', textAlign: 'center', border: '1px solid #000', padding: '6px 8px', verticalAlign: 'top', backgroundColor: '#f0f0f0', fontWeight: 'bold' }}>
                                Recommended Actions
                            </th>
                            <td style={{ minHeight: '40px', whiteSpace: 'pre-wrap', border: '1px solid #000', padding: '6px 8px', verticalAlign: 'top' }}>
                                {form.recommendations || "No recommendations provided"}
                            </td>
                        </tr>
                    </tbody>
                </table>

                <h2 style={{ fontSize: '14pt', fontWeight: 'bold', margin: '20px 0 10px 0', textTransform: 'uppercase' }}>
                    5. INSPECTOR VERIFICATION
                    </h2>

                    <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #000', fontSize: '11pt' }}>
                    <tbody>
                        <tr>
                        <th style={{ width: '25%', textAlign: 'center', border: '1px solid #000', background: '#f0f0f0' }}>
                            Inspector Name
                        </th>
                        <td style={{ border: '1px solid #000', padding: '6px' }}>
                            {form.inspectorName}
                        </td>
                        </tr>

                        <tr>
                        <th style={{ textAlign: 'center', border: '1px solid #000', background: '#f0f0f0' }}>
                            Inspector Signature
                        </th>
                        <td style={{ border: '1px solid #000', padding: '6px', height: '50px' }}>
                            {signatureUrl ? (
                            <img src={signatureUrl} style={{ height: '40px', objectFit: 'contain' }} />
                            ) : (
                            "______________________"
                            )}
                        </td>
                        </tr>

                        <tr>
                        <th style={{ textAlign: 'center', border: '1px solid #000', background: '#f0f0f0' }}>
                            Publish Date
                        </th>
                        <td style={{ border: '1px solid #000', padding: '6px' }}>
                            {formatDate(form.publishDate || form.reportDate)}
                        </td>
                        </tr>
                    </tbody>
                    </table>


                {/* Signatures & Approvals */}
                <div style={{ marginTop: '30px' }}>
                    <h3 style={{ fontSize: '12pt', fontWeight: 'bold', margin: '0 0 20px 0', paddingBottom: '5px', borderBottom: '1px solid #000' }}>
                        APPROVAL & VERIFICATION
                    </h3>
                    
                    {/* DOSH Officer Section */}
                    <div style={{ marginBottom: '30px' }}>
                        <h4 style={{ fontSize: '11pt', fontWeight: 'bold', margin: '0 0 15px 0', color: '#333' }}>
                            Recommendation / Comment by DOSH Officer (if applicable):
                        </h4>
                        
                        {/* Comments Box */}
                        <div style={{ marginBottom: '20px', padding: '15px', border: '1px solid #ddd', backgroundColor: '#f9f9f9', borderRadius: '4px', minHeight: '80px' }}>
                            <p style={{ fontSize: '10pt', margin: '0', color: '#666', fontStyle: 'italic' }}>
                                Enter DOSH officer comments or recommendations here...
                            </p>
                        </div>
                        
                        {/* DOSH Officer Signature */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '25px' }}>
                            <div>
                                <p style={{ fontSize: '9pt', fontWeight: '600', margin: '0 0 8px 0', color: '#555' }}>Name</p>
                                <div style={{ borderBottom: '1px solid #000', padding: '8px 0 4px 0', minHeight: '20px' }}></div>
                                <p style={{ fontSize: '8pt', margin: '4px 0 0 0', color: '#777' }}>DOSH Officer Name</p>
                            </div>
                            <div>
                                <p style={{ fontSize: '9pt', fontWeight: '600', margin: '0 0 8px 0', color: '#555' }}>Signature</p>
                                <div style={{ borderBottom: '1px solid #000', padding: '8px 0 4px 0', minHeight: '20px' }}></div>
                                <p style={{ fontSize: '8pt', margin: '4px 0 0 0', color: '#777' }}>Officer Signature</p>
                            </div>
                            <div>
                                <p style={{ fontSize: '9pt', fontWeight: '600', margin: '0 0 8px 0', color: '#555' }}>Date</p>
                                <div style={{ borderBottom: '1px solid #000', padding: '8px 0 4px 0', minHeight: '20px' }}></div>
                                <p style={{ fontSize: '8pt', margin: '4px 0 0 0', color: '#777' }}>dd/mm/yyyy</p>
                            </div>
                        </div>
                    </div>

                    {/* Plant Action Section */}
                    <div style={{ marginBottom: '20px', paddingTop: '20px', borderTop: '1px dashed #ccc' }}>
                        <h4 style={{ fontSize: '11pt', fontWeight: 'bold', margin: '0 0 15px 0', color: '#333' }}>
                            Action taken by Plant on recommendation (if applicable):
                        </h4>
                        
                        {/* Action Taken Box */}
                        <div style={{ marginBottom: '20px', padding: '15px', border: '1px solid #ddd', backgroundColor: '#f9f9f9', borderRadius: '4px', minHeight: '80px' }}>
                            <p style={{ fontSize: '10pt', margin: '0', color: '#666', fontStyle: 'italic' }}>
                                Describe actions taken by plant management...
                            </p>
                        </div>
                        
                        {/* Plant Management Signature */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '25px' }}>
                            <div>
                                <p style={{ fontSize: '9pt', fontWeight: '600', margin: '0 0 8px 0', color: '#555' }}>Name</p>
                                <div style={{ borderBottom: '1px solid #000', padding: '8px 0 4px 0', minHeight: '20px' }}></div>
                                <p style={{ fontSize: '8pt', margin: '4px 0 0 0', color: '#777' }}>Plant Manager Name</p>
                            </div>
                            <div>
                                <p style={{ fontSize: '9pt', fontWeight: '600', margin: '0 0 8px 0', color: '#555' }}>Signature</p>
                                <div style={{ borderBottom: '1px solid #000', padding: '8px 0 4px 0', minHeight: '20px' }}></div>
                                <p style={{ fontSize: '8pt', margin: '4px 0 0 0', color: '#777' }}>Manager Signature</p>
                            </div>
                            <div>
                                <p style={{ fontSize: '9pt', fontWeight: '600', margin: '0 0 8px 0', color: '#555' }}>Date</p>
                                <div style={{ borderBottom: '1px solid #000', padding: '8px 0 4px 0', minHeight: '20px' }}></div>
                                <p style={{ fontSize: '8pt', margin: '4px 0 0 0', color: '#777' }}>dd/mm/yyyy</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div style={{ marginTop: '30px', paddingTop: '10px', borderTop: '1px solid #000', fontSize: '8pt' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <div>
                            <p style={{ fontWeight: 'bold', margin: '0' }}>iPETRO Asset Integrity Management</p>
                            <p style={{ margin: '2px 0 0 0' }}>Document No: PV-IR-2025-001</p>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <p style={{ margin: '0' }}>Page 1 of 1</p>
                            <p style={{ margin: '2px 0 0 0' }}>Confidential - For Internal Use Only</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    

    
}