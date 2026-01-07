import React, { useEffect, useState } from 'react';
import PhotoReportPrintComponent from '@/components/printable/PhotoReportPrint';
import { ReportData } from '@/types/report';
import ipetroLogo from '@/assets/logo.png';

export default function PhotoReportPrintPage() {
  const [printData, setPrintData] = useState<{
    data: ReportData;
    reportId?: number;
    photoReportId?: number;
  } | null>(null);

  useEffect(() => {
    // Try to get data from sessionStorage
    const stored = sessionStorage.getItem('printPhotoReport');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setPrintData(parsed);
      } catch (error) {
        console.error('Failed to parse print data:', error);
      }
    }

    // Clean up on unmount
    return () => {
      sessionStorage.removeItem('printPhotoReport');
    };
  }, []);

  if (!printData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-500 mb-4">Loading print data...</div>
          <button
            onClick={() => window.close()}
            className="px-4 py-2 bg-gray-600 text-white rounded"
          >
            Close Window
          </button>
        </div>
      </div>
    );
  }

  return (
    <PhotoReportPrintComponent
      data={printData.data}
      reportId={printData.reportId}
      photoReportId={printData.photoReportId}
      logoUrl={ipetroLogo}
    />
  );
}