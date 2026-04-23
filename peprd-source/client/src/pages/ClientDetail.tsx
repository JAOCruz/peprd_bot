import { useEffect, useState, FormEvent } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  MessageSquare,
  Pencil,
  Trash2,
  UserCheck,
  Phone,
  Mail,
  MapPin,
  FileText,
  ClipboardList,
  Calendar,
  StickyNote,
  Send,
} from "lucide-react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

// ── small date helpers (the old template imported these from utils/format) ──
const fmtDate = (iso?: string) =>
  iso ? new Date(iso).toLocaleDateString("es-DO") : "—";
const fmtDateTime = (iso?: string) =>
  iso
    ? new Date(iso).toLocaleString("es-DO", { timeZone: "America/Santo_Domingo" })
    : "—";
const timeAgo = (iso?: string) => {
  if (!iso) return "";
  const diffSec = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diffSec < 60) return "ahora";
  if (diffSec < 3600) return `hace ${Math.floor(diffSec / 60)}m`;
  if (diffSec < 86400) return `hace ${Math.floor(diffSec / 3600)}h`;
  return `hace ${Math.floor(diffSec / 86400)}d`;
};

interface Note {
  id: number;
  body: string;
  author_id: number | null;
  author_name?: string | null;
  created_at: string;
}
interface ClientRec {
  id: number;
  name: string;
  phone: string;
  email?: string | null;
  address?: string | null;
  notes?: string | null;
  assigned_name?: string | null;
  assigned_to_name?: string | null;
  created_at: string;
}
interface Detail {
  client: ClientRec;
  cases: any[];
  messages: any[];
  documents: any[];
  appointments: any[];
  stats: {
    totalCases?: number;
    totalMessages?: number;
    totalDocuments?: number;
  };
}

