import { useState, useEffect, useRef } from "react";
import {
  MessageCircle,
  X,
  Send,
  Sparkles,
  RefreshCw,
  ShoppingBag,
  Loader2,
  Flower2,
  ChevronDown,
  RotateCcw,
} from "lucide-react";
import {
  getKnowledgeBase,
  buildSystemInstruction,
  streamGeminiChat,
  MAX_MESSAGE_LENGTH,
  MAX_CHATS_PER_MINUTE,
  type KnowledgeBase,
  type ChatMessage,
} from "@/lib/harumonyChatService";

const WA_NUMBER = "6285773552946";
const waLink = (text: string) => `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(text)}`;

const QUICK_SUGGESTIONS = [
  "💐 Berapa estimasi buket mawar merah?",
  "⏰ Apakah bisa pesan untuk hari yang sama?",
  "📍 Lokasi workshop dan area pengiriman?",
  "🍫 Bisa custom buket snack dan boneka?",
];

const INITIAL_GREETING: ChatMessage = {
  id: "greeting",
  role: "model",
  text: "Halo Kak! 🌸 Selamat datang di Harumony.id. Saya Harumony Concierge, asisten virtual toko florist Babelan. Ada yang bisa saya bantu seputar rekomendasi buket bunga, cek daftar harga, atau syarat pemesanan?",
  timestamp: Date.now(),
};

