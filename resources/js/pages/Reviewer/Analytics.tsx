import AppLayout from "@/layouts/app-layout";
import { Head, Link, router } from "@inertiajs/react";
import { useMemo } from "react";
import { BarChart3, ArrowLeft, AlertTriangle, TrendingUp, Clock, ShieldAlert } from "lucide-react";

/** ✅ ADD ONLY: avoid recursive type in Props */
type RiskItem = {
  report_id: number;
  item_id: number;
  title: string;
  findings: string;
  requirements: string;
  report_title: string;
  report_status: string;
};

/** ✅ ADD ONLY: keyword & worst report payload types */
type KeywordCount = { keyword: string; count: number };

type WorstReport = {
  report_id: number;
  report_title?: string;
  report_number?: string;
  report_status?: string;
  defect_count: number;
  keywords?: Record<string, number>;
};

type Props = {
  filters: {
    timeframe: "all" | "week" | "month" | "3months";
    overdueDays: number;
  };
  workload: {
    statusCounts: Record<string, number>;
    submissionsByDay: { d: string; c: number }[];
    completionsByDay: { d: string; c: number }[];

    /** ✅ ADD ONLY: allow both id and report_id */
    overdueReports: {
      id?: number;
      report_id?: number;
      title: string;
      status: string;
      submission_date: string;
      inspector_name?: string;
    }[];
  };
  risk: {
    keywords: string[];

    /** ✅ ADD ONLY: use RiskItem, not Props recursion */
    defectItems: RiskItem[];
    inconsistentItems: RiskItem[];

    /** ✅ ADD ONLY: new fields returned by controller */
    keywordCounts?: KeywordCount[];
    worstReports?: WorstReport[];
  };
  ai: null | {
    countsByAction: Record<string, number>;
  };
};

