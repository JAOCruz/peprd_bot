import React, { useEffect, useState, useCallback, useRef } from "react";
import {
  MessageSquare,
  Search,
  Send,
  Bot,
  User,
  RefreshCw,
  ChevronLeft,
  Circle,
  Users,
  MessageCircle,
} from "lucide-react";
import { botAPI } from "../services/botApi";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ConvRow {
  phone: string;
  client_name: string | null;
  last_message: string;
  last_message_at: string;
  message_count: string;
  botActive: boolean;
  firstMatchId?: string | number | null;
}

interface MsgRow {
  id: string | number;
  phone: string;
  direction: "inbound" | "outbound";
  content: string;        // real field from API
  message?: string;       // fallback alias
  media_url?: string | null;
  status?: string;
  created_at: string;
  ai_generated?: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getInitials(name?: string | null, phone?: string): string {
  if (name && name.trim()) {
    const parts = name.trim().split(" ");
    return parts.length >= 2
      ? (parts[0][0] + parts[1][0]).toUpperCase()
      : parts[0].slice(0, 2).toUpperCase();
  }
  return phone ? phone.slice(-4) : "??";
}

function formatRelTime(ts: string): string {
  const date = new Date(ts);
  if (isNaN(date.getTime())) return "";
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "ahora";
  if (diffMins < 60) return `hace ${diffMins} min`;
  const diffHrs = Math.floor(diffMins / 60);
  if (diffHrs < 24) {
    return date.toLocaleTimeString("es-DO", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "America/Santo_Domingo",
    });
  }
  const fmt = (d: Date) => d.toLocaleDateString("es-DO", { timeZone: "America/Santo_Domingo" });
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (fmt(date) === fmt(yesterday)) return "Ayer";
  return date.toLocaleDateString("es-DO", {
    day: "numeric",
    month: "short",
    timeZone: "America/Santo_Domingo",
  });
}

function formatPhone(phone: string): string {
  const d = phone.replace(/\D/g, "");
  if (d.length === 11 && d.startsWith("1"))
    return `(${d.slice(1, 4)}) ${d.slice(4, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
  // WhatsApp @lid privacy ID — real number hidden by WA
  if (d.length > 12) return `WA:···${d.slice(-4)}`;
  return phone;
}

function getDateLabel(ts: string): string {
  const date = new Date(ts);
  const now = new Date();
  const fmt = (d: Date) => d.toLocaleDateString("es-DO", { timeZone: "America/Santo_Domingo" });
  if (fmt(date) === fmt(now)) return "Hoy";
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (fmt(date) === fmt(yesterday)) return "Ayer";
  return date.toLocaleDateString("es-DO", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "America/Santo_Domingo",
  });
}

// ─── Conversation Item ────────────────────────────────────────────────────────

interface ConvItemProps {
  conv: ConvRow;
  isSelected: boolean;
  onSelect: () => void;
  onToggleAI: (phone: string, e: React.MouseEvent) => void;
}

const ConvItem: React.FC<ConvItemProps> = ({
  conv,
  isSelected,
  onSelect,
  onToggleAI,
}) => {
  const initials = getInitials(conv.client_name, conv.phone);
  const name = conv.client_name || formatPhone(conv.phone);
  const preview = (conv.last_message || "—").slice(0, 40);
  const time = formatRelTime(conv.last_message_at);

  return (
    <div
      onClick={onSelect}
      className={`flex cursor-pointer items-start gap-3 px-4 py-3 transition-all hover:bg-slate-800/50 ${
        isSelected
          ? "border-l-2 border-blue-500 bg-slate-800"
          : "border-l-2 border-transparent"
      }`}
    >
      {/* Avatar */}
      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-blue-500 text-sm font-bold text-white shadow-md">
        {initials}
      </div>

      {/* Name + preview */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className="truncate text-sm font-semibold text-white">{name}</p>
          <span className="flex-shrink-0 text-[10px] text-slate-500">{time}</span>
        </div>
        <p className="mt-0.5 truncate text-xs text-slate-500">{preview}</p>
      </div>

      {/* IA toggle switch */}
      <button
        onClick={(e) => onToggleAI(conv.phone, e)}
        title={
          conv.botActive
            ? "IA activa — click para desactivar"
            : "Manual — click para activar IA"
        }
        className={`mt-1 flex h-5 w-9 flex-shrink-0 items-center rounded-full transition-colors ${
          conv.botActive ? "bg-emerald-500" : "bg-slate-600"
        }`}
      >
        <div
          className={`ml-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${
            conv.botActive ? "translate-x-4" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  );
};

