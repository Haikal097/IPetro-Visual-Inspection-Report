import React, { useRef, useState } from "react";
import { router, usePage } from "@inertiajs/react";

type PageProps = {
  flash?: { success?: string };
  errors?: Record<string, string>;
};

export default function Signature() {
  const { flash, errors } = usePage<PageProps>().props;

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [drawing, setDrawing] = useState(false);

  const getPos = (e: React.PointerEvent) => {
    const c = canvasRef.current!;
    const r = c.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };

  const onDown = (e: React.PointerEvent) => {
    const c = canvasRef.current;
    if (!c) return;

    c.setPointerCapture(e.pointerId);
    setDrawing(true);

    const ctx = c.getContext("2d");
    if (!ctx) return;

    ctx.beginPath();
    const { x, y } = getPos(e);
    ctx.moveTo(x, y);
  };

  const onMove = (e: React.PointerEvent) => {
    if (!drawing) return;
    const c = canvasRef.current;
    if (!c) return;

    const ctx = c.getContext("2d");
    if (!ctx) return;

    const { x, y } = getPos(e);

    ctx.lineWidth = 2.2;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#000";
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const onUp = () => setDrawing(false);

  const clear = () => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, c.width, c.height);
    ctx.beginPath();
  };

  const save = () => {
  const c = canvasRef.current;
  if (!c) return;

  const signature_data = c.toDataURL("image/png");

  router.post(
    "/profile/signature",
    { signature_data },
    { preserveScroll: true }
  );
};

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-xl font-semibold mb-3">Inspector Digital Signature</h1>

      {flash?.success && (
        <div className="mb-3 rounded-md border border-green-300 bg-green-50 text-green-800 px-4 py-2">
          {flash.success}
        </div>
      )}

      {errors?.signature_data && (
        <div className="mb-3 rounded-md border border-red-300 bg-red-50 text-red-800 px-4 py-2">
          {errors.signature_data}
        </div>
      )}

      <div className="border rounded-lg bg-white p-3">
        <canvas
          ref={canvasRef}
          width={760}
          height={240}
          className="w-full touch-none"
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerLeave={onUp}
        />
      </div>

      <div className="flex gap-3 mt-4">
        <button onClick={clear} className="px-4 py-2 rounded bg-gray-200">
          Clear
        </button>
        <button onClick={save} className="px-4 py-2 rounded bg-red-600 text-white">
          Save Signature
        </button>
      </div>

      <p className="text-sm text-gray-500 mt-3">
        Your signature will be automatically inserted into every report you finalize, together with the timestamp.
      </p>
    </div>
  );
}
