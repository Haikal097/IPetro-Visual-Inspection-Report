import React, { useEffect, useRef, useState } from "react";
import { Link, router, usePage } from "@inertiajs/react";

type PageProps = {
  flash?: { success?: string };
  errors?: Record<string, string>;
};

export default function Signature() {
  const { flash, errors } = usePage<PageProps>().props;

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);

  const [drawing, setDrawing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  // ✅ Setup canvas for crisp drawing + correct coords on high DPI screens
  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;

    const dpr = window.devicePixelRatio || 1;

    // Make canvas fill the CSS size, then scale internal pixels for sharpness
    const rect = c.getBoundingClientRect();
    c.width = Math.round(rect.width * dpr);
    c.height = Math.round(rect.height * dpr);

    const ctx = c.getContext("2d");
    if (!ctx) return;

    // draw in CSS pixel units
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.lineWidth = 2.2;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#000";

    ctxRef.current = ctx;
  }, []);

  const getPos = (e: React.PointerEvent) => {
    const c = canvasRef.current!;
    const r = c.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };

  const onDown = (e: React.PointerEvent) => {
    const c = canvasRef.current;
    const ctx = ctxRef.current;
    if (!c || !ctx) return;

    e.preventDefault();
    c.setPointerCapture(e.pointerId);

    setDrawing(true);
    setStatusMsg(null);

    const { x, y } = getPos(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const onMove = (e: React.PointerEvent) => {
    if (!drawing) return;
    const ctx = ctxRef.current;
    if (!ctx) return;

    e.preventDefault();
    const { x, y } = getPos(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const onUp = (e?: React.PointerEvent) => {
    e?.preventDefault();
    setDrawing(false);
  };

  const clear = () => {
    const c = canvasRef.current;
    const ctx = ctxRef.current;
    if (!c || !ctx) return;

    const rect = c.getBoundingClientRect();
    ctx.clearRect(0, 0, rect.width, rect.height);
    ctx.beginPath();

    setStatusMsg(null);
  };

  // ✅ prevent saving empty signature
  const isBlank = () => {
    const c = canvasRef.current;
    if (!c) return true;

    const tmp = document.createElement("canvas");
    tmp.width = c.width;
    tmp.height = c.height;

    return c.toDataURL() === tmp.toDataURL();
  };

  const save = () => {
    const c = canvasRef.current;
    if (!c) return;

    if (isBlank()) {
      setStatusMsg("⚠️ Please sign first before saving.");
      return;
    }

    const signature_data = c.toDataURL("image/png");

    router.post(
      "/profile/signature",
      { signature_data },
      {
        preserveScroll: true,
        onStart: () => {
          setSaving(true);
          setStatusMsg("Saving signature...");
        },
        onSuccess: () => {
          setStatusMsg("✅ Signature saved successfully!");
        },
        onError: () => {
          setStatusMsg("❌ Failed to save signature. Try again.");
        },
        onFinish: () => {
          setSaving(false);
        },
      }
    );
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h1 className="text-xl font-semibold text-white">
          Inspector Digital Signature
        </h1>

        <Link
          href="/dashboard"
          className="px-3 py-2 rounded-md border border-gray-700 text-sm text-white hover:bg-gray-800"
        >
          ← Back to Dashboard
        </Link>
      </div>

      {/* Server flash */}
      {flash?.success && (
        <div className="mb-3 rounded-md border border-green-300 bg-green-50 text-green-800 px-4 py-2">
          {flash.success}
        </div>
      )}

      {/* Client status */}
      {statusMsg && (
        <div className="mb-3 rounded-md border border-gray-700 bg-gray-900 text-gray-100 px-4 py-2">
          {statusMsg}
        </div>
      )}

      {/* Laravel validation error */}
      {errors?.signature_data && (
        <div className="mb-3 rounded-md border border-red-300 bg-red-50 text-red-800 px-4 py-2">
          {errors.signature_data}
        </div>
      )}

      {/* Canvas */}
      <div className="border border-gray-700 rounded-lg bg-white p-3">
        <canvas
          ref={canvasRef}
          className="signature-canvas w-full h-[240px] bg-white touch-none select-none"
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerCancel={onUp}
          onPointerLeave={onUp}
        />
      </div>

      <div className="flex gap-3 mt-4">
        <button
          onClick={clear}
          className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300"
          type="button"
        >
          Clear
        </button>

        <button
          onClick={save}
          disabled={saving}
          className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700 disabled:opacity-60"
          type="button"
        >
          {saving ? "Saving..." : "Save Signature"}
        </button>
      </div>

      <p className="text-sm text-gray-400 mt-3">
        Your signature will be automatically inserted into every report you
        finalize, together with the timestamp.
      </p>
    </div>
  );
}
