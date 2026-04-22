import { useState } from 'react'
import { useApi } from '../hooks/useApi'
import { useAuth } from '../contexts/AuthContext'
import { api } from '../utils/api'
import { formatDate } from '../utils/format'
import { Receipt, Plus, Check, Send, Trash2, FileText, ChevronDown, ChevronUp } from 'lucide-react'

const STATUS_CONFIG = {
  draft:    { label: 'Borrador',          color: '#94a3b8', bg: 'rgba(148,163,184,0.1)',  emoji: '' },
  approved: { label: 'Aprobada',          color: '#34d399', bg: 'rgba(52,211,153,0.1)',   emoji: '' },
  sent:     { label: 'Enviada',           color: '#60a5fa', bg: 'rgba(96,165,250,0.1)',   emoji: '' },
}

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.draft
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      background: cfg.bg, color: cfg.color,
      borderRadius: 9999, padding: '3px 10px',
      fontSize: 11, fontWeight: 700,
    }}>
      {cfg.emoji} {cfg.label}
    </span>
  )
}

const EMPTY_ITEM = { desc: '', cantidad: 1, precio: 0, itbis: false }

function ItemsEditor({ items, onChange }) {
  function update(idx, field, val) {
    const next = items.map((it, i) => i === idx ? { ...it, [field]: val } : it)
    onChange(next)
  }
  function add() { onChange([...items, { ...EMPTY_ITEM }]) }
  function remove(idx) { onChange(items.filter((_, i) => i !== idx)) }

  const fmt = n => `RD$ ${Number(n || 0).toLocaleString('es-DO', { minimumFractionDigits: 2 })}`
  const subtotal = items.reduce((s, i) => s + Number(i.cantidad || 0) * Number(i.precio || 0), 0)
  const itbis    = items.reduce((s, i) => s + (i.itbis ? Number(i.cantidad || 0) * Number(i.precio || 0) * 0.18 : 0), 0)

  return (
    <div>
      {items.map((item, idx) => (
        <div key={idx} style={{
          display: 'grid', gridTemplateColumns: '1fr 60px 100px 32px',
          gap: 6, marginBottom: 6, alignItems: 'center',
        }}>
          <input
            className="input"
            placeholder="Descripción"
            value={item.desc}
            onChange={e => update(idx, 'desc', e.target.value)}
            required
          />
          <input
            className="input"
            type="number" min="1" placeholder="Cant."
            value={item.cantidad}
            onChange={e => update(idx, 'cantidad', e.target.value)}
          />
          <input
            className="input"
            type="number" min="0" step="0.01" placeholder="Precio"
            value={item.precio}
            onChange={e => update(idx, 'precio', e.target.value)}
          />
          <button type="button" className="btn btn-danger btn-sm" onClick={() => remove(idx)} style={{ padding: '0 8px' }}>×</button>
          <div style={{ gridColumn: '1/-1', display: 'flex', alignItems: 'center', gap: 6, marginTop: -2 }}>
            <label style={{ fontSize: 11, color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}>
              <input type="checkbox" checked={item.itbis} onChange={e => update(idx, 'itbis', e.target.checked)} />
              ITBIS 18%
            </label>
            <span style={{ marginLeft: 'auto', fontSize: 11, color: '#64748b' }}>
              = {fmt(Number(item.cantidad || 0) * Number(item.precio || 0))}
              {item.itbis ? ` + ITBIS ${fmt(Number(item.cantidad || 0) * Number(item.precio || 0) * 0.18)}` : ''}
            </span>
          </div>
        </div>
      ))}
      <button type="button" className="btn btn-secondary btn-sm" onClick={add} style={{ marginTop: 4 }}>
        + Agregar línea
      </button>
      <div style={{ marginTop: 12, textAlign: 'right', fontSize: 13, color: '#94a3b8' }}>
        Subtotal: <strong>{fmt(subtotal)}</strong>
        {itbis > 0 && <> &nbsp;| ITBIS: <strong>{fmt(itbis)}</strong></>}
        &nbsp;| <span style={{ color: '#e2e8f0', fontWeight: 700 }}>Total: {fmt(subtotal + itbis)}</span>
      </div>
    </div>
  )
}

export default function Invoices() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'

  const { data, loading, reload } = useApi('/invoices')
  const [search, setSearch] = useState('')
  const [creating, setCreating] = useState(false)
  const [expandedId, setExpandedId] = useState(null)
  const [actionLoading, setActionLoading] = useState(null) // invoiceId being acted on

  // New invoice form
  const [form, setForm] = useState({
    type: 'COTIZACIÓN',
    clientName: '',
    clientPhone: '',
    items: [{ ...EMPTY_ITEM }],
    notes: '',
  })
  const [formSaving, setFormSaving] = useState(false)
  const [formError, setFormError] = useState('')

  const invoices = (data?.invoices || []).filter(inv => {
    if (!search) return true
    const q = search.toLowerCase()
    return inv.client_name.toLowerCase().includes(q) || inv.doc_number.toLowerCase().includes(q)
  })

  function resetForm() {
    setForm({ type: 'COTIZACIÓN', clientName: '', clientPhone: '', items: [{ ...EMPTY_ITEM }], notes: '' })
    setFormError('')
  }

  async function handleCreate(e) {
    e.preventDefault()
    if (form.items.some(i => !i.desc.trim())) {
      setFormError('Cada línea debe tener una descripción.')
      return
    }
    setFormSaving(true)
    setFormError('')
    try {
      await api.post('/invoices', form)
      setCreating(false)
      resetForm()
      reload()
    } catch (err) {
      setFormError(err.error || err.message || 'Error al crear factura')
    } finally {
      setFormSaving(false)
    }
  }

  async function handleApprove(inv) {
    if (!confirm(`¿Aprobar ${inv.doc_number}?`)) return
    setActionLoading(inv.id)
    try {
      await api.post(`/invoices/${inv.id}/approve`)
      reload()
    } catch (err) {
      alert(err.error || err.message)
    } finally {
      setActionLoading(null)
    }
  }

  async function handleSend(inv) {
    if (!confirm(`¿Marcar ${inv.doc_number} como enviada y generar PDF?`)) return
    setActionLoading(inv.id)
    try {
      const res = await api.post(`/invoices/${inv.id}/send`)
      alert(res.message || 'Factura enviada')
      reload()
    } catch (err) {
      alert(err.error || err.message)
    } finally {
      setActionLoading(null)
    }
  }

  async function handleDelete(inv) {
    if (!confirm(`¿Eliminar ${inv.doc_number}?`)) return
    try {
      await api.del(`/invoices/${inv.id}`)
      reload()
    } catch (err) {
      alert(err.error || err.message)
    }
  }

  // Can digitador send this invoice?
  function canSend(inv) {
    if (isAdmin) return inv.status !== 'sent'
    return inv.status === 'approved'
  }

  return (
    <div>
      {/* Header */}
      <div className="flex-between mb-md">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Receipt size={22} style={{ color: '#a78bfa' }} />
          <h2 style={{ margin: 0 }}>Facturas & Cotizaciones</h2>
        </div>
        <button className="btn btn-primary" onClick={() => { setCreating(true); resetForm() }}>
          <Plus size={14} style={{ display: 'inline', marginRight: 4 }} />
          Nueva
        </button>
      </div>

      {/* Info banner for digitadores */}
      {!isAdmin && (
        <div style={{
          background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)',
          borderRadius: 10, padding: '10px 14px', marginBottom: 16, fontSize: 12, color: '#a5b4fc',
        }}>
          Puedes crear cotizaciones y facturas. Un administrador debe <strong>aprobarlas</strong> antes de que puedas enviarlas.
        </div>
      )}

      <div className="card">
        <input
          className="input mb-md"
          placeholder="Buscar por cliente o número..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />

        {loading ? (
          <p className="text-muted">Cargando...</p>
        ) : invoices.length === 0 ? (
          <p className="empty">No hay facturas aún</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Número</th>
                  <th>Cliente</th>
                  <th>Total</th>
                  <th>Estado</th>
                  {isAdmin && <th>Creado por</th>}
                  <th className="hide-mobile">Fecha</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map(inv => {
                  const isExpanded = expandedId === inv.id
                  const busy = actionLoading === inv.id
                  return [
                    <tr key={inv.id}>
                      <td>
                        <button
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#a78bfa', fontWeight: 700, fontSize: 13, padding: 0, display: 'flex', alignItems: 'center', gap: 4 }}
                          onClick={() => setExpandedId(isExpanded ? null : inv.id)}
                        >
                          {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                          {inv.doc_number}
                        </button>
                        <div style={{ fontSize: 10, color: '#64748b', marginTop: 2 }}>{inv.type}</div>
                      </td>
                      <td>
                        <strong>{inv.client_name}</strong>
                        {inv.client_phone && <div style={{ fontSize: 11, color: '#64748b' }}>{inv.client_phone}</div>}
                      </td>
                      <td style={{ fontWeight: 700, color: '#e2e8f0' }}>
                        RD$ {Number(inv.total).toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                      </td>
                      <td><StatusBadge status={inv.status} /></td>
                      {isAdmin && (
                        <td style={{ fontSize: 12, color: '#94a3b8' }}>
                          {inv.created_by_name || '—'}
                          {inv.approved_by_name && (
                            <div style={{ fontSize: 10, color: '#34d399' }}>✓ {inv.approved_by_name}</div>
                          )}
                        </td>
                      )}
                      <td className="text-sm text-muted hide-mobile">{formatDate(inv.created_at)}</td>
                      <td>
                        <div className="flex gap-sm" style={{ flexWrap: 'wrap' }}>
                          {/* Admin: approve draft */}
                          {isAdmin && inv.status === 'draft' && (
                            <button
                              className="btn btn-secondary btn-sm"
                              disabled={busy}
                              title="Aprobar"
                              onClick={() => handleApprove(inv)}
                              style={{ color: '#34d399', borderColor: 'rgba(52,211,153,0.3)' }}
                            >
                              <Check size={13} />
                            </button>
                          )}

                          {/* Send: admin always on non-sent; digitador only on approved */}
                          {canSend(inv) && (
                            <button
                              className="btn btn-secondary btn-sm"
                              disabled={busy}
                              title={isAdmin ? 'Enviar (generar PDF)' : 'Enviar'}
                              onClick={() => handleSend(inv)}
                              style={{ color: '#60a5fa', borderColor: 'rgba(96,165,250,0.3)' }}
                            >
                              {busy ? '…' : <Send size={13} />}
                            </button>
                          )}

                          {/* Digitador waiting for approval */}
                          {!isAdmin && inv.status === 'draft' && (
                            <span style={{
                              fontSize: 10, fontWeight: 600, color: '#fbbf24',
                              background: 'rgba(251,191,36,0.1)', borderRadius: 9999,
                              padding: '2px 8px', whiteSpace: 'nowrap',
                            }}>
                              Esperando aprobación
                            </span>
                          )}

                          {/* PDF link if sent */}
                          {inv.status === 'sent' && inv.pdf_path && (
                            <a
                              href={`/api/invoices/${inv.id}/pdf`}
                              target="_blank"
                              rel="noreferrer"
                              className="btn btn-secondary btn-sm"
                              title="Ver PDF"
                              style={{ color: '#a78bfa', textDecoration: 'none' }}
                            >
                              <FileText size={13} />
                            </a>
                          )}

                          {/* Delete: draft only */}
                          {inv.status === 'draft' && (
                            <button
                              className="btn btn-danger btn-sm"
                              title="Eliminar"
                              onClick={() => handleDelete(inv)}
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>,

                    /* Expanded items row */
                    isExpanded && (
                      <tr key={`${inv.id}-detail`}>
                        <td colSpan={isAdmin ? 7 : 6} style={{
                          background: 'rgba(255,255,255,0.02)',
                          padding: '12px 16px',
                          borderTop: '1px solid rgba(255,255,255,0.04)',
                        }}>
                          <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
                            <thead>
                              <tr style={{ color: '#64748b', textAlign: 'left' }}>
                                <th style={{ padding: '4px 8px', fontWeight: 600 }}>Descripción</th>
                                <th style={{ padding: '4px 8px', width: 50, textAlign: 'center' }}>Cant.</th>
                                <th style={{ padding: '4px 8px', width: 110, textAlign: 'right' }}>Precio</th>
                                <th style={{ padding: '4px 8px', width: 110, textAlign: 'right' }}>Total</th>
                              </tr>
                            </thead>
                            <tbody>
                              {(typeof inv.items === 'string' ? JSON.parse(inv.items) : inv.items).map((it, i) => (
                                <tr key={i} style={{ borderTop: '1px solid rgba(255,255,255,0.03)' }}>
                                  <td style={{ padding: '5px 8px', color: '#cbd5e1' }}>{it.desc}</td>
                                  <td style={{ padding: '5px 8px', textAlign: 'center', color: '#94a3b8' }}>{it.cantidad}</td>
                                  <td style={{ padding: '5px 8px', textAlign: 'right', color: '#94a3b8' }}>
                                    RD$ {Number(it.precio).toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                                  </td>
                                  <td style={{ padding: '5px 8px', textAlign: 'right', color: '#e2e8f0', fontWeight: 600 }}>
                                    RD$ {(it.cantidad * it.precio).toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                                    {it.itbis && <span style={{ color: '#64748b', fontSize: 10 }}> +ITBIS</span>}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                          {inv.notes && (
                            <p style={{ marginTop: 8, fontSize: 11, color: '#94a3b8' }}>
                              {inv.notes}
                            </p>
                          )}
                          {inv.approved_by_name && (
                            <p style={{ marginTop: 4, fontSize: 11, color: '#34d399' }}>
                              Aprobada por {inv.approved_by_name}
                              {inv.approved_at ? ` el ${formatDate(inv.approved_at)}` : ''}
                            </p>
                          )}
                        </td>
                      </tr>
                    ),
                  ]
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create modal */}
      {creating && (
        <div className="modal-overlay" onClick={() => setCreating(false)}>
          <div className="modal" style={{ maxWidth: 640, width: '95vw' }} onClick={e => e.stopPropagation()}>
            <h3>Nueva Factura / Cotización</h3>
            <form onSubmit={handleCreate}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                <div>
                  <label className="label">Tipo</label>
                  <select className="input" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                    <option value="COTIZACIÓN">Cotización</option>
                    <option value="FACTURA">Factura</option>
                  </select>
                </div>
                <div>
                  <label className="label">Nombre del cliente *</label>
                  <input className="input" required value={form.clientName} onChange={e => setForm({ ...form, clientName: e.target.value })} />
                </div>
                <div style={{ gridColumn: '1/-1' }}>
                  <label className="label">Teléfono del cliente</label>
                  <input className="input" value={form.clientPhone} onChange={e => setForm({ ...form, clientPhone: e.target.value })} placeholder="+1 809..." />
                </div>
              </div>

              <div className="mb-sm">
                <label className="label">Servicios / Ítems *</label>
                <ItemsEditor items={form.items} onChange={items => setForm({ ...form, items })} />
              </div>

              <div className="mb-md">
                <label className="label">Notas (opcional)</label>
                <textarea className="input" rows="2" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Condiciones, validez, etc." />
              </div>

              {formError && <p style={{ color: '#f87171', fontSize: 12, marginBottom: 10 }}>{formError}</p>}

              <div className="flex gap-sm" style={{ justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setCreating(false)}>Cancelar</button>
                <button className="btn btn-primary" disabled={formSaving}>
                  {formSaving ? 'Guardando...' : 'Crear como borrador'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
