import React, { useState, useMemo } from "react";
import { ExcelRow, USER_COLUMNS, WorkerKey } from "../../services/excelService";
import { servicesAPI } from "../../services/api";
import {
  Trash2,
  Sparkles,
  Check,
  X,
  Loader2,
} from "lucide-react";

// --- TIPOS ---
interface AdminDataTableProps {
  data: ExcelRow[];
  onSort: (column: string, direction: "asc" | "desc") => void;
  onServiceDeleted?: () => void;
  employeePercentage: number;
  isEmployeeView?: boolean; // Nuevo prop para controlar vista empleado
  currentEmployee?: string; // Nuevo prop para saber quién está logueado
}

interface UserServiceEntry {
  service: string;
  earnings: number;
  client: string;
  time: string;
  comment?: string;
  id?: number;
}

type GroupedUserData = Record<WorkerKey, UserServiceEntry[]>;

// API Key de Gemini (Idealmente mover a variables de entorno: import.meta.env.VITE_GEMINI_KEY)
const GEMINI_API_KEY = "TU_API_KEY_AQUI";

const AdminDataTable: React.FC<AdminDataTableProps> = ({
  data,
  onServiceDeleted,
  employeePercentage,
  isEmployeeView = false,
  currentEmployee,
}) => {
  // --- ESTADOS ---
  const [activeUser, setActiveUser] = useState<WorkerKey | "all">(
    isEmployeeView && currentEmployee ? (currentEmployee as WorkerKey) : "all",
  );
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [commentText, setCommentText] = useState<string>("");

  // Estados IA
  const [aiLoading, setAiLoading] = useState(false);
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [aiInsight, setAiInsight] = useState("");

  // --- TU LÓGICA DE DATOS ORIGINAL (INTACTA) ---
  const groupDataByUser = (): GroupedUserData => {
    const groupedData = USER_COLUMNS.reduce<GroupedUserData>((acc, user) => {
      acc[user] = [];
      return acc;
    }, {} as GroupedUserData);

    const findDetailValue = (
      currentIndex: number,
      detailType: string,
      user: WorkerKey,
    ) => {
      const searchOffsets = [1, 2, 3, -1, -2, -3];
      for (const offset of searchOffsets) {
        const candidate = data[currentIndex + offset];
        if (candidate && candidate.DETALLE === detailType)
          return candidate[user];
      }
      return undefined;
    };

    const findServiceId = (
      currentIndex: number,
      user: WorkerKey,
    ): number | undefined => {
      const searchOffsets = [-3, -2, -1, 0, 1, 2, 3];
      const userIdKey = `${user}_id`;
      for (const offset of searchOffsets) {
        const candidate = data[currentIndex + offset];
        if (candidate && candidate.DETALLE === "SERVICIO" && candidate[user]) {
          if (candidate[userIdKey]) return Number(candidate[userIdKey]);
          if (candidate.id) return Number(candidate.id);
        }
      }
      return undefined;
    };

    data.forEach((row, index) => {
      if (row.DETALLE !== "SERVICIO") return;

      USER_COLUMNS.forEach((user) => {
        const serviceValue = row[user];
        if (!serviceValue) return;

        const earnings = Number(findDetailValue(index, "GANANCIA", user)) || 0;
        const clientValue = findDetailValue(index, "CLIENTE", user);
        const timeValue = findDetailValue(index, "HORA", user);
        const commentValue = findDetailValue(index, "NOTA", user);

        let serviceId = row[`${user}_id`]
          ? Number(row[`${user}_id`])
          : row.id
            ? Number(row.id)
            : findServiceId(index, user);

        groupedData[user].push({
          service: String(serviceValue),
          earnings,
          client: clientValue ? String(clientValue) : "",
          time: timeValue ? String(timeValue) : "",
          comment: commentValue ? String(commentValue) : "",
          id: serviceId,
        });
      });
    });
    return groupedData;
  };

  const groupedData = useMemo(() => groupDataByUser(), [data]);

  const calculateUserTotals = () => {
    const totals: any = {};
    USER_COLUMNS.forEach((user) => {
      const total = groupedData[user].reduce((acc, s) => acc + s.earnings, 0);
      totals[user] = {
        total,
        adminShare: Number((total * (1 - employeePercentage / 100)).toFixed(2)),
        userShare: Number((total * (employeePercentage / 100)).toFixed(2)),
      };
    });
    return totals;
  };

  const userTotals = useMemo(
    () => calculateUserTotals(),
    [groupedData, employeePercentage],
  );

  const adminTotal = USER_COLUMNS.reduce(
    (acc, user) => acc + (userTotals[user]?.adminShare ?? 0),
    0,
  );

  // --- HANDLERS ---
  const handleDelete = async (serviceId: number | undefined) => {
    if (!serviceId) return;
    if (!window.confirm("¿Eliminar servicio?")) return;
    try {
      setDeletingId(serviceId);
      await servicesAPI.deleteService(serviceId);
      onServiceDeleted?.();
    } catch (error) {
      console.error(error);
      alert("Error al eliminar");
    } finally {
      setDeletingId(null);
    }
  };

  const handleEditComment = (id: string, current: string) => {
    setEditingCommentId(id);
    setCommentText(current);
  };

  const handleSaveComment = async (
    serviceId: number | undefined,
    userId: string,
    index: number,
  ) => {
    if (!serviceId) return;
    try {
      await servicesAPI.updateComment(serviceId, commentText);
      setEditingCommentId(null);
      onServiceDeleted?.();
    } catch (error) {
      console.error(error);
    }
  };

  // --- GEMINI AI HANDLER ---
  const handleGenerateInsights = async () => {
    setAiModalOpen(true);
    setAiLoading(true);
    setAiInsight("");

    // Preparar datos para el prompt
    const userToAnalyze =
      activeUser === "all" ? "Todos los usuarios" : activeUser;
    const statsText =
      activeUser === "all"
        ? `Total Global: ${adminTotal}`
        : `Usuario: ${activeUser}, Total: ${userTotals[activeUser].total}`;

    // Simplificar datos para enviar a IA (evitar payload gigante)
    const contextData =
      activeUser === "all"
        ? USER_COLUMNS.map((u) => ({
            user: u,
            total: userTotals[u].total,
            count: groupedData[u].length,
          }))
        : groupedData[activeUser].map((s) => ({ s: s.service, m: s.earnings }));

    const prompt = `
      Actúa como gerente de "PepRD". Analiza estos datos del día:
      Contexto: ${userToAnalyze}. Estadísticas: ${statsText}.
      Detalle simplificado: ${JSON.stringify(contextData).slice(0, 1000)}...
      
      Dame 3 puntos clave muy breves (con emojis):
      1. Rendimiento general.
      2. Servicio destacado o empleado destacado.
      3. Una recomendación corta.
    `;

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
        },
      );
      const result = await response.json();
      setAiInsight(
        result.candidates?.[0]?.content?.parts?.[0]?.text ||
          "No se pudo generar análisis.",
      );
    } catch (e) {
      setAiInsight("Error conectando con la IA.");
    } finally {
      setAiLoading(false);
    }
  };

  // --- RENDER ---
  const usersToRender = activeUser === "all" ? USER_COLUMNS : [activeUser];

  return (
    <div className="animate-in fade-in space-y-6 duration-500">
      {/* 1. HEADER: Tabs y Botón IA */}
      <div className="flex flex-col items-center justify-between gap-4 border-b border-slate-800 pb-4 md:flex-row">
        {/* Tabs de Usuario */}
        {!isEmployeeView && (
          <div className="scrollbar-hide flex w-full gap-2 overflow-x-auto pb-2 md:w-auto md:pb-0">
            <button
              onClick={() => setActiveUser("all")}
              className={`rounded-xl px-4 py-2 text-sm font-medium transition-all ${
                activeUser === "all"
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-900/40"
                  : "bg-slate-800 text-slate-400 hover:bg-slate-700"
              }`}
            >
              Todos
            </button>
            {USER_COLUMNS.map((user) => (
              <button
                key={user}
                onClick={() => setActiveUser(user)}
                className={`rounded-xl px-4 py-2 text-sm font-medium transition-all ${
                  activeUser === user
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-900/40"
                    : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                }`}
              >
                {user}
              </button>
            ))}
          </div>
        )}

        {/* Botón IA */}
        <button
          onClick={handleGenerateInsights}
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-2 text-sm font-bold text-white shadow-lg shadow-purple-900/30 transition-all hover:scale-105 hover:from-indigo-500 hover:to-purple-500"
        >
          <Sparkles size={16} /> Insights IA
        </button>
      </div>

      {/* 2. RESUMEN CARDS (Estilo Moderno) */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {!isEmployeeView && (
          <div className="rounded-2xl border border-slate-700/50 bg-slate-800/50 p-4 backdrop-blur-sm">
            <h4 className="mb-1 text-xs font-bold text-slate-400 uppercase">
              Total Admin
            </h4>
            <p className="text-3xl font-bold text-emerald-400">${adminTotal}</p>
          </div>
        )}

        {usersToRender.map((user) => (
          <div
            key={`stat-${user}`}
            className="rounded-2xl border border-slate-700 bg-slate-800 p-4 shadow-sm"
          >
            <div className="mb-2 flex items-center justify-between">
              <span className="font-bold text-white">{user}</span>
              <span className="rounded bg-slate-700 px-2 py-1 text-xs text-slate-300">
                {groupedData[user].length} serv.
              </span>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Total:</span>
                <span className="font-medium text-white">
                  ${userTotals[user].total}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Admin:</span>
                <span className="font-medium text-blue-400">
                  ${userTotals[user].adminShare}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Usuario:</span>
                <span className="font-medium text-yellow-400">
                  ${userTotals[user].userShare}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 3. TABLAS / LISTAS DE SERVICIOS */}
      {usersToRender.map((user) => (
        <div
          key={user}
          className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 shadow-xl"
        >
          {/* Header de la Tabla */}
          <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950/50 px-6 py-4">
            <h3 className="text-lg font-bold tracking-wide text-slate-200">
              {user}
            </h3>
          </div>

          {/* VISTA ESCRITORIO (Tabla) */}
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full text-left text-sm text-slate-400">
              <thead className="bg-slate-950/30 text-xs font-semibold text-slate-500 uppercase">
                <tr>
                  <th className="px-6 py-4">Hora</th>
                  <th className="px-6 py-4">Servicio</th>
                  <th className="px-6 py-4">Cliente</th>
                  <th className="px-6 py-4">Ganancia</th>
                  <th className="w-1/3 px-6 py-4">Nota</th>
                  <th className="px-6 py-4 text-center">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {groupedData[user].length > 0 ? (
                  groupedData[user].map((item, idx) => {
                    const isEditing = editingCommentId === `${user}-${idx}`;
                    return (
                      <tr
                        key={`${user}-${idx}`}
                        className="group transition-colors hover:bg-slate-800/50"
                      >
                        <td className="px-6 py-4 font-mono">
                          {item.time || "--:--"}
                        </td>
                        <td className="px-6 py-4 font-medium text-slate-200">
                          {item.service}
                        </td>
                        <td className="px-6 py-4">{item.client || "—"}</td>
                        <td className="px-6 py-4 font-bold text-emerald-400">
                          ${item.earnings}
                        </td>
                        <td className="px-6 py-4">
                          {isEditing ? (
                            <div className="flex gap-2">
                              <input
                                autoFocus
                                className="w-full rounded border border-slate-600 bg-slate-800 px-2 py-1 text-white focus:border-blue-500 focus:outline-none"
                                value={commentText}
                                onChange={(e) => setCommentText(e.target.value)}
                              />
                              <button
                                onClick={() =>
                                  handleSaveComment(item.id, user, idx)
                                }
                                className="text-green-400"
                              >
                                <Check size={18} />
                              </button>
                              <button
                                onClick={() => setEditingCommentId(null)}
                                className="text-red-400"
                              >
                                <X size={18} />
                              </button>
                            </div>
                          ) : (
                            <div
                              onClick={() =>
                                handleEditComment(
                                  `${user}-${idx}`,
                                  item.comment || "",
                                )
                              }
                              className="group/edit flex cursor-pointer items-center gap-2 hover:text-blue-400"
                            >
                              <span className="max-w-[200px] truncate">
                                {item.comment || (
                                  <span className="text-slate-600 italic">
                                    Agregar nota...
                                  </span>
                                )}
                              </span>
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <button
                            onClick={() => handleDelete(item.id)}
                            disabled={deletingId === item.id}
                            className="rounded p-2 text-slate-600 opacity-0 transition-all group-hover:opacity-100 hover:bg-red-400/10 hover:text-red-400"
                          >
                            {deletingId === item.id ? (
                              <Loader2 className="animate-spin" size={16} />
                            ) : (
                              <Trash2 size={16} />
                            )}
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-6 py-8 text-center text-slate-600"
                    >
                      Sin servicios registrados hoy
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* VISTA MÓVIL (Tarjetas) */}
          <div className="divide-y divide-slate-800 md:hidden">
            {groupedData[user].map((item, idx) => (
              <div key={`${user}-m-${idx}`} className="bg-slate-900 p-4">
                <div className="mb-2 flex items-start justify-between">
                  <div>
                    <p className="text-base font-bold text-white">
                      {item.service}
                    </p>
                    <p className="text-sm text-slate-500">
                      {item.client || "Cliente General"}
                    </p>
                  </div>
                  <span className="text-lg font-bold text-emerald-400">
                    ${item.earnings}
                  </span>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <div className="flex items-center gap-2 font-mono text-xs text-slate-500">
                    <span>{item.time}</span>
                    {item.comment && (
                      <span className="max-w-[150px] truncate rounded bg-slate-800 px-2 py-0.5 text-slate-300">
                        {item.comment}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="text-slate-600 hover:text-red-400"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* MODAL IA */}
      {aiModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-xl font-bold text-white">
                <Sparkles className="text-purple-400" /> Análisis IA
              </h3>
              <button onClick={() => setAiModalOpen(false)}>
                <X className="text-slate-400" />
              </button>
            </div>
            <div className="min-h-[150px] rounded-xl bg-slate-800/50 p-4 leading-relaxed whitespace-pre-wrap text-slate-200">
              {aiLoading ? (
                <div className="flex h-full flex-col items-center justify-center gap-3 text-slate-500">
                  <Loader2 className="animate-spin text-blue-500" size={32} />
                  <p>Analizando transacciones...</p>
                </div>
              ) : (
                aiInsight
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDataTable;
