import React, { useEffect } from 'react';
import { Head } from '@inertiajs/react';
import { PhotoReportPrintProps } from '@/types/report';

export default function PhotoReportPrint({ data, reportId, photoReportId, logoUrl }: PhotoReportPrintProps) {
  
  useEffect(() => {
    // Auto-print when component mounts
    const timer = setTimeout(() => {
      window.print();
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div style={styles.page}>
      <Head title={`Photo Report - ${data.reportNumber}`} />
      
      <style>{`
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
        
        /* Screen preview styles */
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
      `}</style>

      {/* Print Controls - Visible only on screen */}
      <div className="no-print print-controls">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <button
            onClick={() => window.print()}
            style={styles.printButton}
          >
            Print Now
          </button>
          <button
            onClick={() => window.close()}
            style={styles.closeButton}
          >
            Close Window
          </button>
          <div style={{ fontSize: '11px', color: '#666', marginTop: '4px' }}>
            Report: {data.reportNumber}
          </div>
        </div>
      </div>

      {/* Report Content - All inline styles for print reliability */}
      <div style={styles.printContent}>
        {/* Logo and Header - Extremely Compact */}
        <div style={styles.logoSection}>
          <div style={styles.logoContainer}>
            {logoUrl ? (
              <img 
                src={logoUrl} 
                alt="iPETRO Logo" 
                style={styles.logo}
              />
            ) : (
              <div style={styles.logoFallback}>
                <span style={styles.logoText}>iPETRO</span>
              </div>
            )}
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

        {/* Header Table - Very Compact */}
        <table style={styles.headerTable}>
          <tbody>
            <tr>
              <td style={styles.headerCell}>Title</td>
              <td colSpan={3} style={styles.titleCell}>
                {data.reportTitle}
              </td>
            </tr>
            <tr>
              <td style={styles.headerCell}>Report Number</td>
              <td style={styles.dataCell}>{data.reportNumber}</td>
              <td style={styles.headerCell}>Inspection Date</td>
              <td style={styles.dataCell}>
                {new Date(data.inspectionDate).toLocaleDateString('en-GB')}
              </td>
            </tr>
            <tr>
              <td style={styles.headerCell}>PMT</td>
              <td style={styles.headerCell}>Tag</td>
              <td style={styles.headerCell}>Description</td>
              <td style={styles.headerCell}>Plant &amp; Unit</td>
            </tr>
            <tr>
              <td style={styles.valueCell}>{data.pmt}</td>
              <td style={styles.valueCell}>{data.tag}</td>
              <td style={styles.valueCell}>{data.description}</td>
              <td style={styles.valueCell}>{data.plantUnit}</td>
            </tr>
          </tbody>
        </table>

        {/* Items Table - Compact with page break control */}
        <table style={styles.itemsTable}>
          <thead>
            <tr>
              <th style={styles.tableHeader}>ITEM</th>
              <th style={styles.tableHeader}>FINDINGS</th>
              <th style={styles.tableHeader}>REQUIREMENTS</th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((item, index) => {
              // Add page break class for every 4th item (adjust based on content)
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
                        <strong>{index + 1}. {item.title}</strong>
                    </div>
                    <div style={{
                        ...styles.imageContainer,
                        border: 'none' // Remove border
                    }}>
                        {item.image ? (
                        <img 
                            src={item.image} 
                            alt={item.title || `Item ${index + 1}`}
                            style={styles.image}
                        />
                        ) : (
                        <div style={{
                            ...styles.noImage,
                            width: '100%',
                            height: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            No Image Available
                        </div>
                        )}
                    </div>
                    </td>

                  {/* FINDINGS */}
                  <td style={styles.textCell}>
                    <div style={styles.textContent}>
                      {item.findings}
                    </div>
                  </td>

                  {/* REQUIREMENTS */}
                  <td style={styles.textCell}>
                    <div style={styles.textContent}>
                      {item.requirements}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Report IDs - Hidden in print */}
        <div className="no-print" style={styles.debugInfo}>
          <p>Main Report ID: {reportId || 'N/A'} | Photo Report ID: {photoReportId || 'N/A'}</p>
          <p style={{ fontSize: '9px' }}>Generated on {new Date().toLocaleString()}</p>
        </div>
      </div>
    </div>
  );
}

// All styles defined as JavaScript objects for maximum control
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
    border: '1px solid #ccc',
    backgroundColor: 'white',
    overflow: 'hidden',
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