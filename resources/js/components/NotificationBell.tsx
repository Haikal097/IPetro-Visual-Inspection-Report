import React, { useEffect, useRef, useState } from "react";
import { Link, router, usePage } from "@inertiajs/react";
import axios from "axios";

type Notif = {
  id: string;
  title: string;
  type: string;

  // report notif
  report_id?: number | null;
  status?: string | null;
  message?: string | null;
  url?: string | null;
  actor_name?: string | null;

  // inspection notif
  inspection_id?: number | null;
  start_at?: string | null;
  tag?: string | null;
  location?: string | null;

  created_at?: string | null;
  read_at?: string | null;
};

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [unread, setUnread] = useState<Notif[]>([]);
  const [recent, setRecent] = useState<Notif[]>([]);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const [loading, setLoading] = useState(false);

  const page = usePage() as any;
  const userRole: string | null = page?.props?.auth?.user?.role ?? null;
  const isReviewer = userRole === "reviewer";
  const isAdmin = userRole === "admin";

  function csrfHeaders() {
    return {
      "X-Requested-With": "XMLHttpRequest",
      "X-CSRF-TOKEN":
        (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)
          ?.content ?? "",
    };
  }

  useEffect(() => {
    axios.defaults.headers.common["X-Requested-With"] = "XMLHttpRequest";

    const token =
      (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)
        ?.content ?? "";
    if (token) axios.defaults.headers.common["X-CSRF-TOKEN"] = token;

    axios.defaults.withCredentials = true;

    axios.defaults.baseURL = window.location.origin;
    axios.defaults.xsrfCookieName = "XSRF-TOKEN";
    axios.defaults.xsrfHeaderName = "X-XSRF-TOKEN";
  }, []);

  async function load() {
    try {
      setLoading(true);
      const res = await fetch("/notifications", {
        headers: { "X-Requested-With": "XMLHttpRequest" },
      });
      const data = await res.json();
      setUnreadCount(data.unread_count ?? 0);
      setUnread(data.unread ?? []);
      setRecent(data.recent ?? []);
    } finally {
      setLoading(false);
    }
  }

  async function markRead(id: string) {
    await fetch(`/notifications/${id}/read`, {
      method: "POST",
      headers: csrfHeaders(),
    });
    await load();
  }

  async function markAllRead() {
    await fetch(`/notifications/read-all`, {
      method: "POST",
      headers: csrfHeaders(),
    });
    await load();
  }

  const resolveTargetUrl = (n: Notif) => {
    if (isReviewer && n.report_id) return `/review/report/${n.report_id}`;

    if (n.url) return n.url;

    if (n.report_id) return `/pv-report/${n.report_id}`;

    if (n.inspection_id) return `/inspection-calendar?inspection=${n.inspection_id}`;

    return "/dashboard";
  };

  const openNotification = async (n: Notif) => {
    await axios.post(`/notifications/${n.id}/read`, {}, { headers: csrfHeaders() });
    await load();

    const target = resolveTargetUrl(n);
    router.visit(target);
    setOpen(false);
  };

  const setInspectionStatus = async (inspectionId: number, status: string) => {
    await axios.put(
      `/inspection-calendar/${inspectionId}/status`,
      { status },
      { headers: csrfHeaders() }
    );
    await load();
  };

  // ✅ Start/Done helper: update status AND navigate
  const setStatusAndGo = async (n: Notif, status: string) => {
    if (!n.inspection_id) return;

    await setInspectionStatus(n.inspection_id, status);

    const target = resolveTargetUrl(n);
    router.visit(target);

    setOpen(false);
  };

  async function refresh() {
    await load();
  }

  useEffect(() => {
    load();
    const t = window.setInterval(load, 30_000);
    return () => window.clearInterval(t);
  }, []);

  useEffect(() => {
    if (open) load();
  }, [open]);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!wrapRef.current) return;
      if (!wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const asButtonProps = (onClick: () => void) => ({
    role: "button" as const,
    tabIndex: 0,
    onClick,
    onKeyDown: (e: React.KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        onClick();
      }
    },
  });

  return (
    <div className="relative" ref={wrapRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="relative rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-gray-800"
        aria-label="Notifications"
      >
        <svg className="h-5 w-5 text-gray-700 dark:text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V4a2 2 0 10-4 0v1.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0a3 3 0 11-6 0m6 0H9" />
        </svg>

        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] px-1 h-[18px] rounded-full bg-red-600 text-white text-[10px] flex items-center justify-center">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-[360px] rounded-xl border border-gray-200 bg-white shadow-xl dark:border-gray-800 dark:bg-gray-950 z-50">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800">
            <div className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              Notifications
              {loading && <span className="text-[10px] text-gray-400">(refreshing)</span>}
            </div>

            <button
              type="button"
              onClick={markAllRead}
              className="text-xs font-semibold text-red-600 hover:underline disabled:opacity-50"
              disabled={unreadCount === 0}
            >
              Mark all read
            </button>
          </div>

          <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-800">
            <button
              type="button"
              onClick={refresh}
              className="w-full rounded-lg border border-gray-200 dark:border-gray-800 px-3 py-2 text-sm font-semibold text-gray-800 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-900"
            >
              Refresh
            </button>
          </div>

          <div className="max-h-[360px] overflow-auto">
            {unread.length > 0 ? (
              <>
                <div className="px-4 pt-3 pb-2 text-xs font-bold text-gray-500 dark:text-gray-400">
                  UNREAD
                </div>

                {unread.map((n) => (
                  <div
                    key={n.id}
                    {...asButtonProps(() => openNotification(n))}
                    className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-900 border-b border-gray-50 dark:border-gray-900 cursor-pointer"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="font-semibold text-gray-900 dark:text-white text-sm truncate">
                          {n.title}
                        </div>

                        {(n as any).message && (
                          <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                            {(n as any).message}
                          </div>
                        )}

                        <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                          {n.status ? `Status: ${n.status}` : ""}
                          {n.tag ? `${n.status ? " • " : ""}Tag: ${n.tag}` : ""}
                          {n.location ? ` • ${n.location}` : ""}
                        </div>

                        {n.message ? (
                          <div className="mt-2 text-xs text-gray-600 dark:text-gray-300 whitespace-pre-wrap line-clamp-3">
                            {n.message}
                          </div>
                        ) : null}

                        {n.inspection_id && !isReviewer && (
                          <div className="mt-2 flex items-center gap-2">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                const target = resolveTargetUrl(n);
                                router.visit(target);
                                setOpen(false);
                              }}
                              className="text-xs font-semibold px-2 py-1 rounded border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900"
                            >
                              Open
                            </button>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                // ✅ Start = in_progress + go (PV report if url/report_id exists)
                                setStatusAndGo(n, "in_progress");
                              }}
                              className="text-xs font-semibold px-2 py-1 rounded border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900"
                            >
                              Start
                            </button>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                // ✅ Done = completed (was in_progress before)
                                setStatusAndGo(n, "completed");
                              }}
                              className="text-xs font-semibold px-2 py-1 rounded border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900"
                            >
                              Done
                            </button>
                          </div>
                        )}
                      </div>

                      <span className="mt-1 h-2 w-2 rounded-full bg-red-500 shrink-0"></span>
                    </div>

                    <div className="mt-2 flex items-center gap-3">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          markRead(n.id);
                        }}
                        className="text-xs font-semibold text-gray-600 hover:underline dark:text-gray-300"
                      >
                        Mark as read
                      </button>

                      {(n.url || n.report_id || n.inspection_id) && (
                        <span
                          role="button"
                          tabIndex={0}
                          onClick={(e) => {
                            e.stopPropagation();
                            const target = resolveTargetUrl(n);
                            router.visit(target);
                            setOpen(false);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              e.stopPropagation();
                              const target = resolveTargetUrl(n);
                              router.visit(target);
                              setOpen(false);
                            }
                          }}
                          className="text-xs font-semibold text-red-600 hover:underline cursor-pointer"
                        >
                          Review
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </>
            ) : (
              <div className="px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                No unread notifications 🎉
              </div>
            )}

            <div className="px-4 pt-3 pb-2 text-xs font-bold text-gray-500 dark:text-gray-400">
              RECENT
            </div>

            {recent.length ? (
              recent.map((n) => (
                <div
                  key={n.id}
                  {...asButtonProps(() => openNotification(n))}
                  className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-900 border-b border-gray-50 dark:border-gray-900 cursor-pointer"
                >
                  <div className="text-sm text-gray-900 dark:text-white">{n.title}</div>

                  {n.message ? (
                    <div className="mt-1 text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
                      {n.message}
                    </div>
                  ) : (
                    <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      {n.read_at ? "Read" : "Unread"}
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="px-4 pb-4 text-sm text-gray-500 dark:text-gray-400">
                No notifications yet.
              </div>
            )}
          </div>

          <div className={`px-4 py-3 border-t border-gray-100 dark:border-gray-800 flex items-center ${isReviewer ? "justify-end" : "justify-between"}`}>
            {!isReviewer && (
              <Link href="/inspection-calendar" className="text-sm font-semibold text-red-600 hover:underline">
                Calendar
              </Link>
            )}

            {isReviewer ? (
              <Link href="/review" className="text-sm font-semibold text-red-600 hover:underline">
                Reviews
              </Link>
            ) : (
              <Link href="/reports" className="text-sm font-semibold text-red-600 hover:underline">
                Reports
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