export default function ClientDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();

  const [detail, setDetail] = useState<Detail | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    notes: "",
  });
  const [saving, setSaving] = useState(false);

  const [noteBody, setNoteBody] = useState("");
  const [posting, setPosting] = useState(false);

  async function load() {
    setLoading(true);
    setErr(null);
    try {
      const [d, n] = await Promise.all([
        api.get(`/clients/${id}/detail`),
        api.get(`/clients/${id}/notes`),
      ]);
      setDetail(d.data);
      setNotes(n.data?.notes || []);
    } catch (e: any) {
      setErr(e?.response?.data?.error || e.message || "Error al cargar");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  function openEdit() {
    const c = detail?.client;
    if (!c) return;
    setForm({
      name: c.name || "",
      phone: c.phone || "",
      email: c.email || "",
      address: c.address || "",
      notes: c.notes || "",
    });
    setEditing(true);
  }

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put(`/clients/${id}`, form);
      setEditing(false);
      await load();
    } catch (e: any) {
      alert(e?.response?.data?.error || e.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm("¿Eliminar este cliente? Esta acción no se puede deshacer."))
      return;
    try {
      await api.delete(`/clients/${id}`);
      navigate("/dashboard/clients");
    } catch (e: any) {
      alert(e?.response?.data?.error || e.message);
    }
  }

  async function handlePostNote(e: FormEvent) {
    e.preventDefault();
    if (!noteBody.trim()) return;
    setPosting(true);
    try {
      const r = await api.post(`/clients/${id}/notes`, {
        body: noteBody.trim(),
      });
      setNotes([r.data.note, ...notes]);
      setNoteBody("");
    } catch (e: any) {
      alert(e?.response?.data?.error || e.message);
    } finally {
      setPosting(false);
    }
  }

  async function handleDeleteNote(noteId: number) {
    if (!confirm("¿Borrar esta nota?")) return;
    try {
      await api.delete(`/clients/${id}/notes/${noteId}`);
      setNotes(notes.filter((n) => n.id !== noteId));
    } catch (e: any) {
      alert(e?.response?.data?.error || e.message);
    }
  }

  if (loading)
    return <p className="text-slate-500">Cargando…</p>;
  if (err)
    return (
      <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-red-300">
        {err}
      </div>
    );
  if (!detail) return null;

  const { client, cases, messages, appointments, stats } = detail;
  const recentMessages = (messages || []).slice(0, 8);
  const upcomingAppointments = (appointments || [])
    .filter(
      (a: any) => new Date(a.date) >= new Date(new Date().toDateString())
    )
    .slice(0, 5);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Link
            to="/dashboard/clients"
            className="rounded-lg border border-slate-700 bg-slate-800 p-2 text-slate-300 hover:bg-slate-700"
          >
            <ArrowLeft size={14} />
          </Link>
          <h1 className="font-serif italic text-2xl text-white">
            {client.name}
          </h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            to={`/dashboard/messages?client=${client.id}`}
            className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs text-slate-200 hover:bg-slate-700"
          >
            <MessageSquare size={13} /> Chat
          </Link>
          <button
            onClick={openEdit}
            className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs text-slate-200 hover:bg-slate-700"
          >
            <Pencil size={13} /> Editar
          </button>
          {isAdmin && (
            <button
              onClick={handleDelete}
              className="flex items-center gap-1.5 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-xs text-red-300 hover:bg-red-500/20"
            >
              <Trash2 size={13} /> Eliminar
            </button>
          )}
        </div>
      </div>

      {/* Contact card */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
          <InfoRow icon={<Phone size={14} />} label="Teléfono" value={client.phone} />
          <InfoRow icon={<Mail size={14} />} label="Correo" value={client.email || "—"} />
          <InfoRow icon={<MapPin size={14} />} label="Domicilio" value={client.address || "—"} />
          <InfoRow
            icon={<UserCheck size={14} />}
            label="Asignado a"
            value={client.assigned_name || client.assigned_to_name || "Sin asignar"}
          />
          <InfoRow label="Registrado" value={fmtDate(client.created_at)} />
        </div>
        {client.notes && (
          <div className="mt-4 rounded-r-md border-l-[3px] border-[#c89b3c] bg-[#c89b3c]/10 px-4 py-3 text-sm text-slate-200 whitespace-pre-wrap">
            <div className="mb-1 font-mono text-[10px] uppercase tracking-widest text-slate-500">
              Resumen
            </div>
            {client.notes}
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat icon={<ClipboardList size={16} />} label="Pedidos / Casos" value={stats?.totalCases || 0} />
        <Stat icon={<MessageSquare size={16} />} label="Mensajes" value={stats?.totalMessages || 0} />
        <Stat icon={<FileText size={16} />} label="Documentos" value={stats?.totalDocuments || 0} />
        <Stat icon={<Calendar size={16} />} label="Citas" value={(appointments || []).length} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Timeline notes */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="flex items-center gap-2 font-serif italic text-lg text-white">
              <StickyNote size={16} className="text-[#c89b3c]" /> Notas
            </h3>
            <span className="font-mono text-xs text-slate-500">{notes.length}</span>
          </div>
          <form onSubmit={handlePostNote} className="mb-4 space-y-2">
            <textarea
              rows={2}
              placeholder="Escribe una nota sobre este cliente…"
              value={noteBody}
              onChange={(e) => setNoteBody(e.target.value)}
              maxLength={4000}
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-[#2d5f5a] focus:outline-none focus:ring-1 focus:ring-[#2d5f5a]"
            />
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] text-slate-500">
                {noteBody.length}/4000
              </span>
              <button
                type="submit"
                disabled={posting || !noteBody.trim()}
                className="flex items-center gap-1.5 rounded-lg bg-[#2d5f5a] px-3 py-1.5 text-xs font-medium text-[#f6f3ec] hover:bg-[#244e4a] disabled:opacity-50"
              >
                <Send size={12} /> {posting ? "Guardando…" : "Agregar"}
              </button>
            </div>
          </form>

          {notes.length === 0 ? (
            <p className="text-sm text-slate-500">Sin notas todavía.</p>
          ) : (
            <ul className="space-y-3">
              {notes.map((n) => {
                const canDelete = isAdmin || n.author_id === user?.id;
                return (
                  <li
                    key={n.id}
                    className="border-l-2 border-[#2d5f5a] pl-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-medium text-slate-200">
                        {n.author_name || "Sistema"}
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          title={fmtDateTime(n.created_at)}
                          className="font-mono text-[10px] text-slate-500"
                        >
                          {timeAgo(n.created_at)}
                        </span>
                        {canDelete && (
                          <button
                            onClick={() => handleDeleteNote(n.id)}
                            title="Borrar"
                            className="rounded p-1 text-slate-500 hover:bg-slate-800 hover:text-red-400"
                          >
                            <Trash2 size={11} />
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="mt-1 whitespace-pre-wrap text-sm text-slate-300">
                      {n.body}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Right column */}
        <div className="space-y-4">
          <Panel title="Pedidos / Casos" icon={<ClipboardList size={16} />}>
            {(cases || []).length === 0 ? (
              <p className="text-sm text-slate-500">Sin casos registrados.</p>
            ) : (
              <ul className="space-y-2">
                {cases.slice(0, 5).map((c: any) => (
                  <li
                    key={c.id}
                    className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900/40 px-3 py-2 text-sm"
                  >
                    <div>
                      <div className="font-mono text-xs text-slate-400">
                        {c.case_number}
                      </div>
                      <div className="text-slate-200">{c.title || "—"}</div>
                    </div>
                    <span className="rounded border border-slate-700 bg-slate-800 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-slate-300">
                      {c.status}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          <Panel title="Citas próximas" icon={<Calendar size={16} />}>
            {upcomingAppointments.length === 0 ? (
              <p className="text-sm text-slate-500">Sin citas próximas.</p>
            ) : (
              <ul className="space-y-2">
                {upcomingAppointments.map((a: any) => (
                  <li
                    key={a.id}
                    className="rounded-lg border border-slate-800 bg-slate-900/40 px-3 py-2 text-sm text-slate-200"
                  >
                    <div className="font-mono text-xs text-slate-400">
                      {fmtDate(a.date)} · {a.time}
                    </div>
                    <div>{a.type || a.notes || "Cita"}</div>
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          <Panel title="Mensajes recientes" icon={<MessageSquare size={16} />}>
            {recentMessages.length === 0 ? (
              <p className="text-sm text-slate-500">Sin mensajes.</p>
            ) : (
              <ul className="space-y-1.5">
                {recentMessages.map((m: any) => (
                  <li
                    key={m.id}
                    className="rounded border border-slate-800 bg-slate-900/40 px-3 py-2"
                  >
                    <div className="flex justify-between font-mono text-[10px] uppercase tracking-wider text-slate-500">
                      <span>{m.direction === "inbound" ? "← in" : "→ out"}</span>
                      <span>{timeAgo(m.created_at)}</span>
                    </div>
                    <div className="mt-0.5 line-clamp-2 text-sm text-slate-300">
                      {m.content}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>
      </div>

      {/* Edit modal */}
      {editing && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={() => setEditing(false)}
        >
          <form
            onSubmit={handleSave}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md space-y-3 rounded-xl border border-slate-800 bg-slate-900 p-6"
          >
            <h3 className="font-serif italic text-xl text-white">Editar cliente</h3>
            {(["name", "phone", "email", "address"] as const).map((k) => (
              <div key={k}>
                <label className="mb-1 block font-mono text-[10px] uppercase tracking-widest text-slate-500">
                  {k}
                </label>
                <input
                  type="text"
                  value={(form as any)[k]}
                  onChange={(e) => setForm({ ...form, [k]: e.target.value })}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white focus:border-[#2d5f5a] focus:outline-none"
                />
              </div>
            ))}
            <div>
              <label className="mb-1 block font-mono text-[10px] uppercase tracking-widest text-slate-500">
                Resumen
              </label>
              <textarea
                rows={3}
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white focus:border-[#2d5f5a] focus:outline-none"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs text-slate-300"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving}
                className="rounded-lg bg-[#2d5f5a] px-4 py-1.5 text-xs font-medium text-[#f6f3ec] hover:bg-[#244e4a] disabled:opacity-50"
              >
                {saving ? "Guardando…" : "Guardar"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

// ── small sub-components ──
function InfoRow({
  icon,
  label,
  value,
}: {
  icon?: React.ReactNode;
  label: string;
  value?: string | null;
}) {
  return (
    <div>
      <div className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-slate-500">
        {icon}
        <span>{label}</span>
      </div>
      <div className="mt-0.5 truncate text-sm text-slate-200">{value || "—"}</div>
    </div>
  );
}

function Stat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
}) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
      <div className="flex items-center justify-between">
        <div className="font-mono text-[10px] uppercase tracking-widest text-slate-500">
          {label}
        </div>
        <span className="text-[#c89b3c]">{icon}</span>
      </div>
      <div className="mt-1 font-serif italic text-2xl text-white">{value}</div>
    </div>
  );
}

function Panel({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
      <div className="mb-3 flex items-center gap-2">
        <span className="text-[#c89b3c]">{icon}</span>
        <h3 className="font-serif italic text-lg text-white">{title}</h3>
      </div>
      {children}
    </div>
  );
}
