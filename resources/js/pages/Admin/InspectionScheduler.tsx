import React, { useEffect, useMemo, useState } from "react";
import { Head, router } from "@inertiajs/react";
import AdminLayout from "@/layouts/AdminLayout";

import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";

type InspectionStatus = "planned" | "in_progress" | "completed" | "cancelled";

type Inspector = {
  id: number;
  name: string;
  email: string;
};

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
    assigned_to?: number | null;
  };
};

type FormState = {
  id?: number;
  assigned_to: number | "";
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

export default function InspectionScheduler({
  inspectors,
  defaultInspectorId,
}: {
  inspectors: Inspector[];
  defaultInspectorId: number | null;
}) {
  const [selectedInspector, setSelectedInspector] = useState<number | "">(
    defaultInspectorId ?? ""
  );

  const [events, setEvents] = useState<InspectionEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>({
    assigned_to: defaultInspectorId ?? "",
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
    () => [{ title: "Inspection Scheduler", href: "/admin/inspection-scheduler" }],
    []
  );

  async function loadEvents(inspectorId: number | "") {
    setLoading(true);
    try {
      const qs = inspectorId ? `?assigned_to=${inspectorId}` : "";
      const res = await fetch(`/admin/inspection-scheduler/events${qs}`, {
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
    loadEvents(selectedInspector);
  }, [selectedInspector]);

  function openCreateModal(startIso: string, endIso?: string | null) {
    setError(null);
    setForm({
      assigned_to: selectedInspector || defaultInspectorId || "",
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
      assigned_to: p.assigned_to ?? selectedInspector ?? defaultInspectorId ?? "",
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
    if (!f.assigned_to) return "Inspector is required.";
    if (!f.title.trim()) return "Title is required.";
    if (!f.start_at) return "Start date/time is required.";
    if (f.end_at && f.end_at < f.start_at) return "End time must be after start time.";
    return null;
  }

  function submitCreate() {
    const msg = validateForm(form);
    if (msg) return setError(msg);

    router.post(
      "/admin/inspection-scheduler",
      {
        assigned_to: form.assigned_to,
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
          await loadEvents(selectedInspector);
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
      `/admin/inspection-scheduler/${form.id}`,
      {
        assigned_to: form.assigned_to,
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
          await loadEvents(selectedInspector);
        },
        onError: () => setError("Failed to update inspection."),
      }
    );
  }

  function submitDelete() {
    if (!form.id) return;
    if (!confirm("Delete this inspection?")) return;

    router.delete(`/admin/inspection-scheduler/${form.id}`, {
      preserveScroll: true,
      onSuccess: async () => {
        closeModal();
        await loadEvents(selectedInspector);
      },
      onError: () => setError("Failed to delete inspection."),
    });
  }

  function statusColor(status?: InspectionStatus) {
    switch (status) {
      case "planned":
        return "#ef4444";
      case "in_progress":
        return "#f59e0b";
      case "completed":
        return "#10b981";
      case "cancelled":
        return "#6b7280";
      default:
        return "#ef4444";
    }
  }

  return (
    <AdminLayout>
      <Head title="Inspection Scheduler | iPetro" />

      <div className="p-6 space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Inspection Scheduler</h1>
            <p className="text-sm text-gray-600">
              Assign inspections to inspectors and schedule reminders
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
            <select
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900"
              value={selectedInspector}
              onChange={(e) => setSelectedInspector(e.target.value ? Number(e.target.value) : "")}
            >
              <option value="">All Inspectors</option>
              {inspectors.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.email})
                </option>
              ))}
            </select>

            <button
              onClick={() => openCreateModal(new Date().toISOString())}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
              type="button"
            >
              + New Schedule
            </button>

            <button
              onClick={() => loadEvents(selectedInspector)}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-50"
              type="button"
            >
              Refresh
            </button>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-3 shadow-sm">
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
              eventDrop={(info) => openEditModal(info.event)}
              eventResize={(info) => openEditModal(info.event)}

              // ✅ ADDED (useful): show current time line and show time in month view
              nowIndicator={true}
              eventTimeFormat={{
                hour: "2-digit",
                minute: "2-digit",
                hour12: true,
              }}

              // ✅ ADDED (useful): better time grid range
              slotMinTime={"06:00:00"}
              slotMaxTime={"22:00:00"}

              // ✅ ADDED (optional): keep weekends visible
              weekends={true}

              // ✅ ADDED (optional): show business hours shading
              businessHours={{
                daysOfWeek: [1, 2, 3, 4, 5], // Mon-Fri
                startTime: "08:00",
                endTime: "18:00",
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
          <div className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  {form.id ? "Edit Schedule" : "New Schedule"}
                </h2>
                <p className="text-sm text-gray-500">
                  Assign an inspector + set date/time
                </p>
              </div>
              <button
                onClick={closeModal}
                className="rounded-lg px-2 py-1 text-gray-500 hover:bg-gray-100"
                type="button"
              >
                ✕
              </button>
            </div>

            {error && (
              <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <div className="mt-4 grid grid-cols-1 gap-3">
              <div>
                <label className="text-xs font-semibold text-gray-700">Inspector *</label>
                <select
                  className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900"
                  value={form.assigned_to}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, assigned_to: e.target.value ? Number(e.target.value) : "" }))
                  }
                >
                  <option value="">Select inspector</option>
                  {inspectors.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.email})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700">Title *</label>
                <input
                  className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900"
                  value={form.title}
                  onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                  placeholder="PV Inspection - V-101"
                />
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-semibold text-gray-700">Equipment Tag</label>
                  <input
                    className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900"
                    value={form.tag}
                    onChange={(e) => setForm((p) => ({ ...p, tag: e.target.value }))}
                    placeholder="PMT-12345"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-700">Location</label>
                  <input
                    className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900"
                    value={form.location}
                    onChange={(e) => setForm((p) => ({ ...p, location: e.target.value }))}
                    placeholder="Plant / Unit / Area"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-semibold text-gray-700">Start *</label>
                  <input
                    type="datetime-local"
                    className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900"
                    value={form.start_at}
                    onChange={(e) => setForm((p) => ({ ...p, start_at: e.target.value }))}
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-700">End</label>
                  <input
                    type="datetime-local"
                    className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900"
                    value={form.end_at}
                    onChange={(e) => setForm((p) => ({ ...p, end_at: e.target.value }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-semibold text-gray-700">Status</label>
                  <select
                    className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900"
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
                  <label className="flex items-center gap-2 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      checked={form.remind_1d}
                      onChange={(e) => setForm((p) => ({ ...p, remind_1d: e.target.checked }))}
                    />
                    Remind 1 day
                  </label>

                  <label className="flex items-center gap-2 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      checked={form.remind_1h}
                      onChange={(e) => setForm((p) => ({ ...p, remind_1h: e.target.checked }))}
                    />
                    Remind 1 hour
                  </label>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700">Notes</label>
                <textarea
                  className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900"
                  rows={3}
                  value={form.notes}
                  onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
                  placeholder="Permit, access, safety notes..."
                />
              </div>
            </div>

            <div className="mt-6 flex items-center justify-between">
              <div>
                {form.id ? (
                  <button
                    onClick={submitDelete}
                    className="rounded-lg border border-red-300 bg-white px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50"
                    type="button"
                  >
                    Delete
                  </button>
                ) : (
                  <span className="text-xs text-gray-500">
                    Tip: select a date range to schedule quickly
                  </span>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={closeModal}
                  className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-50"
                  type="button"
                >
                  Cancel
                </button>

                {form.id ? (
                  <button
                    onClick={submitUpdate}
                    className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
                    type="button"
                  >
                    Save Changes
                  </button>
                ) : (
                  <button
                    onClick={submitCreate}
                    className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
                    type="button"
                  >
                    Assign Schedule
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
