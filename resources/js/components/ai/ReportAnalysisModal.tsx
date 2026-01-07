import { useMemo, useState } from "react";
import axios from "axios";

type Props = {
  open: boolean;
  onClose: () => void;
  reports: any[];
};

export default function ReportAnalysisModal({ open, onClose, reports }: Props) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const stats = useMemo(() => {
    const totalReports = reports.length;
    const draft = reports.filter((r) => r.status === "draft").length;
    const submitted = reports.filter((r) => r.status === "submitted").length;
    const inReview = reports.filter((r) => r.status === "in_review").length;
    const completed = reports.filter((r) =>
      ["approved", "closed"].includes(r.status)
    ).length;

    return { totalReports, draft, submitted, inReview, completed };
  }, [reports]);

  if (!open) return null;

  const runAnalysis = async () => {
    try {
      setLoading(true);
      setError(null);
      setResult(null);

      // ✅ IMPORTANT: map stats.totalReports -> stats.total for backend validation
      const payload = {
        stats: {
          total: stats.totalReports,
          draft: stats.draft,
          submitted: stats.submitted,
          inReview: stats.inReview,
          completed: stats.completed,
        },

        // ✅ align with controller (optional)
        range: "week",

        // optional: include report list (can be heavy, but ok)
        reports: reports.slice(0, 100).map((r) => ({
          id: r.id,
          status: r.status,
          creation_date: r.creation_date,
          title: r.title,
        })),
      };

      const { data } = await axios.post("/api/ai/dashboard-analysis", payload);

      if (!data?.ok) throw new Error(data?.error || "Analysis failed");

      // ✅ your service should return { ok: true, analysis: {...} }
      setResult(data.analysis);
    } catch (e: any) {
      // ✅ show Laravel validation error cleanly too
      const msg =
        e?.response?.data?.message ||
        e?.response?.data?.error ||
        e?.message ||
        "Something went wrong";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-3xl rounded-2xl bg-white shadow-xl dark:bg-gray-900">
        <div className="flex items-center justify-between border-b border-gray-200 p-4 dark:border-gray-800">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            AI Data Analysis
          </h3>
          <button
            onClick={onClose}
            className="rounded-lg px-3 py-1 text-sm text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            Close
          </button>
        </div>

        <div className="p-4 max-h-[70vh] overflow-y-auto">
          <div className="mb-4 rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-950">
            <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
              <Stat label="Total" value={stats.totalReports} />
              <Stat label="Draft" value={stats.draft} />
              <Stat label="Submitted" value={stats.submitted} />
              <Stat label="In Review" value={stats.inReview} />
              <Stat label="Completed" value={stats.completed} />
            </div>
          </div>

          <div className="mb-4 flex gap-3">
            <button
              onClick={runAnalysis}
              disabled={loading}
              className="rounded-xl bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700 disabled:opacity-60"
            >
              {loading ? "Analyzing..." : "Run Analysis"}
            </button>

            <button
              onClick={() => setResult(null)}
              className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
            >
              Clear
            </button>
          </div>

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-200">
              {error}
            </div>
          )}

          {result && (
            <div className="space-y-4">
              <Section title="Summary">
                <p className="text-sm text-gray-700 dark:text-gray-200">
                  {result.summary}
                </p>
              </Section>

              <Section title="Key Insights">
                <ul className="list-disc space-y-1 pl-5 text-sm text-gray-700 dark:text-gray-200">
                  {(result.keyInsights || []).map((x: string, i: number) => (
                    <li key={i}>{x}</li>
                  ))}
                </ul>
              </Section>

              <Section title="Risks">
                <ul className="list-disc space-y-1 pl-5 text-sm text-gray-700 dark:text-gray-200">
                  {(result.risks || []).map((x: string, i: number) => (
                    <li key={i}>{x}</li>
                  ))}
                </ul>
              </Section>

              <Section title="Recommendations">
                <ul className="list-disc space-y-1 pl-5 text-sm text-gray-700 dark:text-gray-200">
                  {(result.recommendations || []).map(
                    (x: string, i: number) => (
                      <li key={i}>{x}</li>
                    )
                  )}
                </ul>
              </Section>

              <Section title="Suggested Next Actions">
                <div className="space-y-2">
                  {(result.suggestedNextActions || []).map((a: any, i: number) => (
                    <div
                      key={i}
                      className="rounded-xl border border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-gray-950"
                    >
                      <div className="font-semibold text-gray-900 dark:text-white">
                        {a.title}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-300">
                        {a.reason}
                      </div>
                    </div>
                  ))}
                </div>
              </Section>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: any }) {
  return (
    <div className="rounded-xl bg-white p-3 text-center dark:bg-gray-900">
      <div className="text-xs text-gray-500 dark:text-gray-400">{label}</div>
      <div className="text-lg font-bold text-gray-900 dark:text-white">
        {value}
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: any }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
      <h4 className="mb-2 text-sm font-semibold text-gray-900 dark:text-white">
        {title}
      </h4>
      {children}
    </div>
  );
}
