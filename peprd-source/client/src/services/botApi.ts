import axios from "axios";

// API is on port 3000, dashboard on 5174
const BOT_API_URL =
  typeof window !== 'undefined' && window.location.hostname
    ? `http://${window.location.hostname}:8889/api`
    : "/api";

const botApi = axios.create({
  baseURL: BOT_API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to add bot token
botApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("peprd_bot_token") || localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Response interceptor — clear token on 401
botApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("peprd_bot_token");
    }
    return Promise.reject(error);
  },
);

// ─── Types ─────────────────────────────────────────────────────────────────

export type BotMode = "all" | "selected";

export interface BotStatus {
  status: "disconnected" | "connecting" | "connected";
  paused?: boolean;
  mode?: BotMode;
  phone?: string;
}

export interface BotMessage {
  id: string;
  phone: string;
  name?: string;
  lastMessage: string;
  timestamp: string;
  botActive: boolean;
  enabled?: boolean;
}

export interface BotClient {
  id: string;
  name?: string;
  phone: string;
  joinedAt: string;
  messageCount: number;
}

export interface ClientDetailFull {
  client: {
    id: number;
    name?: string;
    phone: string;
    email?: string;
    address?: string;
    notes?: string;
    created_at: string;
  };
  services: Array<{
    id: number;
    name: string;
    abbreviation: string;
    color: string;
    category_type: string;
    status: 'active' | 'completed' | 'cancelled';
    started_at: string;
  }>;
  cases: Array<{
    id: number;
    case_number: string;
    title: string;
    description?: string;
    status: string;
    case_type?: string;
    court?: string;
    next_hearing?: string;
    created_at: string;
    tags: Array<{ tag_type: string; tag_value: string }>;
  }>;
  messages: Array<{
    id: number;
    direction: 'inbound' | 'outbound';
    content: string;
    media_url?: string;
    created_at: string;
  }>;
  documents: Array<{
    id: number;
    doc_type: string;
    file_name?: string;
    status: string;
    created_at: string;
  }>;
  appointments: Array<{
    id: number;
    date: string;
    time: string;
    type: string;
    status: string;
  }>;
  stats: {
    totalServices: number;
    totalCases: number;
    totalMessages: number;
    totalDocuments: number;
  };
}

export interface ClientMedia {
  id: number;
  phone: string;
  client_id: number;
  wa_message_id?: string;
  media_type: string;
  mime_type?: string;
  original_name?: string;
  saved_name: string;
  file_path: string;
  file_size?: number;
  context: string;
  created_at: string;
}

// ─── Chat / Conversation types ──────────────────────────────────────────────

export type MessageDirection = "inbound" | "outbound";
export type HandledBy = "ai" | "human";

export interface ChatMessage {
  id: string;
  phone: string;
  message: string;
  direction: MessageDirection;
  timestamp: string;
  handledBy?: HandledBy;
  fromMe?: boolean;
  read?: boolean;
}

export interface Conversation {
  id: string;
  phone: string;
  name?: string;
  lastMessage: string;
  lastMessageTime: string;
  timestamp: string;
  unreadCount?: number;
  botActive?: boolean;
  aiActive?: boolean;
  handledBy?: HandledBy;
  status?: "active" | "inactive";
}

export interface PhoneStatus {
  phone: string;
  aiActive: boolean;
  mode: "ai" | "human";
}

// ─── Analytics types ────────────────────────────────────────────────────────

export interface IntentData {
  intent: string;
  count: number;
  percentage: number;
}

export interface DashboardStats {
  totalConversations?: number;
  aiHandled?: number;
  humanHandled?: number;
  humanTakeovers?: number;
  avgResponseTimeAI?: number;
  avgResponseTimeHuman?: number;
  totalMessages?: number;
  activeConversations?: number;
  [key: string]: unknown;
}

export interface AnalyticsData {
  topIntents?: IntentData[];
  dailyStats?: { date: string; ai: number; human: number }[];
  [key: string]: unknown;
}

// ─── Document types (Digitación services) ──────────────────────────────────

export interface DocumentIndexItem {
  id: string;
  name: string;
  category: string;
  subcategory: string | null;
  sub_subcategory: string | null;
  specialization: string;
  file_path: string;
  absolute_path: string;
  file_extension: string;
  file_size_bytes: number;
  modified_date: string;
  status: 'active' | 'archived' | 'draft';
  description: string;
  tags: string[];
  comments: Array<{
    id?: string;
    author?: string;
    text: string;
    created_at?: string;
  }>;
}

export interface DocumentIndexMetadata {
  total_documents: number;
  generated_at: string;
  base_path: string;
}

