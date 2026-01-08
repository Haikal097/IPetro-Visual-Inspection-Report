import { useEffect } from "react";
import { router } from "@inertiajs/react";
import ipetroLogo from "@/assets/logo.png";

type PrintItem = {
  id: number;
  title?: string;
  findings?: string;
  requirements?: string;
  image?: string | null;
};

type PrintData = {
  reportNo?: string;
  reportDate?: string;
  title?: string;

  equipmentTag?: string;
  equipmentDescription?: string;
  equipmentType?: string;
  plantUnitArea?: string;
  doshRegistration?: string;

  initialFinding?: string;
  externalFinding?: string;
  internalFinding?: string;

  ndt?: string;
  recommendations?: string;

  inspectorName?: string;
  publishDate?: string;

  inspectorSignatureUrl?: string | null;
  reviewerSignatureUrl?: string | null;
  reviewerName?: string | null;

  signatureUrl?: string | null;

  // Photo report header fields (optional)
  photoReport?: {
    report_title?: string;
    report_number?: string;
    inspection_date?: string;
    pmt?: string;
    tag?: string;
    description?: string;
    plant_unit?: string;
  } | null;

  items?: PrintItem[];
};

export default function PVReportPrint({
  data,
  reportId,
}: {
  data: PrintData;
  reportId: number | string;
}) {
  const formatDate = (value?: string) => {
    if (!value) return "________________";
    // accept "2026-01-07", "2026-01-07 08:12:41", or ISO
    const d = new Date(value.replace(" ", "T"));
    if (isNaN(d.getTime())) return value;
    return d.toLocaleDateString("en-GB"); // dd/mm/yyyy
  };

  useEffect(() => {
    const onAfterPrint = () => {
      window.history.back(); // Native browser back navigation
    };
    window.addEventListener("afterprint", onAfterPrint);
    return () => window.removeEventListener("afterprint", onAfterPrint);
  }, []);

  const items = data.items ?? [];

  // Photo Report Print Styles
  const styles = {
    page: {
      margin: 0,
      padding: 0,
      backgroundColor: 'white',
      fontFamily: 'Arial, sans-serif',
      fontSize: '9pt',
      lineHeight: 1.2,
      color: 'black'
    },
    
    printContent: {
      padding: '5mm 8mm',
      maxWidth: '210mm',
      margin: '0 auto',
    },
    
    logoSection: {
      display: 'flex',
      alignItems: 'center',
      marginBottom: '6mm',
      padding: 0,
    },
    
    logoContainer: {
      width: '55px',
      height: '55px',
      marginRight: '8px',
      flexShrink: 0,
    },
    
    logo: {
      width: '100%',
      height: '100%',
      objectFit: 'contain',
    },
    
    logoFallback: {
      width: '100%',
      height: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#f0f0f0',
      border: '1px solid #ddd',
      borderRadius: '2px',
    },
    
    logoText: {
      fontSize: '12px',
      fontWeight: '900',
      color: '#CD202C',
    },
    
    headerText: {
      flex: 1,
    },
    
    departmentTitle: {
      fontSize: '7pt',
      fontWeight: 'bold',
      letterSpacing: '1px',
      color: '#666',
      textTransform: 'uppercase',
      margin: 0,
      padding: 0,
      lineHeight: 1.1,
    },
    
    mainTitle: {
      fontSize: '16pt',
      fontWeight: '900',
      color: '#000',
      margin: '2px 0 0 0',
      padding: 0,
      lineHeight: 1.1,
    },
    
    headerTable: {
      width: '100%',
      borderCollapse: 'collapse',
      border: '1.5px solid #000',
      marginBottom: '6mm',
      fontSize: '8pt',
      pageBreakInside: 'avoid',
    },
    
    headerCell: {
      backgroundColor: '#e5e7eb',
      border: '1px solid #000',
      padding: '3px 4px',
      fontWeight: 'bold',
      textAlign: 'center',
      verticalAlign: 'middle',
      width: '12%',
    },
    
    titleCell: {
      border: '1px solid #000',
      padding: '4px 6px',
      fontWeight: 'bold',
      fontSize: '10pt',
      textTransform: 'uppercase',
    },
    
    dataCell: {
      border: '1px solid #000',
      padding: '3px 4px',
      textAlign: 'center',
      fontFamily: 'monospace',
    },
    
    valueCell: {
      border: '1px solid #000',
      padding: '3px 4px',
      textAlign: 'center',
      textTransform: 'uppercase',
    },
    
    itemsTable: {
      width: '100%',
      borderCollapse: 'collapse',
      border: '1.5px solid #000',
      fontSize: '8pt',
      pageBreakInside: 'auto',
    },
    
    tableHeader: {
      backgroundColor: '#e5e7eb',
      border: '1px solid #000',
      padding: '4px 6px',
      fontWeight: 'bold',
      textAlign: 'center',
      verticalAlign: 'middle',
    },
    
    itemRow: {
      verticalAlign: 'top',
      pageBreakInside: 'avoid',
      breakInside: 'avoid',
    },
    
    itemCell: {
      border: '1px solid #000',
      padding: '5px',
      width: '38%',
      pageBreakInside: 'avoid',
    },
    
    itemTitle: {
      marginBottom: '4px',
      fontSize: '9pt',
    },
    
    imageContainer: {
      width: '100%',
      height: '110px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'white',
      overflow: 'hidden',
      border: 'none'
    },
    
    image: {
      maxWidth: '100%',
      maxHeight: '100%',
      objectFit: 'contain',
    },
    
    noImage: {
      color: '#999',
      fontStyle: 'italic',
      fontSize: '8pt',
      width: '100%',
      height: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    },
    
    textCell: {
      border: '1px solid #000',
      padding: '5px',
      width: '31%',
      pageBreakInside: 'avoid',
    },
    
    textContent: {
      whiteSpace: 'pre-line',
      fontSize: '8pt',
      lineHeight: 1.3,
      minHeight: '110px',
    },
    
    signatureSection: {
      marginTop: '10mm',
      pageBreakBefore: 'avoid',
    },
    
    signatureTable: {
      width: '100%',
      border: 'none',
    },
    
    signatureCell: {
      width: '50%',
      padding: '10px 15px 0 15px',
      verticalAlign: 'top',
    },
    
    signatureBox: {
      textAlign: 'center',
      paddingTop: '10px',
      borderTop: '1px solid #000',
    },
    
    signatureLabel: {
      fontWeight: 'bold',
      fontSize: '9pt',
      marginBottom: '5px',
    },
    
    signatureLine: {
      marginTop: '20px',
      borderTop: '1px solid #000',
      width: '150px',
      display: 'inline-block',
    },
    
    signatureSubtext: {
      fontSize: '7pt',
      marginTop: '2px',
      color: '#666',
    },
    
    printButton: {
      padding: '6px 12px',
      backgroundColor: '#2563eb',
      color: 'white',
      border: 'none',
      borderRadius: '4px',
      fontSize: '12px',
      cursor: 'pointer',
    },
    
    closeButton: {
      padding: '6px 12px',
      backgroundColor: '#6b7280',
      color: 'white',
      border: 'none',
      borderRadius: '4px',
      fontSize: '12px',
      cursor: 'pointer',
    },
    
    debugInfo: {
      marginTop: '15px',
      fontSize: '10px',
      color: '#666',
      textAlign: 'center',
    },
  } as const;

  return (
    <div className="print:bg-white">
      {/* Small top bar (hidden on print) */}
      <div className="print:hidden flex items-center justify-between px-6 py-4 bg-white border-b">
        <div className="font-semibold">Print Preview</div>
        <div className="flex gap-2">
          <button
            onClick={() => window.print()}
            className="px-4 py-2 rounded bg-blue-600 text-white text-sm font-semibold"
          >
            Print
          </button>
          <button
            onClick={() => window.history.back()}
            className="px-4 py-2 rounded bg-gray-200 text-gray-800 text-sm font-semibold"
          >
            Back
          </button>
        </div>
      </div>

      {/* Document Paper Preview */}
      <div
        className="bg-white shadow-lg rounded-none print:shadow-none border border-gray-300 text-black [&_*]:text-black"
        style={{
          maxWidth: "210mm",
          minHeight: "297mm",
          margin: "0 auto",
          padding: "25mm",
          boxSizing: "border-box",
          position: "relative",
          backgroundColor: "white",
          fontFamily: "'Times New Roman', Times, serif",
        }}
      >
        {/* Report Header */}
        <div style={{ marginBottom: "20px", paddingBottom: "15px", borderBottom: "2px solid #000" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div style={{ marginBottom: "10px" }}>
                <div
                  style={{
                    height: "100px",
                    width: "100px",
                    borderRadius: "4px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: "5px",
                    overflow: "hidden",
                  }}
                >
                  <img
                    src={ipetroLogo}
                    alt="iPETRO Logo"
                    style={{ height: "90px", width: "90px", objectFit: "contain" }}
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                      // fallback
                      const parent = e.currentTarget.parentElement;
                      if (parent) parent.innerHTML = `<span style="font-weight:bold;font-size:28px;">iPETRO</span>`;
                    }}
                  />
                </div>
                <p
                  style={{
                    fontSize: "9pt",
                    fontWeight: "bold",
                    margin: "0",
                    textTransform: "uppercase",
                    letterSpacing: "1px",
                  }}
                >
                  Asset Integrity Management Department
                </p>
              </div>

              <h1 style={{ fontSize: "20pt", fontWeight: "bold", margin: "10px 0 5px 0" }}>
                PRESSURE VESSEL INSPECTION REPORT
              </h1>

              <p style={{ fontSize: "14pt", fontWeight: "bold", margin: "0" }}>Major Turnaround 2025</p>
            </div>

            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: "10pt" }}>
                <div style={{ marginBottom: "5px" }}>
                  <span style={{ fontWeight: "bold" }}>Report No:</span>
                  <span style={{ marginLeft: "10px" }}>{data.reportNo || "________________"}</span>
                </div>

                <div style={{ marginBottom: "5px" }}>
                  <span style={{ fontWeight: "bold" }}>Date:</span>
                  <span style={{ marginLeft: "10px" }}>{formatDate(data.reportDate)}</span>
                </div>

                <div>
                  <span style={{ fontWeight: "bold" }}>Revision:</span>
                  <span style={{ marginLeft: "10px" }}>1.0</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 1. EQUIPMENT IDENTIFICATION */}
        <h2 style={{ fontSize: "14pt", fontWeight: "bold", margin: "20px 0 10px 0", textTransform: "uppercase" }}>
          1. EQUIPMENT IDENTIFICATION
        </h2>

        <table style={{ width: "100%", borderCollapse: "collapse", border: "1px solid #000", fontSize: "11pt" }}>
          <tbody>
            <tr>
              <th
                style={{
                  width: "20%",
                  textAlign: "center",
                  border: "1px solid #000",
                  padding: "6px 8px",
                  verticalAlign: "top",
                  backgroundColor: "#f0f0f0",
                  fontWeight: "bold",
                }}
              >
                Equipment Tag No.
              </th>
              <td style={{ width: "30%", border: "1px solid #000", padding: "6px 8px", verticalAlign: "top" }}>
                {data.equipmentTag || "________________"}
              </td>
              <th
                style={{
                  width: "20%",
                  textAlign: "center",
                  border: "1px solid #000",
                  padding: "6px 8px",
                  verticalAlign: "top",
                  backgroundColor: "#f0f0f0",
                  fontWeight: "bold",
                }}
              >
                Plant / Unit / Area
              </th>
              <td style={{ width: "30%", border: "1px solid #000", padding: "6px 8px", verticalAlign: "top" }}>
                {data.plantUnitArea || "________________"}
              </td>
            </tr>
            <tr>
              <th
                style={{
                  textAlign: "center",
                  border: "1px solid #000",
                  padding: "6px 8px",
                  verticalAlign: "top",
                  backgroundColor: "#f0f0f0",
                  fontWeight: "bold",
                }}
              >
                Equipment Description
              </th>
              <td style={{ border: "1px solid #000", padding: "6px 8px", verticalAlign: "top" }}>
                {data.equipmentDescription || "________________"}
              </td>
              <th
                style={{
                  textAlign: "center",
                  border: "1px solid #000",
                  padding: "6px 8px",
                  verticalAlign: "top",
                  backgroundColor: "#f0f0f0",
                  fontWeight: "bold",
                }}
              >
                DOSH Registration No.
              </th>
              <td style={{ border: "1px solid #000", padding: "6px 8px", verticalAlign: "top" }}>
                {data.doshRegistration || "________________"}
              </td>
            </tr>
          </tbody>
        </table>

        {/* 2. INSPECTION FINDINGS */}
        <h2 style={{ fontSize: "14pt", fontWeight: "bold", margin: "20px 0 10px 0", textTransform: "uppercase" }}>
          2. INSPECTION FINDINGS
        </h2>

        <table style={{ width: "100%", borderCollapse: "collapse", border: "1px solid #000", fontSize: "11pt" }}>
          <tbody>
            <tr>
              <th
                style={{
                  width: "25%",
                  textAlign: "center",
                  border: "1px solid #000",
                  padding: "6px 8px",
                  verticalAlign: "top",
                  backgroundColor: "#f0f0f0",
                  fontWeight: "bold",
                }}
              >
                FINDINGS
              </th>
              <td colSpan={3} style={{ lineHeight: "1.3", border: "1px solid #000", padding: "6px 8px" }}>
                <strong>Condition:</strong> With respect to the internal surface, describe and state location of any scales,
                oils or other deposits. Give location and extent of any corrosion and state whether it is active or inactive.
                State location and extent of any erosion, grooving, bulging, warping, cracking or similar condition.
              </td>
            </tr>

            <tr>
              <th style={{ textAlign: "center", border: "1px solid #000", padding: "6px 8px", backgroundColor: "#f0f0f0" }}>
                Initial / Pre-Inspection
              </th>
              <td colSpan={3} style={{ minHeight: "40px", whiteSpace: "pre-wrap", border: "1px solid #000", padding: "6px 8px" }}>
                {data.initialFinding || "No initial observations recorded"}
              </td>
            </tr>

            <tr>
              <th style={{ textAlign: "center", border: "1px solid #000", padding: "6px 8px", backgroundColor: "#f0f0f0" }}>
                Post / Final Inspection – External
              </th>
              <td colSpan={3} style={{ minHeight: "60px", whiteSpace: "pre-wrap", border: "1px solid #000", padding: "6px 8px" }}>
                {data.externalFinding || "No external findings recorded"}
              </td>
            </tr>

            <tr>
              <th style={{ textAlign: "center", border: "1px solid #000", padding: "6px 8px", backgroundColor: "#f0f0f0" }}>
                Post / Final Inspection – Internal
              </th>
              <td colSpan={3} style={{ minHeight: "60px", whiteSpace: "pre-wrap", border: "1px solid #000", padding: "6px 8px" }}>
                {data.internalFinding || "No internal findings recorded"}
              </td>
            </tr>
          </tbody>
        </table>

        {/* 3. NDT */}
        <h2 style={{ fontSize: "14pt", fontWeight: "bold", margin: "20px 0 10px 0", textTransform: "uppercase" }}>
          3. NON-DESTRUCTIVE TESTINGS
        </h2>

        <table style={{ width: "100%", borderCollapse: "collapse", border: "1px solid #000", fontSize: "11pt" }}>
          <tbody>
            <tr>
              <th style={{ width: "25%", textAlign: "center", border: "1px solid #000", padding: "6px 8px", backgroundColor: "#f0f0f0" }}>
                NDT Methods & Results
              </th>
              <td style={{ minHeight: "40px", whiteSpace: "pre-wrap", border: "1px solid #000", padding: "6px 8px" }}>
                {data.ndt || "No NDT results recorded"}
              </td>
            </tr>
          </tbody>
        </table>

        {/* 4. RECOMMENDATIONS */}
        <h2 style={{ fontSize: "14pt", fontWeight: "bold", margin: "20px 0 10px 0", textTransform: "uppercase" }}>
          4. RECOMMENDATIONS
        </h2>

        <table style={{ width: "100%", borderCollapse: "collapse", border: "1px solid #000", fontSize: "11pt" }}>
          <tbody>
            <tr>
              <th style={{ width: "25%", textAlign: "center", border: "1px solid #000", padding: "6px 8px", backgroundColor: "#f0f0f0" }}>
                Recommended Actions
              </th>
              <td style={{ minHeight: "40px", whiteSpace: "pre-wrap", border: "1px solid #000", padding: "6px 8px" }}>
                {data.recommendations || "No recommendations provided"}
              </td>
            </tr>
          </tbody>
        </table>

        {/* 5. INSPECTOR VERIFICATION */}
        <h2 style={{ fontSize: "14pt", fontWeight: "bold", margin: "20px 0 10px 0", textTransform: "uppercase" }}>
          5. INSPECTOR VERIFICATION
        </h2>

        <table style={{ width: "100%", borderCollapse: "collapse", border: "1px solid #000", fontSize: "11pt" }}>
          <tbody>
            <tr>
              <th style={{ width: "25%", textAlign: "center", border: "1px solid #000", background: "#f0f0f0" }}>
                Inspector Name
              </th>
              <td style={{ border: "1px solid #000", padding: "6px" }}>{data.inspectorName || "________________"}</td>
            </tr>

            <tr>
              <th style={{ textAlign: "center", border: "1px solid #000", background: "#f0f0f0" }}>
                Inspector Signature
              </th>
              <td style={{ border: "1px solid #000", padding: "6px", height: "50px" }}>
                {data.inspectorSignatureUrl ? (
                  <img src={data.inspectorSignatureUrl} style={{ height: "40px", objectFit: "contain" }} alt="Inspector Signature" />
                ) : (
                  "______________________"
                )}
              </td>
            </tr>

            <tr>
              <th style={{ textAlign: "center", border: "1px solid #000", background: "#f0f0f0" }}>
                Publish Date
              </th>
              <td style={{ border: "1px solid #000", padding: "6px" }}>{formatDate(data.publishDate || data.reportDate)}</td>
            </tr>
          </tbody>
        </table>
        {/* Page break before Signatures & Approvals section */}
        <div style={{ 
          pageBreakBefore: 'always',
          marginTop: '30px'
        }}>
        
        {/* Signatures & Approvals (your exact block) */}
        <div style={{ marginTop: "30px" }}>
          <h3 style={{ fontSize: "12pt", fontWeight: "bold", margin: "0 0 20px 0", paddingBottom: "5px", borderBottom: "1px solid #000" }}>
            APPROVAL & VERIFICATION
          </h3>

          <div style={{ marginBottom: "30px" }}>
            <h4 style={{ fontSize: "11pt", fontWeight: "bold", margin: "0 0 15px 0", color: "#333" }}>
              Recommendation / Comment by DOSH Officer (if applicable):
            </h4>

            <div style={{ marginBottom: "20px", padding: "15px", border: "1px solid #ddd", backgroundColor: "#f9f9f9", borderRadius: "4px", minHeight: "80px" }} />

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "25px" }}>
                <div>
                  <p style={{ fontSize: "9pt", fontWeight: "600", margin: "0 0 8px 0", color: "#555" }}>Name</p>
                  <div style={{ borderBottom: "1px solid #000", padding: "8px 0 4px 0", minHeight: "20px" }}>
                    {data.reviewerName || ""}
                  </div>
                  <p style={{ fontSize: "8pt", margin: "4px 0 0 0", color: "#777" }}>Reviewer Name</p>
                </div>
                <div>
                  <p style={{ fontSize: "9pt", fontWeight: "600", margin: "0 0 8px 0", color: "#555" }}>Signature</p>
                  <div style={{ borderBottom: "1px solid #000", padding: "8px 0 4px 0", minHeight: "20px" }}>
                    {data.reviewerSignatureUrl ? (
                      <img src={data.reviewerSignatureUrl} style={{ height: "30px", objectFit: "contain" }} alt="Reviewer Signature" />
                    ) : null}
                  </div>
                  <p style={{ fontSize: "8pt", margin: "4px 0 0 0", color: "#777" }}>Reviewer Signature</p>
                </div>
                <div>
                  <p style={{ fontSize: "9pt", fontWeight: "600", margin: "0 0 8px 0", color: "#555" }}>Date</p>
                  <div style={{ borderBottom: "1px solid #000", padding: "8px 0 4px 0", minHeight: "20px" }}>
                    {/* ✅ AUTO-FILL TODAY'S DATE */}
                    {(() => {
                      const today = new Date();
                      const day = String(today.getDate()).padStart(2, '0');
                      const month = String(today.getMonth() + 1).padStart(2, '0');
                      const year = today.getFullYear();
                      return `${day}/${month}/${year}`;
                    })()}
                  </div>
                  <p style={{ fontSize: "8pt", margin: "4px 0 0 0", color: "#777" }}>dd/mm/yyyy</p>
                </div>
              </div>
          </div>
          {/* (MOVED OUT - NOT APPLICABLE FOR PV REPORT)??
          <div style={{ marginBottom: "20px", paddingTop: "20px", borderTop: "1px dashed #ccc" }}>
            <h4 style={{ fontSize: "11pt", fontWeight: "bold", margin: "0 0 15px 0", color: "#333" }}>
              Action taken by Plant on recommendation (if applicable):
            </h4>

            <div style={{ marginBottom: "20px", padding: "15px", border: "1px solid #ddd", backgroundColor: "#f9f9f9", borderRadius: "4px", minHeight: "80px" }} />

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "25px" }}>
                <div>
                  <p style={{ fontSize: "9pt", fontWeight: "600", margin: "0 0 8px 0", color: "#555" }}>Name</p>
                  <div style={{ borderBottom: "1px solid #000", padding: "8px 0 4px 0", minHeight: "20px" }}>
                    {data.reviewerName || ""}
                  </div>
                  <p style={{ fontSize: "8pt", margin: "4px 0 0 0", color: "#777" }}>Reviewer Name</p>
                </div>
                <div>
                  <p style={{ fontSize: "9pt", fontWeight: "600", margin: "0 0 8px 0", color: "#555" }}>Signature</p>
                  <div style={{ borderBottom: "1px solid #000", padding: "8px 0 4px 0", minHeight: "20px" }}>
                    {data.reviewerSignatureUrl ? (
                      <img src={data.reviewerSignatureUrl} style={{ height: "30px", objectFit: "contain" }} alt="Reviewer Signature" />
                    ) : null}
                  </div>
                  <p style={{ fontSize: "8pt", margin: "4px 0 0 0", color: "#777" }}>Reviewer Signature</p>
                </div>
                <div>
                  <p style={{ fontSize: "9pt", fontWeight: "600", margin: "0 0 8px 0", color: "#555" }}>Date</p>
                  <div style={{ borderBottom: "1px solid #000", padding: "8px 0 4px 0", minHeight: "20px" }} />
                  <p style={{ fontSize: "8pt", margin: "4px 0 0 0", color: "#777" }}>dd/mm/yyyy</p>
                </div>
              </div>
          </div>*/}
        </div>
        </div> {/* End of page break wrapper */}


        {/* 6. PHOTO REPORT ITEMS - UPDATED TO MATCH PhotoReportPrint STYLE */}
        {items.length > 0 && (
          <>
            {/* Page break before photo items section */}
            <div style={{ pageBreakBefore: 'always', marginTop: '30px' }}></div>
            
            {/* Photo Report Header Section */}
            <div style={styles.logoSection}>
              <div style={styles.logoContainer}>
                <img 
                  src={ipetroLogo} 
                  alt="iPETRO Logo" 
                  style={styles.logo}
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                    const parent = e.currentTarget.parentElement;
                    if (parent) parent.innerHTML = `<span style="font-size:12px;font-weight:900;color:#CD202C;">iPETRO</span>`;
                  }}
                />
              </div>
              <div style={styles.headerText}>
                <div style={styles.departmentTitle}>
                  Asset Integrity Management Department
                </div>
                <div style={styles.mainTitle}>
                  Photo Inspection Report
                </div>
              </div>
            </div>

            {/* Photo Report Header Table */}
            <table style={styles.headerTable}>
              <tbody>
                <tr>
                  <td style={styles.headerCell}>Title</td>
                  <td colSpan={3} style={styles.titleCell}>
                    {data.photoReport?.report_title || data.title || "Photo Inspection Report"}
                  </td>
                </tr>
                <tr>
                  <td style={styles.headerCell}>Report Number</td>
                  <td style={styles.dataCell}>{data.photoReport?.report_number || data.reportNo || "N/A"}</td>
                  <td style={styles.headerCell}>Inspection Date</td>
                  <td style={styles.dataCell}>
                    {data.photoReport?.inspection_date ? 
                      formatDate(data.photoReport.inspection_date) : 
                      formatDate(data.reportDate)}
                  </td>
                </tr>
                <tr>
                  <td style={styles.headerCell}>PMT</td>
                  <td style={styles.headerCell}>Tag</td>
                  <td style={styles.headerCell}>Description</td>
                  <td style={styles.headerCell}>Plant &amp; Unit</td>
                </tr>
                <tr>
                  <td style={styles.valueCell}>{data.photoReport?.pmt || "N/A"}</td>
                  <td style={styles.valueCell}>{data.photoReport?.tag || "N/A"}</td>
                  <td style={styles.valueCell}>{data.photoReport?.description || "N/A"}</td>
                  <td style={styles.valueCell}>{data.photoReport?.plant_unit || data.plantUnitArea || "N/A"}</td>
                </tr>
              </tbody>
            </table>

            {/* Photo Items Table - Updated to match PhotoReportPrint style */}
            <h2 style={{ fontSize: "14pt", fontWeight: "bold", margin: "20px 0 10px 0", textTransform: "uppercase" }}>
              Photo Report Items ({items.length})
            </h2>
            
            <table style={styles.itemsTable}>
              <thead>
                <tr>
                  <th style={styles.tableHeader}>ITEM</th>
                  <th style={styles.tableHeader}>FINDINGS</th>
                  <th style={styles.tableHeader}>REQUIREMENTS</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, index) => {
                  // Add page break for every 4th item
                  const shouldForceNewPage = index > 0 && index % 4 === 0;
                  
                  return (
                    <tr 
                      key={item.id} 
                      style={{
                        ...styles.itemRow,
                        ...(shouldForceNewPage ? { pageBreakBefore: 'always' } : {})
                      }}
                    >
                      {/* ITEM */}
                      <td style={styles.itemCell}>
                        <div style={styles.itemTitle}>
                          <strong>{index + 1}. {item.title || `Item ${index + 1}`}</strong>
                        </div>
                        <div style={styles.imageContainer}>
                          {item.image ? (
                            <img 
                              src={item.image} 
                              alt={item.title || `Item ${index + 1}`}
                              style={styles.image}
                            />
                          ) : (
                            <div style={styles.noImage}>
                              No Image Available
                            </div>
                          )}
                        </div>
                      </td>

                      {/* FINDINGS */}
                      <td style={styles.textCell}>
                        <div style={styles.textContent}>
                          {item.findings || "No findings recorded"}
                        </div>
                      </td>

                      {/* REQUIREMENTS */}
                      <td style={styles.textCell}>
                        <div style={styles.textContent}>
                          {item.requirements || "No requirements specified"}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </>
        )}

        {/* Original Signatures & Approvals Section (for main report) */}
        {items.length === 0 && (
          <div style={{ marginTop: "30px" }}>
            <h3 style={{ fontSize: "12pt", fontWeight: "bold", margin: "0 0 20px 0", paddingBottom: "5px", borderBottom: "1px solid #000" }}>
              APPROVAL & VERIFICATION
            </h3>

            <div style={{ marginBottom: "30px" }}>
              <h4 style={{ fontSize: "11pt", fontWeight: "bold", margin: "0 0 15px 0", color: "#333" }}>
                Recommendation / Comment by DOSH Officer (if applicable):
              </h4>

              <div style={{ marginBottom: "20px", padding: "15px", border: "1px solid #ddd", backgroundColor: "#f9f9f9", borderRadius: "4px", minHeight: "80px" }} />

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "25px" }}>
                <div>
                  <p style={{ fontSize: "9pt", fontWeight: "600", margin: "0 0 8px 0", color: "#555" }}>Name</p>
                  <div style={{ borderBottom: "1px solid #000", padding: "8px 0 4px 0", minHeight: "20px" }}>
                    {data.reviewerName || ""}
                  </div>
                  <p style={{ fontSize: "8pt", margin: "4px 0 0 0", color: "#777" }}>Reviewer Name</p>
                </div>
                <div>
                  <p style={{ fontSize: "9pt", fontWeight: "600", margin: "0 0 8px 0", color: "#555" }}>Signature</p>
                  <div style={{ borderBottom: "1px solid #000", padding: "8px 0 4px 0", minHeight: "20px" }}>
                    {data.reviewerSignatureUrl ? (
                      <img src={data.reviewerSignatureUrl} style={{ height: "30px", objectFit: "contain" }} alt="Reviewer Signature" />
                    ) : null}
                  </div>
                  <p style={{ fontSize: "8pt", margin: "4px 0 0 0", color: "#777" }}>Reviewer Signature</p>
                </div>
                <div>
                  <p style={{ fontSize: "9pt", fontWeight: "600", margin: "0 0 8px 0", color: "#555" }}>Date</p>
                  <div style={{ borderBottom: "1px solid #000", padding: "8px 0 4px 0", minHeight: "20px" }}>
                    {/* ✅ AUTO-FILL TODAY'S DATE */}
                    {(() => {
                      const today = new Date();
                      const day = String(today.getDate()).padStart(2, '0');
                      const month = String(today.getMonth() + 1).padStart(2, '0');
                      const year = today.getFullYear();
                      return `${day}/${month}/${year}`;
                    })()}
                  </div>
                  <p style={{ fontSize: "8pt", margin: "4px 0 0 0", color: "#777" }}>dd/mm/yyyy</p>
                </div>
              </div>
            </div>

            <div style={{ marginBottom: "20px", paddingTop: "20px", borderTop: "1px dashed #ccc" }}>
              <h4 style={{ fontSize: "11pt", fontWeight: "bold", margin: "0 0 15px 0", color: "#333" }}>
                Action taken by Plant on recommendation (if applicable):
              </h4>

              <div style={{ marginBottom: "20px", padding: "15px", border: "1px solid #ddd", backgroundColor: "#f9f9f9", borderRadius: "4px", minHeight: "80px" }} />

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "25px" }}>
                <div>
                  <p style={{ fontSize: "9pt", fontWeight: "600", margin: "0 0 8px 0", color: "#555" }}>Name</p>
                  <div style={{ borderBottom: "1px solid #000", padding: "8px 0 4px 0", minHeight: "20px" }}>
                    {data.reviewerName || ""}
                  </div>
                  <p style={{ fontSize: "8pt", margin: "4px 0 0 0", color: "#777" }}>Reviewer Name</p>
                </div>
                <div>
                  <p style={{ fontSize: "9pt", fontWeight: "600", margin: "0 0 8px 0", color: "#555" }}>Signature</p>
                  <div style={{ borderBottom: "1px solid #000", padding: "8px 0 4px 0", minHeight: "20px" }}>
                    {data.reviewerSignatureUrl ? (
                      <img src={data.reviewerSignatureUrl} style={{ height: "30px", objectFit: "contain" }} alt="Reviewer Signature" />
                    ) : null}
                  </div>
                  <p style={{ fontSize: "8pt", margin: "4px 0 0 0", color: "#777" }}>Reviewer Signature</p>
                </div>
                  <div>
                    <p style={{ fontSize: "9pt", fontWeight: "600", margin: "0 0 8px 0", color: "#555" }}>Date</p>
                    <div style={{ borderBottom: "1px solid #000", padding: "8px 0 4px 0", minHeight: "20px" }}>
                      {/* ✅ AUTO-FILL TODAY'S DATE */}
                      {(() => {
                        const today = new Date();
                        const day = String(today.getDate()).padStart(2, '0');
                        const month = String(today.getMonth() + 1).padStart(2, '0');
                        const year = today.getFullYear();
                        return `${day}/${month}/${year}`;
                      })()}
                    </div>
                    <p style={{ fontSize: "8pt", margin: "4px 0 0 0", color: "#777" }}>dd/mm/yyyy</p>
                  </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Print CSS */}
      <style>
        {`
          @media print {
            @page {
              size: A4 portrait;
              margin: 8mm 12mm !important;
            }
            
            body {
              margin: 0 !important;
              padding: 0 !important;
              font-family: Arial, sans-serif !important;
              font-size: 9pt !important;
              line-height: 1.2 !important;
              color: black !important;
              background: white !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            
            * {
              box-sizing: border-box !important;
            }
            
            .no-print {
              display: none !important;
            }
            
            /* CRITICAL: Prevent page breaks inside table rows */
            table tbody tr {
              page-break-inside: avoid !important;
              break-inside: avoid !important;
              -webkit-region-break-inside: avoid !important;
            }
            
            /* CRITICAL: Prevent page breaks inside table cells */
            table td {
              page-break-inside: avoid !important;
              -webkit-region-break-inside: avoid !important;
            }
            
            /* Keep images with their text */
            .image-container {
              page-break-inside: avoid !important;
              -webkit-region-break-inside: avoid !important;
            }
            
            /* Force new page if item doesn't fit */
            .force-new-page {
              page-break-before: always !important;
            }
            
            /* Keep signature section together */
            .signature-section {
              page-break-inside: avoid !important;
              page-break-before: avoid !important;
            }
          }
          
          @media screen {
            body {
              background: #f0f0f0;
              padding: 20px;
            }
            
            .screen-preview {
              background: white;
              width: 210mm;
              min-height: 297mm;
              margin: 0 auto;
              box-shadow: 0 0 20px rgba(0,0,0,0.1);
              padding: 8mm 12mm;
            }
            
            .print-controls {
              position: fixed;
              top: 20px;
              right: 20px;
              background: white;
              padding: 12px;
              border-radius: 6px;
              box-shadow: 0 2px 10px rgba(0,0,0,0.1);
              z-index: 1000;
            }
          }
        `}
      </style>
    </div>
  );
}