export default function Analytics({ filters, workload, risk, ai }: Props) {
  const statuses = useMemo(() => {
    const all = { ...workload.statusCounts };
    const order = ["draft", "submitted", "in_review", "revisions_requested", "approved", "rejected", "closed"];
    const entries = Object.entries(all);
    entries.sort((a, b) => order.indexOf(a[0]) - order.indexOf(b[0]));
    return entries;
  }, [workload.statusCounts]);

  const timeframeLabel = (v: Props["filters"]["timeframe"]) => {
    if (v === "week") return "Last 7 days";
    if (v === "3months") return "Last 90 days";
    if (v === "all") return "All time";
    return "Last 30 days";
  };

  const setTimeframe = (v: Props["filters"]["timeframe"]) => {
    router.get("/reviews/analytics", { timeframe: v }, { preserveScroll: true, preserveState: true });
  };

  return (
    <AppLayout breadcrumbs={[{ title: "Review Analytics", href: "/reviews/analytics" }]}>
      <Head title="Review Analytics - iPETRO" />

      <div className="px-6 py-6 min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50/50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900/50">
        <div className="flex items-start justify-between gap-4 mb-6">
          <div className="flex items-start gap-3">
            <div className="p-3 bg-gradient-to-br from-red-600 to-red-700 rounded-xl shadow-lg">
              <BarChart3 className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Review Analytics</h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {timeframeLabel(filters.timeframe)} • Workload + defect overview
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <select
              className="rounded-xl border border-gray-300 bg-white dark:bg-gray-800 dark:border-gray-700 py-2 px-3 text-sm dark:text-white"
              value={filters.timeframe}
              onChange={(e) => setTimeframe(e.target.value as any)}
            >
              <option value="week">Last 7 days</option>
              <option value="month">Last 30 days</option>
              <option value="3months">Last 90 days</option>
              <option value="all">All time</option>
            </select>

            <Link
              href="/review"
              className="inline-flex items-center gap-2 rounded-xl border border-gray-300 bg-white dark:bg-gray-800 dark:border-gray-700 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Link>
          </div>
        </div>

        {/* 1) Workload & pipeline health */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="h-5 w-5 text-gray-700 dark:text-gray-200" />
              <div className="font-semibold text-gray-900 dark:text-white">Status breakdown</div>
            </div>
            <div className="space-y-2">
              {statuses.map(([k, v]) => (
                <div key={k} className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-300">{k}</span>
                  <span className="font-semibold text-gray-900 dark:text-white">{v}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5 lg:col-span-2">
            <div className="flex items-center gap-2 mb-3">
              <Clock className="h-5 w-5 text-gray-700 dark:text-gray-200" />
              <div className="font-semibold text-gray-900 dark:text-white">Queue risk (Overdue)</div>
            </div>

            <div className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              Submitted more than <span className="font-semibold">{filters.overdueDays}</span> days ago but not completed.
            </div>

            <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-800/50">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 dark:text-gray-300">Report</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 dark:text-gray-300">Inspector</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 dark:text-gray-300">Status</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 dark:text-gray-300">Submitted</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {workload.overdueReports.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-6 text-center text-gray-500 dark:text-gray-400">
                        No overdue reports 🎉
                      </td>
                    </tr>
                  ) : (
                    workload.overdueReports.map((r, idx) => {
                      /** ✅ ADD ONLY: support id OR report_id safely */
                      const reportId = (r as any).id ?? (r as any).report_id ?? idx;

                      return (
                        <tr key={reportId} className="hover:bg-gray-50 dark:hover:bg-gray-800/30">
                          <td className="px-4 py-3 text-gray-900 dark:text-white">{r.title}</td>
                          <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{r.inspector_name ?? "-"}</td>
                          <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{r.status}</td>
                          <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{String(r.submission_date).slice(0, 10)}</td>
                          <td className="px-4 py-3 text-right">
                            <Link
                              href={`/report/show/${reportId}`}
                              className="inline-flex items-center gap-2 rounded-lg bg-red-50 dark:bg-red-900/20 px-3 py-1.5 text-sm font-medium text-red-700 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/40"
                            >
                              Review
                            </Link>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* 4) Equipment risk overview */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5">
            <div className="flex items-center gap-2 mb-2">
              <ShieldAlert className="h-5 w-5 text-gray-700 dark:text-gray-200" />
              <div className="font-semibold text-gray-900 dark:text-white">Defect-related photo items</div>
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400 mb-3">
              Based on text keywords: {risk.keywords.join(", ")}
            </div>

            <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
              {risk.defectItems.length === 0 ? (
                <div className="text-sm text-gray-500 dark:text-gray-400">No defect keywords detected.</div>
              ) : (
                risk.defectItems.map((it, idx) => (
                  <div key={`${it.report_id}-${it.item_id}-${idx}`} className="rounded-xl border border-gray-200 dark:border-gray-800 p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold text-gray-900 dark:text-white">
                          {it.title || "Item"} <span className="opacity-70">(Item ID: {it.item_id})</span>
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                          Report: {it.report_title} • Status: {it.report_status} • Report ID: {it.report_id}
                        </div>
                      </div>
                      <Link
                        href={`/report/show/${it.report_id}`}
                        className="text-xs font-semibold text-red-700 dark:text-red-300 hover:underline"
                      >
                        Open report
                      </Link>
                    </div>

                    <div className="mt-2 text-sm text-gray-700 dark:text-gray-200">
                      <span className="font-semibold">Findings:</span> {it.findings}
                    </div>
                    <div className="mt-1 text-sm text-gray-700 dark:text-gray-200">
                      <span className="font-semibold">Requirements:</span> {it.requirements}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
              <div className="font-semibold text-gray-900 dark:text-white">Inconsistent items</div>
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              Findings mention defect but requirements says Nil/None/N.A.
            </div>

            <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
              {risk.inconsistentItems.length === 0 ? (
                <div className="text-sm text-gray-500 dark:text-gray-400">No inconsistencies detected.</div>
              ) : (
                risk.inconsistentItems.map((it, idx) => (
                  <div key={`${it.report_id}-${it.item_id}-${idx}`} className="rounded-xl border border-amber-200 dark:border-amber-800/50 bg-amber-50/50 dark:bg-amber-900/10 p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="text-sm font-semibold text-gray-900 dark:text-white">
                        {it.title || "Item"} <span className="opacity-70">(Item ID: {it.item_id})</span>
                      </div>
                      <Link
                        href={`/report/show/${it.report_id}`}
                        className="text-xs font-semibold text-red-700 dark:text-red-300 hover:underline"
                      >
                        Open report
                      </Link>
                    </div>
                    <div className="mt-2 text-sm text-gray-700 dark:text-gray-200">
                      <span className="font-semibold">Findings:</span> {it.findings}
                    </div>
                    <div className="mt-1 text-sm text-gray-700 dark:text-gray-200">
                      <span className="font-semibold">Requirements:</span> {it.requirements}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* ====================== DEFECT OVERVIEW (ADD ONLY) ====================== */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          {/* Top Defect Keywords */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Top defect keywords (from Photo Report text)
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Counted from Photo Report Items findings text (no image analysis).
            </p>

            {Array.isArray((risk as any)?.keywordCounts) && (risk as any).keywordCounts.length > 0 ? (
              <div className="space-y-2">
                {(risk as any).keywordCounts.slice(0, 10).map((k: any, i: number) => (
                  <div key={i} className="flex items-center justify-between rounded-xl border border-gray-200 dark:border-gray-800 p-3">
                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100 capitalize">
                      {k.keyword}
                    </div>
                    <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                      {k.count}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-gray-500 dark:text-gray-400">No defect keywords found.</div>
            )}
          </div>

          {/* Worst Reports by Defect Count */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Worst reports (most defect mentions)
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Ranked by number of defect-keyword matches in Photo Items findings.
            </p>

            {Array.isArray((risk as any)?.worstReports) && (risk as any).worstReports.length > 0 ? (
              <div className="space-y-3">
                {(risk as any).worstReports.map((r: any, idx: number) => (
                  <div key={idx} className="rounded-2xl border border-gray-200 dark:border-gray-800 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold text-gray-900 dark:text-white">
                          {r.report_title || `Report #${r.report_id}`}
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                          Report ID: {r.report_id}
                          {r.report_number ? <> • No: {r.report_number}</> : null}
                          {r.report_status ? <> • Status: {r.report_status}</> : null}
                        </div>
                      </div>

                      <div className="text-sm font-bold text-red-700 dark:text-red-300">
                        {r.defect_count} defects
                      </div>
                    </div>

                    {/* Top keywords per report */}
                    <div className="mt-3 flex flex-wrap gap-2">
                      {r.keywords
                        ? Object.entries(r.keywords)
                            .sort((a: any, b: any) => (b[1] as number) - (a[1] as number))
                            .slice(0, 4)
                            .map(([k, c]: any) => (
                              <span
                                key={k}
                                className="inline-flex items-center rounded-full bg-gray-100 dark:bg-gray-800 px-3 py-1 text-xs font-semibold text-gray-700 dark:text-gray-200"
                              >
                                {k}: {c}
                              </span>
                            ))
                        : null}
                    </div>

                    {/* Review button */}
                    <div className="mt-4">
                      <Link
                        href={`/report/show/${r.report_id}`}
                        className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
                      >
                        Review report
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-gray-500 dark:text-gray-400">No high-risk reports found.</div>
            )}
          </div>
        </div>
        {/* ====================== END DEFECT OVERVIEW ====================== */}

        {/* Optional AI */}
        {ai && (
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5">
            <div className="font-semibold text-gray-900 dark:text-white mb-3">AI Review summary</div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {Object.entries(ai.countsByAction || {}).map(([k, v]) => (
                <div key={k} className="rounded-xl border border-gray-200 dark:border-gray-800 p-4">
                  <div className="text-xs text-gray-600 dark:text-gray-400">Suggested action</div>
                  <div className="text-lg font-bold text-gray-900 dark:text-white">{k || "AI Suggested"}</div>
                  <div className="text-sm text-gray-700 dark:text-gray-200">{v}</div>
                </div>
              ))}
              {Object.keys(ai.countsByAction || {}).length === 0 && (
                <div className="text-sm text-gray-500 dark:text-gray-400">No AI history found for this timeframe.</div>
              )}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
