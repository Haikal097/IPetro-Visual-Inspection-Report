console.log("test1.js loaded");

const { useEffect, useMemo, useRef, useState } = React;

const uid = () => Math.random().toString(36).slice(2, 10);

function PhotoEditor() {
  const [imageSrc, setImageSrc] = useState(null);
  const [imgNatural, setImgNatural] = useState(null);

  const [highlights, setHighlights] = useState([]);
  const [activeId, setActiveId] = useState(null);

  // Default is PAN. If this is true, we DRAW.
  const [isDrawMode, setIsDrawMode] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [cursorStyle, setCursorStyle] = useState("grab"); // grab, grabbing, crosshair

  // Position State (Stored in Ref for performance, but triggers render)
  const panRef = useRef({ x: 0, y: 0 }); 
  
  // Dragging Logic Refs
  const dragRef = useRef({ 
    startX: 0, startY: 0, 
    initialPanX: 0, initialPanY: 0, 
    isDragging: false 
  });

  const drawingRef = useRef({ 
    startX: 0, startY: 0, currentX: 0, currentY: 0, drawing: false 
  });

  const imgRef = useRef(null);
  const stageRef = useRef(null);
  const zoomCanvasRef = useRef(null);

  // Displayed size
  const viewSize = useMemo(() => {
    if (!imgRef.current) return { w: 0, h: 0 };
    return { w: imgRef.current.clientWidth, h: imgRef.current.clientHeight };
  }, [imageSrc, imgNatural]);

  // Scale factor
  const scale = useMemo(() => {
    if (!imgNatural || !viewSize.w || !viewSize.h) return 1;
    return viewSize.w / imgNatural.w;
  }, [imgNatural, viewSize]);

  const imgToView = (x, y) => ({ x: x * scale, y: y * scale });
  const viewToImg = (x, y) => ({ x: x / scale, y: y / scale });

  // Upload
  const onPickImage = (file) => {
    const reader = new FileReader();
    reader.onload = () => setImageSrc(reader.result);
    reader.readAsDataURL(file);
  };

  const onImageLoad = (e) => {
    const el = e.currentTarget;
    setImgNatural({ w: el.naturalWidth, h: el.naturalHeight });
    setZoomLevel(1);
    panRef.current = { x: 0, y: 0 };
  };

  // --- POINTER EVENTS (THE FIX) ---

  const onPointerDown = (e) => {
    if (!stageRef.current) return;
    
    // 1. Capture the pointer so dragging doesn't get lost
    e.currentTarget.setPointerCapture(e.pointerId);

    const rect = stageRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    if (isDrawMode) {
      // DRAW MODE
      const drawX = mouseX - panRef.current.x;
      const drawY = mouseY - panRef.current.y;
      drawingRef.current = { startX: drawX, startY: drawY, currentX: drawX, currentY: drawY, drawing: true };
    } else {
      // PAN MODE (Default)
      setCursorStyle("grabbing"); // visual feedback
      dragRef.current.isDragging = true;
      dragRef.current.startX = e.clientX;
      dragRef.current.startY = e.clientY;
      dragRef.current.initialPanX = panRef.current.x;
      dragRef.current.initialPanY = panRef.current.y;
    }
  };

  const onPointerMove = (e) => {
    if (!stageRef.current) return;

    if (isDrawMode && drawingRef.current.drawing) {
      // DRAWING LOGIC
      const rect = stageRef.current.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      drawingRef.current.currentX = mouseX - panRef.current.x;
      drawingRef.current.currentY = mouseY - panRef.current.y;
      setActiveId(prev => prev); // force render
    } 
    else if (!isDrawMode && dragRef.current.isDragging) {
      // PANNING LOGIC
      const dx = e.clientX - dragRef.current.startX;
      const dy = e.clientY - dragRef.current.startY;
      
      panRef.current.x = dragRef.current.initialPanX + dx;
      panRef.current.y = dragRef.current.initialPanY + dy;
      
      setActiveId(prev => prev); // force render
    }
  };

  const onPointerUp = (e) => {
    // Release the capture
    e.currentTarget.releasePointerCapture(e.pointerId);

    if (isDrawMode && drawingRef.current.drawing) {
      // FINISH DRAWING
      if (imgNatural) {
        const { startX, startY, currentX, currentY } = drawingRef.current;
        const xV = Math.min(startX, currentX);
        const yV = Math.min(startY, currentY);
        const wV = Math.abs(currentX - startX);
        const hV = Math.abs(currentY - startY);
        if (wV > 4 && hV > 4) {
          const p1 = viewToImg(xV, yV);
          const p2 = viewToImg(xV + wV, yV + hV);
          const newRect = {
            x: clamp(p1.x, 0, imgNatural.w),
            y: clamp(p1.y, 0, imgNatural.h),
            w: clamp(p2.x - p1.x, 1, imgNatural.w),
            h: clamp(p2.y - p1.y, 1, imgNatural.h),
          };
          const newHl = { id: uid(), rect: newRect, comment: "", color: pickColor() };
          setHighlights((arr) => [...arr, newHl]);
          setActiveId(newHl.id);
        }
      }
      drawingRef.current.drawing = false;
    } 
    else if (!isDrawMode) {
      // FINISH PANNING
      dragRef.current.isDragging = false;
      setCursorStyle("grab");
    }
  };

  // --- RENDER ZOOM ---
  const renderZoom = () => {
    const ctx = zoomCanvasRef.current && zoomCanvasRef.current.getContext("2d");
    if (!ctx || !imgRef.current || !imgNatural) return;
    const img = imgRef.current;
    const canvas = zoomCanvasRef.current;
    const target = highlights.find((h) => h.id === activeId);

    const container = canvas.parentElement;
    const cw = container.clientWidth;
    const ch = container.clientHeight;
    canvas.width = cw;
    canvas.height = ch;

    ctx.clearRect(0, 0, cw, ch);
    if (!target) return;

    const { x, y, w, h } = target.rect;
    const sx = cw / w;
    const sy = ch / h;
    const s = Math.min(sx, sy) * zoomLevel;
    const drawW = w * s;
    const drawH = h * s;
    const dx = (cw - drawW) / 2;
    const dy = (ch - drawH) / 2;

    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(img, x, y, w, h, dx, dy, drawW, drawH);
    ctx.lineWidth = 2;
    ctx.strokeStyle = "#10b981";
    ctx.strokeRect(dx, dy, drawW, drawH);
  };

  useEffect(() => { renderZoom(); }, [activeId, zoomLevel, highlights, imageSrc]);

  const updateComment = (id, text) =>
    setHighlights((arr) => arr.map((h) => (h.id === id ? { ...h, comment: text } : h)));

  const deleteHighlight = (id) => {
    setHighlights((arr) => arr.filter((h) => h.id !== id));
    if (activeId === id) setActiveId(null);
  };

  const clearAll = () => { setHighlights([]); setActiveId(null); };

  const exportJSON = () => {
    if (!imgNatural) return;
    const payload = { imageMeta: { naturalWidth: imgNatural.w, naturalHeight: imgNatural.h }, highlights };
    downloadBlob(JSON.stringify(payload, null, 2), `annotations-${Date.now()}.json`, "application/json");
  };

  const importJSON = (file) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(String(reader.result));
        if (Array.isArray(data.highlights)) setHighlights(data.highlights);
      } catch (e) { alert("Invalid JSON file."); }
    };
    reader.readAsText(file);
  };

  const onWheel = (e) => {
    if (!e.ctrlKey) return;
    e.preventDefault();
    const dir = Math.sign(e.deltaY);
    setZoomLevel((z) => clamp(z * (dir > 0 ? 0.9 : 1.1), 0.25, 10));
  };

  // --- TOGGLE HANDLER ---
  const toggleDrawMode = () => {
    setIsDrawMode((prev) => {
      const next = !prev;
      setCursorStyle(next ? "crosshair" : "grab");
      return next;
    });
  };

  return (
    <div className="min-h-screen w-full bg-slate-900 text-slate-100 font-sans">
      {/* Header */}
      <header className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-slate-700 bg-slate-900/90 px-4 py-3 backdrop-blur">
        <h1 className="text-lg md:text-xl font-semibold tracking-tight">Photo Editor</h1>
        <div className="flex items-center gap-2">
          <label className="cursor-pointer rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs hover:bg-slate-700 transition">
            <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && onPickImage(e.target.files[0])} />
            Upload Image
          </label>

          <label className="cursor-pointer rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs hover:bg-slate-700 transition">
            <input type="file" accept="application/json" className="hidden" onChange={(e) => e.target.files?.[0] && importJSON(e.target.files[0])} />
            Import JSON
          </label>

          <button onClick={exportJSON} className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs hover:bg-slate-700 transition" disabled={!highlights.length}>
            Export JSON
          </button>

          <div className="h-6 w-px bg-slate-700 mx-1"></div>

          {/* TOGGLE DRAW MODE */}
          <button
            onClick={toggleDrawMode}
            className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
              isDrawMode 
                ? "bg-emerald-500 text-white ring-2 ring-emerald-500/50" 
                : "bg-slate-800 text-slate-400 hover:bg-slate-700 border border-slate-700"
            }`}
          >
            {isDrawMode ? (
              <><span>✏️ Drawing: ON</span></>
            ) : (
              <><span>✋ Pan Mode</span></>
            )}
          </button>

          <button onClick={clearAll} className="rounded-lg border border-red-900/50 text-red-400 px-3 py-1.5 text-xs hover:bg-red-900/20 transition" disabled={!highlights.length}>
            Clear
          </button>
        </div>
      </header>

      {/* Main Layout */}
      <div className="grid grid-cols-1 gap-4 p-4 md:grid-cols-12 h-[calc(100vh-64px)]">
        
        {/* Stage */}
        <div className="md:col-span-8 lg:col-span-9 h-full flex flex-col">
          <div className="relative flex-1 overflow-hidden rounded-xl border border-slate-700 bg-slate-950 shadow-2xl">
            {!imageSrc ? (
              <EmptyState onDemo={() => setImageSrc(PLACEHOLDER_IMG)} />
            ) : (
              <div
                ref={stageRef}
                className="relative h-full w-full touch-none"
                style={{ cursor: cursorStyle }}
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onWheel={onWheel}
              >
                {/* TRANSFORM CONTAINER */}
                <div 
                  style={{ 
                    transform: `translate(${panRef.current.x}px, ${panRef.current.y}px)`,
                    transformOrigin: "0 0",
                    willChange: "transform",
                    pointerEvents: "none" // Let clicks pass through to container, but we handle logic in parent
                  }}
                >
                  <img
                    ref={imgRef}
                    src={imageSrc}
                    alt="Workplace"
                    onLoad={onImageLoad}
                    className="select-none max-w-none"
                    draggable={false}
                    style={{ display: "block" }}
                  />

                  {/* OVERLAY (Annotations) */}
                  <div className="absolute left-0 top-0 w-full h-full">
                    {highlights.map((h) => {
                      const { x, y } = imgToView(h.rect.x, h.rect.y);
                      const { x: wv } = imgToView(h.rect.w, 0);
                      const { y: hv } = imgToView(0, h.rect.h);
                      const isActive = h.id === activeId;
                      return (
                        <div
                          key={h.id}
                          className="absolute pointer-events-auto"
                          style={{
                            left: x, top: y, width: wv, height: hv,
                            border: isActive ? `2px solid ${h.color}` : `2px dashed ${h.color}`,
                            background: isActive ? "rgba(255,255,255,0.1)" : "transparent",
                            cursor: "pointer"
                          }}
                          onPointerDown={(e) => {
                             // Allow clicking a box without triggering a drag if we just want to select
                             e.stopPropagation(); 
                             setActiveId(h.id);
                          }}
                        />
                      );
                    })}

                    {/* DRAWING GHOST */}
                    {isDrawMode && drawingRef.current.drawing && (
                      <div
                        className="absolute border-2 border-emerald-400 bg-emerald-400/20"
                        style={{
                          left: Math.min(drawingRef.current.startX, drawingRef.current.currentX),
                          top: Math.min(drawingRef.current.startY, drawingRef.current.currentY),
                          width: Math.abs(drawingRef.current.currentX - drawingRef.current.startX),
                          height: Math.abs(drawingRef.current.currentY - drawingRef.current.startY),
                        }}
                      />
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
          <div className="mt-2 text-center text-xs text-slate-500">
             {isDrawMode ? "Click and drag to Highlight." : "Click and drag to Pan image. Ctrl+Scroll to Zoom."}
          </div>
        </div>

        {/* Sidebar */}
        <div className="md:col-span-4 lg:col-span-3 flex flex-col gap-4 h-full overflow-hidden">
          {/* Zoom Preview */}
          <div className="shrink-0 rounded-xl border border-slate-700 bg-slate-900">
             <div className="flex items-center justify-between border-b border-slate-800 px-3 py-2">
                <span className="text-xs font-semibold text-slate-300">Zoom Preview</span>
                <div className="flex gap-1">
                  <button className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-xs" onClick={()=>setZoomLevel(z=>Math.max(0.1, z*0.9))}>-</button>
                  <span className="text-xs w-8 text-center">{zoomLevel.toFixed(1)}x</span>
                  <button className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-xs" onClick={()=>setZoomLevel(z=>Math.min(10, z*1.1))}>+</button>
                </div>
             </div>
             <div className="relative h-48 w-full overflow-hidden bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')]">
                <canvas ref={zoomCanvasRef} className="h-full w-full object-contain" />
             </div>
          </div>

          {/* List */}
          <div className="flex-1 overflow-hidden rounded-xl border border-slate-700 bg-slate-900 flex flex-col">
            <div className="border-b border-slate-800 px-3 py-2 text-xs font-semibold text-slate-300">
               Annotations ({highlights.length})
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-2">
              {!highlights.length && <div className="p-4 text-center text-xs text-slate-500">No highlights yet.</div>}
              {highlights.map((h, i) => (
                <div key={h.id} 
                     className={`rounded-lg border p-2 transition ${h.id === activeId ? "border-emerald-500 bg-emerald-500/10" : "border-slate-800 bg-slate-800/50"}`}
                     onClick={() => setActiveId(h.id)}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-bold text-slate-300" style={{color: h.color}}>#{i+1} Highlight</span>
                    <button className="text-[10px] text-red-400 hover:text-red-300" onClick={(e)=>{ e.stopPropagation(); deleteHighlight(h.id); }}>Delete</button>
                  </div>
                  <textarea 
                    className="w-full bg-slate-950 border border-slate-800 rounded p-1.5 text-xs text-slate-200 resize-none focus:border-emerald-500 outline-none"
                    rows={2}
                    placeholder="Add comment..."
                    value={h.comment}
                    onChange={(e) => updateComment(h.id, e.target.value)}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

// Helpers
function clamp(n, min, max) { return Math.max(min, Math.min(max, n)); }
function downloadBlob(content, filename, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
function pickColor() {
  const palette = ["#f59e0b", "#10b981", "#3b82f6", "#eab308", "#ec4899", "#8b5cf6"];
  return palette[Math.floor(Math.random() * palette.length)];
}
function EmptyState({ onDemo }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 p-10 text-center">
      <div className="text-slate-500 text-sm">
        <p className="mb-2">Upload an image to begin.</p>
        <p>Pan is enabled by default.</p>
      </div>
      <button onClick={onDemo} className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-sm hover:bg-slate-700 transition">
        Load Demo Image
      </button>
    </div>
  );
}

const PLACEHOLDER_IMG = "https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=2400&auto=format&fit=crop";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<PhotoEditor />);