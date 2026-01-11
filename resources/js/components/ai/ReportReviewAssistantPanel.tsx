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
      suggestedAction?: "approve" | "revision_requested" | "reject";
      topIssues?: string[];
      suggestedComments?: { title: string; text: string }[];
      notes?: any;
      flags?: any;
    }
  | {
      ok: true;
      mode: "fallback_text";
      analysis_text?: string;
      flags?: any;
    }
  | {
      ok: false;
      error: string;
      details?: any;
      flags?: any;
    };

export default function ReportReviewAssistantPanel({ report }: Props) {
  const [loading, setLoading] = useState(false);
  const [res, setRes] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);

  const safeReport = useMemo(() => {
    return {
      id: report?.id ?? report?.report_id,
      title: report?.title,
      status: report?.status,
      creation_date: report?.creation_date,
      submission_date: report?.submission_date,
      signed_at: report?.signed_at,

      // ✅ IMPORTANT:
      // Only PV report sections live here. We are NOT sending photos/items.
      json_data: report?.report_data ?? report?.json_data ?? {},
    };
  }, [report]);

  // ✅ NEW: normalize backend response into the UI format your component expects
  const normalize = (data: any): Result => {
    // backend (current): { ok:true, review:{...} }
    if (data?.ok === true && data?.review && typeof data.review === "object") {
      const r = data.review;

      return {
        ok: true,
        mode: "json",
        confidence: r.confidence,
        suggestedAction: r.suggestedAction,
        topIssues: Array.isArray(r.topIssues) ? r.topIssues : [],
        suggestedComments: r.suggestedReviewerComment
          ? [{ title: "Suggested reviewer comment", text: String(r.suggestedReviewerComment) }]
          : [],
        flags: {
          missingSections: Array.isArray(r.missingSections) ? r.missingSections : [],
          emptySections: Array.isArray(r.emptySections) ? r.emptySections : [],
          tooShortSections: Array.isArray(r.tooShortSections) ? r.tooShortSections : [],
          missingMeta: Array.isArray(r.missingMetadata) ? r.missingMetadata : [],
          consistencyIssues: Array.isArray(r.consistencyIssues) ? r.consistencyIssues : [],
          riskFlags: Array.isArray(r.riskFlags) ? r.riskFlags : [],
          severityScore: r.severityScore ?? 0,
        },
        notes: r,
      };
    }

    // frontend shape (older/alternate): { ok:true, mode:"json", ... }
    if (data?.ok === true && data?.mode === "json") {
      return data as Result;
    }

    // error shape
    if (data?.ok === false) {
      return {
        ok: false,
        error: data?.error ?? "Request failed",
        details: data?.details,
        flags: data?.flags,
      };
    }

    // fallback display
    return {
      ok: true,
      mode: "fallback_text",
      analysis_text: typeof data === "string" ? data : JSON.stringify(data, null, 2),
      flags: data?.flags,
    };
  };

  const run = async () => {
    try {
      setLoading(true);
      setError(null);
      setRes(null);

      const { data } = await axios.post("/api/ai/report-review-assistant", {
        report: safeReport,
      });

      // ✅ CHANGED: normalize before render
      setRes(normalize(data));
    } catch (e: any) {
      const msg =
        e?.response?.data?.error ||
        e?.response?.data?.message ||
        e?.message ||
        "Request failed";
      setError(msg);

      // ✅ CHANGED: normalize even error payload so UI doesn't break
      setRes(normalize(e?.response?.data ?? { ok: false, error: msg }));
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
    if (c === "high") return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200";
    if (c === "low") return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200";
    return "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200";
  };

  const actionBadge = (a?: string) => {
    if (a === "approve") return "bg-emerald-600 text-white";
    if (a === "reject") return "bg-red-600 text-white";
    return "bg-amber-600 text-white";
  };

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

      {error && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-200">
          {error}
        </div>
      )}

      {res && (res as any).ok === true && (res as any).mode === "json" && (
        <div className="mt-4 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${confidenceBadge((res as any).confidence)}`}>
              Confidence: {(res as any).confidence ?? "medium"}
            </span>
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${actionBadge((res as any).suggestedAction)}`}>
              Suggested: {(res as any).suggestedAction ?? "revision_requested"}
            </span>
          </div>

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
  if (!flags) return <div className="text-sm text-gray-500 dark:text-gray-400">No flags.</div>;

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

  return (
    <div className="space-y-3">
      <div>
        <div className="text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">Missing Sections</div>
        {renderList(flags.missingSections || [])}
      </div>

      <div>
        <div className="text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">Empty Sections</div>
        {renderList(flags.emptySections || [])}
      </div>

      <div>
        <div className="text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">Too Short Sections</div>
        {renderList(flags.tooShortSections || [])}
      </div>

      <div>
        <div className="text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">Missing Metadata</div>
        {renderList(flags.missingMeta || [])}
      </div>

      <div>
        <div className="text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">Consistency Issues</div>
        {renderList(flags.consistencyIssues || [])}
      </div>

      <div>
        <div className="text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">Risk Flags</div>
        {renderList(flags.riskFlags || [])}
      </div>

      <div className="pt-2 border-t border-gray-200 dark:border-gray-800">
        <div className="text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">Severity Score</div>
        <div className="text-sm text-gray-900 dark:text-gray-100">{flags.severityScore ?? 0}</div>
      </div>
    </div>
  );
}
