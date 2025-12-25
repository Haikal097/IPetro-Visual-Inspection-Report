// resources/js/Pages/Calendar/InspectionCalendar.tsx
import React, { useEffect, useMemo, useState } from "react";
import AppLayout from "@/layouts/app-layout";
import { Head } from "@inertiajs/react";
import { router } from "@inertiajs/react";

import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";

type InspectionStatus = "planned" | "in_progress" | "completed" | "cancelled";

type InspectionEvent = {
  id: number;
  title: string;
  start: string;
  end?: string | null;
  extendedProps?: {
    tag?: string | null;
    location?: string | null;
    notes?: string | null;
    status?: InspectionStatus;
    remind_1d?: boolean;
    remind_1h?: boolean;
  };
};

type FormState = {
  id?: number;
  title: string;
  tag: string;
  location: string;
  notes: string;
  start_at: string; // datetime-local
  end_at: string;   // datetime-local
  status: InspectionStatus;
  remind_1d: boolean;
  remind_1h: boolean;
};

function toLocalDateTimeInput(iso: string) {
  // Convert "2025-12-18T01:00:00+08:00" to "2025-12-18T01:00"
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  const yyyy = d.getFullYear();
  const mm = pad(d.getMonth() + 1);
  const dd = pad(d.getDate());
  const hh = pad(d.getHours());
  const mi = pad(d.getMinutes());
  return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
}

function nowPlus(hours: number) {
  const d = new Date();
  d.setHours(d.getHours() + hours);
  const pad = (n: number) => String(n).padStart(2, "0");
  const yyyy = d.getFullYear();
  const mm = pad(d.getMonth() + 1);
  const dd = pad(d.getDate());
  const hh = pad(d.getHours());
  const mi = pad(d.getMinutes());
  return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
}

