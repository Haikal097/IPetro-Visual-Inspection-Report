import React, { useEffect, useMemo, useState } from "react";
import AppLayout from "@/layouts/app-layout";
import { Head, router, usePage } from "@inertiajs/react";
import axios from "axios";
import { Plus, Pencil, Trash2, CheckCircle2, X, Wand2 } from "lucide-react";
import { toast, Toaster } from "react-hot-toast";

type EquipmentTemplate = {
  id: number;
  user_id: number | null;
  equipment_type: string;
  title: string | null;
  initial_finding: string | null;
  external_finding: string | null;
  internal_finding: string | null;
  ndt: string | null;
  recommendations: string | null;
  is_global: boolean;
  created_at: string;
  updated_at: string;
};

const api = axios.create({
  baseURL: "/api",
  headers: { Accept: "application/json" },
  withCredentials: true,
});

function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-3xl rounded-2xl bg-white dark:bg-gray-900 shadow-xl border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white">{title}</h3>
          <button
            onClick={onClose}
            className="rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <X className="h-5 w-5 text-gray-600 dark:text-gray-300" />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

export default function EquipmentTemplatesIndex() {
  const page = usePage().props as any;
  const role = String(page?.auth?.role ?? page?.auth?.user?.role ?? "").toLowerCase();

  const [templates, setTemplates] = useState<EquipmentTemplate[]>([]);
  const [loading, setLoading] = useState(false);

  // modals
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [activeEdit, setActiveEdit] = useState<EquipmentTemplate | null>(null);

  const emptyForm = {
    equipment_type: "",
    title: "",
    initial_finding: "",
    external_finding: "",
    internal_finding: "",
    ndt: "",
    recommendations: "",
    is_global: false,
  };

  const [form, setForm] = useState({ ...emptyForm });

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const res = await api.get("/equipment-templates");
      if (res.data?.success) setTemplates(res.data.data ?? []);
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Failed to load templates");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const openCreate = () => {
    setForm({ ...emptyForm });
    setCreateOpen(true);
  };

  const openEdit = (t: EquipmentTemplate) => {
    setActiveEdit(t);
    setForm({
      equipment_type: t.equipment_type ?? "",
      title: t.title ?? "",
      initial_finding: t.initial_finding ?? "",
      external_finding: t.external_finding ?? "",
      internal_finding: t.internal_finding ?? "",
      ndt: t.ndt ?? "",
      recommendations: t.recommendations ?? "",
      is_global: !!t.is_global,
    });
    setEditOpen(true);
  };

  const onChange =
    (key: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      setForm((prev) => ({ ...prev, [key]: e.target.value }));
    };

  const onToggleGlobal = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, is_global: e.target.checked }));
  };

  const createTemplate = async () => {
    if (!form.equipment_type.trim()) return toast.error("Equipment type is required");
    setLoading(true);
    try {
      const res = await api.post("/equipment-templates", form);
      if (res.data?.success) {
        toast.success("Template created");
        setCreateOpen(false);
        fetchTemplates();
      }
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Create failed");
    } finally {
      setLoading(false);
    }
  };

  const updateTemplate = async () => {
    if (!activeEdit) return;
    if (!form.equipment_type.trim()) return toast.error("Equipment type is required");
    setLoading(true);
    try {
      const res = await api.put(`/equipment-templates/${activeEdit.id}`, form);
      if (res.data?.success) {
        toast.success("Template updated");
        setEditOpen(false);
        setActiveEdit(null);
        fetchTemplates();
      }
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Update failed");
    } finally {
      setLoading(false);
    }
  };

  const deleteTemplate = async (t: EquipmentTemplate) => {
    const ok = confirm(`Delete template "${t.title || t.equipment_type}"?`);
    if (!ok) return;

    setLoading(true);
    try {
      const res = await api.delete(`/equipment-templates/${t.id}`);
      if (res.data?.success) {
        toast.success("Template deleted");
        fetchTemplates();
      }
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Delete failed");
    } finally {
      setLoading(false);
    }
  };

  const useTemplate = (t: EquipmentTemplate) => {
    // open PV report and let PVReport auto-apply by query param
    router.visit(`/pv-report?template_id=${t.id}`);
  };

  return (
    <AppLayout breadcrumbs={[{ title: "Equipment Templates", href: "/equipment-templates" }]}>
      <Head title="Equipment Templates" />
      <Toaster position="top-right" />

      <div className="max-w-6xl mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Equipment Templates</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Create templates for initial/external/internal/NDT/recommendations and reuse them in PV reports.
            </p>
          </div>

          <button
            onClick={openCreate}
            className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700"
          >
            <Plus className="h-4 w-4" />
            New Template
          </button>
        </div>

        <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <div className="text-sm font-semibold text-gray-900 dark:text-white">
              Templates ({templates.length})
            </div>
            {loading && <div className="text-sm text-gray-500">Loading...</div>}
          </div>

          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr className="text-left">
                  <th className="px-5 py-3 font-semibold text-gray-700 dark:text-gray-200">Equipment Type</th>
                  <th className="px-5 py-3 font-semibold text-gray-700 dark:text-gray-200">Title</th>
                  <th className="px-5 py-3 font-semibold text-gray-700 dark:text-gray-200">Scope</th>
                  <th className="px-5 py-3 font-semibold text-gray-700 dark:text-gray-200 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {templates.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-5 py-8 text-center text-gray-500">
                      No templates yet. Click “New Template”.
                    </td>
                  </tr>
                ) : (
                  templates.map((t) => (
                    <tr
                      key={t.id}
                      className="border-t border-gray-100 dark:border-gray-800 hover:bg-gray-50/60 dark:hover:bg-gray-800/40"
                    >
                      <td className="px-5 py-3 font-medium text-gray-900 dark:text-white">{t.equipment_type}</td>
                      <td className="px-5 py-3 text-gray-700 dark:text-gray-300">{t.title || "-"}</td>
                      <td className="px-5 py-3">
                        {t.is_global ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 text-emerald-700 px-3 py-1 text-xs font-semibold dark:bg-emerald-900/30 dark:text-emerald-300">
                            <CheckCircle2 className="h-4 w-4" />
                            Global
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-full bg-gray-100 text-gray-700 px-3 py-1 text-xs font-semibold dark:bg-gray-800 dark:text-gray-300">
                            Personal
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => useTemplate(t)}
                            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 dark:border-gray-700 px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-800"
                          >
                            <Wand2 className="h-4 w-4" />
                            Use
                          </button>

                          <button
                            onClick={() => openEdit(t)}
                            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 dark:border-gray-700 px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-800"
                          >
                            <Pencil className="h-4 w-4" />
                            Edit
                          </button>

                          <button
                            onClick={() => deleteTemplate(t)}
                            className="inline-flex items-center gap-2 rounded-lg border border-red-300 text-red-700 dark:border-red-800 dark:text-red-300 px-3 py-2 hover:bg-red-50 dark:hover:bg-red-900/20"
                          >
                            <Trash2 className="h-4 w-4" />
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* CREATE MODAL */}
        <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Create Equipment Template">
          <TemplateForm
            form={form}
            onChange={onChange}
            onToggleGlobal={onToggleGlobal}
            showGlobalToggle={role === "admin"}
          />
          <div className="mt-5 flex justify-end gap-2">
            <button
              onClick={() => setCreateOpen(false)}
              className="rounded-lg border border-gray-300 dark:border-gray-700 px-4 py-2 text-sm font-semibold hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              Cancel
            </button>
            <button
              onClick={createTemplate}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
              disabled={loading}
            >
              Create
            </button>
          </div>
        </Modal>

        {/* EDIT MODAL */}
        <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Edit Equipment Template">
          <TemplateForm
            form={form}
            onChange={onChange}
            onToggleGlobal={onToggleGlobal}
            showGlobalToggle={role === "admin"}
          />
          <div className="mt-5 flex justify-end gap-2">
            <button
              onClick={() => setEditOpen(false)}
              className="rounded-lg border border-gray-300 dark:border-gray-700 px-4 py-2 text-sm font-semibold hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              Cancel
            </button>
            <button
              onClick={updateTemplate}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
              disabled={loading}
            >
              Save Changes
            </button>
          </div>
        </Modal>
      </div>
    </AppLayout>
  );
}

