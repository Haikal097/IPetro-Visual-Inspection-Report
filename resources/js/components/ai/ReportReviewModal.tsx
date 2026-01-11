import { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";

type Props = {
  open: boolean;
  onClose: () => void;
  report: any;
};

export default function ReportReviewModal({ open, onClose, report }: Props) {
  const [loading, setLoading] = useState(false);
  const [review, setReview] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const boxRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (open) {
      setError(null);
      // do NOT auto-run (recommended), but you can if you want
      // setReview(null);
      setTimeout(() => boxRef.current?.focus(), 50);
    }
  }, [open]);

  const reportId = useMemo(() => report?.id ?? report?.report_id, [report]);

  if (!open) return null;

  const run = async () => {
    try {
      setLoading(true);
      setError(null);
      setReview(null);

      const payload = {
        report_id: reportId,
        report: {
          status: report?.status,
          report_number: report?.report_number,
          report_data: report?.report_data ?? report?.report_data ?? null,
        },
      };

      const { data } = await axios.post("/api/ai/report-review", payload);

      if (!data?.ok) throw new Error(data?.error || "AI Review failed");
      setReview(data.review);
    } catch (e: any) {
      setError(e?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const pill = (confidence: string) => {
    const c = (confidence || "").toLowerCase();
    if (c === "high") return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200";
    if (c === "low") return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200";
    return "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200";
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 p-4">
      <div
        ref={boxRef}
        tabIndex={-1}
        className="w-full max-w-4xl overflow-hidden rounded-2xl bg-white shadow-xl dark:bg-gray-900"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 p-4 dark:border-gray-800">
          <div>
            <div className="text-lg font-semibold text-gray-900 dark:text-white">
              AI Review Assistant
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Report: {report?.report_number || `#${reportId || "N/A"}`} • Status: {report?.status || "N/A"}
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg px-3 py-1 text-sm text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            Close
          </button>
        </div>

        {/* Body (scrollable) */}
        <div className="max-h-[75vh] overflow-y-auto p-4">
          {/* Actions */}
          <div className="mb-4 flex flex-wrap gap-3">
            <button
              onClick={run}
              disabled={loading || !reportId}
              className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
            >
              {loading ? "Analyzing..." : "Run AI Review"}
            </button>

            <button
              onClick={() => setReview(null)}
              className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
            >
              Clear
            </button>
          </div>

          {error && (
            <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-200">
              {error}
            </div>
          )}

          {!review && !error && (
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-200">
              Click <span className="font-semibold">Run AI Review</span> to generate a reviewer checklist + suggested comment template.
            </div>
          )}

          {review && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
                <div className="mb-2 flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Summary</h4>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${pill(review.confidence)}`}>
                    Confidence: {(review.confidence || "medium").toUpperCase()}
                  </span>
                </div>
                <p className="text-sm text-gray-700 dark:text-gray-200">
                  {review.completeness || "—"}
                </p>
              </div>

              <GridTwo>
                <ListCard title="Missing Sections" items={review.missingSections} />
                <ListCard title="Missing Metadata" items={review.missingMetadata} />
              </GridTwo>

              <GridTwo>
                <ListCard title="Consistency Issues" items={review.consistencyIssues} />
                <ListCard title="Wording / Structure Issues" items={review.wordingIssues} />
              </GridTwo>

              <ListCard title="Risk Flags" items={review.riskFlags} />

              <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
                <h4 className="mb-2 text-sm font-semibold text-gray-900 dark:text-white">
                  Top 3 Issues to Fix
                </h4>
                <ul className="list-disc space-y-1 pl-5 text-sm text-gray-700 dark:text-gray-200">
                  {(review.topIssues || []).slice(0, 3).map((x: string, i: number) => (
                    <li key={i}>{x}</li>
                  ))}
                </ul>
              </div>

              <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
                <h4 className="mb-2 text-sm font-semibold text-gray-900 dark:text-white">
                  Suggested Reviewer Comment (template)
                </h4>
                <pre className="whitespace-pre-wrap rounded-xl bg-gray-50 p-3 text-sm text-gray-800 dark:bg-gray-950 dark:text-gray-100">
{review.suggestedReviewerComment || "—"}
                </pre>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-3 text-xs text-gray-500 dark:border-gray-800 dark:text-gray-400">
          AI provides suggestions only. Reviewer decision remains final.
        </div>
      </div>
    </div>
  );
}

function GridTwo({ children }: { children: any }) {
  return <div className="grid grid-cols-1 gap-4 md:grid-cols-2">{children}</div>;
}

function ListCard({ title, items }: { title: string; items: any[] }) {
  const list = Array.isArray(items) ? items : [];
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
      <h4 className="mb-2 text-sm font-semibold text-gray-900 dark:text-white">{title}</h4>

      {list.length ? (
        <ul className="list-disc space-y-1 pl-5 text-sm text-gray-700 dark:text-gray-200">
          {list.map((x, i) => (
            <li key={i}>{String(x)}</li>
          ))}
        </ul>
      ) : (
        <div className="text-sm text-gray-500 dark:text-gray-400">No issues found.</div>
      )}
    </div>
  );
}
