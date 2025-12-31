import React, { useEffect, useRef, useState } from "react";
import { Link, router } from "@inertiajs/react";
import axios from "axios";

type Notif = {
  id: string;
  title: string;
  type: string;
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

  // ✅ add: small loading state (optional)
  const [loading, setLoading] = useState(false);

  // ✅ helper: CSRF header (so you don’t repeat)
  function csrfHeaders() {
    return {
      "X-Requested-With": "XMLHttpRequest",
      "X-CSRF-TOKEN":
        (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content ?? "",
    };
  }

  // ✅ keep your original load(), just enhance with try/finally + loading
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

  // ✅ open notification -> mark read -> reload -> navigate
  const openNotification = async (n: Notif) => {
    await axios.post(`/notifications/${n.id}/read`, {}, { headers: csrfHeaders() });

    // refresh counters/list so the bell updates immediately
    await load();

    // navigate
    if (n.inspection_id) {
      router.visit(`/inspection-calendar?inspection=${n.inspection_id}`);
      // OR: router.visit(`/inspections/${n.inspection_id}`);
    } else {
      router.visit("/inspection-calendar");
    }

    setOpen(false);
  };

  // ✅ send test reminder (backend route /notifications/test)
  async function sendTestReminder() {
    await fetch(`/notifications/test`, {
      method: "POST",
      headers: csrfHeaders(),
    });
    await load();
  }

  useEffect(() => {
    load();
    const t = window.setInterval(load, 30_000); // refresh every 30s
    return () => window.clearInterval(t);
  }, []);

  // ✅ refresh when opening dropdown (so user sees latest instantly)
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

  return (
    <div className="relative" ref={wrapRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="relative rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-gray-800"
        aria-label="Notifications"
      >
        {/* bell icon */}
        <svg
          className="h-5 w-5 text-gray-700 dark:text-gray-200"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V4a2 2 0 10-4 0v1.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0a3 3 0 11-6 0m6 0H9"
          />
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
              {/* ✅ optional tiny loading indicator */}
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

          {/* ✅ add test button (small + non invasive) */}
          <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-800">
            <button
              type="button"
              onClick={sendTestReminder}
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
                  <button
                    key={n.id}
                    type="button"
                    onClick={() => openNotification(n)}
                    className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-900 border-b border-gray-50 dark:border-gray-900"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-semibold text-gray-900 dark:text-white text-sm">
                          {n.title}
                        </div>
                        <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                          {n.tag ? `Tag: ${n.tag}` : ""}
                          {n.location ? ` • ${n.location}` : ""}
                        </div>
                      </div>
                      <span className="mt-1 h-2 w-2 rounded-full bg-red-500"></span>
                    </div>

                    {n.inspection_id && (
                      <div className="mt-2">
                        <Link
                          href={`/inspection-calendar?inspection=${n.inspection_id}`}
                          className="text-xs font-semibold text-red-600 hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          View in calendar
                        </Link>

                        {/* ✅ mark as read only (no navigation) */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            markRead(n.id);
                          }}
                          className="ml-3 text-xs font-semibold text-gray-600 hover:underline dark:text-gray-300"
                        >
                          Mark as read
                        </button>
                      </div>
                    )}
                  </button>
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
                <button
                  key={n.id}
                  type="button"
                  onClick={() => openNotification(n)}
                  className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-900 border-b border-gray-50 dark:border-gray-900"
                >
                  <div className="text-sm text-gray-900 dark:text-white">{n.title}</div>
                  <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    {n.read_at ? "Read" : "Unread"}
                  </div>
                </button>
              ))
            ) : (
              <div className="px-4 pb-4 text-sm text-gray-500 dark:text-gray-400">
                No notifications yet.
              </div>
            )}
          </div>

          <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-800">
            <Link href="/inspection-calendar" className="text-sm font-semibold text-red-600 hover:underline">
              Open Inspection Calendar
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