export interface DocumentIndex {
  metadata: DocumentIndexMetadata;
  categories: string[];
  documents: DocumentIndexItem[];
  grouped_by_category: Record<string, number>;
}

// ─── API Methods ────────────────────────────────────────────────────────────

export const botAPI = {
  // ── Bot connection ──────────────────────────────────────────────────────
  getStatus: () => botApi.get<BotStatus>("/whatsapp/status"),
  connect: () => botApi.post("/whatsapp/connect"),
  getQR: () => botApi.get<{ qr: string | null }>("/whatsapp/qr"),
  disconnect: () => botApi.post("/whatsapp/disconnect"),
  toggleBot: () => botApi.post("/whatsapp/bot-toggle"),
  setBotMode: (mode: BotMode) => botApi.post("/whatsapp/bot-mode", { mode }),

  // ── Legacy message/client endpoints ────────────────────────────────────
  getMessages: () => botApi.get<{ conversations: Array<{phone:string;client_name:string|null;last_message:string;last_message_at:string;message_count:string}> }>("/messages/conversations"),
  getClients: () => botApi.get<BotClient[]>("/clients"),
  getClientDetail: (clientId: string | number) =>
    botApi.get<ClientDetailFull>(`/clients/${clientId}/detail`),
  getClientMedia: (clientId: string | number) =>
    botApi.get<{ media: ClientMedia[] }>(`/clients/${clientId}/media`),
  getClientCasesSummary: (clientId: string | number) =>
    botApi.get(`/clients/${clientId}/cases-summary`),
  toggleContactMode: (phone: string) =>
    botApi.post(`/messages/chat-toggle/${phone}`),
  enableContact: (phone: string) =>
    botApi.post(`/messages/chat-toggle/${phone}`),
  loginBot: (email: string, password: string) =>
    botApi.post<{ token: string }>("/auth/login", { email, password }),

  // ── Conversations ───────────────────────────────────────────────────────
  /** GET /api/messages/conversations — list all conversations */
  getConversations: () =>
    botApi.get<Conversation[]>("/messages/conversations"),

  /** GET /api/messages/phone/:phone — full message history */
  getPhoneMessages: (phone: string) =>
    botApi.get<ChatMessage[]>(`/messages/phone/${encodeURIComponent(phone)}`),

  /** POST /api/messages/send — send a message */
  sendMessage: (phone: string, message: string) =>
    botApi.post("/messages/send", { phone, message }),

  /** POST /api/messages/chat-toggle/:phone — toggle AI on/off */
  toggleChatAI: (phone: string) =>
    botApi.post(`/messages/chat-toggle/${encodeURIComponent(phone)}`),

  /** GET /api/messages/phone-status/:phone — get AI/manual status */
  getPhoneStatus: (phone: string) =>
    botApi.get<PhoneStatus>(`/messages/phone-status/${encodeURIComponent(phone)}`),

  // ── Dashboard & Analytics ───────────────────────────────────────────────
  /** GET /api/dashboard/stats */
  getDashboardStats: () => botApi.get<DashboardStats>("/dashboard/stats"),

  /** GET /api/dashboard/analytics */
  getAnalytics: () => botApi.get<AnalyticsData>("/dashboard/analytics"),

  /** GET /api/clients */
  getAllClients: () => botApi.get<BotClient[]>("/clients"),

  /** GET /api/messages/search?q=term — search messages by content */
  searchConversations: (query: string) =>
    botApi.get<{ conversations: Array<{phone:string;client_name:string|null;last_message:string;last_message_at:string;message_count:string;botActive:boolean;firstMatchId:number|null}> }>("/messages/search", { params: { q: query } }),

  // ── Document Management (Digitación services) ──────────────────────────────
  /** GET /api/documents/index — fetch document index with all 319 documents */
  getDocumentIndex: () =>
    botApi.get<DocumentIndex>("/documents/index"),

  /** POST /api/documents/:id/comment — add comment to document */
  addDocumentComment: (docId: string, comment: { text: string; author?: string }) =>
    botApi.post(`/documents/${docId}/comment`, comment),

  /** PUT /api/documents/:id — update document metadata */
  updateDocumentMetadata: (docId: string, updates: Partial<DocumentIndexItem>) =>
    botApi.put(`/documents/${docId}`, updates),

  /** GET /api/documents/file/:docId — returns URL to stream a document file (used as iframe src) */
  getDocumentFileUrl: (docId: string): string => {
    const base = typeof window !== 'undefined' && window.location.hostname
      ? `http://${window.location.hostname}:8889/api`
      : '/api';
    return `${base}/documents/file/${docId}`;
  },
};

export default botApi;