export default function InspectionCalendar() {
  const [events, setEvents] = useState<InspectionEvent[]>([]);
  const [loading, setLoading] = useState(true);

  // Simple modal state
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>({
    title: "",
    tag: "",
    location: "",
    notes: "",
    start_at: nowPlus(1),
    end_at: "",
    status: "planned",
    remind_1d: true,
    remind_1h: true,
  });

  const [error, setError] = useState<string | null>(null);

  const breadcrumbs = useMemo(
    () => [{ title: "Inspection Calendar", href: "/inspection-calendar" }],
    []
  );

  async function loadEvents() {
    setLoading(true);
    try {
      const res = await fetch("/inspection-calendar/events", {
        headers: { "X-Requested-With": "XMLHttpRequest" },
      });
      const data = (await res.json()) as InspectionEvent[];
      setEvents(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadEvents();
  }, []);

  function openCreateModal(startIso: string, endIso?: string | null) {
    setError(null);
    setForm({
      title: "",
      tag: "",
      location: "",
      notes: "",
      start_at: toLocalDateTimeInput(startIso),
      end_at: endIso ? toLocalDateTimeInput(endIso) : "",
      status: "planned",
      remind_1d: true,
      remind_1h: true,
    });
    setOpen(true);
  }

  function openEditModal(ev: any) {
    const p = ev.extendedProps || {};
    setError(null);
    setForm({
      id: Number(ev.id),
      title: ev.title || "",
      tag: p.tag || "",
      location: p.location || "",
      notes: p.notes || "",
      start_at: toLocalDateTimeInput(ev.startStr),
      end_at: ev.endStr ? toLocalDateTimeInput(ev.endStr) : "",
      status: (p.status as InspectionStatus) || "planned",
      remind_1d: !!p.remind_1d,
      remind_1h: !!p.remind_1h,
    });
    setOpen(true);
  }

  function closeModal() {
    setOpen(false);
    setError(null);
  }

  function validateForm(f: FormState) {
    if (!f.title.trim()) return "Title is required.";
    if (!f.start_at) return "Start date/time is required.";
    if (f.end_at && f.end_at < f.start_at) return "End time must be after start time.";
    return null;
  }

  function submitCreate() {
    const msg = validateForm(form);
    if (msg) return setError(msg);

    router.post(
      "/inspection-calendar",
      {
        title: form.title,
        tag: form.tag || null,
        location: form.location || null,
        notes: form.notes || null,
        start_at: form.start_at,
        end_at: form.end_at || null,
        remind_1d: form.remind_1d,
        remind_1h: form.remind_1h,
      },
      {
        preserveScroll: true,
        onSuccess: async () => {
          closeModal();
          await loadEvents();
        },
        onError: () => setError("Failed to create inspection."),
      }
    );
  }

  function submitUpdate() {
    const msg = validateForm(form);
    if (msg) return setError(msg);
    if (!form.id) return;

    router.put(
      `/inspection-calendar/${form.id}`,
      {
        title: form.title,
        tag: form.tag || null,
        location: form.location || null,
        notes: form.notes || null,
        start_at: form.start_at,
        end_at: form.end_at || null,
        status: form.status,
        remind_1d: form.remind_1d,
        remind_1h: form.remind_1h,
      },
      {
        preserveScroll: true,
        onSuccess: async () => {
          closeModal();
          await loadEvents();
        },
        onError: () => setError("Failed to update inspection."),
      }
    );
  }

  function submitDelete() {
    if (!form.id) return;
    if (!confirm("Delete this inspection?")) return;

    router.delete(`/inspection-calendar/${form.id}`, {
      preserveScroll: true,
      onSuccess: async () => {
        closeModal();
        await loadEvents();
      },
      onError: () => setError("Failed to delete inspection."),
    });
  }

  function statusColor(status?: InspectionStatus) {
    switch (status) {
      case "planned":
        return "#ef4444"; // red
      case "in_progress":
        return "#f59e0b"; // amber
      case "completed":
        return "#10b981"; // green
      case "cancelled":
        return "#6b7280"; // gray
      default:
        return "#ef4444";
    }
  }

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Inspection Calendar" />

      <div className="p-6 space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Inspection Calendar
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Plan inspections and get reminders (1 day / 1 hour before)
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => openCreateModal(new Date().toISOString())}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
              type="button"
            >
              + New Inspection
            </button>

            <button
              onClick={loadEvents}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:hover:bg-gray-800"
              type="button"
            >
              Refresh
            </button>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-3 shadow-sm dark:border-gray-800 dark:bg-gray-950">
          {loading ? (
            <div className="p-8 text-center text-gray-500">Loading calendar…</div>
          ) : (
            <FullCalendar
              plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
              initialView="dayGridMonth"
              headerToolbar={{
                left: "prev,next today",
                center: "title",
                right: "dayGridMonth,timeGridWeek,timeGridDay",
              }}
              height="auto"
              selectable
              selectMirror
              editable
              eventResizableFromStart
              events={events}
              select={(info) => openCreateModal(info.startStr, info.endStr)}
              eventClick={(info) => openEditModal(info.event)}
              eventDrop={async (info) => {
                // drag & drop update time
                const ev = info.event;
                const p = ev.extendedProps || {};
                router.put(
                  `/inspection-calendar/${ev.id}`,
                  {
                    title: ev.title,
                    tag: p.tag || null,
                    location: p.location || null,
                    notes: p.notes || null,
                    start_at: toLocalDateTimeInput(ev.startStr),
                    end_at: ev.endStr ? toLocalDateTimeInput(ev.endStr) : null,
                    status: (p.status as InspectionStatus) || "planned",
                    remind_1d: !!p.remind_1d,
                    remind_1h: !!p.remind_1h,
                  },
                  {
                    preserveScroll: true,
                    onSuccess: async () => loadEvents(),
                    onError: () => {
                      alert("Failed to move event. Reverting.");
                      info.revert();
                    },
                  }
                );
              }}
              eventResize={(info) => {
                const ev = info.event;
                const p = ev.extendedProps || {};
                router.put(
                  `/inspection-calendar/${ev.id}`,
                  {
                    title: ev.title,
                    tag: p.tag || null,
                    location: p.location || null,
                    notes: p.notes || null,
                    start_at: toLocalDateTimeInput(ev.startStr),
                    end_at: ev.endStr ? toLocalDateTimeInput(ev.endStr) : null,
                    status: (p.status as InspectionStatus) || "planned",
                    remind_1d: !!p.remind_1d,
                    remind_1h: !!p.remind_1h,
                  },
                  {
                    preserveScroll: true,
                    onSuccess: async () => loadEvents(),
                    onError: () => {
                      alert("Failed to resize event. Reverting.");
                      info.revert();
                    },
                  }
                );
              }}
              eventDidMount={(arg) => {
                const status = (arg.event.extendedProps?.status as InspectionStatus) || "planned";
                arg.el.style.backgroundColor = statusColor(status);
                arg.el.style.borderColor = "transparent";
              }}
            />
          )}
        </div>
      </div>

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl dark:bg-gray-950">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                  {form.id ? "Edit Inspection" : "New Inspection"}
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Set schedule + reminders for inspector
                </p>
              </div>
              <button
                onClick={closeModal}
                className="rounded-lg px-2 py-1 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-900"
                type="button"
              >
                ✕
              </button>
            </div>

            {error && (
              <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-200">
                {error}
              </div>
            )}

            <div className="mt-4 grid grid-cols-1 gap-3">
              <div>
                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                  Title *
                </label>
                <input
                  className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20 dark:border-gray-800 dark:bg-gray-900 dark:text-white"
                  value={form.title}
                  onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                  placeholder="PV Inspection - V-101"
                />
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                    Equipment Tag
                  </label>
                  <input
                    className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20 dark:border-gray-800 dark:bg-gray-900 dark:text-white"
                    value={form.tag}
                    onChange={(e) => setForm((p) => ({ ...p, tag: e.target.value }))}
                    placeholder="PMT-12345"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                    Location
                  </label>
                  <input
                    className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20 dark:border-gray-800 dark:bg-gray-900 dark:text-white"
                    value={form.location}
                    onChange={(e) => setForm((p) => ({ ...p, location: e.target.value }))}
                    placeholder="Plant / Unit / Area"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                    Start *
                  </label>
                  <input
                    type="datetime-local"
                    className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20 dark:border-gray-800 dark:bg-gray-900 dark:text-white"
                    value={form.start_at}
                    onChange={(e) => setForm((p) => ({ ...p, start_at: e.target.value }))}
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                    End
                  </label>
                  <input
                    type="datetime-local"
                    className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20 dark:border-gray-800 dark:bg-gray-900 dark:text-white"
                    value={form.end_at}
                    onChange={(e) => setForm((p) => ({ ...p, end_at: e.target.value }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                    Status
                  </label>
                  <select
                    className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20 dark:border-gray-800 dark:bg-gray-900 dark:text-white"
                    value={form.status}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, status: e.target.value as InspectionStatus }))
                    }
                  >
                    <option value="planned">Planned</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>

                <div className="flex items-center gap-4 pt-6">
                  <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                    <input
                      type="checkbox"
                      checked={form.remind_1d}
                      onChange={(e) => setForm((p) => ({ ...p, remind_1d: e.target.checked }))}
                    />
                    Remind 1 day before
                  </label>

                  <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                    <input
                      type="checkbox"
                      checked={form.remind_1h}
                      onChange={(e) => setForm((p) => ({ ...p, remind_1h: e.target.checked }))}
                    />
                    Remind 1 hour before
                  </label>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                  Notes
                </label>
                <textarea
                  className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20 dark:border-gray-800 dark:bg-gray-900 dark:text-white"
                  rows={3}
                  value={form.notes}
                  onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
                  placeholder="Permit, access, safety notes, special tools..."
                />
              </div>
            </div>

            <div className="mt-6 flex items-center justify-between">
              <div>
                {form.id ? (
                  <button
                    onClick={submitDelete}
                    className="rounded-lg border border-red-300 bg-white px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 dark:border-red-900/40 dark:bg-gray-950 dark:text-red-300 dark:hover:bg-red-900/20"
                    type="button"
                  >
                    Delete
                  </button>
                ) : (
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    Tip: drag & drop events to reschedule
                  </span>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={closeModal}
                  className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-100 dark:hover:bg-gray-900"
                  type="button"
                >
                  Cancel
                </button>

                <button
                  onClick={form.id ? submitUpdate : submitCreate}
                  className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
                  type="button"
                >
                  {form.id ? "Save Changes" : "Create Inspection"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
