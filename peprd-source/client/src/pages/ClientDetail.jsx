import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { api } from '../utils/api'
import { useAuth } from '../contexts/AuthContext'
import { formatDate, formatDateTime, timeAgo, STATUS_MAP } from '../utils/format'
import {
  ArrowLeft, MessageSquare, Pencil, Trash2, UserCheck, Phone, Mail, MapPin,
  FileText, ClipboardList, Calendar, StickyNote, Send,
} from 'lucide-react'

export default function ClientDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'

  const [detail, setDetail] = useState(null)
  const [notes, setNotes] = useState([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState(null)

  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({})
  const [saving, setSaving] = useState(false)

  const [noteBody, setNoteBody] = useState('')
  const [posting, setPosting] = useState(false)

  async function load() {
    setLoading(true)
    setErr(null)
    try {
      const [d, n] = await Promise.all([
        api.get(`/clients/${id}/detail`),
        api.get(`/clients/${id}/notes`),
      ])
      setDetail(d)
      setNotes(n.notes || [])
    } catch (e) {
      setErr(e.message || 'Error al cargar')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [id])

  function openEdit() {
    const c = detail?.client || {}
    setForm({
      name: c.name || '',
      phone: c.phone || '',
      email: c.email || '',
      address: c.address || '',
      notes: c.notes || '',
    })
    setEditing(true)
  }

  async function handleSave(e) {
    e.preventDefault()
    setSaving(true)
    try {
      await api.put(`/clients/${id}`, form)
      setEditing(false)
      load()
    } catch (e) {
      alert(e.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!confirm('¿Eliminar este cliente? Esta acción no se puede deshacer.')) return
    try {
      await api.del(`/clients/${id}`)
      navigate('/clients')
    } catch (e) {
      alert(e.message)
    }
  }

  async function handlePostNote(e) {
    e.preventDefault()
    if (!noteBody.trim()) return
    setPosting(true)
    try {
      const r = await api.post(`/clients/${id}/notes`, { body: noteBody.trim() })
      setNotes([r.note, ...notes])
      setNoteBody('')
    } catch (e) {
      alert(e.message)
    } finally {
      setPosting(false)
    }
  }

  async function handleDeleteNote(noteId) {
    if (!confirm('¿Borrar esta nota?')) return
    try {
      await api.del(`/clients/${id}/notes/${noteId}`)
      setNotes(notes.filter(n => n.id !== noteId))
    } catch (e) {
      alert(e.message)
    }
  }

  if (loading) return <p className="text-muted">Cargando...</p>
  if (err) return <p className="text-danger">{err}</p>
  if (!detail) return null

  const { client, cases, messages, documents, appointments, stats } = detail
  const recentMessages = (messages || []).slice(0, 8)
  const upcomingAppointments = (appointments || [])
    .filter(a => new Date(a.date) >= new Date(new Date().toDateString()))
    .slice(0, 5)

  return (
    <div>
      <div className="flex-between mb-md">
        <div className="flex gap-sm" style={{ alignItems: 'center' }}>
          <Link to="/clients" className="btn btn-secondary btn-sm"><ArrowLeft size={14} /></Link>
          <h2 style={{ margin: 0 }}>{client.name}</h2>
        </div>
        <div className="flex gap-sm">
          <Link to={`/messages/${client.id}`} className="btn btn-secondary btn-sm">
            <MessageSquare size={13} /> Chat
          </Link>
          <button className="btn btn-secondary btn-sm" onClick={openEdit}>
            <Pencil size={13} /> Editar
          </button>
          {isAdmin && (
            <button className="btn btn-danger btn-sm" onClick={handleDelete}>
              <Trash2 size={13} /> Eliminar
            </button>
          )}
        </div>
      </div>

      {/* Contact card */}
      <div className="card mb-md">
        <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
          <InfoRow icon={<Phone size={14} />} label="Teléfono" value={client.phone} />
          <InfoRow icon={<Mail size={14} />} label="Correo" value={client.email || '—'} />
          <InfoRow icon={<MapPin size={14} />} label="Domicilio" value={client.address || '—'} />
          <InfoRow
            icon={<UserCheck size={14} />}
            label="Asignado a"
            value={client.assigned_name || client.assigned_to_name || 'Sin asignar'}
          />
          <InfoRow label="Registrado" value={formatDate(client.created_at)} />
        </div>
        {client.notes && (
          <div className="mt-md" style={{
            padding: '10px 14px', borderLeft: '3px solid #c89b3c',
            background: 'rgba(200,155,60,0.08)', borderRadius: '4px',
            fontSize: '13px', whiteSpace: 'pre-wrap',
          }}>
            <div style={{ fontSize: '10px', letterSpacing: '1.5px', textTransform: 'uppercase', color: '#8a8577', marginBottom: '4px' }}>
              Resumen
            </div>
            {client.notes}
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid mb-md" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px' }}>
        <Stat icon={<ClipboardList size={16} />} label="Casos" value={stats?.totalCases || 0} />
        <Stat icon={<MessageSquare size={16} />} label="Mensajes" value={stats?.totalMessages || 0} />
        <Stat icon={<FileText size={16} />} label="Documentos" value={stats?.totalDocuments || 0} />
        <Stat icon={<Calendar size={16} />} label="Citas" value={(appointments || []).length} />
      </div>

      <div className="grid" style={{ gridTemplateColumns: 'minmax(280px, 1fr) minmax(280px, 1fr)', gap: '16px' }}>
        {/* Timeline notes */}
        <div className="card">
          <div className="flex-between mb-sm">
            <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <StickyNote size={16} /> Notas
            </h3>
            <span className="text-sm text-muted">{notes.length}</span>
          </div>
          <form onSubmit={handlePostNote} className="mb-md">
            <textarea
              className="input"
              rows="2"
              placeholder="Escribe una nota sobre este cliente..."
              value={noteBody}
              onChange={e => setNoteBody(e.target.value)}
              maxLength={4000}
            />
            <div className="flex-between mt-sm">
              <span className="text-sm text-muted">{noteBody.length}/4000</span>
              <button className="btn btn-primary btn-sm" disabled={posting || !noteBody.trim()}>
                <Send size={13} /> {posting ? 'Guardando...' : 'Agregar nota'}
              </button>
            </div>
          </form>
          {notes.length === 0 ? (
            <p className="empty">Sin notas todavía</p>
          ) : (
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {notes.map(n => {
                const canDelete = isAdmin || n.author_id === user.id
                return (
                  <li key={n.id} style={{
                    borderLeft: '2px solid #2d5f5a', paddingLeft: '12px',
                    marginBottom: '14px',
                  }}>
                    <div className="flex-between">
                      <div className="text-sm" style={{ fontWeight: 600 }}>
                        {n.author_name || 'Sistema'}
                      </div>
                      <div className="flex gap-sm" style={{ alignItems: 'center' }}>
                        <span className="text-sm text-muted" title={formatDateTime(n.created_at)}>
                          {timeAgo(n.created_at)}
                        </span>
                        {canDelete && (
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => handleDeleteNote(n.id)}
                            title="Borrar nota"
                            style={{ padding: '2px 6px' }}
                          >
                            <Trash2 size={11} />
                          </button>
                        )}
                      </div>
                    </div>
                    <div style={{ whiteSpace: 'pre-wrap', fontSize: '13px', marginTop: '2px' }}>
                      {n.body}
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        {/* Right column: cases + appointments + recent messages */}
        <div>
          <div className="card mb-md">
            <div className="flex-between mb-sm">
              <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ClipboardList size={16} /> Casos
              </h3>
              <Link to="/cases" className="text-sm">Ver todos →</Link>
            </div>
            {(cases || []).length === 0 ? (
              <p className="empty">Sin casos</p>
            ) : (
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {cases.slice(0, 5).map(c => (
                  <li key={c.id} style={{ borderBottom: '1px solid #ddd5c8', padding: '8px 0' }}>
                    <div className="flex-between">
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '13px' }}>{c.case_number}</div>
                        <div className="text-sm text-muted">{c.title}</div>
                      </div>
                      <span className={`badge ${STATUS_MAP[c.status]?.cls || 'badge-muted'}`}>
                        {STATUS_MAP[c.status]?.label || c.status}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="card mb-md">
            <h3 style={{ margin: 0, marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Calendar size={16} /> Próximas citas
            </h3>
            {upcomingAppointments.length === 0 ? (
              <p className="empty">Sin citas pendientes</p>
            ) : (
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {upcomingAppointments.map(a => (
                  <li key={a.id} style={{ padding: '6px 0', fontSize: '13px' }}>
                    <strong>{formatDate(a.date)}</strong> · {a.time?.substring(0, 5)} · {a.type}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="card">
            <div className="flex-between mb-sm">
              <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <MessageSquare size={16} /> Mensajes recientes
              </h3>
              <Link to={`/messages/${client.id}`} className="text-sm">Abrir chat →</Link>
            </div>
            {recentMessages.length === 0 ? (
              <p className="empty">Sin mensajes</p>
            ) : (
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {recentMessages.map(m => (
                  <li key={m.id} style={{
                    padding: '6px 10px',
                    borderRadius: '6px',
                    marginBottom: '4px',
                    background: m.direction === 'inbound' ? 'rgba(45,95,90,0.08)' : 'rgba(200,155,60,0.08)',
                    fontSize: '12px',
                  }}>
                    <div className="flex-between">
                      <strong>{m.direction === 'inbound' ? 'Cliente' : 'Bot'}</strong>
                      <span className="text-sm text-muted">{timeAgo(m.created_at)}</span>
                    </div>
                    <div style={{ whiteSpace: 'pre-wrap' }}>{m.content?.substring(0, 160)}{m.content?.length > 160 ? '…' : ''}</div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      {/* Edit modal */}
      {editing && (
        <div className="modal-overlay" onClick={() => setEditing(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>Editar cliente</h3>
            <form onSubmit={handleSave}>
              <div className="mb-sm"><label className="label">Nombre *</label><input className="input" required value={form.name || ''} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
              <div className="mb-sm"><label className="label">Teléfono *</label><input className="input" required value={form.phone || ''} onChange={e => setForm({ ...form, phone: e.target.value })} /></div>
              <div className="mb-sm"><label className="label">Correo</label><input className="input" type="email" value={form.email || ''} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
              <div className="mb-sm"><label className="label">Domicilio</label><input className="input" value={form.address || ''} onChange={e => setForm({ ...form, address: e.target.value })} /></div>
              <div className="mb-md"><label className="label">Resumen (notas rápidas)</label><textarea className="input" rows="3" value={form.notes || ''} onChange={e => setForm({ ...form, notes: e.target.value })} /></div>
              <div className="flex gap-sm" style={{ justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setEditing(false)}>Cancelar</button>
                <button className="btn btn-primary" disabled={saving}>{saving ? 'Guardando...' : 'Guardar'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

function InfoRow({ icon, label, value }) {
  return (
    <div>
      <div style={{ fontSize: '10px', letterSpacing: '1.5px', textTransform: 'uppercase', color: '#8a8577', marginBottom: '2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
        {icon} {label}
      </div>
      <div style={{ fontSize: '14px' }}>{value}</div>
    </div>
  )
}

function Stat({ icon, label, value }) {
  return (
    <div className="card" style={{ padding: '12px 14px' }}>
      <div style={{ fontSize: '10px', letterSpacing: '1.5px', textTransform: 'uppercase', color: '#8a8577', display: 'flex', alignItems: 'center', gap: '6px' }}>
        {icon} {label}
      </div>
      <div style={{ fontSize: '22px', fontWeight: 700, marginTop: '4px' }}>{value}</div>
    </div>
  )
}
