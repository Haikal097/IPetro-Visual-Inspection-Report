import { useMemo, useState } from "react";
import axios from "axios";
import { Sparkles, Copy, AlertTriangle, CheckCircle2 } from "lucide-react";

type Props = {
  report: any;
};

type Result =
  | {
      ok: true;
      mode: "json";
      confidence?: "low" | "medium" | "high";
      confidenceScore?: number;
      review_id?: number;

      suggestedAction?: "approve" | "revision_requested" | "reject";
      topIssues?: string[];
      suggestedComments?: { title: string; text: string }[];
      notes?: any;
      flags?: any;

      // ✅ backend returns these
      reportSummary?: string;
      problemSummary?: string;

      // ✅ backend returns these (new prompt output)
      defectsByItem?: {
        id: number;
        title: string;
        defectKeywords: string[];
        shortFinding: string;
        requirementCheck: "OK" | "Missing" | "Inconsistent";
      }[];

      focusAreas?: string[];
    }
  | {
      ok: true;
      mode: "fallback_text";
      analysis_text?: string;
      review_id?: number;
      flags?: any;
    }
  | {
      ok: false;
      error: string;
      details?: any;
      review_id?: number;
      flags?: any;
    };

export default function ReportReviewAssistantPanel({ report }: Props) {
  const [loading, setLoading] = useState(false);
  const [res, setRes] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [savedReviewId, setSavedReviewId] = useState<number | null>(null);

  const safeReport = useMemo(() => {
    const itemsRaw =
      report?.photo_report_items ??
      report?.photo_items ??
      report?.report_data?.items ??
      report?.json_data?.items ??
      [];

    const photo_items = Array.isArray(itemsRaw)
      ? itemsRaw.map((it: any) => ({
          id: it?.id ?? null,
          title: it?.title ?? it?.item_title ?? it?.name ?? "Item",
          findings: it?.findings ?? it?.finding ?? "",
          requirements: it?.requirements ?? it?.requirement ?? "",
        }))
      : [];

    // ✅ ADD ONLY: extract PMT & Inspection Date from places where your UI might be reading them
    const pmt =
      report?.pmt ??
      report?.PMT ??
      report?.photo_report?.pmt ??
      report?.photo_report?.PMT ??
      report?.photoReport?.pmt ??
      report?.photoReport?.PMT ??
      report?.photo_reports?.[0]?.pmt ??
      report?.photo_reports?.[0]?.PMT ??
      report?.photoReports?.[0]?.pmt ??
      report?.photoReports?.[0]?.PMT ??
      report?.report_data?.pmt ??
      report?.json_data?.pmt ??
      report?.report_data?.PMT ??
      report?.json_data?.PMT ??
      null;

    const inspectionDate =
      report?.inspectionDate ??
      report?.inspection_date ??
      report?.inspection_at ??
      report?.photo_report?.inspectionDate ??
      report?.photo_report?.inspection_date ??
      report?.photoReport?.inspectionDate ??
      report?.photoReport?.inspection_date ??
      report?.photo_reports?.[0]?.inspectionDate ??
      report?.photo_reports?.[0]?.inspection_date ??
      report?.photoReports?.[0]?.inspectionDate ??
      report?.photoReports?.[0]?.inspection_date ??
      report?.report_data?.inspectionDate ??
      report?.json_data?.inspectionDate ??
      report?.report_data?.inspection_date ??
      report?.json_data?.inspection_date ??
      null;

    // ✅ ADD ONLY: ensure json_data includes these keys (so backend checks will find them)
    const baseJson = report?.report_data ?? report?.json_data ?? {};
    const json_data =
      baseJson && typeof baseJson === "object" && !Array.isArray(baseJson)
        ? {
            ...baseJson,
            ...(pmt != null && baseJson?.pmt == null && baseJson?.PMT == null
              ? { pmt }
              : {}),
            ...(inspectionDate != null &&
            baseJson?.inspectionDate == null &&
            baseJson?.inspection_date == null
              ? { inspectionDate }
              : {}),
          }
        : baseJson;

    return {
      id: report?.id ?? report?.report_id,
      title: report?.title,
      status: report?.status,
      creation_date: report?.creation_date,
      submission_date: report?.submission_date,
      signed_at: report?.signed_at,

      // ✅ IMPORTANT:
      // Only PV report sections live here. We are NOT sending photos/items.
      json_data,

      // ✅ add this
      photo_items,

      // ✅ ADD ONLY: also send these at root (backend metaGet checks report root too)
      pmt,
      inspectionDate,
    };
  }, [report]);

  // ✅ ADD ONLY: helper to normalize suggestedComments from either shape
  const normalizeSuggestedComments = (r: any): { title: string; text: string }[] => {
    // backend new shape: suggestedComments: [{title,text}]
    if (Array.isArray(r?.suggestedComments)) {
      return r.suggestedComments
        .filter((x: any) => x && typeof x === "object")
        .map((x: any) => ({
          title: String(x.title ?? "Comment"),
          text: String(x.text ?? ""),
        }))
        .filter((x: any) => x.text.trim() !== "");
    }

    // older shape: suggestedReviewerComment: "..."
    if (r?.suggestedReviewerComment) {
      return [
        {
          title: "Suggested reviewer comment",
          text: String(r.suggestedReviewerComment),
        },
      ];
    }

    return [];
  };

  const normalize = (data: any): Result => {
    // backend (current): { ok:true, review:{...}, review_id: 123 }
    if (data?.ok === true && data?.review && typeof data.review === "object") {
      const r = data.review;

      return {
        ok: true,
        mode: "json",
        confidence: r.confidence,
        confidenceScore:
          typeof r.confidenceScore === "number" ? r.confidenceScore : undefined,
        review_id: typeof data.review_id === "number" ? data.review_id : undefined,
        suggestedAction: r.suggestedAction,
        topIssues: Array.isArray(r.topIssues) ? r.topIssues : [],

        // ✅ ADD ONLY: support both suggestedComments (new) and suggestedReviewerComment (old)
        suggestedComments: normalizeSuggestedComments(r),

        // ✅ keep compatibility: prefer deterministic flags returned separately, else use review.flags
        flags: data?.flags ?? r?.flags ?? r,

        // ✅ summaries
        reportSummary: r.reportSummary,
        problemSummary: r.problemSummary,

        // ✅ ADD ONLY: map new fields from backend review
        defectsByItem: Array.isArray(r.defectsByItem) ? r.defectsByItem : [],
        focusAreas: Array.isArray(r.focusAreas) ? r.focusAreas : [],

        notes: r,
      };
    }

    // frontend shape (older/alternate): { ok:true, mode:"json", ... }
    if (data?.ok === true && data?.mode === "json") {
      return {
        ...(data as Result),
        review_id:
          typeof data?.review_id === "number"
            ? data.review_id
            : (data as any).review_id,
      };
    }

    // error shape
    if (data?.ok === false) {
      return {
        ok: false,
        error: data?.error ?? "Request failed",
        details: data?.details,
        review_id: typeof data?.review_id === "number" ? data.review_id : undefined,
        flags: data?.flags,
      };
    }

    // fallback display
    return {
      ok: true,
      mode: "fallback_text",
      analysis_text:
        typeof data === "string" ? data : JSON.stringify(data, null, 2),
      review_id: typeof data?.review_id === "number" ? data.review_id : undefined,
      flags: data?.flags,
    };
  };

  const run = async () => {
    try {
      setLoading(true);
      setError(null);
      setRes(null);
      setSavedReviewId(null);

      const { data } = await axios.post("/api/ai/report-review-assistant", {
        report: safeReport,
      });

      const normalized = normalize(data);
      setRes(normalized);

      const rid =
        (normalized as any)?.review_id ?? (data as any)?.review_id ?? null;
      if (typeof rid === "number") setSavedReviewId(rid);
    } catch (e: any) {
      const msg =
        e?.response?.data?.error ||
        e?.response?.data?.message ||
        e?.message ||
        "Request failed";
      setError(msg);

      const normalized = normalize(e?.response?.data ?? { ok: false, error: msg });
      setRes(normalized);

      const rid = (normalized as any)?.review_id ?? null;
      if (typeof rid === "number") setSavedReviewId(rid);
    } finally {
      setLoading(false);
    }
  };

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // ignore
    }
  };

  const confidenceBadge = (c?: string) => {
    if (c === "high")
      return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200";
    if (c === "low")
      return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200";
    return "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200";
  };

  const actionBadge = (a?: string) => {
    if (a === "approve") return "bg-emerald-600 text-white";
    if (a === "reject") return "bg-red-600 text-white";
    return "bg-amber-600 text-white";
  };

  const calculateConfidenceScore = (flags: any): number => {
    if (!flags) return 70;

    const missingSections = flags.missingSections?.length ?? 0;
    const emptySections = flags.emptySections?.length ?? 0;
    const tooShortSections = flags.tooShortSections?.length ?? 0;
    const missingMeta = flags.missingMeta?.length ?? 0;
    const consistencyIssues = flags.consistencyIssues?.length ?? 0;
    const riskFlags = flags.riskFlags?.length ?? 0;

    let severity = Number(flags.severityScore ?? 0);
    if (!Number.isFinite(severity)) severity = 0;
    if (severity > 10) severity = Math.round(severity / 10);
    severity = Math.max(0, Math.min(10, severity));

    let score = 100;
    score -= missingSections * 12;
    score -= emptySections * 8;
    score -= tooShortSections * 5;
    score -= missingMeta * 10;
    score -= consistencyIssues * 6;
    score -= riskFlags * 15;
    score -= severity * 4;

    return Math.max(0, Math.min(100, Math.round(score)));
  };

  const labelFromScore = (s: number): "low" | "medium" | "high" => {
    if (s >= 80) return "high";
    if (s >= 50) return "medium";
    return "low";
  };

  const normalizeScoreToPercent = (n: any): number | null => {
    if (n == null) return null;
    let v = Number(n);
    if (!Number.isFinite(v)) return null;
    if (v > 0 && v <= 1) v = v * 100;
    v = Math.round(v);
    return Math.max(0, Math.min(100, v));
  };

  const uiConfidenceScore = useMemo(() => {
    if (!res || res.ok !== true || res.mode !== "json") return null;
    const backend = normalizeScoreToPercent((res as any).confidenceScore);
    if (backend != null) return backend;
    return calculateConfidenceScore((res as any).flags);
  }, [res]);

  const finalConfidenceLabel =
    uiConfidenceScore != null
      ? labelFromScore(uiConfidenceScore)
      : ((res as any)?.confidence ?? "medium");

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-indigo-700 dark:text-indigo-300" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                AI Review Assistant
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Completeness + consistency checks + suggested reviewer comments (you decide)
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={run}
          disabled={loading}
          className="rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
        >
          {loading ? "Analyzing..." : "Run"}
        </button>
      </div>

      {savedReviewId != null && (
        <div className="mt-3 text-xs text-emerald-700 dark:text-emerald-300">
          Saved to history (ID: {savedReviewId})
        </div>
      )}

      {error && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-200">
          {error}
        </div>
      )}

      {res && (res as any).ok === true && (res as any).mode === "json" && (
        <div className="mt-4 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${confidenceBadge(
                finalConfidenceLabel
              )}`}
            >
              Confidence: {finalConfidenceLabel}
              {uiConfidenceScore != null && (
                <span className="ml-1 opacity-80">({uiConfidenceScore}%)</span>
              )}
            </span>

            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${actionBadge(
                (res as any).suggestedAction
              )}`}
            >
              Suggested: {(res as any).suggestedAction ?? "revision_requested"}
            </span>
          </div>

          {(res as any).reportSummary && (
            <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-3">
              <div className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                Report summary
              </div>
              <div className="text-sm text-gray-700 dark:text-gray-200">
                {(res as any).reportSummary}
              </div>
            </div>
          )}

          {(res as any).problemSummary && (
            <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-3">
              <div className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                Problem summary
              </div>
              <div className="text-sm text-gray-700 dark:text-gray-200">
                {(res as any).problemSummary}
              </div>
            </div>
          )}

          {Array.isArray((res as any).defectsByItem) &&
            (res as any).defectsByItem.length > 0 && (
              <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-3">
                <div className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                  Defects found (from Photo Items text)
                </div>

                <div className="space-y-2">
                  {(res as any).defectsByItem.map((it: any, idx: number) => (
                    <div
                      key={idx}
                      className="rounded-md border border-gray-200 dark:border-gray-800 p-2"
                    >
                      <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                        {it.title}{" "}
                        <span className="opacity-70">(ID: {it.id})</span>
                      </div>

                      <div className="text-sm text-gray-700 dark:text-gray-200 mt-1">
                        {it.shortFinding}
                      </div>

                      <div className="mt-1 text-xs text-gray-600 dark:text-gray-300">
                        Keywords: {(it.defectKeywords || []).join(", ") || "—"}{" "}
                        | Requirement:{" "}
                        <span className="font-semibold">
                          {it.requirementCheck}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          {Array.isArray((res as any).focusAreas) &&
            (res as any).focusAreas.length > 0 && (
              <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-3">
                <div className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                  Reviewer focus areas
                </div>
                <ul className="list-disc pl-5 text-sm text-gray-700 dark:text-gray-200">
                  {(res as any).focusAreas.map((x: string, i: number) => (
                    <li key={i}>{x}</li>
                  ))}
                </ul>
              </div>
            )}

          <div className="max-h-[360px] overflow-y-auto space-y-4 pr-1">
            <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 p-3">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <div className="text-sm font-semibold text-gray-900 dark:text-white">
                  Top issues to fix
                </div>
              </div>

              <ul className="list-disc space-y-1 pl-5 text-sm text-gray-700 dark:text-gray-200">
                {((res as any).topIssues ?? []).map((x: string, i: number) => (
                  <li key={i}>{x}</li>
                ))}
              </ul>
            </div>

            <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-3">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <div className="text-sm font-semibold text-gray-900 dark:text-white">
                  Suggested reviewer comments
                </div>
              </div>

              <div className="space-y-2">
                {((res as any).suggestedComments ?? []).map((c: any, i: number) => (
                  <div
                    key={i}
                    className="rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 p-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="text-sm font-semibold text-gray-900 dark:text-white">
                        {c.title}
                      </div>

                      <button
                        onClick={() => copy(c.text)}
                        className="inline-flex items-center gap-1 rounded-md border border-gray-300 dark:border-gray-700 px-2 py-1 text-xs font-semibold text-gray-700 dark:text-gray-200 hover:bg-white dark:hover:bg-gray-900"
                        title="Copy"
                      >
                        <Copy className="h-3.5 w-3.5" />
                        Copy
                      </button>
                    </div>

                    <div className="mt-2 text-sm text-gray-700 dark:text-gray-200 whitespace-pre-wrap">
                      {c.text}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-3">
              <div className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                System flags (deterministic)
              </div>
              <Flags flags={(res as any).flags} />
            </div>
          </div>
        </div>
      )}

      {res && (res as any).ok === true && (res as any).mode === "fallback_text" && (
        <div className="mt-4 rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 p-3">
          <div className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
            AI Output
          </div>
          <pre className="text-sm whitespace-pre-wrap text-gray-700 dark:text-gray-200">
            {(res as any).analysis_text}
          </pre>
        </div>
      )}
    </div>
  );
}

function Flags({ flags }: { flags: any }) {
  if (!flags)
    return (
      <div className="text-sm text-gray-500 dark:text-gray-400">No flags.</div>
    );

  const renderList = (arr: any[]) => {
    if (!Array.isArray(arr) || arr.length === 0) {
      return <div className="text-sm text-gray-500 dark:text-gray-400">None</div>;
    }
    return (
      <ul className="list-disc pl-5 text-sm text-gray-700 dark:text-gray-200">
        {arr.map((x, i) => (
          <li key={i}>
            {typeof x === "string" ? x : (x.label ?? x.key ?? JSON.stringify(x))}
          </li>
        ))}
      </ul>
    );
  };

  const renderPhotoIssues = (arr: any[]) => {
    if (!Array.isArray(arr) || arr.length === 0) {
      return <div className="text-sm text-gray-500 dark:text-gray-400">None</div>;
    }
    return (
      <div className="space-y-2">
        {arr.map((it, idx) => (
          <div
            key={idx}
            className="rounded-md border border-gray-200 dark:border-gray-800 p-2"
          >
            <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              {it?.title ?? "Item"}{" "}
              {it?.id != null ? (
                <span className="opacity-70">(ID: {it.id})</span>
              ) : null}
            </div>
            <ul className="list-disc pl-5 text-sm text-gray-700 dark:text-gray-200 mt-1">
              {(it?.issues ?? []).map((x: string, i: number) => (
                <li key={i}>{x}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-3">
      <div>
        <div className="text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">
          Missing Sections
        </div>
        {renderList(flags.missingSections || [])}
      </div>

      <div>
        <div className="text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">
          Empty Sections
        </div>
        {renderList(flags.emptySections || [])}
      </div>

      <div>
        <div className="text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">
          Too Short Sections
        </div>
        {renderList(flags.tooShortSections || [])}
      </div>

      <div>
        <div className="text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">
          Missing Metadata
        </div>
        {renderList(flags.missingMeta || [])}
      </div>

      <div>
        <div className="text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">
          Consistency Issues
        </div>
        {renderList(flags.consistencyIssues || [])}
      </div>

      <div>
        <div className="text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">
          Risk Flags
        </div>
        {renderList(flags.riskFlags || [])}
      </div>

      <div>
        <div className="text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">
          Photo Report Items Issues (text only)
        </div>
        {renderPhotoIssues(flags.photoItemIssues || [])}
      </div>

      <div className="pt-2 border-t border-gray-200 dark:border-gray-800">
        <div className="text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">
          Severity Score
        </div>
        <div className="text-sm text-gray-900 dark:text-gray-100">
          {flags.severityScore ?? 0}
        </div>
      </div>
    </div>
  );
}