// ─── Authenticated media loader (Blob URL) ───────────────────────────────────

function useMediaBlob(apiPath: string | null | undefined) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string>("");

  useEffect(() => {
    if (!apiPath) return;
    let revoked = false;
    const token = localStorage.getItem("peprd_bot_token") || localStorage.getItem("token") || "";
    fetch(apiPath, { headers: { Authorization: `Bearer ${token}` } })
      .then(async (res) => {
        if (!res.ok) return;
        const ct = res.headers.get("content-type") ?? "";
        const blob = await res.blob();
        if (!revoked) {
          setMimeType(ct);
          setBlobUrl(URL.createObjectURL(blob));
        }
      })
      .catch(() => {});
    return () => {
      revoked = true;
      setBlobUrl((prev) => { if (prev) URL.revokeObjectURL(prev); return null; });
    };
  }, [apiPath]);

  return { blobUrl, mimeType };
}

// ─── Media bubble component ───────────────────────────────────────────────────

const MediaAttachment: React.FC<{ apiPath: string; isOut: boolean }> = ({ apiPath, isOut }) => {
  const { blobUrl, mimeType } = useMediaBlob(apiPath);

  if (!blobUrl) {
    return (
      <div className={`mb-1.5 text-xs italic ${isOut ? "text-emerald-300/60" : "text-slate-400"}`}>
        Cargando media…
      </div>
    );
  }

  if (mimeType.startsWith("image/")) {
    return (
      <img
        src={blobUrl}
        alt="imagen"
        className="mb-1.5 max-h-52 w-full rounded-xl object-cover cursor-pointer"
        onClick={() => window.open(blobUrl, "_blank")}
      />
    );
  }

  if (mimeType.startsWith("audio/")) {
    return (
      <audio controls preload="metadata" className="mb-1.5 w-full min-w-[250px]">
        <source src={blobUrl} type={mimeType || "audio/ogg"} />
        Tu navegador no soporta audio.
      </audio>
    );
  }

  if (mimeType.startsWith("video/")) {
    return (
      <video controls src={blobUrl} className="mb-1.5 max-h-52 w-full rounded-xl object-cover">
        Tu navegador no soporta video.
      </video>
    );
  }

  // Generic download link
  return (
    <a
      href={blobUrl}
      download
      className={`mb-1.5 flex items-center gap-1.5 underline underline-offset-2 text-sm ${isOut ? "text-emerald-200" : "text-blue-300"}`}
    >
      📎 Descargar archivo
    </a>
  );
};

// ─── Message Bubble ───────────────────────────────────────────────────────────