function TemplateForm({
  form,
  onChange,
  onToggleGlobal,
  showGlobalToggle,
}: {
  form: any;
  onChange: (key: string) => any;
  onToggleGlobal: (e: React.ChangeEvent<HTMLInputElement>) => void;
  showGlobalToggle: boolean;
}) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-gray-900 dark:text-white">Equipment Type *</label>
          <input
            value={form.equipment_type}
            onChange={onChange("equipment_type")}
            className="mt-1 w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 px-3 py-2 text-sm"
            placeholder="e.g. Nitrogen Vessel"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-gray-900 dark:text-white">Title</label>
          <input
            value={form.title}
            onChange={onChange("title")}
            className="mt-1 w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 px-3 py-2 text-sm"
            placeholder='e.g. "Nitrogen Vessel - Standard"'
          />
        </div>
      </div>

      {showGlobalToggle && (
        <label className="inline-flex items-center gap-2 text-sm text-gray-800 dark:text-gray-200">
          <input type="checkbox" checked={!!form.is_global} onChange={onToggleGlobal} />
          Global template (Admin)
        </label>
      )}

      <div className="grid grid-cols-1 gap-3">
        <FieldArea label="Initial Finding" value={form.initial_finding} onChange={onChange("initial_finding")} />
        <FieldArea label="External Inspection" value={form.external_finding} onChange={onChange("external_finding")} />
        <FieldArea label="Internal Inspection" value={form.internal_finding} onChange={onChange("internal_finding")} />
        <FieldArea label="NDT Results" value={form.ndt} onChange={onChange("ndt")} />
        <FieldArea label="Recommendations" value={form.recommendations} onChange={onChange("recommendations")} />
      </div>
    </div>
  );
}

function FieldArea({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: any;
}) {
  return (
    <div>
      <label className="text-sm font-medium text-gray-900 dark:text-white">{label}</label>
      <textarea
        value={value}
        onChange={onChange}
        className="mt-1 w-full min-h-[110px] rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 px-3 py-2 text-sm"
        placeholder={`Enter ${label.toLowerCase()}...`}
      />
    </div>
  );
}
