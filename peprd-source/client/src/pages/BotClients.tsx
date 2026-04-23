import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users,
  Search,
  RefreshCw,
  Phone,
  MessageCircle,
  ChevronLeft,
  Mail,
  FileText,
  Briefcase,
  Image,
  Music,
  FileIcon,
} from "lucide-react";
import { botAPI, BotClient, ClientDetailFull, ClientMedia } from "../services/botApi";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const getInitials = (name?: string, phone?: string): string => {
  if (name && name.trim()) {
    const parts = name.trim().split(" ");
    return parts.length >= 2
      ? (parts[0][0] + parts[1][0]).toUpperCase()
      : parts[0].slice(0, 2).toUpperCase();
  }
  if (phone) return phone.slice(-2);
  return "??";
};

const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  return date.toLocaleDateString("es-DO", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const formatTime = (dateStr: string): string => {
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return "";
  return date.toLocaleTimeString("es-DO", { hour: "2-digit", minute: "2-digit" });
};

// ─── Client Item ──────────────────────────────────────────────────────────────

const ClientItem: React.FC<{
  client: BotClient;
  isSelected: boolean;
  onSelect: () => void;
}> = ({ client, isSelected, onSelect }) => {
  return (
    <div
      onClick={onSelect}
      className={`flex items-center gap-3 border-l-2 px-4 py-3 cursor-pointer transition-all ${
        isSelected
          ? "border-l-blue-500 bg-slate-800"
          : "border-l-transparent hover:bg-slate-800/50"
      }`}
    >
      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-xs font-bold text-white">
        {getInitials(client.name, client.phone)}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold text-white text-sm">
          {client.name || "Sin nombre"}
        </p>
        <p className="truncate text-xs text-slate-400">{client.phone}</p>
      </div>
    </div>
  );
};

// ─── Tab Content Components ────────────────────────────────────────────────────

const InfoTab: React.FC<{ detail: ClientDetailFull; onChat: () => void }> = ({
  detail,
  onChat,
}) => (
  <div className="space-y-6">
    {/* Avatar + Name */}
    <div className="flex items-center gap-4">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-lg font-bold text-white">
        {getInitials(detail.client.name, detail.client.phone)}
      </div>
      <div>
        <p className="text-2xl font-bold text-white">
          {detail.client.name || "Sin nombre"}
        </p>
        <p className="text-sm text-slate-400">{detail.client.phone}</p>
      </div>
    </div>

    {/* Chat Button */}
    <button
      onClick={onChat}
      className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2.5 rounded-lg transition-all"
    >
      <MessageCircle size={18} />
      Abrir Chat
    </button>

    {/* Details Grid */}
    <div className="space-y-4 bg-slate-800/50 p-4 rounded-lg">
      {detail.client.email && (
        <div className="flex items-start gap-3">
          <Mail size={16} className="text-slate-400 mt-0.5 flex-shrink-0" />
          <div className="min-w-0">
            <p className="text-xs text-slate-400">Email</p>
            <p className="text-sm text-white break-all">{detail.client.email}</p>
          </div>
        </div>
      )}
      {detail.client.address && (
        <div className="flex items-start gap-3">
          <Phone size={16} className="text-slate-400 mt-0.5 flex-shrink-0" />
          <div className="min-w-0">
            <p className="text-xs text-slate-400">Dirección</p>
            <p className="text-sm text-white">{detail.client.address}</p>
          </div>
        </div>
      )}
      {detail.client.notes && (
        <div className="flex items-start gap-3">
          <FileText size={16} className="text-slate-400 mt-0.5 flex-shrink-0" />
          <div className="min-w-0">
            <p className="text-xs text-slate-400">Notas</p>
            <p className="text-sm text-white">{detail.client.notes}</p>
          </div>
        </div>
      )}
    </div>

    {/* Stats Grid */}
    <div className="grid grid-cols-2 gap-3">
      {[
        { label: "Servicios", value: detail.stats.totalServices, icon: Briefcase },
        { label: "Casos", value: detail.stats.totalCases, icon: FileText },
        { label: "Mensajes", value: detail.stats.totalMessages, icon: MessageCircle },
        { label: "Documentos", value: detail.stats.totalDocuments, icon: FileIcon },
      ].map(({ label, value, icon: Icon }) => (
        <div key={label} className="bg-slate-800 p-3 rounded-lg text-center">
          <Icon size={18} className="text-blue-400 mx-auto mb-1" />
          <p className="text-2xl font-bold text-white">{value}</p>
          <p className="text-xs text-slate-400">{label}</p>
        </div>
      ))}
    </div>

    <p className="text-xs text-slate-500 text-center">
      Registrado {formatDate(detail.client.created_at)}
    </p>
  </div>
);

const ServicesTab: React.FC<{ detail: ClientDetailFull }> = ({ detail }) => (
  <div className="space-y-3">
    {detail.services.length === 0 ? (
      <p className="text-center py-8 text-slate-400">Sin servicios registrados</p>
    ) : (
      detail.services.map((service) => (
        <div
          key={service.id}
          className="flex items-start gap-3 p-3 bg-slate-800/50 rounded-lg border border-slate-700"
        >
          <div
            className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg font-bold text-white text-xs"
            style={{ backgroundColor: service.color }}
          >
            {service.abbreviation}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-white text-sm">{service.name}</p>
            <div className="flex items-center gap-2 mt-1">
              <span
                className={`text-xs px-2 py-1 rounded-full ${
                  service.status === "active"
                    ? "bg-emerald-500/20 text-emerald-400"
                    : "bg-slate-600/20 text-slate-400"
                }`}
              >
                {service.status === "active" ? "Activo" : "Completado"}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Desde {formatDate(service.started_at)}
            </p>
          </div>
        </div>
      ))
    )}
  </div>
);

const CasesTab: React.FC<{ detail: ClientDetailFull }> = ({ detail }) => {
  const casesByType = detail.cases.reduce(
    (acc, c) => {
      const type = c.case_type || "Sin tipo";
      if (!acc[type]) acc[type] = [];
      acc[type].push(c);
      return acc;
    },
    {} as Record<string, typeof detail.cases>
  );

  return (
    <div className="space-y-4">
      {detail.cases.length === 0 ? (
        <p className="text-center py-8 text-slate-400">Sin casos registrados</p>
      ) : (
        Object.entries(casesByType).map(([type, cases]) => (
          <div key={type}>
            <p className="text-xs font-bold text-slate-400 uppercase px-2 py-2">{type}</p>
            <div className="space-y-2">
              {cases.map((caseItem) => (
                <div
                  key={caseItem.id}
                  className="p-3 bg-slate-800/50 rounded-lg border border-slate-700 space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-semibold text-white text-sm flex-1">{caseItem.title}</p>
                    <span
                      className={`text-xs px-2 py-1 rounded-full whitespace-nowrap flex-shrink-0 ${
                        caseItem.status === "open"
                          ? "bg-yellow-500/20 text-yellow-400"
                          : "bg-slate-600/20 text-slate-400"
                      }`}
                    >
                      {caseItem.status === "open" ? "Abierto" : "Cerrado"}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">{caseItem.case_number}</p>
                  {caseItem.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {caseItem.tags.map((tag, i) => (
                        <span
                          key={i}
                          className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded"
                        >
                          {tag.tag_value}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
};

const MediaTab: React.FC<{ media: ClientMedia[] }> = ({ media }) => {
  const grouped = media.reduce(
    (acc, m) => {
      if (!acc[m.media_type]) acc[m.media_type] = [];
      acc[m.media_type].push(m);
      return acc;
    },
    {} as Record<string, ClientMedia[]>
  );

  const typeIcons: Record<string, React.ReactNode> = {
    image: <Image size={32} />,
    audio: <Music size={32} />,
    document: <FileIcon size={32} />,
    video: <FileIcon size={32} />,
  };

  return (
    <div className="space-y-4">
      {media.length === 0 ? (
        <p className="text-center py-8 text-slate-400">Sin archivos compartidos</p>
      ) : (
        Object.entries(grouped).map(([type, files]) => (
          <div key={type}>
            <p className="text-xs font-bold text-slate-400 uppercase px-2 py-2">{type}</p>
            <div className="grid grid-cols-2 gap-2">
              {files.map((file) => (
                <div
                  key={file.id}
                  className="p-3 bg-slate-800/50 rounded-lg border border-slate-700 text-center space-y-2"
                >
                  <div className="flex justify-center text-slate-400">
                    {typeIcons[type] || <FileIcon size={32} />}
                  </div>
                  <p className="text-xs text-white truncate">{file.original_name}</p>
                  <p className="text-xs text-slate-400">
                    {file.file_size ? `${(file.file_size / 1024).toFixed(0)} KB` : "—"}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
};

const MessagesTab: React.FC<{ detail: ClientDetailFull; onViewAll: () => void }> = ({
  detail,
  onViewAll,
}) => (
  <div className="space-y-3">
    {detail.messages.length === 0 ? (
      <p className="text-center py-8 text-slate-400">Sin mensajes</p>
    ) : (
      <>
        {detail.messages.slice(0, 20).map((msg, i) => (
          <div
            key={i}
            className={`flex gap-2 ${msg.direction === "outbound" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[70%] px-3 py-2 rounded-lg text-sm ${
                msg.direction === "outbound"
                  ? "bg-emerald-800 text-white rounded-br-none"
                  : "bg-slate-700 text-white rounded-bl-none"
              }`}
            >
              <p className="text-xs text-slate-300 mb-1">{formatTime(msg.created_at)}</p>
              <p className="break-words">{msg.content}</p>
            </div>
          </div>
        ))}
        {detail.messages.length > 20 && (
          <button
            onClick={onViewAll}
            className="w-full text-center py-2 text-blue-400 hover:text-blue-300 text-sm font-semibold"
          >
            Ver todos ({detail.messages.length} mensajes)
          </button>
        )}
      </>
    )}
  </div>
);

// ─── Main Page ────────────────────────────────────────────────────────────────

const BotClients: React.FC = () => {
  const navigate = useNavigate();
  const [clients, setClients] = useState<BotClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [selectedClient, setSelectedClient] = useState<BotClient | null>(null);
  const [showRightPanel, setShowRightPanel] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detail, setDetail] = useState<ClientDetailFull | null>(null);
  const [media, setMedia] = useState<ClientMedia[]>([]);
  const [activeTab, setActiveTab] = useState<"info" | "services" | "cases" | "media" | "messages">("info");

  const fetchClients = useCallback(async () => {
    setLoading(true);
    try {
      const res = await botAPI.getClients();
      const data = res.data as { clients?: BotClient[] } | BotClient[];
      const list = Array.isArray(data) ? data : (data?.clients || []);
      setClients(list);
    } catch {
      setClients([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchClientDetail = useCallback(async (clientId: string | number) => {
    setDetailLoading(true);
    setActiveTab("info");
    try {
      const detailRes = await botAPI.getClientDetail(clientId);
      setDetail(detailRes.data);

      const mediaRes = await botAPI.getClientMedia(clientId);
      setMedia(mediaRes.data?.media || []);
    } catch {
      setDetail(null);
      setMedia([]);
    } finally {
      setDetailLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  const handleSelectClient = async (client: BotClient) => {
    setSelectedClient(client);
    setShowRightPanel(true);
    await fetchClientDetail(client.id);
  };

  const handleChat = () => {
    if (selectedClient) {
      localStorage.setItem("openChatPhone", selectedClient.phone);
      navigate("/dashboard/bot-messages");
    }
  };

  const filtered = clients.filter((c) => {
    const q = search.toLowerCase();
    return (c.name || "").toLowerCase().includes(q) || c.phone.includes(q);
  });

  return (
    <div
      className="-m-3 md:-m-8 flex overflow-hidden"
      style={{ height: "calc(100vh - 4rem)" }}
    >
      {/* LEFT PANEL — Client List */}
      <div
        className={`flex flex-col border-r border-slate-700 bg-slate-900 ${
          showRightPanel ? "hidden md:flex" : "flex"
        } w-full flex-shrink-0 md:w-80`}
      >
        {/* Header */}
        <div className="flex-shrink-0 border-b border-slate-700 p-4">
          <div className="mb-3 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500">
              <Users size={16} className="text-white" />
            </div>
            <h2 className="font-display text-base font-bold text-white">
              Clientes
            </h2>
            <span className="ml-auto rounded-full bg-slate-700 px-2 py-0.5 text-xs text-slate-300">
              {clients.length}
            </span>
          </div>

          {/* Search */}
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Buscar por nombre, número..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-800 py-2 pl-8 pr-3 text-sm text-white placeholder-slate-500 outline-none focus:border-blue-500"
            />
          </div>
        </div>

        {/* Client List */}
        <div className="flex-1 overflow-y-auto custom-scroll">
          {loading ? (
            <div className="flex items-center justify-center py-8 text-slate-500">
              <RefreshCw size={20} className="animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-8 text-center text-slate-600">
              <Users size={32} className="mx-auto mb-2 opacity-20" />
              <p className="text-sm">Sin clientes</p>
            </div>
          ) : (
            filtered.map((client) => (
              <ClientItem
                key={client.id}
                client={client}
                isSelected={selectedClient?.id === client.id}
                onSelect={() => handleSelectClient(client)}
              />
            ))
          )}
        </div>
      </div>

      {/* RIGHT PANEL — Client Detail */}
      <div
        className={`flex flex-1 flex-col overflow-hidden bg-slate-950 ${
          !showRightPanel ? "hidden md:flex" : "flex"
        }`}
      >
        {!selectedClient ? (
          <div className="flex flex-1 items-center justify-center text-slate-600">
            <p className="text-lg text-slate-500">Selecciona un cliente</p>
          </div>
        ) : (
          <>
            {/* Top Bar */}
            <div className="flex flex-shrink-0 items-center gap-3 border-b border-slate-800 bg-slate-900 px-4 py-3">
              <button
                className="md:hidden flex items-center justify-center rounded-lg p-1.5 text-slate-400 hover:bg-slate-800"
                onClick={() => {
                  setShowRightPanel(false);
                  setSelectedClient(null);
                }}
              >
                <ChevronLeft size={20} />
              </button>

              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-sm font-bold text-white">
                {getInitials(selectedClient.name, selectedClient.phone)}
              </div>

              <div className="flex-1 min-w-0">
                <p className="truncate font-semibold text-white">
                  {selectedClient.name || "Sin nombre"}
                </p>
                <p className="truncate text-xs text-slate-400">{selectedClient.phone}</p>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex flex-shrink-0 border-b border-slate-800 bg-slate-900 px-4 gap-1 overflow-x-auto">
              {(["info", "services", "cases", "media", "messages"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-3 py-2 text-sm font-semibold whitespace-nowrap transition-colors ${
                    activeTab === tab
                      ? "border-b-2 border-blue-500 text-blue-400"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  {tab === "info" && "Info"}
                  {tab === "services" && "Servicios"}
                  {tab === "cases" && "Casos"}
                  {tab === "media" && "Archivos"}
                  {tab === "messages" && "Mensajes"}
                </button>
              ))}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-4 py-4 custom-scroll">
              {detailLoading ? (
                <div className="flex items-center justify-center py-8 text-slate-500">
                  <RefreshCw size={20} className="animate-spin" />
                </div>
              ) : !detail ? (
                <p className="text-center py-8 text-slate-600">Error cargando detalles</p>
              ) : activeTab === "info" ? (
                <InfoTab detail={detail} onChat={handleChat} />
              ) : activeTab === "services" ? (
                <ServicesTab detail={detail} />
              ) : activeTab === "cases" ? (
                <CasesTab detail={detail} />
              ) : activeTab === "media" ? (
                <MediaTab media={media} />
              ) : (
                <MessagesTab detail={detail} onViewAll={handleChat} />
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default BotClients;