const MessageBubble: React.FC<{ msg: MsgRow; isHighlighted?: boolean }> = ({ msg, isHighlighted }) => {
  const isOut = msg.direction === "outbound";
  // Real field is "content"; fallback to "message" for safety
  const text = msg.content ?? msg.message ?? "";
  const time = (() => {
    try {
      return new Date(msg.created_at).toLocaleTimeString("es-DO", {
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "America/Santo_Domingo",
      });
    } catch {
      return "";
    }
  })();

  const media = msg.media_url;

  return (
    <div
      className={`flex mb-1.5 ${isOut ? "justify-end" : "justify-start"} transition-all duration-300`}
      id={`msg-${msg.id}`}
    >
      <div
        className={`max-w-[75%] px-4 py-2.5 text-sm text-white shadow-sm transition-all duration-300 ${
          isHighlighted
            ? "ring-2 ring-yellow-400 ring-offset-2 ring-offset-[#0B1120] scale-[1.02] shadow-lg shadow-yellow-400/30"
            : ""
        } ${
          isOut
            ? `rounded-bl-2xl rounded-tl-2xl rounded-tr-2xl ${
                isHighlighted ? "bg-emerald-700" : "bg-emerald-800"
              }`
            : `rounded-br-2xl rounded-tl-2xl rounded-tr-2xl ${
                isHighlighted ? "bg-slate-600" : "bg-slate-700"
              }`
        }`}
      >
        {/* Authenticated media */}
        {media && <MediaAttachment apiPath={media} isOut={isOut} />}
        {/* Text content */}
        {text && !text.startsWith("[📎") && !text.startsWith("[🎤") && (
          <p className="break-words leading-relaxed">{text}</p>
        )}
        {/* Timestamp */}
        <p
          className={`mt-1 text-[10px] ${
            isOut ? "text-right text-emerald-300/60" : "text-slate-400"
          }`}
        >
          {time}
          {msg.ai_generated && (
            <span className="ml-1.5 text-emerald-300/50">· IA</span>
          )}
        </p>
      </div>
    </div>
  );
};

// ─── Date Separator ───────────────────────────────────────────────────────────

const DateSeparator: React.FC<{ label: string }> = ({ label }) => (
  <div className="my-4 flex items-center gap-3">
    <div className="flex-1 border-t border-slate-800" />
    <span className="rounded-full bg-slate-800 px-3 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
      {label}
    </span>
    <div className="flex-1 border-t border-slate-800" />
  </div>
);

// ─── Main Page ────────────────────────────────────────────────────────────────

