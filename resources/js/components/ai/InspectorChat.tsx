import { useEffect, useRef, useState } from "react";
import axios from "axios";

type Msg = { role: "user" | "assistant"; content: string };

type Props = {
  open: boolean;
  onClose: () => void;
  context?: any;
};

export default function InspectorChat({ open, onClose, context = {} }: Props) {
  const [messages, setMessages] = useState<Msg[]>([
    {
      role: "assistant",
      content:
        "Hi 👋 I’m your Inspector AI. Ask me anything about PV inspection wording, findings structure, recommendations, or what to write next.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const endRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  if (!open) return null;

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const next = [...messages, { role: "user", content: text } as Msg];
    setMessages(next);
    setInput("");
    setLoading(true);

    try {
      const { data } = await axios.post("/api/ai/inspector-chat", {
        messages: next.filter((m) => m.content.trim() !== ""), // keep all non-empty
        context,
      });

      // ✅ FIX: backend returns {success:true,...} OR {ok:true,...}
      const isOk = data?.ok === true || data?.success === true;
      if (!isOk) throw new Error(data?.error || "Chat failed");

      // ✅ reply key is correct based on your Network preview
      setMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);
    } catch (e: any) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: `❌ Error: ${e?.message || "Something went wrong"}` },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-end bg-black/40 p-4">
      <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-xl dark:bg-gray-900">
        <div className="flex items-center justify-between border-b border-gray-200 p-4 dark:border-gray-800">
          <div>
            <div className="text-sm font-semibold text-gray-900 dark:text-white">Inspector AI Chat</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Gemini assistant (server-side)</div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg px-3 py-1 text-sm text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            Close
          </button>
        </div>

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
