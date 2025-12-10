// components/PrintReport.tsx
import { forwardRef } from 'react';
import { FormState } from './PVReport';

interface PrintReportProps {
    form: FormState;
}

const PrintReport = forwardRef<HTMLDivElement, PrintReportProps>(({ form }, ref) => {
    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    return (
        <div ref={ref} className="hidden">
            <div className="bg-white p-8" 
                 style={{
                     width: '210mm',
                     minHeight: '297mm',
                     padding: '25mm',
                     boxSizing: 'border-box',
                     backgroundColor: 'white',
                     fontFamily: "'Times New Roman', Times, serif",
                     color: '#000000'
                 }}>
                
                {/* Your report content here - same as your PreviewSection */}
                {/* Copy the entire content from your PreviewSection component */}
                {/* Make sure to use form prop */}
                
            </div>
        </div>
    );
});

PrintReport.displayName = 'PrintReport';
export default PrintReport;