const BotMessages: React.FC = () => {
  // Conversation list
  const [conversations, setConversations] = useState<ConvRow[]>([]);
  const [convLoading, setConvLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "ai" | "manual">("all");

  // Selected conversation
  const [selectedPhone, setSelectedPhone] = useState<string | null>(null);
  const [showRightPanel, setShowRightPanel] = useState(false); // mobile toggle

  // Chat
  const [messages, setMessages] = useState<MsgRow[]>([]);
  const [msgLoading, setMsgLoading] = useState(false);
  const [inputText, setInputText] = useState("");
  const [sending, setSending] = useState(false);
  const [highlightMessageId, setHighlightMessageId] = useState<string | number | null>(null);

  // Message search
  const [showMsgSearch, setShowMsgSearch] = useState(false);
  const [msgSearch, setMsgSearch] = useState("");
  const [messageSearchMatches, setMessageSearchMatches] = useState<(string | number)[]>([]);
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const userScrolledRef = useRef(false);
  const prevMessageCount = useRef(0);

  // ── Fetch conversation list ─────────────────────────────────────────────────

  const fetchConversations = useCallback(async (silent = false) => {
    if (!silent) setConvLoading(true);
    try {
      const res = await botAPI.getMessages();
      const raw = res.data as {
        conversations?: Array<{
          phone: string;
          client_name: string | null;
          last_message: string;
          last_message_at: string;
          message_count: string;
          botActive?: boolean;
        }>;
      };
      const convs = raw.conversations ?? [];
      setConversations((prev) => {
        const prevMap = new Map(prev.map((c) => [c.phone, c.botActive]));
        return convs.map((c) => ({
          ...c,
          botActive: c.botActive ?? prevMap.get(c.phone) ?? true,
        }));
      });
    } catch {
      // silent
    } finally {
      setConvLoading(false);
    }
  }, []);

  // Auto-open chat from BotClients
  useEffect(() => {
    const phoneToOpen = localStorage.getItem('openChatPhone');
    if (phoneToOpen) {
      localStorage.removeItem('openChatPhone');
      setSelectedPhone(phoneToOpen);
      setShowRightPanel(true);
    }
  }, []);

  useEffect(() => {
    fetchConversations();
    const iv = setInterval(() => fetchConversations(true), 8000);
    return () => clearInterval(iv);
  }, [fetchConversations]);

  // ── Fetch messages for selected phone ──────────────────────────────────────

  const fetchMessages = useCallback(async (phone: string, silent = false) => {
    if (!silent) setMsgLoading(true);
    try {
      const res = await botAPI.getPhoneMessages(phone);
      const data = res.data as unknown;
      const raw = Array.isArray(data) ? data : ((data as any).messages ?? []);
      setMessages([...raw].reverse()); // API returns DESC, we need ASC for chat display
    } catch {
      if (!silent) setMessages([]);
    } finally {
      if (!silent) setMsgLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedPhone) fetchMessages(selectedPhone);
  }, [selectedPhone, fetchMessages]);

  // Auto-refresh selected chat (silent — no loading spinner, no scroll reset)
  useEffect(() => {
    if (!selectedPhone) return;
    const iv = setInterval(() => fetchMessages(selectedPhone, true), 8000);
    return () => clearInterval(iv);
  }, [selectedPhone, fetchMessages]);

  // Scroll to bottom ONLY on first load or conversation switch
  const lastSelectedPhone = useRef<string | null>(null);
  useEffect(() => {
    if (!messages.length) return;
    const isNewConversation = selectedPhone !== lastSelectedPhone.current;
    const isFirstLoad = prevMessageCount.current === 0;
    const hasNewMessages = messages.length > prevMessageCount.current;
    prevMessageCount.current = messages.length;

    if (isNewConversation || isFirstLoad) {
      lastSelectedPhone.current = selectedPhone;
      // Instant jump to bottom on conversation switch
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "instant" });
      }, 50);
    } else if (hasNewMessages && !userScrolledRef.current) {
      // New message arrived and user is at bottom — smooth scroll
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
    // If user scrolled up: NEVER move scroll
  }, [messages, selectedPhone]);

  // Track if user scrolled up manually
  const handleScrollContainer = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    const distFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
    userScrolledRef.current = distFromBottom > 80;
  }, []);

  // Scroll to highlighted message (search result) — wait for messages to load
  useEffect(() => {
    if (!highlightMessageId || messages.length === 0) return;
    // Wait for DOM to render the message
    const timer = setTimeout(() => {
      // Try both formats: msg-{id} and msg-{stringId}
      let element = document.getElementById(`msg-${highlightMessageId}`);
      if (!element) {
        // Try with string conversion
        element = document.getElementById(`msg-${String(highlightMessageId)}`);
      }
      console.log(`[Search] Looking for msg-${highlightMessageId}, found:`, !!element);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "center" });
        console.log(`[Search] Scrolled to message ${highlightMessageId}`);
      } else {
        console.log(`[Search] Message ${highlightMessageId} not found in DOM`);
        console.log(`[Search] Available message IDs:`, messages.slice(0, 5).map(m => m.id));
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [highlightMessageId, messages]);

  // ── Handlers ───────────────────────────────────────────────────────────────

  const selectConversation = (phone: string, firstMatchId?: string | number | null) => {
    setSelectedPhone(phone);
    setShowRightPanel(true);
    setInputText("");
    setHighlightMessageId(firstMatchId || null);
  };

  const handleToggleAI = async (phone: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setConversations((prev) =>
      prev.map((c) => (c.phone === phone ? { ...c, botActive: !c.botActive } : c))
    );
    try {
      await botAPI.toggleChatAI(phone);
    } catch {
      // revert on failure
      setConversations((prev) =>
        prev.map((c) => (c.phone === phone ? { ...c, botActive: !c.botActive } : c))
      );
    }
  };

  const handleSend = async () => {
    const text = inputText.trim();
    if (!text || !selectedPhone || sending) return;
    setInputText("");
    setSending(true);
    // Optimistic message
    const optimistic: MsgRow = {
      id: `opt-${Date.now()}`,
      phone: selectedPhone,
      direction: "outbound",
      content: text,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimistic]);
    try {
      await botAPI.sendMessage(selectedPhone, text);
      await fetchMessages(selectedPhone);
    } catch {
      // keep optimistic on screen
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // ── Message search ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!msgSearch.trim()) {
      setMessageSearchMatches([]);
      setHighlightMessageId(null);
      return;
    }

    const q = msgSearch.toLowerCase();
    const matches = messages
      .filter((m) => m.content.toLowerCase().includes(q))
      .map((m) => m.id);
    setMessageSearchMatches(matches);
    setCurrentMatchIndex(0);

    if (matches.length > 0) {
      setHighlightMessageId(matches[0]);
      setTimeout(() => {
        const el = document.getElementById(`msg-${matches[0]}`);
        el?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 100);
    }
  }, [msgSearch, messages]);

  // ── Filtering ──────────────────────────────────────────────────────────────

  const filtered = conversations.filter((c) => {
    const q = search.toLowerCase();
    const matchSearch =
      !search ||
      (c.client_name || "").toLowerCase().includes(q) ||
      c.phone.includes(q);
    const matchFilter =
      filter === "all" ||
      (filter === "ai" && c.botActive) ||
      (filter === "manual" && !c.botActive);
    return matchSearch && matchFilter;
  });

  const selectedConv = conversations.find((c) => c.phone === selectedPhone);

  // ── Group messages by date ─────────────────────────────────────────────────

  const messageGroups: { date: string; msgs: MsgRow[] }[] = [];
  messages.forEach((m) => {
    const label = getDateLabel(m.created_at);
    const last = messageGroups[messageGroups.length - 1];
    if (!last || last.date !== label) {
      messageGroups.push({ date: label, msgs: [m] });
    } else {
      last.msgs.push(m);
    }
  });

  // Calculate stats
  const totalConversations = conversations.length;
  // Sum message_count from all conversations
  const totalMessages = conversations.reduce((sum, conv) => {
    const count = parseInt(conv.message_count || "0", 10);
    return sum + count;
  }, 0);

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    /*
     * Escape DashboardLayout's padding (p-3 md:p-8) so the 2-panel layout
     * can fill the full available height below the top bar (h-16 / h-20).
     */
    <div
      className="-m-3 md:-m-8 flex overflow-hidden"
      style={{ height: "calc(100vh - 4rem)" }}
    >
      {/* ════════════════════════════════════════════════════════════
          LEFT PANEL — Conversation List (320 px on desktop)
      ════════════════════════════════════════════════════════════ */}
      <div
        className={`flex flex-col border-r border-slate-700 bg-slate-900 ${
          showRightPanel ? "hidden md:flex" : "flex"
        } w-full flex-shrink-0 md:w-80`}
      >
        {/* Stats bar */}
        <div className="flex-shrink-0 border-b border-slate-700 bg-slate-800/50 px-4 py-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg border border-slate-600 bg-slate-700/50 p-2.5">
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <Users size={13} />
                <span>Conversaciones</span>
              </div>
              <div className="mt-1 text-lg font-bold text-white">
                {totalConversations}
              </div>
            </div>
            <div className="rounded-lg border border-slate-600 bg-slate-700/50 p-2.5">
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <MessageCircle size={13} />
                <span>Mensajes</span>
              </div>
              <div className="mt-1 text-lg font-bold text-white">
                {totalMessages}
              </div>
            </div>
          </div>
        </div>

        {/* Header */}
        <div className="flex-shrink-0 border-b border-slate-700 p-4">
          <div className="mb-3 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 shadow-md">
              <MessageSquare size={16} className="text-white" />
            </div>
            <h2 className="font-display text-base font-bold text-white">
              Conversaciones
            </h2>
            <span className="ml-auto rounded-full bg-slate-700 px-2 py-0.5 text-xs text-slate-300">
              {conversations.length}
            </span>
          </div>

          {/* Search */}
          <div className="relative mb-3">
            <Search
              size={13}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
            />
            <input
              type="text"
              placeholder={search.trim().length >= 2 ? "Buscando en mensajes..." : "Buscar por nombre, número o palabra..."}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={`w-full rounded-xl border py-2 pl-8 pr-3 text-sm text-white outline-none transition-all focus:border-blue-500 ${
                search.trim().length >= 2
                  ? "border-blue-500 bg-slate-800/80 placeholder-blue-300"
                  : "border-slate-700 bg-slate-800 placeholder-slate-500"
              }`}
            />
            {search.trim().length >= 2 && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-blue-400 font-semibold">
                EN MENSAJES
              </span>
            )}
          </div>

          {/* Filter tabs */}
          <div className="flex gap-1">
            {(
              [
                ["all", "Todos"],
                ["ai", "IA Activa"],
                ["manual", "Manual"],
              ] as const
            ).map(([val, label]) => (
              <button
                key={val}
                onClick={() => setFilter(val)}
                className={`flex-1 rounded-lg py-1.5 text-xs font-semibold transition-all ${
                  filter === val
                    ? "bg-blue-600 text-white"
                    : "bg-slate-800 text-slate-400 hover:text-white"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Conversation list */}
        <div className="flex-1 overflow-y-auto custom-scroll">
          {convLoading ? (
            <div className="flex items-center justify-center py-16 text-slate-500">
              <RefreshCw size={20} className="animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-14 text-center text-slate-600">
              <MessageSquare
                size={32}
                className="mx-auto mb-2 opacity-20"
              />
              <p className="text-sm">Sin conversaciones</p>
            </div>
          ) : (
            filtered.map((conv) => (
              <ConvItem
                key={conv.phone}
                conv={conv}
                isSelected={selectedPhone === conv.phone}
                onSelect={() => selectConversation(conv.phone, conv.firstMatchId)}
                onToggleAI={handleToggleAI}
              />
            ))
          )}
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════
          RIGHT PANEL — Chat Area
      ════════════════════════════════════════════════════════════ */}
      <div
        className={`flex flex-1 flex-col overflow-hidden bg-slate-950 ${
          !showRightPanel ? "hidden md:flex" : "flex"
        }`}
      >
        {/* ── Empty state ── */}
        {!selectedPhone ? (
          <div className="flex flex-1 flex-col items-center justify-center text-slate-600">
            <MessageSquare size={52} className="mb-4 opacity-20" />
            <p className="text-lg font-semibold text-slate-500">
              Selecciona una conversación
            </p>
            <p className="mt-1 text-sm text-slate-600">
              Los mensajes aparecerán aquí
            </p>
          </div>
        ) : (
          <>
            {/* ── Top bar ── */}
            <div className="flex flex-shrink-0 items-center gap-3 border-b border-slate-800 bg-slate-900 px-4 py-3">
              {/* Back (mobile only) */}
              <button
                className="flex items-center justify-center rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white md:hidden"
                onClick={() => {
                  setShowRightPanel(false);
                  setSelectedPhone(null);
                }}
              >
                <ChevronLeft size={20} />
              </button>

              {/* Avatar */}
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-blue-500 text-sm font-bold text-white shadow-md">
                {getInitials(selectedConv?.client_name, selectedConv?.phone)}
              </div>

              {/* Name + phone */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <p className="truncate text-sm font-semibold text-white">
                    {selectedConv?.client_name ||
                      formatPhone(selectedPhone)}
                  </p>
                  <Circle
                    size={7}
                    className="flex-shrink-0 fill-emerald-400 text-emerald-400"
                  />
                </div>
                <p className="truncate text-xs text-slate-500">
                  {selectedPhone}
                </p>
              </div>

              {/* IA badge + toggle */}
              <div className="flex items-center gap-2">
                {selectedConv?.botActive && (
                  <span className="hidden rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-xs font-semibold text-emerald-400 sm:inline">
                    IA activada
                  </span>
                )}
                <button
                  onClick={(e) => handleToggleAI(selectedPhone, e)}
                  className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-bold transition-all ${
                    selectedConv?.botActive
                      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
                      : "border-yellow-500/30 bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500/20"
                  }`}
                >
                  {selectedConv?.botActive ? (
                    <Bot size={12} />
                  ) : (
                    <User size={12} />
                  )}
                  <span className="hidden sm:inline">
                    {selectedConv?.botActive ? "Bot" : "Manual"}
                  </span>
                </button>
              </div>

              {/* Message search button */}
              <button
                onClick={() => {
                  setShowMsgSearch(!showMsgSearch);
                  if (showMsgSearch) {
                    setMsgSearch("");
                    setMessageSearchMatches([]);
                    setHighlightMessageId(null);
                  }
                }}
                className={`flex items-center justify-center rounded-lg p-2 transition-all ${
                  showMsgSearch
                    ? "bg-blue-500/20 text-blue-400 hover:bg-blue-500/30"
                    : "text-slate-400 hover:bg-slate-800 hover:text-white"
                }`}
                title="Buscar en mensajes"
              >
                <Search size={18} />
              </button>
            </div>

            {/* Message search bar */}
            {showMsgSearch && (
              <div className="flex flex-shrink-0 items-center gap-2 border-b border-slate-800 bg-slate-900 px-4 py-2">
                <Search size={16} className="text-slate-400 flex-shrink-0" />
                <input
                  type="text"
                  value={msgSearch}
                  onChange={(e) => setMsgSearch(e.target.value)}
                  placeholder="Buscar en mensajes..."
                  autoFocus
                  className="flex-1 border-0 bg-slate-800 px-3 py-1.5 text-sm text-white placeholder-slate-500 outline-none focus:bg-slate-700 rounded"
                />
                {messageSearchMatches.length > 0 && (
                  <span className="text-xs text-slate-400 flex-shrink-0">
                    {currentMatchIndex + 1}/{messageSearchMatches.length}
                  </span>
                )}
                <button
                  onClick={() => {
                    setShowMsgSearch(false);
                    setMsgSearch("");
                    setMessageSearchMatches([]);
                    setHighlightMessageId(null);
                  }}
                  className="text-slate-400 hover:text-white transition-colors flex-shrink-0"
                >
                  ✕
                </button>
              </div>
            )}

            {/* ── Messages area ── */}
            <div
              ref={scrollContainerRef}
              onScroll={handleScrollContainer}
              className="flex-1 overflow-y-auto px-4 py-4 custom-scroll"
            >
              {msgLoading ? (
                <div className="flex items-center justify-center py-16 text-slate-500">
                  <RefreshCw size={20} className="animate-spin" />
                </div>
              ) : messages.length === 0 ? (
                <div className="flex items-center justify-center py-16">
                  <p className="text-sm text-slate-600">Sin mensajes aún</p>
                </div>
              ) : (
                messageGroups.map((group) => (
                  <div key={group.date}>
                    <DateSeparator label={group.date} />
                    {group.msgs.map((msg) => (
                      <MessageBubble key={msg.id} msg={msg} isHighlighted={msg.id === highlightMessageId} />
                    ))}
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* ── Input bar ── */}
            <div className="flex flex-shrink-0 items-center gap-2 border-t border-slate-800 bg-slate-900 px-4 py-3">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Escribe un mensaje..."
                className="flex-1 rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none transition-colors focus:border-blue-500"
              />
              <button
                onClick={handleSend}
                disabled={!inputText.trim() || sending}
                className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white transition-all hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {sending ? (
                  <RefreshCw size={15} className="animate-spin" />
                ) : (
                  <Send size={15} />
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default BotMessages;