export function ChatWidget() {
  const [isMounted, setIsMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([INITIAL_GREETING]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [knowledgeBase, setKnowledgeBase] = useState<KnowledgeBase | null>(null);
  const [isSyncingKb, setIsSyncingKb] = useState(false);
  const [systemInstruction, setSystemInstruction] = useState<string>("");
  const [rateLimitWarning, setRateLimitWarning] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const messageTimestampsRef = useRef<number[]>([]);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Inisialisasi knowledge base (Daftar Harga & FAQ dari Google Sheets)
  useEffect(() => {
    let isMounted = true;
    const loadKb = async () => {
      setIsSyncingKb(true);
      try {
        const kb = await getKnowledgeBase();
        if (isMounted) {
          setKnowledgeBase(kb);
          const sys = buildSystemInstruction(kb);
          setSystemInstruction(sys);
        }
      } catch (err) {
        console.error("Gagal memuat knowledge base dari Google Apps Script:", err);
      } finally {
        if (isMounted) setIsSyncingKb(false);
      }
    };

    loadKb();
    return () => {
      isMounted = false;
    };
  }, []);

  // Auto-scroll ke pesan terbaru
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen, isStreaming]);

  // Fokus input saat widget dibuka
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 200);
    }
  }, [isOpen]);

  const handleRefreshKnowledge = async () => {
    setIsSyncingKb(true);
    try {
      const kb = await getKnowledgeBase(true);
      setKnowledgeBase(kb);
      setSystemInstruction(buildSystemInstruction(kb));
    } catch (e) {
      console.error("Refresh KB error:", e);
    } finally {
      setIsSyncingKb(false);
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const rawText = textToSend ?? input;
    let text = rawText.trim();
    if (!text || isStreaming) return;

    // Batas 1: Maksimal 500 karakter per pesan
    if (text.length > MAX_MESSAGE_LENGTH) {
      setRateLimitWarning(`Pesan maksimal ${MAX_MESSAGE_LENGTH} karakter ya Kak 🌸 (saat ini ${text.length})`);
      setTimeout(() => setRateLimitWarning(null), 4000);
      return;
    }

    // Batas 2: Maksimal 20 chat per menit (sliding window 60 detik)
    const now = Date.now();
    const recentTimestamps = messageTimestampsRef.current.filter((t) => now - t < 60000);
    if (recentTimestamps.length >= MAX_CHATS_PER_MINUTE) {
      const oldestInWindow = recentTimestamps[0] ?? now;
      const secondsLeft = Math.max(1, Math.ceil((60000 - (now - oldestInWindow)) / 1000));
      setRateLimitWarning(
        `Batas obrolan tercapai (maks. 20 pesan/menit). Mohon tunggu ${secondsLeft} detik lagi ya Kak 🌸`
      );
      setTimeout(() => setRateLimitWarning(null), 4000);
      return;
    }

    recentTimestamps.push(now);
    messageTimestampsRef.current = recentTimestamps;
    setRateLimitWarning(null);
    setInput("");

    const userMsg: ChatMessage = {
      id: "u-" + Date.now(),
      role: "user",
      text,
      timestamp: Date.now(),
    };

    const botMsgId = "m-" + Date.now();
    const placeholderBotMsg: ChatMessage = {
      id: botMsgId,
      role: "model",
      text: "",
      timestamp: Date.now(),
    };

    const newMessages = [...messages, userMsg, placeholderBotMsg];
    setMessages(newMessages);
    setIsStreaming(true);

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    // Filter pesan untuk payload chat Gemini (tanpa placeholder kosong)
    const chatPayload = newMessages
      .slice(0, -1)
      .filter((m) => m.text.trim().length > 0)
      .map((m) => ({
        role: m.role as "user" | "model",
        text: m.text,
      }));

    // Pastikan instruction sudah tersedia
    let currentSys = systemInstruction;
    if (!currentSys && knowledgeBase) {
      currentSys = buildSystemInstruction(knowledgeBase);
      setSystemInstruction(currentSys);
    }

    await streamGeminiChat({
      messages: chatPayload,
      systemInstruction:
        currentSys ||
        "Kamu adalah Harumony Concierge, asisten virtual resmi florist Harumony.id di Babelan, Bekasi.",
      abortSignal: abortController.signal,
      onChunk: (_delta, accumulated) => {
        setMessages((prev) =>
          prev.map((m) => (m.id === botMsgId ? { ...m, text: accumulated } : m))
        );
      },
      onFinish: (finalText) => {
        setIsStreaming(false);
        abortControllerRef.current = null;
        setMessages((prev) =>
          prev.map((m) => (m.id === botMsgId ? { ...m, text: finalText } : m))
        );
      },
      onError: (err) => {
        setIsStreaming(false);
        abortControllerRef.current = null;
        console.error("Chat error:", err);
        setMessages((prev) =>
          prev.map((m) =>
            m.id === botMsgId
              ? {
                  ...m,
                  text:
                    "Maaf Kak, sedang ada kendala koneksi ke AI Studio. Kakak bisa langsung chat Admin via WhatsApp (0857-7355-2946) untuk respon cepat ya! 🌸",
                }
              : m
          )
        );
      },
    });
  };

  const handleStopStreaming = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsStreaming(false);
    }
  };

  const handleResetChat = () => {
    handleStopStreaming();
    setMessages([INITIAL_GREETING]);
  };

  const scrollToPesan = () => {
    setIsOpen(false);
    const el = document.getElementById("pesan");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  // Render teks dengan formatting sederhana (tebal **teks**, baris baru, dan bullet list)
  const renderFormattedText = (rawText: string) => {
    const lines = rawText.split("\n");
    return lines.map((line, idx) => {
      const isBullet = line.trim().startsWith("- ") || line.trim().startsWith("• ");
      const contentLine = isBullet ? line.trim().replace(/^[-•]\s*/, "") : line;

      // Ubah **teks** menjadi <strong>teks</strong>
      const parts = contentLine.split(/(\*\*.*?\*\*)/g);
      const formattedParts = parts.map((part, pIdx) => {
        if (part.startsWith("**") && part.endsWith("**")) {
          return (
            <strong key={pIdx} className="font-semibold text-amber-200">
              {part.slice(2, -2)}
            </strong>
          );
        }
        return part;
      });

      return (
        <div
          key={idx}
          className={`${isBullet ? "pl-2 flex items-start gap-1.5 my-0.5" : "my-0.5 min-h-[1.25rem]"}`}
        >
          {isBullet ? (
            <>
              <span className="text-amber-400 select-none shrink-0">•</span>
              <span className="flex-1">{formattedParts}</span>
            </>
          ) : (
            formattedParts
          )}
        </div>
      );
    });
  };

  if (!isMounted) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 font-sans print:hidden">
      {/* TRIGGER FLOATING BUTTON */}
      {!isOpen && (
        <div className="relative group">
          {/* Subtle glowing halo */}
          <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-amber-400/40 via-purple-400/30 to-amber-300/40 blur-md opacity-70 group-hover:opacity-100 transition duration-500 animate-pulse" />

          <button
            onClick={() => setIsOpen(true)}
            aria-label="Buka Chatbot Harumony"
            className="relative flex items-center gap-3 bg-gradient-to-br from-[#2a1324] via-[#1a0f18] to-[#120710] text-cream border border-amber-400/40 px-4 py-3 rounded-full shadow-2xl hover:border-amber-300 hover:scale-105 active:scale-95 transition-all duration-300 cursor-pointer"
          >
            <div className="relative flex items-center justify-center w-8 h-8 rounded-full bg-amber-400/10 border border-amber-400/30">
              <Flower2 className="w-4 h-4 text-amber-300 animate-spin-slow" />
              <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 border-2 border-[#1a0f18] rounded-full animate-ping" />
              <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 border-2 border-[#1a0f18] rounded-full" />
            </div>
            <div className="text-left hidden sm:block">
              <p className="text-xs font-serif tracking-wider uppercase text-amber-200/90 font-medium">
                Tanya Harumony
              </p>
              <p className="text-[11px] text-cream/70 flex items-center gap-1">
                <Sparkles className="w-2.5 h-2.5 text-amber-300" /> Cek Harga & FAQ
              </p>
            </div>
            <MessageCircle className="w-5 h-5 text-amber-300 sm:hidden" />
          </button>
        </div>
      )}

      {/* CHAT WINDOW MODAL */}
      {isOpen && (
        <div className="flex flex-col w-[92vw] sm:w-[410px] h-[580px] max-h-[82vh] rounded-2xl overflow-hidden shadow-2xl border border-amber-400/30 bg-[#160c14] text-cream animate-in fade-in zoom-in-95 duration-200">
          {/* HEADER */}
          <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-[#291423] via-[#1f0e1a] to-[#291423] border-b border-amber-400/20">
            <div className="flex items-center gap-2.5">
              <div className="relative flex items-center justify-center w-9 h-9 rounded-full bg-amber-400/15 border border-amber-400/30">
                <Flower2 className="w-4 h-4 text-amber-300" />
                <span className="absolute bottom-0 right-0 w-2 h-2 bg-emerald-400 rounded-full border border-[#1f0e1a]" />
              </div>
              <div>
                <h3 className="font-serif text-sm font-semibold tracking-wide text-amber-200 flex items-center gap-1.5">
                  Harumony Concierge
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-400/15 text-amber-300 font-mono font-normal">
                    AI Live
                  </span>
                </h3>
                <p className="text-[11px] text-cream/60 flex items-center gap-1">
                  {isSyncingKb ? (
                    <>
                      <Loader2 className="w-2.5 h-2.5 animate-spin text-amber-300" />
                      Sinkronisasi katalog...
                    </>
                  ) : (
                    <>
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      {knowledgeBase?.prices?.length ?? 0} item harga & FAQ aktif
                    </>
                  )}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={handleRefreshKnowledge}
                disabled={isSyncingKb}
                title="Perbarui data harga & FAQ dari Google Sheets"
                className="p-1.5 rounded-lg text-cream/60 hover:text-amber-200 hover:bg-white/5 transition disabled:opacity-40"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncingKb ? "animate-spin" : ""}`} />
              </button>
              <button
                onClick={handleResetChat}
                title="Mulai obrolan baru"
                className="p-1.5 rounded-lg text-cream/60 hover:text-amber-200 hover:bg-white/5 transition"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                title="Tutup chat"
                className="p-1.5 rounded-lg text-cream/60 hover:text-amber-200 hover:bg-white/5 transition"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* MESSAGES LIST */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 text-xs text-cream/90 bg-gradient-to-b from-[#180d16] to-[#120810]">
            {messages.map((msg) => {
              const isUser = msg.role === "user";
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isUser ? "items-end" : "items-start"}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-[12.5px] leading-relaxed shadow-sm ${
                      isUser
                        ? "bg-gradient-to-r from-amber-500/25 to-purple-600/30 border border-amber-400/40 text-cream rounded-br-xs"
                        : "bg-[#231320] border border-white/10 text-cream/90 rounded-bl-xs"
                    }`}
                  >
                    {!msg.text && isStreaming ? (
                      <div className="flex items-center gap-1.5 py-1 text-cream/50">
                        <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-bounce" />
                        <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                        <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-bounce [animation-delay:0.4s]" />
                        <span className="text-[11px] ml-1">Menulis...</span>
                      </div>
                    ) : (
                      <div>{renderFormattedText(msg.text)}</div>
                    )}
                  </div>
                  <span className="text-[9.5px] text-cream/40 mt-1 px-1">
                    {new Date(msg.timestamp).toLocaleTimeString("id-ID", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              );
            })}

            {/* QUICK SUGGESTIONS (Tampil jika baru pesan awal) */}
            {messages.length === 1 && !isStreaming && (
              <div className="pt-2">
                <p className="text-[11px] font-medium text-amber-200/80 mb-2">
                  Pertanyaan Populer:
                </p>
                <div className="flex flex-col gap-1.5">
                  {QUICK_SUGGESTIONS.map((item, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSendMessage(item)}
                      className="text-left text-[11.5px] px-3 py-1.5 rounded-xl bg-white/5 hover:bg-amber-400/10 border border-white/5 hover:border-amber-400/30 text-cream/80 hover:text-amber-200 transition-all cursor-pointer"
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* ACTION SHORTCUTS (Quick Links) */}
          <div className="px-3 py-1.5 bg-[#190d17] border-t border-white/5 flex items-center justify-between text-[11px]">
            <button
              onClick={scrollToPesan}
              className="flex items-center gap-1 text-amber-300 hover:text-amber-200 hover:underline cursor-pointer"
            >
              <ShoppingBag className="w-3 h-3" /> Form Pesanan
            </button>
            <a
              href={waLink("Halo Harumony.id, saya ingin konsultasi desain buket bunga")}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-emerald-400 hover:text-emerald-300 hover:underline"
            >
              <MessageCircle className="w-3 h-3" /> Konsultasi Desain (WA)
            </a>
          </div>

          {/* RATE LIMIT / WARNING BANNER */}
          {rateLimitWarning && (
            <div className="mx-3 mt-2 px-3 py-1.5 rounded-xl bg-amber-500/20 border border-amber-400/40 text-amber-200 text-[11px] flex items-center justify-between animate-in fade-in">
              <span className="flex-1 pr-2">{rateLimitWarning}</span>
              <button
                type="button"
                onClick={() => setRateLimitWarning(null)}
                className="text-amber-300 hover:text-white p-0.5 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* INPUT FORM */}
          <div className="p-3 bg-[#1e0f1c] border-t border-amber-400/20">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-2"
            >
              <input
                ref={inputRef}
                type="text"
                value={input}
                maxLength={MAX_MESSAGE_LENGTH}
                onChange={(e) => {
                  setInput(e.target.value);
                  if (rateLimitWarning) setRateLimitWarning(null);
                }}
                placeholder={
                  isStreaming ? "AI sedang mengetik..." : "Tulis pertanyaan / nama bunga..."
                }
                disabled={isStreaming}
                className="flex-1 bg-[#140912] border border-white/15 focus:border-amber-400/50 rounded-xl px-3.5 py-2 text-xs text-cream placeholder:text-cream/40 focus:outline-none focus:ring-1 focus:ring-amber-400/30 transition disabled:opacity-50"
              />

              {isStreaming ? (
                <button
                  type="button"
                  onClick={handleStopStreaming}
                  className="px-2.5 py-2 rounded-xl bg-rose-600/30 border border-rose-500/40 text-rose-200 text-xs hover:bg-rose-600/50 transition cursor-pointer"
                  title="Hentikan"
                >
                  <X className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={!input.trim()}
                  className="flex items-center justify-center w-8 h-8 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-[#1a0f18] hover:from-amber-400 hover:to-amber-500 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer shadow-md"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              )}
            </form>
            <div className="flex items-center justify-between text-[10px] text-cream/40 mt-1.5 px-0.5 font-light">
              <span>Didukung Google Gemini · Maks. 500 huruf</span>
              {input.length > 200 && (
                <span
                  className={
                    input.length >= MAX_MESSAGE_LENGTH
                      ? "text-rose-400 font-medium"
                      : "text-amber-200/70"
                  }
                >
                  {input.length}/{MAX_MESSAGE_LENGTH}
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
