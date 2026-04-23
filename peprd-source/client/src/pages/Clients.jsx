import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useApi } from '../hooks/useApi'
import { useAuth } from '../contexts/AuthContext'
import { api } from '../utils/api'
import { formatDate } from '../utils/format'
import { MessageSquare, Pencil, UserPlus, Trash2, UserCheck, User } from 'lucide-react'

export default function Clients() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'

  const { data, loading, reload } = useApi('/clients')
  const [search, setSearch] = useState('')
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({})
  const [saving, setSaving] = useState(false)

  // Assignment state (admin only)
  const [digitadores, setDigitadores] = useState([])
  const [assigning, setAssigning] = useState(null) // clientId being assigned
  const [assignUserId, setAssignUserId] = useState('')
  const [assignSaving, setAssignSaving] = useState(false)

  // Load digitadores list for admin
  useEffect(() => {
    if (!isAdmin) return
    api.get('/admin/digitadores')
      .then(d => setDigitadores(d.digitadores || []))
      .catch(() => {})
  }, [isAdmin])

  const clients = (data?.clients || []).filter(c =>
    !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.phone.includes(search)
  )

  function openEdit(client) {
    setForm(client ? { ...client } : { name: '', phone: '', email: '', address: '', notes: '' })
    setEditing(client ? client.id : 'new')
  }

  async function handleSave(e) {
    e.preventDefault()
    setSaving(true)
    try {
      if (editing === 'new') {
        await api.post('/clients', form)
      } else {
        await api.put(`/clients/${editing}`, form)
      }
      setEditing(null)
      reload()
    } catch (err) {
      alert(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id) {
    if (!confirm('¿Eliminar este cliente?')) return
    await api.del(`/clients/${id}`)
    reload()
  }

  function openAssign(client) {
    setAssigning(client.id)
    setAssignUserId(client.assigned_to ? String(client.assigned_to) : '')
  }

  async function handleAssign(e) {
    e.preventDefault()
    setAssignSaving(true)
    try {
      await api.post('/admin/assign-client', {
        clientId: assigning,
        userId: assignUserId ? parseInt(assignUserId) : null,
      })
      setAssigning(null)
      reload()
    } catch (err) {
      alert(err.message || 'Error al asignar')
    } finally {
      setAssignSaving(false)
    }
  }

  return (
    <div>
      <div className="flex-between mb-md">
        <h2>Clientes</h2>
        <button className="btn btn-primary" onClick={() => openEdit(null)}>+ Nuevo Cliente</button>
      </div>

      <div className="card">
        <input
          className="input mb-md"
          placeholder="Buscar por nombre o teléfono..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />

        {loading ? (
          <p className="text-muted">Cargando...</p>
        ) : clients.length === 0 ? (
          <p className="empty">
            {isAdmin ? 'No se encontraron clientes' : 'No tienes clientes asignados aún'}
          </p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Teléfono</th>
                  <th>Correo</th>
                  {isAdmin && <th>Asignado a</th>}
                  <th className="hide-mobile">Registrado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {clients.map(c => (
                  <tr key={c.id}>
                    <td><Link to={`/clients/${c.id}`} style={{ fontWeight: 600 }}>{c.name}</Link></td>
                    <td>{c.phone}</td>
                    <td className="text-sm">{c.email || '—'}</td>
                    {isAdmin && (
                      <td className="text-sm">
                        {c.assigned_to_name ? (
                          <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: '4px',
                            background: 'rgba(16,185,129,0.12)', color: '#34d399',
                            borderRadius: '9999px', padding: '2px 8px', fontSize: '11px', fontWeight: 600,
                          }}>
                            <span style={{
                              width: 6, height: 6, borderRadius: '50%',
                              background: '#34d399', display: 'inline-block',
                            }} />
                            {c.assigned_to_name}
                          </span>
                        ) : (
                          <span style={{
                            display: 'inline-block',
                            background: 'rgba(100,116,139,0.15)', color: '#64748b',
                            borderRadius: '9999px', padding: '2px 8px', fontSize: '11px', fontWeight: 600,
                          }}>
                            Sin asignar
                          </span>
                        )}
                      </td>
                    )}
                    <td className="text-sm text-muted hide-mobile">{formatDate(c.created_at)}</td>
                    <td>
                      <div className="flex gap-sm">
                        <Link to={`/clients/${c.id}`} className="btn btn-secondary btn-sm" title="Ver detalle"><User size={13} /></Link>
                        <Link to={`/messages/${c.id}`} className="btn btn-secondary btn-sm" title="Ver chat"><MessageSquare size={13} /></Link>
                        <button className="btn btn-secondary btn-sm" onClick={() => openEdit(c)} title="Editar"><Pencil size={13} /></button>
                        {isAdmin && (
                          <button
                            className="btn btn-secondary btn-sm"
                            title="Asignar a digitador"
                            onClick={() => openAssign(c)}
                          >
                            <UserCheck size={13} />
                          </button>
                        )}
                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(c.id)} title="Eliminar"><Trash2 size={13} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit / Create modal */}
      {editing !== null && (
        <div className="modal-overlay" onClick={() => setEditing(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>{editing === 'new' ? 'Nuevo Cliente' : 'Editar Cliente'}</h3>
            <form onSubmit={handleSave}>
              <div className="mb-sm"><label className="label">Nombre *</label><input className="input" required value={form.name || ''} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
              <div className="mb-sm"><label className="label">Teléfono *</label><input className="input" required value={form.phone || ''} onChange={e => setForm({ ...form, phone: e.target.value })} /></div>
              <div className="mb-sm"><label className="label">Correo</label><input className="input" type="email" value={form.email || ''} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
              <div className="mb-sm"><label className="label">Domicilio</label><input className="input" value={form.address || ''} onChange={e => setForm({ ...form, address: e.target.value })} /></div>
              <div className="mb-md"><label className="label">Notas</label><textarea className="input" rows="3" value={form.notes || ''} onChange={e => setForm({ ...form, notes: e.target.value })} /></div>
              <div className="flex gap-sm" style={{ justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setEditing(null)}>Cancelar</button>
                <button className="btn btn-primary" disabled={saving}>{saving ? 'Guardando...' : 'Guardar'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign modal (admin only) */}
      {assigning !== null && (
        <div className="modal-overlay" onClick={() => setAssigning(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>Asignar Cliente</h3>
            <p className="text-muted text-sm mb-md">
              Asigna este cliente a un digitador. Solo ese digitador podrá verlo.
            </p>
            <form onSubmit={handleAssign}>
              <div className="mb-md">
                <label className="label">Digitador</label>
                <select
                  className="input"
                  value={assignUserId}
                  onChange={e => setAssignUserId(e.target.value)}
                >
                  <option value="">— Sin asignar —</option>
                  {digitadores.map(d => (
                    <option key={d.id} value={d.id}>{d.name} ({d.email})</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-sm" style={{ justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setAssigning(null)}>Cancelar</button>
                <button className="btn btn-primary" disabled={assignSaving}>
                  {assignSaving ? 'Guardando...' : 'Asignar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
