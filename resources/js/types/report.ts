export type ItemId = number;

export type ReportStatusUI = "pending" | "in_review" | "completed" | "rejected";

export type PresetGroup = "findings" | "requirements";

export type ReportItem = {
  id: ItemId;
  title: string;
  findings: string;
  requirements: string;
  image: string | null;
};

export type ReportData = {
  reportTitle: string;
  reportNumber: string;
  inspectionDate: string;
  pmt: string;
  tag: string;
  description: string;
  plantUnit: string;
  items: ReportItem[];
};

export interface PhotoReportPrintProps {
  data: ReportData;
  reportId?: number;
  photoReportId?: number;
  logoUrl?: string;
}