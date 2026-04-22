import { Pencil } from 'lucide-react'
import { useState } from 'react'
import { useApi } from '../hooks/useApi'
import { api } from '../utils/api'
import { formatDate, STATUS_MAP } from '../utils/format'

const STATUSES = ['open', 'in_progress', 'pending_docs', 'hearing_scheduled', 'resolved', 'closed']

export default function Cases() {
  const { data, loading, reload } = useApi('/cases')
  const { data: clientsData } = useApi('/clients')
  const [filterStatus, setFilterStatus] = useState('')
  const [search, setSearch] = useState('')
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({})
  const [saving, setSaving] = useState(false)

  const cases = (data?.cases || []).filter(c => {
    if (filterStatus && c.status !== filterStatus) return false
    if (search && !c.case_number.toLowerCase().includes(search.toLowerCase()) && !c.title.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  function openNew() {
    setForm({ case_number: '', title: '', description: '', case_type: '', client_id: '', court: '', status: 'open' })
    setEditing('new')
  }

  function openEdit(c) {
    setForm({ ...c })
    setEditing(c.id)
  }

  async function handleSave(e) {
    e.preventDefault()
    setSaving(true)
    try {
      if (editing === 'new') {
        await api.post('/cases', form)
      } else {
        await api.put(`/cases/${editing}`, form)
      }
      setEditing(null)
      reload()
    } catch (err) {
      alert(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <div className="flex-between mb-md">
        <h2>Expedientes</h2>
        <button className="btn btn-primary" onClick={openNew}>+ Nuevo Expediente</button>
      </div>

      <div className="card">
        <div className="flex gap-md mb-md" style={{ flexWrap: 'wrap' }}>
          <input className="input" style={{ maxWidth: 300 }} placeholder="Buscar por número o título..." value={search} onChange={e => setSearch(e.target.value)} />
          <select className="input" style={{ maxWidth: 200 }} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option value="">Todos los estados</option>
            {STATUSES.map(s => <option key={s} value={s}>{STATUS_MAP[s]?.label || s}</option>)}
          </select>
        </div>

        {loading ? <p className="text-muted">Cargando...</p> : cases.length === 0 ? <p className="empty">No se encontraron expedientes</p> : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Expediente</th><th>Título</th><th>Tipo</th><th>Estado</th><th className="hide-mobile">Tribunal</th><th className="hide-mobile">Creado</th><th>Acciones</th></tr></thead>
              <tbody>
                {cases.map(c => (
                  <tr key={c.id}>
                    <td><strong>{c.case_number}</strong></td>
                    <td>{c.title}</td>
                    <td className="text-sm">{c.case_type || '—'}</td>
                    <td><span className={`badge ${STATUS_MAP[c.status]?.cls || 'badge-muted'}`}>{STATUS_MAP[c.status]?.label || c.status}</span></td>
                    <td className="text-sm hide-mobile">{c.court || '—'}</td>
                    <td className="text-sm text-muted hide-mobile">{formatDate(c.created_at)}</td>
                    <td><button className="btn btn-secondary btn-sm" onClick={() => openEdit(c)}>Editar</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {editing !== null && (
        <div className="modal-overlay" onClick={() => setEditing(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>{editing === 'new' ? 'Nuevo Expediente' : 'Editar Expediente'}</h3>
            <form onSubmit={handleSave}>
              {editing === 'new' && <div className="mb-sm"><label className="label">No. Expediente *</label><input className="input" required value={form.case_number || ''} onChange={e => setForm({ ...form, case_number: e.target.value })} /></div>}
              <div className="mb-sm"><label className="label">Título *</label><input className="input" required value={form.title || ''} onChange={e => setForm({ ...form, title: e.target.value })} /></div>
              {editing === 'new' && (
                <div className="mb-sm"><label className="label">Cliente *</label>
                  <select className="input" required value={form.client_id || ''} onChange={e => setForm({ ...form, client_id: e.target.value })}>
                    <option value="">Seleccionar...</option>
                    {(clientsData?.clients || []).map(cl => <option key={cl.id} value={cl.id}>{cl.name} ({cl.phone})</option>)}
                  </select>
                </div>
              )}
              <div className="mb-sm"><label className="label">Tipo</label><input className="input" value={form.case_type || ''} onChange={e => setForm({ ...form, case_type: e.target.value })} /></div>
              <div className="mb-sm"><label className="label">Estado</label>
                <select className="input" value={form.status || 'open'} onChange={e => setForm({ ...form, status: e.target.value })}>
                  {STATUSES.map(s => <option key={s} value={s}>{STATUS_MAP[s]?.label || s}</option>)}
                </select>
              </div>
              <div className="mb-sm"><label className="label">Tribunal</label><input className="input" value={form.court || ''} onChange={e => setForm({ ...form, court: e.target.value })} /></div>
              <div className="mb-sm"><label className="label">Próxima Audiencia</label><input className="input" type="datetime-local" value={form.next_hearing ? form.next_hearing.substring(0, 16) : ''} onChange={e => setForm({ ...form, next_hearing: e.target.value })} /></div>
              <div className="mb-md"><label className="label">Descripción</label><textarea className="input" rows="3" value={form.description || ''} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
              <div className="flex gap-sm" style={{ justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setEditing(null)}>Cancelar</button>
                <button className="btn btn-primary" disabled={saving}>{saving ? 'Guardando...' : 'Guardar'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
