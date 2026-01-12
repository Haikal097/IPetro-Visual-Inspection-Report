import { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";

type Msg = { role: "user" | "assistant"; content: string };

type SessionRow = {
  id: number;
  title: string | null;
  last_message_at: string | null;
  created_at: string | null;
  provider?: string | null;
  model?: string | null;
  status?: string | null;
};

type Props = {
  open: boolean;
  onClose: () => void;
  context?: any;
};

const GREETING: Msg = {
  role: "assistant",
  content:
    "Hi 👋 I’m your Inspector AI. Ask me anything about PV inspection wording, findings structure, recommendations, or what to write next.",
};

export default function InspectorChat({ open, onClose, context = {} }: Props) {
  const [messages, setMessages] = useState<Msg[]>([GREETING]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  // ✅ NEW: session handling
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);

  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  // ✅ Load sessions when chat opens
  useEffect(() => {
    if (!open) return;

    const load = async () => {
      try {
        setLoadingSessions(true);
        const { data } = await axios.get("/api/ai/inspector-chat/sessions");
        if (data?.ok) setSessions(data.sessions ?? []);
      } catch {
        // ignore (optional: show toast)
      } finally {
        setLoadingSessions(false);
      }
    };

    load();
  }, [open]);

  if (!open) return null;

  const startNewChat = () => {
    setSessionId(null);
    setMessages([GREETING]);
    setHistoryOpen(false);
  };

  const loadSession = async (id: number) => {
    try {
      setLoading(true);
      const { data } = await axios.get(`/api/ai/inspector-chat/sessions/${id}`);
      if (!data?.ok) throw new Error("Failed to load session");

      const loaded: Msg[] = (data.messages ?? []).map((m: any) => ({
        role: m.role,
        content: m.content,
      }));

      // fallback if empty
      setMessages(loaded.length ? loaded : [GREETING]);
      setSessionId(id);
      setHistoryOpen(false);
    } catch (e: any) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: `❌ Error: ${e?.message || "Failed to load history"}` },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const deleteSession = async (id: number) => {
    if (!confirm("Delete this chat history?")) return;

    try {
      await axios.delete(`/api/ai/inspector-chat/sessions/${id}`);
      setSessions((prev) => prev.filter((s) => s.id !== id));

      if (sessionId === id) {
        startNewChat();
      }
    } catch {
      // ignore
    }
  };

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const next = [...messages, { role: "user", content: text } as Msg];
    setMessages(next);
    setInput("");
    setLoading(true);

    try {
      const { data } = await axios.post("/api/ai/inspector-chat", {
        messages: next.filter((m) => m.content.trim() !== ""),
        context,

        // ✅ IMPORTANT: continue same session
        session_id: sessionId ?? undefined,
      });

      const isOk = data?.ok === true || data?.success === true;
      if (!isOk) throw new Error(data?.error || "Chat failed");

      // ✅ save session id returned by backend
      if (data?.session_id) setSessionId(data.session_id);

      setMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);

      // ✅ refresh session list so latest goes to top
      try {
        const s = await axios.get("/api/ai/inspector-chat/sessions");
        if (s.data?.ok) setSessions(s.data.sessions ?? []);
      } catch {
        // ignore
      }
    } catch (e: any) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: `❌ Error: ${e?.message || "Something went wrong"}` },
      ]);
    } finally {
      setLoading(false);
    }
  };

const activeLabel =
  !sessionId
    ? "New chat"
    : (sessions.find((x) => x.id === sessionId)?.title || `Session #${sessionId}`);

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-end bg-black/40 p-4">
      <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-xl dark:bg-gray-900">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 p-4 dark:border-gray-800">
          <div>
            <div className="text-sm font-semibold text-gray-900 dark:text-white">
              Inspector AI Chat
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {activeLabel} • Gemini assistant (server-side)
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setHistoryOpen((v) => !v)}
              className="rounded-lg px-3 py-1 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800"
            >
              History
            </button>

            <button
              onClick={onClose}
              className="rounded-lg px-3 py-1 text-sm text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              Close
            </button>
          </div>
        </div>

        {/* History panel */}
        {historyOpen && (
          <div className="border-b border-gray-200 dark:border-gray-800 p-3">
            <div className="flex items-center justify-between">
              <div className="text-xs font-semibold text-gray-700 dark:text-gray-200">
                Chat History
              </div>

              <button
                onClick={startNewChat}
                className="rounded-md bg-emerald-600 px-2 py-1 text-xs font-semibold text-white hover:bg-emerald-700"
              >
                + New chat
              </button>
            </div>

            <div className="mt-2 max-h-40 overflow-y-auto space-y-2">
              {loadingSessions && (
                <div className="text-xs text-gray-500 dark:text-gray-400">Loading…</div>
              )}

              {!loadingSessions && sessions.length === 0 && (
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  No previous chats yet.
                </div>
              )}

              {sessions.map((s) => (
                <div
                  key={s.id}
                  className={`flex items-center justify-between gap-2 rounded-lg border px-2 py-2 text-xs
                    ${
                      sessionId === s.id
                        ? "border-emerald-400 bg-emerald-50 dark:bg-emerald-900/20"
                        : "border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900"
                    }
                  `}
                >
                  <button
                    type="button"
                    onClick={() => loadSession(s.id)}
                    className="flex-1 text-left"
                    title="Load this chat"
                  >
                    <div className="font-semibold text-gray-900 dark:text-white">
                      {s.title || `Session #${s.id}`}
                    </div>
                    <div className="text-[11px] text-gray-500 dark:text-gray-400">
                      {s.last_message_at ? `Last: ${s.last_message_at}` : s.created_at ? `Created: ${s.created_at}` : ""}
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => deleteSession(s.id)}
                    className="rounded-md px-2 py-1 text-[11px] font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                    title="Delete chat"
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Messages */}
        <div className="max-h-[60vh] space-y-3 overflow-y-auto p-4">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
                  m.role === "user"
                    ? "bg-emerald-600 text-white"
                    : "bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-100"
                }`}
              >
                {m.content}
              </div>
            </div>
          ))}
          <div ref={endRef} />
        </div>

        {/* Input */}
        <div className="border-t border-gray-200 p-3 dark:border-gray-800">
          <div className="flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") send();
              }}
              placeholder="Type your question..."
              className="flex-1 rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-emerald-400 dark:border-gray-700 dark:bg-gray-950 dark:text-white"
            />
            <button
              onClick={send}
              disabled={loading}
              className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
            >
              {loading ? "..." : "Send"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
