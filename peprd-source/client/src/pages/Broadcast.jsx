import { useState, useEffect } from 'react'
import { api } from '../utils/api'
import { formatDate } from '../utils/format'
import { Radio, Send, Clock, Users, CheckCircle, XCircle, Trash2, ChevronDown, ChevronUp, Image } from 'lucide-react'

const STATUS_CONFIG = {
  pending:   { label: 'Pendiente',  color: '#94a3b8', bg: 'rgba(148,163,184,0.12)' },
  sending:   { label: 'Enviando…',  color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
  done:      { label: 'Enviado',    color: '#34d399', bg: 'rgba(52,211,153,0.12)' },
  failed:    { label: 'Fallido',    color: '#f87171', bg: 'rgba(248,113,113,0.12)' },
  cancelled: { label: 'Cancelado',  color: '#64748b', bg: 'rgba(100,116,139,0.12)' },
}

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.pending
  return (
    <span style={{ background: cfg.bg, color: cfg.color, borderRadius: 9999, padding: '2px 10px', fontSize: 11, fontWeight: 700 }}>
      {cfg.label}
    </span>
  )
}

export default function Broadcast() {
  const [clients, setClients] = useState([])
  const [broadcasts, setBroadcasts] = useState([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [expandedId, setExpandedId] = useState(null)
  const [recipients, setRecipients] = useState({})
  const [search, setSearch] = useState('')

  // Form state
  const [selectedIds, setSelectedIds] = useState(new Set())
  const [message, setMessage] = useState('')
  const [title, setTitle] = useState('')
  const [mediaUrl, setMediaUrl] = useState('')
  const [scheduleMode, setScheduleMode] = useState('now') // 'now' | 'schedule'
  const [scheduledAt, setScheduledAt] = useState('')
  const [showForm, setShowForm] = useState(false)

  useEffect(() => {
    loadAll()
  }, [])

  async function loadAll() {
    setLoading(true)
    try {
      const [cData, bData] = await Promise.all([
        api.get('/clients'),
        api.get('/broadcasts'),
      ])
      setClients(cData.clients || [])
      setBroadcasts(bData.broadcasts || [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  async function loadRecipients(broadcastId) {
    if (recipients[broadcastId]) return
    try {
      const data = await api.get(`/broadcasts/${broadcastId}/recipients`)
      setRecipients(prev => ({ ...prev, [broadcastId]: data.recipients || [] }))
    } catch (e) {}
  }

  function toggleClient(id) {
    setSelectedIds(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function selectAll() {
    const filtered = clients.filter(c => !search || c.name.toLowerCase().includes(search.toLowerCase()))
    setSelectedIds(new Set(filtered.map(c => c.id)))
  }

  function clearAll() { setSelectedIds(new Set()) }

  async function handleSend(e) {
    e.preventDefault()
    if (!message.trim() || selectedIds.size === 0) return
    setSending(true)
    try {
      const payload = {
        title: title || null,
        message: message.trim(),
        mediaUrl: mediaUrl || null,
        clientIds: [...selectedIds],
        scheduledAt: scheduleMode === 'schedule' && scheduledAt ? new Date(scheduledAt).toISOString() : null,
      }
      await api.post('/broadcasts', payload)
      setMessage(''); setTitle(''); setMediaUrl(''); setScheduledAt(''); setSelectedIds(new Set()); setShowForm(false)
      await loadAll()
    } catch (err) {
      alert('Error al crear broadcast')
    } finally {
      setSending(false)
    }
  }

  async function handleCancel(id) {
    if (!confirm('¿Cancelar este broadcast?')) return
    try {
      await api.delete(`/broadcasts/${id}`)
      await loadAll()
    } catch (e) { alert('Error al cancelar') }
  }

  async function handleSendNow(id) {
    if (!confirm('¿Enviar este broadcast ahora?')) return
    try {
      await api.post(`/broadcasts/${id}/send`)
      await loadAll()
    } catch (e) { alert('Error al enviar') }
  }

  const filteredClients = clients.filter(c =>
    !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.phone.includes(search)
  )

  return (
    <div style={{ padding: '24px', maxWidth: 900, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Radio size={22} color="#a78bfa" />
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#f1f5f9' }}>Broadcast</h1>
        </div>
        <button
          onClick={() => setShowForm(v => !v)}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: showForm ? '#1e1b4b' : '#4f46e5', color: '#fff',
            border: 'none', borderRadius: 10, padding: '8px 16px', fontSize: 13,
            fontWeight: 600, cursor: 'pointer',
          }}
        >
          <Send size={14} />
          {showForm ? 'Cancelar' : 'Nuevo Broadcast'}
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <form onSubmit={handleSend} style={{
          background: '#0f0f1a', border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: 14, padding: 24, marginBottom: 28,
        }}>
          <h3 style={{ margin: '0 0 20px', fontSize: 15, fontWeight: 700, color: '#e2e8f0' }}>Nuevo Broadcast</h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            {/* Client list */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  <Users size={11} style={{ display: 'inline', marginRight: 5 }} />
                  Destinatarios ({selectedIds.size}/{clients.length})
                </label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button type="button" onClick={selectAll} style={{ fontSize: 11, color: '#818cf8', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Todos</button>
                  <button type="button" onClick={clearAll} style={{ fontSize: 11, color: '#64748b', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Limpiar</button>
                </div>
              </div>
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Buscar cliente..."
                style={{
                  width: '100%', marginBottom: 8, boxSizing: 'border-box',
                  background: '#1e293b', border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 8, padding: '6px 10px', fontSize: 12, color: '#e2e8f0',
                  outline: 'none',
                }}
              />
              <div style={{
                height: 220, overflowY: 'auto', background: '#070712',
                borderRadius: 10, border: '1px solid rgba(255,255,255,0.06)',
              }}>
                {filteredClients.length === 0
                  ? <p style={{ padding: 16, color: '#475569', fontSize: 12, textAlign: 'center' }}>Sin clientes</p>
                  : filteredClients.map(c => (
                    <label key={c.id} style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '8px 12px', cursor: 'pointer',
                      background: selectedIds.has(c.id) ? 'rgba(79,70,229,0.12)' : 'transparent',
                      borderBottom: '1px solid rgba(255,255,255,0.04)',
                    }}>
                      <input
                        type="checkbox"
                        checked={selectedIds.has(c.id)}
                        onChange={() => toggleClient(c.id)}
                        style={{ accentColor: '#818cf8' }}
                      />
                      <span style={{ flex: 1, minWidth: 0 }}>
                        <span style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#e2e8f0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.name}</span>
                        <span style={{ fontSize: 10, color: '#475569' }}>{c.phone}</span>
                      </span>
                    </label>
                  ))
                }
              </div>
            </div>

            {/* Message */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>
                  Título (opcional)
                </label>
                <input
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="Ej: Oferta especial"
                  style={{
                    width: '100%', boxSizing: 'border-box',
                    background: '#1e293b', border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 8, padding: '8px 10px', fontSize: 13, color: '#e2e8f0', outline: 'none',
                  }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>
                  Mensaje *
                </label>
                <textarea
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  placeholder="Escribe tu mensaje aquí..."
                  required
                  rows={5}
                  style={{
                    width: '100%', boxSizing: 'border-box', resize: 'vertical',
                    background: '#1e293b', border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 8, padding: '8px 10px', fontSize: 13, color: '#e2e8f0',
                    outline: 'none', fontFamily: 'inherit',
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>
                  <Image size={11} />
                  URL de imagen (opcional)
                </label>
                <input
                  value={mediaUrl}
                  onChange={e => setMediaUrl(e.target.value)}
                  placeholder="https://..."
                  style={{
                    width: '100%', boxSizing: 'border-box',
                    background: '#1e293b', border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 8, padding: '8px 10px', fontSize: 13, color: '#e2e8f0', outline: 'none',
                  }}
                />
              </div>
            </div>
          </div>

          {/* Schedule */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 16, padding: '12px 16px',
            background: 'rgba(255,255,255,0.03)', borderRadius: 10, marginBottom: 16,
          }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 13, color: scheduleMode === 'now' ? '#a78bfa' : '#64748b', fontWeight: 600 }}>
              <input type="radio" name="schedule" value="now" checked={scheduleMode === 'now'} onChange={() => setScheduleMode('now')} style={{ accentColor: '#818cf8' }} />
              <Send size={13} /> Enviar ahora
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 13, color: scheduleMode === 'schedule' ? '#a78bfa' : '#64748b', fontWeight: 600 }}>
              <input type="radio" name="schedule" value="schedule" checked={scheduleMode === 'schedule'} onChange={() => setScheduleMode('schedule')} style={{ accentColor: '#818cf8' }} />
              <Clock size={13} /> Programar
            </label>
            {scheduleMode === 'schedule' && (
              <input
                type="datetime-local"
                value={scheduledAt}
                onChange={e => setScheduledAt(e.target.value)}
                required
                style={{
                  background: '#1e293b', border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 8, padding: '6px 10px', fontSize: 12, color: '#e2e8f0',
                  outline: 'none', flex: 1,
                }}
              />
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
            <button type="button" onClick={() => setShowForm(false)}
              style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '8px 16px', color: '#64748b', fontSize: 13, cursor: 'pointer', fontWeight: 600 }}>
              Cancelar
            </button>
            <button type="submit" disabled={sending || !message.trim() || selectedIds.size === 0}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                background: '#4f46e5', border: 'none', borderRadius: 8,
                padding: '8px 20px', color: '#fff', fontSize: 13,
                fontWeight: 600, cursor: 'pointer', opacity: (sending || !message.trim() || selectedIds.size === 0) ? 0.5 : 1,
              }}>
              <Send size={13} />
              {sending ? 'Enviando...' : scheduleMode === 'schedule' ? `Programar (${selectedIds.size})` : `Enviar a ${selectedIds.size} cliente${selectedIds.size !== 1 ? 's' : ''}`}
            </button>
          </div>
        </form>
      )}

      {/* Broadcast list */}
      {loading ? (
        <p style={{ color: '#475569', textAlign: 'center', padding: 40 }}>Cargando...</p>
      ) : broadcasts.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#475569' }}>
          <Radio size={40} style={{ marginBottom: 12, opacity: 0.3 }} />
          <p style={{ margin: 0, fontSize: 14 }}>No hay broadcasts aún</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {broadcasts.map(b => {
            const isExpanded = expandedId === b.id
            const recs = recipients[b.id]
            const cfg = STATUS_CONFIG[b.status] || STATUS_CONFIG.pending
            return (
              <div key={b.id} style={{
                background: '#0f0f1a', border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: 12, overflow: 'hidden',
              }}>
                {/* Row */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span style={{ fontSize: 14, fontWeight: 700, color: '#e2e8f0' }}>
                        {b.title || `Broadcast #${b.id}`}
                      </span>
                      <StatusBadge status={b.status} />
                    </div>
                    <p style={{ margin: 0, fontSize: 12, color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 400 }}>
                      {b.message}
                    </p>
                    <div style={{ display: 'flex', gap: 16, marginTop: 6 }}>
                      <span style={{ fontSize: 11, color: '#475569', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Users size={10} /> {b.recipient_count} destinatarios
                      </span>
                      {b.sent_count > 0 && (
                        <span style={{ fontSize: 11, color: '#34d399', display: 'flex', alignItems: 'center', gap: 4 }}>
                          <CheckCircle size={10} /> {b.sent_count} enviados
                        </span>
                      )}
                      {b.failed_count > 0 && (
                        <span style={{ fontSize: 11, color: '#f87171', display: 'flex', alignItems: 'center', gap: 4 }}>
                          <XCircle size={10} /> {b.failed_count} fallidos
                        </span>
                      )}
                      {b.scheduled_at && b.status === 'pending' && (
                        <span style={{ fontSize: 11, color: '#f59e0b', display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Clock size={10} /> {formatDate(b.scheduled_at)}
                        </span>
                      )}
                      {b.sent_at && (
                        <span style={{ fontSize: 11, color: '#475569' }}>
                          {formatDate(b.sent_at)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {b.status === 'pending' && (
                      <>
                        {b.scheduled_at && (
                          <button onClick={() => handleSendNow(b.id)}
                            style={{ fontSize: 11, fontWeight: 600, background: 'rgba(79,70,229,0.2)', color: '#818cf8', border: '1px solid rgba(79,70,229,0.3)', borderRadius: 7, padding: '4px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Send size={11} /> Enviar ahora
                          </button>
                        )}
                        <button onClick={() => handleCancel(b.id)}
                          style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b', padding: 4 }}>
                          <Trash2 size={15} />
                        </button>
                      </>
                    )}
                    <button
                      onClick={async () => {
                        if (!isExpanded) await loadRecipients(b.id)
                        setExpandedId(isExpanded ? null : b.id)
                      }}
                      style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#475569', padding: 4 }}>
                      {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                  </div>
                </div>

                {/* Expanded recipients */}
                {isExpanded && (
                  <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '12px 18px', background: '#070712' }}>
                    {!recs
                      ? <p style={{ color: '#475569', fontSize: 12 }}>Cargando...</p>
                      : recs.length === 0
                      ? <p style={{ color: '#475569', fontSize: 12 }}>Sin destinatarios</p>
                      : (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                          {recs.map(r => (
                            <span key={r.id} style={{
                              display: 'inline-flex', alignItems: 'center', gap: 5,
                              background: r.status === 'sent' ? 'rgba(52,211,153,0.08)' : r.status === 'failed' ? 'rgba(248,113,113,0.08)' : 'rgba(148,163,184,0.07)',
                              borderRadius: 8, padding: '3px 10px', fontSize: 11, color: r.status === 'sent' ? '#34d399' : r.status === 'failed' ? '#f87171' : '#94a3b8',
                            }}>
                              {r.status === 'sent' ? <CheckCircle size={10} /> : r.status === 'failed' ? <XCircle size={10} /> : <Clock size={10} />}
                              {r.name || r.phone}
                            </span>
                          ))}
                        </div>
                      )
                    }
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
