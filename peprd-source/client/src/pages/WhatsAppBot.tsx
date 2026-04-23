import React, { useEffect, useState, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import {
  MessageCircle,
  QrCode,
  Wifi,

  Loader2,
  CheckCircle2,
  Users,
  UserCheck,
  Pause,
  Play,
  Power,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { botAPI, BotStatus, BotMode } from "../services/botApi";

// ─── Card wrapper ────────────────────────────────────────────────────────────
const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = "",
}) => (
  <div
    className={`rounded-2xl border border-slate-700/50 bg-slate-900/50 p-6 backdrop-blur-sm ${className}`}
  >
    {children}
  </div>
);

// ─── Status badge ─────────────────────────────────────────────────────────────
const StatusBadge: React.FC<{ status: BotStatus["status"]; paused?: boolean }> = ({
  status,
  paused,
}) => {
  const map: Record<
    string,
    { label: string; color: string; dot: string }
  > = {
    disconnected: {
      label: "Desconectado",
      color: "text-slate-400 bg-slate-800/70 border-slate-600",
      dot: "bg-slate-500",
    },
    connecting: {
      label: "Conectando…",
      color: "text-yellow-400 bg-yellow-500/10 border-yellow-500/30",
      dot: "bg-yellow-400 animate-pulse",
    },
    connected: {
      label: paused ? "Bot Pausado" : "Bot Activo",
      color: paused
        ? "text-yellow-400 bg-yellow-500/10 border-yellow-500/30"
        : "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
      dot: paused ? "bg-yellow-400" : "bg-emerald-400",
    },
  };
  const s = map[status] ?? map.disconnected;
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm font-semibold ${s.color}`}
    >
      <span className={`h-2 w-2 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────
const WhatsAppBot: React.FC = () => {
  const [status, setStatus] = useState<BotStatus>({
    status: "disconnected",
    paused: false,
    mode: "all",
  });
  const [qr, setQr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const statusIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const qrIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Fetch helpers ──────────────────────────────────────────────────────────

  const fetchStatus = useCallback(async () => {
    try {
      const res = await botAPI.getStatus();
      // Adapt backend response: {connected, botActive, botMode} → {status, mode}
      const raw = res.data as unknown;
      setStatus({
        status: (raw as any).connected ? "connected" : "disconnected",
        paused: !(raw as any).botActive,
        mode: ((raw as any).botMode as "all" | "selected") ?? "all",
        // @ts-ignore
      });
    } catch {
      // silently ignore polling errors
    }
  }, []);

  const fetchQR = useCallback(async () => {
    try {
      const res = await botAPI.getQR();
      setQr(res.data.qr);
    } catch {
      // silently ignore
    }
  }, []);

  // ── Polling setup ──────────────────────────────────────────────────────────

  useEffect(() => {
    fetchStatus();
    statusIntervalRef.current = setInterval(fetchStatus, 5000);
    return () => {
      if (statusIntervalRef.current) clearInterval(statusIntervalRef.current);
    };
  }, [fetchStatus]);

  useEffect(() => {
    if (status.status === "connecting") {
      fetchQR();
      qrIntervalRef.current = setInterval(fetchQR, 2000);
    } else {
      if (qrIntervalRef.current) clearInterval(qrIntervalRef.current);
      if (status.status === "disconnected") setQr(null);
    }
    return () => {
      if (qrIntervalRef.current) clearInterval(qrIntervalRef.current);
    };
  }, [status.status, fetchQR]);

  // ── Actions ────────────────────────────────────────────────────────────────

  const handleConnect = async () => {
    setError(null);
    setLoading(true);
    try {
      await botAPI.connect();
      await fetchStatus();
    } catch (e: any) {
      setError(e?.response?.data?.message || "Error al iniciar conexión");
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    setError(null);
    setLoading(true);
    try {
      await botAPI.disconnect();
      await fetchStatus();
    } catch (e: any) {
      setError(e?.response?.data?.message || "Error al desconectar");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleBot = async () => {
    setError(null);
    try {
      await botAPI.toggleBot();
      await fetchStatus();
    } catch (e: any) {
      setError(e?.response?.data?.message || "Error al cambiar estado del bot");
    }
  };

  const handleSetMode = async (mode: BotMode) => {
    setError(null);
    try {
      await botAPI.setBotMode(mode);
      setStatus((prev) => ({ ...prev, mode }));
    } catch (e: any) {
      setError(e?.response?.data?.message || "Error al cambiar modo");
    }
  };

  const currentMode = status.mode ?? "all";

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 shadow-lg shadow-purple-500/30">
            <MessageCircle size={20} className="text-white" />
          </div>
          <div>
            <h2 className="font-display text-2xl font-bold text-white md:text-3xl">
              WhatsApp Bot
            </h2>
            <p className="text-sm text-slate-400">
              Gestiona la conexión y el modo de respuesta automática
            </p>
          </div>
        </div>
      </motion.div>

      {/* Error banner */}
      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Two-column grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* ── LEFT: Connection status + controls ── */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <Card>
            <h3 className="mb-5 font-display text-lg font-bold text-white">
              Estado de Conexión
            </h3>

            {/* Status badge */}
            <div className="mb-6">
              <StatusBadge status={status.status} paused={status.paused} />
              {status.phone && status.status === "connected" && (
                <p className="mt-2 text-xs text-slate-400">
                  Número:{" "}
                  <span className="font-medium text-slate-300">
                    {status.phone}
                  </span>
                </p>
              )}
            </div>

            {/* Action buttons by state */}
            <div className="mb-6 space-y-3">
              {status.status === "disconnected" && (
                <button
                  onClick={handleConnect}
                  disabled={loading}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 px-5 py-3 font-semibold text-white shadow-lg shadow-purple-500/30 transition-all hover:from-purple-500 hover:to-pink-500 disabled:opacity-60"
                >
                  {loading ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <Wifi size={18} />
                  )}
                  Iniciar Conexión
                </button>
              )}

              {status.status === "connecting" && (
                <div className="flex items-center justify-center gap-3 rounded-xl border border-yellow-500/30 bg-yellow-500/10 px-5 py-3 text-yellow-400">
                  <Loader2 size={18} className="animate-spin" />
                  <span className="font-medium">Esperando escaneo del QR…</span>
                </div>
              )}

              {status.status === "connected" && (
                <div className="flex flex-col gap-3">
                  <button
                    onClick={handleToggleBot}
                    className={`flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3 font-semibold transition-all ${
                      status.paused
                        ? "bg-emerald-600/20 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-600/30"
                        : "bg-yellow-600/20 border border-yellow-500/30 text-yellow-400 hover:bg-yellow-600/30"
                    }`}
                  >
                    {status.paused ? (
                      <>
                        <Play size={18} /> Reanudar Bot
                      </>
                    ) : (
                      <>
                        <Pause size={18} /> Pausar Bot
                      </>
                    )}
                  </button>
                  <button
                    onClick={handleDisconnect}
                    disabled={loading}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-5 py-3 font-semibold text-red-400 transition-all hover:bg-red-500/20 disabled:opacity-60"
                  >
                    {loading ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Power size={16} />
                    )}
                    Desconectar
                  </button>
                </div>
              )}
            </div>

            {/* Divider */}
            <div className="mb-5 border-t border-slate-700/50" />

            {/* Mode selector — always visible */}
            <div>
              <p className="mb-3 text-xs font-bold uppercase tracking-widest text-slate-500">
                Modo de Respuesta
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => handleSetMode("all")}
                  className={`flex flex-1 items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition-all ${
                    currentMode === "all"
                      ? "border-purple-500/50 bg-purple-600/20 text-purple-400 ring-2 ring-purple-500/40"
                      : "border-slate-700 bg-slate-800/50 text-slate-400 hover:border-slate-600 hover:text-white"
                  }`}
                >
                  <Users size={16} />
                  Todos
                </button>
                <button
                  onClick={() => handleSetMode("selected")}
                  className={`flex flex-1 items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition-all ${
                    currentMode === "selected"
                      ? "border-blue-500/50 bg-blue-600/20 text-blue-400 ring-2 ring-blue-500/40"
                      : "border-slate-700 bg-slate-800/50 text-slate-400 hover:border-slate-600 hover:text-white"
                  }`}
                >
                  <UserCheck size={16} />
                  Seleccionados
                </button>
              </div>

              {currentMode === "selected" && status.status === "disconnected" && (
                <p className="mt-3 rounded-lg border border-blue-500/20 bg-blue-500/10 px-3 py-2 text-xs text-blue-400">
                  💡 Conecta para gestionar contactos habilitados
                </p>
              )}
            </div>
          </Card>
        </motion.div>

        {/* ── RIGHT: QR Code ── */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <Card className="flex flex-col items-center justify-center min-h-[320px]">
            <h3 className="mb-6 w-full font-display text-lg font-bold text-white">
              Código QR
            </h3>

            {status.status === "connected" ? (
              <div className="flex flex-col items-center gap-4 py-6">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/20">
                  <CheckCircle2 size={40} className="text-emerald-400" />
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-emerald-400">
                    ¡Sesión Activa!
                  </p>
                  <p className="mt-1 text-sm text-slate-400">
                    WhatsApp conectado y listo
                  </p>
                </div>
              </div>
            ) : qr ? (
              <div className="flex flex-col items-center gap-4">
                <div className="rounded-2xl border border-slate-600 bg-white p-4 shadow-2xl shadow-purple-500/10">
                  <QRCodeSVG value={qr} size={224} level="M" />
                </div>
                <p className="text-center text-sm text-slate-400">
                  Escanea con WhatsApp →{" "}
                  <span className="font-medium text-slate-300">
                    Menú → Dispositivos vinculados
                  </span>
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-4 py-6">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-slate-800">
                  {status.status === "connecting" ? (
                    <Loader2 size={36} className="animate-spin text-yellow-400" />
                  ) : (
                    <QrCode size={36} className="text-slate-500" />
                  )}
                </div>
                <div className="text-center">
                  <p className="font-semibold text-slate-400">
                    {status.status === "connecting"
                      ? "Generando QR…"
                      : "Iniciar Conexión para ver QR"}
                  </p>
                  <p className="mt-1 text-xs text-slate-600">
                    El código aparecerá aquí automáticamente
                  </p>
                </div>
              </div>
            )}
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default WhatsAppBot;
