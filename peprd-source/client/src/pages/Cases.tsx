import React, { useEffect, useState, useCallback } from "react";
import { Briefcase, Search, RefreshCw, ChevronLeft, Filter, AlertCircle, Tag, ChevronDown } from "lucide-react";

const getAPIUrl = () => {
  if (typeof window !== "undefined" && (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")) {
    return "http://localhost:3000";
  }
  return `http://${window.location.hostname}:3000`;
};

// Map frontend section IDs to backend case_type values
const SECTION_TO_CASE_TYPE: Record<string, string> = {
  "reclamaciones": "reclamaciones",
  "reclamaciones_digitacion": "reclamaciones",
  "reclamaciones_tienda_fisica": "tienda_fisica",
  "reclamaciones_administracion": "reclamaciones",
  "digitacion": "digitacion",
  "tienda_fisica": "tienda_fisica",
  "administracion": "reclamaciones",
  "consultas": "consultas",
  "tramites": "tramites",
};

interface CaseRow {
  id: number;
  case_number: string;
  title: string;
  description?: string;
  status: string;
  case_type?: string;
  court?: string;
  next_hearing?: string;
  client_id: number;
  created_at: string;
  tags: Array<{ tag_type: string; tag_value: string }>;
  client_name?: string;
  client_phone?: string;
}

interface Section {
  id: string;
  name: string;
  label: string;
  description: string;
  color: string;
  complaint_tags: Array<{ id: string; label: string; color: string }>;
}

const SECTIONS: Section[] = [
  // RECLAMACIONES AND SUBSECTIONS
  {
    id: "reclamaciones",
    name: "Reclamaciones",
    label: "📋 Reclamaciones",
    description: "Quejas y reclamaciones de clientes",
    color: "from-red-500 to-pink-600",
    complaint_tags: [
      {
        id: "servicio_erroneo",
        label: "Servicio erróneo",
        color: "#ef4444",
      },
      {
        id: "precios_altos",
        label: "Precios altos",
        color: "#f97316",
      },
      {
        id: "info_erronea",
        label: "Información errónea",
        color: "#eab308",
      },
    ],
  },
  {
    id: "reclamaciones_digitacion",
    name: "Reclamaciones - Digitación",
    label: "  └─ Digitación",
    description: "Reclamaciones de servicio de digitación",
    color: "from-red-500 to-pink-600",
    complaint_tags: [
      {
        id: "servicio_erroneo",
        label: "Servicio erróneo",
        color: "#ef4444",
      },
      {
        id: "precios_altos",
        label: "Precios altos",
        color: "#f97316",
      },
    ],
  },
  {
    id: "reclamaciones_tienda_fisica",
    name: "Reclamaciones - Tienda Física",
    label: "  └─ Tienda Física",
    description: "Reclamaciones de tienda física",
    color: "from-red-500 to-pink-600",
    complaint_tags: [
      {
        id: "producto_defectuoso",
        label: "Producto defectuoso",
        color: "#ef4444",
      },
      {
        id: "cantidad_incorrecta",
        label: "Cantidad incorrecta",
        color: "#f97316",
      },
    ],
  },
  {
    id: "reclamaciones_administracion",
    name: "Reclamaciones - Administración",
    label: "  └─ Administración",
    description: "Reclamaciones de servicios administrativos",
    color: "from-red-500 to-pink-600",
    complaint_tags: [
      {
        id: "info_erronea",
        label: "Información errónea",
        color: "#eab308",
      },
      {
        id: "servicio_erroneo",
        label: "Servicio erróneo",
        color: "#ef4444",
      },
    ],
  },

  // GENERAL CASES (NON-RECLAMACIONES)
  {
    id: "digitacion",
    name: "Digitación",
    label: "✍️ Digitación",
    description: "Casos generales de servicio de digitación",
    color: "from-blue-500 to-cyan-600",
    complaint_tags: [],
  },
  {
    id: "tienda_fisica",
    name: "Tienda Física",
    label: "🏪 Tienda Física",
    description: "Casos generales de tienda física",
    color: "from-amber-500 to-orange-600",
    complaint_tags: [],
  },
  {
    id: "administracion",
    name: "Administración",
    label: "⚙️ Administración",
    description: "Casos administrativos y generales",
    color: "from-purple-500 to-pink-600",
    complaint_tags: [],
  },

  {
    id: "consultas",
    name: "Consultas",
    label: "Consultas",
    description: "Consultas legales y asesoría",
    color: "from-blue-500 to-cyan-600",
    complaint_tags: [],
  },
  {
    id: "tramites",
    name: "Trámites",
    label: "Trámites",
    description: "Trámites y gestiones administrativas",
    color: "from-emerald-500 to-teal-600",
    complaint_tags: [],
  },
];

const Cases: React.FC = () => {
  const [activeSection, setActiveSection] = useState<Section>(SECTIONS[0]);
  const [cases, setCases] = useState<CaseRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCase, setSelectedCase] = useState<CaseRow | null>(null);
  const [showRightPanel, setShowRightPanel] = useState(false);
  const [showResolved, setShowResolved] = useState(false);
  const [expandReclamaciones, setExpandReclamaciones] = useState(false);

  // Separate sections into reclamaciones and normal cases
  const reclamacionesSections = SECTIONS.filter(s => s.id.startsWith('reclamaciones'));
  const normalCasesSections = SECTIONS.filter(s => !s.id.startsWith('reclamaciones'));

  const fetchCases = useCallback(async () => {
    setLoading(true);
    try {
      const caseType = SECTION_TO_CASE_TYPE[activeSection.id] || activeSection.id;
      const response = await fetch(
        `${getAPIUrl()}/api/cases?case_type=${caseType}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("peprd_bot_token") || localStorage.getItem("token")}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setCases(Array.isArray(data) ? data : data.cases || []);
      } else {
        setCases([]);
      }
    } catch (err) {
      console.error("Failed to fetch cases:", err);
      setCases([]);
    } finally {
      setLoading(false);
    }
  }, [activeSection]);

  useEffect(() => {
    fetchCases();
  }, [fetchCases]);

  const filtered = cases.filter((c) => {
    // Status filter
    const statusMatch = showResolved ? c.status === 'resolved' : c.status !== 'resolved';
    if (!statusMatch) return false;

    // Search filter
    const q = search.toLowerCase();
    const matchSearch =
      !search ||
      c.title.toLowerCase().includes(q) ||
      c.case_number.toLowerCase().includes(q) ||
      (c.client_name || "").toLowerCase().includes(q);

    // Tag filter
    if (selectedTags.size > 0) {
      const hasTag = c.tags.some((tag) => selectedTags.has(tag.tag_value));
      if (!hasTag) return false;
    }

    return matchSearch;
  });

  const toggleTag = (tagValue: string) => {
    const newTags = new Set(selectedTags);
    if (newTags.has(tagValue)) {
      newTags.delete(tagValue);
    } else {
      newTags.add(tagValue);
    }
    setSelectedTags(newTags);
  };

  return (
    <div
      className="-m-3 md:-m-8 flex overflow-hidden"
      style={{ height: "calc(100vh - 4rem)" }}
    >
      {/* LEFT PANEL — Sections & Filters */}
      <div
        className={`flex flex-col border-r border-slate-700 bg-slate-900 ${
          showRightPanel ? "hidden md:flex" : "flex"
        } w-full flex-shrink-0 md:w-80`}
      >
        {/* Header */}
        <div className="flex-shrink-0 border-b border-slate-700 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className={`flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br ${activeSection.color}`}>
              <Briefcase size={20} className="text-white" />
            </div>
            <h2 className="font-display text-lg font-bold text-white">Casos</h2>
            <span className="ml-auto rounded-full bg-slate-700 px-3 py-1 text-sm font-semibold text-slate-300">
              {filtered.length}
            </span>
          </div>

          {/* Search */}
          <div className="relative">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
            />
            <input
              type="text"
              placeholder="Buscar caso..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-800 py-3 pl-10 pr-3 text-base text-white placeholder-slate-500 outline-none focus:border-blue-500"
            />
          </div>
        </div>

        {/* Status Tabs */}
        <div className="flex-shrink-0 border-b border-slate-700 px-3 py-3 flex gap-2">
          <button
            onClick={() => setShowResolved(false)}
            className={`flex-1 px-4 py-3 rounded-lg text-sm font-semibold transition-all ${
              !showResolved
                ? "bg-blue-600 text-white"
                : "text-slate-400 hover:text-white bg-slate-800/50"
            }`}
          >
            Abiertos
          </button>
          <button
            onClick={() => setShowResolved(true)}
            className={`flex-1 px-4 py-3 rounded-lg text-sm font-semibold transition-all ${
              showResolved
                ? "bg-emerald-600 text-white"
                : "text-slate-400 hover:text-white bg-slate-800/50"
            }`}
          >
            Resueltos
          </button>
        </div>

        {/* Sections Tabs - Grouped */}
        <div className="flex-shrink-0 border-b border-slate-700 px-3 py-2 space-y-1 overflow-y-auto max-h-96">
          {/* RECLAMACIONES GROUP */}
          <div>
            <button
              onClick={() => setExpandReclamaciones(!expandReclamaciones)}
              className="w-full text-left px-4 py-3 rounded-lg text-base font-bold transition-all flex items-center gap-2 bg-red-950/40 hover:bg-red-950/60 text-red-400 border border-red-900/50"
            >
              <ChevronDown size={18} style={{ transform: expandReclamaciones ? 'rotate(0deg)' : 'rotate(-90deg)', transition: 'transform 0.2s' }} />
              📋 RECLAMACIONES
            </button>

            {expandReclamaciones && (
              <div className="space-y-1 mt-2 pl-2 border-l-2 border-red-900/50">
                {reclamacionesSections.slice(1).map((section) => (
                  <button
                    key={section.id}
                    onClick={() => {
                      setActiveSection(section);
                      setSelectedTags(new Set());
                      setSearch("");
                    }}
                    className={`w-full text-left px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      activeSection.id === section.id
                        ? "bg-red-600 text-white"
                        : "text-red-200 hover:text-white hover:bg-red-900/40"
                    }`}
                  >
                    {section.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* NORMAL CASES GROUP */}
          <div className="pt-2">
            <div className="text-xs font-bold text-slate-500 px-4 py-2 uppercase">CASOS</div>
            {normalCasesSections.map((section) => (
              <button
                key={section.id}
                onClick={() => {
                  setActiveSection(section);
                  setSelectedTags(new Set());
                  setSearch("");
                }}
                className={`w-full text-left px-4 py-3 rounded-lg text-base font-semibold transition-all ${
                  activeSection.id === section.id
                    ? "bg-slate-800 text-white border-l-4 border-blue-500"
                    : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                }`}
              >
                {section.label}
              </button>
            ))}
          </div>
        </div>

        {/* Complaint Tags Filter (for Reclamaciones) */}
        {activeSection.complaint_tags.length > 0 && (
          <div className="flex-shrink-0 border-b border-slate-700 px-4 py-4 space-y-3">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 text-sm font-semibold text-slate-400 hover:text-white w-full"
            >
              <Filter size={18} />
              Filtrar por tipo
            </button>

            {showFilters && (
              <div className="space-y-2">
                <button
                  onClick={() => setSelectedTags(new Set())}
                  className={`w-full text-left text-sm px-4 py-2 rounded transition-all font-medium ${
                    selectedTags.size === 0
                      ? "bg-blue-500/20 text-blue-400"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  Todos
                </button>

                {activeSection.complaint_tags.map((tag) => (
                  <button
                    key={tag.id}
                    onClick={() => toggleTag(tag.label)}
                    className={`w-full text-left text-sm px-4 py-2 rounded transition-all border ${
                      selectedTags.has(tag.label)
                        ? "text-white border-opacity-100"
                        : "text-slate-400 hover:text-white border-opacity-0"
                    }`}
                    style={{
                      backgroundColor: selectedTags.has(tag.label)
                        ? `${tag.color}20`
                        : "transparent",
                      borderColor: selectedTags.has(tag.label) ? tag.color : "transparent",
                    }}
                  >
                    {tag.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Cases List */}
        <div className="flex-1 overflow-y-auto custom-scroll px-4 py-3 space-y-2">
          {loading ? (
            <div className="flex items-center justify-center py-8 text-slate-500">
              <RefreshCw size={20} className="animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-8 text-center text-slate-600">
              <AlertCircle size={32} className="mx-auto mb-2 opacity-20" />
              <p className="text-sm">Sin casos</p>
            </div>
          ) : (
            filtered.map((caseItem) => (
              <div
                key={caseItem.id}
                onClick={() => {
                  setSelectedCase(caseItem);
                  setShowRightPanel(true);
                }}
                className={`cursor-pointer rounded-lg border-l-4 px-4 py-3 transition-all ${
                  selectedCase?.id === caseItem.id
                    ? "border-l-blue-500 bg-slate-800"
                    : "border-l-transparent hover:bg-slate-800/50"
                }`}
              >
                <p className="font-semibold text-white truncate text-base">{caseItem.title}</p>
                <p className="text-slate-400 text-sm mt-1">{caseItem.case_number}</p>
              </div>
            ))
          )}
        </div>
      </div>

      {/* RIGHT PANEL — Case Detail */}
      <div
        className={`flex flex-1 flex-col overflow-hidden bg-slate-950 ${
          !showRightPanel ? "hidden md:flex" : "flex"
        }`}
      >
        {!selectedCase ? (
          <div className="flex flex-1 items-center justify-center text-slate-600">
            <p className="text-lg text-slate-500">Selecciona un caso</p>
          </div>
        ) : (
          <>
            {/* Top Bar */}
            <div className="flex flex-shrink-0 items-center gap-3 border-b border-slate-800 bg-slate-900 px-6 py-4">
              <button
                className="md:hidden flex items-center justify-center rounded-lg p-2 text-slate-400 hover:bg-slate-800"
                onClick={() => {
                  setShowRightPanel(false);
                  setSelectedCase(null);
                }}
              >
                <ChevronLeft size={24} />
              </button>

              <div className="flex-1">
                <p className="truncate font-semibold text-white text-lg">
                  {selectedCase.case_number}
                </p>
                <p className="truncate text-sm text-slate-400 mt-1">
                  {selectedCase.title}
                </p>
              </div>

              {selectedCase.status !== 'resolved' && (
                <button
                  onClick={async () => {
                    try {
                      const response = await fetch(`${getAPIUrl()}/api/cases/${selectedCase.id}/resolve`, {
                        method: 'POST',
                        headers: {
                          Authorization: `Bearer ${localStorage.getItem("peprd_bot_token") || localStorage.getItem("token")}`,
                        },
                      });
                      const data = await response.json().catch(() => ({}));
                      if (response.ok) {
                        setSelectedCase(data.case);
                      } else {
                        console.error('Error resolving case:', response.status, data);
                        alert(`Error: ${data.error || response.statusText} (${response.status})`);
                      }
                    } catch (err) {
                      console.error('Error resolving case:', err);
                      alert(`Error: ${err.message}`);
                    }
                  }}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm rounded-lg font-semibold transition-colors"
                >
                  ✓ Resolver
                </button>
              )}
              {selectedCase.status === 'resolved' && (
                <button
                  onClick={async () => {
                    try {
                      const response = await fetch(`${getAPIUrl()}/api/cases/${selectedCase.id}/reopen`, {
                        method: 'POST',
                        headers: {
                          Authorization: `Bearer ${localStorage.getItem("peprd_bot_token") || localStorage.getItem("token")}`,
                        },
                      });
                      const data = await response.json().catch(() => ({}));
                      if (response.ok) {
                        setSelectedCase(data.case);
                      } else {
                        console.error('Error reopening case:', response.status, data);
                        alert(`Error: ${data.error || response.statusText} (${response.status})`);
                      }
                    } catch (err) {
                      console.error('Error reopening case:', err);
                      alert(`Error: ${err.message}`);
                    }
                  }}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded-lg font-semibold transition-colors"
                >
                  ↻ Re-abrir
                </button>
              )}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-8 py-8 custom-scroll space-y-8">
              {/* Title & Status */}
              <div>
                <h2 className="text-3xl font-bold text-white mb-3">{selectedCase.title}</h2>
                <p className="text-base text-slate-400 leading-relaxed">{selectedCase.description}</p>
              </div>

              {/* Message Source Reference */}
              {selectedCase.tags && selectedCase.tags.some(t => t.tag_type === 'source_phone') && (
                <div className="bg-blue-600/20 border border-blue-500/30 rounded-lg p-4">
                  <p className="text-xs text-blue-400 mb-2">Origen del reclamo</p>
                  <button
                    onClick={() => {
                      const sourcePhone = selectedCase.tags.find(t => t.tag_type === 'source_phone')?.tag_value;
                      if (sourcePhone) {
                        localStorage.setItem('openChatPhone', sourcePhone);
                        window.location.href = '/dashboard/bot-messages';
                      }
                    }}
                    className="w-full px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    💬 Ver mensaje original
                  </button>
                </div>
              )}

              {/* Info Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-800/50 p-4 rounded-lg">
                  <p className="text-xs text-slate-400 mb-1">Estado</p>
                  <p className="text-sm font-semibold text-white capitalize">
                    {selectedCase.status}
                  </p>
                </div>

                <div className="bg-slate-800/50 p-4 rounded-lg">
                  <p className="text-xs text-slate-400 mb-1">Caso #</p>
                  <p className="text-sm font-semibold text-white">{selectedCase.case_number}</p>
                </div>

                {selectedCase.court && (
                  <div className="bg-slate-800/50 p-4 rounded-lg">
                    <p className="text-xs text-slate-400 mb-1">Juzgado</p>
                    <p className="text-sm font-semibold text-white">{selectedCase.court}</p>
                  </div>
                )}

                <div className="bg-slate-800/50 p-4 rounded-lg">
                  <p className="text-xs text-slate-400 mb-1">Creado</p>
                  <p className="text-sm font-semibold text-white">
                    {new Date(selectedCase.created_at).toLocaleDateString("es-DO")}
                  </p>
                </div>
              </div>

              {/* Client Info */}
              {selectedCase.client_name && (
                <div className="bg-slate-800/50 p-4 rounded-lg">
                  <p className="text-xs text-slate-400 mb-3">Cliente</p>
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-sm font-bold text-white">
                      {selectedCase.client_name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-white text-sm">
                        {selectedCase.client_name}
                      </p>
                      <p className="text-xs text-slate-400">{selectedCase.client_phone}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Tags */}
              {selectedCase.tags.length > 0 && (
                <div>
                  <p className="text-xs text-slate-400 mb-3 flex items-center gap-2">
                    <Tag size={14} />
                    Etiquetas
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {selectedCase.tags.map((tag, i) => (
                      <span
                        key={i}
                        className="text-sm px-3 py-1.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30"
                      >
                        {tag.tag_value}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Cases;
